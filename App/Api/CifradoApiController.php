<?php

/**
 * Cifrado API Controller
 *
 * Maneja endpoints relacionados con el cifrado E2E de datos.
 *
 * Endpoints:
 * - GET  /wp-json/glory/v1/seguridad/cifrado -> Estado del cifrado
 * - POST /wp-json/glory/v1/seguridad/cifrado -> Habilitar/deshabilitar cifrado
 *
 * @package App\Api
 */

namespace App\Api;

use App\Repository\DashboardRepository;

class CifradoApiController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        register_rest_route(self::API_NAMESPACE, '/seguridad/cifrado', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'getEstadoCifrado'],
                'permission_callback' => [self::class, 'requireAuthentication'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'toggleCifrado'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => [
                    'habilitar' => [
                        'required' => true,
                        'validate_callback' => function ($param) {
                            return is_bool($param) || $param === 'true' || $param === 'false'
                                || $param === 1 || $param === 0 || $param === '1' || $param === '0';
                        },
                        'sanitize_callback' => function ($param) {
                            if (is_bool($param)) {
                                return $param;
                            }
                            return $param === 'true' || $param === '1' || $param === 1;
                        },
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
     * Obtiene el estado de cifrado del usuario
     */
    public static function getEstadoCifrado(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $repository = new DashboardRepository($userId);

            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'habilitado' => $repository->esCifradoActivo(),
                    'algoritmo' => 'AES-256-GCM',
                    'tipoClaveDerivacion' => 'HKDF-SHA256',
                ],
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener estado de cifrado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Habilita o deshabilita el cifrado de datos
     */
    public static function toggleCifrado(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $habilitar = $request->get_param('habilitar');

        try {
            $repository = new DashboardRepository($userId);

            if ($habilitar) {
                $resultado = $repository->habilitarCifrado();
                $mensaje = $resultado
                    ? 'Cifrado habilitado. Tus datos ahora estan protegidos.'
                    : 'Error al habilitar el cifrado.';
            } else {
                $resultado = $repository->deshabilitarCifrado();
                $mensaje = $resultado
                    ? 'Cifrado deshabilitado. Los datos se almacenan sin cifrar.'
                    : 'Error al deshabilitar el cifrado.';
            }

            return new \WP_REST_Response([
                'success' => $resultado,
                'message' => $mensaje,
                'data' => [
                    'habilitado' => $repository->esCifradoActivo(),
                ],
            ], $resultado ? 200 : 500);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al cambiar cifrado: ' . $e->getMessage(),
            ], 500);
        }
    }
}

CifradoApiController::register();
