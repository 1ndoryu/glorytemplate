<?php

/**
 * ServicioExtensionRecorte — Extiende o regenera recortes de samples extraidos.
 *
 * QQ130: Re-descarga el audio completo de YouTube y re-corta con timing extendido.
 * QQ130-B: Genera un nuevo sample a partir del segmento siguiente.
 *
 * Operaciones de audio delegadas a AyudanteDescargaAudio (SRP).
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Config\Schema\_generated\ColaExtraccionSamplesCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Api\FFmpegDetector;
use App\Kamples\Api\ProcesadorFFmpeg;
use App\Kamples\Database\Repositories\ColaExtraccionSamplesRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;

class ServicioExtensionRecorte
{
    /* Limites de seguridad para extension */
    private const MAX_EXTENSION_SEG = 30.0;
    private const MAX_DURACION_TOTAL_SEG = 60.0;
    private const MIN_DURACION_SEG = 1.0;

    /**
     * Extiende el recorte de un sample existente.
     *
     * Descarga el audio original de YouTube, recalcula el timing
     * sumando/restando los segundos indicados, y reemplaza los archivos.
     *
     * @param int   $sampleId       ID del sample a extender
     * @param float $segAntes       Segundos a agregar antes del inicio actual (>= 0)
     * @param float $segDespues     Segundos a agregar despues del fin actual (>= 0)
     * @return array{ok: bool, mensaje: string, duracion?: float}
     */
    public static function extender(int $sampleId, float $segAntes, float $segDespues): array
    {
        try {
            /* 1. Validar parametros */
            if ($segAntes < 0 || $segDespues < 0) {
                return ['ok' => false, 'mensaje' => 'Los segundos no pueden ser negativos'];
            }
            if ($segAntes > self::MAX_EXTENSION_SEG || $segDespues > self::MAX_EXTENSION_SEG) {
                return ['ok' => false, 'mensaje' => 'Extension maxima: ' . self::MAX_EXTENSION_SEG . ' segundos'];
            }
            if ($segAntes === 0.0 && $segDespues === 0.0) {
                return ['ok' => false, 'mensaje' => 'Debes agregar al menos 1 segundo de extension'];
            }

            /* 2. Obtener datos del sample + cola de extraccion */
            $sample = SamplesRepository::buscarPorId($sampleId);
            if (!$sample) {
                return ['ok' => false, 'mensaje' => 'Sample no encontrado'];
            }

            $cola = self::obtenerDatosExtraccion($sampleId);
            if (!$cola) {
                return ['ok' => false, 'mensaje' => 'Este sample no proviene de una extraccion automatica'];
            }

            $youtubeId = $cola[ColaExtraccionSamplesCols::YOUTUBE_ID] ?? null;

            $inicioActual = (float) ($cola[ColaExtraccionSamplesCols::COMPAS_INICIO_SEG] ?? 0);
            $finActual = (float) ($cola[ColaExtraccionSamplesCols::COMPAS_FIN_SEG] ?? 0);

            /* Si no hay timing de compas, usar timing bruto */
            if ($inicioActual <= 0 && $finActual <= 0) {
                $timingOrigen = (int) ($cola[ColaExtraccionSamplesCols::TIMING_INICIO_SEG] ?? 0);
                $duracionActual = (float) ($sample[SamplesCols::DURACION] ?? 15);
                $inicioActual = (float) max(0, $timingOrigen - 5);
                $finActual = $inicioActual + $duracionActual;
            }

            /* Calcular nuevo rango */
            $nuevoInicio = max(0, $inicioActual - $segAntes);
            $nuevoFin = $finActual + $segDespues;
            $nuevaDuracion = $nuevoFin - $nuevoInicio;

            if ($nuevaDuracion > self::MAX_DURACION_TOTAL_SEG) {
                return ['ok' => false, 'mensaje' => 'La duracion total excederia ' . self::MAX_DURACION_TOTAL_SEG . ' segundos'];
            }
            if ($nuevaDuracion < self::MIN_DURACION_SEG) {
                return ['ok' => false, 'mensaje' => 'La duracion resultante es muy corta'];
            }

            /* 3. Obtener audio completo: usar guardado si existe, o descargar de YouTube */
            $tmpDir = null;
            try {
                $rutaAudioCompleto = self::obtenerRutaAudioCompleto($cola);
                $rutaDescarga = null;
                $usaAudioGuardado = false;

                if ($rutaAudioCompleto) {
                    $rutaDescarga = $rutaAudioCompleto;
                    $usaAudioGuardado = true;
                    KamplesLogger::info('[QQ130] Usando audio completo guardado', [
                        'sampleId' => $sampleId, 'ruta' => $rutaAudioCompleto,
                    ]);
                } else {
                    if (!$youtubeId) {
                        return ['ok' => false, 'mensaje' => 'No hay audio completo guardado ni YouTube ID para descargar'];
                    }
                    $tmpDir = AyudanteDescargaAudio::crearDirectorioTemporal();
                    $rutaDescarga = AyudanteDescargaAudio::descargarAudioYoutube($youtubeId, $tmpDir);
                    if (!$rutaDescarga) {
                        return ['ok' => false, 'mensaje' => 'No se pudo descargar el audio de YouTube. Intenta de nuevo.'];
                    }
                }

                /* 4. Recortar con nuevo timing */
                if (!$tmpDir) {
                    $tmpDir = AyudanteDescargaAudio::crearDirectorioTemporal();
                }
                $rutaRecorte = $tmpDir . '/recorte_' . $sampleId . '.mp3';
                $exito = AyudanteDescargaAudio::recortarConFFmpeg($rutaDescarga, $nuevoInicio, $nuevaDuracion, $rutaRecorte);
                if (!$exito) {
                    return ['ok' => false, 'mensaje' => 'Error al recortar el audio con los nuevos tiempos'];
                }

                /* 5. Reemplazar archivos del sample */
                $resultado = AyudanteDescargaAudio::reemplazarArchivosSample($sampleId, $sample, $rutaRecorte);
                if (!$resultado['ok']) {
                    return $resultado;
                }

                /* 6. Actualizar timing en cola_extraccion_samples */
                $colaId = (int) $cola[ColaExtraccionSamplesCols::ID];
                self::actualizarTimingCola($colaId, $nuevoInicio, $nuevoFin);

                KamplesLogger::info('[QQ130] Recorte extendido', [
                    'sampleId'   => $sampleId,
                    'segAntes'   => $segAntes,
                    'segDespues' => $segDespues,
                    'rango'      => "{$nuevoInicio}s - {$nuevoFin}s",
                    'duracion'   => $resultado['duracion'],
                ]);

                return [
                    'ok'       => true,
                    'mensaje'  => 'Recorte extendido correctamente',
                    'duracion' => $resultado['duracion'],
                ];
            } finally {
                if ($tmpDir) {
                    AyudanteDescargaAudio::limpiarDirectorioTemporal($tmpDir);
                }
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('[QQ130] Error extendiendo recorte', [
                'sampleId' => $sampleId,
                'error'    => $e->getMessage(),
            ]);
            return ['ok' => false, 'mensaje' => 'Error interno al extender el recorte'];
        }
    }

    /**
     * QQ130-B: Genera un nuevo sample desde el segmento siguiente.
     *
     * Si el sample actual va de 0:30 a 0:45, y se eligen 15 segundos,
     * el nuevo sample ira de 0:45 a 1:00.
     *
     * @param int   $sampleId   ID del sample de referencia
     * @param float $duracionSeg Duracion del nuevo segmento en segundos
     * @return array{ok: bool, mensaje: string, nuevoSampleId?: int}
     */
    public static function generarSiguiente(int $sampleId, float $duracionSeg): array
    {
        try {
            if ($duracionSeg < self::MIN_DURACION_SEG || $duracionSeg > self::MAX_DURACION_TOTAL_SEG) {
                return ['ok' => false, 'mensaje' => 'Duracion debe ser entre ' . self::MIN_DURACION_SEG . ' y ' . self::MAX_DURACION_TOTAL_SEG . ' segundos'];
            }

            $sample = SamplesRepository::buscarPorId($sampleId);
            if (!$sample) {
                return ['ok' => false, 'mensaje' => 'Sample no encontrado'];
            }

            $cola = self::obtenerDatosExtraccion($sampleId);
            if (!$cola) {
                return ['ok' => false, 'mensaje' => 'Este sample no proviene de una extraccion automatica'];
            }

            $youtubeId = $cola[ColaExtraccionSamplesCols::YOUTUBE_ID] ?? null;

            /* El nuevo segmento empieza donde termina el actual */
            $finActual = (float) ($cola[ColaExtraccionSamplesCols::COMPAS_FIN_SEG] ?? 0);
            if ($finActual <= 0) {
                $timingOrigen = (int) ($cola[ColaExtraccionSamplesCols::TIMING_INICIO_SEG] ?? 0);
                $durActual = (float) ($sample[SamplesCols::DURACION] ?? 15);
                $finActual = (float) max(0, $timingOrigen - 5) + $durActual;
            }

            $nuevoInicio = $finActual;
            $nuevoFin = $nuevoInicio + $duracionSeg;

            $tmpDir = null;
            try {
                $rutaAudioCompleto = self::obtenerRutaAudioCompleto($cola);
                $rutaDescarga = null;
                $usaAudioGuardado = false;

                if ($rutaAudioCompleto) {
                    $rutaDescarga = $rutaAudioCompleto;
                    $usaAudioGuardado = true;
                } else {
                    if (!$youtubeId) {
                        return ['ok' => false, 'mensaje' => 'No hay audio completo guardado ni YouTube ID para descargar'];
                    }
                    $tmpDir = AyudanteDescargaAudio::crearDirectorioTemporal();
                    $rutaDescarga = AyudanteDescargaAudio::descargarAudioYoutube($youtubeId, $tmpDir);
                    if (!$rutaDescarga) {
                        return ['ok' => false, 'mensaje' => 'No se pudo descargar el audio de YouTube'];
                    }
                }

                /* Verificar que el audio es suficientemente largo */
                $ffprobeBin = FFmpegDetector::obtenerFFprobe();
                if ($ffprobeBin) {
                    $duracionTotal = ProcesadorFFmpeg::calcularDuracion($rutaDescarga, $ffprobeBin);
                    if ($nuevoFin > $duracionTotal) {
                        return ['ok' => false, 'mensaje' => 'El audio original no es suficientemente largo. Dura ' . round($duracionTotal) . 's, necesitas hasta ' . round($nuevoFin) . 's'];
                    }
                }

                /* Recortar nuevo segmento */
                if (!$tmpDir) {
                    $tmpDir = AyudanteDescargaAudio::crearDirectorioTemporal();
                }
                $rutaRecorte = $tmpDir . '/siguiente_' . $sampleId . '.mp3';
                $exito = AyudanteDescargaAudio::recortarConFFmpeg($rutaDescarga, $nuevoInicio, $duracionSeg, $rutaRecorte);
                if (!$exito) {
                    return ['ok' => false, 'mensaje' => 'Error al recortar el nuevo segmento'];
                }

                /* Crear nuevo sample basado en el original */
                $nuevoSampleId = self::crearSampleDesdeRecorte(
                    $sampleId,
                    $sample,
                    $cola,
                    $rutaRecorte,
                    $nuevoInicio,
                    $nuevoFin
                );

                if (!$nuevoSampleId) {
                    return ['ok' => false, 'mensaje' => 'Error al crear el nuevo sample'];
                }

                KamplesLogger::info('[QQ130-B] Sample siguiente generado', [
                    'sampleOriginal' => $sampleId,
                    'nuevoSample'    => $nuevoSampleId,
                    'rango'          => "{$nuevoInicio}s - {$nuevoFin}s",
                    'duracion'       => $duracionSeg,
                ]);

                return [
                    'ok'             => true,
                    'mensaje'        => 'Nuevo sample generado correctamente',
                    'nuevoSampleId'  => $nuevoSampleId,
                ];
            } finally {
                if ($tmpDir) {
                    AyudanteDescargaAudio::limpiarDirectorioTemporal($tmpDir);
                }
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('[QQ130-B] Error generando sample siguiente', [
                'sampleId' => $sampleId,
                'error'    => $e->getMessage(),
            ]);
            return ['ok' => false, 'mensaje' => 'Error interno al generar el sample'];
        }
    }

    /**
     * Obtiene la entrada de cola_extraccion_samples para un sample publicado.
     */
    private static function obtenerDatosExtraccion(int $sampleId): ?array
    {
        return ColaExtraccionSamplesRepository::buscarPorSampleId($sampleId);
    }

    /**
     * QQ130-C: Obtiene la ruta del audio completo guardado, verificando que el archivo exista.
     * Retorna null si no hay audio guardado o si el archivo fue eliminado.
     */
    private static function obtenerRutaAudioCompleto(array $cola): ?string
    {
        $ruta = $cola[ColaExtraccionSamplesCols::RUTA_AUDIO_COMPLETO] ?? '';
        if ($ruta === '') {
            return null;
        }
        if (!\file_exists($ruta)) {
            KamplesLogger::warning('[QQ130-C] Audio completo registrado pero archivo no encontrado', [
                'ruta' => $ruta,
                'colaId' => $cola[ColaExtraccionSamplesCols::ID] ?? null,
            ]);
            return null;
        }
        return $ruta;
    }

    /**
     * Actualiza los campos de timing en cola_extraccion_samples.
     */
    private static function actualizarTimingCola(int $colaId, float $nuevoInicio, float $nuevoFin): void
    {
        $tabla = ColaExtraccionSamplesCols::TABLA;

        ColaExtraccionSamplesRepository::ejecutar(
            "UPDATE {$tabla} SET "
            . ColaExtraccionSamplesCols::COMPAS_INICIO_SEG . " = :inicio, "
            . ColaExtraccionSamplesCols::COMPAS_FIN_SEG . " = :fin "
            . "WHERE " . ColaExtraccionSamplesCols::ID . " = :id",
            [
                'inicio' => \round($nuevoInicio, 2),
                'fin'    => \round($nuevoFin, 2),
                'id'     => $colaId,
            ]
        );
    }

    /**
     * QQ130-B: Crea un nuevo sample basado en un recorte del segmento siguiente.
     *
     * Copia metadata del sample original, inserta nuevo registro en samples,
     * y ejecuta PipelineAudio para procesamiento completo.
     */
    private static function crearSampleDesdeRecorte(
        int $sampleOriginalId,
        array $sampleOriginal,
        array $cola,
        string $rutaRecorte,
        float $nuevoInicio,
        float $nuevoFin
    ): ?int {
        $uploadDir = \wp_upload_dir();
        $destDir = $uploadDir['basedir'] . '/kamples/0/' . \date('Y') . '/' . \date('m');
        if (!\file_exists($destDir)) {
            \wp_mkdir_p($destDir);
        }

        $idCorto = \substr(\bin2hex(\random_bytes(4)), 0, 7);
        $nombreArchivo = $idCorto . '_siguiente.mp3';
        $rutaDestino = $destDir . '/' . $nombreArchivo;

        if (!\copy($rutaRecorte, $rutaDestino)) {
            KamplesLogger::error('[QQ130-B] No se pudo copiar recorte a destino');
            return null;
        }

        /* Insertar sample con datos minimos — PipelineAudio completara el resto */
        $creadorId = (int) ($sampleOriginal[SamplesCols::CREADOR_ID] ?? 1);
        $tituloBase = ($sampleOriginal[SamplesCols::TITULO] ?? 'Sample') . ' (Parte 2)';

        $nuevoId = SamplesRepository::insertarSample([
            SamplesCols::CREADOR_ID     => $creadorId,
            SamplesCols::TITULO         => $tituloBase,
            SamplesCols::ID_CORTO       => $idCorto,
            SamplesCols::RUTA_ORIGINAL  => $rutaDestino,
            SamplesCols::ESTADO         => 'procesando',
            SamplesCols::TIPO           => $sampleOriginal[SamplesCols::TIPO] ?? 'oneshot',
            SamplesCols::CANCION_ORIGEN_ID => $sampleOriginal[SamplesCols::CANCION_ORIGEN_ID] ?? null,
            SamplesCols::RELACION_SAMPLEO_ID => $sampleOriginal[SamplesCols::RELACION_SAMPLEO_ID] ?? null,
        ]);

        if (!$nuevoId) {
            KamplesLogger::error('[QQ130-B] Fallo al insertar sample en DB');
            return null;
        }

        /* Copiar metadata del sample original al nuevo */
        $metadataRaw = $sampleOriginal[SamplesCols::METADATA] ?? '{}';
        $metadataOriginal = \json_decode($metadataRaw, true);
        if (\json_last_error() !== JSON_ERROR_NONE) {
            KamplesLogger::warning('[QQ130-B] Metadata corrupta en sample original, usando vacia', [
                'sampleId' => $sampleOriginalId,
                'error'    => \json_last_error_msg(),
            ]);
            $metadataOriginal = [];
        }
        if (!\is_array($metadataOriginal)) {
            $metadataOriginal = [];
        }
        $metadataOriginal['generado_desde'] = $sampleOriginalId;
        $metadataOriginal['segmento_inicio_seg'] = $nuevoInicio;
        $metadataOriginal['segmento_fin_seg'] = $nuevoFin;
        SamplesRepository::agregarMetadata($nuevoId, $metadataOriginal);

        /* Ejecutar PipelineAudio para procesar el nuevo sample */
        try {
            \App\Kamples\Api\PipelineAudio::procesar(
                $nuevoId,
                $rutaDestino,
                $nombreArchivo,
                $idCorto,
                $sampleOriginal[SamplesCols::DESCRIPCION] ?? '',
                [],
                true  /* omitirDedup: es un segmento diferente del mismo audio */
            );
        } catch (\Throwable $e) {
            KamplesLogger::error('[QQ130-B] Error en PipelineAudio para sample siguiente', [
                'nuevoSampleId' => $nuevoId,
                'error'         => $e->getMessage(),
            ]);
        }

        return $nuevoId;
    }
}
