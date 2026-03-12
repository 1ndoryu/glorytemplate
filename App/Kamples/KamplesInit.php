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
use App\Kamples\Auth\GuardiaWpAdmin;
use App\Kamples\Services\DeduplicadorAudio;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Services\ProcesadorColaIA;
use App\Kamples\Services\BackfillHashService;
use App\Kamples\Services\PublicadorExtraccion;

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

        /* CORS para app desktop Tauri — dev y producción */
        self::registrarCors();

        /* QQ14: Bloquear wp-admin y wp-login.php para no-admins */
        GuardiaWpAdmin::registrar();

        /* Registrar API REST */
        KamplesController::registrar();

        /* Hook para deduplicación de audio en background */
        DeduplicadorAudio::registrarHook();

        /* Cron para recálculos temporales del algoritmo (C45) */
        self::registrarCronAlgoritmo();

        /* C356: Cron para reprocesar cola IA (rate limit 429) cada 15 min */
        ProcesadorColaIA::registrarCron();

        /* D1.5: Cron para backfill de hashes SHA-256 en samples existentes */
        BackfillHashService::registrarCron();

        /* Cron para publicar extracciones de audio via PipelineAudio (cada 5 min) */
        self::registrarCronPublicadorExtraccion();
    }

    /*
     * Permite requests cross-origin desde la app desktop Tauri.
     * - http://localhost:1420 es el Vite dev server (tauri dev)
     * - tauri://localhost es el origen del webview en produccion
     * - http://localhost:* cubre otros puertos locales en desarrollo
     *
     * Solo inyecta headers si el request viene de uno de estos origenes.
     * Para produccion web (kamples.com) WordPress ya maneja CORS por defecto.
     */
    private static function registrarCors(): void
    {
        $origenesPermitidos = [
            'http://localhost:1420',
            'https://localhost:1420',
            'tauri://localhost',
            'http://localhost',
        ];

        /* Manejar preflight OPTIONS antes de que WP responda */
        add_action('init', function () use ($origenesPermitidos): void {
            $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
            if (!in_array($origin, $origenesPermitidos, true)) {
                return;
            }

            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                header('Access-Control-Allow-Origin: ' . $origin);
                header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
                header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-Requested-With');
                header('Access-Control-Allow-Credentials: true');
                header('Access-Control-Max-Age: 86400');
                status_header(204);
                exit;
            }
        }, 1);

        /* Inyectar headers CORS en todas las respuestas REST para origenes permitidos */
        add_filter(
            'rest_pre_serve_request',
            function (bool $served, \WP_REST_Response $resultado, \WP_REST_Request $peticion) use ($origenesPermitidos): bool {
                $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
                if (in_array($origin, $origenesPermitidos, true)) {
                    header('Access-Control-Allow-Origin: ' . $origin);
                    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
                    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-Requested-With');
                    header('Access-Control-Allow-Credentials: true');
                    header('Vary: Origin');
                }
                return $served;
            },
            10,
            3
        );
    }
    /*
     * Registra y programa el cron de WP para publicar samples extraidos.
     * Lee items con estado='extraido' de cola_extraccion_samples y los publica
     * via PipelineAudio (waveform, hash, IA, etc.). Se ejecuta cada 5 minutos.
     */
    private static function registrarCronPublicadorExtraccion(): void
    {
        add_action('kamples_publicar_extracciones', function (): void {
            try {
                $resultado = PublicadorExtraccion::publicarPendientes(10);
                KamplesLogger::info('[CRON] Extracciones publicadas', $resultado);
            } catch (\Throwable $e) {
                KamplesLogger::error('[CRON] Error publicando extracciones', ['error' => $e->getMessage()]);
            }
        });

        if (!wp_next_scheduled('kamples_publicar_extracciones')) {
            wp_schedule_event(time(), 'kamples_5min', 'kamples_publicar_extracciones');
        }
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

        /* P1-fix: Registrar intervalo ANTES de programar el evento (WP necesita conocer el intervalo) */
        add_filter('cron_schedules', function (array $schedules): array {
            if (!isset($schedules['kamples_5min'])) {
                $schedules['kamples_5min'] = [
                    'interval' => 300,
                    'display'  => 'Kamples: cada 5 minutos',
                ];
            }
            return $schedules;
        });

        /* Programar si no existe ya (ahora el intervalo ya está registrado) */
        if (!wp_next_scheduled('kamples_algoritmo_cron')) {
            wp_schedule_event(time(), 'kamples_5min', 'kamples_algoritmo_cron');
        }
    }
}

/* Auto-inicialización */
KamplesInit::init();
