<?php

/**
 * AdminController — Panel de Administración (C179 — FASE 13)
 *
 * Endpoints admin-only para gestionar la plataforma:
 *   GET /admin/resumen       — KPIs y estadísticas generales
 *   GET /admin/actividad     — Actividad reciente (gráfico)
 *   GET /admin/usuarios      — Lista de usuarios con filtros
 *   PUT /admin/usuarios/{id} — Actualizar usuario (plan, rol, ban)
 *   DELETE /admin/samples/todos — Eliminar todos los samples (dev)
 *
 * Moderación delegada a AdminModeracionController.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\AdminRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Kamples\Auth\AuthMiddleware;
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

        /* Herramienta de dev: eliminar todos los samples (solo admin) */
        register_rest_route($namespace, '/admin/samples/todos', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'eliminarTodosLosSamples'],
            'permission_callback' => $admin,
        ]);

        /* QK40: Tablas de scrapers y cola de extracción */
        register_rest_route($namespace, '/admin/scrapers', [
            'methods' => 'GET',
            'callback' => [self::class, 'listarScrapers'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/cola-extraccion', [
            'methods' => 'GET',
            'callback' => [self::class, 'listarColaExtraccion'],
            'permission_callback' => $admin,
        ]);

        /* Moderación delegada a su propio controlador */
        AdminModeracionController::registrarRutas($namespace);
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
     * sentinel-disable-next-line php-service-retorna-asociativo — WP_REST_Response con data[] indexado
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
     * DELETE /admin/samples/todos — Elimina TODOS los samples (archivos físicos + BD en cascada).
     * Herramienta exclusiva para administradores en modo de desarrollo/testing.
     * Itera sample por sample para respetar la lógica de archivos de cada uno.
     */
    public static function eliminarTodosLosSamples(): \WP_REST_Response
    {
        try {
            $samples = SamplesRepository::obtenerTodosParaEliminar();

            if (empty($samples)) {
                return new \WP_REST_Response(['ok' => true, 'eliminados' => 0], 200);
            }

            $eliminados = 0;
            $errores    = 0;

            foreach ($samples as $sample) {
                $sampleId = (int) ($sample[SamplesCols::ID] ?? 0);
                if (!$sampleId) {
                    continue;
                }

                try {
                    SamplesModificacionController::eliminarArchivosFisicos($sample);
                    SamplesRepository::eliminarConCascada($sampleId);
                    $eliminados++;
                } catch (\Throwable $err) {
                    $errores++;
                    KamplesLogger::warning('Error eliminando sample en borrado masivo', [
                        'sampleId' => $sampleId,
                        'error'    => $err->getMessage(),
                    ]);
                }
            }

            KamplesLogger::info('Borrado masivo de samples completado', [
                'total'      => count($samples),
                'eliminados' => $eliminados,
                'errores'    => $errores,
            ]);

            return new \WP_REST_Response([
                'ok'         => true,
                'eliminados' => $eliminados,
                'errores'    => $errores,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::eliminarTodosLosSamples fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * QK40: GET /admin/scrapers?page=1&busqueda=&estado=
     * Lista paginada de scraping_log.
     */
    public static function listarScrapers(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $page = max(1, (int) ($request->get_param('page') ?? 1));
            $busqueda = sanitize_text_field($request->get_param('busqueda') ?? '');
            $estado = sanitize_text_field($request->get_param('estado') ?? '');
            $sortCol = sanitize_text_field($request->get_param('sort_col') ?? '');
            $sortDir = sanitize_text_field($request->get_param('sort_dir') ?? 'DESC');

            $resultado = AdminRepository::listarScrapingLog(
                ($page - 1) * 25,
                $busqueda,
                $estado,
                25,
                $sortCol,
                $sortDir
            );

            return new \WP_REST_Response(['data' => $resultado['data'], 'total' => $resultado['total']], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::listarScrapers fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /*
     * QK40: GET /admin/cola-extraccion?page=1&busqueda=&estado=
     * Lista paginada de cola_extraccion_samples.
     */
    public static function listarColaExtraccion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $page = max(1, (int) ($request->get_param('page') ?? 1));
            $busqueda = sanitize_text_field($request->get_param('busqueda') ?? '');
            $estado = sanitize_text_field($request->get_param('estado') ?? '');
            $sortCol = sanitize_text_field($request->get_param('sort_col') ?? '');
            $sortDir = sanitize_text_field($request->get_param('sort_dir') ?? 'DESC');

            $resultado = AdminRepository::listarColaExtraccion(
                ($page - 1) * 25,
                $busqueda,
                $estado,
                25,
                $sortCol,
                $sortDir
            );

            return new \WP_REST_Response(['data' => $resultado['data'], 'total' => $resultado['total']], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('AdminController::listarColaExtraccion fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }
}
