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
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
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
                    c.tipo_contenido, c.media_url, c.media_metadata,
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
            $c['tipoContenido'] = $c['tipo_contenido'] ?? 'texto';
            $c['mediaUrl'] = $c['media_url'] ?? null;
            $c['mediaMetadata'] = $c['media_metadata'] ? json_decode($c['media_metadata'], true) : null;
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

        if (!in_array($tipo, self::TIPOS_VALIDOS, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
        }

        /* C130: Soporta JSON (texto) o FormData (multimedia) */
        $contentType = $request->get_content_type();
        $esFormData = $contentType && str_contains($contentType['value'] ?? '', 'multipart');

        if ($esFormData) {
            $contenido = sanitize_textarea_field($request->get_param('contenido') ?? '');
            $tipoContenido = sanitize_text_field($request->get_param('tipoContenido') ?? 'texto');
        } else {
            $body = $request->get_json_params();
            $contenido = sanitize_textarea_field($body['contenido'] ?? '');
            $tipoContenido = 'texto';
        }

        /* Validar tipo de contenido */
        $tiposContenidoPermitidos = ['texto', 'imagen', 'audio'];
        if (!in_array($tipoContenido, $tiposContenidoPermitidos, true)) {
            $tipoContenido = 'texto';
        }

        /* C164: Rate limiting — 10 comentarios por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'comentar', 10, 60);
        if ($limitResp) return $limitResp;

        /* Validar contenido: requerido para texto, opcional para multimedia */
        if ($tipoContenido === 'texto') {
            if (empty($contenido)) {
                return new \WP_REST_Response(['code' => 'contenido_vacio', 'message' => 'El comentario necesita contenido'], 400);
            }
        }

        /* C164: Limite de longitud (aplica si hay texto) */
        if (!empty($contenido)) {
            $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_COMENTARIO, 'El comentario');
            if ($errorLongitud) {
                return Validador::respuestaError($errorLongitud);
            }
        }

        $mediaUrl = null;
        $mediaMetadata = null;

        /* C130: Procesamiento de archivos multimedia */
        if ($tipoContenido === 'imagen' || $tipoContenido === 'audio') {
            $archivos = $request->get_file_params();
            $archivo = $archivos['media'] ?? null;

            if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
                return new \WP_REST_Response(['code' => 'archivo_invalido', 'message' => 'No se recibió archivo válido'], 400);
            }

            /* Validar MIME segun tipo */
            $mimesPermitidos = $tipoContenido === 'imagen'
                ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                : ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];

            $mimeReal = \mime_content_type($archivo['tmp_name']);
            if (!in_array($mimeReal, $mimesPermitidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_no_permitido', 'message' => "Tipo de archivo no permitido: {$mimeReal}"], 400);
            }

            /* Limite de tamano: 10MB imagenes, 25MB audio */
            $maxBytes = $tipoContenido === 'imagen' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
            if ($archivo['size'] > $maxBytes) {
                $maxMB = $maxBytes / 1024 / 1024;
                return new \WP_REST_Response(['code' => 'archivo_grande', 'message' => "El archivo excede el limite de {$maxMB}MB"], 400);
            }

            /* Subir a WP uploads en subcarpeta comentarios */
            $subDir = "kamples/comentarios/{$userId}/" . date('Y/m');
            $filtroDir = function ($paths) use ($subDir) {
                $paths['subdir'] = '/' . $subDir;
                $paths['path'] = $paths['basedir'] . '/' . $subDir;
                $paths['url'] = $paths['baseurl'] . '/' . $subDir;
                return $paths;
            };

            \add_filter('upload_dir', $filtroDir);
            $subido = \wp_handle_upload($archivo, ['test_form' => false]);
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

            /* Si no hay texto, la imagen/audio es el comentario completo */
            if (empty($contenido)) {
                $contenido = null;
            }
        }

        $id = PostgresService::insertar(
            "INSERT INTO comentarios (autor_id, tipo, target_id, contenido, tipo_contenido, media_url, media_metadata)
             VALUES (:autor, :tipo, :target, :contenido, :tipoContenido, :mediaUrl, :mediaMetadata::jsonb)
             RETURNING id",
            [
                'autor' => $userId,
                'tipo' => $tipo,
                'target' => $targetId,
                'contenido' => $contenido,
                'tipoContenido' => $tipoContenido,
                'mediaUrl' => $mediaUrl,
                'mediaMetadata' => $mediaMetadata,
            ]
        );

        /* Actualizar contador en la tabla correspondiente */
        $tabla = $tipo === 'publicacion' ? 'publicaciones' : 'samples';
        PostgresService::ejecutar(
            "UPDATE {$tabla} SET total_comentarios = (
                SELECT COUNT(*) FROM comentarios WHERE tipo = :tipo AND target_id = :targetId
            ) WHERE id = :targetId",
            ['tipo' => $tipo, 'targetId' => $targetId]
        );

        /* Registrar interaccion para el algoritmo */
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
                'contenido' => $contenido ?? '',
                'tipoContenido' => $tipoContenido,
                'mediaUrl' => $mediaUrl,
                'mediaMetadata' => $mediaMetadata ? json_decode($mediaMetadata, true) : null,
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
