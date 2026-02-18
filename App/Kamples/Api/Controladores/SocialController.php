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
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Services\MotorRecomendacion;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Services\ServicioNotificaciones;

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
                'reaccion'  => ['required' => false, 'type' => 'string', 'enum' => ['like', 'dislike', 'encanta'], 'default' => 'like'],
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

        register_rest_route($namespace, '/me/seguidos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'misSeguidos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * Lista de usuarios que el usuario actual sigue.
     * Devuelve IDs de usuarios para filtrado en el feed.
     */
    public static function misSeguidos(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $seguidos = PostgresService::consultar(
            "SELECT seguido_id AS id FROM follows WHERE seguidor_id = :userId",
            ['userId' => $userId]
        );

        $ids = array_map(fn($row) => ['id' => (int) $row['id']], $seguidos);
        return new \WP_REST_Response(['data' => $ids], 200);
    }

    public static function seguir(\WP_REST_Request $request): \WP_REST_Response
    {
        $seguidorId = UsuarioHelper::obtenerIdPg();
        if (!$seguidorId) return UsuarioHelper::respuestaNoEncontrado();

        /* C164: Rate limit — 20 follows por minuto */
        $limitResp = RateLimiter::verificarUsuario($seguidorId, 'follow', 20, 60);
        if ($limitResp) return $limitResp;

        $targetId = (int) $request->get_param('userId');

        if ($seguidorId === $targetId) {
            return new \WP_REST_Response(['code' => 'no_self_follow', 'message' => 'No puedes seguirte a ti mismo'], 400);
        }

        /* Verificar que el usuario target existe */
        $targetExiste = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE id = :id",
            ['id' => $targetId]
        );
        if (!$targetExiste) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado', 'message' => 'El usuario no existe'], 404);
        }

        PostgresService::ejecutar(
            "INSERT INTO follows (seguidor_id, seguido_id) VALUES (:seguidor, :seguido) ON CONFLICT DO NOTHING",
            ['seguidor' => $seguidorId, 'seguido' => $targetId]
        );

        self::actualizarContadoresFollow($seguidorId, $targetId);

        /* C266: Notificacion de nuevo seguidor (centralizada, excluye auto-follow) */
        ServicioNotificaciones::follow($targetId, $seguidorId);

        /* C45: registrar interacción para el planificador del algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($seguidorId, 'follow');

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

        /* C164: Rate limit — 30 likes por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'like', 30, 60);
        if ($limitResp) return $limitResp;

        $tipo     = sanitize_text_field($request->get_param('tipo'));
        $targetId = (int) $request->get_param('target_id');
        $reaccion = sanitize_text_field($request->get_param('reaccion') ?? 'like');

        /* Validar reacción */
        if (!in_array($reaccion, ['like', 'dislike', 'encanta'], true)) {
            $reaccion = 'like';
        }

        /* Verificar que el target existe antes de crear la reacción */
        $tablaTarget = $tipo === 'publicacion' ? 'publicaciones' : 'samples';
        $targetExiste = PostgresService::consultarUno(
            "SELECT id FROM {$tablaTarget} WHERE id = :id",
            ['id' => $targetId]
        );
        if (!$targetExiste) {
            return new \WP_REST_Response(['code' => 'target_no_encontrado', 'message' => 'El contenido no existe'], 404);
        }

        /*
         * C144/C145: UPSERT — si ya existe una reacción, la actualiza.
         * Un usuario solo puede tener UNA reacción por target.
         */
        PostgresService::ejecutar(
            "INSERT INTO likes (usuario_id, tipo, target_id, reaccion)
             VALUES (:usuario, :tipo, :target, :reaccion)
             ON CONFLICT (usuario_id, tipo, target_id) DO UPDATE SET reaccion = :reaccion2, created_at = NOW()",
            ['usuario' => $userId, 'tipo' => $tipo, 'target' => $targetId, 'reaccion' => $reaccion, 'reaccion2' => $reaccion]
        );

        /*
         * Recalcular total_likes: solo cuenta 'like' y 'encanta', NO 'dislike'.
         * Los dislikes no tienen contador público (C144).
         */
        if ($tipo === 'sample') {
            PostgresService::ejecutar(
                "UPDATE samples SET total_likes = (
                    SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = :id AND reaccion IN ('like', 'encanta')
                ) WHERE id = :id",
                ['id' => $targetId]
            );

            /* Notificacion al creador (solo para like/encanta, no dislike) — C266 centralizado */
            if ($reaccion !== 'dislike') {
                $sample = PostgresService::consultarUno(
                    "SELECT creador_id, titulo, slug FROM samples WHERE id = :id",
                    ['id' => $targetId]
                );
                if ($sample) {
                    ServicioNotificaciones::likeSample(
                        (int) $sample['creador_id'],
                        $userId,
                        $targetId,
                        $sample['titulo'] ?? '',
                        $sample['slug'] ?? null,
                        $reaccion
                    );
                }
            }
        } elseif ($tipo === 'publicacion') {
            PostgresService::ejecutar(
                "UPDATE publicaciones SET total_likes = (
                    SELECT COUNT(*) FROM likes WHERE tipo = 'publicacion' AND target_id = :id AND reaccion IN ('like', 'encanta')
                ) WHERE id = :id",
                ['id' => $targetId]
            );

            /* C266: Notificacion de like en publicacion */
            if ($reaccion !== 'dislike') {
                $pub = PostgresService::consultarUno(
                    "SELECT autor_id FROM publicaciones WHERE id = :id",
                    ['id' => $targetId]
                );
                if ($pub) {
                    ServicioNotificaciones::likePublicacion(
                        (int) $pub['autor_id'],
                        $userId,
                        $targetId,
                        $reaccion
                    );
                }
            }
        }

        /* Invalidar cache del feed para que el algoritmo recalcule */
        MotorRecomendacion::invalidarCache($userId);

        /* C45: registrar interacción para el planificador del algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, $reaccion === 'dislike' ? 'dislike' : 'like');

        return new \WP_REST_Response(['ok' => true, 'reaccion' => $reaccion], 200);
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

        /* Recalcular total_likes (solo like+encanta, sin dislikes) */
        if ($tipo === 'sample') {
            PostgresService::ejecutar(
                "UPDATE samples SET total_likes = (
                    SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = :id AND reaccion IN ('like', 'encanta')
                ) WHERE id = :id",
                ['id' => $targetId]
            );
        } elseif ($tipo === 'publicacion') {
            PostgresService::ejecutar(
                "UPDATE publicaciones SET total_likes = (
                    SELECT COUNT(*) FROM likes WHERE tipo = 'publicacion' AND target_id = :id AND reaccion IN ('like', 'encanta')
                ) WHERE id = :id",
                ['id' => $targetId]
            );
        }

        /* Invalidar cache del feed para que el algoritmo recalcule */
        MotorRecomendacion::invalidarCache($userId);

        return new \WP_REST_Response(['ok' => true, 'reaccion' => null], 200);
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
