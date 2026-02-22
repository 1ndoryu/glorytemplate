<?php

/**
 * PublicacionesController — Feed social de la comunidad (lectura + media).
 *
 * GET  /publicaciones                   — Feed de publicaciones
 * GET  /publicaciones/{id}              — Detalle
 * GET  /publicaciones/{id}/comentarios  — Listar comentarios
 * POST /publicaciones/imagenes          — Subir imagen
 *
 * Escritura delegada a PublicacionesEscrituraController.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\FollowsCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Kamples\KamplesLogger;

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
            'methods' => 'POST', 'callback' => [PublicacionesEscrituraController::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)', [
            [
                'methods' => 'GET', 'callback' => [self::class, 'obtener'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods' => 'PUT', 'callback' => [PublicacionesEscrituraController::class, 'actualizar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
            [
                'methods' => 'DELETE', 'callback' => [PublicacionesEscrituraController::class, 'eliminar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)/comentarios', [
            'methods' => 'GET', 'callback' => [self::class, 'listarComentarios'],
            'permission_callback' => '__return_true',
            'args' => ['page' => ['required' => false, 'type' => 'integer', 'default' => 1]],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)/comentarios', [
            'methods' => 'POST', 'callback' => [PublicacionesEscrituraController::class, 'crearComentario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)/repost', [
            'methods' => 'POST', 'callback' => [PublicacionesEscrituraController::class, 'repostear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/publicaciones/(?P<id>\d+)/reportar', [
            'methods' => 'POST', 'callback' => [PublicacionesEscrituraController::class, 'reportar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/publicaciones/imagenes', [
            'methods' => 'POST', 'callback' => [self::class, 'subirImagen'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $page = \max(1, (int) $request->get_param('page'));
        $filtro = $request->get_param('filtro');
        $autor = $request->get_param('autor');
        $offset = ($page - 1) * 20;

        $donde = '';
        $params = ['limit' => 20, 'offset' => $offset];

        /*
         * C71: Moderación — solo mostrar posts aprobados o pendientes (sin moderar aún).
         * Posts en supervisión o pendientes solo visibles para su autor.
         */
        $pModEstado = PublicacionesCols::MODERACION_ESTADO;
        $pAutorId = PublicacionesCols::AUTOR_ID;
        $uUser = UsuariosExtCols::USERNAME;
        $pTotLikes = PublicacionesCols::TOTAL_LIKES;
        $pCreAt = PublicacionesCols::CREATED_AT;

        $userId = UsuarioHelper::obtenerIdPg();
        if ($userId) {
            $donde .= " AND (p.{$pModEstado} IS NULL OR p.{$pModEstado} = 'aprobado' OR ((p.{$pModEstado} = 'revision' OR p.{$pModEstado} = 'pendiente') AND p.{$pAutorId} = :currentUser))";
            $params['currentUser'] = $userId;
        } else {
            $donde .= " AND (p.{$pModEstado} IS NULL OR p.{$pModEstado} = 'aprobado')";
        }

        if ($filtro === 'siguiendo') {
            if ($userId) {
                $tf = FollowsCols::TABLA;
                $fSeguidoId = FollowsCols::SEGUIDO_ID;
                $fSeguidorId = FollowsCols::SEGUIDOR_ID;
                $donde .= " AND p.{$pAutorId} IN (SELECT {$fSeguidoId} FROM {$tf} WHERE {$fSeguidorId} = :userId)";
                $params['userId'] = $userId;
            }
        }

        /* C93: Filtrar por autor (username) para tab de publicaciones en perfil */
        if (!empty($autor)) {
            $donde .= " AND u.{$uUser} = :autor";
            $params['autor'] = sanitize_text_field($autor);
        }

        $orderBy = $filtro === 'populares'
            ? "ORDER BY p.{$pTotLikes} DESC, p.{$pCreAt} DESC"
            : "ORDER BY p.{$pCreAt} DESC";

        /* Obtener userId actual para campo liked */
        $currentUserId = UsuarioHelper::obtenerIdPg();

        if ($currentUserId) {
            $params['current_user'] = $currentUserId;
        }

        $publicaciones = PublicacionesRepository::listarFeed($donde, $orderBy, $params);

        /* Enriquecer con contadores y parsear arrays PostgreSQL */
        foreach ($publicaciones as &$pub) {
            $pub['totalComentarios'] = (int) ($pub[PublicacionesCols::TOTAL_COMENTARIOS] ?? 0);
            $pub['totalLikes'] = (int) ($pub[PublicacionesCols::TOTAL_LIKES] ?? 0);
            $pub['totalReposts'] = (int) ($pub[PublicacionesCols::TOTAL_REPOSTS] ?? 0);
            $pub['creadoAt'] = $pub[PublicacionesCols::CREATED_AT] ?? '';
            $pub['liked'] = \in_array($pub['reaccion_usuario'] ?? null, [LikesEnums::REACCION_LIKE, LikesEnums::REACCION_ENCANTA], true);
            $pub['reaccion'] = $pub['reaccion_usuario'] ?? null;
            unset($pub['reaccion_usuario']);
            $pub['moderacionEstado'] = $pub[PublicacionesCols::MODERACION_ESTADO] ?? null;
            $pub['imagenes'] = NormalizadorSample::pgArrayToPhp($pub[PublicacionesCols::IMAGENES] ?? null);
            $pub['samplesAdjuntos'] = \array_map('intval', NormalizadorSample::pgArrayToPhp($pub[PublicacionesCols::SAMPLES_ADJUNTOS] ?? null));
            $pub['autor'] = [
                'id' => (int) $pub[PublicacionesCols::AUTOR_ID],
                'username' => $pub[UsuariosExtCols::USERNAME],
                'nombreVisible' => $pub[UsuariosExtCols::NOMBRE_VISIBLE],
                'avatarUrl' => UsuarioHelper::resolverAvatarUrl($pub[UsuariosExtCols::AVATAR_URL] ?? null, (int) ($pub[UsuariosExtCols::WP_USER_ID] ?? 0)),
                'verificado' => (bool) $pub[UsuariosExtCols::VERIFICADO],
            ];
        }

        return new \WP_REST_Response(['data' => $publicaciones, 'page' => $page], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesController::listar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $id = (int) $request->get_param('id');

        $pub = PublicacionesRepository::obtenerConAutor($id);

        if (!$pub) {
            return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
        }

        /*
         * Seguridad: no exponer publicaciones rechazadas a terceros.
         * Solo el autor puede ver sus propias publicaciones rechazadas.
         */
        $estado = $pub[PublicacionesCols::MODERACION_ESTADO] ?? null;
        if ($estado === PublicacionesEnums::MODERACION_RECHAZADO) {
            $usuarioActual = UsuarioHelper::obtenerIdPg();
            if (!$usuarioActual || $usuarioActual !== (int) $pub[PublicacionesCols::AUTOR_ID]) {
                return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
            }
        }

        $pub['autor'] = [
            'id' => (int) $pub[PublicacionesCols::AUTOR_ID],
            'username' => $pub[UsuariosExtCols::USERNAME],
            'nombreVisible' => $pub[UsuariosExtCols::NOMBRE_VISIBLE],
            'avatarUrl' => UsuarioHelper::resolverAvatarUrl(
                $pub[UsuariosExtCols::AVATAR_URL] ?? null,
                isset($pub[UsuariosExtCols::WP_USER_ID]) ? (int) $pub[UsuariosExtCols::WP_USER_ID] : null
            ),
            'verificado' => (bool) $pub[UsuariosExtCols::VERIFICADO],
        ];
        $pub['imagenes'] = NormalizadorSample::pgArrayToPhp($pub[PublicacionesCols::IMAGENES] ?? null);
        $pub['samplesAdjuntos'] = \array_map('intval', NormalizadorSample::pgArrayToPhp($pub[PublicacionesCols::SAMPLES_ADJUNTOS] ?? null));
        $pub['totalComentarios'] = (int) ($pub[PublicacionesCols::TOTAL_COMENTARIOS] ?? 0);
        $pub['totalLikes'] = (int) ($pub[PublicacionesCols::TOTAL_LIKES] ?? 0);

        return new \WP_REST_Response(['data' => $pub], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesController::obtener error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function listarComentarios(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $pubId = (int) $request->get_param('id');
        $page = \max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 20;

        $comentarios = ComentariosRepository::listarDePublicacion($pubId, $offset);

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
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesController::listarComentarios error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /* pgArrayAPhp eliminado — usar NormalizadorSample::pgArrayToPhp (DRY) */

    /**
     * Subir imagen para publicación.
     * Guarda en wp-content/uploads/kamples/publicaciones/{userId}/.
     * Devuelve la URL real del servidor.
     */
    public static function subirImagen(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $files = $request->get_file_params();
        if (empty($files['imagen'])) {
            return new \WP_REST_Response(['code' => 'sin_imagen', 'message' => 'No se recibió ninguna imagen'], 400);
        }

        $archivo = $files['imagen'];
        $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $finfo = \finfo_open(FILEINFO_MIME_TYPE);
        $tipoReal = \finfo_file($finfo, $archivo['tmp_name']);
        \finfo_close($finfo);

        if (!\in_array($tipoReal, $tiposPermitidos, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido', 'message' => 'Tipo de imagen no permitido'], 400);
        }

        /* Limite 5MB */
        if ($archivo['size'] > 5 * 1024 * 1024) {
            return new \WP_REST_Response(['code' => 'muy_grande', 'message' => 'La imagen excede 5MB'], 400);
        }

        $uploadDir = wp_upload_dir();
        $carpeta = $uploadDir['basedir'] . '/kamples/publicaciones/' . $userId;
        if (!\file_exists($carpeta)) {
            wp_mkdir_p($carpeta);
        }

        $ext = match ($tipoReal) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
            default      => 'jpg',
        };

        $nombreArchivo = 'pub_' . \bin2hex(\random_bytes(8)) . '.' . $ext;
        $rutaDestino = $carpeta . '/' . $nombreArchivo;

        if (!move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
            return new \WP_REST_Response(['code' => 'error_guardado', 'message' => 'Error al guardar la imagen'], 500);
        }

        $url = $uploadDir['baseurl'] . '/kamples/publicaciones/' . $userId . '/' . $nombreArchivo;

        return new \WP_REST_Response(['ok' => true, 'url' => $url], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesController::subirImagen error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
