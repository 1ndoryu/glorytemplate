<?php

/**
 * ArticulosLikesRepository — Acceso a datos para tabla 'articulos_likes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ArticulosLikesCols;
use App\Config\Schema\_generated\ArticulosLikesDTO;

class ArticulosLikesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ArticulosLikesCols::TABLA;
    }

    protected static function colId(): string
    {
        /* PK compuesta: usuario_id + articulo_id. Los métodos base buscarPorId/eliminarPorId
         * no aplican a esta tabla. Se usa USUARIO_ID como fallback para ordenamiento. */
        return ArticulosLikesCols::USUARIO_ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = ArticulosLikesCols::TABLA;
        $col = ArticulosLikesCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . static::colId() . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ArticulosLikesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ArticulosLikesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /* [183A-109] Toggle like: inserta o elimina según exista. Retorna true si liked, false si unliked. */
    public static function toggleLike(int $usuarioId, int $articuloId): bool
    {
        $t = ArticulosLikesCols::TABLA;
        $existe = static::consultarValor(
            "SELECT COUNT(*) FROM {$t} WHERE " . ArticulosLikesCols::USUARIO_ID . " = :uid AND " . ArticulosLikesCols::ARTICULO_ID . " = :aid",
            ['uid' => $usuarioId, 'aid' => $articuloId]
        );

        if ((int)$existe > 0) {
            static::ejecutar(
                "DELETE FROM {$t} WHERE " . ArticulosLikesCols::USUARIO_ID . " = :uid AND " . ArticulosLikesCols::ARTICULO_ID . " = :aid",
                ['uid' => $usuarioId, 'aid' => $articuloId]
            );
            /* Actualizar contador en artículos */
            static::ejecutar(
                "UPDATE articulos SET total_likes = GREATEST(0, total_likes - 1) WHERE id = :aid",
                ['aid' => $articuloId]
            );
            return false;
        }

        static::ejecutar(
            "INSERT INTO {$t} (" . ArticulosLikesCols::USUARIO_ID . ", " . ArticulosLikesCols::ARTICULO_ID . ") VALUES (:uid, :aid) ON CONFLICT DO NOTHING",
            ['uid' => $usuarioId, 'aid' => $articuloId]
        );
        static::ejecutar(
            "UPDATE articulos SET total_likes = total_likes + 1 WHERE id = :aid",
            ['aid' => $articuloId]
        );
        return true;
    }

    /* Verificar si un usuario dio like a un artículo */
    public static function tienelike(int $usuarioId, int $articuloId): bool
    {
        $t = ArticulosLikesCols::TABLA;
        return (int) static::consultarValor(
            "SELECT COUNT(*) FROM {$t} WHERE " . ArticulosLikesCols::USUARIO_ID . " = :uid AND " . ArticulosLikesCols::ARTICULO_ID . " = :aid",
            ['uid' => $usuarioId, 'aid' => $articuloId]
        ) > 0;
    }
}
