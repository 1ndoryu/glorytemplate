<?php

/**
 * DeduplicadorAudio — Detección de duplicados por fingerprint perceptual.
 *
 * Genera un hash ligero a partir de los primeros y últimos 4 segundos
 * del audio. Resistente a cambios de formato/calidad.
 * Se ejecuta en background (wp_schedule_single_event).
 *
 * Flujo:
 * 1. Al subir, se programa el cálculo del hash (no bloquea al usuario).
 * 2. Al completar, se busca coincidencias en BD.
 * 3. Si coincide con otro creador → estado 'en_supervision'.
 * 4. Si coincide con el mismo creador → se permite (duplicado propio).
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\DuplicadosPendientesRepository;
use App\Kamples\Api\FFmpegDetector;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\DuplicadosPendientesEnums;

class DeduplicadorAudio
{
    /* Segundos a extraer del inicio y final del audio */
    private const SEGMENTOS_SEGUNDOS = 4;

    /* Formato de salida para hashing: PCM raw 8kHz mono 16-bit */
    private const SAMPLE_RATE = 8000;

    /**
     * Programa el cálculo del hash en background.
     * Llamar después de que el pipeline de audio termine.
     */
    public static function programarCalculo(int $sampleId): void
    {
        if (function_exists('wp_schedule_single_event')) {
            \wp_schedule_single_event(time() + 5, 'kamples_calcular_hash_audio', [$sampleId]);
        } else {
            /* Fallback: ejecutar inline si no hay scheduler */
            self::calcularYVerificar($sampleId);
        }
    }

    /**
     * Registra el hook de WordPress para el evento programado.
     */
    public static function registrarHook(): void
    {
        add_action('kamples_calcular_hash_audio', [self::class, 'calcularYVerificar']);
    }

    /**
     * Calcula el hash perceptual del audio y verifica duplicados.
     */
    public static function calcularYVerificar(int $sampleId): void
    {
        try {
            $sample = SamplesRepository::buscarParaDeduplicacion($sampleId);

            if (!$sample || empty($sample[SamplesCols::RUTA_ORIGINAL])) {
                KamplesLogger::warning('DeduplicadorAudio: sample no encontrado o sin ruta', ['sampleId' => $sampleId]);
                return;
            }

            $rutaArchivo = $sample[SamplesCols::RUTA_ORIGINAL];
            if (!file_exists($rutaArchivo)) {
                KamplesLogger::warning('DeduplicadorAudio: archivo no existe', ['ruta' => $rutaArchivo]);
                return;
            }

            /* Calcular hash perceptual */
            $hash = self::calcularHash($rutaArchivo, (float) ($sample[SamplesCols::DURACION] ?? 0));
            if (!$hash) {
                KamplesLogger::warning('DeduplicadorAudio: no se pudo calcular hash', ['sampleId' => $sampleId]);
                return;
            }

            /* Guardar fingerprint perceptual separado del hash exacto */
            SamplesRepository::actualizarHashPerceptual($sampleId, $hash);

            KamplesLogger::info('DeduplicadorAudio: hash calculado', ['sampleId' => $sampleId, 'hash' => $hash]);

            /* Buscar duplicados perceptuales (de otros creadores) */
            $duplicados = SamplesRepository::buscarConHashPerceptual($hash, $sampleId);

            if (empty($duplicados)) return;

            $creadorId = (int) $sample[SamplesCols::CREADOR_ID];

            foreach ($duplicados as $dup) {
                $dupCreadorId = (int) $dup[SamplesCols::CREADOR_ID];

                /* Duplicados del mismo creador se permiten */
                if ($dupCreadorId === $creadorId) continue;

                /* Duplicado de otro creador: marcar para supervisión */
                SamplesRepository::marcarEnSupervision($sampleId);

                /* Insertar en duplicados_pendientes para que aparezca en el panel admin */
                try {
                    DuplicadosPendientesRepository::insertarRegistro([
                        'sample_original_id' => (int) $dup[SamplesCols::ID],
                        'sample_duplicado_id' => $sampleId,
                        'tipo' => DuplicadosPendientesEnums::TIPO_CROSS_USUARIO,
                    ]);
                } catch (\Throwable $e) {
                    KamplesLogger::error('DeduplicadorAudio: error creando registro duplicados_pendientes', [
                        'sampleId' => $sampleId,
                        'error' => $e->getMessage(),
                    ]);
                }

                /* Notificar al UPLOADER (creadorId) que su sample fue flaggeado, no al dueño original */
                ServicioNotificaciones::crear(
                    $creadorId,
                    'duplicado_detectado',
                    "Tu sample fue detectado como posible duplicado de \"{$dup[SamplesCols::TITULO]}\"",
                    [
                        'sampleOriginalId'   => (int) $dup[SamplesCols::ID],
                        'sampleDuplicadoId'  => $sampleId,
                        'tituloOriginal'     => $dup[SamplesCols::TITULO],
                    ],
                    null,
                    'Duplicado detectado'
                );

                KamplesLogger::warning('DeduplicadorAudio: duplicado detectado', [
                    'sampleNuevo'     => $sampleId,
                    'sampleOriginal'  => $dup[SamplesCols::ID],
                    'creadorNuevo'    => $creadorId,
                    'creadorOriginal' => $dupCreadorId,
                ]);

                break; /* Solo marcar una vez */
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('DeduplicadorAudio: error en calcularYVerificar', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Calcula el hash perceptual del audio.
     * Extrae PCM raw de los primeros y últimos N segundos, luego genera SHA-256.
     */
    private static function calcularHash(string $rutaArchivo, float $duracion): ?string
    {
        $ffmpeg = self::buscarFFmpeg();
        if (!$ffmpeg) return null;

        $seg = self::SEGMENTOS_SEGUNDOS;
        $sr = self::SAMPLE_RATE;

        /* Extraer primeros N segundos como PCM raw */
        $tempInicio = tempnam(sys_get_temp_dir(), 'kmp_hash_ini_');
        $tempFinal = null;

        try {
            $cmd = sprintf(
                '%s -y -i %s -t %d -ar %d -ac 1 -f s16le %s 2>&1',
                \escapeshellarg($ffmpeg), \escapeshellarg($rutaArchivo), $seg, $sr, \escapeshellarg($tempInicio)
            );
            exec($cmd, $output, $exitCode);

            if ($exitCode !== 0 || !file_exists($tempInicio)) {
                KamplesLogger::warning('DeduplicadorAudio: FFmpeg falló extrayendo inicio', ['exitCode' => $exitCode]);
                return null;
            }

            $pcmInicio = \file_get_contents($tempInicio);

            /* Extraer últimos N segundos */
            $pcmFinal = '';
            if ($duracion > $seg * 2) {
                $offset = max(0, $duracion - $seg);
                $tempFinal = tempnam(sys_get_temp_dir(), 'kmp_hash_fin_');
                $cmd = sprintf(
                    '%s -y -i %s -ss %.2f -t %d -ar %d -ac 1 -f s16le %s 2>&1',
                    \escapeshellarg($ffmpeg), \escapeshellarg($rutaArchivo), $offset, $seg, $sr, \escapeshellarg($tempFinal)
                );
                $outputFin = [];
                exec($cmd, $outputFin, $exitCodeFin);
                if ($exitCodeFin === 0 && file_exists($tempFinal)) {
                    $pcmFinal = \file_get_contents($tempFinal);
                }
            }
        } finally {
            /* Limpieza garantizada de archivos temporales */
            if ($tempInicio && file_exists($tempInicio)) {
                unlink($tempInicio);
            }
            if ($tempFinal && file_exists($tempFinal)) {
                unlink($tempFinal);
            }
        }

        if (empty($pcmInicio)) return null;

        /* Combinar y hashear.
         * Se normaliza a 8-bit para resistir cambios de volumen menores. */
        $combinado = self::normalizarPCM($pcmInicio) . self::normalizarPCM($pcmFinal);

        return hash('sha256', $combinado);
    }

    /**
     * Normaliza PCM 16-bit a bandas de energía reducidas.
     * Resistente a diferencias de volumen/formato menor.
     */
    private static function normalizarPCM(string $pcmData): string
    {
        if (empty($pcmData)) return '';

        $samples = unpack('v*', $pcmData);
        if (!$samples) return '';

        /* Reducir a bloques de energía: cada bloque = 256 muestras */
        $blockSize = 256;
        $bloques = [];
        $buffer = [];

        foreach ($samples as $sample) {
            /* Convertir unsigned 16-bit a signed */
            if ($sample > 32767) $sample -= 65536;
            $buffer[] = abs($sample);

            if (count($buffer) >= $blockSize) {
                /* Energía promedio del bloque, cuantizada a 8 niveles */
                $energia = array_sum($buffer) / count($buffer);
                $bloques[] = chr((int) min(7, floor($energia / 4096)));
                $buffer = [];
            }
        }

        return implode('', $bloques);
    }

    /**
     * Delegado a FFmpegDetector (centralizado, cross-platform).
     */
    private static function buscarFFmpeg(): ?string
    {
        return FFmpegDetector::obtenerFFmpeg();
    }
}
