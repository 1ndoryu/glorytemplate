<?php

/**
 * ComentariosController — Coordinador + lectura + edición + reportes de comentarios.
 *
 * A11 SOLID split: la creación, eliminación, likes y procesamiento multimedia
 * se delegaron a ComentariosEscrituraController y ComentariosInteraccionController.
 *
 * Endpoints propios:
 *   GET  /comentarios/{tipo}/{targetId}  — Listar comentarios raíz
 *   PUT  /comentarios/{id}              — Editar contenido (solo autor)
 *   POST /comentarios/{id}/reportar     — Reportar comentario
 *   GET  /comentarios/{id}/respuestas   — Respuestas hijas
 *
 * Delega a:
 *   ComentariosEscrituraController    — POST crear, DELETE eliminar
 *   ComentariosInteraccionController  — POST/DELETE likes
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\Validador;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\LikesCols;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Kamples\Database\Repositories\ReportesRepository;

class ComentariosController
{
    private const TIPOS_VALIDOS = ['sample', 'publicacion'];

    public static function registrarRutas(string $namespace): void
    {
        \register_rest_route($namespace, '/comentarios/(?P<tipo>sample|publicacion)/(?P<targetId>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'listar'],
            'permission_callback' => '__return_true',
            'args' => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
            ],
        ]);

        \register_rest_route($namespace, '/comentarios/(?P<tipo>sample|publicacion)/(?P<targetId>\d+)', [
            'methods' => 'POST',
            'callback' => [ComentariosEscrituraController::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C264: Editar comentario (solo autor) */
        \register_rest_route($namespace, '/comentarios/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [self::class, 'editar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C264: Eliminar comentario (autor o admin) */
        \register_rest_route($namespace, '/comentarios/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [ComentariosEscrituraController::class, 'eliminar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C264: Reportar comentario */
        \register_rest_route($namespace, '/comentarios/(?P<id>\d+)/reportar', [
            'methods' => 'POST',
            'callback' => [self::class, 'reportar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C265: Like/unlike comentario */
        \register_rest_route($namespace, '/comentarios/(?P<id>\d+)/like', [
            'methods' => 'POST',
            'callback' => [ComentariosInteraccionController::class, 'darLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
        \register_rest_route($namespace, '/comentarios/(?P<id>\d+)/like', [
            'methods' => 'DELETE',
            'callback' => [ComentariosInteraccionController::class, 'quitarLike'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C265: Respuestas a un comentario */
        \register_rest_route($namespace, '/comentarios/(?P<id>\d+)/respuestas', [
            'methods' => 'GET',
            'callback' => [self::class, 'listarRespuestas'],
            'permission_callback' => '__return_true',
        ]);
    }

    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        $tipo = $request->get_param('tipo');
        $targetId = (int) $request->get_param('targetId');
        $page = \max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 20;

        if (!\in_array($tipo, self::TIPOS_VALIDOS, true)) {
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
        $comentarios = ComentariosRepository::listarRaizConAutor($tipo, $targetId, $offset);

        $resultado = self::normalizarComentarios($comentarios, $currentUserId);

        return new \WP_REST_Response(['data' => $resultado, 'page' => $page], 200);
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
        $comentario = ComentariosRepository::buscarParaEdicion($id);

        if (!$comentario) {
            return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
        }

        if ((int) $comentario[ComentariosCols::AUTOR_ID] !== $userId) {
            return new \WP_REST_Response(['code' => 'no_autorizado', 'message' => 'Solo puedes editar tus comentarios'], 403);
        }

        ComentariosRepository::actualizarContenido($id, $contenido);

        return new \WP_REST_Response([
            'ok' => true,
            'data' => [
                'id' => $id,
                'contenido' => $contenido,
                'editadoAt' => \date('c'),
            ],
        ], 200);
    }

    /* C264: Eliminar comentario — delegado a ComentariosEscrituraController */

    /* C264: Reportar comentario */
    public static function reportar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $razon = \sanitize_textarea_field($body['razon'] ?? 'contenido inapropiado');
        /* S41 fix: limitar longitud de razón */
        $errorRazon = Validador::validarLongitud($razon, 500, 'La razón del reporte');
        if ($errorRazon) return Validador::respuestaError($errorRazon);

        /* Verificar que existe */
        if (!ComentariosRepository::existe([ComentariosCols::ID => $id])) {
            return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
        }

        /* Evitar reportes duplicados */
        if (ReportesRepository::yaReportado('comentario', $id, $userId)) {
            return new \WP_REST_Response(['ok' => true, 'message' => 'Ya reportaste este comentario'], 200);
        }

        ReportesRepository::crearReporte('comentario', $id, $userId, $razon);

        return new \WP_REST_Response(['ok' => true, 'message' => 'Reporte enviado'], 201);
    }

    /* C265: Likes delegados a ComentariosInteraccionController */

    /* C265: Listar respuestas de un comentario */
    public static function listarRespuestas(\WP_REST_Request $request): \WP_REST_Response
    {
        $parentId = (int) $request->get_param('id');
        $currentUserId = UsuarioHelper::obtenerIdPg();

        $respuestas = ComentariosRepository::listarRespuestasConAutor($parentId);

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
        $idsComentarios = \array_column($filas, ComentariosCols::ID);
        $likesUsuario = [];

        if ($currentUserId && !empty($idsComentarios)) {
            $likesUsuario = LikesRepository::likesDeUsuarioEnComentarios($currentUserId, $idsComentarios);
        }

        return \array_map(function ($fila) use ($likesUsuario) {
            $comentarioId = (int) $fila[ComentariosCols::ID];
            $meta = null;
            if (!empty($fila[ComentariosCols::MEDIA_METADATA])) {
                $meta = \is_string($fila[ComentariosCols::MEDIA_METADATA])
                    ? \json_decode($fila[ComentariosCols::MEDIA_METADATA], true)
                    : $fila[ComentariosCols::MEDIA_METADATA];
            }

            return [
                'id' => $comentarioId,
                'autorId' => (int) $fila[ComentariosCols::AUTOR_ID],
                'contenido' => $fila[ComentariosCols::CONTENIDO] ?? '',
                'creadoAt' => $fila[ComentariosCols::CREATED_AT] ?? '',
                'editadoAt' => $fila[ComentariosCols::UPDATED_AT] ?? null,
                'tipoContenido' => $fila[ComentariosCols::TIPO_CONTENIDO] ?? 'texto',
                'mediaUrl' => $fila[ComentariosCols::MEDIA_URL] ?? null,
                'mediaMetadata' => $meta,
                'parentId' => $fila[ComentariosCols::PARENT_ID] ? (int) $fila[ComentariosCols::PARENT_ID] : null,
                'totalLikes' => (int) ($fila[ComentariosCols::TOTAL_LIKES] ?? 0),
                'totalRespuestas' => (int) ($fila[ComentariosCols::TOTAL_RESPUESTAS] ?? 0),
                'liked' => isset($likesUsuario[$comentarioId]),
                'autor' => [
                    'id' => (int) $fila[ComentariosCols::AUTOR_ID],
                    'username' => $fila[UsuariosExtCols::USERNAME] ?? '',
                    'nombreVisible' => $fila[UsuariosExtCols::NOMBRE_VISIBLE] ?? '',
                    'avatarUrl' => UsuarioHelper::resolverAvatarUrl(
                        $fila[UsuariosExtCols::AVATAR_URL] ?? null,
                        (int) ($fila[UsuariosExtCols::WP_USER_ID] ?? 0)
                    ),
                ],
            ];
        }, $filas);
    }

}
