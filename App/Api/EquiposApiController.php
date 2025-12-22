<?php

/**
 * Equipos API Controller
 *
 * Maneja los endpoints REST para el sistema de equipos (social).
 * Permite gestionar solicitudes de conexión y compañeros.
 *
 * Endpoints:
 * - POST /wp-json/glory/v1/equipos/solicitud        → Enviar solicitud por email
 * - GET  /wp-json/glory/v1/equipos                  → Listar equipo completo
 * - GET  /wp-json/glory/v1/equipos/pendientes       → Contador de pendientes
 * - PUT  /wp-json/glory/v1/equipos/{id}/responder   → Aceptar/rechazar solicitud
 * - DELETE /wp-json/glory/v1/equipos/{id}           → Eliminar conexión/solicitud
 *
 * @package App\Api
 */

namespace App\Api;

use App\Services\EquiposService;

class EquiposApiController
{
    private const API_NAMESPACE = 'glory/v1';

    /**
     * Registra los endpoints REST
     */
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
        add_action('user_register', [self::class, 'onUserRegister']);
    }

    /**
     * Define las rutas REST
     */
    public static function registerRoutes(): void
    {
        /* Enviar solicitud por email */
        register_rest_route(self::API_NAMESPACE, '/equipos/solicitud', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'enviarSolicitud'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'email' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_email($param),
                    'sanitize_callback' => 'sanitize_email',
                ],
            ],
        ]);

        /* Listar equipo completo */
        register_rest_route(self::API_NAMESPACE, '/equipos', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'obtenerEquipo'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        /* Contador de solicitudes pendientes */
        register_rest_route(self::API_NAMESPACE, '/equipos/pendientes', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'contarPendientes'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        /* Responder solicitud (aceptar/rechazar) */
        register_rest_route(self::API_NAMESPACE, '/equipos/(?P<id>\d+)/responder', [
            'methods' => \WP_REST_Server::EDITABLE,
            'callback' => [self::class, 'responderSolicitud'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
                'accion' => [
                    'required' => true,
                    'validate_callback' => fn($param) => in_array($param, ['aceptar', 'rechazar']),
                ],
            ],
        ]);

        /* Eliminar conexión o solicitud */
        register_rest_route(self::API_NAMESPACE, '/equipos/(?P<id>\d+)', [
            'methods' => \WP_REST_Server::DELETABLE,
            'callback' => [self::class, 'eliminarConexion'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
    }

    /**
     * Verifica que el usuario esté autenticado
     */
    public static function requireAuthentication(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Envía una solicitud de conexión por email
     */
    public static function enviarSolicitud(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $usuarioId = get_current_user_id();
            $email = $request->get_param('email');

            $service = new EquiposService();
            $resultado = $service->enviarSolicitud($usuarioId, $email);

            $statusCode = $resultado['exito'] ? 200 : 400;

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => $resultado['solicitud'] ?? null,
                'code' => $resultado['codigo'] ?? null,
            ], $statusCode);
        } catch (\Exception $e) {
            error_log('[EquiposAPI] ERROR enviarSolicitud: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al enviar solicitud: ' . $e->getMessage(),
                'code' => 'send_error',
            ], 500);
        }
    }

    /**
     * Obtiene el equipo completo del usuario
     */
    public static function obtenerEquipo(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $usuarioId = get_current_user_id();

            $service = new EquiposService();
            $equipo = $service->obtenerEquipo($usuarioId);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $equipo,
            ], 200);
        } catch (\Exception $e) {
            error_log('[EquiposAPI] ERROR obtenerEquipo: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener equipo: ' . $e->getMessage(),
                'code' => 'get_error',
            ], 500);
        }
    }

    /**
     * Cuenta solicitudes pendientes para el header
     */
    public static function contarPendientes(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $usuarioId = get_current_user_id();

            $service = new EquiposService();
            $pendientes = $service->contarSolicitudesPendientes($usuarioId);

            return new \WP_REST_Response([
                'success' => true,
                'data' => ['pendientes' => $pendientes],
            ], 200);
        } catch (\Exception $e) {
            error_log('[EquiposAPI] ERROR contarPendientes: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al contar pendientes',
                'code' => 'count_error',
            ], 500);
        }
    }

    /**
     * Responde a una solicitud (aceptar/rechazar)
     */
    public static function responderSolicitud(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $solicitudId = (int) $request->get_param('id');
            $usuarioId = get_current_user_id();
            $accion = $request->get_param('accion');

            $service = new EquiposService();
            $resultado = $service->responderSolicitud($solicitudId, $usuarioId, $accion);

            $statusCode = $resultado['exito'] ? 200 : 400;

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => [
                    'estado' => $resultado['estado'] ?? null,
                ],
                'code' => $resultado['codigo'] ?? null,
            ], $statusCode);
        } catch (\Exception $e) {
            error_log('[EquiposAPI] ERROR responderSolicitud: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al responder solicitud: ' . $e->getMessage(),
                'code' => 'respond_error',
            ], 500);
        }
    }

    /**
     * Elimina una conexión o solicitud
     */
    public static function eliminarConexion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $solicitudId = (int) $request->get_param('id');
            $usuarioId = get_current_user_id();

            $service = new EquiposService();
            $resultado = $service->eliminarConexion($solicitudId, $usuarioId);

            $statusCode = $resultado['exito'] ? 200 : 400;

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'code' => $resultado['codigo'] ?? null,
            ], $statusCode);
        } catch (\Exception $e) {
            error_log('[EquiposAPI] ERROR eliminarConexion: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al eliminar conexión: ' . $e->getMessage(),
                'code' => 'delete_error',
            ], 500);
        }
    }

    /**
     * Hook: activa solicitudes pendientes cuando un usuario se registra
     */
    public static function onUserRegister(int $userId): void
    {
        try {
            $user = get_user_by('ID', $userId);
            if ($user) {
                $service = new EquiposService();
                $activadas = $service->activarSolicitudesPendientes($userId, $user->user_email);

                if ($activadas > 0) {
                    error_log("[EquiposAPI] Activadas {$activadas} solicitudes pendientes para usuario {$userId}");
                }
            }
        } catch (\Exception $e) {
            error_log('[EquiposAPI] ERROR onUserRegister: ' . $e->getMessage());
        }
    }
}

/* Registrar el controlador automáticamente */
EquiposApiController::register();
