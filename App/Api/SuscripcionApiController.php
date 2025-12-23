<?php

/**
 * Suscripcion API Controller
 *
 * Maneja endpoints relacionados con planes de suscripcion.
 *
 * Endpoints:
 * - GET  /wp-json/glory/v1/suscripcion       -> Info de suscripcion
 * - POST /wp-json/glory/v1/suscripcion/trial -> Activar trial
 *
 * @package App\Api
 */

namespace App\Api;

use App\Services\SuscripcionService;

class SuscripcionApiController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        register_rest_route(self::API_NAMESPACE, '/suscripcion', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'getSuscripcion'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        register_rest_route(self::API_NAMESPACE, '/suscripcion/trial', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'activarTrial'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);
    }

    public static function requireAuthentication(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Obtiene informacion de suscripcion del usuario
     */
    public static function getSuscripcion(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $service = new SuscripcionService($userId);
            $info = $service->getInfoCompleta();

            return new \WP_REST_Response([
                'success' => true,
                'data' => $info,
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener suscripcion: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Activa el trial de Premium
     */
    public static function activarTrial(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $service = new SuscripcionService($userId);
            $resultado = $service->activarTrial();

            $status = $resultado['exito'] ? 200 : 400;

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => $resultado['suscripcion'] ?? $service->getInfoCompleta(),
            ], $status);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al activar trial: ' . $e->getMessage(),
            ], 500);
        }
    }
}

SuscripcionApiController::register();
