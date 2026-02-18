<?php

/**
 * ComentariosRepository — Acceso a datos para tabla 'comentarios'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Config\Schema\_generated\ComentariosDTO;

class ComentariosRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ComentariosCols::TABLA;
    }

    protected static function colId(): string
    {
        return ComentariosCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = ComentariosCols::TABLA;
        $col = ComentariosCols::AUTOR_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY id DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ComentariosCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Actualizar estado de moderación de un comentario.
     * Retorna true si el comentario existía.
     */
    public static function actualizarEstadoModeracion(int $id, string $estado): bool
    {
        $tabla = ComentariosCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . ComentariosCols::MODERACION_ESTADO . " = :estado WHERE " . ComentariosCols::ID . " = :id",
            ['estado' => $estado, 'id' => $id]
        );

        return static::existe([ComentariosCols::ID => $id]);
    }

    /*
     * Listar comentarios de una publicación con datos del autor.
     */
    public static function listarDePublicacion(int $pubId, int $offset, int $limit = 20): array
    {
        $tc = ComentariosCols::TABLA;
        $tu = \App\Config\Schema\_generated\UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT c." . ComentariosCols::ID
            . ", c." . ComentariosCols::CONTENIDO
            . ", c." . ComentariosCols::CREATED_AT
            . ", c." . ComentariosCols::TOTAL_LIKES
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::ID . " as autor_id"
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::USERNAME
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::AVATAR_URL
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::WP_USER_ID
            . " FROM {$tc} c JOIN {$tu} u ON c." . ComentariosCols::AUTOR_ID
            . " = u." . \App\Config\Schema\_generated\UsuariosExtCols::ID
            . " WHERE c." . ComentariosCols::TIPO . " = 'publicacion'"
            . " AND c." . ComentariosCols::TARGET_ID . " = :pubId"
            . " ORDER BY c." . ComentariosCols::CREATED_AT . " ASC LIMIT :limit OFFSET :offset",
            ['pubId' => $pubId, 'limit' => $limit, 'offset' => $offset]
        );
    }
}
