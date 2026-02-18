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

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Services\ServicioAntiSpam;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Services\ServicioNotificaciones;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\LogModeracion as KamplesLogger;

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
            $padreValido = PostgresService::consultarUno(
                "SELECT id FROM comentarios WHERE id = :id AND tipo = :tipo AND target_id = :targetId",
                ['id' => $parentId, 'tipo' => $tipo, 'targetId' => $targetId]
            );
            if (!$padreValido) {
                return new \WP_REST_Response(['code' => 'parent_invalido', 'message' => 'Comentario padre no encontrado en este contexto'], 400);
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

        $comentario = PostgresService::consultarUno(
            "SELECT id, autor_id, parent_id, tipo, target_id FROM comentarios WHERE id = :id",
            ['id' => $id]
        );

        if (!$comentario) {
            return new \WP_REST_Response(['code' => 'no_encontrado'], 404);
        }

        $esAutor = (int) $comentario['autor_id'] === $userId;
        $esAdmin = \current_user_can('manage_options');

        if (!$esAutor && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'no_autorizado'], 403);
        }

        if ($comentario['parent_id']) {
            PostgresService::ejecutar(
                "UPDATE comentarios SET total_respuestas = GREATEST(0, COALESCE(total_respuestas, 0) - 1) WHERE id = :parentId",
                ['parentId' => (int) $comentario['parent_id']]
            );
        }

        PostgresService::ejecutar("DELETE FROM comentarios WHERE id = :id", ['id' => $id]);

        $tabla = $comentario['tipo'] === 'publicacion' ? 'publicaciones' : 'samples';
        PostgresService::ejecutar(
            "UPDATE {$tabla} SET total_comentarios = (
                SELECT COUNT(*) FROM comentarios WHERE tipo = :tipo AND target_id = :targetId
            ) WHERE id = :targetId",
            ['tipo' => $comentario['tipo'], 'targetId' => (int) $comentario['target_id']]
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
            $padre = PostgresService::consultarUno("SELECT autor_id FROM comentarios WHERE id = :id", ['id' => $parentId]);
            if ($padre && (int) $padre['autor_id'] !== $userId) {
                $sampleSlug = null;
                if ($tipo === 'sample') {
                    $sInfo = PostgresService::consultarUno("SELECT slug FROM samples WHERE id = :id", ['id' => $targetId]);
                    $sampleSlug = $sInfo['slug'] ?? null;
                }
                ServicioNotificaciones::respuestaComentario(
                    (int) $padre['autor_id'], $userId, $parentId,
                    $tipo === 'sample' ? $targetId : null, $sampleSlug
                );
            }
            return;
        }

        if ($tipo === 'sample') {
            $sampleInfo = PostgresService::consultarUno(
                "SELECT creador_id, titulo, slug FROM samples WHERE id = :id",
                ['id' => $targetId]
            );
            if ($sampleInfo && (int) $sampleInfo['creador_id'] !== $userId) {
                ServicioNotificaciones::nuevoComentario(
                    (int) $sampleInfo['creador_id'], $userId, $targetId,
                    $sampleInfo['titulo'] ?? '', $sampleInfo['slug'] ?? null
                );
            }
        } elseif ($tipo === 'publicacion') {
            $pubInfo = PostgresService::consultarUno(
                "SELECT autor_id FROM publicaciones WHERE id = :id",
                ['id' => $targetId]
            );
            if ($pubInfo && (int) $pubInfo['autor_id'] !== $userId) {
                ServicioNotificaciones::crear(
                    (int) $pubInfo['autor_id'], 'comentario',
                    'Alguien comento en tu publicacion',
                    ['commenter_id' => $userId, 'publicacion_id' => $targetId],
                    $userId, '', "/post/{$targetId}/"
                );
            }
        }
    }
}
