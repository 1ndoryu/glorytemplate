<?php

/**
 * ComentariosEscrituraController — Creación y eliminación de comentarios.
 *
 * Extraído de ComentariosController (A11 SOLID split).
 * La creación incluye validación, anti-spam, INSERT, notificaciones
 * y moderación IA asíncrona. El procesamiento multimedia se delega
 * a ComentariosInteraccionController::procesarMedia().
 *
 * Endpoints (registrados por ComentariosController como coordinador):
 *   POST   /comentarios/{tipo}/{targetId} — Crear comentario
 *   DELETE /comentarios/{id}              — Eliminar comentario
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Services\ServicioAntiSpam;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Services\ServicioNotificaciones;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\LogModeracion as KamplesLogger;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;

class ComentariosEscrituraController
{
    private const TIPOS_VALIDOS = ['sample', 'publicacion'];

    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $tipo = $request->get_param('tipo');
        $targetId = (int) $request->get_param('targetId');

        if (!\in_array($tipo, self::TIPOS_VALIDOS, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
        }

        /* S26 fix: verificar ban ANTES de cualquier otro procesamiento */
        $banResp = AuthMiddleware::verificarBanActivo($userId);
        if ($banResp) return $banResp;

        /* C130: Soporta JSON (texto) o FormData (multimedia) */
        $contentType = $request->get_content_type();
        $esFormData = $contentType && \str_contains($contentType['value'] ?? '', 'multipart');

        if ($esFormData) {
            $contenido = \sanitize_textarea_field($request->get_param('contenido') ?? '');
            $tipoContenido = \sanitize_text_field($request->get_param('tipoContenido') ?? 'texto');
            $parentId = $request->get_param('parentId') ? (int) $request->get_param('parentId') : null;
        } else {
            $body = $request->get_json_params();
            $contenido = \sanitize_textarea_field($body['contenido'] ?? '');
            $tipoContenido = 'texto';
            $parentId = isset($body['parentId']) ? (int) $body['parentId'] : null;
        }

        /* Validar tipo de contenido */
        $tiposContenidoPermitidos = ['texto', 'imagen', 'audio'];
        if (!\in_array($tipoContenido, $tiposContenidoPermitidos, true)) {
            $tipoContenido = 'texto';
        }

        /* C164: Rate limiting — 10 comentarios por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'comentar', 10, 60);
        if ($limitResp) return $limitResp;

        /* Validar contenido: requerido para texto, opcional para multimedia */
        if ($tipoContenido === 'texto' && empty($contenido)) {
            return new \WP_REST_Response(['code' => 'contenido_vacio', 'message' => 'El comentario necesita contenido'], 400);
        }

        /* C164: Limite de longitud */
        if (!empty($contenido)) {
            $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_COMENTARIO, 'El comentario');
            if ($errorLongitud) return Validador::respuestaError($errorLongitud);
        }

        /* C131: Anti-spam heurístico */
        if (!empty($contenido)) {
            $razonSpam = ServicioAntiSpam::evaluar($contenido, $userId);
            if ($razonSpam) {
                ServicioBan::registrarViolacion($userId, $razonSpam, 'comentario');
                return new \WP_REST_Response(['code' => 'contenido_spam', 'message' => 'El comentario fue rechazado por spam'], 403);
            }
        }

        $mediaUrl = null;
        $mediaMetadata = null;

        /* C130: Procesamiento de archivos multimedia — delegado a ComentariosInteraccionController */
        if ($tipoContenido === 'imagen' || $tipoContenido === 'audio') {
            $resultado = ComentariosInteraccionController::procesarMedia($request, $tipoContenido, $userId, $contenido);
            if ($resultado instanceof \WP_REST_Response) return $resultado;
            [$mediaUrl, $mediaMetadata, $contenido] = $resultado;
        }

        /* S27 fix: validar que el padre pertenece al mismo tipo+targetId */
        if ($parentId) {
            if (!ComentariosRepository::validarPadre($parentId, $tipo, $targetId)) {
                return new \WP_REST_Response(['code' => 'parent_invalido', 'message' => 'Comentario padre no encontrado en este contexto'], 400);
            }
        }

        $id = ComentariosRepository::insertarComentario([
            'autor' => $userId,
            'tipo' => $tipo,
            'target' => $targetId,
            'contenido' => $contenido,
            'tipoContenido' => $tipoContenido,
            'mediaUrl' => $mediaUrl,
            'mediaMetadata' => $mediaMetadata,
            'parentId' => $parentId,
        ]);

        /* C265: Si es respuesta, incrementar total_respuestas del padre */
        if ($parentId) {
            ComentariosRepository::incrementarRespuestas($parentId);
        }

        /* Actualizar contador en la tabla correspondiente */
        ComentariosRepository::recalcularTotalEnTarget($tipo, $targetId);

        PlanificadorAlgoritmo::registrarInteraccion($userId, 'comentario');

        /* C266: Notificaciones */
        self::notificarComentario($tipo, $targetId, $parentId, $userId);

        /* C131: Moderación IA asíncrona post-INSERT (fail-open) */
        $comentarioIdMod = $id;
        $textoMod = $contenido ?? '';
        $mediaUrlMod = $mediaUrl;
        $tipoContenidoMod = $tipoContenido;
        $autorIdMod = $userId;

        \register_shutdown_function(function () use ($comentarioIdMod, $autorIdMod, $textoMod, $mediaUrlMod, $tipoContenidoMod) {
            try {
                ServicioModeracionIA::moderarComentario(
                    $comentarioIdMod, $autorIdMod, $textoMod, $mediaUrlMod, $tipoContenidoMod
                );
            } catch (\Throwable $e) {
                KamplesLogger::warning('Moderación async de comentario falló', [
                    'comentarioId' => $comentarioIdMod,
                    'error' => $e->getMessage(),
                ], 'moderacion');
            }
        });

        /* Datos del autor para respuesta completa */
        $usuario = UsuariosExtRepository::buscarParticipante($userId);

        return new \WP_REST_Response([
            'ok' => true,
            'data' => [
                'id' => $id,
                'autorId' => $userId,
                'contenido' => $contenido ?? '',
                'tipoContenido' => $tipoContenido,
                'mediaUrl' => $mediaUrl,
                'mediaMetadata' => $mediaMetadata ? \json_decode($mediaMetadata, true) : null,
                'creadoAt' => \date('c'),
                'parentId' => $parentId,
                'totalLikes' => 0,
                'totalRespuestas' => 0,
                'liked' => false,
                'autor' => [
                    'id' => $userId,
                    'username' => $usuario[UsuariosExtCols::USERNAME] ?? '',
                    'nombreVisible' => $usuario[UsuariosExtCols::NOMBRE_VISIBLE] ?? $usuario[UsuariosExtCols::USERNAME] ?? '',
                    'avatarUrl' => UsuarioHelper::resolverAvatarUrl(
                        $usuario[UsuariosExtCols::AVATAR_URL] ?? null,
                        (int) ($usuario[UsuariosExtCols::WP_USER_ID] ?? 0)
                    ),
                ],
            ],
        ], 201);
    }

    /* C264: Eliminar comentario (autor o admin) */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');

        $comentario = ComentariosRepository::buscarParaEliminar($id);

        if (!$comentario) {
            return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
        }

        $esAutor = (int) $comentario[ComentariosCols::AUTOR_ID] === $userId;
        $esAdmin = \current_user_can('manage_options');

        if (!$esAutor && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
        }

        if ($comentario[ComentariosCols::PARENT_ID]) {
            ComentariosRepository::decrementarRespuestas((int) $comentario[ComentariosCols::PARENT_ID]);
        }

        ComentariosRepository::eliminarComentario($id);

        ComentariosRepository::recalcularTotalEnTarget(
            $comentario[ComentariosCols::TIPO],
            (int) $comentario[ComentariosCols::TARGET_ID]
        );

        return new \WP_REST_Response(['ok' => true], 200);
    }

    /**
     * Envía notificaciones según tipo de comentario (nuevo o respuesta).
     * Extraído de crear() para reducir complejidad ciclomática.
     */
    private static function notificarComentario(string $tipo, int $targetId, ?int $parentId, int $userId): void
    {
        if ($parentId) {
            $padreAutorId = ComentariosRepository::buscarAutorId($parentId);
            if ($padreAutorId && $padreAutorId !== $userId) {
                $sampleSlug = null;
                if ($tipo === 'sample') {
                    $sInfo = SamplesRepository::buscarInfoNotificacion($targetId);
                    $sampleSlug = $sInfo[SamplesCols::SLUG] ?? null;
                }
                ServicioNotificaciones::respuestaComentario(
                    $padreAutorId, $userId, $parentId,
                    $tipo === 'sample' ? $targetId : null, $sampleSlug
                );
            }
            return;
        }

        if ($tipo === 'sample') {
            $sampleInfo = SamplesRepository::buscarInfoNotificacion($targetId);
            if ($sampleInfo && (int) $sampleInfo[SamplesCols::CREADOR_ID] !== $userId) {
                ServicioNotificaciones::nuevoComentario(
                    (int) $sampleInfo[SamplesCols::CREADOR_ID], $userId, $targetId,
                    $sampleInfo[SamplesCols::TITULO] ?? '', $sampleInfo[SamplesCols::SLUG] ?? null
                );
            }
        } elseif ($tipo === 'publicacion') {
            $pubAutorId = PublicacionesRepository::buscarAutorId($targetId);
            if ($pubAutorId && $pubAutorId !== $userId) {
                ServicioNotificaciones::crear(
                    $pubAutorId, 'comentario',
                    'Alguien comento en tu publicacion',
                    ['commenter_id' => $userId, 'publicacion_id' => $targetId],
                    $userId, '', "/post/{$targetId}/"
                );
            }
        }
    }
}
