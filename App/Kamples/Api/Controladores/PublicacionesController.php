<?php

/**
 * PublicacionesController — Feed social (lectura + media). Escritura en PublicacionesEscrituraController.
 * Rutas: GET /publicaciones, GET /publicaciones/{id}, GET .../comentarios, POST .../imagenes.
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\BloqueosRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\NormalizadorPublicacion;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\FollowsCols;
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
            [
                'methods' => 'POST', 'callback' => [PublicacionesEscrituraController::class, 'repostear'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
            [
                'methods' => 'DELETE', 'callback' => [PublicacionesEscrituraController::class, 'quitarRepost'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            ],
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

    /* sentinel-disable-next-line php-service-retorna-asociativo — WP_REST_Response con data[] indexado */
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

        $currentUserId = UsuarioHelper::obtenerIdPg();
        if ($currentUserId) {
            $eAprobado = PublicacionesEnums::MODERACION_ESTADO_APROBADO;
            $eRevision = PublicacionesEnums::MODERACION_ESTADO_REVISION;
            $ePendiente = PublicacionesEnums::MODERACION_ESTADO_PENDIENTE;
            $donde .= " AND (p.{$pModEstado} IS NULL OR p.{$pModEstado} = '{$eAprobado}' OR ((p.{$pModEstado} = '{$eRevision}' OR p.{$pModEstado} = '{$ePendiente}') AND p.{$pAutorId} = :currentUser))";
            $params['currentUser'] = $currentUserId;

            /* QQ25: Excluir publicaciones de usuarios bloqueados (bidireccional) */
            $donde .= BloqueosRepository::sqlExcluirBloqueados("p.{$pAutorId}", $currentUserId);
        } else {
            $eAprobado = PublicacionesEnums::MODERACION_ESTADO_APROBADO;
            $donde .= " AND (p.{$pModEstado} IS NULL OR p.{$pModEstado} = '{$eAprobado}')";
        }

        if ($filtro === 'siguiendo') {
            if ($currentUserId) {
                $tf = FollowsCols::TABLA;
                $fSeguidoId = FollowsCols::SEGUIDO_ID;
                $fSeguidorId = FollowsCols::SEGUIDOR_ID;
                $donde .= " AND p.{$pAutorId} IN (SELECT {$fSeguidoId} FROM {$tf} WHERE {$fSeguidorId} = :userId)";
                $params['userId'] = $currentUserId;
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

        if ($currentUserId) {
            $params['current_user'] = $currentUserId;
        }

        /*
         * Feed 'todos' (default): scoring multi-señal con frescura + engagement velocity + boost social.
         * Feed 'populares'/'siguiendo'/con filtro de autor: ORDER BY simple (sin scoring).
         * algoritmoPesos['comunidad'] controla todos los parámetros.
         */
        if ($filtro === 'todos' && empty($autor)) {
            $config = require __DIR__ . '/../../Config/algoritmoPesos.php';
            $configComunidad = $config['comunidad'] ?? [];
            $publicaciones = PublicacionesRepository::listarFeedPuntuado(
                $donde,
                $params,
                $currentUserId,
                $configComunidad
            );
        } else {
            $publicaciones = PublicacionesRepository::listarFeed($donde, $orderBy, $params);
        }

        /* Recolectar todos los IDs de samples en una pasada (DRY via NormalizadorPublicacion) */
        $samplesIds = NormalizadorPublicacion::extraerSamplesIds($publicaciones);

        $samplesMap = [];
        if (!empty($samplesIds)) {
            $samplesData = SamplesRepository::buscarPorIds($samplesIds, $currentUserId);
            foreach ($samplesData as $s) {
                $samplesMap[$s['id']] = NormalizadorSample::normalizar($s);
            }
        }

        /* Enriquecer cada publicación con campos normalizados */
        foreach ($publicaciones as &$pub) {
            $pub = NormalizadorPublicacion::enriquecer($pub, $samplesMap);
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
        $currentUserId = UsuarioHelper::obtenerIdPg();

        $pub = PublicacionesRepository::obtenerConAutorCompleto($id, $currentUserId);

        if (!$pub) {
            return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
        }

        /*
         * Seguridad: no exponer publicaciones rechazadas a terceros.
         * Solo el autor puede ver sus propias publicaciones rechazadas.
         */
        $estado = $pub[PublicacionesCols::MODERACION_ESTADO] ?? null;
        if ($estado === PublicacionesEnums::MODERACION_ESTADO_RECHAZADO) {
            if (!$currentUserId || $currentUserId !== (int) $pub[PublicacionesCols::AUTOR_ID]) {
                return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
            }
        }

        /* Enriquecer usando NormalizadorPublicacion (DRY) */
        $samplesIds = NormalizadorPublicacion::extraerSamplesIds([$pub]);

        $samplesMap = [];
        if (!empty($samplesIds)) {
            $samplesData = SamplesRepository::buscarPorIds($samplesIds, $currentUserId);
            foreach ($samplesData as $s) {
                $samplesMap[$s['id']] = NormalizadorSample::normalizar($s);
            }
        }

        $pub = NormalizadorPublicacion::enriquecer($pub, $samplesMap);

        return new \WP_REST_Response(['data' => $pub], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesController::obtener error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /* sentinel-disable-next-line php-service-retorna-asociativo — WP_REST_Response con data[] indexado */
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

        /* QQ10: Rate limit subida de imágenes — 30 por hora */
        $limitResp = RateLimiter::verificarUsuario($userId, 'subir_imagen_pub', 30, 3600);
        if ($limitResp) return $limitResp;

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
