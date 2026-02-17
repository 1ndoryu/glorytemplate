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

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;

class AdminController
{
    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        /* Resumen/Dashboard */
        register_rest_route($namespace, '/admin/resumen', [
            'methods' => 'GET', 'callback' => [self::class, 'resumen'],
            'permission_callback' => $admin,
        ]);

        /* Actividad reciente (para gráfico) */
        register_rest_route($namespace, '/admin/actividad', [
            'methods' => 'GET', 'callback' => [self::class, 'actividad'],
            'permission_callback' => $admin,
        ]);

        /* Usuarios */
        register_rest_route($namespace, '/admin/usuarios', [
            'methods' => 'GET', 'callback' => [self::class, 'listarUsuarios'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/usuarios/(?P<id>\d+)', [
            'methods' => 'PUT', 'callback' => [self::class, 'actualizarUsuario'],
            'permission_callback' => $admin,
        ]);

        /* Moderación */
        register_rest_route($namespace, '/admin/moderacion', [
            'methods' => 'GET', 'callback' => [self::class, 'listarModeracion'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/moderar', [
            'methods' => 'POST', 'callback' => [self::class, 'moderar'],
            'permission_callback' => $admin,
        ]);
    }

    /*
     * GET /admin/resumen — KPIs principales de la plataforma
     */
    public static function resumen(): \WP_REST_Response
    {
        $kpis = PostgresService::consultarUno("
            SELECT
                (SELECT COUNT(*) FROM usuarios_ext) as total_usuarios,
                (SELECT COUNT(*) FROM samples WHERE estado = 'activo') as total_samples,
                (SELECT COUNT(*) FROM descargas) as total_descargas,
                (SELECT COUNT(*) FROM publicaciones) as total_publicaciones,
                (SELECT COUNT(*) FROM publicaciones WHERE moderacion_estado = 'pendiente') as pendientes_moderacion,
                (SELECT COUNT(*) FROM reportes WHERE estado = 'pendiente') as reportes_pendientes,
                (SELECT COUNT(*) FROM usuarios_ext WHERE plan = 'pro') as usuarios_pro,
                (SELECT COUNT(*) FROM usuarios_ext WHERE plan = 'premium') as usuarios_premium,
                (SELECT COUNT(*) FROM samples WHERE created_at > NOW() - INTERVAL '7 days') as samples_semana,
                (SELECT COUNT(*) FROM usuarios_ext WHERE created_at > NOW() - INTERVAL '7 days') as registros_semana
        ");

        return new \WP_REST_Response(['data' => $kpis], 200);
    }

    /*
     * GET /admin/actividad?dias=7 — Actividad por día (registros, uploads, descargas)
     */
    public static function actividad(\WP_REST_Request $request): \WP_REST_Response
    {
        $dias = min(90, max(7, (int) ($request->get_param('dias') ?? 7)));

        $registros = PostgresService::consultar(
            "SELECT DATE(created_at) as fecha, COUNT(*) as total
             FROM usuarios_ext
             WHERE created_at > NOW() - INTERVAL '{$dias} days'
             GROUP BY DATE(created_at) ORDER BY fecha"
        );

        $uploads = PostgresService::consultar(
            "SELECT DATE(created_at) as fecha, COUNT(*) as total
             FROM samples
             WHERE created_at > NOW() - INTERVAL '{$dias} days'
             GROUP BY DATE(created_at) ORDER BY fecha"
        );

        $descargas = PostgresService::consultar(
            "SELECT DATE(created_at) as fecha, COUNT(*) as total
             FROM descargas
             WHERE created_at > NOW() - INTERVAL '{$dias} days'
             GROUP BY DATE(created_at) ORDER BY fecha"
        );

        return new \WP_REST_Response([
            'data' => [
                'registros' => $registros,
                'uploads' => $uploads,
                'descargas' => $descargas,
            ]
        ], 200);
    }

    /*
     * GET /admin/usuarios?page=1&busqueda=&plan=&orden=fecha
     */
    public static function listarUsuarios(\WP_REST_Request $request): \WP_REST_Response
    {
        $page = max(1, (int) ($request->get_param('page') ?? 1));
        $offset = ($page - 1) * 20;
        $busqueda = sanitize_text_field($request->get_param('busqueda') ?? '');
        $plan = sanitize_text_field($request->get_param('plan') ?? '');
        $orden = sanitize_text_field($request->get_param('orden') ?? 'fecha');

        $params = ['offset' => $offset];
        $where = '1=1';

        if (!empty($busqueda)) {
            $where .= ' AND (u.username ILIKE :busqueda OR u.nombre_visible ILIKE :busqueda OR u.email ILIKE :busqueda)';
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        if (!empty($plan) && in_array($plan, ['free', 'pro', 'premium'])) {
            $where .= ' AND u.plan = :plan';
            $params['plan'] = $plan;
        }

        $orderBy = match ($orden) {
            'actividad' => 'u.updated_at DESC NULLS LAST',
            'samples' => 'total_samples DESC',
            default => 'u.created_at DESC',
        };

        $usuarios = PostgresService::consultar(
            "SELECT u.id, u.username, u.nombre_visible, u.email, u.avatar_url, u.wp_user_id,
                    u.plan, u.rol, u.verificado, u.ban_hasta,
                    u.created_at, u.updated_at,
                    (SELECT COUNT(*) FROM samples s WHERE s.creador_id = u.id AND s.estado = 'activo') as total_samples,
                    (SELECT COUNT(*) FROM descargas d WHERE d.usuario_id = u.id) as total_descargas
             FROM usuarios_ext u
             WHERE {$where}
             ORDER BY {$orderBy}
             LIMIT 20 OFFSET :offset",
            $params
        );

        /*
         * C235 fix: la query COUNT no usa :offset, pero $params lo incluye.
         * PDO nativo lanza excepción con parámetros sobrantes → query fallaba silenciosamente.
         */
        $paramsCount = array_diff_key($params, ['offset' => true]);
        $total = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM usuarios_ext u WHERE {$where}",
            $paramsCount
        );

        /* C193: Fallback avatar a WP Gravatar */
        foreach ($usuarios as &$usr) {
            $usr['avatar_url'] = UsuarioHelper::resolverAvatarUrl(
                $usr['avatar_url'] ?? null,
                isset($usr['wp_user_id']) ? (int) $usr['wp_user_id'] : null
            );
            unset($usr['wp_user_id']);
        }
        unset($usr);

        return new \WP_REST_Response([
            'data' => [
                'data' => $usuarios,
                'total' => (int) ($total['total'] ?? 0),
                'page' => $page,
            ],
        ], 200);
    }

    /*
     * PUT /admin/usuarios/{id} — Actualizar plan, rol, ban
     */
    public static function actualizarUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $body = $request->get_json_params();

        $camposPermitidos = [];
        $params = ['id' => $id];

        if (isset($body['plan']) && in_array($body['plan'], ['free', 'pro', 'premium'])) {
            $camposPermitidos[] = 'plan = :plan';
            $params['plan'] = $body['plan'];
        }

        if (isset($body['rol']) && in_array($body['rol'], ['usuario', 'creador', 'admin'])) {
            $camposPermitidos[] = 'rol = :rol';
            $params['rol'] = $body['rol'];
        }

        if (isset($body['verificado'])) {
            $camposPermitidos[] = 'verificado = :verificado';
            $params['verificado'] = $body['verificado'] ? 'true' : 'false';
        }

        if (isset($body['ban_hasta'])) {
            if ($body['ban_hasta'] === null) {
                $camposPermitidos[] = 'ban_hasta = NULL';
            } else {
                $camposPermitidos[] = 'ban_hasta = :ban_hasta';
                $params['ban_hasta'] = $body['ban_hasta'];
            }
        }

        if (empty($camposPermitidos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No hay campos para actualizar'], 400);
        }

        $camposPermitidos[] = "updated_at = NOW()";
        $set = implode(', ', $camposPermitidos);

        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET {$set} WHERE id = :id",
            $params
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /*
     * GET /admin/moderacion?page=1 — Publicaciones pendientes + samples recientes
     */
    public static function listarModeracion(\WP_REST_Request $request): \WP_REST_Response
    {
        $page = max(1, (int) ($request->get_param('page') ?? 1));
        $offset = ($page - 1) * 20;

        /* Publicaciones pendientes de moderación */
        $publicaciones = PostgresService::consultar(
            "SELECT p.id, p.contenido, p.moderacion_estado, p.moderacion_detalle,
                    p.created_at, u.username, u.nombre_visible, u.avatar_url, u.wp_user_id,
                    'publicacion' as tipo_contenido
             FROM publicaciones p
             JOIN usuarios_ext u ON p.usuario_id = u.id
             WHERE p.moderacion_estado IN ('pendiente', 'revision')
             ORDER BY p.created_at DESC
             LIMIT 20 OFFSET :offset",
            ['offset' => $offset]
        );

        /* Reportes pendientes */
        $reportes = PostgresService::consultar(
            "SELECT r.*, u.username as reportador_username
             FROM reportes r
             JOIN usuarios_ext u ON r.reportador_id = u.id
             WHERE r.estado = 'pendiente'
             ORDER BY r.created_at DESC
             LIMIT 10"
        );

        /* C193: Fallback avatar moderación */
        foreach ($publicaciones as &$pub) {
            $pub['avatar_url'] = UsuarioHelper::resolverAvatarUrl(
                $pub['avatar_url'] ?? null,
                isset($pub['wp_user_id']) ? (int) $pub['wp_user_id'] : null
            );
            unset($pub['wp_user_id']);
        }
        unset($pub);

        return new \WP_REST_Response([
            'data' => [
                'publicaciones' => $publicaciones,
                'reportes' => $reportes,
            ]
        ], 200);
    }

    /*
     * POST /admin/moderar — Aprobar/Rechazar contenido
     * Body: { tipo: 'publicacion'|'comentario', id: number, accion: 'aprobar'|'rechazar' }
     */
    public static function moderar(\WP_REST_Request $request): \WP_REST_Response
    {
        $body = $request->get_json_params();
        $tipo = sanitize_text_field($body['tipo'] ?? '');
        $id = (int) ($body['id'] ?? 0);
        $accion = sanitize_text_field($body['accion'] ?? '');

        if (!in_array($tipo, ['publicacion', 'comentario']) || !$id || !in_array($accion, ['aprobar', 'rechazar'])) {
            return new \WP_REST_Response(['code' => 'params_invalidos', 'message' => 'Parámetros inválidos'], 400);
        }

        $estado = $accion === 'aprobar' ? 'aprobado' : 'rechazado';
        $tabla = $tipo === 'publicacion' ? 'publicaciones' : 'comentarios';

        PostgresService::ejecutar(
            "UPDATE {$tabla} SET moderacion_estado = :estado WHERE id = :id",
            ['estado' => $estado, 'id' => $id]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }
}
