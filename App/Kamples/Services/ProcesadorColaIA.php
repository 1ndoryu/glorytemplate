<?php

/**
 * ProcesadorColaIA — Servicio cron para reprocesar items encolados por rate limit.
 *
 * C356: Cuando Groq devuelve 429, los items (samples, publicaciones, comentarios)
 * se encolan en cola_procesamiento_ia. Este servicio se ejecuta via WP Cron
 * cada 15 minutos y reprocesa items pendientes en orden FIFO.
 *
 * Comportamiento:
 * - Procesa hasta MAX_ITEMS_POR_EJECUCION items por run (free tier Groq)
 * - Respeta proximo_intento (no procesa items antes de tiempo)
 * - Si detecta rate limit durante el procesamiento, se detiene inmediatamente
 * - Marca items como completado/error segun resultado
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\ColaProcesamientoIaRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Config\Schema\_generated\ColaProcesamientoIaEnums;
use App\Config\Schema\_generated\ColaProcesamientoIaCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Api\GroqHttpClient;
use App\Kamples\Api\ServicioIA;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\KamplesLogger;

class ProcesadorColaIA
{
    /*
     * Limite conservador para free tier Groq.
     * Cada sample usa ~2 calls (Whisper + LLM), cada moderacion ~1-3 calls.
     * 5 items ~= 10-15 API calls, suficiente para no exceder limites RPM.
     */
    private const MAX_ITEMS_POR_EJECUCION = 5;

    /* Nombre del hook WP Cron */
    public const CRON_HOOK = 'kamples_cola_ia_cron';

    /* Intervalo: cada 15 minutos */
    public const CRON_INTERVALO = 'kamples_15min';
    public const CRON_INTERVALO_SEGUNDOS = 900;

    /**
     * Registra el hook de WP Cron para procesamiento de la cola IA.
     * Llamar desde KamplesInit::init().
     */
    public static function registrarCron(): void
    {
        /* Registrar intervalo personalizado */
        add_filter('cron_schedules', function (array $schedules): array {
            if (!isset($schedules[self::CRON_INTERVALO])) {
                $schedules[self::CRON_INTERVALO] = [
                    'interval' => self::CRON_INTERVALO_SEGUNDOS,
                    'display'  => 'Kamples: cada 15 minutos (Cola IA)',
                ];
            }
            return $schedules;
        });

        /* Registrar accion del cron */
        add_action(self::CRON_HOOK, [self::class, 'procesar']);

        /* Programar si no existe */
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), self::CRON_INTERVALO, self::CRON_HOOK);
        }
    }

    /**
     * Procesa items pendientes de la cola IA.
     * Ejecutado por WP Cron o manualmente desde admin.
     *
     * @return array{procesados: int, exitosos: int, errores: int, rateLimited: bool}
     */
    public static function procesar(): array
    {
        $resultado = [
            'procesados' => 0,
            'exitosos' => 0,
            'errores' => 0,
            'rateLimited' => false,
        ];

        try {
            $pendientes = ColaProcesamientoIaRepository::obtenerPendientes(self::MAX_ITEMS_POR_EJECUCION);
        } catch (\Throwable $e) {
            KamplesLogger::error('ProcesadorColaIA: Error obteniendo pendientes', ['error' => $e->getMessage()]);
            return $resultado;
        }

        if (empty($pendientes)) {
            return $resultado;
        }

        KamplesLogger::info('ProcesadorColaIA: Iniciando procesamiento', [
            'pendientes' => \count($pendientes),
        ]);

        foreach ($pendientes as $item) {
            /* C356: Si detectamos rate limit en item anterior, parar inmediatamente */
            if (GroqHttpClient::fueRateLimited()) {
                KamplesLogger::warning('ProcesadorColaIA: Rate limit detectado, deteniendo procesamiento');
                $resultado['rateLimited'] = true;
                break;
            }

            $id = (int) $item[ColaProcesamientoIaCols::ID];

            /* Intento de lock optimista: marcar como procesando */
            try {
                $locked = ColaProcesamientoIaRepository::marcarProcesando($id);
                if (!$locked) {
                    /* Otro proceso ya lo tomo */
                    continue;
                }
            } catch (\Throwable $e) {
                KamplesLogger::error('ProcesadorColaIA: Error marcando procesando', [
                    'itemId' => $id,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }

            /* Resetear estado rate limit antes de cada item */
            GroqHttpClient::resetearEstadoRateLimit();

            $resultado['procesados']++;
            $exito = false;

            try {
                $tipo = $item[ColaProcesamientoIaCols::TIPO];
                $operacion = $item[ColaProcesamientoIaCols::OPERACION];
                $entidadId = (int) $item[ColaProcesamientoIaCols::ENTIDAD_ID];
                $metadata = self::decodificarMetadata($item[ColaProcesamientoIaCols::METADATA] ?? null);

                $exito = match (true) {
                    $tipo === ColaProcesamientoIaEnums::TIPO_SAMPLE
                        && $operacion === ColaProcesamientoIaEnums::OPERACION_ANALISIS_AUDIO
                        => self::procesarAnalisisAudio($entidadId, $metadata),

                    $tipo === ColaProcesamientoIaEnums::TIPO_PUBLICACION
                        => self::procesarModeracionPublicacion($entidadId, $metadata),

                    $tipo === ColaProcesamientoIaEnums::TIPO_COMENTARIO
                        => self::procesarModeracionComentario($entidadId, $metadata),

                    default => throw new \RuntimeException("Tipo/operacion no soportado: {$tipo}/{$operacion}"),
                };
            } catch (\Throwable $e) {
                KamplesLogger::error('ProcesadorColaIA: Error procesando item', [
                    'itemId' => $id,
                    'error' => $e->getMessage(),
                ]);
            }

            /* Actualizar estado segun resultado */
            try {
                if ($exito) {
                    ColaProcesamientoIaRepository::marcarCompletado($id);
                    $resultado['exitosos']++;
                } elseif (GroqHttpClient::fueRateLimited()) {
                    /*
                     * Rate limit de nuevo — no contar como error del item.
                     * Revertir a pendiente con proximo_intento futuro.
                     * marcarError(id, mensaje, minutosEspera) — el repo gestiona intentos internamente.
                     */
                    $retrySegundos = \max(GroqHttpClient::obtenerRetryAfterSegundos(), 900.0);
                    ColaProcesamientoIaRepository::marcarError(
                        $id,
                        'Rate limit 429 durante reproceso',
                        (int) \ceil($retrySegundos / 60)
                    );
                    $resultado['rateLimited'] = true;
                } else {
                    ColaProcesamientoIaRepository::marcarError(
                        $id,
                        'Fallo en reproceso (sin rate limit)'
                    );
                    $resultado['errores']++;
                }
            } catch (\Throwable $e) {
                KamplesLogger::error('ProcesadorColaIA: Error actualizando estado', [
                    'itemId' => $id,
                    'error' => $e->getMessage(),
                ]);
                $resultado['errores']++;
            }
        }

        KamplesLogger::info('ProcesadorColaIA: Procesamiento completado', $resultado);
        return $resultado;
    }

    /**
     * Reprocesa analisis de audio IA para un sample.
     * Recupera contexto desde metadata encolada y vuelve a llamar a ServicioIA.
     * Si exitoso, actualiza la metadata del sample en PostgreSQL.
     */
    private static function procesarAnalisisAudio(int $sampleId, array $metadata): bool
    {
        /* Verificar que el sample aun existe */
        $sample = SamplesRepository::buscarPorId($sampleId);
        if (!$sample) {
            KamplesLogger::warning('ProcesadorColaIA: Sample no encontrado, descartando', ['sampleId' => $sampleId]);
            return true;
        }

        $rutaArchivo = $metadata['rutaArchivo'] ?? ($sample[SamplesCols::RUTA_ORIGINAL] ?? '');
        $nombreOriginal = $metadata['nombreOriginal'] ?? ($sample[SamplesCols::TITULO] ?? '');
        $descripcionUsuario = $metadata['descripcionUsuario'] ?? '';
        $contextoTecnico = $metadata['contextoTecnico'] ?? [];

        if (empty($rutaArchivo) || !\file_exists($rutaArchivo)) {
            KamplesLogger::error('ProcesadorColaIA: Archivo no encontrado para sample', [
                'sampleId' => $sampleId,
                'ruta' => $rutaArchivo,
            ]);
            return false;
        }

        $metadataIA = ServicioIA::analizarAudio($rutaArchivo, $nombreOriginal, $descripcionUsuario, $contextoTecnico);
        if ($metadataIA === null) {
            return false;
        }

        /* Construir actualizaciones igual que PipelineAudio */
        $actualizaciones = [];

        $tipoRaw = \strtolower(\str_replace([' ', '-'], '', $metadataIA['tipo'] ?? ''));
        $tiposValidos = ['loop', 'oneshot'];
        $actualizaciones['tipo'] = \in_array($tipoRaw, $tiposValidos, true) ? $tipoRaw : 'oneshot';

        /* Preservar confianza tecnica existente si hay */
        $metadataExistente = \App\Helpers\JsonHelper::decodeOrDefault($sample[SamplesCols::METADATA] ?? '{}', []);
        $bpmConfianza = $metadataExistente['bpm_confianza'] ?? ($contextoTecnico['bpm_confianza'] ?? null);
        $keyConfianza = $metadataExistente['key_confianza'] ?? ($contextoTecnico['key_confianza'] ?? null);

        $actualizaciones[SamplesCols::METADATA] = \json_encode([
            'nombre_archivo_base'   => $metadataIA['nombre_archivo_base'],
            'tags'                  => $metadataIA['tags'],
            'tags_es'               => $metadataIA['tags_es'],
            'genero'                => $metadataIA['genero'],
            'emocion'               => $metadataIA['emocion'],
            'emocion_es'            => $metadataIA['emocion_es'],
            'instrumentos'          => $metadataIA['instrumentos'],
            'artista_vibes'         => $metadataIA['artista_vibes'],
            'descripcion_corta'     => $metadataIA['descripcion_corta'],
            'descripcion_corta_es'  => $metadataIA['descripcion_corta_es'],
            'descripcion'           => $metadataIA['descripcion'],
            'descripcion_es'        => $metadataIA['descripcion_es'],
            'carpeta_primaria'      => $metadataIA['carpeta_primaria'] ?? SamplesRepository::CARPETA_DEFAULT,
            'carpeta_secundaria'    => !empty($metadataIA['carpeta_secundaria']) ? $metadataIA['carpeta_secundaria'] : 'General',
            'ia_carpeta_primaria'   => $metadataIA['carpeta_primaria'] ?? SamplesRepository::CARPETA_DEFAULT,
            'ia_carpeta_secundaria' => !empty($metadataIA['carpeta_secundaria']) ? $metadataIA['carpeta_secundaria'] : 'General',
            'bpm_confianza'         => $bpmConfianza,
            'key_confianza'         => $keyConfianza,
            'reprocesado_at'        => \date('Y-m-d H:i:s'),
        ]);

        /* Actualizar titulo y slug si la IA genero un nombre */
        if (!empty($metadataIA['nombre_archivo_base'])) {
            $tituloIA = \ucwords($metadataIA['nombre_archivo_base']);
            $bpm = $contextoTecnico['bpm'] ?? ($sample[SamplesCols::BPM] ?? null);
            $key = $contextoTecnico['key'] ?? ($sample[SamplesCols::KEY] ?? null);
            $escala = $contextoTecnico['escala'] ?? ($sample[SamplesCols::ESCALA] ?? null);

            if ($bpm) {
                $tituloIA .= ' ' . $bpm . 'bpm';
            }
            if ($key) {
                $keyStr = $key;
                if ($escala === 'menor') {
                    $keyStr .= 'm';
                }
                $tituloIA .= ' ' . $keyStr;
            }

            $idCorto = $sample['id_corto'] ?? \substr(\md5((string) $sampleId), 0, 7);
            $actualizaciones[SamplesCols::TITULO] = $tituloIA;
            $actualizaciones[SamplesCols::SLUG] = \sanitize_title($tituloIA) . '-' . $idCorto;
        }

        /* Aplicar actualizaciones via query directa (reutilizar patron de PipelineAudio) */
        try {
            $columnasJsonb = [SamplesCols::METADATA];
            $setClauses = [];
            $params = ['id' => $sampleId];

            foreach ($actualizaciones as $campo => $valor) {
                if (\in_array($campo, $columnasJsonb, true)) {
                    $setClauses[] = "{$campo} = :{$campo}::jsonb";
                } else {
                    $setClauses[] = "{$campo} = :{$campo}";
                }
                $params[$campo] = $valor;
            }

            $tabla = SamplesCols::TABLA;
            $sql = "UPDATE {$tabla} SET " . \implode(', ', $setClauses) . " WHERE id = :id";
            SamplesRepository::ejecutar($sql, $params);

            KamplesLogger::info('ProcesadorColaIA: Sample actualizado con metadata IA', [
                'sampleId' => $sampleId,
                'tipo' => $actualizaciones['tipo'],
            ]);

            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ProcesadorColaIA: Error actualizando sample', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Reprocesa moderacion de una publicacion.
     * Recupera texto e imagenes desde metadata para volver a moderar.
     */
    private static function procesarModeracionPublicacion(int $publicacionId, array $metadata): bool
    {
        $texto = $metadata['texto'] ?? '';
        $imagenes = $metadata['imagenes'] ?? [];

        /* Llamar al servicio de moderacion completo */
        $veredicto = ServicioModeracionIA::moderarPublicacion($publicacionId, $texto, $imagenes);

        /* Si volvio a ser rate limited, el servicio ya encolara un nuevo item */
        if (($veredicto['razon'] ?? '') === 'rate_limit_ia') {
            return false;
        }

        KamplesLogger::info('ProcesadorColaIA: Publicacion moderada exitosamente', [
            'publicacionId' => $publicacionId,
            'nivel' => $veredicto['nivel'],
        ]);

        return true;
    }

    /**
     * Reprocesa moderacion de un comentario.
     */
    private static function procesarModeracionComentario(int $comentarioId, array $metadata): bool
    {
        $autorId = (int) ($metadata['autorId'] ?? 0);
        $texto = $metadata['texto'] ?? '';
        $mediaUrl = $metadata['mediaUrl'] ?? null;
        $tipoContenido = $metadata['tipoContenido'] ?? 'texto';

        $veredicto = ServicioModeracionIA::moderarComentario($comentarioId, $autorId, $texto, $mediaUrl, $tipoContenido);

        if (($veredicto['razon'] ?? '') === 'rate_limit_ia') {
            return false;
        }

        KamplesLogger::info('ProcesadorColaIA: Comentario moderado exitosamente', [
            'comentarioId' => $comentarioId,
            'nivel' => $veredicto['nivel'],
        ]);

        return true;
    }

    /**
     * Decodifica metadata JSON del item de cola.
     */
    private static function decodificarMetadata(?string $json): array
    {
        if ($json === null || $json === '') {
            return [];
        }

        $data = \json_decode($json, true);
        if (\json_last_error() !== JSON_ERROR_NONE) {
            KamplesLogger::warning('ProcesadorColaIA: metadata JSON invalido', [
                'error' => \json_last_error_msg(),
                'preview' => \mb_substr($json, 0, 200),
            ]);
            return [];
        }

        return \is_array($data) ? $data : [];
    }
}
