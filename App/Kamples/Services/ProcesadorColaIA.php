<?php
/* sentinel-disable-file limite-lineas — Servicio cron que gestiona cola IA con lógica de gap diferenciada por tipo, no es separable */

/**
 * ProcesadorColaIA — Servicio cron para reprocesar items encolados por rate limit.
 *
 * C356: Cuando Groq devuelve 429, los items (samples, publicaciones, comentarios)
 * se encolan en cola_procesamiento_ia. Este servicio se ejecuta via WP Cron
 * cada minuto y reprocesa la cola manteniendo FIFO.
 *
 * Comportamiento:
 * - Revisa una ventana FIFO de MAX_ITEMS_POR_EJECUCION items por run
 * - Procesa como máximo 1 sample de audio por ejecución
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
use App\Helpers\JsonHelper;
use App\Kamples\Api\GroqHttpClient;
use App\Kamples\Api\ServicioIA;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\Api\PipelineAudio;
use App\Kamples\KamplesLogger;

class ProcesadorColaIA
{
    /* [193A-72] Seguimos consultando una ventana amplia para preservar FIFO,
     * pero solo se permite 1 audio por ejecución. */
    private const MAX_ITEMS_POR_EJECUCION = 15;
    private const MAX_AUDIOS_POR_EJECUCION = 1;
    /*
     * [193A-91] Gap reducido a 45s para que el cron de 60s no salte ciclos.
     * El procesamiento de un audio tarda ~10s (envío a Groq + respuesta), y el
     * transient se setea DESPUÉS del procesamiento. Con gap=50s y cron=60s, hay
     * un margen de ~10s que a veces no es suficiente (se vio transcurrido=49).
     * 45s da margen de ~15s para jitter del cron y tiempo de procesamiento.
     * Con 3 keys rotando cada item, 45s es seguro contra rate limits.
     */
    private const LIMITE_DIARIO = 400;
    private const GAP_MINIMO_AUDIO_SEGUNDOS = 45;
    private const TRANSIENT_CONTADOR_DIARIO = 'kmpl_ia_daily_count';
    private const TRANSIENT_ULTIMO_AUDIO = 'kmpl_ia_ultimo_audio';
    /* Nombre del hook WP Cron */
    public const CRON_HOOK = 'kamples_cola_ia_cron';

    /* [193A-72] La cola IA debe dispararse cada minuto, no en ráfagas de 15 min. */
    public const CRON_INTERVALO = 'kamples_1min';
    public const CRON_INTERVALO_SEGUNDOS = 60;

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
                    'display'  => 'Kamples: cada 1 minuto (Cola IA)',
                ];
            }
            return $schedules;
        });

        /* Registrar accion del cron */
        add_action(self::CRON_HOOK, [self::class, 'procesar']);

        /* [193A-72] Migrar automáticamente cualquier schedule legacy de 15 min. */
        $eventoActual = \function_exists('wp_get_scheduled_event')
            ? \wp_get_scheduled_event(self::CRON_HOOK)
            : null;

        if ($eventoActual && (($eventoActual->schedule ?? null) !== self::CRON_INTERVALO || ((int) ($eventoActual->interval ?? 0)) !== self::CRON_INTERVALO_SEGUNDOS)) {
            \wp_unschedule_event((int) $eventoActual->timestamp, self::CRON_HOOK, $eventoActual->args ?? []);
        }

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
            'omitidos' => 0,
            'rateLimited' => false,
        ];

        /* [193A-63] TEMP — log diagnóstico arranque cron */
        KamplesLogger::info('ProcesadorColaIA[DIAG]: Cron iniciado', [
            'hora' => \date('Y-m-d H:i:s'),
            'groq_key_index' => get_transient('kmpl_groq_key_index'),
            'ultimo_audio_transient' => get_transient(self::TRANSIENT_ULTIMO_AUDIO),
            'contador_diario' => get_transient(self::TRANSIENT_CONTADOR_DIARIO),
        ]);

        try {
            $pendientes = ColaProcesamientoIaRepository::obtenerPendientes(self::MAX_ITEMS_POR_EJECUCION);
        } catch (\Throwable $e) {
            KamplesLogger::error('ProcesadorColaIA: Error obteniendo pendientes', ['error' => $e->getMessage()]);
            return $resultado;
        }

        if (empty($pendientes)) {
            return $resultado;
        }

        /* [183A-56] Verificar límite diario antes de procesar */
        $contadorDiario = (int) get_transient(self::TRANSIENT_CONTADOR_DIARIO);
        if ($contadorDiario >= self::LIMITE_DIARIO) {
            KamplesLogger::info('ProcesadorColaIA: Límite diario alcanzado', [
                'procesados_hoy' => $contadorDiario,
                'limite' => self::LIMITE_DIARIO,
            ]);
            return $resultado;
        }

        /* [183A-56] Verificar gap mínimo — solo aplica a items de audio.
         * [193A-43] Moderación (comentarios/publicaciones) procesada sin gap. */
        $tieneItemsAudio = false;
        $tieneItemsModeracion = false;
        foreach ($pendientes as $indice => $item) {
            $tipo = $item[ColaProcesamientoIaCols::TIPO] ?? '';
            if ($tipo === ColaProcesamientoIaEnums::TIPO_SAMPLE) {
                $tieneItemsAudio = true;
            } else {
                $tieneItemsModeracion = true;
            }
        }

        $puedeAudio = true;
        $ultimoAudio = (int) get_transient(self::TRANSIENT_ULTIMO_AUDIO);
        if ($ultimoAudio > 0 && $tieneItemsAudio) {
            $transcurrido = time() - $ultimoAudio;
            if ($transcurrido < self::GAP_MINIMO_AUDIO_SEGUNDOS) {
                KamplesLogger::info('ProcesadorColaIA: Gap audio no alcanzado', [
                    'transcurrido' => $transcurrido,
                    'gap_requerido' => self::GAP_MINIMO_AUDIO_SEGUNDOS,
                ]);
                $puedeAudio = false;
            }
        }

        /* Si solo hay audio y no puede procesarse, salir */
        if (!$puedeAudio && !$tieneItemsModeracion) {
            return $resultado;
        }

        KamplesLogger::info('ProcesadorColaIA: Iniciando procesamiento', [
            'pendientes' => \count($pendientes),
        ]);

        $audiosProcesadosEnEjecucion = 0;

        foreach ($pendientes as $item) {
            $tipoItem = $item[ColaProcesamientoIaCols::TIPO] ?? '';
            $esAudio = ($tipoItem === ColaProcesamientoIaEnums::TIPO_SAMPLE);

            /* [193A-43] Saltar items de audio si el gap no se cumplió */
            if ($esAudio && !$puedeAudio) {
                $resultado['omitidos']++;
                continue;
            }

            /* [193A-72] Máximo 1 audio por ejecución. Evita ráfagas con el mismo minuto. */
            if ($esAudio && $audiosProcesadosEnEjecucion >= self::MAX_AUDIOS_POR_EJECUCION) {
                $resultado['omitidos']++;
                continue;
            }

            /* C356: Si detectamos rate limit en item anterior, parar inmediatamente */
            if (GroqHttpClient::fueRateLimited()) {
                $omitidos = \count($pendientes) - $indice;
                $resultado['omitidos'] = $omitidos;
                KamplesLogger::warning('ProcesadorColaIA: Rate limit detectado, deteniendo procesamiento', [
                    'omitidos' => $omitidos,
                ]);
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
            if ($esAudio) {
                $audiosProcesadosEnEjecucion++;
            }
            $exito = false;

            try {
                $tipo = $item[ColaProcesamientoIaCols::TIPO];
                $operacion = $item[ColaProcesamientoIaCols::OPERACION];
                $entidadId = (int) $item[ColaProcesamientoIaCols::ENTIDAD_ID];
                $metadata = self::decodificarMetadata($item[ColaProcesamientoIaCols::METADATA] ?? null);

                $exito = match (true) {
                    /* [193A-27] Pipeline diferido: sync desktop u overflow de concurrencia.
                     * El sample está en 'procesando' y nunca pasó por el pipeline completo.
                     * Ejecutar PipelineAudio::procesar() que hará todo: FFmpeg, IA, waveform,
                     * MP3, preview, estado='activo', embedding, cache. Si Groq da 429 durante
                     * el pipeline, este encola SOLO la parte IA — el sample ya estará activo. */
                    $tipo === ColaProcesamientoIaEnums::TIPO_SAMPLE
                        && $operacion === ColaProcesamientoIaEnums::OPERACION_ANALISIS_AUDIO
                        && !empty($metadata['pipeline_diferido'])
                        => self::ejecutarPipelineDiferido($entidadId, $metadata),

                    /* Reproceso IA normal: sample ya activo, solo falta metadata IA por rate limit */
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
                    /* [193A-43] Registrar para límite diario. Gap solo para audio. */
                    self::registrarItemProcesado($esAudio);
                } elseif (GroqHttpClient::fueRateLimited()) {
                    /*
                     * Rate limit de nuevo — marcarError gestiona backoff exponencial (QK78).
                     * 15min → 30min → 60min → 120min cap. Mucho más resiliente que fixed 30min.
                     */
                    ColaProcesamientoIaRepository::marcarError(
                        $id,
                        'Rate limit 429 durante reproceso'
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

            /* [193A-76] Rotar key después de cada ítem para que el siguiente use una key distinta.
             * rotarApiKey() ya limpia $keyRotadaCache internamente, forzando re-selección. */
            GroqHttpClient::rotarApiKey();
        }

        KamplesLogger::info('ProcesadorColaIA: Procesamiento completado', $resultado);

        /* QK80: Alerta si hay items ERROR_FINAL acumulados sin atención */
        try {
            $stats = ColaProcesamientoIaRepository::obtenerEstadisticas();
            $erroresFinales = $stats['errores'] ?? 0;
            if ($erroresFinales > 0) {
                KamplesLogger::warning('ProcesadorColaIA: Hay items en ERROR_FINAL sin resolver', [
                    'error_final' => $erroresFinales,
                    'en_reintento' => $stats['en_reintento'] ?? 0,
                    'pendientes' => $stats['pendientes'] ?? 0,
                ]);
            }
        } catch (\Throwable $e) {
            /* No bloquear el return por un error de stats */
        }

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

        $metadataIA = ServicioIA::analizarAudio($rutaArchivo, $nombreOriginal, $descripcionUsuario, $contextoTecnico, true);
        if ($metadataIA === null) {
            return false;
        }

        /* Construir actualizaciones igual que PipelineAudio */
        $actualizaciones = [];

        $tipoRaw = \strtolower(\str_replace([' ', '-'], '', $metadataIA['tipo'] ?? ''));
        $tiposValidos = ['loop', 'oneshot'];
        $actualizaciones['tipo'] = \in_array($tipoRaw, $tiposValidos, true) ? $tipoRaw : 'oneshot';

        /* Preservar confianza tecnica existente si hay */
        $metadataExistente = JsonHelper::decodeOrDefault($sample[SamplesCols::METADATA] ?? '{}', []);
        $bpmConfianza = $metadataExistente['bpm_confianza'] ?? ($contextoTecnico['bpm_confianza'] ?? null);
        $keyConfianza = $metadataExistente['key_confianza'] ?? ($contextoTecnico['key_confianza'] ?? null);

        /* [193A-42] Preservar carpetas del sync si ya existen (no sobreescribir con IA).
         * ia_carpeta_* siempre guarda lo que dijo la IA como referencia inmutable. */
        $syncCarpetaPri = $metadataExistente['carpeta_primaria'] ?? null;
        $syncCarpetaSec = $metadataExistente['carpeta_secundaria'] ?? null;
        $tieneCaretaSync = $syncCarpetaPri !== null
            && $syncCarpetaPri !== 'General'
            && $syncCarpetaPri !== SamplesRepository::CARPETA_DEFAULT;

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
            'carpeta_primaria'      => $tieneCaretaSync ? $syncCarpetaPri : ($metadataIA['carpeta_primaria'] ?? SamplesRepository::CARPETA_DEFAULT),
            'carpeta_secundaria'    => $tieneCaretaSync ? ($syncCarpetaSec ?? 'General') : (!empty($metadataIA['carpeta_secundaria']) ? $metadataIA['carpeta_secundaria'] : 'General'),
            'ia_carpeta_primaria'   => $metadataIA['carpeta_primaria'] ?? SamplesRepository::CARPETA_DEFAULT,
            'ia_carpeta_secundaria' => !empty($metadataIA['carpeta_secundaria']) ? $metadataIA['carpeta_secundaria'] : 'General',
            'origen_subida'         => $metadataExistente['origen_subida'] ?? null,
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

        /* Propagar descripcion_corta_es al campo descripcion visible del sample.
         * Esto reemplaza el placeholder generado por PublicadorExtraccion. */
        $descripcionIA = $metadataIA['descripcion_corta_es'] ?? ($metadataIA['descripcion_es'] ?? '');
        if ($descripcionIA !== '') {
            $actualizaciones[SamplesCols::DESCRIPCION] = $descripcionIA;
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

    /* [193A-27] Ejecuta PipelineAudio completo para samples que fueron encolados
     * desde sync desktop o por overflow de concurrencia. El pipeline hace:
     * FFprobe → BPM/Key → Hash → Dedup → IA → Waveform → MP3 → Preview → estado='activo' → Embedding.
     * Si Groq da 429, el pipeline encola SOLO la parte IA — el sample ya estará activo.
     * No usa semáforo porque la cola ya controla concurrencia (MAX_ITEMS + pausa 60s). */
    private static function ejecutarPipelineDiferido(int $sampleId, array $metadata): bool
    {
        $sample = SamplesRepository::buscarPorId($sampleId);
        if (!$sample) {
            KamplesLogger::warning('ProcesadorColaIA: Sample no encontrado para pipeline diferido', ['sampleId' => $sampleId]);
            return true;
        }

        $rutaArchivo = $metadata['rutaArchivo'] ?? ($sample[SamplesCols::RUTA_ORIGINAL] ?? '');
        $nombreOriginal = $metadata['nombreOriginal'] ?? ($sample[SamplesCols::TITULO] ?? '');
        $idCorto = $sample['id_corto'] ?? \substr(\md5((string) $sampleId), 0, 7);

        if (empty($rutaArchivo) || !\file_exists($rutaArchivo)) {
            KamplesLogger::error('ProcesadorColaIA: Archivo no encontrado para pipeline diferido', [
                'sampleId' => $sampleId,
                'ruta' => $rutaArchivo,
            ]);
            return false;
        }

        $descripcionUsuario = $metadata['descripcionUsuario'] ?? '';
        $tagsUsuario = $metadata['tagsUsuario'] ?? [];

        try {
            PipelineAudio::procesar(
                $sampleId,
                $rutaArchivo,
                $nombreOriginal,
                $idCorto,
                $descripcionUsuario,
                $tagsUsuario,
                false,
                null,
                true /* desdeColaIA — omite semáforo para evitar recursión */
            );

            KamplesLogger::info('ProcesadorColaIA: Pipeline diferido completado', ['sampleId' => $sampleId]);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ProcesadorColaIA: Error en pipeline diferido', [
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
    /**
     * [193A-43] Registra un item procesado exitosamente: incrementa el contador diario
     * y, si es audio, actualiza el timestamp para el control de gap mínimo.
     * El gap solo aplica a procesamiento de audio, no a moderación.
     */
    private static function registrarItemProcesado(bool $esAudio = false): void
    {
        $actual = (int) \get_transient(self::TRANSIENT_CONTADOR_DIARIO);
        $segundosHastaMedianoche = \strtotime('tomorrow') - \time();
        \set_transient(self::TRANSIENT_CONTADOR_DIARIO, $actual + 1, $segundosHastaMedianoche);

        if ($esAudio) {
            \set_transient(self::TRANSIENT_ULTIMO_AUDIO, \time(), self::GAP_MINIMO_AUDIO_SEGUNDOS);
        }
    }

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
