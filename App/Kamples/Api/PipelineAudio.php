<?php
/* sentinel-disable-file limite-lineas — pipeline de procesamiento secuencial cohesivo, apenas sobre limite (309/300) */

/**
 * PipelineAudio — Orquestador del pipeline de procesamiento de audio
 *
 * Procesa un sample después de subirse:
 * 1. Verificar FFmpeg (FFmpegDetector)
 * 2. Duración real (ProcesadorFFmpeg)
 * 3. Análisis técnico: BPM + key (AnalizadorAudio)
 * 2.5. Hash SHA-256 + verificación duplicados (ANTES de IA para ahorrar tokens)
 * 4. Análisis creativo: tags, emociones (ServicioIA)
 * 5. Waveform peaks + MP3 + preview (ProcesadorFFmpeg)
 * 6. Renombrar + actualizar PostgreSQL
 *
 * A12: Refactorizado — FFmpeg detection en FFmpegDetector, audio ops en ProcesadorFFmpeg.
 * QQ9: Duplicados se verifican ANTES de IA. Mismo-usuario ya no elimina archivos, queda en supervision.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\ColaProcesamientoIaRepository;
use App\Kamples\Database\Repositories\DuplicadosPendientesRepository;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\DuplicadosPendientesEnums;
use App\Config\Schema\_generated\ColaProcesamientoIaEnums;
use App\Kamples\LogIA as KamplesLogger;
use App\Kamples\Api\FFmpegDetector;
use App\Kamples\Api\ProcesadorFFmpeg;
use App\Kamples\Services\GeneradorEmbeddings;
use App\Kamples\Services\MotorRecomendacion;
use App\Kamples\Services\DeduplicadorAudio;
use App\Kamples\Api\PipelineAudioHelpers;

class PipelineAudio
{

    /*
     * Ejecuta el pipeline completo para un sample.
     *
     * @param int $sampleId ID del sample en PostgreSQL
     * @param string $rutaArchivo Ruta absoluta al archivo original
     * @param string $nombreOriginal Nombre original subido por el usuario
     * @param string $idCorto ID corto del sample (ej: "a3Kf9x2")
     * @param string $descripcionUsuario Descripción del usuario (para contexto IA)
     * @param array $tagsUsuario Tags proporcionados por el usuario (#hashtags)
     * @throws \RuntimeException Si FFmpeg no está disponible
     */
    /**
     * @param bool $omitirDedup Si true, salta la verificacion de duplicados en paso 2.5.
     *  Usado al reprocesar un sample aprobado por admin desde el panel de duplicados.
     */
    public static function procesar(int $sampleId, string $rutaArchivo, string $nombreOriginal, string $idCorto, string $descripcionUsuario = '', array $tagsUsuario = [], bool $omitirDedup = false): void
    {
        KamplesLogger::info("Pipeline: Iniciando procesamiento", [
            'sampleId' => $sampleId,
            'archivo' => \basename($rutaArchivo),
            'idCorto' => $idCorto,
            'tagsCount' => \count($tagsUsuario),
            'omitirDedup' => $omitirDedup,
        ]);

        /* Paso 0: Verificar FFmpeg (OBLIGATORIO) */
        $ffmpeg = FFmpegDetector::obtenerFFmpeg();
        $ffprobe = FFmpegDetector::obtenerFFprobe();

        if (!$ffmpeg) {
            KamplesLogger::critical('Pipeline: FFmpeg NO encontrado', [
                'os' => PHP_OS,
                'instruccion' => FFmpegDetector::esWindows()
                    ? 'Descargar de https://ffmpeg.org/download.html y agregar al PATH'
                    : 'Instalar con: sudo apt install ffmpeg',
            ]);
            throw new \RuntimeException('FFmpeg es obligatorio para procesar audio. No se encontró en el sistema.');
        }

        $directorio = \dirname($rutaArchivo);
        $extension = \strtolower(\pathinfo($rutaArchivo, PATHINFO_EXTENSION));
        $actualizaciones = [];

        /* Paso 1: Duración real con FFprobe */
        $duracion = ProcesadorFFmpeg::calcularDuracion($rutaArchivo, $ffprobe ?: $ffmpeg);
        if ($duracion > 0) {
            $actualizaciones['duracion'] = $duracion;
        }

        /* Paso 2: Análisis técnico — BPM + key con herramientas de señal (NO IA) */
        $analisisTecnico = AnalizadorAudio::analizar($rutaArchivo, $ffmpeg);
        $actualizaciones['bpm'] = $analisisTecnico['bpm'];
        $actualizaciones['key'] = $analisisTecnico['key'];
        $actualizaciones['escala'] = $analisisTecnico['escala'];

        KamplesLogger::info('Pipeline: Análisis técnico completado', [
            'bpm' => $analisisTecnico['bpm'],
            'key' => $analisisTecnico['key'],
            'escala' => $analisisTecnico['escala'],
        ]);

        /*
         * Paso 2.5: Hash SHA-256 + verificacion de duplicados (ANTES de IA).
         * Movido aqui para evitar desperdiciar tokens IA en samples duplicados.
         * Si es duplicado, se registra en duplicados_pendientes y se conservan los archivos
         * para que admin pueda reproducir ambos audios en la pagina de revision.
         */
        $hashArchivo = null;
        try {
            $hashArchivo = \hash_file('sha256', $rutaArchivo);
        } catch (\Throwable $e) {
            KamplesLogger::error('Pipeline: Error calculando hash SHA-256', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
        }

        if ($hashArchivo) {
            $actualizaciones['audio_hash'] = $hashArchivo;

            /* Saltar verificacion de duplicados si el sample fue aprobado por admin */
            if (!$omitirDedup) {
            $duplicados = SamplesRepository::buscarConHash($hashArchivo, $sampleId);

            if (!empty($duplicados)) {
                $creadorActual = SamplesRepository::buscarParaDeduplicacion($sampleId);
                $creadorId = $creadorActual ? (int) $creadorActual[SamplesCols::CREADOR_ID] : 0;

                $esMismoUsuario = false;
                $sampleDuplicadoDe = null;

                foreach ($duplicados as $dup) {
                    if ((int) $dup[SamplesCols::CREADOR_ID] === $creadorId) {
                        $esMismoUsuario = true;
                        $sampleDuplicadoDe = $dup;
                        break;
                    }
                }

                if ($esMismoUsuario && $sampleDuplicadoDe) {
                    /*
                     * Duplicado del mismo usuario: NO eliminar archivos.
                     * Marcar como en_supervision y crear registro en duplicados_pendientes
                     * para que admin pueda escuchar ambos audios y decidir.
                     */
                    $actualizaciones['estado'] = SamplesEnums::ESTADO_EN_SUPERVISION;
                    $actualizaciones['publicado_at'] = \date('Y-m-d H:i:s');
                    PipelineAudioHelpers::actualizarSample($sampleId, $actualizaciones);

                    try {
                        DuplicadosPendientesRepository::insertarRegistro([
                            'sample_original_id' => (int) $sampleDuplicadoDe[SamplesCols::ID],
                            'sample_duplicado_id' => $sampleId,
                            'tipo' => DuplicadosPendientesEnums::TIPO_MISMO_USUARIO,
                        ]);
                    } catch (\Throwable $e) {
                        KamplesLogger::error('Pipeline: Error creando registro duplicado mismo usuario', [
                            'sampleId' => $sampleId,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    KamplesLogger::warning('Pipeline: Duplicado mismo usuario — en supervision (archivos conservados)', [
                        'sampleNuevo' => $sampleId,
                        'sampleExistente' => (int) $sampleDuplicadoDe[SamplesCols::ID],
                        'creadorId' => $creadorId,
                    ]);
                    return;
                }

                /* Duplicado de otro usuario: crear flag de moderacion */
                $primerDup = $duplicados[0];

                try {
                    DuplicadosPendientesRepository::insertarRegistro([
                        'sample_original_id' => (int) $primerDup[SamplesCols::ID],
                        'sample_duplicado_id' => $sampleId,
                        'tipo' => DuplicadosPendientesEnums::TIPO_CROSS_USUARIO,
                    ]);
                } catch (\Throwable $e) {
                    KamplesLogger::error('Pipeline: Error creando registro duplicado', [
                        'sampleId' => $sampleId,
                        'error' => $e->getMessage(),
                    ]);
                }

                $actualizaciones['estado'] = SamplesEnums::ESTADO_EN_SUPERVISION;
                $actualizaciones['publicado_at'] = \date('Y-m-d H:i:s');
                PipelineAudioHelpers::actualizarSample($sampleId, $actualizaciones);

                KamplesLogger::warning('Pipeline: Duplicado cross-usuario — en supervision', [
                    'sampleNuevo' => $sampleId,
                    'sampleOriginal' => (int) $primerDup[SamplesCols::ID],
                ]);

                try {
                    DeduplicadorAudio::programarCalculo($sampleId);
                } catch (\Throwable $e) {
                    KamplesLogger::error('Pipeline: Error programando hash perceptual', [
                        'sampleId' => $sampleId, 'error' => $e->getMessage(),
                    ]);
                }

                return;
            }
            } /* fin if (!$omitirDedup) */
        }

        /* Paso 3: Análisis creativo — tags, emociones, etc. con IA (Gemini + Groq fallback) */
        $contextoTecnico = [
            'bpm'      => $analisisTecnico['bpm'],
            'key'      => $analisisTecnico['key'],
            'escala'   => $analisisTecnico['escala'],
            'duracion' => $duracion ?? 0,
            'tags'     => $tagsUsuario,
        ];

        /*
         * C184.10 + QQ142: Optimización IA — enviar MP3 recortado a 10s en vez del WAV original.
         * QQ142: Reducido de 20s a 10s para ahorrar audio-seconds de Whisper.
         * 10s son suficientes para extraer genero, emocion e instrumentos.
         */
        $rutaAudioParaIA = $rutaArchivo;
        $audioRecortado = false;
        $mp3TemporalIA = null;

        if ($ffmpeg) {
            $limiteSegundosIA = 10;
            $mp3TemporalIA = $directorio . '/tmp_ia_' . $idCorto . '.mp3';

            /* Generar MP3 optimizado de los primeros 10s para IA */
            try {
                $cmdIA = \sprintf(
                    '%s -y -i %s -t %d -codec:a libmp3lame -b:a 128k -ac 1 -ar 22050 %s 2>&1',
                    \escapeshellarg($ffmpeg),
                    \escapeshellarg($rutaArchivo),
                    $limiteSegundosIA,
                    \escapeshellarg($mp3TemporalIA)
                );

                \exec($cmdIA, $outputIA, $exitCodeIA);

                if ($exitCodeIA === 0 && \file_exists($mp3TemporalIA)) {
                    $rutaAudioParaIA = $mp3TemporalIA;
                    $audioRecortado = ($duracion ?? 0) > $limiteSegundosIA;
                    KamplesLogger::info('Pipeline: MP3 temporal para IA generado', [
                        'recortado' => $audioRecortado,
                        'tamano_original' => \filesize($rutaArchivo),
                        'tamano_mp3' => \filesize($mp3TemporalIA),
                    ]);
                } else {
                    /* Fallback al archivo original si falla la conversión */
                    KamplesLogger::warning('Pipeline: No se pudo generar MP3 temporal para IA, usando original', [
                        'exitCode' => $exitCodeIA,
                    ]);
                    $mp3TemporalIA = null;
                }
            } catch (\Throwable $e) {
                KamplesLogger::error('Pipeline: error generando MP3 temporal para IA', [
                    'error' => $e->getMessage(),
                    'archivo' => \basename($rutaArchivo),
                ]);
                $mp3TemporalIA = null;
            }
        }

        /* Avisar a la IA si el audio fue recortado */
        if ($audioRecortado) {
            $contextoTecnico['nota_recorte'] = \sprintf(
                'Audio recortado a %ds para análisis (duración real: %.1fs)',
                $limiteSegundosIA ?? 20,
                $duracion ?? 0
            );
        }

        /*
         * C356: Resetear estado de rate limit antes de la llamada IA
         * para no arrastrar estado de operaciones previas en el mismo request.
         */
        GroqHttpClient::resetearEstadoRateLimit();

        $metadataIA = ServicioIA::analizarAudio($rutaAudioParaIA, $nombreOriginal, $descripcionUsuario, $contextoTecnico);

        /* Limpiar MP3 temporal */
        if ($mp3TemporalIA && \file_exists($mp3TemporalIA)) {
            try {
                \unlink($mp3TemporalIA);
            } catch (\Throwable $e) {
                KamplesLogger::warning('Pipeline: no se pudo eliminar MP3 temporal IA', ['error' => $e->getMessage()]);
            }
        }

        /*
         * C356: Si Groq devolvio rate limit (429), encolar para reproceso posterior.
         * El sample se publica igualmente con los datos tecnico que tenemos (BPM, key, waveform, etc.)
         * pero sin metadata creativa (tags, genero, carpeta, descripcion).
         * El cron ProcesadorColaIA reintentara el analisis IA mas tarde.
         */
        $iaEncolada = false;
        if ($metadataIA === null && GroqHttpClient::fueRateLimited()) {
            KamplesLogger::warning('Pipeline: IA rate-limited, encolando para reproceso', [
                'sampleId' => $sampleId,
                'retryAfter' => GroqHttpClient::obtenerRetryAfterSegundos(),
            ]);

            try {
                ColaProcesamientoIaRepository::encolar(
                    ColaProcesamientoIaEnums::TIPO_SAMPLE,
                    $sampleId,
                    ColaProcesamientoIaEnums::OPERACION_ANALISIS_AUDIO,
                    [
                        'rutaArchivo' => $rutaArchivo,
                        'nombreOriginal' => $nombreOriginal,
                        'descripcionUsuario' => $descripcionUsuario,
                        'tagsUsuario' => $tagsUsuario,
                        'contextoTecnico' => $contextoTecnico,
                        'retryAfterSugerido' => GroqHttpClient::obtenerRetryAfterSegundos(),
                    ]
                );
                $iaEncolada = true;
            } catch (\Throwable $e) {
                KamplesLogger::error('Pipeline: Error encolando en cola IA', [
                    'sampleId' => $sampleId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($metadataIA) {
            KamplesLogger::info('Pipeline: IA completada', ['tipo' => $metadataIA['tipo']]);

            /* Normalizar tipo — solo loop/oneshot permitidos */
            $tipoRaw = \strtolower(\str_replace([' ', '-'], '', $metadataIA['tipo'] ?? ''));
            $tiposValidos = ['loop', 'oneshot'];
            $actualizaciones['tipo'] = \in_array($tipoRaw, $tiposValidos, true) ? $tipoRaw : 'oneshot';

            /* Guardar toda la metadata creativa + confianza técnica en JSONB */
            $actualizaciones['metadata'] = \json_encode([
                'nombre_archivo_base'  => $metadataIA['nombre_archivo_base'],
                'tags'                 => $metadataIA['tags'],
                'tags_es'              => $metadataIA['tags_es'],
                'genero'               => $metadataIA['genero'],
                'emocion'              => $metadataIA['emocion'],
                'emocion_es'           => $metadataIA['emocion_es'],
                'instrumentos'         => $metadataIA['instrumentos'],
                'artista_vibes'        => $metadataIA['artista_vibes'],
                'descripcion_corta'    => $metadataIA['descripcion_corta'],
                'descripcion_corta_es' => $metadataIA['descripcion_corta_es'],
                'descripcion'          => $metadataIA['descripcion'],
                'descripcion_es'       => $metadataIA['descripcion_es'],
                'carpeta_primaria'     => $metadataIA['carpeta_primaria'] ?? SamplesRepository::CARPETA_DEFAULT,
                /* C289: Fallback 'General' si la IA devuelve null/vacio para carpeta_secundaria */
                'carpeta_secundaria'   => !empty($metadataIA['carpeta_secundaria']) ? $metadataIA['carpeta_secundaria'] : 'General',
                /* Copia inmutable de la clasificacion IA — no se modifica al mover manualmente */
                'ia_carpeta_primaria'  => $metadataIA['carpeta_primaria'] ?? SamplesRepository::CARPETA_DEFAULT,
                'ia_carpeta_secundaria' => !empty($metadataIA['carpeta_secundaria']) ? $metadataIA['carpeta_secundaria'] : 'General',
                'bpm_confianza'        => $analisisTecnico['bpm_confianza'],
                'key_confianza'        => $analisisTecnico['key_confianza'],
            ]);
        } elseif ($iaEncolada) {
            /*
             * C356: IA encolada por rate limit — metadata minima con datos tecnicos disponibles.
             * Marca ia_pendiente para que el frontend/sync sepan que falta el analisis creativo.
             * El ProcesadorColaIA actualizara esta metadata cuando se reprocese.
             */
            $actualizaciones['tipo'] = SamplesEnums::TIPO_ONESHOT;
            $actualizaciones['metadata'] = \json_encode([
                'ia_pendiente' => true,
                'ia_encolada_at' => \date('Y-m-d H:i:s'),
                'carpeta_primaria' => SamplesRepository::CARPETA_DEFAULT,
                'carpeta_secundaria' => 'General',
                'bpm_confianza' => $analisisTecnico['bpm_confianza'],
                'key_confianza' => $analisisTecnico['key_confianza'],
            ]);
        }

        /* Paso 4: Renombrar archivo con formato estandarizado + actualizar titulo y slug */
        $nuevoNombre = PipelineAudioHelpers::construirNombreArchivo(
            $metadataIA,
            $analisisTecnico,
            $idCorto,
            $extension
        );

        if ($nuevoNombre) {
            $nuevaRuta = $directorio . '/' . $nuevoNombre;
            if ($nuevaRuta !== $rutaArchivo && !\file_exists($nuevaRuta)) {
                if (\rename($rutaArchivo, $nuevaRuta)) {
                    $rutaArchivo = $nuevaRuta;
                    $actualizaciones['ruta_original'] = $nuevaRuta;
                    KamplesLogger::info('Pipeline: Archivo renombrado', ['nombre' => $nuevoNombre]);
                }
            }

            /*
             * Actualizar titulo y slug con el nombre generado por la IA.
             * El titulo se construye legible: "Sad Guitar Melody 90bpm Am"
             * El slug se genera con sanitize_title + idCorto.
             */
            if ($metadataIA && !empty($metadataIA['nombre_archivo_base'])) {
                $tituloIA = ucwords($metadataIA['nombre_archivo_base']);
                if ($analisisTecnico['bpm']) {
                    $tituloIA .= ' ' . $analisisTecnico['bpm'] . 'bpm';
                }
                if ($analisisTecnico['key']) {
                    $keyStr = $analisisTecnico['key'];
                    if ($analisisTecnico['escala'] === 'menor') $keyStr .= 'm';
                    $tituloIA .= ' ' . $keyStr;
                }
                $actualizaciones['titulo'] = $tituloIA;
                $actualizaciones['slug'] = \sanitize_title($tituloIA) . '-' . $idCorto;
                KamplesLogger::info('Pipeline: Titulo/slug actualizados por IA', [
                    'titulo' => $tituloIA,
                    'slug' => $actualizaciones['slug'],
                ]);
            }
        }

        /* Paso 5: Generar waveform peaks */
        $rutaWaveform = $directorio . '/' . $idCorto . '_waveform.json';
        if (ProcesadorFFmpeg::generarWaveformPeaks($rutaArchivo, $rutaWaveform, $ffmpeg)) {
            $actualizaciones['ruta_waveform'] = $rutaWaveform;
        }

        /* Paso 6: Generar MP3 optimizado (320kbps) */
        $rutaMp3 = $directorio . '/' . $idCorto . '_optimizado.mp3';
        if (ProcesadorFFmpeg::convertirAMp3($rutaArchivo, $rutaMp3, $ffmpeg)) {
            $actualizaciones['ruta_optimizada'] = $rutaMp3;
        }

        /* Paso 7: Generar preview (30s, 128kbps, fade out) */
        $rutaPreview = $directorio . '/' . $idCorto . '_preview.mp3';
        $duracionPreview = \min($duracion ?: 30, ProcesadorFFmpeg::PREVIEW_DURACION);
        if (ProcesadorFFmpeg::generarPreview($rutaArchivo, $rutaPreview, $duracionPreview, $ffmpeg)) {
            $actualizaciones['ruta_preview'] = $rutaPreview;
        }

        /* Paso 8: Activar sample en PostgreSQL (sin duplicados detectados — verificacion en paso 2.5) */
        $actualizaciones['estado'] = SamplesEnums::ESTADO_ACTIVO;
        $actualizaciones['publicado_at'] = \date('Y-m-d H:i:s');

        PipelineAudioHelpers::actualizarSample($sampleId, $actualizaciones);

        /* Paso 9: Generar embedding para el sistema de recomendación */
        try {
            GeneradorEmbeddings::guardarEmbedding($sampleId);
        } catch (\Throwable $e) {
            KamplesLogger::error('Pipeline: Error al generar embedding', [
                'sampleId' => $sampleId, 'error' => $e->getMessage()
            ]);
        }

        /* Invalidar cache de feeds globalmente al publicar nuevo sample */
        MotorRecomendacion::invalidarCacheGlobal();

        /* Paso 10: Programar cálculo de hash perceptual para deduplicación (background) */
        try {
            DeduplicadorAudio::programarCalculo($sampleId);
            KamplesLogger::info('Pipeline: Hash perceptual programado', ['sampleId' => $sampleId]);
        } catch (\Throwable $e) {
            KamplesLogger::error('Pipeline: Error programando hash', [
                'sampleId' => $sampleId, 'error' => $e->getMessage()
            ]);
        }

        KamplesLogger::info('Pipeline: Procesamiento completado', ['sampleId' => $sampleId, 'estado' => SamplesEnums::ESTADO_ACTIVO]);
    }
}
