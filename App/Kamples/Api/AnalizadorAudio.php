<?php

/**
 * Kamples — Analizador técnico de audio
 *
 * Detecta BPM y tonalidad (key + escala) usando FFmpeg + algoritmos PHP.
 * NO usa IA: análisis puramente técnico con procesamiento de señal.
 *
 * BPM: Detección de onsets por energía + autocorrelación temporal.
 * Key: Algoritmo de Goertzel para chroma + perfiles Krumhansl-Schmuckler.
 *
 * Requiere FFmpeg instalado y accesible (ver FFmpegDetector).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\KamplesLogger;

class AnalizadorAudio
{
    /* Configuración de análisis BPM */
    private const BPM_SAMPLE_RATE = 8000;
    private const BPM_DURACION_MAX = 30; /* Analizar solo los primeros 30s */
    private const BPM_FRAME_MS = 50;     /* Ventana de energía en ms */
    private const BPM_HOP_MS = 25;       /* Salto entre ventanas */
    private const BPM_MIN = 60;
    private const BPM_MAX = 200;

    /* Configuración de análisis de tonalidad */
    private const KEY_SAMPLE_RATE = 4000;
    private const KEY_DURACION_MAX = 20;  /* Analizar solo los primeros 20s */

    /*
     * Perfiles de tonalidad de Krumhansl-Schmuckler.
     * Representan la distribución esperada de energía por clase de pitch
     * para escalas mayores y menores.
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

    /*
     * Analiza un archivo de audio y retorna BPM + tonalidad.
     *
     * @param string $rutaArchivo Ruta absoluta al archivo
     * @param string $ffmpegBin Ruta al binario de FFmpeg
     * @return array {bpm: int|null, key: string|null, escala: string|null, bpm_confianza: float, key_confianza: float}
     */
    public static function analizar(string $rutaArchivo, string $ffmpegBin): array
    {
        $resultado = [
            'bpm' => null,
            'key' => null,
            'escala' => null,
            'bpm_confianza' => 0.0,
            'key_confianza' => 0.0,
        ];

        /* Detectar BPM */
        $bpmData = self::detectarBpm($rutaArchivo, $ffmpegBin);
        if ($bpmData) {
            $resultado['bpm'] = $bpmData['bpm'];
            $resultado['bpm_confianza'] = $bpmData['confianza'];
        }

        /* Detectar tonalidad */
        $keyData = self::detectarTonalidad($rutaArchivo, $ffmpegBin);
        if ($keyData) {
            $resultado['key'] = $keyData['key'];
            $resultado['escala'] = $keyData['escala'];
            $resultado['key_confianza'] = $keyData['confianza'];
        }

        KamplesLogger::info(sprintf(
            'AnalizadorAudio: BPM=%s (%.0f%%), Key=%s %s (%.0f%%)',
            $resultado['bpm'] ?? 'N/A',
            $resultado['bpm_confianza'] * 100,
            $resultado['key'] ?? 'N/A',
            $resultado['escala'] ?? '',
            $resultado['key_confianza'] * 100
        ));

        return $resultado;
    }

    /*
     * Detecta el BPM usando detección de onsets por energía + autocorrelación.
     *
     * Algoritmo:
     * 1. Convertir a mono 8kHz PCM con FFmpeg
     * 2. Calcular energía por ventana temporal
     * 3. Detectar onsets (incrementos significativos de energía)
     * 4. Autocorrelacionar la función de onset
     * 5. Encontrar el pico dominante → mapear a BPM
     */
    private static function detectarBpm(string $rutaArchivo, string $ffmpegBin): ?array
    {
        /* Exportar a PCM mono 8kHz float32 little-endian con FFmpeg */
        $tmpPcm = tempnam(sys_get_temp_dir(), 'kamples_bpm_') . '.pcm';

        $cmd = sprintf(
            '%s -y -i %s -ac 1 -ar %d -f f32le -t %d %s 2>&1',
            escapeshellarg($ffmpegBin),
            escapeshellarg($rutaArchivo),
            self::BPM_SAMPLE_RATE,
            self::BPM_DURACION_MAX,
            escapeshellarg($tmpPcm)
        );

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($tmpPcm)) {
            KamplesLogger::error('AnalizadorAudio: Error exportando PCM para BPM');
            @unlink($tmpPcm);
            return null;
        }

        /* Leer datos PCM float32 */
        $datos = file_get_contents($tmpPcm);
        @unlink($tmpPcm);

        if (!$datos || strlen($datos) < 4000) {
            return null;
        }

        $muestras = unpack('f*', $datos);
        $muestras = array_values($muestras);
        $totalMuestras = count($muestras);

        /* Calcular energía por ventana */
        $frameSamples = intdiv(self::BPM_SAMPLE_RATE * self::BPM_FRAME_MS, 1000);
        $hopSamples = intdiv(self::BPM_SAMPLE_RATE * self::BPM_HOP_MS, 1000);
        $energia = [];

        for ($pos = 0; $pos + $frameSamples <= $totalMuestras; $pos += $hopSamples) {
            $sum = 0.0;
            for ($j = 0; $j < $frameSamples; $j++) {
                $val = $muestras[$pos + $j];
                $sum += $val * $val;
            }
            $energia[] = sqrt($sum / $frameSamples);
        }

        $numFrames = count($energia);
        if ($numFrames < 20) {
            return null;
        }

        /* Calcular función de onset (diferenciación + half-wave rectification) */
        $onsets = [0.0];
        for ($i = 1; $i < $numFrames; $i++) {
            $diff = $energia[$i] - $energia[$i - 1];
            $onsets[] = max(0.0, $diff);
        }

        /* Normalizar onsets */
        $maxOnset = max($onsets) ?: 1.0;
        for ($i = 0; $i < $numFrames; $i++) {
            $onsets[$i] /= $maxOnset;
        }

        /*
         * Autocorrelación para detectar periodicidad.
         * Calculamos para lags correspondientes a 60-200 BPM.
         * lag (frames) = 60 / BPM / (hop_ms / 1000)
         */
        $hopSegundos = self::BPM_HOP_MS / 1000.0;
        $lagMin = intval(60.0 / self::BPM_MAX / $hopSegundos);
        $lagMax = intval(60.0 / self::BPM_MIN / $hopSegundos);
        $lagMax = min($lagMax, intdiv($numFrames, 2));

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
        $mejorLag = array_keys($correlaciones, max($correlaciones))[0];
        $mejorCorrelacion = $correlaciones[$mejorLag];

        /* Calcular BPM desde el lag */
        $bpm = round(60.0 / ($mejorLag * $hopSegundos));

        /* Calcular confianza: relación entre el pico y la media */
        $mediaCorrelacion = array_sum($correlaciones) / count($correlaciones);
        $confianza = $mediaCorrelacion > 0 ? min(1.0, $mejorCorrelacion / ($mediaCorrelacion * 3)) : 0.0;

        /* Validar rango */
        if ($bpm < self::BPM_MIN || $bpm > self::BPM_MAX) {
            return null;
        }

        return [
            'bpm' => (int) $bpm,
            'confianza' => round($confianza, 2),
        ];
    }

    /*
     * Detecta la tonalidad usando Goertzel + Krumhansl-Schmuckler.
     *
     * Algoritmo:
     * 1. Convertir a mono 4kHz PCM con FFmpeg
     * 2. Calcular energía por clase de pitch con Goertzel (octavas 2-5)
     * 3. Correlacionar con perfiles Krumhansl-Schmuckler (mayor y menor)
     * 4. La correlación más alta indica la tonalidad
     */
    private static function detectarTonalidad(string $rutaArchivo, string $ffmpegBin): ?array
    {
        /* Exportar a PCM mono 4kHz signed 16-bit LE */
        $tmpPcm = tempnam(sys_get_temp_dir(), 'kamples_key_') . '.pcm';

        $cmd = sprintf(
            '%s -y -i %s -ac 1 -ar %d -f s16le -t %d %s 2>&1',
            escapeshellarg($ffmpegBin),
            escapeshellarg($rutaArchivo),
            self::KEY_SAMPLE_RATE,
            self::KEY_DURACION_MAX,
            escapeshellarg($tmpPcm)
        );

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($tmpPcm)) {
            KamplesLogger::error('AnalizadorAudio: Error exportando PCM para key');
            @unlink($tmpPcm);
            return null;
        }

        /* Leer datos PCM signed 16-bit */
        $datosRaw = file_get_contents($tmpPcm);
        @unlink($tmpPcm);

        if (!$datosRaw || strlen($datosRaw) < 2000) {
            return null;
        }

        $muestrasRaw = unpack('s*', $datosRaw);
        $muestras = array_values($muestrasRaw);
        $totalMuestras = count($muestras);

        /* Normalizar a -1.0 .. 1.0 */
        for ($i = 0; $i < $totalMuestras; $i++) {
            $muestras[$i] = $muestras[$i] / 32768.0;
        }

        /*
         * Calcular vector de chroma (12 clases de pitch).
         * Usamos Goertzel para detectar energía en las frecuencias target
         * a través de las octavas 2-5 (las que caben dentro de 2kHz Nyquist).
         */
        $chroma = array_fill(0, 12, 0.0);

        /* Octavas 2 a 4 (octava 5 excede Nyquist de 2kHz para la mayoría de notas) */
        $nyquist = self::KEY_SAMPLE_RATE / 2;

        for ($nota = 0; $nota < 12; $nota++) {
            $energiaTotal = 0.0;
            for ($octava = 0; $octava < 4; $octava++) {
                $frecuencia = self::FRECUENCIAS_BASE[$nota] * pow(2, $octava);
                if ($frecuencia >= $nyquist) continue;

                $energiaTotal += self::goertzel($muestras, $totalMuestras, $frecuencia, self::KEY_SAMPLE_RATE);
            }
            $chroma[$nota] = $energiaTotal;
        }

        /* Normalizar chroma */
        $maxChroma = max($chroma) ?: 1.0;
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
        $confianza = max(0.0, min(1.0, ($mejorCorrelacion + 1) / 2));

        return [
            'key' => $mejorKey,
            'escala' => $mejorEscala,
            'confianza' => round($confianza, 2),
        ];
    }

    /*
     * Algoritmo de Goertzel para detectar la energía de una frecuencia específica.
     * Más eficiente que FFT completa cuando se buscan pocas frecuencias.
     *
     * @param array $muestras Datos de audio normalizados (-1..1)
     * @param int $totalMuestras Número de muestras
     * @param float $frecuencia Frecuencia target en Hz
     * @param int $sampleRate Tasa de muestreo
     * @return float Energía detectada para esa frecuencia
     */
    private static function goertzel(array $muestras, int $totalMuestras, float $frecuencia, int $sampleRate): float
    {
        /*
         * Procesamos en bloques para mejor resolución temporal.
         * Tamaño del bloque basado en el período de la frecuencia target.
         */
        $blockSize = min($totalMuestras, max(512, intval($sampleRate / $frecuencia) * 4));
        $k = round($blockSize * $frecuencia / $sampleRate);
        $w = (2.0 * M_PI * $k) / $blockSize;
        $coeff = 2.0 * cos($w);

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
            $energiaTotal += max(0.0, $power);
            $bloques++;
        }

        return $bloques > 0 ? $energiaTotal / $bloques : 0.0;
    }

    /*
     * Correlación de Pearson entre dos vectores.
     * Mide la similitud lineal: 1 = perfecta, 0 = ninguna, -1 = inversa.
     */
    private static function correlacionPearson(array $x, array $y): float
    {
        $n = min(count($x), count($y));
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

        $denominador = sqrt(($n * $sumX2 - $sumX * $sumX) * ($n * $sumY2 - $sumY * $sumY));

        if ($denominador == 0) return 0.0;

        return ($n * $sumXY - $sumX * $sumY) / $denominador;
    }
}
