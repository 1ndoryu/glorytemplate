<?php

/**
 * PublicacionesInteraccionController — Interacciones sociales sobre publicaciones.
 *
 * POST   /publicaciones/{id}/comentarios    — Comentar
 * POST   /publicaciones/{id}/repost         — Repostear
 * DELETE /publicaciones/{id}/repost         — Quitar repost
 * POST   /publicaciones/{id}/reportar       — Reportar
 *
 * Extraído de PublicacionesEscrituraController (QQ71) para cumplir SRP y límite de 300 líneas.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Kamples\Services\ServicioAntiSpam;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Services\ServicioNotificaciones;

class PublicacionesInteraccionController
{
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

        /* QQ71: Verificar ban + suspensión en comentarios */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) return $cuentaResp;

        $razonSpam = ServicioAntiSpam::evaluar($contenido, $userId);
        if ($razonSpam) {
            ServicioBan::registrarViolacion($userId, $razonSpam, 'comentario');
            ServicioNotificaciones::comentarioRechazado($userId, $razonSpam);
            return new \WP_REST_Response(['code' => 'contenido_spam', 'message' => 'Contenido detectado como spam'], 403);
        }

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
            KamplesLogger::error('PublicacionesInteraccionController::crearComentario error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function repostear(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* QQ71: Verificar ban + suspensión */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) return $cuentaResp;

        /* QQ10: Rate limit reposts — 15 por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'repostear', 15, 60);
        if ($limitResp) return $limitResp;

        $pubId = (int) $request->get_param('id');

        /* [183A-98] crearRepost valida: no self-repost, no duplicado, no cadenas.
         * Retorna null si ya existía (idempotente via ON CONFLICT DO NOTHING). */
        $id = PublicacionesRepository::crearRepost($userId, $pubId);

        return new \WP_REST_Response(['ok' => true, 'id' => $id], $id ? 201 : 200);
        } catch (\RuntimeException $e) {
            /* [183A-98] Errores de validación (self-repost, no encontrado, cadena) */
            return new \WP_REST_Response(['code' => 'error_validacion', 'message' => $e->getMessage()], 403);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesInteraccionController::repostear error', ['error' => $e->getMessage()]);
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

            /* QQ71: Verificar ban + suspensión */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            $pubId = (int) $request->get_param('id');

            PublicacionesRepository::eliminarRepost($userId, $pubId);

            KamplesLogger::info('Repost eliminado', ['publicacionId' => $pubId, 'por' => $userId]);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('PublicacionesInteraccionController::quitarRepost error', ['error' => $e->getMessage()]);
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

            /* QQ71: Verificar ban + suspensión */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            /* QQ10: Rate limit reportes — 10 por hora */
            $limitResp = RateLimiter::verificarUsuario($userId, 'reportar_publicacion', 10, 3600);
            if ($limitResp) return $limitResp;

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
            KamplesLogger::error('PublicacionesInteraccionController::reportar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
