<?php

/**
 * PublicadorExtraccion — Publica samples extraidos a traves del flujo estandar.
 *
 * Lee items con estado='extraido' de cola_extraccion_samples y los publica
 * usando SamplesRepository::insertarSample() + PipelineAudio::procesar(),
 * identico al flujo de upload web/sync.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Api\GeneradorIdCorto;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\PipelineAudio;
use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\ColaExtraccionSamplesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\ColaExtraccionSamplesCols;
use App\Config\Schema\_generated\ColaExtraccionSamplesEnums;
use App\Config\Schema\_generated\RelacionesSampleCols;
use App\Config\Schema\_generated\SamplesCols;

class PublicadorExtraccion
{
    /**
     * Publica hasta $limit items extraidos.
     * @return array{publicados: int, errores: int, resultados: array}
     */
    public static function publicarPendientes(int $limit = 10): array
    {
        $extraidos = ColaExtraccionSamplesRepository::extraidos($limit);

        if (empty($extraidos)) {
            return ['publicados' => 0, 'errores' => 0, 'resultados' => []];
        }

        $resultados = [];
        $publicados = 0;
        $errores = 0;

        foreach ($extraidos as $item) {
            $resultado = self::publicarItem($item);

            if ($resultado['ok']) {
                $publicados++;
            } else {
                $errores++;
            }

            $resultados[] = $resultado;
        }

        return ['publicados' => $publicados, 'errores' => $errores, 'resultados' => $resultados];
    }

    /**
     * Publica un unico item extraido a traves del flujo estandar.
     */
    private static function publicarItem(array $item): array
    {
        $colaId = (int) $item[ColaExtraccionSamplesCols::ID];
        $rutaAudio = $item[ColaExtraccionSamplesCols::RUTA_AUDIO_EXTRAIDO] ?? '';
        $meta = self::parsearMetadata($item[ColaExtraccionSamplesCols::METADATA_EXTRACCION] ?? '{}');
        $lado = $meta['lado'] ?? ($item[ColaExtraccionSamplesCols::LADO] ?? ColaExtraccionSamplesEnums::LADO_FUENTE);
        $relacionId = (int) ($item[ColaExtraccionSamplesCols::RELACION_ID] ?? 0);

        try {
            /* Verificar que el audio extraido existe */
            if ($rutaAudio === '' || !\file_exists($rutaAudio)) {
                return self::marcarError($colaId, 'Archivo de audio no encontrado: ' . $rutaAudio);
            }

            /* Copiar archivo a estructura estandar: kamples/0/{Y}/{M}/ */
            $destDir = self::directorioUploadsExtraccion();
            $nombreArchivo = \basename($rutaAudio);
            $rutaFinal = $destDir . '/' . $nombreArchivo;

            if ($rutaAudio !== $rutaFinal && !\copy($rutaAudio, $rutaFinal)) {
                return self::marcarError($colaId, 'No se pudo copiar archivo a uploads');
            }

            /* Preparar datos del sample */
            $titulo = self::generarTitulo($meta, $lado);
            $idCorto = GeneradorIdCorto::generar();
            $slug = \sanitize_title($titulo) . '-' . $idCorto;
            $formato = \strtolower(\pathinfo($rutaFinal, PATHINFO_EXTENSION));
            $tamano = \filesize($rutaFinal);
            $tags = self::generarTags($meta);
            $tagsNormalizados = NormalizadorSample::normalizarTags($tags);
            $tagsPostgres = NormalizadorSample::phpArrayToPg($tagsNormalizados);

            /* Resolver creador: contribuidor de la relacion o usuario sistema */
            $creadorId = self::resolverCreadorId($item);

            /* Insertar via el mismo SamplesRepository que usa el upload web */
            $sampleId = SamplesRepository::insertarSample([
                'creadorId'    => $creadorId,
                'titulo'       => $titulo,
                'slug'         => $slug,
                'idCorto'      => $idCorto,
                'descripcion'  => self::generarDescripcion($meta, $lado),
                'formato'      => $formato,
                'tamano'       => $tamano ?: 0,
                'rutaOriginal' => $rutaFinal,
                'tags'         => $tagsPostgres,
                'esPremium'    => 'false',
                'precio'       => 0,
                'descarga'     => 'true',
                'licencia'     => 'true',
                'comunidad'    => 'false',
            ]);

            if (!$sampleId) {
                return self::marcarError($colaId, 'INSERT en samples fallo');
            }

            /* Setear cancion_origen_id segun el lado de la extraccion */
            $cancionOrigenId = $lado === ColaExtraccionSamplesEnums::LADO_FUENTE
                ? ($meta['cancion_fuente_id'] ?? $item['cancion_fuente_id'] ?? null)
                : ($meta['cancion_destino_id'] ?? $item['cancion_destino_id'] ?? null);

            if ($cancionOrigenId) {
                SamplesRepository::actualizarCampos($sampleId, [
                    SamplesCols::CANCION_ORIGEN_ID . " = :cancion_id",
                ], ['cancion_id' => (int) $cancionOrigenId]);

                /* Heredar imagen de portada de la canción origen al sample */
                try {
                    $cancionOrigen = CancionesRepository::buscarConArtista((int) $cancionOrigenId);
                    $imagenCancion = $cancionOrigen[CancionesCols::IMAGEN_URL] ?? null;
                    if ($imagenCancion) {
                        SamplesRepository::actualizarCampos($sampleId, [
                            SamplesCols::IMAGEN_URL . " = :imagen_url",
                        ], ['imagen_url' => $imagenCancion]);
                    }
                } catch (\Throwable $e) {
                    KamplesLogger::error('[PUB-EXTRACCION] Error al heredar imagen de cancion', [
                        'sampleId' => $sampleId, 'cancionId' => $cancionOrigenId, 'error' => $e->getMessage(),
                    ]);
                }
            }

            /*
             * Guardar metadata de extraccion en el sample:
             * - origen='extraccion' para distinguir de samples subidos manualmente.
             * - Fuente de descarga (SC/YT/Deezer) para verificacion manual.
             * - youtube_id, lado y relacion para trazabilidad.
             */
            $metadataSample = [
                'origen' => 'extraccion',
                'lado_extraccion' => $lado,
                'relacion_id' => $relacionId,
            ];

            $youtubeId = $item[ColaExtraccionSamplesCols::YOUTUBE_ID] ?? null;
            if ($youtubeId) {
                $metadataSample['youtube_id'] = $youtubeId;
            }

            /* Preservar metadata de fuente de descarga (SC permalink, titulo match, metodo) */
            foreach (['descarga_metodo', 'descarga_fuente_url', 'descarga_fuente_titulo', 'descarga_fuente_artista'] as $clave) {
                if (!empty($meta[$clave])) {
                    $metadataSample[$clave] = $meta[$clave];
                }
            }

            try {
                SamplesRepository::agregarMetadata($sampleId, $metadataSample);
            } catch (\Throwable $e) {
                KamplesLogger::warning('[PUB-EXTRACCION] No se pudo guardar metadata de extraccion', [
                    'sampleId' => $sampleId, 'error' => $e->getMessage(),
                ]);
            }

            /* Vincular sample a la relacion (sample_fuente_id o sample_destino_id) */
            $colVinculo = $lado === ColaExtraccionSamplesEnums::LADO_FUENTE
                ? RelacionesSampleCols::SAMPLE_FUENTE_ID
                : RelacionesSampleCols::SAMPLE_DESTINO_ID;

            RelacionesSampleRepository::actualizarPorId($relacionId, [
                $colVinculo => $sampleId,
            ]);

            /* QQ79: Vincular relacion_sampleo_id en el sample */
            SamplesRepository::actualizarCampos($sampleId, [
                SamplesCols::RELACION_SAMPLEO_ID . " = :rel_id",
            ], ['rel_id' => $relacionId]);

            /* Marcar cola como completada con sample_id */
            ColaExtraccionSamplesRepository::vincularSample($colaId, $sampleId, [
                'bpm'            => $meta['bpm_detectado'] ?? null,
                'duracion_compas' => $meta['duracion_compas'] ?? null,
                'compas_inicio'  => $meta['compas_inicio_seg'] ?? null,
                'compas_fin'     => $meta['compas_fin_seg'] ?? null,
            ]);

            /* Ejecutar PipelineAudio (mismo que upload web/sync) */
            try {
                PipelineAudio::procesar($sampleId, $rutaFinal, $nombreArchivo, $idCorto, '', $tags);
            } catch (\Throwable $e) {
                KamplesLogger::error('[PUB-EXTRACCION] PipelineAudio error', [
                    'sampleId' => $sampleId, 'colaId' => $colaId, 'error' => $e->getMessage(),
                ]);
            }

            /* Limpiar archivo temporal (ya copiado a uploads) */
            if ($rutaAudio !== $rutaFinal && \file_exists($rutaAudio)) {
                try {
                    \unlink($rutaAudio);
                } catch (\Throwable $e) {
                    KamplesLogger::warning('[PUB-EXTRACCION] No se pudo eliminar temporal', ['ruta' => $rutaAudio]);
                }
            }

            KamplesLogger::info('[PUB-EXTRACCION] Sample publicado', [
                'colaId' => $colaId, 'sampleId' => $sampleId, 'idCorto' => $idCorto, 'lado' => $lado,
            ]);

            return ['cola_id' => $colaId, 'ok' => true, 'sample_id' => $sampleId, 'id_corto' => $idCorto];

        } catch (\Throwable $e) {
            KamplesLogger::error('[PUB-EXTRACCION] Error publicando', [
                'colaId' => $colaId, 'error' => $e->getMessage(),
            ]);
            return self::marcarError($colaId, $e->getMessage());
        }
    }

    private static function marcarError(int $colaId, string $msg): array
    {
        ColaExtraccionSamplesRepository::actualizarEstado($colaId, 'error', $msg);
        return ['cola_id' => $colaId, 'ok' => false, 'error' => $msg];
    }

    /**
     * Resuelve el ID del creador para el sample extraido.
     * Prioridad: contribuidor_id de la relacion > KAMPLES_SISTEMA_USUARIO_ID en .env > fallback 7.
     */
    private static function resolverCreadorId(array $item): int
    {
        $contribuidorId = (int)($item['contribuidor_id'] ?? 0);
        if ($contribuidorId > 0) {
            return $contribuidorId;
        }

        /* Dotenv::createImmutable() popula $_ENV, no putenv(). Usar patron $_ENV ?? getenv(). */
        $sistemaId = (int)($_ENV['KAMPLES_SISTEMA_USUARIO_ID'] ?? \getenv('KAMPLES_SISTEMA_USUARIO_ID') ?? 0);
        return $sistemaId > 0 ? $sistemaId : 7;
    }

    /**
     * Parsea metadata_extraccion JSONB con validacion de json_last_error().
     */
    private static function parsearMetadata(mixed $raw): array
    {
        if (\is_array($raw)) {
            return $raw;
        }
        if (!\is_string($raw) || $raw === '') {
            return [];
        }

        $decoded = \json_decode($raw, true);

        if (\json_last_error() !== JSON_ERROR_NONE) {
            KamplesLogger::warning('[PUB-EXTRACCION] metadata_extraccion JSON invalido', [
                'error' => \json_last_error_msg(),
                'raw_inicio' => \substr($raw, 0, 100),
            ]);
            return [];
        }

        return $decoded ?? [];
    }

    private static function generarTitulo(array $meta, string $lado): string
    {
        $artista = $lado === ColaExtraccionSamplesEnums::LADO_FUENTE
            ? ($meta['fuente_artista'] ?? '')
            : ($meta['destino_artista'] ?? '');
        $titulo = $lado === ColaExtraccionSamplesEnums::LADO_FUENTE
            ? ($meta['fuente_titulo'] ?? '')
            : ($meta['destino_titulo'] ?? '');
        $tipo = $meta['tipo_elemento'] ?? 'sample';

        if ($artista !== '' && $titulo !== '') {
            return "{$artista} - {$titulo} [{$tipo}]";
        }
        if ($titulo !== '') {
            return "{$titulo} [{$tipo}]";
        }

        return "Extraccion #{$meta['relacion_id']} [{$tipo}]";
    }

    private static function generarTags(array $meta): array
    {
        $tags = [];

        $tipo = $meta['tipo_elemento'] ?? '';
        if ($tipo !== '') {
            $tags[] = \strtolower($tipo);
        }
        $tags[] = 'extraccion';

        foreach (['fuente_artista', 'destino_artista'] as $key) {
            $val = $meta[$key] ?? '';
            if ($val !== '') {
                $tags[] = \strtolower($val);
            }
        }

        return \array_unique(\array_filter($tags));
    }

    private static function generarDescripcion(array $meta, string $lado): string
    {
        $tipo = $meta['tipo_elemento'] ?? 'sample';

        /* Descripcion generica sin nombres de canciones/artistas.
         * La descripcion real (con creditos) la genera ProcesadorColaIA
         * a partir de la IA y se escribe en samples.descripcion. */
        return "Sample [{$tipo}]";
    }

    /**
     * Directorio de uploads para extracciones (creador_id=0 = sistema/bot).
     */
    private static function directorioUploadsExtraccion(): string
    {
        $uploadsDir = \wp_upload_dir();
        $base = $uploadsDir['basedir'] . '/kamples/0/' . date('Y') . '/' . date('m');

        if (!\is_dir($base)) {
            \wp_mkdir_p($base);
        }

        return $base;
    }
}
