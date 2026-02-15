<?php

/**
 * Kamples — Pipeline de procesamiento de audio
 *
 * Procesa un sample después de subirse:
 * 1. Generar preview MP3 (30s máx, normalizado)
 * 2. Generar waveform peaks JSON
 * 3. Calcular duración real
 * 4. Análisis IA con Gemini (BPM, key, tipo, etc.)
 * 5. Renombrar archivo con formato estandarizado
 * 6. Actualizar registro en PostgreSQL con toda la metadata
 * 7. Cambiar estado a 'activo'
 *
 * Se ejecuta sincrónicamente por ahora (TO-DO: mover a background con wp_schedule_single_event).
 * FFmpeg es opcional: si no está instalado, se omiten MP3/preview pero el resto funciona.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\Database\PostgresService;

class PipelineAudio
{
    private const PREVIEW_DURACION = 30; /* Segundos máximos del preview */
    private const WAVEFORM_BARRAS = 120; /* Número de peaks para el waveform */

    /*
     * Ejecuta el pipeline completo para un sample.
     *
     * @param int $sampleId ID del sample en PostgreSQL
     * @param string $rutaArchivo Ruta absoluta al archivo original
     * @param string $nombreOriginal Nombre original subido por el usuario
     * @param string $idCorto ID corto del sample (ej: "a3Kf9x2")
     */
    public static function procesar(int $sampleId, string $rutaArchivo, string $nombreOriginal, string $idCorto): void
    {
        error_log("[Kamples] PipelineAudio: Iniciando procesamiento para sample #{$sampleId}");

        $directorio = dirname($rutaArchivo);
        $extension = strtolower(pathinfo($rutaArchivo, PATHINFO_EXTENSION));
        $actualizaciones = [];

        /* 1. Calcular duración real del audio */
        $duracion = self::calcularDuracion($rutaArchivo);
        if ($duracion > 0) {
            $actualizaciones['duracion'] = $duracion;
        }

        /* 2. Análisis IA con Gemini */
        $metadataIA = ServicioIA::analizarAudio($rutaArchivo, $nombreOriginal);

        if ($metadataIA) {
            error_log("[Kamples] PipelineAudio: IA completada — tipo={$metadataIA['tipo']}, bpm={$metadataIA['bpm']}");

            $actualizaciones['bpm'] = $metadataIA['bpm'];
            $actualizaciones['key'] = $metadataIA['key'];
            $actualizaciones['escala'] = $metadataIA['escala'];
            $actualizaciones['tipo'] = $metadataIA['tipo'];
            $actualizaciones['metadata'] = json_encode([
                'genero'       => $metadataIA['genero'],
                'instrumentos' => $metadataIA['instrumentos'],
                'sentimiento'  => $metadataIA['sentimiento'],
                'descripcionIA' => $metadataIA['descripcion'],
            ]);

            /* 3. Renombrar archivo con formato estandarizado de la IA */
            if (!empty($metadataIA['nombreSugerido'])) {
                $nuevoNombre = self::construirNombreArchivo($metadataIA, $idCorto, $extension);
                $nuevaRuta = $directorio . '/' . $nuevoNombre;

                if ($nuevaRuta !== $rutaArchivo && !file_exists($nuevaRuta)) {
                    if (rename($rutaArchivo, $nuevaRuta)) {
                        $rutaArchivo = $nuevaRuta;
                        $actualizaciones['ruta_original'] = $nuevaRuta;

                        /* Actualizar URL pública */
                        $uploadDir = wp_upload_dir();
                        $rutaRelativa = str_replace($uploadDir['basedir'], '', $nuevaRuta);
                        $urlPublica = $uploadDir['baseurl'] . $rutaRelativa;
                        error_log("[Kamples] PipelineAudio: Archivo renombrado a {$nuevoNombre}");
                    }
                }
            }
        }

        /* 4. Generar waveform peaks */
        $rutaWaveform = $directorio . '/' . $idCorto . '_waveform.json';
        $peaks = self::generarWaveformPeaks($rutaArchivo, $rutaWaveform);
        if ($peaks) {
            $actualizaciones['ruta_waveform'] = $rutaWaveform;
        }

        /* 5. Generar MP3 optimizado y preview (requiere FFmpeg) */
        if (self::ffmpegDisponible()) {
            /* MP3 optimizado (320kbps) */
            $rutaMp3 = $directorio . '/' . $idCorto . '_optimizado.mp3';
            if (self::convertirAMp3($rutaArchivo, $rutaMp3)) {
                $actualizaciones['ruta_optimizada'] = $rutaMp3;
            }

            /* Preview (30s, 128kbps) */
            $rutaPreview = $directorio . '/' . $idCorto . '_preview.mp3';
            $duracionPreview = min($duracion ?: 30, self::PREVIEW_DURACION);
            if (self::generarPreview($rutaArchivo, $rutaPreview, $duracionPreview)) {
                $actualizaciones['ruta_preview'] = $rutaPreview;
            }
        } else {
            error_log('[Kamples] PipelineAudio: FFmpeg no disponible — MP3/preview omitidos');
            /* Sin FFmpeg, el original sirve como preview */
            $actualizaciones['ruta_preview'] = $rutaArchivo;
        }

        /* 6. Actualizar registro en PostgreSQL */
        $actualizaciones['estado'] = 'activo';
        $actualizaciones['publicado_at'] = date('Y-m-d H:i:s');

        self::actualizarSample($sampleId, $actualizaciones);

        error_log("[Kamples] PipelineAudio: Procesamiento completado para sample #{$sampleId}");
    }

    /*
     * Calcula la duración del audio en segundos.
     * Usa getID3 si está disponible, sino FFprobe, sino estimación.
     */
    private static function calcularDuracion(string $rutaArchivo): float
    {
        /* Intentar con FFprobe */
        if (self::ffmpegDisponible()) {
            $cmd = sprintf(
                'ffprobe -v quiet -show_entries format=duration -of csv=p=0 %s 2>&1',
                escapeshellarg($rutaArchivo)
            );
            $output = shell_exec($cmd);
            if ($output) {
                $duracion = (float) trim($output);
                if ($duracion > 0) return round($duracion, 2);
            }
        }

        /* Fallback: estimar por tamaño del archivo para WAV (PCM 16bit 44100) */
        $tamano = filesize($rutaArchivo);
        $ext = strtolower(pathinfo($rutaArchivo, PATHINFO_EXTENSION));

        if ($ext === 'wav' && $tamano > 44) {
            /* WAV PCM 16-bit stereo 44100Hz = ~176400 bytes/segundo */
            return round(($tamano - 44) / 176400, 2);
        }

        if ($ext === 'mp3' && $tamano > 0) {
            /* MP3 ~320kbps = ~40000 bytes/segundo */
            return round($tamano / 40000, 2);
        }

        return 0;
    }

    /*
     * Genera peaks de waveform analizando el archivo con PHP.
     * Lee el archivo WAV directamente para extraer amplitudes.
     * Para otros formatos, genera peaks uniformes como fallback.
     */
    private static function generarWaveformPeaks(string $rutaArchivo, string $rutaSalida): bool
    {
        $ext = strtolower(pathinfo($rutaArchivo, PATHINFO_EXTENSION));
        $peaks = [];

        if ($ext === 'wav') {
            $peaks = self::peaksDesdeWav($rutaArchivo);
        }

        /* Fallback: peaks aleatorios pero visualmente coherentes */
        if (empty($peaks)) {
            $peaks = self::peaksFallback();
        }

        $json = json_encode(['peaks' => $peaks, 'barras' => count($peaks)]);
        if (file_put_contents($rutaSalida, $json) !== false) {
            return true;
        }

        return false;
    }

    /*
     * Lee un archivo WAV y extrae peaks de amplitud para waveform.
     * Soporta PCM 16-bit mono/stereo.
     */
    private static function peaksDesdeWav(string $ruta): array
    {
        $handle = fopen($ruta, 'rb');
        if (!$handle) return [];

        /* Saltar header WAV (44 bytes estándar) */
        fseek($handle, 44);

        $tamano = filesize($ruta) - 44;
        if ($tamano <= 0) {
            fclose($handle);
            return [];
        }

        /* Leer datos crudos en bloques */
        $bytesPerSample = 2; /* 16-bit */
        $totalMuestras = intdiv($tamano, $bytesPerSample);
        $muestrasPorBarra = max(1, intdiv($totalMuestras, self::WAVEFORM_BARRAS));
        $peaks = [];

        for ($i = 0; $i < self::WAVEFORM_BARRAS; $i++) {
            $offset = 44 + ($i * $muestrasPorBarra * $bytesPerSample);
            if ($offset >= filesize($ruta)) break;

            fseek($handle, $offset);
            $max = 0;

            /* Muestrear un subconjunto del bloque para velocidad */
            $muestrasLeer = min($muestrasPorBarra, 1000);
            $paso = max(1, intdiv($muestrasPorBarra, $muestrasLeer));

            for ($j = 0; $j < $muestrasLeer; $j++) {
                $bytes = fread($handle, $bytesPerSample);
                if (strlen($bytes) < $bytesPerSample) break;

                $muestra = unpack('s', $bytes);
                $abs = abs($muestra[1] ?? 0);
                if ($abs > $max) $max = $abs;

                /* Saltar muestras según el paso */
                if ($paso > 1) {
                    fseek($handle, ($paso - 1) * $bytesPerSample, SEEK_CUR);
                }
            }

            /* Normalizar a 0-1 (16-bit max = 32768) */
            $peaks[] = round($max / 32768, 4);
        }

        fclose($handle);
        return $peaks;
    }

    /*
     * Genera peaks de fallback visualmente agradables.
     * Simula un waveform natural con variación suave.
     */
    private static function peaksFallback(): array
    {
        $peaks = [];
        $base = 0.4;

        for ($i = 0; $i < self::WAVEFORM_BARRAS; $i++) {
            $variacion = sin($i * 0.3) * 0.2 + (mt_rand(0, 100) / 500);
            $peaks[] = round(min(1, max(0.05, $base + $variacion)), 4);
        }

        return $peaks;
    }

    /*
     * Verifica si FFmpeg está disponible en el sistema.
     */
    private static function ffmpegDisponible(): bool
    {
        static $disponible = null;

        if ($disponible !== null) return $disponible;

        $output = shell_exec('ffmpeg -version 2>&1');
        $disponible = $output && str_contains($output, 'ffmpeg version');

        return $disponible;
    }

    /*
     * Convierte un archivo de audio a MP3 320kbps con FFmpeg.
     */
    private static function convertirAMp3(string $entrada, string $salida): bool
    {
        $cmd = sprintf(
            'ffmpeg -y -i %s -codec:a libmp3lame -b:a 320k -ar 44100 %s 2>&1',
            escapeshellarg($entrada),
            escapeshellarg($salida)
        );

        exec($cmd, $output, $returnCode);
        return $returnCode === 0 && file_exists($salida);
    }

    /*
     * Genera un preview MP3 (primeros N segundos, 128kbps, fade out).
     */
    private static function generarPreview(string $entrada, string $salida, float $duracion): bool
    {
        $fadeStart = max(0, $duracion - 2);
        $cmd = sprintf(
            'ffmpeg -y -i %s -t %s -codec:a libmp3lame -b:a 128k -ar 44100 -af "afade=t=out:st=%s:d=2" %s 2>&1',
            escapeshellarg($entrada),
            $duracion,
            $fadeStart,
            escapeshellarg($salida)
        );

        exec($cmd, $output, $returnCode);
        return $returnCode === 0 && file_exists($salida);
    }

    /*
     * Construye nombre estandarizado para el archivo.
     * Formato: kamples_{tipo}_{genero}_{bpm}_{key}{escala}_{idCorto}.{ext}
     * Ejemplo: kamples_loop_trap_140_Cm_a3Kf9x2.wav
     */
    private static function construirNombreArchivo(array $metadata, string $idCorto, string $ext): string
    {
        $partes = ['kamples'];

        /* Tipo */
        $partes[] = $metadata['tipo'] ?? 'otro';

        /* Primer género */
        $genero = !empty($metadata['genero'][0])
            ? preg_replace('/[^a-zA-Z0-9]/', '', $metadata['genero'][0])
            : 'general';
        $partes[] = strtolower($genero);

        /* BPM */
        if ($metadata['bpm']) {
            $partes[] = (string) $metadata['bpm'];
        }

        /* Key + Escala */
        if ($metadata['key']) {
            $keyStr = str_replace('#', 's', $metadata['key']);
            if ($metadata['escala'] === 'menor') {
                $keyStr .= 'm';
            }
            $partes[] = $keyStr;
        }

        /* ID corto */
        $partes[] = $idCorto;

        return implode('_', $partes) . '.' . $ext;
    }

    /*
     * Actualiza el registro de un sample en PostgreSQL con los datos procesados.
     */
    private static function actualizarSample(int $sampleId, array $datos): void
    {
        $setClauses = [];
        $params = ['id' => $sampleId];

        foreach ($datos as $campo => $valor) {
            $setClauses[] = "{$campo} = :{$campo}";
            $params[$campo] = $valor;
        }

        if (empty($setClauses)) return;

        $sql = "UPDATE samples SET " . implode(', ', $setClauses) . " WHERE id = :id";

        try {
            PostgresService::ejecutar($sql, $params);
        } catch (\Exception $e) {
            error_log('[Kamples] PipelineAudio: Error actualizando sample — ' . $e->getMessage());
        }
    }
}
