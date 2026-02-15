<?php

/**
 * MensajesController — Sistema de mensajería directa.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;

class MensajesController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/mensajes/conversaciones', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarConversaciones'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/mensajes/(?P<conversacionId>\d+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerMensajes'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'conversacionId' => ['required' => true, 'type' => 'integer'],
                'page'           => ['required' => false, 'type' => 'integer', 'default' => 1],
            ],
        ]);

        register_rest_route($namespace, '/mensajes/(?P<conversacionId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'enviarMensaje'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/mensajes/(?P<conversacionId>\d+)/leer', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'marcarLeida'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/mensajes/nueva', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'iniciarConversacion'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    public static function listarConversaciones(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $conversaciones = PostgresService::consultar(
            "SELECT c.id,
                    CASE WHEN c.participante_1 = :userId THEN c.participante_2 ELSE c.participante_1 END as otro_id,
                    c.ultimo_mensaje_at, c.created_at
             FROM conversaciones c
             WHERE c.participante_1 = :userId OR c.participante_2 = :userId
             ORDER BY c.ultimo_mensaje_at DESC NULLS LAST",
            ['userId' => $userId]
        );

        $resultado = [];
        foreach ($conversaciones as $conv) {
            $otroId = (int) $conv['otro_id'];

            $otro = PostgresService::consultarUno(
                "SELECT id, username, nombre_visible, avatar_url, verificado FROM usuarios_ext WHERE id = :id",
                ['id' => $otroId]
            );

            $ultimoMsg = PostgresService::consultarUno(
                "SELECT contenido, created_at FROM mensajes WHERE conversacion_id = :convId ORDER BY created_at DESC LIMIT 1",
                ['convId' => $conv['id']]
            );

            $noLeidos = PostgresService::consultarUno(
                "SELECT COUNT(*) as total FROM mensajes WHERE conversacion_id = :convId AND autor_id != :userId AND leido = false",
                ['convId' => $conv['id'], 'userId' => $userId]
            );

            $resultado[] = [
                'id'              => (int) $conv['id'],
                'participante'    => $otro,
                'ultimoMensaje'   => $ultimoMsg['contenido'] ?? '',
                'ultimoMensajeAt' => $ultimoMsg['created_at'] ?? $conv['created_at'],
                'noLeidos'        => $noLeidos ? (int) $noLeidos['total'] : 0,
                'enLinea'         => false,
            ];
        }

        return new \WP_REST_Response(['data' => $resultado], 200);
    }

    public static function obtenerMensajes(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $conversacionId = (int) $request->get_param('conversacionId');
        $page = (int) $request->get_param('page');
        $perPage = 50;
        $offset = ($page - 1) * $perPage;

        $conv = PostgresService::consultarUno(
            "SELECT id FROM conversaciones WHERE id = :convId AND (participante_1 = :userId OR participante_2 = :userId)",
            ['convId' => $conversacionId, 'userId' => $userId]
        );

        if (!$conv) {
            return new \WP_REST_Response(['code' => 'conversacion_no_encontrada'], 404);
        }

        $mensajes = PostgresService::consultar(
            "SELECT id, conversacion_id as \"conversacionId\", autor_id as \"remitenteId\",
                    contenido, leido, created_at as \"creadoAt\"
             FROM mensajes WHERE conversacion_id = :convId
             ORDER BY created_at ASC LIMIT :limit OFFSET :offset",
            ['convId' => $conversacionId, 'limit' => $perPage, 'offset' => $offset]
        );

        return new \WP_REST_Response(['data' => $mensajes], 200);
    }

    public static function enviarMensaje(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $conversacionId = (int) $request->get_param('conversacionId');
        $body = $request->get_json_params();
        $contenido = sanitize_textarea_field($body['contenido'] ?? '');

        if (empty($contenido)) {
            return new \WP_REST_Response(['code' => 'mensaje_vacio', 'message' => 'El mensaje no puede estar vacío'], 400);
        }

        $conv = PostgresService::consultarUno(
            "SELECT id FROM conversaciones WHERE id = :convId AND (participante_1 = :userId OR participante_2 = :userId)",
            ['convId' => $conversacionId, 'userId' => $userId]
        );

        if (!$conv) {
            return new \WP_REST_Response(['code' => 'conversacion_no_encontrada'], 404);
        }

        $msgId = PostgresService::insertar(
            "INSERT INTO mensajes (conversacion_id, autor_id, contenido) VALUES (:convId, :autorId, :contenido) RETURNING id",
            ['convId' => $conversacionId, 'autorId' => $userId, 'contenido' => $contenido]
        );

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

    public static function marcarLeida(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $conversacionId = (int) $request->get_param('conversacionId');

        PostgresService::ejecutar(
            "UPDATE mensajes SET leido = true WHERE conversacion_id = :convId AND autor_id != :userId AND leido = false",
            ['convId' => $conversacionId, 'userId' => $userId]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    public static function iniciarConversacion(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $body  = $request->get_json_params();
        $otroId = (int) ($body['usuarioId'] ?? 0);

        if ($otroId <= 0) {
            return new \WP_REST_Response(['code' => 'usuario_invalido'], 400);
        }
        if ($userId === $otroId) {
            return new \WP_REST_Response(['code' => 'no_self_chat', 'message' => 'No puedes chatear contigo mismo'], 400);
        }

        $p1 = min($userId, $otroId);
        $p2 = max($userId, $otroId);

        $existente = PostgresService::consultarUno(
            "SELECT id FROM conversaciones WHERE participante_1 = :p1 AND participante_2 = :p2",
            ['p1' => $p1, 'p2' => $p2]
        );

        if ($existente) {
            return new \WP_REST_Response(['data' => ['id' => (int) $existente['id']]], 200);
        }

        $convId = PostgresService::insertar(
            "INSERT INTO conversaciones (participante_1, participante_2) VALUES (:p1, :p2) RETURNING id",
            ['p1' => $p1, 'p2' => $p2]
        );

        $otro = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, avatar_url, verificado FROM usuarios_ext WHERE id = :id",
            ['id' => $otroId]
        );

        return new \WP_REST_Response([
            'data' => [
                'id' => (int) $convId, 'participante' => $otro,
                'ultimoMensaje' => '', 'ultimoMensajeAt' => (new \DateTime())->format('c'),
                'noLeidos' => 0, 'enLinea' => false,
            ]
        ], 201);
    }
}
