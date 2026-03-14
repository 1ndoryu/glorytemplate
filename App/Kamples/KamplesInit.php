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
use App\Kamples\Api\Controladores\DescargasZipController;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Auth\GuardiaWpAdmin;
use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Services\DeduplicadorAudio;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Services\ProcesadorColaIA;
use App\Kamples\Services\BackfillHashService;
use App\Kamples\Services\PublicadorExtraccion;
use App\Kamples\Services\ReprocesadorPostDuplicado;
use App\Kamples\Database\MigradorLocal;
use App\Kamples\Servicios\ServicioPapelera;
use App\Kamples\Servicios\ServicioLimpiezaModeracion;

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

        /* QK6: JWT auth a nivel de protocolo WP REST — antes del cookie check.
         * Sin esto, desktop (Tauri) con cookies WP + JWT recibe 401 porque
         * rest_cookie_check_errors rechaza cookies sin nonce antes de que
         * permission_callback ejecute el fallback JWT. */
        AuthMiddleware::registrarFiltroRestJwt();

        /* QQ14: Bloquear wp-admin y wp-login.php para no-admins */
        GuardiaWpAdmin::registrar();

        /* Registrar API REST */
        KamplesController::registrar();

        /* QQ17: Backfill slugs para colecciones existentes que no lo tengan */
        self::backfillSlugsColecciones();

        /* Hook para deduplicación de audio en background */
        DeduplicadorAudio::registrarHook();

        /* QQ116: Hook para reprocesar samples aprobados desde panel de duplicados */
        ReprocesadorPostDuplicado::registrarHook();

        /* Cron para recálculos temporales del algoritmo (C45) */
        self::registrarCronAlgoritmo();

        /* C356: Cron para reprocesar cola IA (rate limit 429) cada 15 min */
        ProcesadorColaIA::registrarCron();

        /* D1.5: Cron para backfill de hashes SHA-256 en samples existentes */
        BackfillHashService::registrarCron();

        /* Cron para publicar extracciones de audio via PipelineAudio (cada 5 min) */
        self::registrarCronPublicadorExtraccion();

        /* QQ56: Cron diario para purgar papelera expirada (>30 días) */
        self::registrarCronPurgaPapelera();

        /* QK48: Cron diario para limpiar metadata de moderacion aprobada (>7 dias) */
        self::registrarCronLimpiezaModeracion();

        /* QK69: Cron diario para limpiar ZIPs de colecciones expirados (>7 dias) */
        self::registrarCronLimpiezaZips();

        /* QQ56: Asegurar headers de cache para media estática (audio/imágenes) */
        self::asegurarCacheMedia();

        /* QK86: Servir Service Worker de push desde la raíz del dominio */
        self::servirServiceWorkerPush();

        /* QK82: Auto-ejecutar migraciones pendientes en entorno local */
        MigradorLocal::ejecutarSiLocal();
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
                KamplesLogger::error('Cron: Error en recalculo temporal', ['error' => $e->getMessage()]);
            }

            /* Opt-8: Refrescar vista materializada de trending cada 5 min */
            try {
                $existe = SamplesRepository::consultarValor(
                    "SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_trending_samples' LIMIT 1",
                    []
                );
                if ($existe !== null) {
                    SamplesRepository::ejecutar(
                        "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_samples",
                        []
                    );
                }
            } catch (\Throwable $e) {
                KamplesLogger::error('Cron: Error refrescando mv_trending_samples', ['error' => $e->getMessage()]);
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

    /*
     * QQ56: Genera .htaccess en wp-content/uploads/kamples/ con reglas de cache
     * para audio (3 meses) e imágenes (1 mes). Solo se escribe una vez (transient).
     */
    private static function asegurarCacheMedia(): void
    {
        $transientKey = 'kamples_cache_htaccess_v1';
        if (get_transient($transientKey)) {
            return;
        }

        $uploadDir = wp_upload_dir();
        $kamDir = $uploadDir['basedir'] . '/kamples';
        $htaccess = $kamDir . '/.htaccess';

        if (!\file_exists($kamDir)) {
            return;
        }

        $contenido = <<<'HTACCESS'
# QQ56: Cache agresivo para media estatica de Kamples
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType audio/mpeg "access plus 3 months"
    ExpiresByType audio/mp4 "access plus 3 months"
    ExpiresByType audio/ogg "access plus 3 months"
    ExpiresByType audio/wav "access plus 3 months"
    ExpiresByType audio/webm "access plus 3 months"
    ExpiresByType audio/flac "access plus 3 months"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
</IfModule>

<IfModule mod_headers.c>
    <FilesMatch "\.(mp3|m4a|ogg|wav|webm|flac)$">
        Header set Cache-Control "public, max-age=7776000, immutable"
    </FilesMatch>
    <FilesMatch "\.(jpg|jpeg|png|webp|gif)$">
        Header set Cache-Control "public, max-age=2592000"
    </FilesMatch>
</IfModule>
HTACCESS;

        try {
            \file_put_contents($htaccess, $contenido);
            set_transient($transientKey, true, 90 * DAY_IN_SECONDS);
        } catch (\Throwable $e) {
            KamplesLogger::warning('[Cache] No se pudo escribir .htaccess en uploads/kamples', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /*
     * QQ56: Cron diario para purgar items de papelera con >30 dias.
     * Elimina archivos de disco y registros de BD para samples y publicaciones expirados.
     */
    private static function registrarCronPurgaPapelera(): void
    {
        add_action('kamples_purgar_papelera', function (): void {
            try {
                $resultado = ServicioPapelera::purgarExpiradas();
                if ($resultado['totalPurgados'] > 0) {
                    KamplesLogger::info('[CRON] Papelera purgada', $resultado);
                }
            } catch (\Throwable $e) {
                KamplesLogger::error('[CRON] Error purgando papelera', ['error' => $e->getMessage()]);
            }
        });

        if (!wp_next_scheduled('kamples_purgar_papelera')) {
            wp_schedule_event(time(), 'daily', 'kamples_purgar_papelera');
        }
    }

    /*
     * QK48: Limpieza diaria de metadata de moderacion en publicaciones aprobadas >7 dias.
     * Borra moderacion_detalle y moderacion_razon, conservando la publicacion.
     */
    private static function registrarCronLimpiezaModeracion(): void
    {
        add_action('kamples_limpiar_moderacion', function (): void {
            try {
                $resultado = ServicioLimpiezaModeracion::limpiarAprobadas();
                if (($resultado['totalLimpiadas'] ?? 0) > 0) {
                    KamplesLogger::info('[CRON] Moderacion aprobada limpiada', $resultado);
                }
            } catch (\Throwable $e) {
                KamplesLogger::error('[CRON] Error limpiando moderacion', ['error' => $e->getMessage()]);
            }
        });

        if (!wp_next_scheduled('kamples_limpiar_moderacion')) {
            wp_schedule_event(time(), 'daily', 'kamples_limpiar_moderacion');
        }
    }

    /*
     * QK69: Cron diario para limpiar ZIPs de colecciones expirados (>7 dias).
     * Tambien limpia archivos .lock huerfanos (>1 hora).
     */
    private static function registrarCronLimpiezaZips(): void
    {
        add_action('kamples_limpiar_zips_cache', [DescargasZipController::class, 'cronLimpiarZips']);

        if (!wp_next_scheduled('kamples_limpiar_zips_cache')) {
            wp_schedule_event(time(), 'daily', 'kamples_limpiar_zips_cache');
        }
    }

    /*
     * QK86: Sirve sw-push.js desde /sw-push.js (raíz del dominio).
     * El Service Worker requiere scope '/' para interceptar notificaciones push
     * en cualquier página. Se inyecta via template_redirect para evitar que WP
     * devuelva un 404.
     */
    private static function servirServiceWorkerPush(): void
    {
        add_action('template_redirect', function (): void {
            $uri = $_SERVER['REQUEST_URI'] ?? '';
            /* Solo interceptar /sw-push.js exacto (sin query string) */
            if (strtok($uri, '?') !== '/sw-push.js') {
                return;
            }

            $archivo = get_template_directory() . '/App/Assets/sw-push.js';
            if (!file_exists($archivo)) {
                status_header(404);
                exit;
            }

            header('Content-Type: application/javascript; charset=utf-8');
            header('Service-Worker-Allowed: /');
            header('Cache-Control: no-cache, must-revalidate');
            header('X-Content-Type-Options: nosniff');
            status_header(200);
            readfile($archivo);
            exit;
        }, 1);
    }

    /*
     * QQ17: Backfill slugs para colecciones que no lo tienen.
     * Se ejecuta una sola vez via transient. Si quedan colecciones sin slug
     * (ej: creadas antes de QQ13), se les genera automáticamente.
     */
    private static function backfillSlugsColecciones(): void
    {
        $transientKey = 'kamples_slugs_colecciones_backfill';
        if (get_transient($transientKey)) {
            return;
        }

        add_action('init', function () use ($transientKey): void {
            try {
                $actualizados = ColeccionesRepository::generarSlugsFaltantes();
                if ($actualizados > 0) {
                    KamplesLogger::info('[Backfill] Slugs generados para colecciones', ['total' => $actualizados]);
                }
                /* Marcar como completado — no re-ejecutar por 30 días */
                set_transient($transientKey, true, 30 * DAY_IN_SECONDS);
            } catch (\Throwable $e) {
                KamplesLogger::error('[Backfill] Error generando slugs de colecciones', ['error' => $e->getMessage()]);
            }
        });
    }
}

/* Auto-inicialización */
KamplesInit::init();
