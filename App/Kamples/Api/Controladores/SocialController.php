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
use App\Kamples\Database\Repositories\BloqueosRepository;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\RelacionesSampleCols;
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

        /* QQ25: Endpoints de bloqueo user-to-user */
        register_rest_route($namespace, '/block/(?P<userId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'bloquearUsuario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/block/(?P<userId>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'desbloquearUsuario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/me/bloqueados', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'misBloqueados'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* QQ23: Reporte de usuario */
        register_rest_route($namespace, '/reportar-usuario/(?P<userId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'reportarUsuario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
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

            return new \WP_REST_Response(['ok' => true, 'reaccion' => $reaccion], 200);
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

            return new \WP_REST_Response(['ok' => true, 'reaccion' => null], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::quitarLike error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /* ---- QQ25: Bloqueo user-to-user ---- */

    public static function bloquearUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $targetId = (int) $request->get_param('userId');
            if ($targetId === $userId) {
                return new \WP_REST_Response(['code' => 'auto_bloqueo', 'message' => 'No puedes bloquearte a ti mismo'], 400);
            }

            /* Verificar que el usuario objetivo existe */
            $target = UsuariosExtRepository::buscarPorId($targetId);
            if (!$target) {
                return new \WP_REST_Response(['code' => 'usuario_no_encontrado', 'message' => 'Usuario no encontrado'], 404);
            }

            /* Rate limit: 10 bloqueos/minuto */
            $rl = RateLimiter::verificar("block:{$userId}", 10, 60);
            if (!$rl) {
                return new \WP_REST_Response(['code' => 'rate_limit', 'message' => 'Demasiadas acciones, intenta mas tarde'], 429);
            }

            BloqueosRepository::bloquear($userId, $targetId);

            /* Al bloquear, dejar de seguir mutuamente */
            FollowsRepository::dejarDeSeguir($userId, $targetId);
            FollowsRepository::dejarDeSeguir($targetId, $userId);
            FollowsRepository::actualizarContadores($userId, $targetId);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::bloquearUsuario error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function desbloquearUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $targetId = (int) $request->get_param('userId');
            BloqueosRepository::desbloquear($userId, $targetId);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::desbloquearUsuario error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function misBloqueados(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $lista = BloqueosRepository::listarBloqueados($userId);

            return new \WP_REST_Response(['data' => $lista], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::misBloqueados error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * QQ23: Reportar usuario.
     * Crea un reporte de tipo 'usuario' en la tabla de reportes,
     * visible en el panel de moderacion.
     */
    public static function reportarUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $reportadorId = UsuarioHelper::obtenerIdPg();
            if (!$reportadorId) return UsuarioHelper::respuestaNoEncontrado();

            /* Rate limit: 5 reportes de usuario cada 24h */
            $limitResp = RateLimiter::verificarUsuario($reportadorId, 'reportar_usuario', 5, 86400);
            if ($limitResp) return $limitResp;

            $targetId = (int) $request->get_param('userId');

            if ($reportadorId === $targetId) {
                return new \WP_REST_Response(['code' => 'no_self_report', 'message' => 'No puedes reportarte a ti mismo'], 400);
            }

            if (!UsuariosExtRepository::existe(['id' => $targetId])) {
                return new \WP_REST_Response(['code' => 'usuario_no_encontrado', 'message' => 'El usuario no existe'], 404);
            }

            $body   = $request->get_json_params();
            $razon  = \sanitize_text_field($body['razon'] ?? '');

            if (empty($razon)) {
                return new \WP_REST_Response(['code' => 'razon_requerida', 'message' => 'Indica el motivo del reporte'], 400);
            }

            if (mb_strlen($razon) > 500) {
                return new \WP_REST_Response(['code' => 'razon_larga', 'message' => 'El motivo no puede superar 500 caracteres'], 400);
            }

            $detalles = \sanitize_textarea_field($body['detalles'] ?? '');
            if (mb_strlen($detalles) > 2000) {
                $detalles = mb_substr($detalles, 0, 2000);
            }

            ReportesRepository::crearReporteUsuario($targetId, $reportadorId, $razon, !empty($detalles) ? $detalles : null);

            KamplesLogger::info('Reporte de usuario creado', [
                'reportador' => $reportadorId,
                'reportado'  => $targetId,
            ]);

            return new \WP_REST_Response(['ok' => true, 'message' => 'Reporte enviado'], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('SocialController::reportarUsuario error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
