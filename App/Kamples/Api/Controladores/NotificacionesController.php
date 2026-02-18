<?php

/**
 * NotificacionesController — Sistema de notificaciones.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Database\Repositories\NotificacionesRepository;

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

        $page = max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 30;

        $notificaciones = NotificacionesRepository::listarConActor($userId, $offset);

        /* C193: fallback avatar para actores de notificaciones */
        foreach ($notificaciones as &$n) {
            $n['actorAvatar'] = UsuarioHelper::resolverAvatarUrl(
                $n['actorAvatar'] ?? null,
                isset($n['actorWpUserId']) ? (int) $n['actorWpUserId'] : null
            );
            unset($n['actorWpUserId']);
        }

        return new \WP_REST_Response(['data' => $notificaciones], 200);
    }

    public static function marcarLeida(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $notifId = (int) $request->get_param('id');
        NotificacionesRepository::marcarLeida($notifId, $userId);

        return new \WP_REST_Response(['ok' => true], 200);
    }

    public static function marcarTodasLeidas(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        NotificacionesRepository::marcarTodasLeidas($userId);

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /**
     * GET /notificaciones/conteo — Total de no leídas.
     */
    public static function conteoNoLeidas(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $total = NotificacionesRepository::contarNoLeidas($userId);

        return new \WP_REST_Response(['total' => $total], 200);
    }
}
