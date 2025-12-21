<?php

/**
 * Admin API Controller
 *
 * Maneja los endpoints REST para el panel de administración.
 * Permite gestionar usuarios, suscripciones y ver estadísticas.
 *
 * Endpoints:
 * - GET  /wp-json/glory/v1/admin/usuarios          → Listar usuarios
 * - GET  /wp-json/glory/v1/admin/usuario/{id}      → Detalle de usuario
 * - POST /wp-json/glory/v1/admin/usuario/{id}/activar-premium  → Activar premium
 * - POST /wp-json/glory/v1/admin/usuario/{id}/cancelar-premium → Cancelar premium
 * - POST /wp-json/glory/v1/admin/usuario/{id}/extender-trial   → Extender trial
 * - GET  /wp-json/glory/v1/admin/resumen           → Estadísticas globales
 *
 * @package App\Api
 */

namespace App\Api;

use App\Services\AdminService;

class AdminApiController
{
    private const API_NAMESPACE = 'glory/v1';

    /**
     * Registra los endpoints REST
     */
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    /**
     * Define las rutas REST
     */
    public static function registerRoutes(): void
    {
        /* Listar usuarios */
        register_rest_route(self::API_NAMESPACE, '/admin/usuarios', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'listarUsuarios'],
            'permission_callback' => [self::class, 'requireAdminPermission'],
            'args' => self::getListarArgs(),
        ]);

        /* Resumen global */
        register_rest_route(self::API_NAMESPACE, '/admin/resumen', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'obtenerResumen'],
            'permission_callback' => [self::class, 'requireAdminPermission'],
        ]);

        /* Detalle de usuario */
        register_rest_route(self::API_NAMESPACE, '/admin/usuario/(?P<id>\d+)', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'obtenerUsuario'],
            'permission_callback' => [self::class, 'requireAdminPermission'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        /* Activar premium */
        register_rest_route(self::API_NAMESPACE, '/admin/usuario/(?P<id>\d+)/activar-premium', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'activarPremium'],
            'permission_callback' => [self::class, 'requireAdminPermission'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
                'duracion' => [
                    'required' => false,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        /* Cancelar premium */
        register_rest_route(self::API_NAMESPACE, '/admin/usuario/(?P<id>\d+)/cancelar-premium', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'cancelarPremium'],
            'permission_callback' => [self::class, 'requireAdminPermission'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        /* Extender trial */
        register_rest_route(self::API_NAMESPACE, '/admin/usuario/(?P<id>\d+)/extender-trial', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'extenderTrial'],
            'permission_callback' => [self::class, 'requireAdminPermission'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
                'dias' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0 && $param <= 365,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
    }

    /**
     * Argumentos para listar usuarios
     */
    private static function getListarArgs(): array
    {
        return [
            'plan' => [
                'required' => false,
                'validate_callback' => fn($param) => in_array($param, ['todos', 'premium', 'free', 'trial']),
                'default' => 'todos',
            ],
            'busqueda' => [
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field',
                'default' => '',
            ],
            'ordenarPor' => [
                'required' => false,
                'validate_callback' => fn($param) => in_array($param, ['nombre', 'fechaRegistro', 'ultimoPago', 'estado']),
                'default' => 'fechaRegistro',
            ],
            'orden' => [
                'required' => false,
                'validate_callback' => fn($param) => in_array(strtolower($param), ['asc', 'desc']),
                'default' => 'desc',
            ],
            'pagina' => [
                'required' => false,
                'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                'sanitize_callback' => 'absint',
                'default' => 1,
            ],
            'porPagina' => [
                'required' => false,
                'validate_callback' => fn($param) => is_numeric($param) && $param > 0 && $param <= 100,
                'sanitize_callback' => 'absint',
                'default' => 20,
            ],
        ];
    }

    /**
     * Verifica que el usuario sea administrador
     */
    public static function requireAdminPermission(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Lista usuarios con filtros y paginación
     */
    public static function listarUsuarios(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $service = new AdminService();

            $filtros = [
                'plan' => $request->get_param('plan'),
                'busqueda' => $request->get_param('busqueda'),
                'ordenarPor' => $request->get_param('ordenarPor'),
                'orden' => $request->get_param('orden'),
                'pagina' => $request->get_param('pagina'),
                'porPagina' => $request->get_param('porPagina'),
            ];

            $resultado = $service->listarUsuarios($filtros);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $resultado,
            ], 200);
        } catch (\Exception $e) {
            error_log('[AdminAPI] ERROR listarUsuarios: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al listar usuarios: ' . $e->getMessage(),
                'code' => 'list_error',
            ], 500);
        }
    }

    /**
     * Obtiene detalle de un usuario
     */
    public static function obtenerUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = (int) $request->get_param('id');
            $service = new AdminService();

            $usuario = $service->obtenerUsuario($userId);

            if (!$usuario) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Usuario no encontrado',
                    'code' => 'not_found',
                ], 404);
            }

            return new \WP_REST_Response([
                'success' => true,
                'data' => $usuario,
            ], 200);
        } catch (\Exception $e) {
            error_log('[AdminAPI] ERROR obtenerUsuario: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener usuario: ' . $e->getMessage(),
                'code' => 'get_error',
            ], 500);
        }
    }

    /**
     * Activa premium para un usuario
     */
    public static function activarPremium(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = (int) $request->get_param('id');
            $duracion = $request->get_param('duracion');

            $service = new AdminService();
            $resultado = $service->activarPremium($userId, $duracion);

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => $resultado['suscripcion'] ?? null,
            ], $resultado['exito'] ? 200 : 400);
        } catch (\Exception $e) {
            error_log('[AdminAPI] ERROR activarPremium: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al activar premium: ' . $e->getMessage(),
                'code' => 'activate_error',
            ], 500);
        }
    }

    /**
     * Cancela premium de un usuario
     */
    public static function cancelarPremium(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = (int) $request->get_param('id');

            $service = new AdminService();
            $resultado = $service->cancelarPremium($userId);

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => $resultado['suscripcion'] ?? null,
            ], $resultado['exito'] ? 200 : 400);
        } catch (\Exception $e) {
            error_log('[AdminAPI] ERROR cancelarPremium: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al cancelar premium: ' . $e->getMessage(),
                'code' => 'cancel_error',
            ], 500);
        }
    }

    /**
     * Extiende el trial de un usuario
     */
    public static function extenderTrial(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = (int) $request->get_param('id');
            $dias = (int) $request->get_param('dias');

            $service = new AdminService();
            $resultado = $service->extenderTrial($userId, $dias);

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => $resultado['suscripcion'] ?? null,
            ], $resultado['exito'] ? 200 : 400);
        } catch (\Exception $e) {
            error_log('[AdminAPI] ERROR extenderTrial: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al extender trial: ' . $e->getMessage(),
                'code' => 'extend_error',
            ], 500);
        }
    }

    /**
     * Obtiene resumen de estadísticas globales
     */
    public static function obtenerResumen(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $service = new AdminService();
            $resumen = $service->obtenerResumenGlobal();

            return new \WP_REST_Response([
                'success' => true,
                'data' => $resumen,
            ], 200);
        } catch (\Exception $e) {
            error_log('[AdminAPI] ERROR obtenerResumen: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener resumen: ' . $e->getMessage(),
                'code' => 'summary_error',
            ], 500);
        }
    }
}

/* Registrar el controlador automáticamente */
AdminApiController::register();
