<?php

/**
 * MensajesController â€” Sistema de mensajerÃ­a directa.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ConversacionesCols;
use App\Config\Schema\_generated\MensajesCols;
use App\Config\Schema\_generated\MensajesEnums;
use App\Kamples\Database\Repositories\ConversacionesRepository;
use App\Kamples\Database\Repositories\MensajesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\KamplesLogger;

class MensajesController
{
    /* Normaliza datos de participante a camelCase para el frontend */
    private static function normalizarParticipante(?array $usuario): ?array
    {
        if (!$usuario) return null;
        return [
            'id'             => (int) $usuario[UsuariosExtCols::ID],
            'username'       => $usuario[UsuariosExtCols::USERNAME] ?? '',
            'nombreVisible'  => $usuario[UsuariosExtCols::NOMBRE_VISIBLE] ?? $usuario[UsuariosExtCols::USERNAME] ?? '',
            'avatarUrl'      => $usuario[UsuariosExtCols::AVATAR_URL] ?? null,
            'verificado'     => (bool) ($usuario[UsuariosExtCols::VERIFICADO] ?? false),
        ];
    }
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
            'callback'            => [MensajesEnvioController::class, 'enviarMensaje'],
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
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $conversaciones = ConversacionesRepository::listarDeUsuario($userId);

        $resultado = [];
        foreach ($conversaciones as $conv) {
            $otroId = (int) $conv['otro_id'];

            $otro = UsuariosExtRepository::buscarParticipante($otroId);

            $ultimoMsg = MensajesRepository::ultimoDeConversacion((int) $conv[ConversacionesCols::ID]);

            $noLeidos = MensajesRepository::contarNoLeidos((int) $conv[ConversacionesCols::ID], $userId);

            /* C193: fallback avatar */
            if ($otro) {
                $otro[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl($otro[UsuariosExtCols::AVATAR_URL] ?? null, (int) ($otro[UsuariosExtCols::WP_USER_ID] ?? 0));
            }

            /* Preview del Ãºltimo mensaje segÃºn tipo */
            $previewMsg = $ultimoMsg[MensajesCols::CONTENIDO] ?? '';
            $tipoUltimo = $ultimoMsg[MensajesCols::TIPO] ?? MensajesEnums::TIPO_TEXTO;
            if ($tipoUltimo === MensajesEnums::TIPO_IMAGEN) $previewMsg = '[Imagen]';
            elseif ($tipoUltimo === MensajesEnums::TIPO_AUDIO) $previewMsg = '[Audio]';
            elseif ($tipoUltimo === MensajesEnums::TIPO_SAMPLE) $previewMsg = '[Sample] ' . ($ultimoMsg[MensajesCols::CONTENIDO] ?? '');

            $resultado[] = [
                'id'              => (int) $conv[ConversacionesCols::ID],
                'participante'    => self::normalizarParticipante($otro),
                'ultimoMensaje'   => $previewMsg,
                'ultimoMensajeTipo' => $tipoUltimo,
                'ultimoMensajeAt' => $ultimoMsg[MensajesCols::CREATED_AT] ?? $conv[ConversacionesCols::CREATED_AT],
                'noLeidos'        => $noLeidos,
                'enLinea'         => false,
            ];
        }

        return new \WP_REST_Response(['data' => $resultado], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en MensajesController::listarConversaciones', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    public static function obtenerMensajes(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $conversacionId = (int) $request->get_param('conversacionId');
        $page = max(1, (int) $request->get_param('page'));
        $perPage = 50;
        $offset = ($page - 1) * $perPage;

        $conv = ConversacionesRepository::verificarParticipacion($conversacionId, $userId);

        if (!$conv) {
            return new \WP_REST_Response(['code' => 'conversacion_no_encontrada'], 404);
        }

        $mensajes = MensajesRepository::listarDeConversacion($conversacionId, $perPage, $offset);

        /* Parsear mediaMetadata JSONB en cada mensaje */
        foreach ($mensajes as &$msg) {
            if (isset($msg['mediaMetadata']) && is_string($msg['mediaMetadata'])) {
                $msg['mediaMetadata'] = json_decode($msg['mediaMetadata'], true);
            }
        }
        unset($msg);

        return new \WP_REST_Response(['data' => $mensajes], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en MensajesController::obtenerMensajes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    public static function marcarLeida(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $conversacionId = (int) $request->get_param('conversacionId');

        MensajesRepository::marcarLeidos($conversacionId, $userId);

        return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en MensajesController::marcarLeida', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    public static function iniciarConversacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* C164: Rate limiting â€” 10 conversaciones nuevas por hora */
        $limitResp = RateLimiter::verificarUsuario($userId, 'nueva_conversacion', 10, 3600);
        if ($limitResp) return $limitResp;

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

        $existente = ConversacionesRepository::buscarEntreUsuarios($p1, $p2);

        if ($existente) {
            return new \WP_REST_Response(['data' => ['id' => (int) $existente[ConversacionesCols::ID]]], 200);
        }

        $convId = ConversacionesRepository::crear($p1, $p2);

        $otro = UsuariosExtRepository::buscarParticipante($otroId);

        /* C193: fallback avatar */
        if ($otro) {
            $otro[UsuariosExtCols::AVATAR_URL] = UsuarioHelper::resolverAvatarUrl($otro[UsuariosExtCols::AVATAR_URL] ?? null, (int) ($otro[UsuariosExtCols::WP_USER_ID] ?? 0));
        }

        return new \WP_REST_Response([
            'data' => [
                'id' => (int) $convId, 'participante' => self::normalizarParticipante($otro),
                'ultimoMensaje' => '', 'ultimoMensajeAt' => (new \DateTime())->format('c'),
                'noLeidos' => 0, 'enLinea' => false,
            ]
        ], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en MensajesController::iniciarConversacion', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }
}
