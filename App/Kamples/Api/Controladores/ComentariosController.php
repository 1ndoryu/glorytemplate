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
use App\Kamples\Services\ServicioAntiSpam;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Services\ServicioNotificaciones;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\LogIA as KamplesLogger;

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

        /* C264: Editar comentario (solo autor) */
        register_rest_route($namespace, '/comentarios/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [self::class, 'editar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C264: Eliminar comentario (autor o admin) */
        register_rest_route($namespace, '/comentarios/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'eliminar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C264: Reportar comentario */
        register_rest_route($namespace, '/comentarios/(?P<id>\d+)/reportar', [
            'methods' => 'POST',
            'callback' => [self::class, 'reportar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C265: Like/unlike comentario */
        register_rest_route($namespace, '/comentarios/(?P<id>\d+)/like', [
            'methods' => 'POST',
            'callback' => [self::class, 'darLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
        register_rest_route($namespace, '/comentarios/(?P<id>\d+)/like', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'quitarLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C265: Respuestas a un comentario */
        register_rest_route($namespace, '/comentarios/(?P<id>\d+)/respuestas', [
            'methods' => 'GET',
            'callback' => [self::class, 'listarRespuestas'],
            'permission_callback' => '__return_true',
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

        /*
         * C131: Filtrar rechazados por moderación.
         * Comentarios 'pendiente' se muestran normalmente (fail-open).
         * Solo se ocultan los explícitamente rechazados.
         */
        /* Obtener userId actual para saber si dio like (null si no autenticado) */
        $currentUserId = UsuarioHelper::obtenerIdPg();

        /* C265: Solo comentarios raíz (sin parent_id), las respuestas se cargan aparte */
        $comentarios = PostgresService::consultar(
            "SELECT c.id, c.contenido, c.created_at, c.updated_at,
                    c.tipo_contenido, c.media_url, c.media_metadata,
                    c.moderacion_estado, c.parent_id,
                    c.total_likes, c.total_respuestas,
                    u.id as autor_id, u.username, u.nombre_visible, u.avatar_url, u.wp_user_id
             FROM comentarios c
             JOIN usuarios_ext u ON c.autor_id = u.id
             WHERE c.tipo = :tipo AND c.target_id = :targetId
               AND c.parent_id IS NULL
               AND (c.moderacion_estado IS NULL OR c.moderacion_estado != 'rechazado')
             ORDER BY c.created_at ASC LIMIT 20 OFFSET :offset",
            ['tipo' => $tipo, 'targetId' => $targetId, 'offset' => $offset]
        );

        $resultado = self::normalizarComentarios($comentarios, $currentUserId);

        return new \WP_REST_Response(['data' => $resultado, 'page' => $page], 200);
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
            $parentId = $request->get_param('parentId') ? (int) $request->get_param('parentId') : null;
        } else {
            $body = $request->get_json_params();
            $contenido = sanitize_textarea_field($body['contenido'] ?? '');
            $tipoContenido = 'texto';
            $parentId = isset($body['parentId']) ? (int) $body['parentId'] : null;
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

        /* C131: Anti-spam heurístico — se evalúa ANTES del INSERT para rechazar inmediatamente */
        if (!empty($contenido)) {
            $razonSpam = ServicioAntiSpam::evaluar($contenido, $userId);
            if ($razonSpam) {
                ServicioBan::registrarViolacion($userId, $razonSpam, 'comentario');
                return new \WP_REST_Response(['code' => 'contenido_spam', 'message' => 'El comentario fue rechazado por spam'], 403);
            }
        }

        /* C132: Verificar si el usuario está baneado */
        $banResp = AuthMiddleware::verificarBanActivo($userId);
        if ($banResp) return $banResp;

        $mediaUrl = null;
        $mediaMetadata = null;

        /* C130: Procesamiento de archivos multimedia */
        if ($tipoContenido === 'imagen' || $tipoContenido === 'audio') {
            $archivos = $request->get_file_params();
            $archivo = $archivos['media'] ?? null;

            if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
                return new \WP_REST_Response(['code' => 'archivo_invalido', 'message' => 'No se recibió archivo válido'], 400);
            }

            /* Validar MIME segun tipo — incluir variantes x- que mime_content_type() devuelve */
            $mimesPermitidos = $tipoContenido === 'imagen'
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

            /* wp_handle_upload no está disponible en contexto REST (solo en admin) */
            if (!function_exists('wp_handle_upload')) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
            }

            \add_filter('upload_dir', $filtroDir);
            $mimesUpload = $tipoContenido === 'audio'
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

            /*
             * C201: Convertir audio de comentarios a MP3 ligero (128kbps, mono, 44100Hz).
             * Los audios en comentarios deben ser livianos para carga rápida.
             * Genera waveform JSON para renderizado en frontend.
             */
            if ($tipoContenido === 'audio') {
                $rutaOriginal = $subido['file'];
                $extension = strtolower(pathinfo($rutaOriginal, PATHINFO_EXTENSION));

                /* Solo convertir si no es ya MP3 */
                if ($extension !== 'mp3') {
                    $rutaMp3 = preg_replace('/\.[^.]+$/', '.mp3', $rutaOriginal);
                    $convertido = self::convertirAudioComentario($rutaOriginal, $rutaMp3);
                    if ($convertido && file_exists($rutaMp3)) {
                        /* Borrar el original y usar el MP3 */
                        @unlink($rutaOriginal);
                        $mediaUrl = preg_replace('/\.[^.]+$/', '.mp3', $subido['url']);
                        $mediaMetadata = json_encode([
                            'formato' => 'mp3',
                            'tamano'  => filesize($rutaMp3),
                            'mimeType' => 'audio/mpeg',
                        ]);
                    }
                }

                /* Generar waveform JSON para el audio del comentario */
                $rutaAudioFinal = $extension !== 'mp3' && isset($rutaMp3) && file_exists($rutaMp3) ? $rutaMp3 : $rutaOriginal;
                $rutaWaveform = preg_replace('/\.[^.]+$/', '_waveform.json', $rutaAudioFinal);
                $picos = self::generarWaveformComentario($rutaAudioFinal, $rutaWaveform);

                if ($picos) {
                    $meta = json_decode($mediaMetadata, true);
                    $meta['waveformUrl'] = preg_replace('/\.[^.]+$/', '_waveform.json', $mediaUrl);
                    $meta['picos'] = $picos;
                    $mediaMetadata = json_encode($meta);
                }
            }

            /* Si no hay texto, la imagen/audio es el comentario completo */
            if (empty($contenido)) {
                $contenido = null;
            }
        }

        $id = PostgresService::insertar(
            "INSERT INTO comentarios (autor_id, tipo, target_id, contenido, tipo_contenido, media_url, media_metadata, parent_id)
             VALUES (:autor, :tipo, :target, :contenido, :tipoContenido, :mediaUrl, :mediaMetadata::jsonb, :parentId)
             RETURNING id",
            [
                'autor' => $userId,
                'tipo' => $tipo,
                'target' => $targetId,
                'contenido' => $contenido,
                'tipoContenido' => $tipoContenido,
                'mediaUrl' => $mediaUrl,
                'mediaMetadata' => $mediaMetadata,
                'parentId' => $parentId,
            ]
        );

        /* C265: Si es respuesta, incrementar total_respuestas del padre */
        if ($parentId) {
            PostgresService::ejecutar(
                "UPDATE comentarios SET total_respuestas = COALESCE(total_respuestas, 0) + 1 WHERE id = :parentId",
                ['parentId' => $parentId]
            );
        }

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

        /*
         * C266: Notificaciones de comentario.
         * - Nuevo comentario en sample: notificar al creador del sample
         * - Respuesta a comentario: notificar al autor del comentario padre
         */
        if ($parentId) {
            /* Respuesta a comentario: notificar al autor del padre */
            $padre = PostgresService::consultarUno(
                "SELECT autor_id FROM comentarios WHERE id = :id",
                ['id' => $parentId]
            );
            if ($padre) {
                $sampleSlug = null;
                if ($tipo === 'sample') {
                    $sInfo = PostgresService::consultarUno("SELECT slug FROM samples WHERE id = :id", ['id' => $targetId]);
                    $sampleSlug = $sInfo['slug'] ?? null;
                }
                ServicioNotificaciones::respuestaComentario(
                    (int) $padre['autor_id'],
                    $userId,
                    $parentId,
                    $tipo === 'sample' ? $targetId : null,
                    $sampleSlug
                );
            }
        } else {
            /* Comentario directo en sample o publicacion: notificar al creador/autor */
            if ($tipo === 'sample') {
                $sampleInfo = PostgresService::consultarUno(
                    "SELECT creador_id, titulo, slug FROM samples WHERE id = :id",
                    ['id' => $targetId]
                );
                if ($sampleInfo) {
                    ServicioNotificaciones::nuevoComentario(
                        (int) $sampleInfo['creador_id'],
                        $userId,
                        $targetId,
                        $sampleInfo['titulo'] ?? '',
                        $sampleInfo['slug'] ?? null
                    );
                }
            } elseif ($tipo === 'publicacion') {
                $pubInfo = PostgresService::consultarUno(
                    "SELECT autor_id FROM publicaciones WHERE id = :id",
                    ['id' => $targetId]
                );
                if ($pubInfo) {
                    ServicioNotificaciones::crear(
                        (int) $pubInfo['autor_id'],
                        'comentario',
                        'Alguien comento en tu publicacion',
                        ['commenter_id' => $userId, 'publicacion_id' => $targetId],
                        $userId,
                        '',
                        "/post/{$targetId}/"
                    );
                }
            }
        }

        /*
         * C131: Moderación IA asíncrona post-INSERT.
         * Se ejecuta después de enviar la respuesta al cliente (fail-open).
         * El comentario se muestra inmediatamente; si IA lo rechaza, desaparece.
         */
        $comentarioIdMod = $id;
        $textoMod = $contenido ?? '';
        $mediaUrlMod = $mediaUrl;
        $tipoContenidoMod = $tipoContenido;
        $autorIdMod = $userId;

        register_shutdown_function(function () use ($comentarioIdMod, $autorIdMod, $textoMod, $mediaUrlMod, $tipoContenidoMod) {
            try {
                ServicioModeracionIA::moderarComentario(
                    $comentarioIdMod,
                    $autorIdMod,
                    $textoMod,
                    $mediaUrlMod,
                    $tipoContenidoMod
                );
            } catch (\Throwable $e) {
                /* Moderación fail-open pero con logging para detectar fallos recurrentes */
                KamplesLogger::warning('Moderación async de comentario falló', [
                    'comentarioId' => $comentarioIdMod,
                    'error' => $e->getMessage(),
                ], 'moderacion');
            }
        });

        /* Obtener datos del autor para devolver el comentario completo */
        $usuario = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, avatar_url, wp_user_id FROM usuarios_ext WHERE id = :id",
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
                'parentId' => $parentId,
                'totalLikes' => 0,
                'totalRespuestas' => 0,
                'liked' => false,
                'autor' => [
                    'id' => $userId,
                    'username' => $usuario['username'] ?? '',
                    'nombreVisible' => $usuario['nombre_visible'] ?? '',
                    'avatarUrl' => UsuarioHelper::resolverAvatarUrl(
                        $usuario['avatar_url'] ?? null,
                        (int) ($usuario['wp_user_id'] ?? 0)
                    ),
                ],
            ],
        ], 201);
    }

    /* C264: Editar comentario (solo autor) */
    public static function editar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $contenido = sanitize_textarea_field($body['contenido'] ?? '');

        if (empty($contenido)) {
            return new \WP_REST_Response(['code' => 'contenido_vacio'], 400);
        }

        $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_COMENTARIO, 'El comentario');
        if ($errorLongitud) return Validador::respuestaError($errorLongitud);

        /* Verificar que el comentario existe y es del autor */
        $comentario = PostgresService::consultarUno(
            "SELECT id, autor_id FROM comentarios WHERE id = :id",
            ['id' => $id]
        );

        if (!$comentario) {
            return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
        }

        if ((int) $comentario['autor_id'] !== $userId) {
            return new \WP_REST_Response(['code' => 'no_autorizado', 'message' => 'Solo puedes editar tus comentarios'], 403);
        }

        PostgresService::ejecutar(
            "UPDATE comentarios SET contenido = :contenido, updated_at = NOW() WHERE id = :id",
            ['contenido' => $contenido, 'id' => $id]
        );

        return new \WP_REST_Response([
            'ok' => true,
            'data' => [
                'id' => $id,
                'contenido' => $contenido,
                'editadoAt' => date('c'),
            ],
        ], 200);
    }

    /* C264: Eliminar comentario (autor o admin) */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');

        $comentario = PostgresService::consultarUno(
            "SELECT id, autor_id, parent_id, tipo, target_id FROM comentarios WHERE id = :id",
            ['id' => $id]
        );

        if (!$comentario) {
            return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
        }

        $esAutor = (int) $comentario['autor_id'] === $userId;
        $esAdmin = current_user_can('manage_options');

        if (!$esAutor && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
        }

        /* Si tiene padre, decrementar total_respuestas */
        if ($comentario['parent_id']) {
            PostgresService::ejecutar(
                "UPDATE comentarios SET total_respuestas = GREATEST(0, COALESCE(total_respuestas, 0) - 1) WHERE id = :parentId",
                ['parentId' => (int) $comentario['parent_id']]
            );
        }

        /* CASCADE borra respuestas hijas automaticamente */
        PostgresService::ejecutar("DELETE FROM comentarios WHERE id = :id", ['id' => $id]);

        /* Actualizar contador */
        $tabla = $comentario['tipo'] === 'publicacion' ? 'publicaciones' : 'samples';
        PostgresService::ejecutar(
            "UPDATE {$tabla} SET total_comentarios = (
                SELECT COUNT(*) FROM comentarios WHERE tipo = :tipo AND target_id = :targetId
            ) WHERE id = :targetId",
            ['tipo' => $comentario['tipo'], 'targetId' => (int) $comentario['target_id']]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /* C264: Reportar comentario */
    public static function reportar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $razon = sanitize_textarea_field($body['razon'] ?? 'contenido inapropiado');

        /* Verificar que existe */
        $existe = PostgresService::consultarUno("SELECT id FROM comentarios WHERE id = :id", ['id' => $id]);
        if (!$existe) {
            return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
        }

        /* Evitar reportes duplicados */
        $yaReportado = PostgresService::consultarUno(
            "SELECT id FROM reportes WHERE tipo = 'comentario' AND target_id = :targetId AND reportador_id = :userId",
            ['targetId' => $id, 'userId' => $userId]
        );

        if ($yaReportado) {
            return new \WP_REST_Response(['ok' => true, 'message' => 'Ya reportaste este comentario'], 200);
        }

        PostgresService::insertar(
            "INSERT INTO reportes (tipo, target_id, reportador_id, razon, estado)
             VALUES ('comentario', :targetId, :userId, :razon, 'pendiente')
             RETURNING id",
            ['targetId' => $id, 'userId' => $userId, 'razon' => $razon]
        );

        return new \WP_REST_Response(['ok' => true, 'message' => 'Reporte enviado'], 201);
    }

    /* C265: Dar like a un comentario */
    public static function darLike(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');

        /* Verificar existencia */
        $existe = PostgresService::consultarUno("SELECT id FROM comentarios WHERE id = :id", ['id' => $id]);
        if (!$existe) return new \WP_REST_Response(['code' => 'no_encontrado'], 404);

        /* Insertar o ignorar (ON CONFLICT) */
        PostgresService::ejecutar(
            "INSERT INTO likes (usuario_id, tipo, target_id)
             VALUES (:userId, 'comentario', :targetId)
             ON CONFLICT (usuario_id, tipo, target_id) DO NOTHING",
            ['userId' => $userId, 'targetId' => $id]
        );

        /* Recalcular total */
        $total = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM likes WHERE tipo = 'comentario' AND target_id = :id",
            ['id' => $id]
        );
        $totalLikes = (int) ($total['total'] ?? 0);

        PostgresService::ejecutar(
            "UPDATE comentarios SET total_likes = :total WHERE id = :id",
            ['total' => $totalLikes, 'id' => $id]
        );

        /* C266: Notificacion de like en comentario */
        $comentario = PostgresService::consultarUno(
            "SELECT autor_id FROM comentarios WHERE id = :id",
            ['id' => $id]
        );
        if ($comentario) {
            ServicioNotificaciones::likeComentario(
                (int) $comentario['autor_id'],
                $userId,
                $id
            );
        }

        return new \WP_REST_Response(['data' => ['totalLikes' => $totalLikes, 'liked' => true]], 200);
    }

    /* C265: Quitar like de un comentario */
    public static function quitarLike(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');

        PostgresService::ejecutar(
            "DELETE FROM likes WHERE usuario_id = :userId AND tipo = 'comentario' AND target_id = :targetId",
            ['userId' => $userId, 'targetId' => $id]
        );

        $total = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM likes WHERE tipo = 'comentario' AND target_id = :id",
            ['id' => $id]
        );
        $totalLikes = (int) ($total['total'] ?? 0);

        PostgresService::ejecutar(
            "UPDATE comentarios SET total_likes = :total WHERE id = :id",
            ['total' => $totalLikes, 'id' => $id]
        );

        return new \WP_REST_Response(['data' => ['totalLikes' => $totalLikes, 'liked' => false]], 200);
    }

    /* C265: Listar respuestas de un comentario */
    public static function listarRespuestas(\WP_REST_Request $request): \WP_REST_Response
    {
        $parentId = (int) $request->get_param('id');
        $currentUserId = UsuarioHelper::obtenerIdPg();

        $respuestas = PostgresService::consultar(
            "SELECT c.id, c.contenido, c.created_at, c.updated_at,
                    c.tipo_contenido, c.media_url, c.media_metadata,
                    c.moderacion_estado, c.parent_id,
                    c.total_likes, c.total_respuestas,
                    u.id as autor_id, u.username, u.nombre_visible, u.avatar_url, u.wp_user_id
             FROM comentarios c
             JOIN usuarios_ext u ON c.autor_id = u.id
             WHERE c.parent_id = :parentId
               AND (c.moderacion_estado IS NULL OR c.moderacion_estado != 'rechazado')
             ORDER BY c.created_at ASC LIMIT 50",
            ['parentId' => $parentId]
        );

        $resultado = self::normalizarComentarios($respuestas, $currentUserId);

        return new \WP_REST_Response(['data' => $resultado], 200);
    }

    /*
     * C264+C265: Normaliza filas SQL de comentarios a formato camelCase para frontend.
     * Incluye detección de like por usuario actual.
     */
    private static function normalizarComentarios(array $filas, ?int $currentUserId): array
    {
        if (empty($filas)) return [];

        /* Obtener likes del usuario actual en batch */
        $idsComentarios = array_column($filas, 'id');
        $likesUsuario = [];

        if ($currentUserId && !empty($idsComentarios)) {
            $placeholders = implode(',', array_fill(0, count($idsComentarios), '?'));
            $params = array_merge([$currentUserId], $idsComentarios);
            $likes = PostgresService::consultar(
                "SELECT target_id FROM likes WHERE usuario_id = ? AND tipo = 'comentario' AND target_id IN ({$placeholders})",
                $params
            );
            foreach ($likes as $like) {
                $likesUsuario[(int) $like['target_id']] = true;
            }
        }

        return array_map(function ($fila) use ($likesUsuario) {
            $comentarioId = (int) $fila['id'];
            $meta = null;
            if (!empty($fila['media_metadata'])) {
                $meta = is_string($fila['media_metadata'])
                    ? json_decode($fila['media_metadata'], true)
                    : $fila['media_metadata'];
            }

            return [
                'id' => $comentarioId,
                'autorId' => (int) $fila['autor_id'],
                'contenido' => $fila['contenido'] ?? '',
                'creadoAt' => $fila['created_at'] ?? '',
                'editadoAt' => $fila['updated_at'] ?? null,
                'tipoContenido' => $fila['tipo_contenido'] ?? 'texto',
                'mediaUrl' => $fila['media_url'] ?? null,
                'mediaMetadata' => $meta,
                'parentId' => $fila['parent_id'] ? (int) $fila['parent_id'] : null,
                'totalLikes' => (int) ($fila['total_likes'] ?? 0),
                'totalRespuestas' => (int) ($fila['total_respuestas'] ?? 0),
                'liked' => isset($likesUsuario[$comentarioId]),
                'autor' => [
                    'id' => (int) $fila['autor_id'],
                    'username' => $fila['username'] ?? '',
                    'nombreVisible' => $fila['nombre_visible'] ?? '',
                    'avatarUrl' => UsuarioHelper::resolverAvatarUrl(
                        $fila['avatar_url'] ?? null,
                        (int) ($fila['wp_user_id'] ?? 0)
                    ),
                ],
            ];
        }, $filas);
    }

    /*
     * C201: Convierte audio de comentario a MP3 ligero (128kbps, mono, 44100Hz).
     * Reutiliza la detección de FFmpeg de PipelineAudio vía .env o PATH.
     */
    private static function convertirAudioComentario(string $entrada, string $salida): bool
    {
        $ffmpeg = self::obtenerFFmpegBin();
        if (!$ffmpeg) {
            KamplesLogger::warning('ComentariosController: FFmpeg no disponible para conversion de audio');
            return false;
        }

        $cmd = sprintf(
            '%s -y -i %s -codec:a libmp3lame -b:a 128k -ac 1 -ar 44100 %s 2>&1',
            escapeshellarg($ffmpeg),
            escapeshellarg($entrada),
            escapeshellarg($salida)
        );

        exec($cmd, $output, $returnCode);
        return $returnCode === 0 && file_exists($salida);
    }

    /*
     * C201: Genera peaks waveform (60 barras) para audio de comentario.
     * Similar a PipelineAudio pero con menos resolución (audio corto).
     */
    private static function generarWaveformComentario(string $rutaAudio, string $rutaSalida): ?array
    {
        $ffmpeg = self::obtenerFFmpegBin();
        if (!$ffmpeg) return null;

        $barras = 60;

        /* Decodificar audio a PCM raw con FFmpeg */
        $tmpPcm = sys_get_temp_dir() . '/kamples_comment_pcm_' . uniqid() . '.raw';
        $cmd = sprintf(
            '%s -y -i %s -f f32le -acodec pcm_f32le -ac 1 -ar 8000 %s 2>&1',
            escapeshellarg($ffmpeg),
            escapeshellarg($rutaAudio),
            escapeshellarg($tmpPcm)
        );

        exec($cmd, $output, $returnCode);
        if ($returnCode !== 0 || !file_exists($tmpPcm)) {
            @unlink($tmpPcm);
            return null;
        }

        $raw = file_get_contents($tmpPcm);
        @unlink($tmpPcm);

        if (!$raw || strlen($raw) < 4) return null;

        $samples = unpack('f*', $raw);
        if (!$samples) return null;

        $total = count($samples);
        $porBarra = max(1, (int) floor($total / $barras));
        $picos = [];

        for ($i = 0; $i < $barras; $i++) {
            $inicio = $i * $porBarra + 1;
            $max = 0;
            for ($j = 0; $j < $porBarra; $j++) {
                $idx = $inicio + $j;
                if (isset($samples[$idx])) {
                    $val = abs($samples[$idx]);
                    if ($val > $max) $max = $val;
                }
            }
            $picos[] = round($max, 4);
        }

        /* Normalizar entre 0 y 1 */
        $maximo = max($picos) ?: 1;
        $picos = array_map(fn($p) => round(max(0.03, $p / $maximo), 3), $picos);

        /* Guardar como JSON */
        file_put_contents($rutaSalida, json_encode($picos));

        return $picos;
    }

    /*
     * Obtiene la ruta al binario FFmpeg (desde .env o PATH).
     */
    private static function obtenerFFmpegBin(): ?string
    {
        /* Intentar desde .env */
        $envPath = defined('FFMPEG_PATH') ? FFMPEG_PATH : (\getenv('FFMPEG_PATH') ?: null);
        if ($envPath && is_executable($envPath)) return $envPath;

        /* Intentar desde PATH del sistema */
        $esWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $cmd = $esWindows ? 'where ffmpeg 2>nul' : 'which ffmpeg 2>/dev/null';
        $resultado = trim(shell_exec($cmd) ?? '');

        if ($resultado) {
            $lineas = explode("\n", $resultado);
            $ruta = trim($lineas[0]);
            if (is_executable($ruta)) return $ruta;
        }

        return null;
    }
}
