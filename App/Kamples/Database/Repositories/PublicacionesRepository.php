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
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY id DESC LIMIT :limit OFFSET :offset",
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
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
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
        $tu = \App\Config\Schema\_generated\UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT p." . PublicacionesCols::ID
            . ", p." . PublicacionesCols::CONTENIDO
            . ", p." . PublicacionesCols::MODERACION_ESTADO
            . ", p." . PublicacionesCols::MODERACION_DETALLE
            . ", p." . PublicacionesCols::CREATED_AT
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::USERNAME
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::AVATAR_URL
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::WP_USER_ID
            . ", 'publicacion' as tipo_contenido"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID . " = u." . \App\Config\Schema\_generated\UsuariosExtCols::ID
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
     * Feed de publicaciones con autor, moderación y likes.
     * Construye WHERE dinámico y subquery de reacción del usuario.
     */
    public static function listarFeed(
        string $donde,
        string $orderBy,
        array $params
    ): array {
        $tp = PublicacionesCols::TABLA;
        $tu = \App\Config\Schema\_generated\UsuariosExtCols::TABLA;

        /* Subquery de reacción del usuario actual */
        $likedSubquery = isset($params['current_user'])
            ? ", (SELECT l.reaccion FROM likes l WHERE l.tipo = 'publicacion' AND l.target_id = p.id AND l.usuario_id = :current_user LIMIT 1) AS reaccion_usuario"
            : ", NULL AS reaccion_usuario";

        return static::consultar(
            "SELECT p.*, u." . \App\Config\Schema\_generated\UsuariosExtCols::USERNAME
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::AVATAR_URL
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::VERIFICADO
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::WP_USER_ID
            . " {$likedSubquery}"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID
            . " = u." . \App\Config\Schema\_generated\UsuariosExtCols::ID
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
        $tu = \App\Config\Schema\_generated\UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT p.*, u." . \App\Config\Schema\_generated\UsuariosExtCols::USERNAME
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::AVATAR_URL
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::VERIFICADO
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::WP_USER_ID
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID
            . " = u." . \App\Config\Schema\_generated\UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }
}
