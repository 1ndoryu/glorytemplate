<?php

/**
 * LikesRepository — Acceso a datos para tabla 'likes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\LikesDTO;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\ComentariosCols;

class LikesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return LikesCols::TABLA;
    }

    /* PK compuesta (usuario_id, tipo, target_id) — colId usa usuario_id como referencia */
    protected static function colId(): string
    {
        return LikesCols::USUARIO_ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = LikesCols::TABLA;
        $col = LikesCols::USUARIO_ID;

        return static::consultar(
            /* Tabla likes no tiene columna id — se ordena por created_at */
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . LikesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = LikesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . LikesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Eliminar todos los likes de tipo 'sample' para un sample dado.
     * Usado en cascada al eliminar un sample.
     */
    public static function eliminarPorSample(int $sampleId): void
    {
        $tabla = LikesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . LikesCols::TIPO . " = :tipo AND " . LikesCols::TARGET_ID . " = :id",
            ['tipo' => LikesEnums::TIPO_SAMPLE, 'id' => $sampleId]
        );
    }

    /*
     * UPSERT de reacción (like/dislike/encanta).
     * Un usuario solo puede tener UNA reacción por target.
     */
    public static function upsertReaccion(int $userId, string $tipo, int $targetId, string $reaccion): void
    {
        $tabla = LikesCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} (" . LikesCols::USUARIO_ID . ", " . LikesCols::TIPO . ", " . LikesCols::TARGET_ID . ", " . LikesCols::REACCION . ")
             VALUES (:usuario, :tipo, :target, :reaccion)
             ON CONFLICT (" . LikesCols::USUARIO_ID . ", " . LikesCols::TIPO . ", " . LikesCols::TARGET_ID . ") DO UPDATE SET " . LikesCols::REACCION . " = :reaccion2, " . LikesCols::CREATED_AT . " = NOW()",
            ['usuario' => $userId, 'tipo' => $tipo, 'target' => $targetId, 'reaccion' => $reaccion, 'reaccion2' => $reaccion]
        );
    }

    /*
     * Eliminar reacción de un usuario sobre un target.
     */
    public static function eliminarReaccion(int $userId, string $tipo, int $targetId): void
    {
        $tabla = LikesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . LikesCols::USUARIO_ID . " = :usuario AND " . LikesCols::TIPO . " = :tipo AND " . LikesCols::TARGET_ID . " = :target",
            ['usuario' => $userId, 'tipo' => $tipo, 'target' => $targetId]
        );
    }

    /*
     * Recalcular total_likes de un sample (solo like+encanta, NO dislike).
     */
    public static function recalcularTotalSample(int $sampleId): void
    {
        $tl = LikesCols::TABLA;
        $ts = SamplesCols::TABLA;

        static::ejecutar(
            "UPDATE {$ts} SET " . SamplesCols::TOTAL_LIKES . " = (
                SELECT COUNT(*) FROM {$tl} WHERE " . LikesCols::TIPO . " = :tipo AND " . LikesCols::TARGET_ID . " = :id AND " . LikesCols::REACCION . " IN (:r1, :r2)
            ) WHERE " . SamplesCols::ID . " = :id",
            ['tipo' => LikesEnums::TIPO_SAMPLE, 'id' => $sampleId, 'r1' => LikesEnums::REACCION_LIKE, 'r2' => LikesEnums::REACCION_ENCANTA]
        );
    }

    /*
     * Recalcular total_likes de una publicación (solo like+encanta, NO dislike).
     */
    public static function recalcularTotalPublicacion(int $pubId): void
    {
        $tl = LikesCols::TABLA;
        $tp = PublicacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tp} SET " . PublicacionesCols::TOTAL_LIKES . " = (
                SELECT COUNT(*) FROM {$tl} WHERE " . LikesCols::TIPO . " = :tipo AND " . LikesCols::TARGET_ID . " = :id AND " . LikesCols::REACCION . " IN (:r1, :r2)
            ) WHERE " . PublicacionesCols::ID . " = :id",
            ['tipo' => LikesEnums::TIPO_PUBLICACION, 'id' => $pubId, 'r1' => LikesEnums::REACCION_LIKE, 'r2' => LikesEnums::REACCION_ENCANTA]
        );
    }

    /*
     * Dar like a un comentario. ON CONFLICT DO NOTHING evita duplicados.
     */
    public static function darLikeComentario(int $userId, int $targetId): void
    {
        $tabla = LikesCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} (" . LikesCols::USUARIO_ID . ", " . LikesCols::TIPO . ", " . LikesCols::TARGET_ID . ")"
            . " VALUES (:userId, 'comentario', :targetId)"
            . " ON CONFLICT (" . LikesCols::USUARIO_ID . ", " . LikesCols::TIPO . ", " . LikesCols::TARGET_ID . ") DO NOTHING",
            ['userId' => $userId, 'targetId' => $targetId]
        );
    }

    /*
     * Quitar like de un comentario.
     */
    public static function quitarLikeComentario(int $userId, int $targetId): void
    {
        $tabla = LikesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . LikesCols::USUARIO_ID . " = :userId"
            . " AND " . LikesCols::TIPO . " = 'comentario' AND " . LikesCols::TARGET_ID . " = :targetId",
            ['userId' => $userId, 'targetId' => $targetId]
        );
    }

    /*
     * Contar likes de un comentario y actualizar total_likes en tabla comentarios.
     * Retorna el total calculado.
     */
    public static function recalcularTotalComentario(int $comentarioId): int
    {
        $tl = LikesCols::TABLA;
        $tc = ComentariosCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tl} WHERE " . LikesCols::TIPO . " = 'comentario' AND " . LikesCols::TARGET_ID . " = :id",
            ['id' => $comentarioId]
        );
        $total = (int) ($row['total'] ?? 0);

        static::ejecutar(
            "UPDATE {$tc} SET " . ComentariosCols::TOTAL_LIKES . " = :total WHERE " . ComentariosCols::ID . " = :id",
            ['total' => $total, 'id' => $comentarioId]
        );

        return $total;
    }

    /*
     * Obtener IDs de comentarios que un usuario ha dado like (batch).
     * Retorna array asociativo [target_id => true].
     */
    public static function likesDeUsuarioEnComentarios(int $userId, array $ids): array
    {
        if (empty($ids)) return [];

        $tabla = LikesCols::TABLA;
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $params = array_merge([$userId], $ids);

        $likes = static::consultar(
            "SELECT " . LikesCols::TARGET_ID . " FROM {$tabla}"
            . " WHERE " . LikesCols::USUARIO_ID . " = ? AND " . LikesCols::TIPO . " = 'comentario'"
            . " AND " . LikesCols::TARGET_ID . " IN ({$placeholders})",
            $params
        );

        $result = [];
        foreach ($likes as $like) {
            $result[(int) $like[LikesCols::TARGET_ID]] = true;
        }
        return $result;
    }

    /*
     * Eliminar todos los likes de tipo dado para un target (cascade).
     */
    public static function eliminarPorTarget(string $tipo, int $targetId): void
    {
        $tabla = LikesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . LikesCols::TIPO . " = :tipo AND " . LikesCols::TARGET_ID . " = :id",
            ['tipo' => $tipo, 'id' => $targetId]
        );
    }

    /*
     * Obtener tags/bpm/key de los favoritos de un usuario (para sugerencias).
     */
    public static function contextoFavoritos(int $userId): array
    {
        $tl = LikesCols::TABLA;
        $ts = \App\Config\Schema\_generated\SamplesCols::TABLA;

        return static::consultar(
            "SELECT s." . \App\Config\Schema\_generated\SamplesCols::TAGS
            . ", s." . \App\Config\Schema\_generated\SamplesCols::BPM
            . ", s." . \App\Config\Schema\_generated\SamplesCols::KEY
            . " FROM {$ts} s JOIN {$tl} l ON l." . LikesCols::TARGET_ID . " = s." . \App\Config\Schema\_generated\SamplesCols::ID
            . " AND l." . LikesCols::TIPO . " = 'sample'"
            . " WHERE l." . LikesCols::USUARIO_ID . " = :uid AND s." . \App\Config\Schema\_generated\SamplesCols::ESTADO . " = 'activo'",
            ['uid' => $userId]
        );
    }

    /*
     * IDs de samples con like de un usuario (para exclusión en sugerencias).
     */
    public static function idsFavoritos(int $userId): array
    {
        $tabla = LikesCols::TABLA;

        $rows = static::consultar(
            "SELECT " . LikesCols::TARGET_ID . " as sample_id FROM {$tabla} WHERE "
            . LikesCols::TIPO . " = 'sample' AND " . LikesCols::USUARIO_ID . " = :uid",
            ['uid' => $userId]
        );

        return array_map(fn($r) => (int) $r['sample_id'], $rows);
    }

    /*
     * Contar samples favoritos de un usuario (para paginación).
     */
    public static function contarFavoritosSamples(int $userId): int
    {
        $tl = LikesCols::TABLA;
        $ts = \App\Config\Schema\_generated\SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tl} l JOIN {$ts} s ON l." . LikesCols::TARGET_ID . " = s."
            . \App\Config\Schema\_generated\SamplesCols::ID
            . " WHERE l." . LikesCols::TIPO . " = 'sample' AND l." . LikesCols::USUARIO_ID . " = :uid"
            . " AND s." . \App\Config\Schema\_generated\SamplesCols::ESTADO . " = 'activo'",
            ['uid' => $userId]
        );
        return (int) ($row['total'] ?? 0);
    }
}
