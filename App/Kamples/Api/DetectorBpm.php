<?php

/**
 * DetectorBpm — Detección de BPM por análisis de señal.
 *
 * Algoritmo:
 * 1. Convertir a mono 8kHz PCM con FFmpeg
 * 2. Calcular energía por ventana temporal
 * 3. Detectar onsets (incrementos significativos de energía)
 * 4. Autocorrelacionar la función de onset
 * 5. Encontrar el pico dominante → mapear a BPM
 *
 * A08: Extraído de AnalizadorAudio (SRP).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;

class DetectorBpm
{
    private const SAMPLE_RATE = 8000;
    private const DURACION_MAX = 30;
    private const FRAME_MS = 50;
    private const HOP_MS = 25;
    public const BPM_MIN = 60;
    public const BPM_MAX = 200;

    /**
     * Detecta BPM usando onset detection + autocorrelación.
     *
     * @param string $rutaArchivo Ruta absoluta al archivo de audio
     * @param string $ffmpegBin Ruta al binario de FFmpeg
     * @return array|null {bpm: int, confianza: float} o null si falla
     */
    public static function detectar(string $rutaArchivo, string $ffmpegBin): ?array
    {
        /* Exportar a PCM mono 8kHz float32 little-endian con FFmpeg */
        $tmpPcm = \tempnam(\sys_get_temp_dir(), 'kamples_bpm_') . '.pcm';

        $cmd = \sprintf(
            '%s -y -i %s -ac 1 -ar %d -f f32le -t %d %s 2>&1',
            \escapeshellarg($ffmpegBin),
            \escapeshellarg($rutaArchivo),
            self::SAMPLE_RATE,
            self::DURACION_MAX,
            \escapeshellarg($tmpPcm)
        );

        \exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !\file_exists($tmpPcm)) {
            KamplesLogger::error('DetectorBpm: Error exportando PCM');
            @\unlink($tmpPcm);
            return null;
        }

        /* Leer datos PCM float32 */
        $datos = \file_get_contents($tmpPcm);
        @\unlink($tmpPcm);

        if (!$datos || \strlen($datos) < 4000) {
            return null;
        }

        $muestras = \array_values(\unpack('f*', $datos));
        $totalMuestras = \count($muestras);

        /* Calcular energía por ventana */
        $frameSamples = \intdiv(self::SAMPLE_RATE * self::FRAME_MS, 1000);
        $hopSamples = \intdiv(self::SAMPLE_RATE * self::HOP_MS, 1000);
        $energia = [];

        for ($pos = 0; $pos + $frameSamples <= $totalMuestras; $pos += $hopSamples) {
            $sum = 0.0;
            for ($j = 0; $j < $frameSamples; $j++) {
                $val = $muestras[$pos + $j];
                $sum += $val * $val;
            }
            $energia[] = \sqrt($sum / $frameSamples);
        }

        $numFrames = \count($energia);
        if ($numFrames < 20) {
            return null;
        }

        /* Calcular función de onset (diferenciación + half-wave rectification) */
        $onsets = [0.0];
        for ($i = 1; $i < $numFrames; $i++) {
            $diff = $energia[$i] - $energia[$i - 1];
            $onsets[] = \max(0.0, $diff);
        }

        /* Normalizar onsets */
        $maxOnset = \max($onsets) ?: 1.0;
        for ($i = 0; $i < $numFrames; $i++) {
            $onsets[$i] /= $maxOnset;
        }

        /*
         * Autocorrelación para detectar periodicidad.
         * lag (frames) = 60 / BPM / (hop_ms / 1000)
         */
        $hopSegundos = self::HOP_MS / 1000.0;
        $lagMin = \intval(60.0 / self::BPM_MAX / $hopSegundos);
        $lagMax = \intval(60.0 / self::BPM_MIN / $hopSegundos);
        $lagMax = \min($lagMax, \intdiv($numFrames, 2));

        if ($lagMin >= $lagMax) {
            return null;
        }

        $correlaciones = [];

        for ($lag = $lagMin; $lag <= $lagMax; $lag++) {
            $suma = 0.0;
            $count = 0;
            for ($i = 0; $i + $lag < $numFrames; $i++) {
                $suma += $onsets[$i] * $onsets[$i + $lag];
                $count++;
            }
            $correlaciones[$lag] = $count > 0 ? $suma / $count : 0.0;
        }

        if (empty($correlaciones)) {
            return null;
        }

        /* Encontrar el lag con mayor correlación */
        $mejorLag = \array_keys($correlaciones, \max($correlaciones))[0];
        $mejorCorrelacion = $correlaciones[$mejorLag];

        /* Calcular BPM desde el lag */
        $bpm = \round(60.0 / ($mejorLag * $hopSegundos));

        /* Calcular confianza: relación entre el pico y la media */
        $mediaCorrelacion = \array_sum($correlaciones) / \count($correlaciones);
        $confianza = $mediaCorrelacion > 0 ? \min(1.0, $mejorCorrelacion / ($mediaCorrelacion * 3)) : 0.0;

        /* Validar rango */
        if ($bpm < self::BPM_MIN || $bpm > self::BPM_MAX) {
            return null;
        }

        return [
            'bpm' => (int) $bpm,
            'confianza' => \round($confianza, 2),
        ];
    }
}
