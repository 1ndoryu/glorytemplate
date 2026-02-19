<?php

/**
 * SocialController — Follow/Unfollow + Like/Unlike.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Services\MotorRecomendacion;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Services\ServicioNotificaciones;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Kamples\Database\Repositories\FollowsRepository;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;

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
                'tipo'      => ['required' => true, 'type' => 'string', 'enum' => [LikesEnums::TIPO_SAMPLE, LikesEnums::TIPO_PUBLICACION]],
                'target_id' => ['required' => true, 'type' => 'integer'],
                'reaccion'  => ['required' => false, 'type' => 'string', 'enum' => [LikesEnums::REACCION_LIKE, LikesEnums::REACCION_DISLIKE, LikesEnums::REACCION_ENCANTA], 'default' => LikesEnums::REACCION_LIKE],
            ],
        ]);

        register_rest_route($namespace, '/like', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'quitarLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'tipo'      => ['required' => true, 'type' => 'string', 'enum' => [LikesEnums::TIPO_SAMPLE, LikesEnums::TIPO_PUBLICACION]],
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

        $seguidos = FollowsRepository::idsSeguidos($userId);

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
        if (!UsuariosExtRepository::existe(['id' => $targetId])) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado', 'message' => 'El usuario no existe'], 404);
        }

        FollowsRepository::seguir($seguidorId, $targetId);
        FollowsRepository::actualizarContadores($seguidorId, $targetId);

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

        FollowsRepository::dejarDeSeguir($seguidorId, $targetId);
        FollowsRepository::actualizarContadores($seguidorId, $targetId);

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
        $reaccion = sanitize_text_field($request->get_param('reaccion') ?? LikesEnums::REACCION_LIKE);

        /* Validar reacción */
        $reaccionesValidas = [LikesEnums::REACCION_LIKE, LikesEnums::REACCION_DISLIKE, LikesEnums::REACCION_ENCANTA];
        if (!in_array($reaccion, $reaccionesValidas, true)) {
            $reaccion = LikesEnums::REACCION_LIKE;
        }

        /* Verificar que el target existe antes de crear la reacción */
        $targetExiste = $tipo === LikesEnums::TIPO_PUBLICACION
            ? PublicacionesRepository::existe(['id' => $targetId])
            : SamplesRepository::existe(['id' => $targetId]);

        if (!$targetExiste) {
            return new \WP_REST_Response(['code' => 'target_no_encontrado', 'message' => 'El contenido no existe'], 404);
        }

        /*
         * C144/C145: UPSERT — si ya existe una reacción, la actualiza.
         * Un usuario solo puede tener UNA reacción por target.
         */
        LikesRepository::upsertReaccion($userId, $tipo, $targetId, $reaccion);

        /*
         * Recalcular total_likes: solo cuenta 'like' y 'encanta', NO 'dislike'.
         * Los dislikes no tienen contador público (C144).
         */
        if ($tipo === LikesEnums::TIPO_SAMPLE) {
            LikesRepository::recalcularTotalSample($targetId);

            /* Notificacion al creador (solo para like/encanta, no dislike) — C266 centralizado */
            if ($reaccion !== LikesEnums::REACCION_DISLIKE) {
                $sample = SamplesRepository::buscarInfoNotificacion($targetId);
                if ($sample) {
                    ServicioNotificaciones::likeSample(
                        (int) $sample[SamplesCols::CREADOR_ID],
                        $userId,
                        $targetId,
                        $sample[SamplesCols::TITULO] ?? '',
                        $sample[SamplesCols::SLUG] ?? null,
                        $reaccion
                    );
                }
            }
        } elseif ($tipo === LikesEnums::TIPO_PUBLICACION) {
            LikesRepository::recalcularTotalPublicacion($targetId);

            /* C266: Notificacion de like en publicacion */
            if ($reaccion !== LikesEnums::REACCION_DISLIKE) {
                $pub = PublicacionesRepository::buscarPorId($targetId);
                if ($pub) {
                    ServicioNotificaciones::likePublicacion(
                        (int) $pub[PublicacionesCols::AUTOR_ID],
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
        PlanificadorAlgoritmo::registrarInteraccion($userId, $reaccion === LikesEnums::REACCION_DISLIKE ? 'dislike' : 'like');

        return new \WP_REST_Response(['ok' => true, 'reaccion' => $reaccion], 200);
    }

    public static function quitarLike(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $tipo     = sanitize_text_field($request->get_param('tipo'));
        $targetId = (int) $request->get_param('target_id');

        LikesRepository::eliminarReaccion($userId, $tipo, $targetId);

        /* Recalcular total_likes (solo like+encanta, sin dislikes) */
        if ($tipo === LikesEnums::TIPO_SAMPLE) {
            LikesRepository::recalcularTotalSample($targetId);
        } elseif ($tipo === LikesEnums::TIPO_PUBLICACION) {
            LikesRepository::recalcularTotalPublicacion($targetId);
        }

        /* Invalidar cache del feed para que el algoritmo recalcule */
        MotorRecomendacion::invalidarCache($userId);

        return new \WP_REST_Response(['ok' => true, 'reaccion' => null], 200);
    }
}
