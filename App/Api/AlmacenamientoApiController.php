<?php

/**
 * Almacenamiento API Controller
 *
 * Maneja endpoints relacionados con el almacenamiento de archivos.
 *
 * Endpoints:
 * - GET  /wp-json/glory/v1/almacenamiento   -> Info de uso de almacenamiento
 * - POST /wp-json/glory/v1/almacenamiento   -> Verificar espacio para subida
 *
 * @package App\Api
 */

namespace App\Api;

use App\Services\AlmacenamientoService;

class AlmacenamientoApiController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        register_rest_route(self::API_NAMESPACE, '/almacenamiento', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'getAlmacenamiento'],
                'permission_callback' => [self::class, 'requireAuthentication'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'verificarEspacioSubida'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => [
                    'tamano' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
        ]);
    }

    public static function requireAuthentication(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Obtiene informacion de almacenamiento del usuario
     */
    public static function getAlmacenamiento(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $service = new AlmacenamientoService($userId);
            $info = $service->getInfoCompleta();

            return new \WP_REST_Response([
                'success' => true,
                'data' => $info,
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener almacenamiento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verifica si el usuario puede subir un archivo de determinado tamaño
     */
    public static function verificarEspacioSubida(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tamano = (int) $request->get_param('tamano');

        try {
            $service = new AlmacenamientoService($userId);
            $puedeSubir = $service->puedeSubir($tamano);

            if (!$puedeSubir) {
                return new \WP_REST_Response([
                    'success' => false,
                    'puedeSubir' => false,
                    'message' => 'No hay espacio suficiente. Elimina archivos o actualiza a Premium.',
                    'data' => $service->getInfoCompleta(),
                ], 400);
            }

            return new \WP_REST_Response([
                'success' => true,
                'puedeSubir' => true,
                'data' => $service->getInfoCompleta(),
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al verificar espacio: ' . $e->getMessage(),
            ], 500);
        }
    }
}

AlmacenamientoApiController::register();
