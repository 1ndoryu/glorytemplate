<?php

/**
 * DetectorTonalidad — Detección de key + escala por análisis de señal.
 *
 * Algoritmo:
 * 1. Convertir a mono 4kHz PCM con FFmpeg
 * 2. Calcular energía por clase de pitch con Goertzel (octavas 2-5)
 * 3. Correlacionar con perfiles Krumhansl-Schmuckler (mayor y menor)
 * 4. La correlación más alta indica la tonalidad
 *
 * A08: Extraído de AnalizadorAudio (SRP).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;

class DetectorTonalidad
{
    private const SAMPLE_RATE = 4000;
    private const DURACION_MAX = 20;

    /*
     * Perfiles de tonalidad de Krumhansl-Schmuckler.
     * Distribución esperada de energía por clase de pitch.
     * Índice: 0=C, 1=C#, 2=D, 3=D#, 4=E, 5=F, 6=F#, 7=G, 8=G#, 9=A, 10=A#, 11=B
     */
    private const PERFIL_MAYOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    private const PERFIL_MENOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

    private const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    /*
     * Frecuencias base por nota para la octava 2 (para Goertzel).
     * Las octavas superiores se calculan multiplicando x2, x4, etc.
     */
    private const FRECUENCIAS_BASE = [
        65.41,  /* C2 */
        69.30,  /* C#2 */
        73.42,  /* D2 */
        77.78,  /* D#2 */
        82.41,  /* E2 */
        87.31,  /* F2 */
        92.50,  /* F#2 */
        98.00,  /* G2 */
        103.83, /* G#2 */
        110.00, /* A2 */
        116.54, /* A#2 */
        123.47, /* B2 */
    ];

    /**
     * Detecta la tonalidad usando Goertzel + Krumhansl-Schmuckler.
     *
     * @param string $rutaArchivo Ruta absoluta al archivo de audio
     * @param string $ffmpegBin Ruta al binario de FFmpeg
     * @return array|null {key: string, escala: string, confianza: float} o null si falla
     */
    public static function detectar(string $rutaArchivo, string $ffmpegBin): ?array
    {
        /* Exportar a PCM mono 4kHz signed 16-bit LE */
        $tmpPcm = \tempnam(\sys_get_temp_dir(), 'kamples_key_') . '.pcm';

        try {
            $cmd = \sprintf(
                '%s -y -i %s -ac 1 -ar %d -f s16le -t %d %s 2>&1',
                \escapeshellarg($ffmpegBin),
                \escapeshellarg($rutaArchivo),
                self::SAMPLE_RATE,
                self::DURACION_MAX,
                \escapeshellarg($tmpPcm)
            );

            \exec($cmd, $output, $returnCode);

            if ($returnCode !== 0 || !\file_exists($tmpPcm)) {
                KamplesLogger::error('DetectorTonalidad: Error exportando PCM');
                return null;
            }

            /* Leer datos PCM signed 16-bit */
            $datosRaw = \file_get_contents($tmpPcm);

            if (!$datosRaw || \strlen($datosRaw) < 2000) {
                return null;
            }

        $muestras = \array_values(\unpack('s*', $datosRaw));
        $totalMuestras = \count($muestras);

        /* Normalizar a -1.0 .. 1.0 */
        for ($i = 0; $i < $totalMuestras; $i++) {
            $muestras[$i] = $muestras[$i] / 32768.0;
        }

        /*
         * Calcular vector de chroma (12 clases de pitch).
         * Goertzel para energía en frecuencias target, octavas 2-4.
         */
        $chroma = \array_fill(0, 12, 0.0);
        $nyquist = self::SAMPLE_RATE / 2;

        for ($nota = 0; $nota < 12; $nota++) {
            $energiaTotal = 0.0;
            for ($octava = 0; $octava < 4; $octava++) {
                $frecuencia = self::FRECUENCIAS_BASE[$nota] * \pow(2, $octava);
                if ($frecuencia >= $nyquist) continue;

                $energiaTotal += self::goertzel($muestras, $totalMuestras, $frecuencia, self::SAMPLE_RATE);
            }
            $chroma[$nota] = $energiaTotal;
        }

        /* Normalizar chroma */
        $maxChroma = \max($chroma) ?: 1.0;
        for ($i = 0; $i < 12; $i++) {
            $chroma[$i] /= $maxChroma;
        }

        /* Correlacionar con perfiles Krumhansl-Schmuckler para las 24 tonalidades */
        $mejorKey = null;
        $mejorEscala = null;
        $mejorCorrelacion = -INF;

        for ($rotacion = 0; $rotacion < 12; $rotacion++) {
            $nota = self::NOTAS[$rotacion];

            /* Rotar chroma para alinear con la tónica candidata */
            $chromaRotado = [];
            for ($i = 0; $i < 12; $i++) {
                $chromaRotado[] = $chroma[($i + $rotacion) % 12];
            }

            /* Correlación con perfil mayor */
            $corrMayor = self::correlacionPearson($chromaRotado, self::PERFIL_MAYOR);
            if ($corrMayor > $mejorCorrelacion) {
                $mejorCorrelacion = $corrMayor;
                $mejorKey = $nota;
                $mejorEscala = 'mayor';
            }

            /* Correlación con perfil menor */
            $corrMenor = self::correlacionPearson($chromaRotado, self::PERFIL_MENOR);
            if ($corrMenor > $mejorCorrelacion) {
                $mejorCorrelacion = $corrMenor;
                $mejorKey = $nota;
                $mejorEscala = 'menor';
            }
        }

        if (!$mejorKey) {
            return null;
        }

        /* Confianza basada en la correlación (0-1) */
        $confianza = \max(0.0, \min(1.0, ($mejorCorrelacion + 1) / 2));

            return [
                'key' => $mejorKey,
                'escala' => $mejorEscala,
                'confianza' => \round($confianza, 2),
            ];
        } catch (\Throwable $e) {
            KamplesLogger::error('DetectorTonalidad: ' . $e->getMessage());
            return null;
        } finally {
            if (\file_exists($tmpPcm)) {
                \unlink($tmpPcm);
            }
        }
    }

    /**
     * Algoritmo de Goertzel para detectar energía de una frecuencia específica.
     * Más eficiente que FFT completa cuando se buscan pocas frecuencias.
     */
    private static function goertzel(array $muestras, int $totalMuestras, float $frecuencia, int $sampleRate): float
    {
        $blockSize = \min($totalMuestras, \max(512, \intval($sampleRate / $frecuencia) * 4));
        $k = \round($blockSize * $frecuencia / $sampleRate);
        $w = (2.0 * M_PI * $k) / $blockSize;
        $coeff = 2.0 * \cos($w);

        $energiaTotal = 0.0;
        $bloques = 0;

        for ($offset = 0; $offset + $blockSize <= $totalMuestras; $offset += $blockSize) {
            $s1 = 0.0;
            $s2 = 0.0;

            for ($i = 0; $i < $blockSize; $i++) {
                $s0 = $muestras[$offset + $i] + $coeff * $s1 - $s2;
                $s2 = $s1;
                $s1 = $s0;
            }

            $power = $s1 * $s1 + $s2 * $s2 - $coeff * $s1 * $s2;
            $energiaTotal += \max(0.0, $power);
            $bloques++;
        }

        return $bloques > 0 ? $energiaTotal / $bloques : 0.0;
    }

    /**
     * Correlación de Pearson entre dos vectores.
     * 1 = perfecta, 0 = ninguna, -1 = inversa.
     */
    private static function correlacionPearson(array $x, array $y): float
    {
        $n = \min(\count($x), \count($y));
        if ($n === 0) return 0.0;

        $sumX = 0.0;
        $sumY = 0.0;
        $sumXY = 0.0;
        $sumX2 = 0.0;
        $sumY2 = 0.0;

        for ($i = 0; $i < $n; $i++) {
            $sumX += $x[$i];
            $sumY += $y[$i];
            $sumXY += $x[$i] * $y[$i];
            $sumX2 += $x[$i] * $x[$i];
            $sumY2 += $y[$i] * $y[$i];
        }

        $denominador = \sqrt(($n * $sumX2 - $sumX * $sumX) * ($n * $sumY2 - $sumY * $sumY));

        if ($denominador == 0) return 0.0;

        return ($n * $sumXY - $sumX * $sumY) / $denominador;
    }
}
