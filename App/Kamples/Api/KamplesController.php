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
     */
    public static function actualizarPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $body     = $request->get_json_params();

        $campos = [];
        $params = ['wpId' => $wpUserId];

        if (isset($body['nombreDisplay'])) {
            $campos[]             = 'nombre_visible = :nombre';
            $params['nombre']     = sanitize_text_field($body['nombreDisplay']);
        }

        if (isset($body['username'])) {
            $campos[]             = 'username = :username';
            $params['username']   = sanitize_user($body['username']);
        }

        if (isset($body['bio'])) {
            $campos[]         = 'bio = :bio';
            $params['bio']    = sanitize_textarea_field($body['bio']);
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
}
