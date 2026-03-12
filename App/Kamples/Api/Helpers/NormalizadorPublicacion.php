<?php

/**
 * NormalizadorPublicacion — Transforma rows crudos de BD en respuestas API limpias.
 *
 * Extrae la lógica de enriquecimiento duplicada entre listar() y obtener() (DRY).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Helpers;

use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\ComentariosEnums;

class NormalizadorPublicacion
{
    /**
     * Extraer IDs de samples adjuntos de una o varias publicaciones.
     * Recolecta IDs del post principal + repost original de cada row.
     *
     * @param array<int,array> $publicaciones Rows crudos del feed.
     * @return int[] IDs únicos de samples referenciados.
     */
    public static function extraerSamplesIds(array $publicaciones): array
    {
        $ids = [];
        foreach ($publicaciones as $pub) {
            $adjuntos = \array_map('intval', NormalizadorSample::pgArrayToPhp($pub[PublicacionesCols::SAMPLES_ADJUNTOS] ?? null));
            foreach ($adjuntos as $id) {
                if ($id > 0) $ids[$id] = true;
            }
            $origAdjuntos = \array_map('intval', NormalizadorSample::pgArrayToPhp($pub['orig_samples_adjuntos'] ?? null));
            foreach ($origAdjuntos as $id) {
                if ($id > 0) $ids[$id] = true;
            }
        }
        return \array_keys($ids);
    }

    /**
     * Enriquecer una publicación cruda con campos calculados y normalizados.
     * Unifica la transformación que se hacía de forma duplicada en listar() y obtener().
     *
     * @param array $pub Row crudo con joins de autor, repost, etc.
     * @param array<int,array> $samplesMap Mapa id -> sample normalizado.
     * @return array Publicación lista para respuesta API.
     */
    public static function enriquecer(array $pub, array $samplesMap): array
    {
        /* Contadores y timestamps */
        $pub['totalComentarios'] = (int) ($pub[PublicacionesCols::TOTAL_COMENTARIOS] ?? 0);
        $pub['totalLikes'] = (int) ($pub[PublicacionesCols::TOTAL_LIKES] ?? 0);
        $pub['totalReposts'] = (int) ($pub[PublicacionesCols::TOTAL_REPOSTS] ?? 0);
        $pub['creadoAt'] = $pub[PublicacionesCols::CREATED_AT] ?? '';

        /* Reacción del usuario actual */
        $pub['liked'] = \in_array(
            $pub['reaccion_usuario'] ?? null,
            [LikesEnums::REACCION_LIKE, LikesEnums::REACCION_ENCANTA],
            true
        );
        $pub['reaccion'] = $pub['reaccion_usuario'] ?? null;
        unset($pub['reaccion_usuario']);

        /* Moderación e imágenes */
        $pub['moderacionEstado'] = $pub[PublicacionesCols::MODERACION_ESTADO] ?? null;
        $pub['imagenes'] = NormalizadorSample::pgArrayToPhp($pub[PublicacionesCols::IMAGENES] ?? null);

        /* Autor */
        $wpUserId = isset($pub[UsuariosExtCols::WP_USER_ID]) ? (int) $pub[UsuariosExtCols::WP_USER_ID] : 0;
        $pub['autor'] = [
            'id' => (int) $pub[PublicacionesCols::AUTOR_ID],
            'username' => $pub[UsuariosExtCols::USERNAME],
            'nombreVisible' => $pub[UsuariosExtCols::NOMBRE_VISIBLE],
            'avatarUrl' => UsuarioHelper::resolverAvatarUrl($pub[UsuariosExtCols::AVATAR_URL] ?? null, $wpUserId),
            'verificado' => (bool) $pub[UsuariosExtCols::VERIFICADO],
        ];

        /* Samples adjuntos */
        $adjuntosIds = \array_map('intval', NormalizadorSample::pgArrayToPhp($pub[PublicacionesCols::SAMPLES_ADJUNTOS] ?? null));
        $adjuntos = [];
        foreach ($adjuntosIds as $id) {
            if (isset($samplesMap[$id])) $adjuntos[] = $samplesMap[$id];
        }
        $pub['samplesAdjuntos'] = $adjuntos;

        /* Repost: datos del post original */
        $pub['repostOriginal'] = null;
        if (!empty($pub[PublicacionesCols::REPOST_ID])) {
            $origSamplesIds = \array_map('intval', NormalizadorSample::pgArrayToPhp($pub['orig_samples_adjuntos'] ?? null));
            $origSamples = [];
            foreach ($origSamplesIds as $sid) {
                if (isset($samplesMap[$sid])) $origSamples[] = $samplesMap[$sid];
            }
            $pub['repostOriginal'] = [
                'id'              => (int) ($pub['orig_id'] ?? 0),
                'contenido'       => $pub['orig_contenido'] ?? '',
                'imagenes'        => NormalizadorSample::pgArrayToPhp($pub['orig_imagenes'] ?? null),
                'samplesAdjuntos' => $origSamples,
                'autor'           => [
                    'id'            => (int) ($pub['orig_autor_id'] ?? 0),
                    'username'      => $pub['orig_username'] ?? '',
                    'nombreVisible' => $pub['orig_nombre_visible'] ?? '',
                    'avatarUrl'     => UsuarioHelper::resolverAvatarUrl(
                        $pub['orig_avatar_url'] ?? null,
                        (int) ($pub['orig_wp_user_id'] ?? 0)
                    ),
                    'verificado'    => (bool) ($pub['orig_verificado'] ?? false),
                ],
            ];
        }

        return $pub;
    }

    /**
     * QQ20: Normalizar un row crudo de comentario destacado para la respuesta API.
     * Formato minimal: id, contenido, totalLikes, creadoAt, tipoContenido, mediaUrl, autor.
     *
     * @param array $fila Row crudo con joins de usuario.
     * @return array Comentario normalizado para el frontend.
     */
    public static function normalizarComentarioDestacado(array $fila): array
    {
        return [
            'id'             => (int) $fila[ComentariosCols::ID],
            'autorId'        => (int) $fila[ComentariosCols::AUTOR_ID],
            'contenido'      => $fila[ComentariosCols::CONTENIDO] ?? '',
            'totalLikes'     => (int) ($fila[ComentariosCols::TOTAL_LIKES] ?? 0),
            'creadoAt'       => $fila[ComentariosCols::CREATED_AT] ?? '',
            'tipoContenido'  => $fila[ComentariosCols::TIPO_CONTENIDO] ?? ComentariosEnums::TIPO_CONTENIDO_TEXTO,
            'mediaUrl'       => $fila[ComentariosCols::MEDIA_URL] ?? null,
            'autor'          => [
                'id'             => (int) $fila[ComentariosCols::AUTOR_ID],
                'username'       => $fila[UsuariosExtCols::USERNAME] ?? '',
                'nombreVisible'  => $fila[UsuariosExtCols::NOMBRE_VISIBLE] ?? '',
                'avatarUrl'      => UsuarioHelper::resolverAvatarUrl(
                    $fila[UsuariosExtCols::AVATAR_URL] ?? null,
                    (int) ($fila[UsuariosExtCols::WP_USER_ID] ?? 0)
                ),
            ],
        ];
    }
}
