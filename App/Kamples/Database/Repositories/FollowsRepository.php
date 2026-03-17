<?php

/**
 * FollowsRepository — Acceso a datos para tabla 'follows'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\FollowsCols;
use App\Config\Schema\_generated\FollowsDTO;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;

class FollowsRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return FollowsCols::TABLA;
    }

    /* PK compuesta (seguidor_id, seguido_id) */
    protected static function colId(): string
    {
        return FollowsCols::SEGUIDOR_ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = FollowsCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . FollowsCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        

            

    /*
     * Obtener IDs de usuarios que el usuario sigue.
     */
    public static function idsSeguidos(int $seguidorId): array
    {
        $tabla = FollowsCols::TABLA;

        return static::consultar(
            "SELECT " . FollowsCols::SEGUIDO_ID . " AS id FROM {$tabla} WHERE " . FollowsCols::SEGUIDOR_ID . " = :userId",
            ['userId' => $seguidorId]
        );
    }

    /*
     * Seguir a un usuario (ON CONFLICT DO NOTHING para idempotencia).
     */
    public static function seguir(int $seguidorId, int $seguidoId): void
    {
        $tabla = FollowsCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} (" . FollowsCols::SEGUIDOR_ID . ", " . FollowsCols::SEGUIDO_ID . ") VALUES (:seguidor, :seguido) ON CONFLICT DO NOTHING",
            ['seguidor' => $seguidorId, 'seguido' => $seguidoId]
        );
    }

    /*
     * Dejar de seguir a un usuario.
     */
    public static function dejarDeSeguir(int $seguidorId, int $seguidoId): void
    {
        $tabla = FollowsCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . FollowsCols::SEGUIDOR_ID . " = :seguidor AND " . FollowsCols::SEGUIDO_ID . " = :seguido",
            ['seguidor' => $seguidorId, 'seguido' => $seguidoId]
        );
    }

    /*
     * Recalcular contadores de seguidores/seguidos en usuarios_ext.
     */
    public static function actualizarContadores(int $seguidorId, int $seguidoId): void
    {
        $tf = FollowsCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        static::ejecutar(
            "UPDATE {$tu} SET " . UsuariosExtCols::TOTAL_SEGUIDORES . " = (SELECT COUNT(*) FROM {$tf} WHERE " . FollowsCols::SEGUIDO_ID . " = :id) WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $seguidoId]
        );
        static::ejecutar(
            "UPDATE {$tu} SET " . UsuariosExtCols::TOTAL_SEGUIDOS . " = (SELECT COUNT(*) FROM {$tf} WHERE " . FollowsCols::SEGUIDOR_ID . " = :id) WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $seguidorId]
        );
    }

    /*
     * Contar nuevos seguidores del mes actual para un usuario.
     */
    public static function seguidoresNuevosMes(int $userId): int
    {
        $tabla = FollowsCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla} WHERE " . FollowsCols::SEGUIDO_ID . " = :userId"
            . " AND " . FollowsCols::CREATED_AT . " >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );
        return (int) ($row['total'] ?? 0);
    }

    /*
     * Verificar si un usuario sigue a otro.
     */
    public static function estaSiguiendo(int $seguidorId, int $seguidoId): bool
    {
        $tabla = FollowsCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . FollowsCols::SEGUIDOR_ID . " FROM {$tabla}"
            . " WHERE " . FollowsCols::SEGUIDOR_ID . " = :seguidor AND " . FollowsCols::SEGUIDO_ID . " = :seguido",
            ['seguidor' => $seguidorId, 'seguido' => $seguidoId]
        );
        return $row !== null;
    }

    /*
     * QQ58: Verificar si dos usuarios se siguen mutuamente (1 query, 2 EXISTS).
     */
    public static function sonMutuos(int $userId1, int $userId2): bool
    {
        $tabla = FollowsCols::TABLA;
        $col1 = FollowsCols::SEGUIDOR_ID;
        $col2 = FollowsCols::SEGUIDO_ID;

        $row = static::consultarUno(
            "SELECT (EXISTS (SELECT 1 FROM {$tabla} WHERE {$col1} = :a AND {$col2} = :b)"
            . " AND EXISTS (SELECT 1 FROM {$tabla} WHERE {$col1} = :b2 AND {$col2} = :a2))::bool AS mutuo",
            ['a' => $userId1, 'b' => $userId2, 'b2' => $userId2, 'a2' => $userId1]
        );
        return (bool) ($row['mutuo'] ?? false);
    }

    /*
     * QQ32: Lista paginada de seguidores de un usuario.
     * JOIN con usuarios_ext para datos de perfil resumidos.
     */
    public static function listarSeguidores(int $seguidoId, int $limit = 20, int $offset = 0): array
    {
        $tf = FollowsCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT u." . UsuariosExtCols::ID
            . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " FROM {$tf} f"
            . " JOIN {$tu} u ON u." . UsuariosExtCols::ID . " = f." . FollowsCols::SEGUIDOR_ID
            . " WHERE f." . FollowsCols::SEGUIDO_ID . " = :seguidoId"
            . " AND u." . UsuariosExtCols::ES_SEED . " = false"
            . " AND u." . UsuariosExtCols::ESTADO . " = '" . UsuariosExtEnums::ESTADO_ACTIVO . "'"
            . " ORDER BY f." . FollowsCols::CREATED_AT . " DESC"
            . " LIMIT :lim OFFSET :off",
            ['seguidoId' => $seguidoId, 'lim' => $limit, 'off' => $offset]
        );
    }
}
