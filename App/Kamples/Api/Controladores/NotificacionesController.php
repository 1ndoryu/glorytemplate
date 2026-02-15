<?php

/**
 * NotificacionesController — Sistema de notificaciones.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;

class NotificacionesController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/notificaciones', [
            'methods' => 'GET', 'callback' => [self::class, 'listar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args' => ['page' => ['required' => false, 'type' => 'integer', 'default' => 1]],
        ]);

        register_rest_route($namespace, '/notificaciones/(?P<id>\d+)/leer', [
            'methods' => 'POST', 'callback' => [self::class, 'marcarLeida'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/notificaciones/leer-todas', [
            'methods' => 'POST', 'callback' => [self::class, 'marcarTodasLeidas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/notificaciones/conteo', [
            'methods' => 'GET', 'callback' => [self::class, 'conteoNoLeidas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page = (int) $request->get_param('page');
        $offset = ($page - 1) * 30;

        $notificaciones = PostgresService::consultar(
            "SELECT n.id, n.tipo, n.datos, n.leida, n.created_at as \"creadaAt\",
                    u.username as \"actorUsername\", u.nombre_visible as \"actorNombre\",
                    u.avatar_url as \"actorAvatar\"
             FROM notificaciones n
             LEFT JOIN usuarios_ext u ON (n.datos::jsonb->>'seguidor_id')::int = u.id
                OR (n.datos::jsonb->>'liker_id')::int = u.id
             WHERE n.usuario_id = :userId
             ORDER BY n.created_at DESC LIMIT 30 OFFSET :offset",
            ['userId' => $userId, 'offset' => $offset]
        );

        return new \WP_REST_Response(['data' => $notificaciones], 200);
    }

    public static function marcarLeida(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $notifId = (int) $request->get_param('id');
        PostgresService::ejecutar(
            "UPDATE notificaciones SET leida = true WHERE id = :id AND usuario_id = :userId",
            ['id' => $notifId, 'userId' => $userId]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    public static function marcarTodasLeidas(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        PostgresService::ejecutar(
            "UPDATE notificaciones SET leida = true WHERE usuario_id = :userId AND leida = false",
            ['userId' => $userId]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /**
     * GET /notificaciones/conteo — Total de no leídas.
     */
    public static function conteoNoLeidas(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $row = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = :userId AND leida = false",
            ['userId' => $userId]
        );

        return new \WP_REST_Response(['total' => (int) ($row['total'] ?? 0)], 200);
    }
}
