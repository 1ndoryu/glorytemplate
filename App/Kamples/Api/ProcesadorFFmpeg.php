<?php

/**
 * ProcesadorFFmpeg — Operaciones de audio que usan FFmpeg
 *
 * Extraído de PipelineAudio.php (A12).
 * Agrupa: duración, waveform peaks, conversión a MP3 y generación de preview.
 * Todos los métodos reciben el binario FFmpeg como parámetro (sin estado compartido).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;

class ProcesadorFFmpeg
{
    public const PREVIEW_DURACION = 30;
    public const WAVEFORM_BARRAS = 120;

    /**
     * Calcula la duración del audio con FFprobe.
     * Fallback: estima por tamaño de archivo (WAV/MP3).
     */
    public static function calcularDuracion(string $rutaArchivo, string $ffprobeBin): float
    {
        try {
            $cmd = \sprintf(
                '%s -v quiet -show_entries format=duration -of csv=p=0 %s 2>&1',
                \escapeshellarg($ffprobeBin),
                \escapeshellarg($rutaArchivo)
            );
            $output = \shell_exec($cmd);
            if ($output) {
                $duracion = (float) \trim($output);
                if ($duracion > 0) return \round($duracion, 2);
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('ProcesadorFFmpeg: error calculando duración', ['error' => $e->getMessage()]);
        }

        /* Fallback: estimar por tamaño */
        $tamano = \filesize($rutaArchivo);
        $ext = \strtolower(\pathinfo($rutaArchivo, PATHINFO_EXTENSION));

        if ($ext === 'wav' && $tamano > 44) {
            return \round(($tamano - 44) / 176400, 2);
        }
        if ($ext === 'mp3' && $tamano > 0) {
            return \round($tamano / 40000, 2);
        }

        return 0;
    }

    /**
     * Genera peaks de waveform usando FFmpeg para convertir a PCM + PHP para analizar.
     * Funciona con cualquier formato de audio.
     */
    public static function generarWaveformPeaks(string $rutaArchivo, string $rutaSalida, string $ffmpegBin): bool
    {
        $tmpPcm = \tempnam(\sys_get_temp_dir(), 'kamples_wf_') . '.pcm';

        try {
            $cmd = \sprintf(
                '%s -y -i %s -ac 1 -ar 8000 -f s16le %s 2>&1',
                \escapeshellarg($ffmpegBin),
                \escapeshellarg($rutaArchivo),
                \escapeshellarg($tmpPcm)
            );

            \exec($cmd, $output, $returnCode);

            if ($returnCode !== 0 || !\file_exists($tmpPcm)) {
                $peaks = self::peaksFallback();
                $json = \json_encode(['peaks' => $peaks, 'barras' => \count($peaks)]);
                \file_put_contents($rutaSalida, $json);
                return true;
            }

            $datosRaw = \file_get_contents($tmpPcm);

            if (!$datosRaw || \strlen($datosRaw) < 200) {
                $peaks = self::peaksFallback();
                $json = \json_encode(['peaks' => $peaks, 'barras' => \count($peaks)]);
                \file_put_contents($rutaSalida, $json);
                return true;
            }

            $muestras = \unpack('s*', $datosRaw);
            $muestras = \array_values($muestras);
            $totalMuestras = \count($muestras);
            $muestrasPorBarra = \max(1, \intdiv($totalMuestras, self::WAVEFORM_BARRAS));
            $peaks = [];

            for ($i = 0; $i < self::WAVEFORM_BARRAS; $i++) {
                $inicio = $i * $muestrasPorBarra;
                if ($inicio >= $totalMuestras) break;

                $max = 0;
                $fin = \min($inicio + $muestrasPorBarra, $totalMuestras);

                $paso = \max(1, \intdiv($fin - $inicio, 500));
                for ($j = $inicio; $j < $fin; $j += $paso) {
                    $abs = \abs($muestras[$j]);
                    if ($abs > $max) $max = $abs;
                }

                $peaks[] = \round($max / 32768, 4);
            }

            $json = \json_encode(['peaks' => $peaks, 'barras' => \count($peaks)]);
            \file_put_contents($rutaSalida, $json);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ProcesadorFFmpeg: error generando waveform', ['error' => $e->getMessage()]);
            /* Fallback en caso de error inesperado */
            $peaks = self::peaksFallback();
            $json = \json_encode(['peaks' => $peaks, 'barras' => \count($peaks)]);
            \file_put_contents($rutaSalida, $json);
            return true;
        } finally {
            if (\file_exists($tmpPcm)) {
                \unlink($tmpPcm);
            }
        }
    }

    /**
     * Genera peaks de fallback visualmente agradables (seno + ruido).
     */
    private static function peaksFallback(): array
    {
        $peaks = [];
        $base = 0.4;
        for ($i = 0; $i < self::WAVEFORM_BARRAS; $i++) {
            $variacion = sin($i * 0.3) * 0.2 + (\mt_rand(0, 100) / 500);
            $peaks[] = \round(\min(1, \max(0.05, $base + $variacion)), 4);
        }
        return $peaks;
    }

    /**
     * Convierte un archivo de audio a MP3 320kbps con FFmpeg.
     */
    public static function convertirAMp3(string $entrada, string $salida, string $ffmpegBin): bool
    {
        try {
            $cmd = \sprintf(
                '%s -y -i %s -codec:a libmp3lame -b:a 320k -ar 44100 %s 2>&1',
                \escapeshellarg($ffmpegBin),
                \escapeshellarg($entrada),
                \escapeshellarg($salida)
            );

            \exec($cmd, $output, $returnCode);
            return $returnCode === 0 && \file_exists($salida);
        } catch (\Throwable $e) {
            KamplesLogger::error('ProcesadorFFmpeg: error convirtiendo a MP3', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Genera un preview MP3 (primeros N segundos, 128kbps, fade out de 2s).
     */
    public static function generarPreview(string $entrada, string $salida, float $duracion, string $ffmpegBin): bool
    {
        try {
            $fadeStart = \max(0, $duracion - 2);
            $cmd = \sprintf(
                '%s -y -i %s -t %s -codec:a libmp3lame -b:a 128k -ar 44100 -af %s %s 2>&1',
                \escapeshellarg($ffmpegBin),
                \escapeshellarg($entrada),
                \escapeshellarg((string) \round($duracion, 2)),
                \escapeshellarg('afade=t=out:st=' . \round($fadeStart, 2) . ':d=2'),
                \escapeshellarg($salida)
            );

            \exec($cmd, $output, $returnCode);
            return $returnCode === 0 && \file_exists($salida);
        } catch (\Throwable $e) {
            KamplesLogger::error('ProcesadorFFmpeg: error generando preview', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
