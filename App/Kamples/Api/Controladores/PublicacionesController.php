<?php

/**
 * PublicacionesController — Feed social de la comunidad.
 *
 * POST  /publicaciones          — Crear publicación
 * GET   /publicaciones          — Feed de publicaciones
 * GET   /publicaciones/{id}     — Detalle
 * POST  /publicaciones/{id}/comentarios — Comentar
 * GET   /publicaciones/{id}/comentarios — Listar comentarios
 * POST  /publicaciones/{id}/repost      — Repostear
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;

class PublicacionesController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/publicaciones', [
            'methods' => 'GET', 'callback' => [self::class, 'listar'],
            'permission_callback' => '__return_true',
            'args' => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'filtro' => ['required' => false, 'type' => 'string', 'default' => 'todos', 'enum' => ['todos', 'siguiendo', 'populares']],
            ],
        ]);

        register_rest_route($namespace, '/publicaciones', [
            'methods' => 'POST', 'callback' => [self::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)', [
            'methods' => 'GET', 'callback' => [self::class, 'obtener'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)/comentarios', [
            'methods' => 'GET', 'callback' => [self::class, 'listarComentarios'],
            'permission_callback' => '__return_true',
            'args' => ['page' => ['required' => false, 'type' => 'integer', 'default' => 1]],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)/comentarios', [
            'methods' => 'POST', 'callback' => [self::class, 'crearComentario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)/repost', [
            'methods' => 'POST', 'callback' => [self::class, 'repostear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        $page = (int) $request->get_param('page');
        $filtro = $request->get_param('filtro');
        $offset = ($page - 1) * 20;

        $donde = '';
        $params = ['limit' => 20, 'offset' => $offset];

        if ($filtro === 'siguiendo') {
            $userId = UsuarioHelper::obtenerIdPg();
            if ($userId) {
                $donde = "AND p.autor_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId)";
                $params['userId'] = $userId;
            }
        }

        $orderBy = $filtro === 'populares'
            ? 'ORDER BY p.total_likes DESC, p.created_at DESC'
            : 'ORDER BY p.created_at DESC';

        $publicaciones = PostgresService::consultar(
            "SELECT p.*, u.username, u.nombre_visible, u.avatar_url, u.verificado
             FROM publicaciones p
             JOIN usuarios_ext u ON p.autor_id = u.id
             WHERE 1=1 {$donde}
             {$orderBy} LIMIT :limit OFFSET :offset",
            $params
        );

        /* Enriquecer con contadores */
        foreach ($publicaciones as &$pub) {
            $pub['totalComentarios'] = (int) ($pub['total_comentarios'] ?? 0);
            $pub['totalLikes'] = (int) ($pub['total_likes'] ?? 0);
            $pub['autor'] = [
                'id' => (int) $pub['autor_id'],
                'username' => $pub['username'],
                'nombreVisible' => $pub['nombre_visible'],
                'avatarUrl' => $pub['avatar_url'],
                'verificado' => (bool) $pub['verificado'],
            ];
        }

        return new \WP_REST_Response(['data' => $publicaciones, 'page' => $page], 200);
    }

    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $body = $request->get_json_params();
        $contenido = sanitize_textarea_field($body['contenido'] ?? '');

        if (empty($contenido)) {
            return new \WP_REST_Response(['code' => 'contenido_vacio', 'message' => 'La publicación necesita contenido'], 400);
        }

        $imagenes = isset($body['imagenes']) ? json_encode($body['imagenes']) : null;
        $samplesAdjuntos = isset($body['samples_adjuntos']) ? json_encode($body['samples_adjuntos']) : null;

        $id = PostgresService::insertar(
            "INSERT INTO publicaciones (autor_id, contenido, imagenes, samples_adjuntos)
             VALUES (:autor, :contenido, :imagenes, :samples) RETURNING id",
            ['autor' => $userId, 'contenido' => $contenido, 'imagenes' => $imagenes, 'samples' => $samplesAdjuntos]
        );

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
    }

    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $pub = PostgresService::consultarUno(
            "SELECT p.*, u.username, u.nombre_visible, u.avatar_url, u.verificado
             FROM publicaciones p JOIN usuarios_ext u ON p.autor_id = u.id WHERE p.id = :id",
            ['id' => $id]
        );

        if (!$pub) {
            return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
        }

        $pub['autor'] = [
            'id' => (int) $pub['autor_id'],
            'username' => $pub['username'],
            'nombreVisible' => $pub['nombre_visible'],
            'avatarUrl' => $pub['avatar_url'],
            'verificado' => (bool) $pub['verificado'],
        ];

        return new \WP_REST_Response(['data' => $pub], 200);
    }

    public static function listarComentarios(\WP_REST_Request $request): \WP_REST_Response
    {
        $pubId = (int) $request->get_param('id');
        $page = (int) $request->get_param('page');
        $offset = ($page - 1) * 20;

        $comentarios = PostgresService::consultar(
            "SELECT c.id, c.contenido, c.created_at, c.total_likes,
                    u.id as autor_id, u.username, u.nombre_visible, u.avatar_url
             FROM comentarios c
             JOIN usuarios_ext u ON c.autor_id = u.id
             WHERE c.tipo = 'publicacion' AND c.target_id = :pubId
             ORDER BY c.created_at ASC LIMIT 20 OFFSET :offset",
            ['pubId' => $pubId, 'offset' => $offset]
        );

        return new \WP_REST_Response(['data' => $comentarios], 200);
    }

    public static function crearComentario(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $pubId = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $contenido = sanitize_textarea_field($body['contenido'] ?? '');

        if (empty($contenido)) {
            return new \WP_REST_Response(['code' => 'contenido_vacio'], 400);
        }

        $id = PostgresService::insertar(
            "INSERT INTO comentarios (autor_id, tipo, target_id, contenido) VALUES (:autor, 'publicacion', :target, :contenido) RETURNING id",
            ['autor' => $userId, 'target' => $pubId, 'contenido' => $contenido]
        );

        /* Actualizar contador */
        PostgresService::ejecutar(
            "UPDATE publicaciones SET total_comentarios = (SELECT COUNT(*) FROM comentarios WHERE tipo = 'publicacion' AND target_id = :id) WHERE id = :id",
            ['id' => $pubId]
        );

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
    }

    public static function repostear(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $pubId = (int) $request->get_param('id');

        /* Crear publicación de tipo repost */
        $id = PostgresService::insertar(
            "INSERT INTO publicaciones (autor_id, contenido, repost_id) VALUES (:autor, '', :repostId) RETURNING id",
            ['autor' => $userId, 'repostId' => $pubId]
        );

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
    }
}
