<?php

/**
 * AdminController — Panel de Administración (C179 — FASE 13)
 *
 * Endpoints admin-only para gestionar la plataforma:
 *   GET /admin/resumen     — KPIs y estadísticas generales
 *   GET /admin/usuarios    — Lista de usuarios con filtros
 *   PUT /admin/usuarios/{id} — Actualizar usuario (plan, rol, ban)
 *   GET /admin/moderacion  — Contenido pendiente de moderación
 *   POST /admin/moderar    — Aprobar/Rechazar contenido
 *   GET /admin/actividad   — Actividad reciente (gráfico)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\AdminRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\KamplesLogger;

class AdminController
{
    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        /* Resumen/Dashboard */
        register_rest_route($namespace, '/admin/resumen', [
            'methods' => 'GET',
            'callback' => [self::class, 'resumen'],
            'permission_callback' => $admin,
        ]);

        /* Actividad reciente (para gráfico) */
        register_rest_route($namespace, '/admin/actividad', [
            'methods' => 'GET',
            'callback' => [self::class, 'actividad'],
            'permission_callback' => $admin,
        ]);

        /* Usuarios */
        register_rest_route($namespace, '/admin/usuarios', [
            'methods' => 'GET',
            'callback' => [self::class, 'listarUsuarios'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/usuarios/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [self::class, 'actualizarUsuario'],
            'permission_callback' => $admin,
        ]);

        /* Moderación */
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
    }

    /*
     * GET /admin/resumen — KPIs principales de la plataforma
     */
    public static function resumen(): \WP_REST_Response
    {
        try {
            $kpis = AdminRepository::obtenerKpisResumen();

            if ($kpis === null) {
                KamplesLogger::error('AdminController::resumen — KPIs query retorno null');
                return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error obteniendo KPIs'], 500);
            }

            return new \WP_REST_Response(['data' => $kpis], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::resumen fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * GET /admin/actividad?dias=7 — Actividad por día (registros, uploads, descargas)
     */
    public static function actividad(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $dias = min(90, max(7, (int) ($request->get_param('dias') ?? 7)));

            $data = AdminRepository::obtenerActividadPorDias($dias);

            return new \WP_REST_Response(['data' => $data], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::actividad fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * GET /admin/usuarios?page=1&busqueda=&plan=&orden=fecha
     */
    public static function listarUsuarios(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $page = max(1, (int) ($request->get_param('page') ?? 1));
            $offset = ($page - 1) * 20;
            $busqueda = sanitize_text_field($request->get_param('busqueda') ?? '');
            $plan = sanitize_text_field($request->get_param('plan') ?? '');
            $orden = sanitize_text_field($request->get_param('orden') ?? 'fecha');

            $resultado = AdminRepository::listarUsuariosConEstadisticas(
                $busqueda,
                $plan,
                $orden,
                $offset
            );

            /* C193: Fallback avatar a WP Gravatar */
            foreach ($resultado['data'] as &$usr) {
                $usr['avatar_url'] = UsuarioHelper::resolverAvatarUrl(
                    $usr['avatar_url'] ?? null,
                    isset($usr['wp_user_id']) ? (int) $usr['wp_user_id'] : null
                );
                unset($usr['wp_user_id']);
            }
            unset($usr);

            return new \WP_REST_Response([
                'data' => [
                    'data' => $resultado['data'],
                    'total' => $resultado['total'],
                    'page' => $page,
                ],
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::listarUsuarios fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * PUT /admin/usuarios/{id} — Actualizar plan, rol, ban
     */
    public static function actualizarUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $body = $request->get_json_params();

            /* S33 fix: prevenir auto-modificación (admin no puede banearse/degradarse a sí mismo) */
            $currentPgId = UsuarioHelper::obtenerIdPg();
            if ($currentPgId && $id === $currentPgId) {
                return new \WP_REST_Response(['code' => 'auto_modificacion', 'message' => 'No puedes modificar tu propia cuenta desde el panel'], 400);
            }

            /* Verificar que el usuario existe antes de actualizar */
            if (!UsuariosExtRepository::existe([UsuariosExtCols::ID => $id])) {
                return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Usuario no encontrado'], 404);
            }

            $camposPermitidos = [];
            $params = [];

            if (isset($body['plan']) && in_array($body['plan'], [
                UsuariosExtEnums::PLAN_FREE,
                UsuariosExtEnums::PLAN_PRO,
                UsuariosExtEnums::PLAN_PREMIUM,
            ])) {
                $camposPermitidos[] = UsuariosExtCols::PLAN . ' = :plan';
                $params['plan'] = $body['plan'];
            }

            if (isset($body['rol']) && in_array($body['rol'], [
                UsuariosExtEnums::ROL_USUARIO,
                UsuariosExtEnums::ROL_CREADOR,
                UsuariosExtEnums::ROL_ADMIN,
            ])) {
                $camposPermitidos[] = UsuariosExtCols::ROL . ' = :rol';
                $params['rol'] = $body['rol'];
            }

            if (isset($body['verificado'])) {
                $camposPermitidos[] = UsuariosExtCols::VERIFICADO . ' = :verificado';
                $params['verificado'] = $body['verificado'] ? 'true' : 'false';
            }

            if (isset($body['ban_hasta'])) {
                if ($body['ban_hasta'] === null) {
                    $camposPermitidos[] = UsuariosExtCols::BANEADO_HASTA . ' = NULL';
                } else {
                    /* S34 fix: validar formato fecha ISO */
                    $ts = \strtotime($body['ban_hasta']);
                    if ($ts === false) {
                        return new \WP_REST_Response(['code' => 'fecha_invalida', 'message' => 'Formato de fecha inválido para ban_hasta'], 400);
                    }
                    $camposPermitidos[] = UsuariosExtCols::BANEADO_HASTA . ' = :ban_hasta';
                    $params['ban_hasta'] = date('Y-m-d H:i:s', $ts);
                }
            }

            if (empty($camposPermitidos)) {
                return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No hay campos para actualizar'], 400);
            }

            $camposPermitidos[] = UsuariosExtCols::UPDATED_AT . " = NOW()";

            UsuariosExtRepository::actualizarCamposAdmin($id, $camposPermitidos, $params);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::actualizarUsuario fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * GET /admin/moderacion?page=1 — Publicaciones pendientes + samples recientes
     */
    public static function listarModeracion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $page = max(1, (int) ($request->get_param('page') ?? 1));
            $offset = ($page - 1) * 20;

            /* Publicaciones pendientes de moderación */
            $publicaciones = PublicacionesRepository::listarPendientesModeracion($offset);

            /* Reportes pendientes */
            $reportes = ReportesRepository::listarPendientes();

            /* C193: Fallback avatar moderación */
            foreach ($publicaciones as &$pub) {
                $pub[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
                    $pub[UsuariosExtCols::AVATAR_URL] ?? null,
                    isset($pub[UsuariosExtCols::WP_USER_ID]) ? (int) $pub[UsuariosExtCols::WP_USER_ID] : null
                );
                unset($pub[UsuariosExtCols::WP_USER_ID]);
            }
            unset($pub);

            return new \WP_REST_Response([
                'data' => [
                    'publicaciones' => $publicaciones,
                    'reportes' => $reportes,
                ]
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::listarModeracion fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * POST /admin/moderar — Aprobar/Rechazar contenido
     * Body: { tipo: 'publicacion'|'comentario', id: number, accion: 'aprobar'|'rechazar' }
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

            $estado = $accion === 'aprobar' ? PublicacionesEnums::MODERACION_APROBADO : PublicacionesEnums::MODERACION_RECHAZADO;

            /* Delegar al repository según tipo de contenido */
            $existe = match ($tipo) {
                ComentariosEnums::TIPO_PUBLICACION => PublicacionesRepository::actualizarEstadoModeracion($id, $estado),
                'comentario'  => ComentariosRepository::actualizarEstadoModeracion($id, $estado),
                default       => false,
            };

            if (!$existe) {
                return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Contenido no encontrado'], 404);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::moderar fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }
}
