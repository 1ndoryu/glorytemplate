<?php

/**
 * ComentariosController — Endpoints genéricos de comentarios.
 *
 * Maneja comentarios para cualquier tipo de entidad (sample, publicacion).
 *
 * GET  /comentarios/{tipo}/{targetId}  — Listar comentarios
 * POST /comentarios/{tipo}/{targetId}  — Crear comentario
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\PlanificadorAlgoritmo;

class ComentariosController
{
    private const TIPOS_VALIDOS = ['sample', 'publicacion'];

    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/comentarios/(?P<tipo>sample|publicacion)/(?P<targetId>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'listar'],
            'permission_callback' => '__return_true',
            'args' => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
            ],
        ]);

        register_rest_route($namespace, '/comentarios/(?P<tipo>sample|publicacion)/(?P<targetId>\d+)', [
            'methods' => 'POST',
            'callback' => [self::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        $tipo = $request->get_param('tipo');
        $targetId = (int) $request->get_param('targetId');
        $page = (int) $request->get_param('page');
        $offset = ($page - 1) * 20;

        if (!in_array($tipo, self::TIPOS_VALIDOS, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
        }

        $comentarios = PostgresService::consultar(
            "SELECT c.id, c.contenido, c.created_at,
                    u.id as autor_id, u.username, u.nombre_visible, u.avatar_url
             FROM comentarios c
             JOIN usuarios_ext u ON c.autor_id = u.id
             WHERE c.tipo = :tipo AND c.target_id = :targetId
             ORDER BY c.created_at ASC LIMIT 20 OFFSET :offset",
            ['tipo' => $tipo, 'targetId' => $targetId, 'offset' => $offset]
        );

        /* Enriquecer con formato camelCase para el frontend */
        foreach ($comentarios as &$c) {
            $c['autorId'] = (int) $c['autor_id'];
            $c['creadoAt'] = $c['created_at'];
            $c['autor'] = [
                'id' => (int) $c['autor_id'],
                'username' => $c['username'],
                'nombreVisible' => $c['nombre_visible'],
                'avatarUrl' => $c['avatar_url'],
            ];
        }

        return new \WP_REST_Response(['data' => $comentarios, 'page' => $page], 200);
    }

    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $tipo = $request->get_param('tipo');
        $targetId = (int) $request->get_param('targetId');
        $body = $request->get_json_params();
        $contenido = sanitize_textarea_field($body['contenido'] ?? '');

        if (!in_array($tipo, self::TIPOS_VALIDOS, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
        }

        if (empty($contenido)) {
            return new \WP_REST_Response(['code' => 'contenido_vacio', 'message' => 'El comentario necesita contenido'], 400);
        }

        $id = PostgresService::insertar(
            "INSERT INTO comentarios (autor_id, tipo, target_id, contenido)
             VALUES (:autor, :tipo, :target, :contenido) RETURNING id",
            ['autor' => $userId, 'tipo' => $tipo, 'target' => $targetId, 'contenido' => $contenido]
        );

        /* Actualizar contador en la tabla correspondiente */
        $tabla = $tipo === 'publicacion' ? 'publicaciones' : 'samples';
        PostgresService::ejecutar(
            "UPDATE {$tabla} SET total_comentarios = (
                SELECT COUNT(*) FROM comentarios WHERE tipo = :tipo AND target_id = :targetId
            ) WHERE id = :targetId",
            ['tipo' => $tipo, 'targetId' => $targetId]
        );

        /* Registrar interacción para el algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, 'comentario');

        /* Obtener datos del autor para devolver el comentario completo */
        $usuario = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, avatar_url FROM usuarios_ext WHERE id = :id",
            ['id' => $userId]
        );

        return new \WP_REST_Response([
            'ok' => true,
            'data' => [
                'id' => $id,
                'autorId' => $userId,
                'contenido' => $contenido,
                'creadoAt' => date('c'),
                'autor' => [
                    'id' => $userId,
                    'username' => $usuario['username'] ?? '',
                    'nombreVisible' => $usuario['nombre_visible'] ?? '',
                    'avatarUrl' => $usuario['avatar_url'] ?? null,
                ],
            ],
        ], 201);
    }
}
