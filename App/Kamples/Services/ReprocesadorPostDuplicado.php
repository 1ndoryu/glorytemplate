<?php

/**
 * ReprocesadorPostDuplicado — Re-procesa samples aprobados desde el panel de duplicados.
 *
 * Cuando un admin aprueba un sample marcado como duplicado (determina que NO es duplicado real),
 * el sample necesita completar el pipeline (IA, waveform, preview, etc.) que fue interrumpido
 * en el paso 2.5. Este servicio se ejecuta via WP cron para hacerlo en background.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Kamples\Api\PipelineAudio;
use App\Kamples\LogIA as KamplesLogger;

class ReprocesadorPostDuplicado
{
    public const HOOK = 'kamples_reprocesar_post_duplicado';

    public static function registrarHook(): void
    {
        \add_action(self::HOOK, [self::class, 'ejecutar']);
    }

    /**
     * Ejecuta el pipeline completo (omitiendo dedup) para un sample aprobado.
     * Invocado via wp_schedule_single_event desde DuplicadosPendientesRepository::aprobar().
     */
    public static function ejecutar(int $sampleId): void
    {
        try {
            $sample = SamplesRepository::buscarPorId($sampleId);
            if (!$sample) {
                KamplesLogger::error('[REPROCESAR-DUPLICADO] Sample no encontrado', [
                    'sampleId' => $sampleId,
                ]);
                return;
            }

            /* Solo reprocesar samples en estado procesando (set by aprobar()) */
            if ($sample[SamplesCols::ESTADO] !== SamplesEnums::ESTADO_PROCESANDO) {
                KamplesLogger::warning('[REPROCESAR-DUPLICADO] Sample no esta en procesando, omitiendo', [
                    'sampleId' => $sampleId,
                    'estadoActual' => $sample[SamplesCols::ESTADO],
                ]);
                return;
            }

            $rutaArchivo = $sample[SamplesCols::RUTA_ORIGINAL] ?? '';
            if (empty($rutaArchivo) || !\file_exists($rutaArchivo)) {
                KamplesLogger::error('[REPROCESAR-DUPLICADO] Archivo de audio no encontrado en disco', [
                    'sampleId' => $sampleId,
                    'ruta' => $rutaArchivo,
                ]);
                /* Activar sample con lo que tiene para evitar perdida total de datos */
                SamplesRepository::actualizarPorId($sampleId, [
                    SamplesCols::ESTADO => SamplesEnums::ESTADO_ACTIVO,
                ]);
                return;
            }

            $idCorto = $sample[SamplesCols::ID_CORTO] ?? '';
            $nombreOriginal = \basename($rutaArchivo);

            KamplesLogger::info('[REPROCESAR-DUPLICADO] Iniciando pipeline post-duplicado', [
                'sampleId' => $sampleId,
                'idCorto' => $idCorto,
            ]);

            PipelineAudio::procesar(
                $sampleId,
                $rutaArchivo,
                $nombreOriginal,
                $idCorto,
                '',
                [],
                true
            );

            KamplesLogger::info('[REPROCESAR-DUPLICADO] Pipeline completado', [
                'sampleId' => $sampleId,
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('[REPROCESAR-DUPLICADO] Error ejecutando pipeline', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
