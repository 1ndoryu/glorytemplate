<?php

/**
 * Kamples — Inicializador
 *
 * Punto de entrada del módulo Kamples.
 * Registra la API REST y los servicios necesarios.
 *
 * Se carga automáticamente porque functions.php incluye todo App/.
 *
 * @package Kamples
 */

namespace App\Kamples;

use App\Kamples\Api\KamplesController;
use App\Kamples\Services\DeduplicadorAudio;
use App\Kamples\Services\PlanificadorAlgoritmo;

class KamplesInit
{
    private static bool $iniciado = false;

    /*
     * Arranque del módulo Kamples.
     * Se ejecuta una sola vez.
     */
    public static function init(): void
    {
        if (self::$iniciado) {
            return;
        }

        self::$iniciado = true;

        /* Registrar API REST */
        KamplesController::registrar();

        /* Hook para deduplicación de audio en background */
        DeduplicadorAudio::registrarHook();

        /* Cron para recálculos temporales del algoritmo (C45) */
        self::registrarCronAlgoritmo();
    }
    /*
     * Registra el cron de WP para recalculos temporales del algoritmo (C45).
     * Se ejecuta cada 5 minutos y evalua si algun usuario necesita recalculo.
     */
    private static function registrarCronAlgoritmo(): void
    {
        add_action('kamples_algoritmo_cron', function () {
            try {
                PlanificadorAlgoritmo::procesarTemporales();
            } catch (\Throwable $e) {
                Helpers\KamplesLogger::error('Cron', "Error en recalculo temporal: {$e->getMessage()}");
            }
        });

        /* Programar si no existe ya */
        if (!wp_next_scheduled('kamples_algoritmo_cron')) {
            wp_schedule_event(time(), 'kamples_5min', 'kamples_algoritmo_cron');
        }

        /* Registrar intervalo personalizado de 5 minutos */
        add_filter('cron_schedules', function (array $schedules): array {
            if (!isset($schedules['kamples_5min'])) {
                $schedules['kamples_5min'] = [
                    'interval' => 300,
                    'display'  => 'Kamples: cada 5 minutos',
                ];
            }
            return $schedules;
        });
    }
}

/* Auto-inicialización */
KamplesInit::init();
