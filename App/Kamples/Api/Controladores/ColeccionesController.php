<?php

/**
 * ColeccionesController — CRUD de colecciones + sugerencias.
 *
 * Endpoints:
 *   GET    /colecciones              — Listar colecciones del usuario
 *   POST   /colecciones              — Crear colección
 *   GET    /colecciones/{id}         — Detalle con samples
 *   PUT    /colecciones/{id}         — Editar colección
 *   DELETE /colecciones/{id}         — Eliminar colección
 *   POST   /colecciones/{id}/samples — Agregar sample a colección
 *   DELETE /colecciones/{id}/samples — Quitar sample
 *   GET    /colecciones/{id}/sugerencias — Samples similares (Más Ideas)
 *   GET    /colecciones/explorar     — Colecciones públicas de otros
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Services\ConstructorSenales;
use App\Kamples\Services\MotorRecomendacion;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\ColeccionesCols;

class ColeccionesController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/colecciones', [
            'methods' => 'GET', 'callback' => [self::class, 'listar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/explorar', [
            'methods' => 'GET', 'callback' => [self::class, 'explorar'],
            'permission_callback' => '__return_true',
            'args' => ['page' => ['required' => false, 'type' => 'integer', 'default' => 1]],
        ]);

        register_rest_route($namespace, '/colecciones', [
            'methods' => 'POST', 'callback' => [self::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)', [
            'methods' => 'GET', 'callback' => [self::class, 'obtener'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)', [
            'methods' => 'PUT', 'callback' => [self::class, 'actualizar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)', [
            'methods' => 'DELETE', 'callback' => [self::class, 'eliminar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/samples', [
            'methods' => 'POST', 'callback' => [self::class, 'agregarSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/samples', [
            'methods' => 'DELETE', 'callback' => [self::class, 'quitarSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/colecciones/(?P<id>\d+)/sugerencias', [
            'methods' => 'GET', 'callback' => [self::class, 'sugerencias'],
            'permission_callback' => '__return_true',
            'args' => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        /* Modal "Guardar en colección" — colecciones relevantes para un sample */
        register_rest_route($namespace, '/colecciones/relevantes/(?P<sampleId>\d+)', [
            'methods' => 'GET', 'callback' => [self::class, 'relevantesParaSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /* C169: Soporte busqueda en mis colecciones */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $busqueda = sanitize_text_field($request->get_param('busqueda') ?? '');
        $params = ['userId' => $userId];
        $where = 'c.usuario_id = :userId';

        if (!empty($busqueda)) {
            $where .= ' AND (c.nombre ILIKE :busqueda OR c.descripcion ILIKE :busqueda)';
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        $colecciones = PostgresService::consultar(
            "SELECT c.*, (SELECT COUNT(*) FROM coleccion_samples cs WHERE cs.coleccion_id = c.id) as total_items
             FROM colecciones c WHERE {$where} ORDER BY c.updated_at DESC",
            $params
        );

        return new \WP_REST_Response(['data' => $colecciones], 200);
    }

    /*
     * C169: Soporte busqueda + C181: Algoritmo de relevancia personalizada.
     * Si el usuario está autenticado, ordena por afinidad de tags.
     * Sino, ordena por updated_at DESC (fallback).
     */
    public static function explorar(\WP_REST_Request $request): \WP_REST_Response
    {
        $page = max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 20;
        $busqueda = sanitize_text_field($request->get_param('busqueda') ?? '');
        $userId = UsuarioHelper::obtenerIdPg();

        $params = ['offset' => $offset];
        $whereBusqueda = '';

        if (!empty($busqueda)) {
            $whereBusqueda = ' AND (c.nombre ILIKE :busqueda OR c.descripcion ILIKE :busqueda)';
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        /*
         * C181: Si hay usuario autenticado, score por afinidad de tags.
         * CTE user_tags: top 15 tags del usuario (likes ponderados).
         * CTE coleccion_tags: tags agregados de cada coleccion.
         * Score: interseccion de tags normalizada + follow boost + frescura.
         */
        if ($userId) {
            $params['userId'] = $userId;
            $tagsLiked = ConstructorSenales::sqlTagsEnriquecidos('s_l');

            $sql = "
                WITH user_tags AS (
                    SELECT tag, SUM(peso) as afinidad
                    FROM (
                        SELECT UNNEST({$tagsLiked}) as tag,
                               CASE WHEN l.reaccion = 'encanta' THEN 2.0 ELSE 1.0 END as peso
                        FROM likes l
                        JOIN samples s_l ON l.target_id = s_l.id
                        WHERE l.usuario_id = :userId AND l.tipo = 'sample'
                          AND l.reaccion IN ('like','encanta')
                        LIMIT 200
                    ) liked_tags
                    GROUP BY tag ORDER BY afinidad DESC LIMIT 15
                ),
                coleccion_tags AS (
                    SELECT cs.coleccion_id,
                           array_agg(DISTINCT tag_val) as todos_tags,
                           COUNT(DISTINCT cs.sample_id) as items
                    FROM coleccion_samples cs
                    JOIN samples s_c ON cs.sample_id = s_c.id
                    CROSS JOIN LATERAL UNNEST(s_c.tags) as tag_val
                    WHERE s_c.estado = 'activo'
                    GROUP BY cs.coleccion_id
                )
                SELECT sub.* FROM (
                    SELECT c.*, u.username, u.nombre_visible, u.avatar_url, u.wp_user_id,
                           COALESCE(ct.items, 0) as total_items,
                           COALESCE((
                               SELECT SUM(ut.afinidad)
                               FROM user_tags ut
                               WHERE ut.tag = ANY(ct.todos_tags)
                           ), 0) / GREATEST(1.0, array_length(ct.todos_tags, 1)::float) as tag_score,
                           CASE WHEN EXISTS(
                               SELECT 1 FROM follows WHERE seguidor_id = :userId AND seguido_id = c.usuario_id
                           ) THEN 1.3 ELSE 1.0 END as follow_boost,
                           1.0 / (1.0 + EXTRACT(EPOCH FROM NOW() - c.updated_at) / 86400.0) as frescura
                    FROM colecciones c
                    JOIN usuarios_ext u ON c.usuario_id = u.id
                    LEFT JOIN coleccion_tags ct ON ct.coleccion_id = c.id
                    WHERE c.publica = true
                      AND COALESCE(ct.items, (SELECT COUNT(*) FROM coleccion_samples cs2 WHERE cs2.coleccion_id = c.id)) > 0
                      {$whereBusqueda}
                ) sub
                ORDER BY (
                    COALESCE(sub.tag_score, 0) * 0.60
                    * sub.follow_boost
                    + sub.frescura * 0.20
                    + LEAST(sub.total_items::float / 20.0, 1.0) * 0.20
                ) DESC,
                sub.updated_at DESC
                LIMIT 20 OFFSET :offset
            ";
        } else {
            /* Sin usuario: orden por actualización */
            $sql = "
                SELECT c.*, u.username, u.nombre_visible, u.avatar_url, u.wp_user_id,
                       (SELECT COUNT(*) FROM coleccion_samples cs WHERE cs.coleccion_id = c.id) as total_items
                FROM colecciones c
                JOIN usuarios_ext u ON c.usuario_id = u.id
                WHERE c.publica = true
                  AND (SELECT COUNT(*) FROM coleccion_samples cs WHERE cs.coleccion_id = c.id) > 0
                  {$whereBusqueda}
                ORDER BY c.updated_at DESC
                LIMIT 20 OFFSET :offset
            ";
        }

        $colecciones = PostgresService::consultar($sql, $params);

        /* C193: Fallback avatar a WP Gravatar */
        foreach ($colecciones as &$col) {
            $col[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
                $col[UsuariosExtCols::AVATAR_URL] ?? null,
                isset($col[UsuariosExtCols::WP_USER_ID]) ? (int) $col[UsuariosExtCols::WP_USER_ID] : null
            );
            unset($col[UsuariosExtCols::WP_USER_ID]);
        }
        unset($col);

        return new \WP_REST_Response(['data' => $colecciones], 200);
    }

    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* C164: Rate limit — 10 colecciones por hora */
        $limitResp = RateLimiter::verificarUsuario($userId, 'crear_coleccion', 10, 3600);
        if ($limitResp) return $limitResp;

        $body = $request->get_json_params();
        $nombre = sanitize_text_field($body['nombre'] ?? '');
        $descripcion = sanitize_textarea_field($body['descripcion'] ?? '');
        $publica = (bool) ($body['publica'] ?? true);

        if (empty($nombre)) {
            return new \WP_REST_Response(['code' => 'nombre_requerido', 'message' => 'El nombre es obligatorio'], 400);
        }

        /* C164: Validar longitudes */
        $errorNombre = Validador::validarLongitud($nombre, Validador::MAX_NOMBRE_COLECCION, 'El nombre');
        if ($errorNombre) return Validador::respuestaError($errorNombre);
        if (!empty($descripcion)) {
            $errorDesc = Validador::validarLongitud($descripcion, Validador::MAX_DESCRIPCION_COLECCION, 'La descripción');
            if ($errorDesc) return Validador::respuestaError($errorDesc);
        }

        $id = PostgresService::insertar(
            "INSERT INTO colecciones (usuario_id, nombre, descripcion, publica)
             VALUES (:userId, :nombre, :desc, :publica) RETURNING id",
            ['userId' => $userId, 'nombre' => $nombre, 'desc' => $descripcion, 'publica' => $publica ? 'true' : 'false']
        );

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
    }

    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $coleccion = PostgresService::consultarUno(
            "SELECT c.*, u.username, u.nombre_visible, u.avatar_url, u.wp_user_id
             FROM colecciones c JOIN usuarios_ext u ON c.usuario_id = u.id WHERE c.id = :id",
            ['id' => $id]
        );

        if (!$coleccion) {
            return new \WP_REST_Response(['code' => 'coleccion_no_encontrada'], 404);
        }

        /*
         * Seguridad: solo mostrar colecciones privadas al propietario.
         * Las colecciones publicas son accesibles para todos.
         */
        $esPublica = (bool) ($coleccion[ColeccionesCols::PUBLICA] ?? true);
        if (!$esPublica) {
            $usuarioActual = UsuarioHelper::obtenerIdPg();
            if (!$usuarioActual || $usuarioActual !== (int) $coleccion[ColeccionesCols::USUARIO_ID]) {
                return new \WP_REST_Response(['code' => 'coleccion_no_encontrada'], 404);
            }
        }

        /* Samples de la colección */
        $samples = PostgresService::consultar(
            NormalizadorSample::sqlSelectSamples()
            . " JOIN coleccion_samples cs ON cs.sample_id = s.id
                WHERE cs.coleccion_id = :colId AND s.estado = 'activo'
                ORDER BY cs.posicion ASC, cs.added_at DESC",
            ['colId' => $id]
        );

        $coleccion['samples'] = NormalizadorSample::normalizarLista($samples);
        $coleccion['total_items'] = count($samples);

        /* C193: Fallback avatar propietario */
        $coleccion[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl(
            $coleccion[UsuariosExtCols::AVATAR_URL] ?? null,
            isset($coleccion[UsuariosExtCols::WP_USER_ID]) ? (int) $coleccion[UsuariosExtCols::WP_USER_ID] : null
        );
        unset($coleccion[UsuariosExtCols::WP_USER_ID]);

        return new \WP_REST_Response(['data' => $coleccion], 200);
    }

    public static function actualizar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $body = $request->get_json_params();

        /* Verificar propiedad */
        $coleccion = PostgresService::consultarUno(
            "SELECT id FROM colecciones WHERE id = :id AND usuario_id = :userId",
            ['id' => $id, 'userId' => $userId]
        );
        if (!$coleccion) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
        }

        $campos = [];
        $params = ['id' => $id];

        if (isset($body['nombre'])) {
            /* C164: Validar longitud nombre */
            $errorNombre = Validador::validarLongitud($body['nombre'], Validador::MAX_NOMBRE_COLECCION, 'El nombre');
            if ($errorNombre) return Validador::respuestaError($errorNombre);
            $campos[] = 'nombre = :nombre'; $params['nombre'] = sanitize_text_field($body['nombre']);
        }
        if (isset($body['descripcion'])) {
            /* C164: Validar longitud descripcion */
            $errorDesc = Validador::validarLongitud($body['descripcion'], Validador::MAX_DESCRIPCION_COLECCION, 'La descripción');
            if ($errorDesc) return Validador::respuestaError($errorDesc);
            $campos[] = 'descripcion = :desc'; $params['desc'] = sanitize_textarea_field($body['descripcion']);
        }
        if (isset($body['publica'])) { $campos[] = 'publica = :publica'; $params['publica'] = ((bool) $body['publica']) ? 'true' : 'false'; }
        if (isset($body['portadaUrl'])) { $campos[] = 'portada_url = :portada'; $params['portada'] = esc_url_raw($body['portadaUrl']); }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios'], 400);
        }

        PostgresService::ejecutar(
            "UPDATE colecciones SET " . implode(', ', $campos) . ", updated_at = NOW() WHERE id = :id",
            $params
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $esAdmin = UsuarioHelper::esAdmin();

        /* Admin puede borrar cualquier colección; usuario normal solo las suyas */
        if ($esAdmin) {
            $rows = PostgresService::ejecutar(
                "DELETE FROM coleccion_samples WHERE coleccion_id = :id",
                ['id' => $id]
            );
            $rows = PostgresService::ejecutar(
                "DELETE FROM colecciones WHERE id = :id",
                ['id' => $id]
            );
        } else {
            $rows = PostgresService::ejecutar(
                "DELETE FROM colecciones WHERE id = :id AND usuario_id = :userId",
                ['id' => $id, 'userId' => $userId]
            );
        }

        return new \WP_REST_Response(['ok' => $rows > 0], $rows > 0 ? 200 : 404);
    }

    public static function agregarSample(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* C164: Rate limit — 30 adiciones a colección por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'agregar_sample_col', 30, 60);
        if ($limitResp) return $limitResp;

        $colId = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $sampleId = (int) ($body['sampleId'] ?? 0);

        if ($sampleId <= 0) {
            return new \WP_REST_Response(['code' => 'sample_id_requerido'], 400);
        }

        /* Verificar propiedad de la colección */
        $coleccion = PostgresService::consultarUno(
            "SELECT id FROM colecciones WHERE id = :id AND usuario_id = :userId",
            ['id' => $colId, 'userId' => $userId]
        );
        if (!$coleccion) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
        }

        /* Obtener siguiente posición */
        $maxPos = PostgresService::consultarUno(
            "SELECT COALESCE(MAX(posicion), 0) + 1 as next FROM coleccion_samples WHERE coleccion_id = :colId",
            ['colId' => $colId]
        );

        PostgresService::ejecutar(
            "INSERT INTO coleccion_samples (coleccion_id, sample_id, posicion)
             VALUES (:colId, :sampleId, :pos) ON CONFLICT DO NOTHING",
            ['colId' => $colId, 'sampleId' => $sampleId, 'pos' => $maxPos['next'] ?? 1]
        );

        /* Actualizar timestamp de la colección */
        PostgresService::ejecutar("UPDATE colecciones SET updated_at = NOW() WHERE id = :id", ['id' => $colId]);

        return new \WP_REST_Response(['ok' => true], 200);
    }

    public static function quitarSample(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $colId = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $sampleId = (int) ($body['sampleId'] ?? 0);

        $coleccion = PostgresService::consultarUno(
            "SELECT id FROM colecciones WHERE id = :id AND usuario_id = :userId",
            ['id' => $colId, 'userId' => $userId]
        );
        if (!$coleccion) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
        }

        PostgresService::ejecutar(
            "DELETE FROM coleccion_samples WHERE coleccion_id = :colId AND sample_id = :sampleId",
            ['colId' => $colId, 'sampleId' => $sampleId]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /**
     * GET /colecciones/{id}/sugerencias — "Más Ideas" para una colección.
     * Busca samples similares basándose en tags, género, BPM y key de los samples existentes.
     */
    public static function sugerencias(\WP_REST_Request $request): \WP_REST_Response
    {
        $colId = (int) $request->get_param('id');
        $page = max(1, (int) $request->get_param('page'));
        $perPage = max(1, (int) $request->get_param('per_page'));
        $offset = ($page - 1) * $perPage;

        /* Obtener tags, BPM y keys de los samples en la colección para calcular similitud */
        $contextoCols = PostgresService::consultar(
            "SELECT s.tags, s.bpm, s.key, s.tipo
             FROM samples s
             JOIN coleccion_samples cs ON cs.sample_id = s.id
             WHERE cs.coleccion_id = :colId AND s.estado = 'activo'",
            ['colId' => $colId]
        );

        if (empty($contextoCols)) {
            return new \WP_REST_Response(['data' => []], 200);
        }

        /* Construir condiciones de similitud basadas en el contexto */
        $allTags = [];
        $allBpms = [];
        $allKeys = [];
        foreach ($contextoCols as $row) {
            $tags = NormalizadorSample::pgArrayToPhp($row[SamplesCols::TAGS] ?? '');
            $allTags = array_merge($allTags, $tags);
            if (!empty($row[SamplesCols::BPM])) $allBpms[] = (int) $row[SamplesCols::BPM];
            if (!empty($row[SamplesCols::KEY])) $allKeys[] = $row[SamplesCols::KEY];
        }

        /* Tags más frecuentes de la colección */
        $tagCounts = array_count_values($allTags);
        arsort($tagCounts);
        $topTags = array_slice(array_keys($tagCounts), 0, 10);

        /* IDs de samples ya en la colección (excluirlos) — parametrizados para prevenir SQL injection */
        $idsExistentes = PostgresService::consultar(
            "SELECT sample_id FROM coleccion_samples WHERE coleccion_id = :colId",
            ['colId' => $colId]
        );
        $idsExcluir = array_map(fn($r) => (int) $r[ColeccionSamplesCols::SAMPLE_ID], $idsExistentes);

        $excludePlaceholders = '';
        if (!empty($idsExcluir)) {
            $excludeParts = [];
            foreach ($idsExcluir as $idx => $exId) {
                $key = "excl{$idx}";
                $excludeParts[] = ":{$key}";
                $params["excl{$idx}"] = $exId;
            }
            $excludePlaceholders = implode(',', $excludeParts);
        }
        $excludeClause = !empty($excludePlaceholders) ? "AND s.id NOT IN ({$excludePlaceholders})" : '';

        /* Scoring por similitud de tags + proximidad BPM + match de key */
        $avgBpm = !empty($allBpms) ? (int) (array_sum($allBpms) / count($allBpms)) : 120;
        $topKey = !empty($allKeys) ? array_count_values($allKeys) : [];
        arsort($topKey);
        $dominantKey = !empty($topKey) ? array_key_first($topKey) : null;

        /* Construir query con scoring */
        $tagConditions = [];
        foreach ($topTags as $i => $tag) {
            $tagConditions[] = "CASE WHEN :tag{$i} = ANY(s.tags) THEN 1 ELSE 0 END";
        }
        $tagScore = !empty($tagConditions) ? '(' . implode(' + ', $tagConditions) . ')' : '0';

        $params = ['limit' => $perPage, 'offset' => $offset, 'avgBpm' => $avgBpm];
        foreach ($topTags as $i => $tag) {
            $params["tag{$i}"] = $tag;
        }

        $keyScore = $dominantKey ? "CASE WHEN s.key = :domKey THEN 3 ELSE 0 END" : "0";
        if ($dominantKey) $params['domKey'] = $dominantKey;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.estado = 'activo' {$excludeClause}"
             . " ORDER BY ({$tagScore} + {$keyScore} + CASE WHEN s.bpm IS NOT NULL THEN GREATEST(0, 5 - ABS(s.bpm - :avgBpm) / 10) ELSE 0 END) DESC,"
             . " s.total_likes DESC, s.publicado_at DESC"
             . " LIMIT :limit OFFSET :offset";

        $samples = PostgresService::consultar($sql, $params);

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
            'contexto' => ['topTags' => $topTags, 'avgBpm' => $avgBpm, 'dominantKey' => $dominantKey],
        ], 200);
    }

    /**
     * GET /colecciones/relevantes/{sampleId} — Colecciones más relevantes del usuario para un sample.
     * Ordena por tags comunes y uso frecuente (tipo Pinterest).
     */
    public static function relevantesParaSample(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $sampleId = (int) $request->get_param('sampleId');

        /* Obtener tags del sample */
        $sample = PostgresService::consultarUno(
            "SELECT tags FROM samples WHERE id = :id", ['id' => $sampleId]
        );

        $sampleTags = $sample ? NormalizadorSample::pgArrayToPhp($sample[SamplesCols::TAGS] ?? '') : [];

        /* Obtener colecciones del usuario con scoring de relevancia */
        $colecciones = PostgresService::consultar(
            "SELECT c.*,
                    (SELECT COUNT(*) FROM coleccion_samples cs WHERE cs.coleccion_id = c.id) as total_items,
                    (SELECT COUNT(*) FROM coleccion_samples cs2
                     JOIN samples s2 ON cs2.sample_id = s2.id
                     WHERE cs2.coleccion_id = c.id AND s2.tags && :tags) as tags_match
             FROM colecciones c
             WHERE c.usuario_id = :userId
             ORDER BY tags_match DESC, c.updated_at DESC",
            ['userId' => $userId, 'tags' => '{' . implode(',', $sampleTags) . '}']
        );

        /* Verificar si el sample ya está en cada colección */
        foreach ($colecciones as &$col) {
            $existe = PostgresService::consultarUno(
                "SELECT 1 FROM coleccion_samples WHERE coleccion_id = :colId AND sample_id = :sampleId",
                ['colId' => $col['id'], 'sampleId' => $sampleId]
            );
            $col['contieneElSample'] = $existe !== null;
        }

        return new \WP_REST_Response(['data' => $colecciones], 200);
    }
}
