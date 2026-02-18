<?php

/**
 * PublicacionesEscrituraController — Operaciones de escritura del feed social.
 *
 * POST   /publicaciones                     — Crear publicación
 * PUT    /publicaciones/{id}                — Actualizar
 * DELETE /publicaciones/{id}                — Eliminar
 * POST   /publicaciones/{id}/comentarios    — Comentar
 * POST   /publicaciones/{id}/repost         — Repostear
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Api\ServicioImagenIA;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\KamplesLogger;
use App\Kamples\Services\ServicioNotificaciones;
use App\Config\Schema\_generated\PublicacionesCols;

class PublicacionesEscrituraController
{
    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
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
            $imgsMod = \is_array($urlsImagenes) ? $urlsImagenes : [];
            $adminFlag = $esAdmin;

            \add_action('shutdown', function () use ($pubId, $textoMod, $imgsMod, $adminFlag) {
                if (\function_exists('fastcgi_finish_request')) {
                    \fastcgi_finish_request();
                }

                /* C71: Posts de admin siempre se aprueban automáticamente */
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
                        $metadataLimpia = \array_filter($metadata, fn($m) => $m !== null);
                        if (!empty($metadataLimpia)) {
                            PostgresService::ejecutar(
                                "UPDATE publicaciones SET imagenes_metadata = :meta WHERE id = :id",
                                ['meta' => \json_encode($metadataLimpia), 'id' => $pubId]
                            );
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

        if ((int) $pub[PublicacionesCols::AUTOR_ID] !== $userId && !$esAdmin) {
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
            $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_PUBLICACION, 'La publicación');
            if ($errorLongitud) return Validador::respuestaError($errorLongitud);

            $campos[] = 'contenido = :contenido';
            $params['contenido'] = $contenido;
        }

        if (isset($body['imagenes'])) {
            $imagenesArr = \is_array($body['imagenes']) ? $body['imagenes'] : [];
            $errorImgs = Validador::validarImagenesUrls($imagenesArr);
            if ($errorImgs) return Validador::respuestaError($errorImgs);

            $imagenes = !empty($imagenesArr)
                ? '{' . \implode(',', \array_map(fn($v) => '"' . addslashes(\esc_url_raw($v)) . '"', $imagenesArr)) . '}'
                : '{}';
            $campos[] = 'imagenes = :imagenes';
            $params['imagenes'] = $imagenes;
        }

        /* Solo admin puede cambiar estado de moderación */
        if (isset($body['moderacionEstado']) && $esAdmin) {
            $estadosValidos = ['pendiente', 'aprobado', 'revision', 'rechazado'];
            if (\in_array($body['moderacionEstado'], $estadosValidos, true)) {
                $campos[] = 'moderacion_estado = :modEstado';
                $params['modEstado'] = $body['moderacionEstado'];
            }
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No se recibieron campos para actualizar'], 400);
        }

        PostgresService::ejecutar(
            "UPDATE publicaciones SET " . \implode(', ', $campos) . ", updated_at = NOW() WHERE id = :id",
            $params
        );

        KamplesLogger::info('Publicación actualizada', [
            'publicacionId' => $id,
            'por' => $esAdmin && (int) $pub[PublicacionesCols::AUTOR_ID] !== $userId ? 'admin' : 'autor',
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

        if ((int) $pub[PublicacionesCols::AUTOR_ID] !== $userId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos'], 403);
        }

        /* C266: Notificar al autor si un admin elimina su publicación */
        $autorId = (int) $pub[PublicacionesCols::AUTOR_ID];
        if ($esAdmin && $autorId !== $userId) {
            ServicioNotificaciones::publicacionEliminada($autorId, $id, 'Eliminada por un administrador');
        }

        PostgresService::ejecutar("DELETE FROM likes WHERE tipo = 'publicacion' AND target_id = :id", ['id' => $id]);
        PostgresService::ejecutar("DELETE FROM comentarios WHERE tipo = 'publicacion' AND target_id = :id", ['id' => $id]);
        PostgresService::ejecutar("DELETE FROM publicaciones WHERE id = :id", ['id' => $id]);

        KamplesLogger::info('Publicación eliminada', ['publicacionId' => $id]);

        return new \WP_REST_Response(['ok' => true, 'eliminado' => true], 200);
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

        $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_COMENTARIO, 'El comentario');
        if ($errorLongitud) return Validador::respuestaError($errorLongitud);

        $limitResp = RateLimiter::verificarUsuario($userId, 'comentar', 10, 60);
        if ($limitResp) return $limitResp;

        $id = PostgresService::insertar(
            "INSERT INTO comentarios (autor_id, tipo, target_id, contenido) VALUES (:autor, 'publicacion', :target, :contenido) RETURNING id",
            ['autor' => $userId, 'target' => $pubId, 'contenido' => $contenido]
        );

        PostgresService::ejecutar(
            "UPDATE publicaciones SET total_comentarios = (SELECT COUNT(*) FROM comentarios WHERE tipo = 'publicacion' AND target_id = :id) WHERE id = :id",
            ['id' => $pubId]
        );

        PlanificadorAlgoritmo::registrarInteraccion($userId, 'comentario');

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
    }

    public static function repostear(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $pubId = (int) $request->get_param('id');

        $id = PostgresService::insertar(
            "INSERT INTO publicaciones (autor_id, contenido, repost_id) VALUES (:autor, '', :repostId) RETURNING id",
            ['autor' => $userId, 'repostId' => $pubId]
        );

        return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
    }
}
