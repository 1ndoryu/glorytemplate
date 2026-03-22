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
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\KamplesLogger;

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
                'tipo'      => ['required' => true, 'type' => 'string', 'enum' => [LikesEnums::TIPO_SAMPLE, LikesEnums::TIPO_PUBLICACION, LikesEnums::TIPO_CANCION, LikesEnums::TIPO_RELACION]],
                'target_id' => ['required' => true, 'type' => 'integer'],
                'reaccion'  => ['required' => false, 'type' => 'string', 'enum' => [LikesEnums::REACCION_LIKE, LikesEnums::REACCION_DISLIKE, LikesEnums::REACCION_ENCANTA], 'default' => LikesEnums::REACCION_LIKE],
            ],
        ]);

        register_rest_route($namespace, '/like', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'quitarLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'tipo'      => ['required' => true, 'type' => 'string', 'enum' => [LikesEnums::TIPO_SAMPLE, LikesEnums::TIPO_PUBLICACION, LikesEnums::TIPO_CANCION, LikesEnums::TIPO_RELACION]],
                'target_id' => ['required' => true, 'type' => 'integer'],
            ],
        ]);

        register_rest_route($namespace, '/me/seguidos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'misSeguidos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* QQ32: Lista paginada de seguidores de un usuario (publico) */
        register_rest_route($namespace, '/usuarios/(?P<username>[a-zA-Z0-9_-]+)/seguidores', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarSeguidores'],
            'permission_callback' => '__return_true',
            'args'                => [
                'page'    => ['default' => 1, 'type' => 'integer', 'minimum' => 1],
                'perPage' => ['default' => 20, 'type' => 'integer', 'minimum' => 1, 'maximum' => 50],
            ],
        ]);
    }

    /**
     * Lista de usuarios que el usuario actual sigue.
     * Devuelve IDs de usuarios para filtrado en el feed.
     */
    public static function misSeguidos(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $seguidos = FollowsRepository::idsSeguidos($userId);

            $ids = array_map(fn($row) => ['id' => (int) $row['id']], $seguidos);
            return new \WP_REST_Response(['data' => $ids], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::misSeguidos error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function seguir(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $seguidorId = UsuarioHelper::obtenerIdPg();
            if (!$seguidorId) return UsuarioHelper::respuestaNoEncontrado();

            /* C164: Rate limit — 20 follows por minuto */
            $limitResp = RateLimiter::verificarUsuario($seguidorId, 'follow', 20, 60);
            if ($limitResp) return $limitResp;

            /* QQ71: Verificar ban + suspensión */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($seguidorId);
            if ($cuentaResp) return $cuentaResp;

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
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::seguir error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function dejarDeSeguir(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $seguidorId = UsuarioHelper::obtenerIdPg();
            if (!$seguidorId) return UsuarioHelper::respuestaNoEncontrado();

            /* QQ71: Verificar ban + suspensión */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($seguidorId);
            if ($cuentaResp) return $cuentaResp;

            $targetId = (int) $request->get_param('userId');

            FollowsRepository::dejarDeSeguir($seguidorId, $targetId);
            FollowsRepository::actualizarContadores($seguidorId, $targetId);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::dejarDeSeguir error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function darLike(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            /* C164: Rate limit — 30 likes por minuto */
            $limitResp = RateLimiter::verificarUsuario($userId, 'like', 30, 60);
            if ($limitResp) return $limitResp;

            /* QQ71: Verificar ban + suspensión */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $tipo     = sanitize_text_field($request->get_param('tipo'));
            $targetId = (int) $request->get_param('target_id');
            $reaccion = sanitize_text_field($request->get_param('reaccion') ?? LikesEnums::REACCION_LIKE);

            /* Validar reacción */
            $reaccionesValidas = [LikesEnums::REACCION_LIKE, LikesEnums::REACCION_DISLIKE, LikesEnums::REACCION_ENCANTA];
            if (!in_array($reaccion, $reaccionesValidas, true)) {
                $reaccion = LikesEnums::REACCION_LIKE;
            }

            /* Verificar que el target existe antes de crear la reacción */
            $targetExiste = match ($tipo) {
                LikesEnums::TIPO_PUBLICACION => PublicacionesRepository::existe(['id' => $targetId]),
                LikesEnums::TIPO_CANCION     => \App\Kamples\Database\Repositories\CancionesRepository::existe(['id' => $targetId]),
                LikesEnums::TIPO_RELACION    => RelacionesSampleRepository::existe(['id' => $targetId]),
                default                      => SamplesRepository::existe(['id' => $targetId]),
            };

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
            } elseif ($tipo === LikesEnums::TIPO_CANCION) {
                LikesRepository::recalcularTotalCancion($targetId);
            } elseif ($tipo === LikesEnums::TIPO_RELACION) {
                LikesRepository::recalcularTotalRelacion($targetId);
            }

            /* Invalidar cache del feed para que el algoritmo recalcule */
            MotorRecomendacion::invalidarCache($userId);

            /* C45: registrar interacción para el planificador del algoritmo */
            PlanificadorAlgoritmo::registrarInteraccion($userId, $reaccion === LikesEnums::REACCION_DISLIKE ? 'dislike' : 'like');

            return new \WP_REST_Response(['ok' => true, 'data' => ['liked' => true, 'reaccion' => $reaccion]], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::darLike error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function quitarLike(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            /* QQ71: Verificar ban + suspensión */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $tipo     = sanitize_text_field($request->get_param('tipo'));
            $targetId = (int) $request->get_param('target_id');

            LikesRepository::eliminarReaccion($userId, $tipo, $targetId);

            /* Recalcular total_likes (solo like+encanta, sin dislikes) */
            if ($tipo === LikesEnums::TIPO_SAMPLE) {
                LikesRepository::recalcularTotalSample($targetId);
            } elseif ($tipo === LikesEnums::TIPO_PUBLICACION) {
                LikesRepository::recalcularTotalPublicacion($targetId);
            } elseif ($tipo === LikesEnums::TIPO_CANCION) {
                LikesRepository::recalcularTotalCancion($targetId);
            } elseif ($tipo === LikesEnums::TIPO_RELACION) {
                LikesRepository::recalcularTotalRelacion($targetId);
            }

            /* Invalidar cache del feed para que el algoritmo recalcule */
            MotorRecomendacion::invalidarCache($userId);

            return new \WP_REST_Response(['ok' => true, 'data' => ['liked' => false, 'reaccion' => null]], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::quitarLike error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /usuarios/{username}/seguidores — Lista paginada de seguidores (QQ32).
     * Devuelve array de usuarios resumidos con flag `siguiendo` relativo al viewer.
     */
    public static function listarSeguidores(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $username = sanitize_user($request->get_param('username'));
            $page = max(1, (int) ($request->get_param('page') ?? 1));
            $perPage = min(50, max(1, (int) ($request->get_param('perPage') ?? 20)));
            $offset = ($page - 1) * $perPage;

            $target = UsuariosExtRepository::buscarPorUsername($username);
            if (!$target) {
                return new \WP_REST_Response(['code' => 'usuario_no_encontrado', 'message' => 'Usuario no encontrado'], 404);
            }

            $targetId = (int) $target['id'];
            $seguidores = FollowsRepository::listarSeguidores($targetId, $perPage, $offset);
            $total = (int) ($target['total_seguidores'] ?? 0);

            /* Obtener IDs que el viewer sigue para marcar `siguiendo` */
            $viewerSeguidos = [];
            $currentWp = AuthMiddleware::obtenerUsuarioActual();
            if ($currentWp) {
                $viewerId = UsuariosExtRepository::obtenerIdPorWpId($currentWp['wp_user_id']);
                if ($viewerId) {
                    $rows = FollowsRepository::idsSeguidos($viewerId);
                    $viewerSeguidos = array_column($rows, 'id');
                }
            }

            $data = array_map(function ($row) use ($viewerSeguidos) {
                $id = (int) $row['id'];
                return [
                    'id'             => $id,
                    'username'       => $row['username'],
                    'nombreVisible'  => $row['nombre_visible'] ?? $row['username'],
                    'avatarUrl'      => UsuarioHelper::resolverAvatarUrl($row['avatar_url'] ?? null, (int) ($row['wp_user_id'] ?? 0)),
                    'siguiendo'      => in_array($id, $viewerSeguidos, false),
                ];
            }, $seguidores);

            return new \WP_REST_Response(['data' => $data, 'total' => $total], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::listarSeguidores error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
