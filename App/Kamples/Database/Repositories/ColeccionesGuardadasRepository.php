<?php

/**
 * ColeccionesGuardadasRepository — Bookmarks de colecciones ajenas.
 * QL92: Los usuarios pueden guardar colecciones de otros para acceso rapido.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ColeccionesGuardadasCols;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\UsuariosExtCols;

class ColeccionesGuardadasRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ColeccionesGuardadasCols::TABLA;
    }

    protected static function colId(): string
    {
        return ColeccionesGuardadasCols::ID;
    }

    /**
     * Guardar (bookmark) una coleccion. Upsert para idempotencia.
     * Retorna true si se inserto, false si ya existia.
     */
    public static function guardar(int $usuarioId, int $coleccionId): bool
    {
        $t = ColeccionesGuardadasCols::TABLA;
        $cUsuario = ColeccionesGuardadasCols::USUARIO_ID;
        $cColeccion = ColeccionesGuardadasCols::COLECCION_ID;

        $afectadas = static::ejecutar(
            "INSERT INTO {$t} ({$cUsuario}, {$cColeccion})
             VALUES (:usuario_id, :coleccion_id)
             ON CONFLICT ({$cUsuario}, {$cColeccion}) DO NOTHING",
            ['usuario_id' => $usuarioId, 'coleccion_id' => $coleccionId]
        );

        return $afectadas > 0;
    }

    /**
     * Desguardar (quitar bookmark) una coleccion.
     */
    public static function desguardar(int $usuarioId, int $coleccionId): bool
    {
        $t = ColeccionesGuardadasCols::TABLA;
        $cUsuario = ColeccionesGuardadasCols::USUARIO_ID;
        $cColeccion = ColeccionesGuardadasCols::COLECCION_ID;

        $afectadas = static::ejecutar(
            "DELETE FROM {$t} WHERE {$cUsuario} = :usuario_id AND {$cColeccion} = :coleccion_id",
            ['usuario_id' => $usuarioId, 'coleccion_id' => $coleccionId]
        );

        return $afectadas > 0;
    }

    /**
     * Verificar si el usuario tiene guardada una coleccion.
     */
    public static function estaGuardada(int $usuarioId, int $coleccionId): bool
    {
        $t = ColeccionesGuardadasCols::TABLA;
        $cUsuario = ColeccionesGuardadasCols::USUARIO_ID;
        $cColeccion = ColeccionesGuardadasCols::COLECCION_ID;

        $existe = static::consultarValor(
            "SELECT 1 FROM {$t} WHERE {$cUsuario} = :usuario_id AND {$cColeccion} = :coleccion_id LIMIT 1",
            ['usuario_id' => $usuarioId, 'coleccion_id' => $coleccionId]
        );

        return $existe !== null;
    }

    /**
     * Listar colecciones guardadas del usuario con datos completos de la coleccion.
     * JOIN a colecciones + usuarios_ext para obtener nombre, imagen, creador.
     * Paginado para scroll infinito.
     */
    public static function listarDelUsuario(int $usuarioId, int $limite = 30, int $offset = 0): array
    {
        $tg = ColeccionesGuardadasCols::TABLA;
        $gUsuario = ColeccionesGuardadasCols::USUARIO_ID;
        $gColeccion = ColeccionesGuardadasCols::COLECCION_ID;
        $gCreatedAt = ColeccionesGuardadasCols::CREATED_AT;

        $tc = ColeccionesCols::TABLA;
        $cId = ColeccionesCols::ID;
        $cUsuarioId = ColeccionesCols::USUARIO_ID;

        $tu = UsuariosExtCols::TABLA;
        $uId = UsuariosExtCols::ID;
        $uUser = UsuariosExtCols::USERNAME;
        $uNombre = UsuariosExtCols::NOMBRE_VISIBLE;
        $uAvatar = UsuariosExtCols::AVATAR_URL;
        $uVerif = UsuariosExtCols::VERIFICADO;

        return static::consultar(
            "SELECT c.*, g.{$gCreatedAt} AS guardada_at,
                    u.{$uUser}, u.{$uNombre}, u.{$uAvatar}, u.{$uVerif}
             FROM {$tg} g
             JOIN {$tc} c ON g.{$gColeccion} = c.{$cId}
             LEFT JOIN {$tu} u ON c.{$cUsuarioId} = u.{$uId}
             WHERE g.{$gUsuario} = :usuario_id
             ORDER BY g.{$gCreatedAt} DESC
             LIMIT :limite OFFSET :offset",
            ['usuario_id' => $usuarioId, 'limite' => $limite, 'offset' => $offset]
        );
    }

    /**
     * Contar total de colecciones guardadas del usuario.
     */
    public static function contarDelUsuario(int $usuarioId): int
    {
        $t = ColeccionesGuardadasCols::TABLA;
        $cUsuario = ColeccionesGuardadasCols::USUARIO_ID;

        $total = static::consultarValor(
            "SELECT COUNT(*) FROM {$t} WHERE {$cUsuario} = :usuario_id",
            ['usuario_id' => $usuarioId]
        );

        return (int) ($total ?? 0);
    }
}
