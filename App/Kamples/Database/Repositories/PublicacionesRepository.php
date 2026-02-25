<?php

/**
 * PublicacionesRepository — Acceso a datos para tabla 'publicaciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Config\Schema\_generated\PublicacionesDTO;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ComentariosCols;

class PublicacionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return PublicacionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return PublicacionesCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = PublicacionesCols::TABLA;
        $col = PublicacionesCols::AUTOR_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . PublicacionesCols::ID . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = PublicacionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . PublicacionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Listar publicaciones pendientes de moderación con datos del autor.
     */
    public static function listarPendientesModeracion(int $offset, int $limit = 20): array
    {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT p." . PublicacionesCols::ID
            . ", p." . PublicacionesCols::CONTENIDO
            . ", p." . PublicacionesCols::MODERACION_ESTADO
            . ", p." . PublicacionesCols::MODERACION_DETALLE
            . ", p." . PublicacionesCols::CREATED_AT
            . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::WP_USER_ID
            . ", 'publicacion' as tipo_contenido"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::MODERACION_ESTADO . " IN ('pendiente', 'revision')"
            . " ORDER BY p." . PublicacionesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Actualizar estado de moderación de una publicación.
     * Retorna true si la publicación existía.
     */
    public static function actualizarEstadoModeracion(int $id, string $estado): bool
    {
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::MODERACION_ESTADO . " = :estado WHERE " . PublicacionesCols::ID . " = :id",
            ['estado' => $estado, 'id' => $id]
        );

        return static::existe([PublicacionesCols::ID => $id]);
    }

    /*
     * Listar publicaciones moderadas recientemente (historial IA).
     * Incluye TODAS las publicaciones de los últimos N días con cualquier estado de moderación.
     * Permite a admins revisar decisiones de la IA.
     */
    public static function listarModeradasRecientes(int $dias = 2, int $limit = 50): array
    {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        $validosIntervalo = ['1 day', '2 days', '3 days', '7 days', '14 days', '30 days'];
        $intervalo = $dias . ($dias === 1 ? ' day' : ' days');
        if (!in_array($intervalo, $validosIntervalo, true)) {
            $intervalo = '2 days';
        }

        return static::consultar(
            "SELECT p." . PublicacionesCols::ID
            . ", p." . PublicacionesCols::CONTENIDO
            . ", p." . PublicacionesCols::MODERACION_ESTADO
            . ", p." . PublicacionesCols::MODERACION_DETALLE
            . ", p." . PublicacionesCols::CREATED_AT
            . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::WP_USER_ID
            . ", 'publicacion' as tipo_contenido"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::CREATED_AT . " >= NOW() - INTERVAL '{$intervalo}'"
            . " AND p." . PublicacionesCols::MODERACION_ESTADO . " IS NOT NULL"
            . " ORDER BY p." . PublicacionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /*
     * Feed de publicaciones con autor, moderación y likes.
     * Construye WHERE dinámico y subquery de reacción del usuario.
     */
    public static function listarFeed(
        string $donde,
        string $orderBy,
        array $params
    ): array {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        /* Subquery de reacción del usuario actual */
        $tl = LikesCols::TABLA;
        $likedSubquery = isset($params['current_user'])
            ? ", (SELECT l." . LikesCols::REACCION . " FROM {$tl} l WHERE l." . LikesCols::TIPO . " = '" . LikesEnums::TIPO_PUBLICACION . "' AND l." . LikesCols::TARGET_ID . " = p." . PublicacionesCols::ID . " AND l." . LikesCols::USUARIO_ID . " = :current_user LIMIT 1) AS reaccion_usuario"
            : ", NULL AS reaccion_usuario";

        /* JOIN con publicación original y su autor para reposts — expone datos del original en el feed */
        return static::consultar(
            "SELECT p.*, u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::VERIFICADO
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " {$likedSubquery}"
            . ", orig." . PublicacionesCols::ID . " AS orig_id"
            . ", orig." . PublicacionesCols::CONTENIDO . " AS orig_contenido"
            . ", orig." . PublicacionesCols::IMAGENES . " AS orig_imagenes"
            . ", orig." . PublicacionesCols::SAMPLES_ADJUNTOS . " AS orig_samples_adjuntos"
            . ", u_orig." . UsuariosExtCols::ID . " AS orig_autor_id"
            . ", u_orig." . UsuariosExtCols::USERNAME . " AS orig_username"
            . ", u_orig." . UsuariosExtCols::NOMBRE_VISIBLE . " AS orig_nombre_visible"
            . ", u_orig." . UsuariosExtCols::AVATAR_URL . " AS orig_avatar_url"
            . ", u_orig." . UsuariosExtCols::VERIFICADO . " AS orig_verificado"
            . ", u_orig." . UsuariosExtCols::WP_USER_ID . " AS orig_wp_user_id"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID
            . " = u." . UsuariosExtCols::ID
            . " LEFT JOIN {$tp} orig ON p." . PublicacionesCols::REPOST_ID . " = orig." . PublicacionesCols::ID
            . " LEFT JOIN {$tu} u_orig ON orig." . PublicacionesCols::AUTOR_ID . " = u_orig." . UsuariosExtCols::ID
            . " WHERE 1=1 {$donde} {$orderBy} LIMIT :limit OFFSET :offset",
            $params
        );
    }

    /*
     * Obtener publicación con datos del autor.
     */
    public static function obtenerConAutor(int $id): ?array
    {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT p.*, u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::VERIFICADO
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID
            . " = u." . UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Obtener publicación completa (autor + repost original + liked del usuario actual).
     * Misma estructura que listarFeed pero para 1 registro.
     */
    public static function obtenerConAutorCompleto(int $id, ?int $currentUserId = null): ?array
    {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $tl = LikesCols::TABLA;

        $params = ['id' => $id];

        $likedSubquery = $currentUserId
            ? ", (SELECT l." . LikesCols::REACCION . " FROM {$tl} l WHERE l." . LikesCols::TIPO . " = '" . LikesEnums::TIPO_PUBLICACION . "' AND l." . LikesCols::TARGET_ID . " = p." . PublicacionesCols::ID . " AND l." . LikesCols::USUARIO_ID . " = :current_user LIMIT 1) AS reaccion_usuario"
            : ", NULL AS reaccion_usuario";

        if ($currentUserId) {
            $params['current_user'] = $currentUserId;
        }

        return static::consultarUno(
            "SELECT p.*, u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::VERIFICADO
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " {$likedSubquery}"
            . ", orig." . PublicacionesCols::ID . " AS orig_id"
            . ", orig." . PublicacionesCols::CONTENIDO . " AS orig_contenido"
            . ", orig." . PublicacionesCols::IMAGENES . " AS orig_imagenes"
            . ", orig." . PublicacionesCols::SAMPLES_ADJUNTOS . " AS orig_samples_adjuntos"
            . ", u_orig." . UsuariosExtCols::ID . " AS orig_autor_id"
            . ", u_orig." . UsuariosExtCols::USERNAME . " AS orig_username"
            . ", u_orig." . UsuariosExtCols::NOMBRE_VISIBLE . " AS orig_nombre_visible"
            . ", u_orig." . UsuariosExtCols::AVATAR_URL . " AS orig_avatar_url"
            . ", u_orig." . UsuariosExtCols::VERIFICADO . " AS orig_verificado"
            . ", u_orig." . UsuariosExtCols::WP_USER_ID . " AS orig_wp_user_id"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID
            . " = u." . UsuariosExtCols::ID
            . " LEFT JOIN {$tp} orig ON p." . PublicacionesCols::REPOST_ID . " = orig." . PublicacionesCols::ID
            . " LEFT JOIN {$tu} u_orig ON orig." . PublicacionesCols::AUTOR_ID . " = u_orig." . UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::ID . " = :id",
            $params
        );
    }

    /*
     * Buscar solo el autor_id de una publicación.
     */
    public static function buscarAutorId(int $id): ?int
    {
        $tabla = PublicacionesCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . PublicacionesCols::AUTOR_ID . " FROM {$tabla} WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );

        return $row ? (int) $row[PublicacionesCols::AUTOR_ID] : null;
    }

    /*
     * Crear publicación nueva. Retorna ID generado.
     */
    public static function crearPublicacion(int $autorId, string $contenido, string $imagenes, string $samplesAdjuntos): int
    {
        $tabla = PublicacionesCols::TABLA;

        return static::insertar(
            "INSERT INTO {$tabla} (" . PublicacionesCols::AUTOR_ID . ", " . PublicacionesCols::CONTENIDO
            . ", " . PublicacionesCols::IMAGENES . ", " . PublicacionesCols::SAMPLES_ADJUNTOS
            . ") VALUES (:autor, :" . PublicacionesCols::CONTENIDO . ", :" . PublicacionesCols::IMAGENES . ", :samples) RETURNING " . PublicacionesCols::ID,
            ['autor' => $autorId, PublicacionesCols::CONTENIDO => $contenido, PublicacionesCols::IMAGENES => $imagenes, 'samples' => $samplesAdjuntos]
        );
    }

    /*
     * Buscar publicación para edición/eliminación (id, autor_id).
     */
    public static function buscarParaEdicion(int $id): ?array
    {
        $tabla = PublicacionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . PublicacionesCols::ID . ", " . PublicacionesCols::AUTOR_ID
            . " FROM {$tabla} WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Actualizar campos dinámicos de una publicación.
     */
    public static function actualizarCampos(int $id, array $clausulasSet, array $params): void
    {
        $tabla = PublicacionesCols::TABLA;
        $set = implode(', ', $clausulasSet);
        $params['id'] = $id;

        static::ejecutar(
            "UPDATE {$tabla} SET {$set} WHERE " . PublicacionesCols::ID . " = :id",
            $params
        );
    }

    /*
     * Forzar estado de moderación (para admin auto-approve).
     */
    public static function forzarModeracion(int $id, string $estado, string $razon = ''): void
    {
        $tabla = PublicacionesCols::TABLA;

        $params = ['id' => $id, 'estado' => $estado];
        $razonClause = '';
        if ($razon !== '') {
            $razonClause = ", " . PublicacionesCols::MODERACION_RAZON . " = :razon";
            $params['razon'] = $razon;
        }

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::MODERACION_ESTADO . " = :estado{$razonClause} WHERE " . PublicacionesCols::ID . " = :id",
            $params
        );
    }

    /*
     * Guardar metadata de imágenes analizadas por IA.
     */
    public static function guardarImagenesMetadata(int $id, string $metadataJson): void
    {
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::IMAGENES_METADATA . " = :meta WHERE " . PublicacionesCols::ID . " = :id",
            ['meta' => $metadataJson, 'id' => $id]
        );
    }

    /*
     * Eliminar publicación con cascada manual (likes, comentarios).
     */
    public static function eliminarConCascada(int $id): void
    {
        $tl = LikesCols::TABLA;
        $tc = ComentariosCols::TABLA;
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tl} WHERE " . LikesCols::TIPO . " = 'publicacion' AND "
            . LikesCols::TARGET_ID . " = :id",
            ['id' => $id]
        );
        static::ejecutar(
            "DELETE FROM {$tc} WHERE " . ComentariosCols::TIPO . " = 'publicacion' AND "
            . ComentariosCols::TARGET_ID . " = :id",
            ['id' => $id]
        );
        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Recalcular total_comentarios de una publicación.
     */
    public static function recalcularComentarios(int $id): void
    {
        $tabla = PublicacionesCols::TABLA;
        $tc = ComentariosCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::TOTAL_COMENTARIOS
            . " = (SELECT COUNT(*) FROM {$tc} WHERE " . ComentariosCols::TIPO
            . " = 'publicacion' AND " . ComentariosCols::TARGET_ID . " = :id)"
            . " WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Crear repost de una publicación.
     * Inserta una fila vacía con repost_id apuntando al original.
     * El feed hace JOIN para devolver el contenido del original.
     */
    public static function crearRepost(int $autorId, int $repostId): int
    {
        $tabla = PublicacionesCols::TABLA;

        $id = static::insertar(
            "INSERT INTO {$tabla} (" . PublicacionesCols::AUTOR_ID . ", " . PublicacionesCols::CONTENIDO
            . ", " . PublicacionesCols::REPOST_ID . ") VALUES (:autor, '', :repostId) RETURNING " . PublicacionesCols::ID,
            ['autor' => $autorId, 'repostId' => $repostId]
        );

        static::recalcularReposts($repostId);

        return $id;
    }

    /*
     * Eliminar repost de una publicación (quien reposteó lo quita).
     * Borra la fila "fantasma" con repost_id = $repostId y autor_id = $autorId.
     */
    public static function eliminarRepost(int $autorId, int $repostId): void
    {
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . PublicacionesCols::AUTOR_ID . " = :autor AND "
            . PublicacionesCols::REPOST_ID . " = :repostId",
            ['autor' => $autorId, 'repostId' => $repostId]
        );

        static::recalcularReposts($repostId);
    }

    /*
     * Recalcular total_reposts de una publicación contando filas hijas.
     */
    public static function recalcularReposts(int $id): void
    {
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::TOTAL_REPOSTS
            . " = (SELECT COUNT(*) FROM {$tabla} WHERE " . PublicacionesCols::REPOST_ID . " = :id)"
            . " WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Actualizar estado y detalle JSON del veredicto de moderación IA.
     * Usado por ServicioModeracionIA tras analizar publicación.
     */
    public static function actualizarVeredictoModeracion(int $id, string $estado, string $detalle): void
    {
        $tabla = PublicacionesCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET "
                . PublicacionesCols::MODERACION_ESTADO . " = :estado, "
                . PublicacionesCols::MODERACION_DETALLE . " = :detalle"
                . " WHERE " . PublicacionesCols::ID . " = :id",
            ['estado' => $estado, 'detalle' => $detalle, 'id' => $id]
        );
    }
}
