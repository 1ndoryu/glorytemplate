<?php

/**
 * PipelineAudio — Orquestador del pipeline de procesamiento de audio
 *
 * Procesa un sample después de subirse:
 * 1. Verificar FFmpeg (FFmpegDetector)
 * 2. Duración real (ProcesadorFFmpeg)
 * 3. Análisis técnico: BPM + key (AnalizadorAudio)
 * 4. Análisis creativo: tags, emociones (ServicioIA)
 * 5. Waveform peaks + MP3 + preview (ProcesadorFFmpeg)
 * 6. Renombrar + actualizar PostgreSQL
 *
 * A12: Refactorizado — FFmpeg detection en FFmpegDetector, audio ops en ProcesadorFFmpeg.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\LogIA as KamplesLogger;
use App\Kamples\Api\FFmpegDetector;
use App\Kamples\Api\ProcesadorFFmpeg;

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
    public static function procesar(int $sampleId, string $rutaArchivo, string $nombreOriginal, string $idCorto, string $descripcionUsuario = '', array $tagsUsuario = []): void
    {
        KamplesLogger::info("Pipeline: Iniciando procesamiento", [
            'sampleId' => $sampleId,
            'archivo' => \basename($rutaArchivo),
            'idCorto' => $idCorto,
            'tagsCount' => \count($tagsUsuario),
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

        /* Paso 3: Análisis creativo — tags, emociones, etc. con IA (Gemini + Groq fallback) */
        $contextoTecnico = [
            'bpm'      => $analisisTecnico['bpm'],
            'key'      => $analisisTecnico['key'],
            'escala'   => $analisisTecnico['escala'],
            'duracion' => $duracion ?? 0,
            'tags'     => $tagsUsuario,
        ];

        /*
         * C184.10: Optimización IA — enviar MP3 recortado a 20s en vez del WAV original.
         * Ahorra ~90% de tokens para audios largos.
         */
        $rutaAudioParaIA = $rutaArchivo;
        $audioRecortado = false;
        $mp3TemporalIA = null;

        if ($ffmpeg) {
            $limiteSegundosIA = 20;
            $mp3TemporalIA = $directorio . '/tmp_ia_' . $idCorto . '.mp3';

            /* Generar MP3 optimizado de los primeros 20s para IA */
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
        }

        /* Avisar a la IA si el audio fue recortado */
        if ($audioRecortado) {
            $contextoTecnico['nota_recorte'] = \sprintf(
                'Audio recortado a %ds para análisis (duración real: %.1fs)',
                $limiteSegundosIA ?? 20,
                $duracion ?? 0
            );
        }

        $metadataIA = ServicioIA::analizarAudio($rutaAudioParaIA, $nombreOriginal, $descripcionUsuario, $contextoTecnico);

        /* Limpiar MP3 temporal */
        if ($mp3TemporalIA && \file_exists($mp3TemporalIA)) {
            @\unlink($mp3TemporalIA);
        }

        if ($metadataIA) {
            KamplesLogger::info('Pipeline: IA completada', ['tipo' => $metadataIA['tipo']]);

            /* Normalizar tipo para cumplir CHECK constraint (loop|oneshot|fx|vocal|stem|otro) */
            $tipoRaw = \strtolower(\str_replace([' ', '-'], '', $metadataIA['tipo'] ?? ''));
            $tiposValidos = ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'];
            $actualizaciones['tipo'] = \in_array($tipoRaw, $tiposValidos, true) ? $tipoRaw : 'otro';

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
                'carpeta_primaria'     => $metadataIA['carpeta_primaria'] ?? 'Samples',
                'carpeta_secundaria'   => $metadataIA['carpeta_secundaria'] ?? null,
                'bpm_confianza'        => $analisisTecnico['bpm_confianza'],
                'key_confianza'        => $analisisTecnico['key_confianza'],
            ]);
        }

        /* Paso 4: Renombrar archivo con formato estandarizado + actualizar titulo y slug */
        $nuevoNombre = self::construirNombreArchivo(
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

        /* Paso 8: Activar sample en PostgreSQL */
        $actualizaciones['estado'] = 'activo';
        $actualizaciones['publicado_at'] = \date('Y-m-d H:i:s');

        self::actualizarSample($sampleId, $actualizaciones);

        /* Paso 9: Generar embedding para el sistema de recomendación */
        try {
            \App\Kamples\Services\GeneradorEmbeddings::guardarEmbedding($sampleId);
        } catch (\Throwable $e) {
            KamplesLogger::error('Pipeline: Error al generar embedding', [
                'sampleId' => $sampleId, 'error' => $e->getMessage()
            ]);
        }

        /* Invalidar cache de feeds globalmente al publicar nuevo sample */
        \App\Kamples\Services\MotorRecomendacion::invalidarCacheGlobal();

        /* Paso 10: Programar cálculo de hash perceptual para deduplicación (background) */
        try {
            \App\Kamples\Services\DeduplicadorAudio::programarCalculo($sampleId);
            KamplesLogger::info('Pipeline: Hash perceptual programado', ['sampleId' => $sampleId]);
        } catch (\Throwable $e) {
            KamplesLogger::error('Pipeline: Error programando hash', [
                'sampleId' => $sampleId, 'error' => $e->getMessage()
            ]);
        }

        KamplesLogger::info('Pipeline: Procesamiento completado', ['sampleId' => $sampleId, 'estado' => 'activo']);
    }

    /*
     * Construye nombre estandarizado para el archivo.
     * Formato: kamples_{tipo}_{nombre_base}_{bpm}_{key}_{idCorto}.{ext}
     * Ejemplo: kamples_loop_sad_guitar_melody_90_Am_a3Kf9x2.wav
     *
     * Combina datos creativos de la IA + datos técnicos del analizador.
     */
    private static function construirNombreArchivo(?array $metadataIA, array $analisisTecnico, string $idCorto, string $ext): ?string
    {
        if (!$metadataIA || empty($metadataIA['nombre_archivo_base'])) {
            return null;
        }

        /*
         * C283: Estructura mejorada de nombre de archivo.
         * Formato: Instrumento - Genero - Tono - BPM - Nombre - kamples - id.ext
         * Campos ausentes se omiten. Mejora el ordenamiento alfabético.
         */
        $partes = [];

        /* Instrumento principal (primer elemento del array de instrumentos IA) */
        $instrumentos = $metadataIA['instrumentos'] ?? [];
        if (!empty($instrumentos) && \is_array($instrumentos)) {
            $inst = \preg_replace('/[^a-zA-Z0-9]/', '', \ucfirst(\strtolower($instrumentos[0])));
            if (!empty($inst)) $partes[] = $inst;
        }

        /* Género principal (primer elemento del array de género IA) */
        $generos = $metadataIA['genero'] ?? [];
        if (!empty($generos) && \is_array($generos)) {
            $gen = \preg_replace('/[^a-zA-Z0-9\-]/', '', \ucfirst(\strtolower($generos[0])));
            if (!empty($gen)) $partes[] = $gen;
        }

        /* Tono: Key + Escala (del analizador técnico) */
        if (!empty($analisisTecnico['key'])) {
            $keyStr = \str_replace('#', 's', $analisisTecnico['key']);
            if ($analisisTecnico['escala'] === 'menor') {
                $keyStr .= 'm';
            }
            $partes[] = $keyStr;
        }

        /* BPM (del analizador técnico) */
        if (!empty($analisisTecnico['bpm'])) {
            $partes[] = (string) $analisisTecnico['bpm'] . 'bpm';
        }

        /* Nombre base descriptivo (de la IA) */
        $nombreBase = $metadataIA['nombre_archivo_base'];
        $nombreBase = \preg_replace('/[^a-zA-Z0-9\s]/', '', $nombreBase);
        $nombreBase = \str_replace(' ', '-', \trim(\strtolower($nombreBase)));
        if (!empty($nombreBase)) {
            $partes[] = $nombreBase;
        }

        /* Sufijo: kamples + ID corto */
        $partes[] = 'kamples';
        $partes[] = $idCorto;

        return \implode('-', $partes) . '.' . $ext;
    }

    /*
     * Actualiza el registro de un sample en PostgreSQL con los datos procesados.
     * Detecta columnas JSONB para aplicar cast explícito.
     */
    private static function actualizarSample(int $sampleId, array $datos): void
    {
        /* S40 fix: whitelist de columnas permitidas (defensa contra SQL injection por keys dinámicas) */
        $columnasPermitidas = [
            'duracion', 'bpm', 'key', 'escala', 'tipo', 'metadata',
            'ruta_original', 'ruta_waveform', 'ruta_optimizada', 'ruta_preview',
            'estado', 'publicado_at', 'titulo', 'slug', 'tags',
            'nombre_archivo', 'formato', 'waveform_peaks',
        ];
        $columnasJsonb = ['metadata', 'media_metadata', 'tags_ia'];
        $setClauses = [];
        $params = ['id' => $sampleId];

        foreach ($datos as $campo => $valor) {
            if (!\in_array($campo, $columnasPermitidas, true) && !\in_array($campo, $columnasJsonb, true)) {
                KamplesLogger::warning('Pipeline: columna no permitida ignorada', ['campo' => $campo]);
                continue;
            }
            /* Cast explícito para JSONB — PDO native prepares envía como text sin esto */
            if (\in_array($campo, $columnasJsonb, true)) {
                $setClauses[] = "{$campo} = :{$campo}::jsonb";
            } else {
                $setClauses[] = "{$campo} = :{$campo}";
            }
            $params[$campo] = $valor;
        }

        if (empty($setClauses)) return;

        $sql = "UPDATE samples SET " . \implode(', ', $setClauses) . " WHERE id = :id";

        try {
            SamplesRepository::ejecutar($sql, $params);
        } catch (\Exception $e) {
            KamplesLogger::error('Pipeline: Error actualizando sample en DB', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
                'sql' => $sql,
            ]);
        }
    }
}
