<?php

/**
 * AdminModeracionController — Moderación de contenido (extraído de AdminController)
 *
 * Endpoints admin-only para moderar contenido de la plataforma:
 *   GET  /admin/moderacion                              — Publicaciones pendientes + reportes
 *   POST /admin/moderar                                 — Aprobar/Rechazar contenido (envia notif al rechazar)
 *   POST /admin/reportes/resolver                       — Resolver o descartar un reporte
 *   GET  /admin/moderacion/historial                    — Contenido auto-moderado por IA
 *   POST /admin/moderacion/banear-usuario               — Banear usuario manualmente
 *   POST /admin/moderacion/rechazar-usuario-publicaciones — Rechazar todas las pubs de un usuario
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Config\Schema\_generated\ReportesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Services\ServicioSuspension;
use App\Kamples\Services\ServicioNotificaciones;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\KamplesLogger;

class AdminModeracionController
{
    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        register_rest_route($namespace, '/admin/moderacion', [
            'methods' => 'GET',
            'callback' => [self::class, 'listarModeracion'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/moderar', [
            'methods' => 'POST',
            'callback' => [self::class, 'moderar'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/reportes/resolver', [
            'methods' => 'POST',
            'callback' => [self::class, 'resolverReporte'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/moderacion/historial', [
            'methods' => 'GET',
            'callback' => [self::class, 'historialModeracion'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/moderacion/rechazar-pendientes', [
            'methods' => 'POST',
            'callback' => [self::class, 'rechazarTodosPendientes'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/moderacion/banear-usuario', [
            'methods' => 'POST',
            'callback' => [self::class, 'banearUsuario'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/moderacion/rechazar-usuario-publicaciones', [
            'methods' => 'POST',
            'callback' => [self::class, 'rechazarPublicacionesUsuario'],
            'permission_callback' => $admin,
        ]);

        /* QQ65: Endpoints de suspensión y eliminación de usuarios */
        register_rest_route($namespace, '/admin/usuarios/(?P<id>\d+)/suspender', [
            'methods' => 'POST',
            'callback' => [self::class, 'suspenderUsuario'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/usuarios/(?P<id>\d+)/desuspender', [
            'methods' => 'POST',
            'callback' => [self::class, 'desuspenderUsuario'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/usuarios/(?P<id>\d+)/eliminar', [
            'methods' => 'POST',
            'callback' => [self::class, 'marcarEliminacionUsuario'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/usuarios/(?P<id>\d+)/cancelar-eliminacion', [
            'methods' => 'POST',
            'callback' => [self::class, 'cancelarEliminacionUsuario'],
            'permission_callback' => $admin,
        ]);
    }

    /*
     * GET /admin/moderacion?page=1&reportes_page=1 — Publicaciones pendientes + reportes
     * OPT05: Reportes ahora soportan paginacion independiente.
     * sentinel-disable-next-line php-service-retorna-asociativo — WP_REST_Response con arrays indexados
     */
    public static function listarModeracion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $page = max(1, (int) ($request->get_param('page') ?? 1));
            $offset = ($page - 1) * 20;

            $publicaciones = PublicacionesRepository::listarPendientesModeracion($offset);

            $reportesPage = max(1, (int) ($request->get_param('reportes_page') ?? 1));
            $reportesLimit = min(50, max(1, (int) ($request->get_param('reportes_limit') ?? 10)));
            $reportesOffset = ($reportesPage - 1) * $reportesLimit;
            $reportes = ReportesRepository::listarPendientes($reportesLimit, $reportesOffset);
            $reportesTotal = ReportesRepository::contarPendientes();

            /* C193: Fallback avatar + C351: Parsear imagenes PG array para el frontend */
            foreach ($publicaciones as &$pub) {
                $pub[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
                    $pub[UsuariosExtCols::AVATAR_URL] ?? null,
                    isset($pub[UsuariosExtCols::WP_USER_ID]) ? (int) $pub[UsuariosExtCols::WP_USER_ID] : null
                );
                unset($pub[UsuariosExtCols::WP_USER_ID]);
                $pub['imagenes'] = NormalizadorSample::pgArrayToPhp($pub['imagenes'] ?? null);
            }
            unset($pub);

            return new \WP_REST_Response([
                'data' => [
                    'publicaciones' => $publicaciones,
                    'reportes' => $reportes,
                    'reportesTotal' => $reportesTotal,
                ]
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::listarModeracion fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/moderar — Aprobar/Rechazar contenido
     * Body: { tipo: 'publicacion'|'comentario', id: number, accion: 'aprobar'|'rechazar' }
     * Al rechazar una publicación, se notifica al autor.
     */
    public static function moderar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $body = $request->get_json_params();
            $tipo = \sanitize_text_field($body['tipo'] ?? '');
            $id = (int) ($body['id'] ?? 0);
            $accion = \sanitize_text_field($body['accion'] ?? '');

            if (!in_array($tipo, [ComentariosEnums::TIPO_PUBLICACION, 'comentario']) || !$id || !in_array($accion, ['aprobar', 'rechazar'])) {
                return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'Parámetros inválidos'], 400);
            }

            $estado = $accion === 'aprobar' ? PublicacionesEnums::MODERACION_ESTADO_APROBADO : PublicacionesEnums::MODERACION_ESTADO_RECHAZADO;

            $existe = match ($tipo) {
                ComentariosEnums::TIPO_PUBLICACION => PublicacionesRepository::actualizarEstadoModeracion($id, $estado),
                'comentario'  => ComentariosRepository::actualizarEstadoModeracion($id, $estado),
                default       => false,
            };

            if (!$existe) {
                return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Contenido no encontrado'], 404);
            }

            /* Notificar al autor si es rechazo manual de publicación */
            if ($accion === 'rechazar' && $tipo === ComentariosEnums::TIPO_PUBLICACION) {
                $autorId = PublicacionesRepository::obtenerAutorId($id);
                if ($autorId) {
                    ServicioNotificaciones::crear(
                        $autorId,
                        'moderacion',
                        'Tu publicación fue revisada y rechazada por el equipo de moderación.',
                        ['razon' => 'revision_manual'],
                        null,
                        'Publicación rechazada'
                    );
                }
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::moderar fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/moderacion/banear-usuario
     * Body: { usuario_id: number, duracion: '1h'|'24h'|'7d'|'30d', razon: string }
     */
    public static function banearUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $body     = $request->get_json_params();
            $userId   = (int) ($body['usuario_id'] ?? 0);
            $duracion = \sanitize_text_field($body['duracion'] ?? '24h');
            $razon    = \sanitize_text_field($body['razon'] ?? 'Revisión manual');

            if (!$userId) {
                return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'usuario_id requerido'], 400);
            }

            ServicioBan::aplicarBanManual($userId, $duracion, $razon);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::banearUsuario fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/moderacion/rechazar-usuario-publicaciones
     * Body: { autor_id: number }
     * Rechaza todas las publicaciones no rechazadas de un usuario.
     */
    public static function rechazarPublicacionesUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $body    = $request->get_json_params();
            $autorId = (int) ($body['autor_id'] ?? 0);

            if (!$autorId) {
                return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'autor_id requerido'], 400);
            }

            $afectados = PublicacionesRepository::rechazarPublicacionesDeUsuario($autorId);

            /* Notificar al usuario que sus publicaciones fueron rechazadas masivamente */
            if ($afectados > 0) {
                ServicioNotificaciones::crear(
                    $autorId,
                    'moderacion',
                    "Se han rechazado {$afectados} de tus publicaciones tras una revisión del equipo de moderación.",
                    ['razon' => 'rechazo_masivo', 'afectados' => $afectados],
                    null,
                    'Publicaciones rechazadas'
                );
            }

            return new \WP_REST_Response(['ok' => true, 'afectados' => $afectados], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::rechazarPublicacionesUsuario fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/reportes/resolver — Resolver o descartar un reporte
     * Body: { id: number, accion: 'resolver'|'descartar' }
     */
    public static function resolverReporte(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $body = $request->get_json_params();
            $id = (int) ($body['id'] ?? 0);
            $accion = \sanitize_text_field($body['accion'] ?? '');

            if (!$id || !in_array($accion, ['resolver', 'descartar'])) {
                return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'Parámetros inválidos'], 400);
            }

            $estado = $accion === 'resolver' ? ReportesEnums::ESTADO_RESUELTO : ReportesEnums::ESTADO_DESCARTADO;
            $adminId = UsuarioHelper::obtenerIdPg();

            if (!$adminId) {
                return new \WP_REST_Response(['code' => 'sin_autenticacion', 'message' => 'No autenticado'], 401);
            }

            $actualizado = ReportesRepository::resolverReporte($id, $estado, $adminId);

            if (!$actualizado) {
                return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Reporte no encontrado o ya resuelto'], 404);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::resolverReporte fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * GET /admin/moderacion/historial?dias=2 — Contenido auto-moderado por IA recientemente
     * Permite a admins revisar decisiones de la IA (aprobadas, revisadas, rechazadas).
     */
    public static function historialModeracion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $dias = min(30, max(1, (int) ($request->get_param('dias') ?? 2)));

            $publicaciones = PublicacionesRepository::listarModeradasRecientes($dias);

            /* Fallback avatar + C351: Parsear imagenes PG array */
            foreach ($publicaciones as &$pub) {
                $pub[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
                    $pub[UsuariosExtCols::AVATAR_URL] ?? null,
                    isset($pub[UsuariosExtCols::WP_USER_ID]) ? (int) $pub[UsuariosExtCols::WP_USER_ID] : null
                );
                unset($pub[UsuariosExtCols::WP_USER_ID]);
                $pub['imagenes'] = NormalizadorSample::pgArrayToPhp($pub['imagenes'] ?? null);
            }
            unset($pub);

            return new \WP_REST_Response([
                'data' => ['publicaciones' => $publicaciones],
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::historialModeracion fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/moderacion/rechazar-pendientes
     * Rechaza todas las publicaciones pendientes/revisión de golpe.
     */
    public static function rechazarTodosPendientes(): \WP_REST_Response
    {
        try {
            $afectados = PublicacionesRepository::rechazarTodosPendientes();
            return new \WP_REST_Response(['ok' => true, 'afectados' => $afectados], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::rechazarTodosPendientes fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /* ---- QQ65: Suspensión y eliminación de usuarios ---- */

    /*
     * POST /admin/usuarios/{id}/suspender
     * Body: { horas: number, razon: string }
     * Duración en horas. Si no se envía, default 48h.
     */
    public static function suspenderUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $body = $request->get_json_params();
            $horas = max(1, (int) ($body['horas'] ?? 48));
            $razon = \sanitize_text_field($body['razon'] ?? 'Suspensión manual por equipo de moderación');

            if (!$id) {
                return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'ID de usuario requerido'], 400);
            }

            /* Prevenir auto-suspensión (QQ71: fail-safe si no se puede identificar al admin) */
            $currentPgId = UsuarioHelper::obtenerIdPg();
            if (!$currentPgId) {
                return new \WP_REST_Response(['code' => 'sin_identificacion', 'message' => 'No se pudo identificar al administrador'], 401);
            }
            if ($id === $currentPgId) {
                return new \WP_REST_Response(['code' => 'auto_modificacion', 'message' => 'No puedes suspenderte a ti mismo'], 400);
            }

            $ok = ServicioSuspension::suspender($id, $horas, $razon);
            if (!$ok) {
                return new \WP_REST_Response(['code' => 'error_suspension', 'message' => 'No se pudo suspender al usuario'], 500);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::suspenderUsuario fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/usuarios/{id}/desuspender
     * Sin body requerido. Restaura cuenta a estado activo.
     */
    public static function desuspenderUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            if (!$id) {
                return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'ID de usuario requerido'], 400);
            }

            $ok = ServicioSuspension::desuspender($id);
            if (!$ok) {
                return new \WP_REST_Response(['code' => 'error_desuspender', 'message' => 'No se pudo desuspender al usuario'], 500);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::desuspenderUsuario fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/usuarios/{id}/eliminar
     * Body: { razon: string }
     * Marca al usuario para eliminación (15 días de countdown).
     */
    public static function marcarEliminacionUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $body = $request->get_json_params();
            $razon = \sanitize_text_field($body['razon'] ?? 'Eliminación por equipo de moderación');

            if (!$id) {
                return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'ID de usuario requerido'], 400);
            }

            /* QQ71: Fail-safe si no se puede identificar al admin */
            $currentPgId = UsuarioHelper::obtenerIdPg();
            if (!$currentPgId) {
                return new \WP_REST_Response(['code' => 'sin_identificacion', 'message' => 'No se pudo identificar al administrador'], 401);
            }
            if ($id === $currentPgId) {
                return new \WP_REST_Response(['code' => 'auto_modificacion', 'message' => 'No puedes eliminar tu propia cuenta'], 400);
            }

            $ok = ServicioSuspension::marcarParaEliminacion($id, $razon);
            if (!$ok) {
                return new \WP_REST_Response(['code' => 'error_eliminacion', 'message' => 'No se pudo marcar para eliminación'], 500);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::marcarEliminacionUsuario fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/usuarios/{id}/cancelar-eliminacion
     * Cancela eliminación pendiente y restaura la cuenta.
     */
    public static function cancelarEliminacionUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            if (!$id) {
                return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'ID de usuario requerido'], 400);
            }

            $ok = ServicioSuspension::cancelarEliminacion($id);
            if (!$ok) {
                return new \WP_REST_Response(['code' => 'error_cancelar', 'message' => 'No se pudo cancelar la eliminación'], 500);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminModeracionController::cancelarEliminacionUsuario fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }
}
