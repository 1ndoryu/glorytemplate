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
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Api\ServicioImagenIA;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\KamplesLogger;
use App\Kamples\Api\Helpers\NormalizadorSample;

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
                'autor' => ['required' => false, 'type' => 'string'],
            ],
        ]);

        register_rest_route($namespace, '/publicaciones', [
            'methods' => 'POST', 'callback' => [self::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)', [
            [
                'methods' => 'GET', 'callback' => [self::class, 'obtener'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods' => 'PUT', 'callback' => [self::class, 'actualizar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
            [
                'methods' => 'DELETE', 'callback' => [self::class, 'eliminar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
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

        register_rest_route($namespace, '/publicaciones/imagenes', [
            'methods' => 'POST', 'callback' => [self::class, 'subirImagen'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        $page = max(1, (int) $request->get_param('page'));
        $filtro = $request->get_param('filtro');
        $autor = $request->get_param('autor');
        $offset = ($page - 1) * 20;

        $donde = '';
        $params = ['limit' => 20, 'offset' => $offset];

        /*
         * C71: Moderación — solo mostrar posts aprobados o pendientes (sin moderar aún).
         * Posts en supervisión o pendientes solo visibles para su autor.
         */
        $userId = UsuarioHelper::obtenerIdPg();
        if ($userId) {
            $donde .= " AND (p.moderacion_estado IS NULL OR p.moderacion_estado = 'aprobado' OR ((p.moderacion_estado = 'revision' OR p.moderacion_estado = 'pendiente') AND p.autor_id = :currentUser))";
            $params['currentUser'] = $userId;
        } else {
            $donde .= " AND (p.moderacion_estado IS NULL OR p.moderacion_estado = 'aprobado')";
        }

        if ($filtro === 'siguiendo') {
            if ($userId) {
                $donde .= " AND p.autor_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId)";
                $params['userId'] = $userId;
            }
        }

        /* C93: Filtrar por autor (username) para tab de publicaciones en perfil */
        if (!empty($autor)) {
            $donde .= " AND u.username = :autor";
            $params['autor'] = sanitize_text_field($autor);
        }

        $orderBy = $filtro === 'populares'
            ? 'ORDER BY p.total_likes DESC, p.created_at DESC'
            : 'ORDER BY p.created_at DESC';

        /* Obtener userId actual para campo liked */
        $currentUserId = UsuarioHelper::obtenerIdPg();

        $likedSubquery = $currentUserId
            ? ", (SELECT l.reaccion FROM likes l WHERE l.tipo = 'publicacion' AND l.target_id = p.id AND l.usuario_id = :current_user LIMIT 1) AS reaccion_usuario"
            : ", NULL AS reaccion_usuario";

        if ($currentUserId) {
            $params['current_user'] = $currentUserId;
        }

        $publicaciones = PostgresService::consultar(
            "SELECT p.*, u.username, u.nombre_visible, u.avatar_url, u.verificado, u.wp_user_id
             {$likedSubquery}
             FROM publicaciones p
             JOIN usuarios_ext u ON p.autor_id = u.id
             WHERE 1=1
             {$donde}
             {$orderBy} LIMIT :limit OFFSET :offset",
            $params
        );

        /* Enriquecer con contadores y parsear arrays PostgreSQL */
        foreach ($publicaciones as &$pub) {
            $pub['totalComentarios'] = (int) ($pub['total_comentarios'] ?? 0);
            $pub['totalLikes'] = (int) ($pub['total_likes'] ?? 0);
            $pub['totalReposts'] = (int) ($pub['total_reposts'] ?? 0);
            $pub['creadoAt'] = $pub['created_at'] ?? '';
            $pub['liked'] = in_array($pub['reaccion_usuario'] ?? null, ['like', 'encanta'], true);
            $pub['reaccion'] = $pub['reaccion_usuario'] ?? null;
            unset($pub['reaccion_usuario']);
            $pub['moderacionEstado'] = $pub['moderacion_estado'] ?? null;
            $pub['imagenes'] = NormalizadorSample::pgArrayToPhp($pub['imagenes'] ?? null);
            $pub['samplesAdjuntos'] = array_map('intval', NormalizadorSample::pgArrayToPhp($pub['samples_adjuntos'] ?? null));
            $pub['autor'] = [
                'id' => (int) $pub['autor_id'],
                'username' => $pub['username'],
                'nombreVisible' => $pub['nombre_visible'],
                'avatarUrl' => UsuarioHelper::resolverAvatarUrl($pub['avatar_url'] ?? null, (int) ($pub['wp_user_id'] ?? 0)),
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

        /* C164: Limite de longitud */
        $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_PUBLICACION, 'La publicación');
        if ($errorLongitud) {
            return Validador::respuestaError($errorLongitud);
        }

        /* C164: Rate limiting — 5 publicaciones por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'publicar', 5, 60);
        if ($limitResp) return $limitResp;

        /* C164: Validar imagenes (limite y URLs) */
        $imagenesRaw = $body['imagenes'] ?? [];
        if (is_array($imagenesRaw) && !empty($imagenesRaw)) {
            $errorImgs = Validador::validarImagenesUrls($imagenesRaw);
            if ($errorImgs) return Validador::respuestaError($errorImgs);
        }

        $imagenes = !empty($body['imagenes'])
            ? '{' . implode(',', array_map(fn($v) => '"' . addslashes(\esc_url_raw($v)) . '"', $body['imagenes'])) . '}'
            : '{}';
        /* samplesAdjuntos viene en camelCase del frontend */
        $adjuntosRaw = $body['samples_adjuntos'] ?? $body['samplesAdjuntos'] ?? [];
        $samplesAdjuntos = !empty($adjuntosRaw)
            ? '{' . implode(',', array_map('intval', $adjuntosRaw)) . '}'
            : '{}';

        $id = PostgresService::insertar(
            "INSERT INTO publicaciones (autor_id, contenido, imagenes, samples_adjuntos)
             VALUES (:autor, :contenido, :imagenes, :samples) RETURNING id",
            ['autor' => $userId, 'contenido' => $contenido, 'imagenes' => $imagenes, 'samples' => $samplesAdjuntos]
        );

        /* Análisis async de imágenes con IA + moderación (no bloquea la respuesta) */
        $urlsImagenes = $body['imagenes'] ?? [];
        $esAdmin = UsuarioHelper::esAdmin();

        if ($id) {
            $pubId = $id;
            $textoMod = $contenido;
            $imgsMod = is_array($urlsImagenes) ? $urlsImagenes : [];
            $adminFlag = $esAdmin;

            \add_action('shutdown', function () use ($pubId, $textoMod, $imgsMod, $adminFlag) {
                if (function_exists('fastcgi_finish_request')) {
                    \fastcgi_finish_request();
                }

                /*
                 * C71: Posts de admin siempre se aprueban automáticamente.
                 * La IA igualmente supervisa (para testing), pero no bloquea.
                 */
                try {
                    $resultado = ServicioModeracionIA::moderarPublicacion($pubId, $textoMod, $imgsMod);

                    if ($adminFlag && ($resultado['nivel'] ?? '') !== 'aprobado') {
                        KamplesLogger::info('ModeracionIA: Post admin forzado a aprobado', [
                            'publicacionId' => $pubId,
                            'nivelOriginal' => $resultado['nivel'] ?? 'desconocido',
                        ], 'moderacion');
                        PostgresService::ejecutar(
                            "UPDATE publicaciones SET moderacion_estado = 'aprobado', moderacion_razon = 'admin_auto' WHERE id = :id",
                            ['id' => $pubId]
                        );
                    }
                } catch (\Throwable $e) {
                    KamplesLogger::error('Error en moderación de publicación', [
                        'publicacionId' => $pubId,
                        'error' => $e->getMessage(),
                    ], 'moderacion');
                    /* Si falla la moderación y es admin, aprobar de todas formas */
                    if ($adminFlag) {
                        PostgresService::ejecutar(
                            "UPDATE publicaciones SET moderacion_estado = 'aprobado' WHERE id = :id",
                            ['id' => $pubId]
                        );
                    }
                }

                /* Análisis de imágenes para metadata */
                if (!empty($imgsMod)) {
                    try {
                        $metadata = ServicioImagenIA::analizarMultiples($imgsMod);
                        $metadataLimpia = array_filter($metadata, fn($m) => $m !== null);
                        if (!empty($metadataLimpia)) {
                            PostgresService::ejecutar(
                                "UPDATE publicaciones SET imagenes_metadata = :meta WHERE id = :id",
                                ['meta' => json_encode($metadataLimpia), 'id' => $pubId]
                            );
                            KamplesLogger::info('Imágenes analizadas para publicación', [
                                'publicacionId' => $pubId,
                                'totalImagenes' => count($imgsMod),
                                'analizadas' => count($metadataLimpia),
                            ]);
                        }
                    } catch (\Throwable $e) {
                        KamplesLogger::error('Error analizando imágenes de publicación', [
                            'publicacionId' => $pubId,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }, 0);
        }

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
    }

    /**
     * PUT /publicaciones/{id} — Actualizar contenido de una publicación.
     * Solo el autor o admin pueden editar.
     */
    public static function actualizar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $esAdmin = UsuarioHelper::esAdmin();

        $pub = PostgresService::consultarUno(
            "SELECT id, autor_id FROM publicaciones WHERE id = :id",
            ['id' => $id]
        );

        if (!$pub) {
            return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
        }

        if ((int) $pub['autor_id'] !== $userId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'No tienes permiso para editar esta publicación'], 403);
        }

        $body = $request->get_json_params();
        $campos = [];
        $params = ['id' => $id];

        if (isset($body['contenido'])) {
            $contenido = sanitize_textarea_field($body['contenido']);
            if (empty($contenido)) {
                return new \WP_REST_Response(['code' => 'contenido_vacio', 'message' => 'La publicación necesita contenido'], 400);
            }
            /* C164: Limite de longitud */
            $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_PUBLICACION, 'La publicación');
            if ($errorLongitud) return Validador::respuestaError($errorLongitud);

            $campos[] = 'contenido = :contenido';
            $params['contenido'] = $contenido;
        }

        if (isset($body['imagenes'])) {
            /* C164: Validar URLs y cantidad */
            $imagenesArr = is_array($body['imagenes']) ? $body['imagenes'] : [];
            $errorImgs = Validador::validarImagenesUrls($imagenesArr);
            if ($errorImgs) return Validador::respuestaError($errorImgs);

            $imagenes = !empty($imagenesArr)
                ? '{' . implode(',', array_map(fn($v) => '"' . addslashes(\esc_url_raw($v)) . '"', $imagenesArr)) . '}'
                : '{}';
            $campos[] = 'imagenes = :imagenes';
            $params['imagenes'] = $imagenes;
        }

        /* Solo admin puede cambiar estado de moderación */
        if (isset($body['moderacionEstado']) && $esAdmin) {
            $estadosValidos = ['pendiente', 'aprobado', 'revision', 'rechazado'];
            if (in_array($body['moderacionEstado'], $estadosValidos, true)) {
                $campos[] = 'moderacion_estado = :modEstado';
                $params['modEstado'] = $body['moderacionEstado'];
            }
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No se recibieron campos para actualizar'], 400);
        }

        PostgresService::ejecutar(
            "UPDATE publicaciones SET " . implode(', ', $campos) . ", updated_at = NOW() WHERE id = :id",
            $params
        );

        KamplesLogger::info('Publicación actualizada', [
            'publicacionId' => $id,
            'por' => $esAdmin && (int) $pub['autor_id'] !== $userId ? 'admin' : 'autor',
        ]);

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /**
     * DELETE /publicaciones/{id} — Eliminar publicación.
     * Solo el autor o admin pueden eliminar.
     */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $esAdmin = UsuarioHelper::esAdmin();

        $pub = PostgresService::consultarUno(
            "SELECT id, autor_id FROM publicaciones WHERE id = :id",
            ['id' => $id]
        );

        if (!$pub) {
            return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
        }

        if ((int) $pub['autor_id'] !== $userId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos'], 403);
        }

        /* Cascade manual: likes, comentarios */
        PostgresService::ejecutar("DELETE FROM likes WHERE tipo = 'publicacion' AND target_id = :id", ['id' => $id]);
        PostgresService::ejecutar("DELETE FROM comentarios WHERE tipo = 'publicacion' AND target_id = :id", ['id' => $id]);
        PostgresService::ejecutar("DELETE FROM publicaciones WHERE id = :id", ['id' => $id]);

        KamplesLogger::info('Publicación eliminada', ['publicacionId' => $id]);

        return new \WP_REST_Response(['ok' => true, 'eliminado' => true], 200);
    }

    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');

        $pub = PostgresService::consultarUno(
            "SELECT p.*, u.username, u.nombre_visible, u.avatar_url, u.verificado, u.wp_user_id
             FROM publicaciones p JOIN usuarios_ext u ON p.autor_id = u.id WHERE p.id = :id",
            ['id' => $id]
        );

        if (!$pub) {
            return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
        }

        /*
         * Seguridad: no exponer publicaciones rechazadas a terceros.
         * Solo el autor puede ver sus propias publicaciones rechazadas.
         */
        $estado = $pub['moderacion_estado'] ?? null;
        if ($estado === 'rechazado') {
            $usuarioActual = UsuarioHelper::obtenerIdPg();
            if (!$usuarioActual || $usuarioActual !== (int) $pub['autor_id']) {
                return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
            }
        }

        $pub['autor'] = [
            'id' => (int) $pub['autor_id'],
            'username' => $pub['username'],
            'nombreVisible' => $pub['nombre_visible'],
            'avatarUrl' => UsuarioHelper::resolverAvatarUrl(
                $pub['avatar_url'] ?? null,
                isset($pub['wp_user_id']) ? (int) $pub['wp_user_id'] : null
            ),
            'verificado' => (bool) $pub['verificado'],
        ];
        $pub['imagenes'] = NormalizadorSample::pgArrayToPhp($pub['imagenes'] ?? null);
        $pub['samplesAdjuntos'] = array_map('intval', NormalizadorSample::pgArrayToPhp($pub['samples_adjuntos'] ?? null));
        $pub['totalComentarios'] = (int) ($pub['total_comentarios'] ?? 0);
        $pub['totalLikes'] = (int) ($pub['total_likes'] ?? 0);

        return new \WP_REST_Response(['data' => $pub], 200);
    }

    public static function listarComentarios(\WP_REST_Request $request): \WP_REST_Response
    {
        $pubId = (int) $request->get_param('id');
        $page = max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 20;

        $comentarios = PostgresService::consultar(
            "SELECT c.id, c.contenido, c.created_at, c.total_likes,
                    u.id as autor_id, u.username, u.nombre_visible, u.avatar_url, u.wp_user_id
             FROM comentarios c
             JOIN usuarios_ext u ON c.autor_id = u.id
             WHERE c.tipo = 'publicacion' AND c.target_id = :pubId
             ORDER BY c.created_at ASC LIMIT 20 OFFSET :offset",
            ['pubId' => $pubId, 'offset' => $offset]
        );

        /* C193: Fallback avatar a WP Gravatar */
        foreach ($comentarios as &$com) {
            $com['avatar_url'] = UsuarioHelper::resolverAvatarUrl(
                $com['avatar_url'] ?? null,
                isset($com['wp_user_id']) ? (int) $com['wp_user_id'] : null
            );
            unset($com['wp_user_id']);
        }
        unset($com);

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

        /* C164: Limite de longitud y rate limiting */
        $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_COMENTARIO, 'El comentario');
        if ($errorLongitud) return Validador::respuestaError($errorLongitud);

        $limitResp = RateLimiter::verificarUsuario($userId, 'comentar', 10, 60);
        if ($limitResp) return $limitResp;

        $id = PostgresService::insertar(
            "INSERT INTO comentarios (autor_id, tipo, target_id, contenido) VALUES (:autor, 'publicacion', :target, :contenido) RETURNING id",
            ['autor' => $userId, 'target' => $pubId, 'contenido' => $contenido]
        );

        /* Actualizar contador */
        PostgresService::ejecutar(
            "UPDATE publicaciones SET total_comentarios = (SELECT COUNT(*) FROM comentarios WHERE tipo = 'publicacion' AND target_id = :id) WHERE id = :id",
            ['id' => $pubId]
        );

        /* C45: registrar interacción para el planificador del algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, 'comentario');

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

    /* pgArrayAPhp eliminado — usar NormalizadorSample::pgArrayToPhp (DRY) */

    /**
     * Subir imagen para publicación.
     * Guarda en wp-content/uploads/kamples/publicaciones/{userId}/.
     * Devuelve la URL real del servidor.
     */
    public static function subirImagen(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $files = $request->get_file_params();
        if (empty($files['imagen'])) {
            return new \WP_REST_Response(['code' => 'sin_imagen', 'message' => 'No se recibió ninguna imagen'], 400);
        }

        $archivo = $files['imagen'];
        $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $tipoReal = finfo_file($finfo, $archivo['tmp_name']);
        finfo_close($finfo);

        if (!in_array($tipoReal, $tiposPermitidos, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido', 'message' => 'Tipo de imagen no permitido'], 400);
        }

        /* Limite 5MB */
        if ($archivo['size'] > 5 * 1024 * 1024) {
            return new \WP_REST_Response(['code' => 'muy_grande', 'message' => 'La imagen excede 5MB'], 400);
        }

        $uploadDir = wp_upload_dir();
        $carpeta = $uploadDir['basedir'] . '/kamples/publicaciones/' . $userId;
        if (!file_exists($carpeta)) {
            wp_mkdir_p($carpeta);
        }

        $ext = match ($tipoReal) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
            default      => 'jpg',
        };

        $nombreArchivo = 'pub_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $rutaDestino = $carpeta . '/' . $nombreArchivo;

        if (!move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
            return new \WP_REST_Response(['code' => 'error_guardado', 'message' => 'Error al guardar la imagen'], 500);
        }

        $url = $uploadDir['baseurl'] . '/kamples/publicaciones/' . $userId . '/' . $nombreArchivo;

        return new \WP_REST_Response(['ok' => true, 'url' => $url], 200);
    }
}
