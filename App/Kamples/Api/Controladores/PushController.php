<?php

/**
 * PushController — Gestión de suscripciones Web Push (VAPID).
 *
 * Endpoints:
 * - POST /push/subscribe   — Registrar suscripción push desde el navegador/WebView
 * - POST /push/unsubscribe — Eliminar suscripción push
 * - GET  /push/vapid-key   — Obtener clave pública VAPID para el frontend
 *
 * QK86: Notificaciones push self-hosted, sin Firebase/FCM.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Database\Repositories\PushSubscriptionsRepository;
use App\Kamples\Services\ServicioNotificacionesPush;
use App\Kamples\KamplesLogger;

class PushController
{
    public static function registrarRutas(string $namespace): void
    {
        /* Clave publica VAPID — no requiere auth (necesaria antes de login para registro SW) */
        register_rest_route($namespace, '/push/vapid-key', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerClaveVapid'],
            'permission_callback' => '__return_true',
        ]);

        /* Registrar suscripción push */
        register_rest_route($namespace, '/push/subscribe', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'suscribir'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Eliminar suscripción push */
        register_rest_route($namespace, '/push/unsubscribe', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'desuscribir'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * GET /push/vapid-key
     * Retorna la clave pública VAPID para que el frontend registre el Service Worker.
     */
    public static function obtenerClaveVapid(): \WP_REST_Response
    {
        try {
            $clave = ServicioNotificacionesPush::obtenerClavePublica();
            if ($clave === null) {
                return new \WP_REST_Response([
                    'ok'      => false,
                    'error'   => 'Push notifications no configuradas',
                    'habilitado' => false,
                ], 200);
            }

            return new \WP_REST_Response([
                'ok'        => true,
                'vapidKey'  => $clave,
                'habilitado' => true,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[PushController] Error obteniendo VAPID key', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /push/subscribe
     * Registra una suscripción push del navegador/WebView.
     *
     * Body esperado:
     * {
     *   "endpoint": "https://fcm.googleapis.com/...",
     *   "keys": { "p256dh": "...", "auth": "..." },
     *   "plataforma": "web" | "android" | "desktop"
     * }
     */
    public static function suscribir(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            $body = $request->get_json_params();

            $endpoint = trim($body['endpoint'] ?? '');
            $p256dh   = trim($body['keys']['p256dh'] ?? '');
            $auth     = trim($body['keys']['auth'] ?? '');

            /* Validacion de campos obligatorios */
            if ($endpoint === '' || $p256dh === '' || $auth === '') {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Campos endpoint, keys.p256dh y keys.auth son obligatorios',
                ], 400);
            }

            /* Validar que endpoint es una URL HTTPS válida */
            if (!filter_var($endpoint, FILTER_VALIDATE_URL) || strpos($endpoint, 'https://') !== 0) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Endpoint debe ser una URL HTTPS válida',
                ], 400);
            }

            /* Plataforma con whitelist */
            $plataformasValidas = ['web', 'android', 'desktop'];
            $plataforma = in_array($body['plataforma'] ?? 'web', $plataformasValidas, true)
                ? ($body['plataforma'] ?? 'web')
                : 'web';

            PushSubscriptionsRepository::registrar($userId, $endpoint, $p256dh, $auth, $plataforma);

            KamplesLogger::info('[Push] Suscripción registrada', [
                'userId'     => $userId,
                'plataforma' => $plataforma,
                'endpoint'   => substr($endpoint, 0, 60),
            ]);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[PushController] Error registrando suscripción', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /push/unsubscribe
     * Elimina una suscripción push.
     *
     * Body esperado: { "endpoint": "https://..." }
     */
    public static function desuscribir(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            $body = $request->get_json_params();
            $endpoint = trim($body['endpoint'] ?? '');

            if ($endpoint === '') {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Campo endpoint es obligatorio',
                ], 400);
            }

            PushSubscriptionsRepository::desregistrar($endpoint);

            KamplesLogger::info('[Push] Suscripción eliminada', [
                'userId'   => $userId,
                'endpoint' => substr($endpoint, 0, 60),
            ]);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[PushController] Error eliminando suscripción', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }
}
