<?php

/**
 * SocialController — Follow/Unfollow + Like/Unlike.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;

class SocialController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/follow/(?P<userId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'seguir'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/follow/(?P<userId>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'dejarDeSeguir'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/like', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'darLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'tipo'      => ['required' => true, 'type' => 'string', 'enum' => ['sample', 'publicacion']],
                'target_id' => ['required' => true, 'type' => 'integer'],
            ],
        ]);

        register_rest_route($namespace, '/like', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'quitarLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'tipo'      => ['required' => true, 'type' => 'string', 'enum' => ['sample', 'publicacion']],
                'target_id' => ['required' => true, 'type' => 'integer'],
            ],
        ]);
    }

    public static function seguir(\WP_REST_Request $request): \WP_REST_Response
    {
        $seguidorId = UsuarioHelper::obtenerIdPg();
        if (!$seguidorId) return UsuarioHelper::respuestaNoEncontrado();

        $targetId = (int) $request->get_param('userId');

        if ($seguidorId === $targetId) {
            return new \WP_REST_Response(['code' => 'no_self_follow', 'message' => 'No puedes seguirte a ti mismo'], 400);
        }

        PostgresService::ejecutar(
            "INSERT INTO follows (seguidor_id, seguido_id) VALUES (:seguidor, :seguido) ON CONFLICT DO NOTHING",
            ['seguidor' => $seguidorId, 'seguido' => $targetId]
        );

        self::actualizarContadoresFollow($seguidorId, $targetId);

        /* Crear notificación de nuevo seguidor */
        PostgresService::ejecutar(
            "INSERT INTO notificaciones (usuario_id, tipo, datos)
             VALUES (:userId, 'follow', :datos)",
            [
                'userId' => $targetId,
                'datos'  => json_encode(['seguidor_id' => $seguidorId]),
            ]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    public static function dejarDeSeguir(\WP_REST_Request $request): \WP_REST_Response
    {
        $seguidorId = UsuarioHelper::obtenerIdPg();
        if (!$seguidorId) return UsuarioHelper::respuestaNoEncontrado();

        $targetId = (int) $request->get_param('userId');

        PostgresService::ejecutar(
            "DELETE FROM follows WHERE seguidor_id = :seguidor AND seguido_id = :seguido",
            ['seguidor' => $seguidorId, 'seguido' => $targetId]
        );

        self::actualizarContadoresFollow($seguidorId, $targetId);

        return new \WP_REST_Response(['ok' => true], 200);
    }

    public static function darLike(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $tipo     = sanitize_text_field($request->get_param('tipo'));
        $targetId = (int) $request->get_param('target_id');

        PostgresService::ejecutar(
            "INSERT INTO likes (usuario_id, tipo, target_id) VALUES (:usuario, :tipo, :target) ON CONFLICT DO NOTHING",
            ['usuario' => $userId, 'tipo' => $tipo, 'target' => $targetId]
        );

        if ($tipo === 'sample') {
            PostgresService::ejecutar(
                "UPDATE samples SET total_likes = (SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = :id) WHERE id = :id",
                ['id' => $targetId]
            );

            /* Notificación al creador */
            $sample = PostgresService::consultarUno("SELECT creador_id FROM samples WHERE id = :id", ['id' => $targetId]);
            if ($sample && (int) $sample['creador_id'] !== $userId) {
                PostgresService::ejecutar(
                    "INSERT INTO notificaciones (usuario_id, tipo, datos) VALUES (:userId, 'like', :datos)",
                    ['userId' => $sample['creador_id'], 'datos' => json_encode(['liker_id' => $userId, 'sample_id' => $targetId])]
                );
            }
        }

        return new \WP_REST_Response(['ok' => true, 'liked' => true], 200);
    }

    public static function quitarLike(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $tipo     = sanitize_text_field($request->get_param('tipo'));
        $targetId = (int) $request->get_param('target_id');

        PostgresService::ejecutar(
            "DELETE FROM likes WHERE usuario_id = :usuario AND tipo = :tipo AND target_id = :target",
            ['usuario' => $userId, 'tipo' => $tipo, 'target' => $targetId]
        );

        if ($tipo === 'sample') {
            PostgresService::ejecutar(
                "UPDATE samples SET total_likes = (SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = :id) WHERE id = :id",
                ['id' => $targetId]
            );
        }

        return new \WP_REST_Response(['ok' => true, 'liked' => false], 200);
    }

    private static function actualizarContadoresFollow(int $seguidorId, int $seguidoId): void
    {
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET total_seguidores = (SELECT COUNT(*) FROM follows WHERE seguido_id = :id) WHERE id = :id",
            ['id' => $seguidoId]
        );
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET total_seguidos = (SELECT COUNT(*) FROM follows WHERE seguidor_id = :id) WHERE id = :id",
            ['id' => $seguidorId]
        );
    }
}
