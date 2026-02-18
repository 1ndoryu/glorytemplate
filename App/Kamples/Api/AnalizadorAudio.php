<?php

/**
 * AnalizadorAudio — Orquestador de análisis técnico de audio.
 *
 * Detecta BPM y tonalidad (key + escala) usando FFmpeg + algoritmos PHP.
 * NO usa IA: análisis puramente técnico con procesamiento de señal.
 *
 * A08: BPM → DetectorBpm, Tonalidad → DetectorTonalidad (SRP).
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\LogIA as KamplesLogger;

class AnalizadorAudio
{
    /**
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
        $bpmData = DetectorBpm::detectar($rutaArchivo, $ffmpegBin);
        if ($bpmData) {
            $resultado['bpm'] = $bpmData['bpm'];
            $resultado['bpm_confianza'] = $bpmData['confianza'];
        }

        /* Detectar tonalidad */
        $keyData = DetectorTonalidad::detectar($rutaArchivo, $ffmpegBin);
        if ($keyData) {
            $resultado['key'] = $keyData['key'];
            $resultado['escala'] = $keyData['escala'];
            $resultado['key_confianza'] = $keyData['confianza'];
        }

        KamplesLogger::info(\sprintf(
            'AnalizadorAudio: BPM=%s (%.0f%%), Key=%s %s (%.0f%%)',
            $resultado['bpm'] ?? 'N/A',
            $resultado['bpm_confianza'] * 100,
            $resultado['key'] ?? 'N/A',
            $resultado['escala'] ?? '',
            $resultado['key_confianza'] * 100
        ));

        return $resultado;
    }
}
