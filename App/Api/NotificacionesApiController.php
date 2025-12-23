<?php

/**
 * Notificaciones API Controller
 *
 * Maneja los endpoints REST para el sistema de notificaciones in-app.
 *
 * Endpoints:
 * - GET  /wp-json/glory/v1/notificaciones            → Listar notificaciones
 * - GET  /wp-json/glory/v1/notificaciones/no-leidas  → Contador de no leídas
 * - PUT  /wp-json/glory/v1/notificaciones/{id}/leer  → Marcar como leída
 * - PUT  /wp-json/glory/v1/notificaciones/leer-todas → Marcar todas como leídas
 * - DELETE /wp-json/glory/v1/notificaciones/{id}     → Eliminar notificación
 *
 * @package App\Api
 */

namespace App\Api;

use App\Services\NotificacionesService;

class NotificacionesApiController
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
        /* Listar notificaciones con paginación */
        register_rest_route(self::API_NAMESPACE, '/notificaciones', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'listar'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'pagina' => [
                    'default' => 1,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
                'porPagina' => [
                    'default' => 20,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0 && $param <= 50,
                    'sanitize_callback' => 'absint',
                ],
                'soloNoLeidas' => [
                    'default' => false,
                    'validate_callback' => fn($param) => is_bool($param) || $param === 'true' || $param === 'false',
                    'sanitize_callback' => fn($param) => filter_var($param, FILTER_VALIDATE_BOOLEAN),
                ],
            ],
        ]);

        /* Contador de notificaciones no leídas para el badge */
        register_rest_route(self::API_NAMESPACE, '/notificaciones/no-leidas', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'contarNoLeidas'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        /* Marcar notificación como leída */
        register_rest_route(self::API_NAMESPACE, '/notificaciones/(?P<id>\d+)/leer', [
            'methods' => \WP_REST_Server::EDITABLE,
            'callback' => [self::class, 'marcarLeida'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        /* Marcar todas las notificaciones como leídas */
        register_rest_route(self::API_NAMESPACE, '/notificaciones/leer-todas', [
            'methods' => \WP_REST_Server::EDITABLE,
            'callback' => [self::class, 'marcarTodasLeidas'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        /* Eliminar una notificación */
        register_rest_route(self::API_NAMESPACE, '/notificaciones/(?P<id>\d+)', [
            'methods' => \WP_REST_Server::DELETABLE,
            'callback' => [self::class, 'eliminar'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_numeric($param) && $param > 0,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);

        /* Endpoint de prueba: crear notificación de test (solo admins) */
        register_rest_route(self::API_NAMESPACE, '/notificaciones/test', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'crearTest'],
            'permission_callback' => [self::class, 'requireAdmin'],
            'args' => [
                'tipo' => [
                    'default' => 'solicitud_equipo',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'titulo' => [
                    'default' => 'Notificación de prueba',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'contenido' => [
                    'default' => 'Esta es una notificación de prueba para verificar el sistema.',
                    'sanitize_callback' => 'sanitize_text_field',
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
     * Verifica que el usuario sea administrador
     */
    public static function requireAdmin(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Lista las notificaciones del usuario con paginación
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $usuarioId = get_current_user_id();
            $pagina = $request->get_param('pagina');
            $porPagina = $request->get_param('porPagina');
            $soloNoLeidas = $request->get_param('soloNoLeidas');

            $service = new NotificacionesService();
            $resultado = $service->listar($usuarioId, $pagina, $porPagina, $soloNoLeidas);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $resultado,
            ], 200);
        } catch (\Exception $e) {
            error_log('[NotificacionesAPI] ERROR listar: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener notificaciones: ' . $e->getMessage(),
                'code' => 'list_error',
            ], 500);
        }
    }

    /**
     * Cuenta las notificaciones no leídas para el badge
     */
    public static function contarNoLeidas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $usuarioId = get_current_user_id();

            $service = new NotificacionesService();
            $cantidad = $service->contarNoLeidas($usuarioId);

            return new \WP_REST_Response([
                'success' => true,
                'data' => ['noLeidas' => $cantidad],
            ], 200);
        } catch (\Exception $e) {
            error_log('[NotificacionesAPI] ERROR contarNoLeidas: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al contar notificaciones',
                'code' => 'count_error',
            ], 500);
        }
    }

    /**
     * Marca una notificación como leída
     */
    public static function marcarLeida(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $notificacionId = (int) $request->get_param('id');
            $usuarioId = get_current_user_id();

            $service = new NotificacionesService();
            $resultado = $service->marcarLeida($notificacionId, $usuarioId);

            $statusCode = $resultado['exito'] ? 200 : 400;

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'code' => $resultado['codigo'] ?? null,
            ], $statusCode);
        } catch (\Exception $e) {
            error_log('[NotificacionesAPI] ERROR marcarLeida: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al marcar notificación: ' . $e->getMessage(),
                'code' => 'mark_error',
            ], 500);
        }
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    public static function marcarTodasLeidas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $usuarioId = get_current_user_id();

            $service = new NotificacionesService();
            $resultado = $service->marcarTodasLeidas($usuarioId);

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => ['cantidad' => $resultado['cantidad']],
            ], 200);
        } catch (\Exception $e) {
            error_log('[NotificacionesAPI] ERROR marcarTodasLeidas: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al marcar notificaciones: ' . $e->getMessage(),
                'code' => 'mark_all_error',
            ], 500);
        }
    }

    /**
     * Elimina una notificación
     */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $notificacionId = (int) $request->get_param('id');
            $usuarioId = get_current_user_id();

            $service = new NotificacionesService();
            $resultado = $service->eliminar($notificacionId, $usuarioId);

            $statusCode = $resultado['exito'] ? 200 : 400;

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'code' => $resultado['codigo'] ?? null,
            ], $statusCode);
        } catch (\Exception $e) {
            error_log('[NotificacionesAPI] ERROR eliminar: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al eliminar notificación: ' . $e->getMessage(),
                'code' => 'delete_error',
            ], 500);
        }
    }

    /**
     * Crea una notificación de prueba (solo admins)
     * 
     * Uso desde consola del navegador:
     * fetch('/wp-json/glory/v1/notificaciones/test', {
     *   method: 'POST',
     *   headers: {'Content-Type': 'application/json', 'X-WP-Nonce': gloryDashboard.nonce},
     *   body: JSON.stringify({tipo: 'solicitud_equipo', titulo: 'Prueba', contenido: 'Test'})
     * }).then(r => r.json()).then(console.log);
     */
    public static function crearTest(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $usuarioId = get_current_user_id();
            $tipo = $request->get_param('tipo');
            $titulo = $request->get_param('titulo');
            $contenido = $request->get_param('contenido');

            $service = new NotificacionesService();
            $resultado = $service->crear(
                $usuarioId,
                $tipo,
                $titulo,
                $contenido,
                ['test' => true, 'timestamp' => current_time('mysql')]
            );

            $statusCode = $resultado['exito'] ? 200 : 400;

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => $resultado['notificacion'] ?? null,
            ], $statusCode);
        } catch (\Exception $e) {
            error_log('[NotificacionesAPI] ERROR crearTest: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al crear notificación de prueba: ' . $e->getMessage(),
                'code' => 'test_error',
            ], 500);
        }
    }
}

/* Registrar el controlador automáticamente */
NotificacionesApiController::register();
