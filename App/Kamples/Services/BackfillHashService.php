<?php

/**
 * BackfillHashService — D1.5
 * Calcula SHA-256 hashes para samples existentes que no los tienen.
 * Ejecutable via cron (batched) o via endpoint admin (manual).
 *
 * Flujo por sample:
 *  1. Leer ruta_original del sample
 *  2. Calcular hash_file('sha256')
 *  3. Buscar otros samples activos con el mismo hash
 *  4. Si hay match → crear registro en duplicados_pendientes
 *  5. Guardar hash en la columna audio_hash
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\DuplicadosPendientesRepository;
use App\Config\Schema\_generated\DuplicadosPendientesEnums;
use App\Kamples\KamplesLogger;

class BackfillHashService
{
    /* Nombre del hook WP Cron */
    public const CRON_HOOK = 'kamples_backfill_hash_cron';

    /* Intervalo: cada hora (para no sobrecargar) */
    public const CRON_INTERVALO = 'kamples_1hora';
    public const CRON_INTERVALO_SEGUNDOS = 3600;

    /* Batch por ejecucion cron */
    private const BATCH_CRON = 100;

    /**
     * Registra el hook de WP Cron para backfill automatico.
     * Se auto-desactiva cuando no quedan samples sin hash.
     */
    public static function registrarCron(): void
    {
        add_filter('cron_schedules', function (array $schedules): array {
            if (!isset($schedules[self::CRON_INTERVALO])) {
                $schedules[self::CRON_INTERVALO] = [
                    'interval' => self::CRON_INTERVALO_SEGUNDOS,
                    'display'  => 'Kamples: cada hora (Backfill Hash)',
                ];
            }
            return $schedules;
        });

        add_action(self::CRON_HOOK, [self::class, 'ejecutarBatch']);

        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), self::CRON_INTERVALO, self::CRON_HOOK);
        }
    }

    /**
     * Ejecuta un batch de backfill.
     * Retorna estadisticas del procesamiento.
     *
     * @return array{procesados: int, hasheados: int, duplicados: int, sin_archivo: int}
     */
    public static function ejecutarBatch(int $limite = self::BATCH_CRON): array
    {
        $stats = ['procesados' => 0, 'hasheados' => 0, 'duplicados' => 0, 'sin_archivo' => 0];

        try {
            $pendientes = SamplesRepository::sinHash($limite);

            if (empty($pendientes)) {
                /* No quedan samples sin hash — desactivar cron */
                $nextRun = wp_next_scheduled(self::CRON_HOOK);
                if ($nextRun) {
                    wp_unschedule_event($nextRun, self::CRON_HOOK);
                }
                KamplesLogger::info('BackfillHash: completado, cron desactivado');
                return $stats;
            }

            foreach ($pendientes as $sample) {
                $stats['procesados']++;
                $sampleId = (int) $sample['id'];
                $ruta = $sample['ruta_original'] ?? '';

                if (empty($ruta) || !file_exists($ruta)) {
                    $stats['sin_archivo']++;
                    KamplesLogger::warning('BackfillHash: archivo no encontrado', [
                        'id' => $sampleId,
                        'ruta' => $ruta,
                    ]);
                    continue;
                }

                try {
                    $hash = hash_file('sha256', $ruta);
                    if ($hash === false) {
                        KamplesLogger::warning('BackfillHash: hash_file fallo', ['id' => $sampleId]);
                        continue;
                    }

                    /* Buscar si ya existe otro sample con este hash */
                    $existentes = SamplesRepository::buscarConHash($hash, $sampleId);

                    if (!empty($existentes)) {
                        $existente = $existentes[0];
                        $creadorSample = (int) $sample['creador_id'];
                        $creadorExistente = (int) $existente['creador_id'];

                        $tipo = ($creadorSample === $creadorExistente)
                            ? DuplicadosPendientesEnums::TIPO_MISMO_USUARIO
                            : DuplicadosPendientesEnums::TIPO_CROSS_USUARIO;

                        DuplicadosPendientesRepository::crear([
                            'sample_original_id' => (int) $existente['id'],
                            'sample_duplicado_id' => $sampleId,
                            'tipo' => $tipo,
                        ]);
                        $stats['duplicados']++;
                    }

                    /* Guardar hash incluso si es duplicado — necesario para la constraint */
                    SamplesRepository::actualizarHash($sampleId, $hash);
                    $stats['hasheados']++;
                } catch (\Throwable $e) {
                    KamplesLogger::error('BackfillHash: error procesando sample', [
                        'id' => $sampleId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            KamplesLogger::info('BackfillHash: batch completado', $stats);
        } catch (\Throwable $e) {
            KamplesLogger::error('BackfillHash: error general', ['error' => $e->getMessage()]);
        }

        return $stats;
    }
}
