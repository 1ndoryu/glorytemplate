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
use App\Config\Schema\_generated\ComentariosEnums;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Services\ServicioAntiSpam;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Services\ServicioNotificaciones;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\LogModeracion as KamplesLogger;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Helpers\JsonHelper;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Services\NotificadorWebSocket;
use App\Kamples\KamplesLogger as LogGeneral;
use App\Kamples\Servicios\ServicioMedia;

class ComentariosEscrituraController
{
    private const TIPOS_VALIDOS = [ComentariosEnums::TIPO_SAMPLE, ComentariosEnums::TIPO_PUBLICACION, ComentariosEnums::TIPO_CANCION, ComentariosEnums::TIPO_RELACION];

    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $tipo = $request->get_param('tipo');
        $targetId = (int) $request->get_param('targetId');

        if (!\in_array($tipo, self::TIPOS_VALIDOS, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
        }

        /* QQ71: Verificar ban + suspensión ANTES de cualquier otro procesamiento */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) return $cuentaResp;

        /* C130: Soporta JSON (texto) o FormData (multimedia) */
        $contentType = $request->get_content_type();
        $esFormData = $contentType && \str_contains($contentType['value'] ?? '', 'multipart');

        if ($esFormData) {
            $contenido = \sanitize_textarea_field($request->get_param('contenido') ?? '');
            $tipoContenido = \sanitize_text_field($request->get_param('tipoContenido') ?? ComentariosEnums::TIPO_CONTENIDO_TEXTO);
            $parentId = $request->get_param('parentId') ? (int) $request->get_param('parentId') : null;
        } else {
            $body = $request->get_json_params();
            $contenido = \sanitize_textarea_field($body['contenido'] ?? '');
            $tipoContenido = ComentariosEnums::TIPO_CONTENIDO_TEXTO;
            $parentId = isset($body['parentId']) ? (int) $body['parentId'] : null;
        }

        /* Validar tipo de contenido */
        $tiposContenidoPermitidos = [
            ComentariosEnums::TIPO_CONTENIDO_TEXTO,
            ComentariosEnums::TIPO_CONTENIDO_IMAGEN,
            ComentariosEnums::TIPO_CONTENIDO_AUDIO,
        ];
        if (!\in_array($tipoContenido, $tiposContenidoPermitidos, true)) {
            $tipoContenido = ComentariosEnums::TIPO_CONTENIDO_TEXTO;
        }

        /* C164: Rate limiting — 10 comentarios por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'comentar', 10, 60);
        if ($limitResp) return $limitResp;

        /* Validar contenido: requerido para texto, opcional para multimedia */
        if ($tipoContenido === ComentariosEnums::TIPO_CONTENIDO_TEXTO && empty($contenido)) {
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
                ServicioNotificaciones::comentarioRechazado($userId, $razonSpam);
                return new \WP_REST_Response(['code' => 'contenido_spam', 'message' => 'El comentario fue rechazado por spam'], 403);
            }
        }

        $mediaUrl = null;
        $mediaMetadata = null;

        /* C130: Procesamiento de archivos multimedia — delegado a ComentariosInteraccionController */
        if ($tipoContenido === ComentariosEnums::TIPO_CONTENIDO_IMAGEN || $tipoContenido === ComentariosEnums::TIPO_CONTENIDO_AUDIO) {
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
                ]);
            }
        });

        /* Datos del autor para respuesta completa */
        $usuario = UsuariosExtRepository::buscarParticipante($userId);

        $comentarioData = [
            'id' => $id,
            'autorId' => $userId,
            'contenido' => $contenido ?? '',
            'tipoContenido' => $tipoContenido,
            'mediaUrl' => $mediaUrl,
            'mediaMetadata' => $mediaMetadata ? JsonHelper::decode($mediaMetadata) : null,
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
        ];

        /* [183A-100] Broadcast WebSocket para inserción en tiempo real.
         * Destinatarios: dueño del contenido + autor del padre (si es respuesta).
         * Excluye al autor del comentario (ya lo tiene localmente). */
        $destinatariosWs = self::obtenerDestinatariosWs($tipo, $targetId, $parentId, $userId);
        if (!empty($destinatariosWs)) {
            NotificadorWebSocket::notificar('comentario_nuevo', $destinatariosWs, [
                'tipo' => $tipo,
                'targetId' => $targetId,
                'comentario' => $comentarioData,
            ]);
        }

        return new \WP_REST_Response([
            'ok' => true,
            'data' => $comentarioData,
        ], 201);
        } catch (\Throwable $e) {
            LogGeneral::error('ComentariosEscrituraController::crear error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /* C264: Eliminar comentario (autor o admin) */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* QQ71: Verificar ban + suspensión */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) return $cuentaResp;

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

        /* QQ56: Limpiar archivo de media antes de eliminar registro */
        $mediaUrl = $comentario[ComentariosCols::MEDIA_URL] ?? null;
        if ($mediaUrl) {
            ServicioMedia::eliminarDesdeUrl($mediaUrl);
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
        } catch (\Throwable $e) {
            LogGeneral::error('ComentariosEscrituraController::eliminar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
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
                if ($tipo === ComentariosEnums::TIPO_SAMPLE) {
                    $sInfo = SamplesRepository::buscarInfoNotificacion($targetId);
                    $sampleSlug = $sInfo[SamplesCols::SLUG] ?? null;
                }
                ServicioNotificaciones::respuestaComentario(
                    $padreAutorId, $userId, $parentId,
                    $tipo === ComentariosEnums::TIPO_SAMPLE ? $targetId : null, $sampleSlug
                );
            }
            return;
        }

        if ($tipo === ComentariosEnums::TIPO_SAMPLE) {
            $sampleInfo = SamplesRepository::buscarInfoNotificacion($targetId);
            if ($sampleInfo && (int) $sampleInfo[SamplesCols::CREADOR_ID] !== $userId) {
                ServicioNotificaciones::nuevoComentario(
                    (int) $sampleInfo[SamplesCols::CREADOR_ID], $userId, $targetId,
                    $sampleInfo[SamplesCols::TITULO] ?? '', $sampleInfo[SamplesCols::SLUG] ?? null
                );
            }
        } elseif ($tipo === ComentariosEnums::TIPO_PUBLICACION) {
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

    /* [183A-100] Determina destinatarios del broadcast WebSocket en tiempo real.
     * Incluye: dueño del contenido + autor del comentario padre (si respuesta).
     * Excluye al autor del nuevo comentario (ya lo tiene localmente). */
    private static function obtenerDestinatariosWs(string $tipo, int $targetId, ?int $parentId, int $userId): array
    {
        $ids = [];

        if ($tipo === ComentariosEnums::TIPO_SAMPLE) {
            $sInfo = SamplesRepository::buscarInfoNotificacion($targetId);
            if ($sInfo) {
                $ids[] = (int) $sInfo[SamplesCols::CREADOR_ID];
            }
        } elseif ($tipo === ComentariosEnums::TIPO_PUBLICACION) {
            $pubAutorId = PublicacionesRepository::buscarAutorId($targetId);
            if ($pubAutorId) {
                $ids[] = $pubAutorId;
            }
        }

        if ($parentId) {
            $padreAutorId = ComentariosRepository::buscarAutorId($parentId);
            if ($padreAutorId) {
                $ids[] = $padreAutorId;
            }
        }

        return \array_values(\array_unique(\array_filter($ids, fn($id) => $id !== $userId)));
    }
}
