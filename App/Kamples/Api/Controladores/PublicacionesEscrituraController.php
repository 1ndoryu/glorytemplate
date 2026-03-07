<?php

/**
 * PublicacionesEscrituraController — Operaciones de escritura del feed social.
 *
 * POST   /publicaciones                     — Crear publicación
 * PUT    /publicaciones/{id}                — Actualizar
 * DELETE /publicaciones/{id}                — Eliminar
 * POST   /publicaciones/{id}/comentarios    — Comentar
 * POST   /publicaciones/{id}/repost         — Repostear
 * DELETE /publicaciones/{id}/repost         — Quitar repost
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Api\ServicioImagenIA;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\KamplesLogger;
use App\Kamples\Services\ServicioNotificaciones;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\Repositories\ReportesRepository;

class PublicacionesEscrituraController
{
    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $body = $request->get_json_params();
        $contenido = sanitize_textarea_field($body['contenido'] ?? '');

        if (empty($contenido)) {
            return new \WP_REST_Response(['code' => 'contenido_vacio', 'message' => 'La publicación necesita contenido'], 400);
        }

        $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_PUBLICACION, 'La publicación');
        if ($errorLongitud) return Validador::respuestaError($errorLongitud);

        /* C164: Rate limiting — 5 publicaciones por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'publicar', 5, 60);
        if ($limitResp) return $limitResp;

        /* C164: Validar imagenes (limite y URLs) */
        $imagenesRaw = $body['imagenes'] ?? [];
        if (\is_array($imagenesRaw) && !empty($imagenesRaw)) {
            $errorImgs = Validador::validarImagenesUrls($imagenesRaw);
            if ($errorImgs) return Validador::respuestaError($errorImgs);
        }

        $imagenes = !empty($body['imagenes'])
            ? '{' . \implode(',', \array_map(fn($v) => '"' . addslashes(\esc_url_raw($v)) . '"', $body['imagenes'])) . '}'
            : '{}';
        $adjuntosRaw = $body['samples_adjuntos'] ?? $body['samplesAdjuntos'] ?? [];
        $samplesAdjuntos = !empty($adjuntosRaw)
            ? '{' . \implode(',', \array_map('intval', $adjuntosRaw)) . '}'
            : '{}';

        $id = PublicacionesRepository::crearPublicacion($userId, $contenido, $imagenes, $samplesAdjuntos);

        /* Análisis async de imágenes con IA + moderación (no bloquea la respuesta) */
        $urlsImagenes = $body['imagenes'] ?? [];
        $esAdmin = UsuarioHelper::esAdmin();

        if ($id) {
            $pubId = $id;
            $textoMod = $contenido;
            $imgsMod = \is_array($urlsImagenes) ? $urlsImagenes : [];
            $adminFlag = $esAdmin;

            \add_action('shutdown', function () use ($pubId, $textoMod, $imgsMod, $adminFlag) {
                if (\function_exists('fastcgi_finish_request')) {
                    \fastcgi_finish_request();
                }

                /* C71: Posts de admin siempre se aprueban automáticamente */
                try {
                    $resultado = ServicioModeracionIA::moderarPublicacion($pubId, $textoMod, $imgsMod);

                    if ($adminFlag && ($resultado['nivel'] ?? '') !== PublicacionesEnums::MODERACION_ESTADO_APROBADO) {
                        KamplesLogger::info('ModeracionIA: Post admin forzado a aprobado', [
                            'publicacionId' => $pubId,
                            'nivelOriginal' => $resultado['nivel'] ?? 'desconocido',
                        ], 'moderacion');
                        PublicacionesRepository::forzarModeracion($pubId, PublicacionesEnums::MODERACION_ESTADO_APROBADO, 'admin_auto');
                    }
                } catch (\Throwable $e) {
                    KamplesLogger::error('Error en moderación de publicación', [
                        'publicacionId' => $pubId,
                        'error' => $e->getMessage(),
                    ], 'moderacion');
                    if ($adminFlag) {
                        PublicacionesRepository::forzarModeracion($pubId, PublicacionesEnums::MODERACION_ESTADO_APROBADO);
                    }
                }

                /* Análisis de imágenes para metadata */
                if (!empty($imgsMod)) {
                    try {
                        $metadata = ServicioImagenIA::analizarMultiples($imgsMod);
                        $metadataLimpia = \array_filter($metadata, fn($m) => $m !== null);
                        if (!empty($metadataLimpia)) {
                            PublicacionesRepository::guardarImagenesMetadata($pubId, \json_encode($metadataLimpia));
                            KamplesLogger::info('Imágenes analizadas para publicación', [
                                'publicacionId' => $pubId,
                                'totalImagenes' => \count($imgsMod),
                                'analizadas' => \count($metadataLimpia),
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
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesEscrituraController::crear error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * PUT /publicaciones/{id} — Actualizar contenido de una publicación.
     * Solo el autor o admin pueden editar.
     */
    public static function actualizar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $esAdmin = UsuarioHelper::esAdmin();

        $pub = PublicacionesRepository::buscarParaEdicion($id);

        if (!$pub) {
            return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
        }

        if ((int) $pub[PublicacionesCols::AUTOR_ID] !== $userId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'No tienes permiso para editar esta publicación'], 403);
        }

        $body = $request->get_json_params();
        $campos = [];
        $params = [];

        if (isset($body['contenido'])) {
            $contenido = sanitize_textarea_field($body['contenido']);
            if (empty($contenido)) {
                return new \WP_REST_Response(['code' => 'contenido_vacio', 'message' => 'La publicación necesita contenido'], 400);
            }
            $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_PUBLICACION, 'La publicación');
            if ($errorLongitud) return Validador::respuestaError($errorLongitud);

            $campos[] = PublicacionesCols::CONTENIDO . ' = :' . PublicacionesCols::CONTENIDO;
            $params[PublicacionesCols::CONTENIDO] = $contenido;
        }

        if (isset($body['imagenes'])) {
            $imagenesArr = \is_array($body['imagenes']) ? $body['imagenes'] : [];
            $errorImgs = Validador::validarImagenesUrls($imagenesArr);
            if ($errorImgs) return Validador::respuestaError($errorImgs);

            $imagenes = !empty($imagenesArr)
                ? '{' . \implode(',', \array_map(fn($v) => '"' . addslashes(\esc_url_raw($v)) . '"', $imagenesArr)) . '}'
                : '{}';
            $campos[] = PublicacionesCols::IMAGENES . ' = :' . PublicacionesCols::IMAGENES;
            $params[PublicacionesCols::IMAGENES] = $imagenes;
        }

        if (isset($body['samples_adjuntos']) || isset($body['samplesAdjuntos'])) {
            $adjuntosRaw = $body['samples_adjuntos'] ?? $body['samplesAdjuntos'] ?? [];
            $samplesAdjuntos = !empty($adjuntosRaw)
                ? '{' . \implode(',', \array_map('intval', $adjuntosRaw)) . '}'
                : '{}';
            $campos[] = PublicacionesCols::SAMPLES_ADJUNTOS . ' = :' . PublicacionesCols::SAMPLES_ADJUNTOS;
            $params[PublicacionesCols::SAMPLES_ADJUNTOS] = $samplesAdjuntos;
        }

        /* Solo admin puede cambiar estado de moderación */
        if (isset($body['moderacionEstado']) && $esAdmin) {
            $estadosValidos = [
                PublicacionesEnums::MODERACION_ESTADO_PENDIENTE,
                PublicacionesEnums::MODERACION_ESTADO_APROBADO,
                PublicacionesEnums::MODERACION_ESTADO_REVISION,
                PublicacionesEnums::MODERACION_ESTADO_RECHAZADO,
            ];
            if (\in_array($body['moderacionEstado'], $estadosValidos, true)) {
                $campos[] = PublicacionesCols::MODERACION_ESTADO . ' = :modEstado';
                $params['modEstado'] = $body['moderacionEstado'];
            }
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No se recibieron campos para actualizar'], 400);
        }

        PublicacionesRepository::actualizarCampos($id, $campos, $params);

        KamplesLogger::info('Publicación actualizada', [
            'publicacionId' => $id,
            'por' => $esAdmin && (int) $pub[PublicacionesCols::AUTOR_ID] !== $userId ? 'admin' : 'autor',
        ]);

        return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesEscrituraController::actualizar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * DELETE /publicaciones/{id} — Eliminar publicación.
     * Solo el autor o admin pueden eliminar.
     */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');
        $esAdmin = UsuarioHelper::esAdmin();

        $pub = PublicacionesRepository::buscarParaEdicion($id);

        if (!$pub) {
            return new \WP_REST_Response(['code' => 'publicacion_no_encontrada'], 404);
        }

        if ((int) $pub[PublicacionesCols::AUTOR_ID] !== $userId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos'], 403);
        }

        /* C266: Notificar al autor si un admin elimina su publicación */
        $autorId = (int) $pub[PublicacionesCols::AUTOR_ID];
        if ($esAdmin && $autorId !== $userId) {
            ServicioNotificaciones::publicacionEliminada($autorId, $id, 'Eliminada por un administrador');
        }

        PublicacionesRepository::eliminarConCascada($id);

        KamplesLogger::info('Publicación eliminada', ['publicacionId' => $id]);

        return new \WP_REST_Response(['ok' => true, 'eliminado' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesEscrituraController::eliminar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function crearComentario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $pubId = (int) $request->get_param('id');
        $body = $request->get_json_params();
        $contenido = sanitize_textarea_field($body['contenido'] ?? '');

        if (empty($contenido)) {
            return new \WP_REST_Response(['code' => 'contenido_vacio'], 400);
        }

        $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_COMENTARIO, 'El comentario');
        if ($errorLongitud) return Validador::respuestaError($errorLongitud);

        $limitResp = RateLimiter::verificarUsuario($userId, 'comentar', 10, 60);
        if ($limitResp) return $limitResp;

        $id = ComentariosRepository::insertarComentario([
            'autor' => $userId,
            'tipo' => 'publicacion',
            'target' => $pubId,
            'contenido' => $contenido,
            'tipoContenido' => 'texto',
            'mediaUrl' => null,
            'mediaMetadata' => null,
            'parentId' => null,
        ]);

        PublicacionesRepository::recalcularComentarios($pubId);

        PlanificadorAlgoritmo::registrarInteraccion($userId, 'comentario');

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesEscrituraController::crearComentario error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function repostear(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $pubId = (int) $request->get_param('id');

        $id = PublicacionesRepository::crearRepost($userId, $pubId);

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesEscrituraController::repostear error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * DELETE /publicaciones/{id}/repost — Quitar repost.
     * Elimina la fila de repost creada por el usuario autenticado sobre la publicación dada.
     */
    public static function quitarRepost(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $pubId = (int) $request->get_param('id');

            PublicacionesRepository::eliminarRepost($userId, $pubId);

            KamplesLogger::info('Repost eliminado', ['publicacionId' => $pubId, 'por' => $userId]);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesEscrituraController::quitarRepost error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * POST /publicaciones/{id}/reportar — Reportar publicación.
     * Cualquier usuario autenticado puede reportar.
     */
    public static function reportar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $id = (int) $request->get_param('id');
            $body = $request->get_json_params();
            $razon = \sanitize_textarea_field($body['razon'] ?? 'contenido inapropiado');

            $errorRazon = Validador::validarLongitud($razon, 500, 'La razón del reporte');
            if ($errorRazon) return Validador::respuestaError($errorRazon);

            /* Verificar que la publicación existe */
            if (!PublicacionesRepository::existe([PublicacionesCols::ID => $id])) {
                return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
            }

            /* Evitar reportes duplicados */
            if (ReportesRepository::yaReportado('publicacion', $id, $userId)) {
                return new \WP_REST_Response(['ok' => true, 'message' => 'Ya reportaste esta publicación'], 200);
            }

            ReportesRepository::crearReporte('publicacion', $id, $userId, $razon);

            return new \WP_REST_Response(['ok' => true, 'message' => 'Reporte enviado'], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesEscrituraController::reportar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
