<?php

/**
 * Kamples — Controlador REST API base
 *
 * Registra los endpoints bajo /wp-json/kamples/v1/
 * Aquí van las rutas principales de la plataforma.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\Database\PostgresService;
use App\Kamples\Database\VerificarPgvector;
use App\Kamples\Auth\AuthMiddleware;

class KamplesController
{
    private const NAMESPACE = 'kamples/v1';

    /*
     * Registra todos los endpoints de la API.
     * Se invoca desde el hook rest_api_init.
     */
    public static function registrar(): void
    {
        add_action('rest_api_init', [self::class, 'registrarRutas']);
    }

    public static function registrarRutas(): void
    {
        /* Health check — verifica conexión a Postgres */
        register_rest_route(self::NAMESPACE, '/health', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'health'],
            'permission_callback' => '__return_true',
        ]);

        /* Obtener samples con paginación y filtros básicos */
        register_rest_route(self::NAMESPACE, '/samples', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarSamples'],
            'permission_callback' => '__return_true',
            'args'                => self::argsListarSamples(),
        ]);

        /* Obtener un sample por slug */
        register_rest_route(self::NAMESPACE, '/samples/(?P<slug>[a-zA-Z0-9-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerSample'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug' => [
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_title',
                ],
            ],
        ]);

        /* Feed de descubrimiento (algoritmo) */
        register_rest_route(self::NAMESPACE, '/feed', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'feed'],
            'permission_callback' => '__return_true',
            'args'                => [
                'tipo' => [
                    'required' => false,
                    'type'     => 'string',
                    'default'  => 'descubrir',
                    'enum'     => ['descubrir', 'trending', 'recientes'],
                ],
                'page' => [
                    'required' => false,
                    'type'     => 'integer',
                    'default'  => 1,
                    'minimum'  => 1,
                ],
                'per_page' => [
                    'required' => false,
                    'type'     => 'integer',
                    'default'  => 20,
                    'minimum'  => 1,
                    'maximum'  => 100,
                ],
            ],
        ]);

        /* Perfil de usuario por username */
        register_rest_route(self::NAMESPACE, '/perfil/(?P<username>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerPerfil'],
            'permission_callback' => '__return_true',
            'args'                => [
                'username' => [
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_user',
                ],
            ],
        ]);

        /* =====================================================
         * ENDPOINTS PROTEGIDOS (requieren autenticación)
         * ===================================================== */

        /* Usuario autenticado actual */
        register_rest_route(self::NAMESPACE, '/me', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'usuarioActual'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Actualizar perfil del usuario autenticado */
        register_rest_route(self::NAMESPACE, '/me', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'actualizarPerfil'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Follow / Unfollow */
        register_rest_route(self::NAMESPACE, '/follow/(?P<userId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'seguir'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route(self::NAMESPACE, '/follow/(?P<userId>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'dejarDeSeguir'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Like / Unlike */
        register_rest_route(self::NAMESPACE, '/like', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'darLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'tipo'      => ['required' => true, 'type' => 'string', 'enum' => ['sample', 'publicacion']],
                'target_id' => ['required' => true, 'type' => 'integer'],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/like', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'quitarLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'tipo'      => ['required' => true, 'type' => 'string', 'enum' => ['sample', 'publicacion']],
                'target_id' => ['required' => true, 'type' => 'integer'],
            ],
        ]);

        /* =====================================================
         * MENSAJERÍA (Fase 7.2-7.3)
         * ===================================================== */

        /* Lista de conversaciones del usuario */
        register_rest_route(self::NAMESPACE, '/mensajes/conversaciones', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarConversaciones'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Mensajes de una conversación */
        register_rest_route(self::NAMESPACE, '/mensajes/(?P<conversacionId>\d+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerMensajes'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'conversacionId' => ['required' => true, 'type' => 'integer'],
                'page'           => ['required' => false, 'type' => 'integer', 'default' => 1],
            ],
        ]);

        /* Enviar mensaje */
        register_rest_route(self::NAMESPACE, '/mensajes/(?P<conversacionId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'enviarMensaje'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'conversacionId' => ['required' => true, 'type' => 'integer'],
            ],
        ]);

        /* Marcar conversación como leída */
        register_rest_route(self::NAMESPACE, '/mensajes/(?P<conversacionId>\d+)/leer', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'marcarConversacionLeida'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Iniciar nueva conversación */
        register_rest_route(self::NAMESPACE, '/mensajes/nueva', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'iniciarConversacion'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* =====================================================
         * DASHBOARD CREADOR (Fase 6.5)
         * ===================================================== */

        /* Estadísticas generales del creador */
        register_rest_route(self::NAMESPACE, '/dashboard/stats', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'dashboardStats'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Top samples del creador */
        register_rest_route(self::NAMESPACE, '/dashboard/top-samples', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'dashboardTopSamples'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Transacciones del creador */
        register_rest_route(self::NAMESPACE, '/dashboard/transacciones', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'dashboardTransacciones'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
            ],
        ]);

        /* Ingresos por período (para gráfica) */
        register_rest_route(self::NAMESPACE, '/dashboard/ingresos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'dashboardIngresos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'periodo' => ['required' => false, 'type' => 'string', 'default' => 'mes', 'enum' => ['semana', 'mes', 'anio']],
            ],
        ]);

        /* Notificaciones */
        register_rest_route(self::NAMESPACE, '/notificaciones', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarNotificaciones'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/notificaciones/(?P<id>\d+)/leer', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'marcarNotificacionLeida'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route(self::NAMESPACE, '/notificaciones/leer-todas', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'marcarTodasNotificacionesLeidas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* =====================================================
         * COLORES — Lista dinámica de imágenes (FASE 0.4)
         * ===================================================== */
        register_rest_route(self::NAMESPACE, '/colors', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarColores'],
            'permission_callback' => '__return_true',
        ]);

        /* =====================================================
         * UPLOAD DE SAMPLES (FASE 0.2)
         * ===================================================== */
        register_rest_route(self::NAMESPACE, '/samples/upload', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'subirSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* Verificación pgvector — solo para debug/desarrollo */
        register_rest_route(self::NAMESPACE, '/debug/pgvector', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'verificarPgvector'],
            'permission_callback' => '__return_true',
        ]);
    }

    /* 
     * Endpoint: GET /kamples/v1/health
     * Retorna el estado de la conexión a Postgres.
     */
    public static function health(): \WP_REST_Response
    {
        $conectado = PostgresService::estaConectado();

        return new \WP_REST_Response([
            'status'   => $conectado ? 'ok' : 'error',
            'database' => $conectado ? 'connected' : 'disconnected',
            'version'  => '1.0.0',
            'time'     => current_time('mysql'),
        ], $conectado ? 200 : 503);
    }

    /*
     * Endpoint: GET /kamples/v1/debug/pgvector
     * Ejecuta las verificaciones de pgvector y retorna reporte.
     */
    public static function verificarPgvector(): \WP_REST_Response
    {
        $resultados = VerificarPgvector::ejecutar();
        $todosOk = true;

        foreach ($resultados as $check) {
            if (!$check['ok']) {
                $todosOk = false;
                break;
            }
        }

        return new \WP_REST_Response([
            'status'  => $todosOk ? 'ok' : 'error',
            'checks'  => $resultados,
            'resumen' => $todosOk
                ? 'pgvector funcional — conexión, extensión, tabla e índice OK'
                : 'Hay errores en la configuración de pgvector',
        ], $todosOk ? 200 : 503);
    }

    /*
     * Endpoint: GET /kamples/v1/samples
     * Lista samples con paginación y filtros.
     */
    public static function listarSamples(\WP_REST_Request $request): \WP_REST_Response
    {
        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;
        $busqueda = $request->get_param('busqueda');
        $genero   = $request->get_param('genero');
        $bpmMin   = $request->get_param('bpm_min');
        $bpmMax   = $request->get_param('bpm_max');
        $key      = $request->get_param('key');
        $tipo     = $request->get_param('tipo');

        $where  = ["s.estado = 'activo'"];
        $params = [];

        if (!empty($busqueda)) {
            $where[]  = "(s.titulo ILIKE :busqueda OR s.descripcion ILIKE :busqueda)";
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        if (!empty($genero)) {
            $where[]  = "s.metadata->'genero' ? :genero";
            $params['genero'] = $genero;
        }

        if ($bpmMin !== null) {
            $where[]  = "s.bpm >= :bpm_min";
            $params['bpm_min'] = (int) $bpmMin;
        }

        if ($bpmMax !== null) {
            $where[]  = "s.bpm <= :bpm_max";
            $params['bpm_max'] = (int) $bpmMax;
        }

        if (!empty($key)) {
            $where[]  = "s.key = :key";
            $params['key'] = $key;
        }

        if (!empty($tipo)) {
            $where[]  = "s.tipo = :tipo";
            $params['tipo'] = $tipo;
        }

        $whereSQL = implode(' AND ', $where);

        /* Contar total */
        $totalRow = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM samples s WHERE {$whereSQL}",
            $params
        );
        $total = $totalRow ? (int) $totalRow['total'] : 0;

        /* Obtener samples */
        $params['limit']  = $perPage;
        $params['offset'] = $offset;

        $samples = PostgresService::consultar(
            "SELECT s.id, s.titulo, s.slug, s.bpm, s.key, s.escala, s.duracion,
                    s.tags, s.tipo, s.es_premium, s.ruta_preview, s.ruta_waveform,
                    s.imagen_url, s.total_descargas, s.total_likes,
                    u.id as creador_id, u.username, u.nombre_visible,
                    u.avatar_url, u.verificado
             FROM samples s
             LEFT JOIN usuarios_ext u ON s.creador_id = u.id
             WHERE {$whereSQL}
             ORDER BY s.publicado_at DESC NULLS LAST
             LIMIT :limit OFFSET :offset",
            $params
        );

        return new \WP_REST_Response([
            'data'       => $samples,
            'pagination' => [
                'page'      => $page,
                'per_page'  => $perPage,
                'total'     => $total,
                'pages'     => $total > 0 ? (int) ceil($total / $perPage) : 0,
            ],
        ], 200);
    }

    /*
     * Endpoint: GET /kamples/v1/samples/{slug}
     * Obtiene un sample individual por slug.
     */
    public static function obtenerSample(\WP_REST_Request $request): \WP_REST_Response
    {
        $slug = $request->get_param('slug');

        $sample = PostgresService::consultarUno(
            "SELECT s.*, u.username, u.nombre_visible, u.avatar_url, u.verificado
             FROM samples s
             LEFT JOIN usuarios_ext u ON s.creador_id = u.id
             WHERE s.slug = :slug AND s.estado = 'activo'",
            ['slug' => $slug]
        );

        if ($sample === null) {
            return new \WP_REST_Response([
                'code'    => 'sample_no_encontrado',
                'message' => 'El sample no existe o no está disponible.',
            ], 404);
        }

        return new \WP_REST_Response(['data' => $sample], 200);
    }

    /*
     * Endpoint: GET /kamples/v1/feed
     * Feed de descubrimiento con diferentes tipos.
     * TO-DO: implementar algoritmo real con señales de scoring.
     */
    public static function feed(\WP_REST_Request $request): \WP_REST_Response
    {
        $tipo    = $request->get_param('tipo');
        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        $orderBy = match ($tipo) {
            'trending'  => 'ORDER BY s.total_descargas DESC, s.total_likes DESC',
            'recientes' => 'ORDER BY s.publicado_at DESC NULLS LAST',
            default     => 'ORDER BY s.publicado_at DESC NULLS LAST',
        };

        $samples = PostgresService::consultar(
            "SELECT s.id, s.titulo, s.slug, s.bpm, s.key, s.escala, s.duracion,
                    s.tags, s.tipo, s.es_premium, s.ruta_preview, s.ruta_waveform,
                    s.imagen_url, s.total_descargas, s.total_likes,
                    u.id as creador_id, u.username, u.nombre_visible,
                    u.avatar_url, u.verificado
             FROM samples s
             LEFT JOIN usuarios_ext u ON s.creador_id = u.id
             WHERE s.estado = 'activo'
             {$orderBy}
             LIMIT :limit OFFSET :offset",
            ['limit' => $perPage, 'offset' => $offset]
        );

        return new \WP_REST_Response([
            'data' => $samples,
            'feed' => $tipo,
            'page' => $page,
        ], 200);
    }

    /*
     * Endpoint: GET /kamples/v1/perfil/{username}
     * Retorna perfil público de un usuario.
     */
    public static function obtenerPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $username = $request->get_param('username');

        $perfil = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, bio, avatar_url, portada_url,
                    plan, verificado, total_seguidores, total_seguidos,
                    total_samples, total_descargas, created_at
             FROM usuarios_ext
             WHERE username = :username",
            ['username' => $username]
        );

        if ($perfil === null) {
            return new \WP_REST_Response([
                'code'    => 'perfil_no_encontrado',
                'message' => 'El usuario no existe.',
            ], 404);
        }

        return new \WP_REST_Response(['data' => $perfil], 200);
    }

    /*
     * Endpoint: GET /kamples/v1/me
     * Retorna datos del usuario autenticado actual, mezclando WP + Postgres.
     */
    public static function usuarioActual(): \WP_REST_Response
    {
        $wpUser = AuthMiddleware::obtenerUsuarioActual();
        if (!$wpUser) {
            return new \WP_REST_Response(['code' => 'no_auth', 'message' => 'No autenticado'], 401);
        }

        /* Buscar extensión en Postgres */
        $ext = PostgresService::consultarUno(
            "SELECT * FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUser['wp_user_id']]
        );

        /* Si no existe, crear registro en Postgres al primer acceso */
        if (!$ext) {
            $id = PostgresService::insertar(
                "INSERT INTO usuarios_ext (wp_user_id, username, nombre_visible, avatar_url)
                 VALUES (:wpId, :username, :nombre, :avatar)
                 RETURNING id",
                [
                    'wpId'     => $wpUser['wp_user_id'],
                    'username' => $wpUser['username'],
                    'nombre'   => $wpUser['display_name'],
                    'avatar'   => $wpUser['avatar_url'],
                ]
            );

            $ext = PostgresService::consultarUno(
                "SELECT * FROM usuarios_ext WHERE id = :id",
                ['id' => $id]
            );
        }

        return new \WP_REST_Response(['data' => array_merge($wpUser, $ext ?? [])], 200);
    }

    /*
     * Endpoint: PUT /kamples/v1/me
     * Actualiza datos del perfil del usuario autenticado.
     * Acepta: nombreVisible (o nombreDisplay), username, bio, portadaUrl.
     */
    public static function actualizarPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $body     = $request->get_json_params();

        $campos = [];
        $params = ['wpId' => $wpUserId];

        /* Acepta nombreVisible o nombreDisplay (compatibilidad) */
        $nombre = $body['nombreVisible'] ?? $body['nombreDisplay'] ?? null;
        if ($nombre !== null) {
            $campos[]             = 'nombre_visible = :nombre';
            $params['nombre']     = sanitize_text_field($nombre);
        }

        if (isset($body['username'])) {
            $campos[]             = 'username = :username';
            $params['username']   = sanitize_user($body['username']);
        }

        if (isset($body['bio'])) {
            $campos[]         = 'bio = :bio';
            $params['bio']    = sanitize_textarea_field($body['bio']);
        }

        if (isset($body['portadaUrl'])) {
            $campos[]              = 'portada_url = :portada';
            $params['portada']     = esc_url_raw($body['portadaUrl']);
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No hay datos para actualizar'], 400);
        }

        $setSQL = implode(', ', $campos);

        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET {$setSQL}, updated_at = NOW() WHERE wp_user_id = :wpId",
            $params
        );

        return new \WP_REST_Response(['ok' => true, 'message' => 'Perfil actualizado'], 200);
    }

    /*
     * Endpoint: POST /kamples/v1/follow/{userId}
     * Seguir a un usuario.
     */
    public static function seguir(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId  = AuthMiddleware::obtenerWpUserId();
        $targetId  = (int) $request->get_param('userId');

        /* Obtener ID interno del seguidor */
        $seguidor = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$seguidor) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        if ((int) $seguidor['id'] === $targetId) {
            return new \WP_REST_Response(['code' => 'no_self_follow', 'message' => 'No puedes seguirte a ti mismo'], 400);
        }

        PostgresService::ejecutar(
            "INSERT INTO follows (seguidor_id, seguido_id)
             VALUES (:seguidor, :seguido)
             ON CONFLICT DO NOTHING",
            ['seguidor' => $seguidor['id'], 'seguido' => $targetId]
        );

        /* Actualizar contadores */
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET total_seguidores = (SELECT COUNT(*) FROM follows WHERE seguido_id = :id) WHERE id = :id",
            ['id' => $targetId]
        );
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET total_seguidos = (SELECT COUNT(*) FROM follows WHERE seguidor_id = :id) WHERE id = :id",
            ['id' => $seguidor['id']]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /*
     * Endpoint: DELETE /kamples/v1/follow/{userId}
     * Dejar de seguir a un usuario.
     */
    public static function dejarDeSeguir(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId  = AuthMiddleware::obtenerWpUserId();
        $targetId  = (int) $request->get_param('userId');

        $seguidor = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$seguidor) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        PostgresService::ejecutar(
            "DELETE FROM follows WHERE seguidor_id = :seguidor AND seguido_id = :seguido",
            ['seguidor' => $seguidor['id'], 'seguido' => $targetId]
        );

        /* Actualizar contadores */
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET total_seguidores = (SELECT COUNT(*) FROM follows WHERE seguido_id = :id) WHERE id = :id",
            ['id' => $targetId]
        );
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET total_seguidos = (SELECT COUNT(*) FROM follows WHERE seguidor_id = :id) WHERE id = :id",
            ['id' => $seguidor['id']]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /*
     * Endpoint: POST /kamples/v1/like
     * Da like a un sample o publicación.
     */
    public static function darLike(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $tipo     = sanitize_text_field($request->get_param('tipo'));
        $targetId = (int) $request->get_param('target_id');

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        PostgresService::ejecutar(
            "INSERT INTO likes (usuario_id, tipo, target_id)
             VALUES (:usuario, :tipo, :target)
             ON CONFLICT DO NOTHING",
            ['usuario' => $usuario['id'], 'tipo' => $tipo, 'target' => $targetId]
        );

        /* Actualizar contador */
        if ($tipo === 'sample') {
            PostgresService::ejecutar(
                "UPDATE samples SET total_likes = (SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = :id) WHERE id = :id",
                ['id' => $targetId]
            );
        }

        return new \WP_REST_Response(['ok' => true, 'liked' => true], 200);
    }

    /*
     * Endpoint: DELETE /kamples/v1/like
     * Quita like de un sample o publicación.
     */
    public static function quitarLike(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $tipo     = sanitize_text_field($request->get_param('tipo'));
        $targetId = (int) $request->get_param('target_id');

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        PostgresService::ejecutar(
            "DELETE FROM likes WHERE usuario_id = :usuario AND tipo = :tipo AND target_id = :target",
            ['usuario' => $usuario['id'], 'tipo' => $tipo, 'target' => $targetId]
        );

        /* Actualizar contador */
        if ($tipo === 'sample') {
            PostgresService::ejecutar(
                "UPDATE samples SET total_likes = (SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = :id) WHERE id = :id",
                ['id' => $targetId]
            );
        }

        return new \WP_REST_Response(['ok' => true, 'liked' => false], 200);
    }

    /*
     * Argumentos para el endpoint de listar samples.
     */
    private static function argsListarSamples(): array
    {
        return [
            'page' => [
                'required' => false,
                'type'     => 'integer',
                'default'  => 1,
                'minimum'  => 1,
            ],
            'per_page' => [
                'required' => false,
                'type'     => 'integer',
                'default'  => 20,
                'minimum'  => 1,
                'maximum'  => 100,
            ],
            'busqueda' => [
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'genero' => [
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'bpm_min' => [
                'required' => false,
                'type'     => 'integer',
                'minimum'  => 1,
                'maximum'  => 999,
            ],
            'bpm_max' => [
                'required' => false,
                'type'     => 'integer',
                'minimum'  => 1,
                'maximum'  => 999,
            ],
            'key' => [
                'required'          => false,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'tipo' => [
                'required' => false,
                'type'     => 'string',
                'enum'     => ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'],
            ],
        ];
    }

    /* =====================================================
     * MENSAJERÍA — Implementaciones (Fase 7.2-7.3)
     * ===================================================== */

    /*
     * Endpoint: GET /kamples/v1/mensajes/conversaciones
     * Lista conversaciones del usuario autenticado.
     */
    public static function listarConversaciones(): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        $userId = (int) $usuario['id'];

        $conversaciones = PostgresService::consultar(
            "SELECT c.id,
                    CASE WHEN c.participante_1 = :userId THEN c.participante_2 ELSE c.participante_1 END as otro_id,
                    c.ultimo_mensaje_at,
                    c.created_at
             FROM conversaciones c
             WHERE c.participante_1 = :userId OR c.participante_2 = :userId
             ORDER BY c.ultimo_mensaje_at DESC NULLS LAST",
            ['userId' => $userId]
        );

        /* Enriquecer con datos del otro participante y último mensaje */
        $resultado = [];
        foreach ($conversaciones as $conv) {
            $otroId = (int) $conv['otro_id'];

            $otro = PostgresService::consultarUno(
                "SELECT id, username, nombre_visible, avatar_url, verificado
                 FROM usuarios_ext WHERE id = :id",
                ['id' => $otroId]
            );

            $ultimoMsg = PostgresService::consultarUno(
                "SELECT contenido, created_at FROM mensajes
                 WHERE conversacion_id = :convId
                 ORDER BY created_at DESC LIMIT 1",
                ['convId' => $conv['id']]
            );

            $noLeidos = PostgresService::consultarUno(
                "SELECT COUNT(*) as total FROM mensajes
                 WHERE conversacion_id = :convId AND autor_id != :userId AND leido = false",
                ['convId' => $conv['id'], 'userId' => $userId]
            );

            $resultado[] = [
                'id'               => (int) $conv['id'],
                'participante'     => $otro,
                'ultimoMensaje'    => $ultimoMsg['contenido'] ?? '',
                'ultimoMensajeAt'  => $ultimoMsg['created_at'] ?? $conv['created_at'],
                'noLeidos'         => $noLeidos ? (int) $noLeidos['total'] : 0,
                'enLinea'          => false,
            ];
        }

        return new \WP_REST_Response(['data' => $resultado], 200);
    }

    /*
     * Endpoint: GET /kamples/v1/mensajes/{conversacionId}
     * Mensajes de una conversación con paginación.
     */
    public static function obtenerMensajes(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId      = AuthMiddleware::obtenerWpUserId();
        $conversacionId = (int) $request->get_param('conversacionId');
        $page          = (int) $request->get_param('page');
        $perPage       = 50;
        $offset        = ($page - 1) * $perPage;

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        /* Verificar que el usuario participa en la conversación */
        $conv = PostgresService::consultarUno(
            "SELECT id FROM conversaciones
             WHERE id = :convId AND (participante_1 = :userId OR participante_2 = :userId)",
            ['convId' => $conversacionId, 'userId' => $usuario['id']]
        );

        if (!$conv) {
            return new \WP_REST_Response(['code' => 'conversacion_no_encontrada'], 404);
        }

        $mensajes = PostgresService::consultar(
            "SELECT id, conversacion_id as \"conversacionId\", autor_id as \"remitenteId\",
                    contenido, leido, created_at as \"creadoAt\"
             FROM mensajes
             WHERE conversacion_id = :convId
             ORDER BY created_at ASC
             LIMIT :limit OFFSET :offset",
            ['convId' => $conversacionId, 'limit' => $perPage, 'offset' => $offset]
        );

        return new \WP_REST_Response(['data' => $mensajes], 200);
    }

    /*
     * Endpoint: POST /kamples/v1/mensajes/{conversacionId}
     * Enviar un mensaje en una conversación.
     */
    public static function enviarMensaje(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId       = AuthMiddleware::obtenerWpUserId();
        $conversacionId = (int) $request->get_param('conversacionId');
        $body           = $request->get_json_params();
        $contenido      = sanitize_textarea_field($body['contenido'] ?? '');

        if (empty($contenido)) {
            return new \WP_REST_Response(['code' => 'mensaje_vacio', 'message' => 'El mensaje no puede estar vacío'], 400);
        }

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        /* Verificar participación */
        $conv = PostgresService::consultarUno(
            "SELECT id FROM conversaciones
             WHERE id = :convId AND (participante_1 = :userId OR participante_2 = :userId)",
            ['convId' => $conversacionId, 'userId' => $usuario['id']]
        );

        if (!$conv) {
            return new \WP_REST_Response(['code' => 'conversacion_no_encontrada'], 404);
        }

        /* Insertar mensaje */
        $msgId = PostgresService::insertar(
            "INSERT INTO mensajes (conversacion_id, autor_id, contenido)
             VALUES (:convId, :autorId, :contenido)
             RETURNING id",
            ['convId' => $conversacionId, 'autorId' => $usuario['id'], 'contenido' => $contenido]
        );

        /* Actualizar timestamp de la conversación */
        PostgresService::ejecutar(
            "UPDATE conversaciones SET ultimo_mensaje_at = NOW() WHERE id = :convId",
            ['convId' => $conversacionId]
        );

        $mensaje = PostgresService::consultarUno(
            "SELECT id, conversacion_id as \"conversacionId\", autor_id as \"remitenteId\",
                    contenido, leido, created_at as \"creadoAt\"
             FROM mensajes WHERE id = :id",
            ['id' => $msgId]
        );

        return new \WP_REST_Response(['data' => $mensaje], 201);
    }

    /*
     * Endpoint: POST /kamples/v1/mensajes/{conversacionId}/leer
     * Marcar todos los mensajes de una conversación como leídos.
     */
    public static function marcarConversacionLeida(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId       = AuthMiddleware::obtenerWpUserId();
        $conversacionId = (int) $request->get_param('conversacionId');

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        PostgresService::ejecutar(
            "UPDATE mensajes SET leido = true
             WHERE conversacion_id = :convId AND autor_id != :userId AND leido = false",
            ['convId' => $conversacionId, 'userId' => $usuario['id']]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /*
     * Endpoint: POST /kamples/v1/mensajes/nueva
     * Iniciar una nueva conversación con otro usuario.
     */
    public static function iniciarConversacion(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId  = AuthMiddleware::obtenerWpUserId();
        $body      = $request->get_json_params();
        $otroId    = (int) ($body['usuarioId'] ?? 0);

        if ($otroId <= 0) {
            return new \WP_REST_Response(['code' => 'usuario_invalido'], 400);
        }

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        $userId = (int) $usuario['id'];

        if ($userId === $otroId) {
            return new \WP_REST_Response(['code' => 'no_self_chat', 'message' => 'No puedes chatear contigo mismo'], 400);
        }

        /* Verificar si ya existe conversación */
        $p1 = min($userId, $otroId);
        $p2 = max($userId, $otroId);

        $existente = PostgresService::consultarUno(
            "SELECT id FROM conversaciones
             WHERE participante_1 = :p1 AND participante_2 = :p2",
            ['p1' => $p1, 'p2' => $p2]
        );

        if ($existente) {
            return new \WP_REST_Response(['data' => ['id' => (int) $existente['id']]], 200);
        }

        /* Crear nueva conversación */
        $convId = PostgresService::insertar(
            "INSERT INTO conversaciones (participante_1, participante_2)
             VALUES (:p1, :p2) RETURNING id",
            ['p1' => $p1, 'p2' => $p2]
        );

        $otro = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, avatar_url, verificado
             FROM usuarios_ext WHERE id = :id",
            ['id' => $otroId]
        );

        return new \WP_REST_Response([
            'data' => [
                'id'              => (int) $convId,
                'participante'    => $otro,
                'ultimoMensaje'   => '',
                'ultimoMensajeAt' => (new \DateTime())->format('c'),
                'noLeidos'        => 0,
                'enLinea'         => false,
            ]
        ], 201);
    }

    /* =====================================================
     * DASHBOARD CREADOR — Implementaciones (Fase 6.5)
     * ===================================================== */

    /*
     * Endpoint: GET /kamples/v1/dashboard/stats
     * Estadísticas generales del creador autenticado.
     */
    public static function dashboardStats(): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $usuario = PostgresService::consultarUno(
            "SELECT id, total_seguidores, total_samples, total_descargas
             FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        $userId = (int) $usuario['id'];

        /* Descargas del mes actual */
        $descargasMes = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM descargas d
             JOIN samples s ON d.sample_id = s.id
             WHERE s.creador_id = :userId
             AND d.created_at >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        /* Reproducciones del mes */
        $reproduccionesMes = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM reproducciones r
             JOIN samples s ON r.sample_id = s.id
             WHERE s.creador_id = :userId
             AND r.created_at >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        /* Reproducciones totales */
        $reproduccionesTotal = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(s.total_reproducciones), 0) as total
             FROM samples s WHERE s.creador_id = :userId",
            ['userId' => $userId]
        );

        /* Seguidores nuevos este mes */
        $seguidoresNuevos = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM follows
             WHERE seguido_id = :userId
             AND created_at >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        /* Ingresos (transacciones) */
        $ingresosMes = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(pago_creador), 0) as total FROM transacciones
             WHERE creador_id = :userId AND estado = 'completed'
             AND created_at >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        $ingresosAnterior = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(pago_creador), 0) as total FROM transacciones
             WHERE creador_id = :userId AND estado = 'completed'
             AND created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
             AND created_at < date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        $ingresosTotal = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(pago_creador), 0) as total FROM transacciones
             WHERE creador_id = :userId AND estado = 'completed'",
            ['userId' => $userId]
        );

        return new \WP_REST_Response([
            'data' => [
                'ingresosTotal'       => (float) ($ingresosTotal['total'] ?? 0),
                'ingresosMes'         => (float) ($ingresosMes['total'] ?? 0),
                'ingresosAnterior'    => (float) ($ingresosAnterior['total'] ?? 0),
                'descargasTotal'      => (int) ($usuario['total_descargas'] ?? 0),
                'descargasMes'        => (int) ($descargasMes['total'] ?? 0),
                'reproduccionesTotal' => (int) ($reproduccionesTotal['total'] ?? 0),
                'reproduccionesMes'   => (int) ($reproduccionesMes['total'] ?? 0),
                'seguidoresTotal'     => (int) ($usuario['total_seguidores'] ?? 0),
                'seguidoresNuevosMes' => (int) ($seguidoresNuevos['total'] ?? 0),
                'samplesPublicados'   => (int) ($usuario['total_samples'] ?? 0),
            ],
        ], 200);
    }

    /*
     * Endpoint: GET /kamples/v1/dashboard/top-samples
     * Los samples más descargados del creador.
     */
    public static function dashboardTopSamples(): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        $samples = PostgresService::consultar(
            "SELECT s.id, s.titulo, s.slug,
                    s.total_descargas as descargas,
                    s.total_reproducciones as reproducciones,
                    s.total_likes as likes,
                    COALESCE((SELECT SUM(t.pago_creador) FROM transacciones t WHERE t.sample_id = s.id AND t.estado = 'completed'), 0) as ingresos
             FROM samples s
             WHERE s.creador_id = :userId AND s.estado = 'activo'
             ORDER BY s.total_descargas DESC
             LIMIT 10",
            ['userId' => $usuario['id']]
        );

        return new \WP_REST_Response(['data' => $samples], 200);
    }

    /*
     * Endpoint: GET /kamples/v1/dashboard/transacciones
     * Historial de transacciones del creador.
     */
    public static function dashboardTransacciones(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $page     = (int) $request->get_param('page');
        $perPage  = 20;
        $offset   = ($page - 1) * $perPage;

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        $transacciones = PostgresService::consultar(
            "SELECT t.id, t.created_at as fecha, t.monto, t.comision_plataforma as comision,
                    t.pago_creador as neto, t.estado,
                    s.titulo as sample,
                    u.username as comprador
             FROM transacciones t
             LEFT JOIN samples s ON t.sample_id = s.id
             LEFT JOIN usuarios_ext u ON t.comprador_id = u.id
             WHERE t.creador_id = :userId
             ORDER BY t.created_at DESC
             LIMIT :limit OFFSET :offset",
            ['userId' => $usuario['id'], 'limit' => $perPage, 'offset' => $offset]
        );

        return new \WP_REST_Response(['data' => $transacciones], 200);
    }

    /*
     * Endpoint: GET /kamples/v1/dashboard/ingresos
     * Ingresos agrupados por día para gráfica.
     */
    public static function dashboardIngresos(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $periodo  = $request->get_param('periodo');

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        $intervalo = match ($periodo) {
            'semana' => '7 days',
            'anio'   => '365 days',
            default  => '30 days',
        };

        $ingresos = PostgresService::consultar(
            "SELECT DATE(created_at) as fecha,
                    COALESCE(SUM(pago_creador), 0) as monto
             FROM transacciones
             WHERE creador_id = :userId
             AND estado = 'completed'
             AND created_at >= NOW() - INTERVAL '{$intervalo}'
             GROUP BY DATE(created_at)
             ORDER BY fecha ASC",
            ['userId' => $usuario['id']]
        );

        return new \WP_REST_Response(['data' => $ingresos], 200);
    }

    /* =====================================================
     * NOTIFICACIONES — Implementaciones (Fase 7.5)
     * ===================================================== */

    /*
     * Endpoint: GET /kamples/v1/notificaciones
     * Lista notificaciones del usuario autenticado.
     */
    public static function listarNotificaciones(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $page     = (int) $request->get_param('page');
        $perPage  = 30;
        $offset   = ($page - 1) * $perPage;

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        $notificaciones = PostgresService::consultar(
            "SELECT id, tipo, datos, leida, created_at as \"creadaAt\"
             FROM notificaciones
             WHERE usuario_id = :userId
             ORDER BY created_at DESC
             LIMIT :limit OFFSET :offset",
            ['userId' => $usuario['id'], 'limit' => $perPage, 'offset' => $offset]
        );

        return new \WP_REST_Response(['data' => $notificaciones], 200);
    }

    /*
     * Endpoint: POST /kamples/v1/notificaciones/{id}/leer
     * Marcar una notificación como leída.
     */
    public static function marcarNotificacionLeida(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $notifId  = (int) $request->get_param('id');

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        PostgresService::ejecutar(
            "UPDATE notificaciones SET leida = true WHERE id = :id AND usuario_id = :userId",
            ['id' => $notifId, 'userId' => $usuario['id']]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /*
     * Endpoint: POST /kamples/v1/notificaciones/leer-todas
     * Marcar todas las notificaciones como leídas.
     */
    public static function marcarTodasNotificacionesLeidas(): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();

        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
        }

        PostgresService::ejecutar(
            "UPDATE notificaciones SET leida = true WHERE usuario_id = :userId AND leida = false",
            ['userId' => $usuario['id']]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /* =====================================================
     * FASE 0.4 — Imágenes colors/ dinámicas
     * Lee el directorio colors/ del tema, cachea la lista 24h (transient WP).
     * ===================================================== */

    /*
     * Endpoint: GET /kamples/v1/colors
     * Retorna la lista de nombres de archivo de imágenes en colors/.
     */
    public static function listarColores(): \WP_REST_Response
    {
        $cacheKey = 'kamples_colors_list';
        $cached = get_transient($cacheKey);

        if ($cached !== false) {
            return new \WP_REST_Response([
                'ok'       => true,
                'imagenes' => $cached,
                'total'    => count($cached),
                'cache'    => true,
            ], 200);
        }

        $directorio = get_template_directory() . '/colors/';
        $imagenes = [];

        if (is_dir($directorio)) {
            $extensiones = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            $archivos = scandir($directorio);

            foreach ($archivos as $archivo) {
                if ($archivo === '.' || $archivo === '..') continue;
                $ext = strtolower(pathinfo($archivo, PATHINFO_EXTENSION));
                if (in_array($ext, $extensiones, true)) {
                    $imagenes[] = $archivo;
                }
            }

            sort($imagenes);
        }

        /* Cachear 24 horas */
        set_transient($cacheKey, $imagenes, DAY_IN_SECONDS);

        return new \WP_REST_Response([
            'ok'       => true,
            'imagenes' => $imagenes,
            'total'    => count($imagenes),
            'cache'    => false,
        ], 200);
    }

    /* =====================================================
     * FASE 0.2 + 2.1 + 2.7 — Upload de samples con pipeline completo
     * Recibe audio via multipart/form-data, genera ID corto,
     * ejecuta pipeline (waveform, IA, renombrado) y activa el sample.
     * ===================================================== */

    private const FORMATOS_AUDIO_VALIDOS = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/aiff', 'audio/x-wav', 'audio/x-aiff'];
    private const MAX_TAMANO_AUDIO = 50 * 1024 * 1024; /* 50 MB */

    /*
     * Endpoint: POST /kamples/v1/samples/upload
     * Sube un archivo de audio, genera ID corto, inserta en BD y ejecuta pipeline.
     * El pipeline analiza con IA, genera waveform, MP3 y renombra el archivo.
     */
    public static function subirSample(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $archivos = $request->get_file_params();

        if (empty($archivos['audio'])) {
            return new \WP_REST_Response([
                'ok'    => false,
                'error' => 'No se recibió archivo de audio',
            ], 400);
        }

        $audio = $archivos['audio'];

        /* Validar tipo MIME */
        if (!in_array($audio['type'], self::FORMATOS_AUDIO_VALIDOS, true)) {
            return new \WP_REST_Response([
                'ok'    => false,
                'error' => 'Formato de audio no válido. Formatos aceptados: WAV, MP3, FLAC, AIFF',
            ], 400);
        }

        /* Validar tamaño */
        if ($audio['size'] > self::MAX_TAMANO_AUDIO) {
            return new \WP_REST_Response([
                'ok'    => false,
                'error' => 'El archivo excede el tamaño máximo de 50 MB',
            ], 400);
        }

        /* Directorio personalizado: kamples/{user_id}/{Y}/{m}/ */
        $anio = date('Y');
        $mes = date('m');
        $subDir = "kamples/{$wpUserId}/{$anio}/{$mes}";
        $uploadDir = wp_upload_dir();
        $directorioDestino = $uploadDir['basedir'] . '/' . $subDir;

        if (!file_exists($directorioDestino)) {
            wp_mkdir_p($directorioDestino);
        }

        /* Agregar filtro temporal para cambiar el directorio de upload */
        $filtroDir = function ($paths) use ($subDir) {
            $paths['subdir'] = '/' . $subDir;
            $paths['path'] = $paths['basedir'] . '/' . $subDir;
            $paths['url'] = $paths['baseurl'] . '/' . $subDir;
            return $paths;
        };

        add_filter('upload_dir', $filtroDir);

        /* Usar wp_handle_upload para procesar el archivo */
        $subido = wp_handle_upload($audio, [
            'test_form' => false,
            'mimes'     => [
                'wav'  => 'audio/wav',
                'mp3'  => 'audio/mpeg',
                'flac' => 'audio/flac',
                'aiff' => 'audio/aiff',
            ],
        ]);

        remove_filter('upload_dir', $filtroDir);

        if (isset($subido['error'])) {
            return new \WP_REST_Response([
                'ok'    => false,
                'error' => 'Error al subir archivo: ' . $subido['error'],
            ], 500);
        }

        /* Datos adicionales del request (FormData fields) */
        $titulo = sanitize_text_field($request->get_param('titulo') ?? $audio['name']);
        $contenido = sanitize_textarea_field($request->get_param('contenido') ?? '');
        $tagsRaw = $request->get_param('tags');
        $tags = is_string($tagsRaw) ? json_decode($tagsRaw, true) ?? [] : (array) ($tagsRaw ?? []);
        $permitirDescarga = filter_var($request->get_param('permitir_descarga') ?? true, FILTER_VALIDATE_BOOLEAN);
        $licenciaLibre = filter_var($request->get_param('licencia_libre') ?? false, FILTER_VALIDATE_BOOLEAN);

        /* Generar ID corto único alfanumérico (7 chars, base62) */
        $idCorto = GeneradorIdCorto::generar();

        /* Generar slug con el ID corto para unicidad garantizada */
        $slug = sanitize_title($titulo) . '-' . $idCorto;

        /* Registrar en PostgreSQL */
        $usuario = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        if (!$usuario) {
            return new \WP_REST_Response([
                'ok'    => false,
                'error' => 'Usuario no encontrado en la base de datos',
            ], 404);
        }

        $sampleId = null;
        $tagsPostgres = '{' . implode(',', array_map('sanitize_text_field', $tags)) . '}';

        try {
            $resultado = PostgresService::consultarUno(
                "INSERT INTO samples (creador_id, titulo, slug, id_corto, descripcion, formato, tamano, ruta_original, estado, es_premium, tags, permitir_descarga, licencia_libre, created_at, updated_at)
                VALUES (:creadorId, :titulo, :slug, :idCorto, :descripcion, :formato, :tamano, :rutaOriginal, 'procesando', false, :tags, :descarga, :licencia, NOW(), NOW())
                RETURNING id",
                [
                    'creadorId'    => $usuario['id'],
                    'titulo'       => $titulo,
                    'slug'         => $slug,
                    'idCorto'      => $idCorto,
                    'descripcion'  => $contenido,
                    'formato'      => strtolower(pathinfo($audio['name'], PATHINFO_EXTENSION)),
                    'tamano'       => $audio['size'],
                    'rutaOriginal' => $subido['file'],
                    'tags'         => $tagsPostgres,
                    'descarga'     => $permitirDescarga ? 'true' : 'false',
                    'licencia'     => $licenciaLibre ? 'true' : 'false',
                ]
            );

            $sampleId = $resultado['id'] ?? null;
        } catch (\Exception $e) {
            error_log('[Kamples] Error al insertar sample en Postgres: ' . $e->getMessage());
        }

        /*
         * Ejecutar pipeline de procesamiento.
         * Incluye: duración, BPM/key (AnalizadorAudio), IA creativa (Gemini),
         * waveform, MP3/preview (FFmpeg), renombrado.
         * TO-DO: mover a background con wp_schedule_single_event() cuando el volumen crezca.
         */
        if ($sampleId) {
            try {
                PipelineAudio::procesar($sampleId, $subido['file'], $audio['name'], $idCorto, $contenido);
            } catch (\Exception $e) {
                error_log('[Kamples] Pipeline error (no bloqueante): ' . $e->getMessage());
            }
        }

        /* Recuperar el sample actualizado para retornar datos completos */
        $sampleFinal = null;
        if ($sampleId) {
            $sampleFinal = PostgresService::consultarUno(
                "SELECT id, titulo, slug, id_corto, bpm, key, escala, tipo, estado, metadata, tags,
                        ruta_original, ruta_optimizada, ruta_preview, ruta_waveform
                 FROM samples WHERE id = :id",
                ['id' => $sampleId]
            );
        }

        return new \WP_REST_Response([
            'ok'        => true,
            'sample_id' => $sampleId,
            'id_corto'  => $idCorto,
            'slug'      => $sampleFinal['slug'] ?? $slug,
            'url'       => $subido['url'],
            'estado'    => $sampleFinal['estado'] ?? 'procesando',
            'metadata'  => $sampleFinal['metadata'] ?? null,
            'bpm'       => $sampleFinal['bpm'] ?? null,
            'key'       => $sampleFinal['key'] ?? null,
            'tipo'      => $sampleFinal['tipo'] ?? null,
        ], 201);
    }
}
