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
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\SamplesCols;

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
                "SELECT id, username, nombre_visible, avatar_url, verificado, wp_user_id FROM usuarios_ext WHERE id = :id",
                ['id' => $otroId]
            );

            $ultimoMsg = PostgresService::consultarUno(
                "SELECT contenido, tipo, created_at FROM mensajes WHERE conversacion_id = :convId ORDER BY created_at DESC LIMIT 1",
                ['convId' => $conv['id']]
            );

            $noLeidos = PostgresService::consultarUno(
                "SELECT COUNT(*) as total FROM mensajes WHERE conversacion_id = :convId AND autor_id != :userId AND leido = false",
                ['convId' => $conv['id'], 'userId' => $userId]
            );

            /* C193: fallback avatar */
            if ($otro) {
                $otro['avatar_url'] = UsuarioHelper::resolverAvatarUrl($otro['avatar_url'] ?? null, (int) ($otro['wp_user_id'] ?? 0));
            }

            /* Preview del último mensaje según tipo */
            $previewMsg = $ultimoMsg['contenido'] ?? '';
            $tipoUltimo = $ultimoMsg['tipo'] ?? 'texto';
            if ($tipoUltimo === 'imagen') $previewMsg = '[Imagen]';
            elseif ($tipoUltimo === 'audio') $previewMsg = '[Audio]';
            elseif ($tipoUltimo === 'sample') $previewMsg = '[Sample] ' . ($ultimoMsg['contenido'] ?? '');

            $resultado[] = [
                'id'              => (int) $conv['id'],
                'participante'    => self::normalizarParticipante($otro),
                'ultimoMensaje'   => $previewMsg,
                'ultimoMensajeTipo' => $tipoUltimo,
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
        $page = max(1, (int) $request->get_param('page'));
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
                    contenido, tipo, media_url as \"mediaUrl\", media_metadata as \"mediaMetadata\",
                    leido, created_at as \"creadoAt\"
             FROM mensajes WHERE conversacion_id = :convId
             ORDER BY created_at ASC LIMIT :limit OFFSET :offset",
            ['convId' => $conversacionId, 'limit' => $perPage, 'offset' => $offset]
        );

        /* Parsear mediaMetadata JSONB en cada mensaje */
        foreach ($mensajes as &$msg) {
            if (isset($msg['mediaMetadata']) && is_string($msg['mediaMetadata'])) {
                $msg['mediaMetadata'] = json_decode($msg['mediaMetadata'], true);
            }
        }
        unset($msg);

        return new \WP_REST_Response(['data' => $mensajes], 200);
    }

    public static function enviarMensaje(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $conversacionId = (int) $request->get_param('conversacionId');

        /* Soporta JSON body para texto o FormData para multimedia */
        $contentType = $request->get_content_type();
        $esFormData = $contentType && str_contains($contentType['value'] ?? '', 'multipart');

        if ($esFormData) {
            $contenido = \sanitize_textarea_field($request->get_param('contenido') ?? '');
            $tipo = \sanitize_text_field($request->get_param('tipo') ?? 'texto');
        } else {
            $body = $request->get_json_params();
            $contenido = \sanitize_textarea_field($body['contenido'] ?? '');
            $tipo = \sanitize_text_field($body['tipo'] ?? 'texto');
        }

        /* Validar tipos permitidos */
        $tiposPermitidos = ['texto', 'imagen', 'audio', 'sample'];
        if (!in_array($tipo, $tiposPermitidos, true)) {
            $tipo = 'texto';
        }

        /* C164: Rate limiting — 30 mensajes por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'mensaje', 30, 60);
        if ($limitResp) return $limitResp;

        /* Verificar si el usuario está baneado */
        $banResp = AuthMiddleware::verificarBanActivo($userId);
        if ($banResp) return $banResp;

        /* C164: Limite de longitud para mensajes de texto */
        if ($tipo === 'texto' && !empty($contenido)) {
            $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_MENSAJE, 'El mensaje');
            if ($errorLongitud) return Validador::respuestaError($errorLongitud);
        }

        $mediaUrl = null;
        $mediaMetadata = null;

        /* Procesamiento según tipo de mensaje */
        if ($tipo === 'imagen' || $tipo === 'audio') {
            $archivos = $request->get_file_params();
            $archivo = $archivos['media'] ?? null;

            if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
                return new \WP_REST_Response(['code' => 'archivo_invalido', 'message' => 'No se recibió archivo válido'], 400);
            }

            /* Validar MIME según tipo — incluir variantes x- que mime_content_type() devuelve */
            $mimesPermitidos = $tipo === 'imagen'
                ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                : [
                    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
                    'audio/ogg', 'application/ogg', 'audio/mp4', 'audio/x-m4a',
                    'audio/aac', 'audio/webm', 'audio/flac',
                ];

            $mimeReal = \mime_content_type($archivo['tmp_name']);
            if (!in_array($mimeReal, $mimesPermitidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_no_permitido', 'message' => "Tipo de archivo no permitido: {$mimeReal}"], 400);
            }

            /* Límite de tamaño: 10MB imágenes, 25MB audio */
            $maxBytes = $tipo === 'imagen' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
            if ($archivo['size'] > $maxBytes) {
                $maxMB = $maxBytes / 1024 / 1024;
                return new \WP_REST_Response(['code' => 'archivo_grande', 'message' => "El archivo excede el límite de {$maxMB}MB"], 400);
            }

            /* Subir a WP uploads en subcarpeta mensajes */
            $subDir = "kamples/mensajes/{$userId}/" . date('Y/m');
            $filtroDir = function ($paths) use ($subDir) {
                $paths['subdir'] = '/' . $subDir;
                $paths['path'] = $paths['basedir'] . '/' . $subDir;
                $paths['url'] = $paths['baseurl'] . '/' . $subDir;
                return $paths;
            };

            /* wp_handle_upload no está disponible en contexto REST (solo en admin) */
            if (!function_exists('wp_handle_upload')) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
            }

            \add_filter('upload_dir', $filtroDir);
            $mimesUpload = $tipo === 'audio'
                ? [
                    'mp3' => 'audio/mpeg', 'wav' => 'audio/wav', 'ogg' => 'audio/ogg',
                    'm4a' => 'audio/mp4', 'aac' => 'audio/aac', 'webm' => 'audio/webm',
                    'flac' => 'audio/flac',
                ]
                : [
                    'jpg|jpeg' => 'image/jpeg', 'png' => 'image/png',
                    'gif' => 'image/gif', 'webp' => 'image/webp',
                ];
            $subido = \wp_handle_upload($archivo, ['test_form' => false, 'mimes' => $mimesUpload]);
            \remove_filter('upload_dir', $filtroDir);

            if (isset($subido['error'])) {
                return new \WP_REST_Response(['code' => 'error_subida', 'message' => $subido['error']], 500);
            }

            $mediaUrl = $subido['url'];
            $mediaMetadata = json_encode([
                'formato' => pathinfo($archivo['name'], PATHINFO_EXTENSION),
                'tamano'  => $archivo['size'],
                'mimeType' => $mimeReal,
            ]);

        } elseif ($tipo === 'sample') {
            /* Compartir un sample existente por ID */
            $body = $esFormData ? [] : $request->get_json_params();
            $sampleId = (int) ($body['sampleId'] ?? $request->get_param('sampleId') ?? 0);

            if ($sampleId <= 0) {
                return new \WP_REST_Response(['code' => 'sample_invalido', 'message' => 'ID de sample inválido'], 400);
            }

            $sample = PostgresService::consultarUno(
                "SELECT id, titulo, id_corto, slug, tipo, bpm, key FROM samples WHERE id = :id AND estado = 'activo'",
                ['id' => $sampleId]
            );

            if (!$sample) {
                return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
            }

            $mediaMetadata = json_encode([
                'sampleId' => (int) $sample[SamplesCols::ID],
                'titulo'   => $sample[SamplesCols::TITULO],
                'idCorto'  => $sample[SamplesCols::ID_CORTO],
                'slug'     => $sample[SamplesCols::SLUG],
                'tipo'     => $sample[SamplesCols::TIPO],
                'bpm'      => $sample[SamplesCols::BPM],
                'key'      => $sample[SamplesCols::KEY],
            ]);
            $contenido = $contenido ?: $sample[SamplesCols::TITULO];

        } else {
            /* Tipo texto: validar que no esté vacío */
            if (empty($contenido)) {
                return new \WP_REST_Response(['code' => 'mensaje_vacio', 'message' => 'El mensaje no puede estar vacío'], 400);
            }
        }

        /* Verificar participación en la conversación */
        $conv = PostgresService::consultarUno(
            "SELECT id FROM conversaciones WHERE id = :convId AND (participante_1 = :userId OR participante_2 = :userId)",
            ['convId' => $conversacionId, 'userId' => $userId]
        );

        if (!$conv) {
            return new \WP_REST_Response(['code' => 'conversacion_no_encontrada'], 404);
        }

        /* Insertar mensaje con soporte multimedia */
        $msgId = PostgresService::insertar(
            "INSERT INTO mensajes (conversacion_id, autor_id, contenido, tipo, media_url, media_metadata)
             VALUES (:convId, :autorId, :contenido, :tipo, :mediaUrl, :mediaMetadata)
             RETURNING id",
            [
                'convId' => $conversacionId, 'autorId' => $userId,
                'contenido' => $contenido, 'tipo' => $tipo,
                'mediaUrl' => $mediaUrl, 'mediaMetadata' => $mediaMetadata,
            ]
        );

        PostgresService::ejecutar(
            "UPDATE conversaciones SET ultimo_mensaje_at = NOW() WHERE id = :convId",
            ['convId' => $conversacionId]
        );

        $mensaje = PostgresService::consultarUno(
            "SELECT id, conversacion_id as \"conversacionId\", autor_id as \"remitenteId\",
                    contenido, tipo, media_url as \"mediaUrl\", media_metadata as \"mediaMetadata\",
                    leido, created_at as \"creadoAt\"
             FROM mensajes WHERE id = :id",
            ['id' => $msgId]
        );

        /* Parsear mediaMetadata de string JSONB a objeto */
        if (isset($mensaje['mediaMetadata']) && is_string($mensaje['mediaMetadata'])) {
            $mensaje['mediaMetadata'] = json_decode($mensaje['mediaMetadata'], true);
        }

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

        /* C164: Rate limiting — 10 conversaciones nuevas por hora */
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
            "SELECT id, username, nombre_visible, avatar_url, verificado, wp_user_id FROM usuarios_ext WHERE id = :id",
            ['id' => $otroId]
        );

        /* C193: fallback avatar */
        if ($otro) {
            $otro['avatar_url'] = UsuarioHelper::resolverAvatarUrl($otro['avatar_url'] ?? null, (int) ($otro['wp_user_id'] ?? 0));
        }

        return new \WP_REST_Response([
            'data' => [
                'id' => (int) $convId, 'participante' => self::normalizarParticipante($otro),
                'ultimoMensaje' => '', 'ultimoMensajeAt' => (new \DateTime())->format('c'),
                'noLeidos' => 0, 'enLinea' => false,
            ]
        ], 201);
    }
}
