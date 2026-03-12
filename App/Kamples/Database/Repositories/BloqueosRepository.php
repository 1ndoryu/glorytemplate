<?php

/*
 * BloqueosRepository — Acceso a datos para tabla 'bloqueos'.
 * Gestiona bloqueos user-to-user (QQ25).
 * Sigue el patron de FollowsRepository para consistencia.
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\BloqueoCols;
use App\Config\Schema\_generated\UsuariosExtCols;

class BloqueosRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return BloqueoCols::TABLA;
    }

    protected static function colId(): string
    {
        return BloqueoCols::ID;
    }

    /*
     * Bloquear a un usuario (ON CONFLICT DO NOTHING para idempotencia).
     */
    public static function bloquear(int $bloqueadorId, int $bloqueadoId, string $razon = ''): bool
    {
        $tabla = BloqueoCols::TABLA;

        return static::ejecutar(
            "INSERT INTO {$tabla} (" . BloqueoCols::BLOQUEADOR_ID . ", " . BloqueoCols::BLOQUEADO_ID . ", " . BloqueoCols::RAZON . ")"
            . " VALUES (:bloqueador, :bloqueado, :razon) ON CONFLICT DO NOTHING",
            ['bloqueador' => $bloqueadorId, 'bloqueado' => $bloqueadoId, 'razon' => $razon]
        );
    }

    /*
     * Desbloquear a un usuario.
     */
    public static function desbloquear(int $bloqueadorId, int $bloqueadoId): bool
    {
        $tabla = BloqueoCols::TABLA;

        return static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . BloqueoCols::BLOQUEADOR_ID . " = :bloqueador AND " . BloqueoCols::BLOQUEADO_ID . " = :bloqueado",
            ['bloqueador' => $bloqueadorId, 'bloqueado' => $bloqueadoId]
        );
    }

    /*
     * Verificar si un usuario bloqueo a otro.
     */
    public static function estaBloqueado(int $bloqueadorId, int $bloqueadoId): bool
    {
        $tabla = BloqueoCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . BloqueoCols::ID . " FROM {$tabla}"
            . " WHERE " . BloqueoCols::BLOQUEADOR_ID . " = :bloqueador AND " . BloqueoCols::BLOQUEADO_ID . " = :bloqueado",
            ['bloqueador' => $bloqueadorId, 'bloqueado' => $bloqueadoId]
        );
        return $row !== null;
    }

    /*
     * Verificar relacion de bloqueo bidireccional (cualquiera de los dos bloqueo al otro).
     * Devuelve true si A bloqueo a B o B bloqueo a A.
     */
    public static function existeBloqueoMutuo(int $usuarioA, int $usuarioB): bool
    {
        $tabla = BloqueoCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . BloqueoCols::ID . " FROM {$tabla}"
            . " WHERE (" . BloqueoCols::BLOQUEADOR_ID . " = :a AND " . BloqueoCols::BLOQUEADO_ID . " = :b)"
            . " OR (" . BloqueoCols::BLOQUEADOR_ID . " = :b2 AND " . BloqueoCols::BLOQUEADO_ID . " = :a2)",
            ['a' => $usuarioA, 'b' => $usuarioB, 'a2' => $usuarioA, 'b2' => $usuarioB]
        );
        return $row !== null;
    }

    /*
     * Obtener IDs de usuarios bloqueados por un usuario.
     */
    public static function idsBloqueados(int $bloqueadorId): array
    {
        $tabla = BloqueoCols::TABLA;

        $rows = static::consultar(
            "SELECT " . BloqueoCols::BLOQUEADO_ID . " AS id FROM {$tabla}"
            . " WHERE " . BloqueoCols::BLOQUEADOR_ID . " = :userId",
            ['userId' => $bloqueadorId]
        );
        return array_map(fn(array $r): int => (int) $r['id'], $rows);
    }

    /*
     * Obtener IDs de usuarios que bloquearon a un usuario.
     */
    public static function idsBloqueadores(int $bloqueadoId): array
    {
        $tabla = BloqueoCols::TABLA;

        $rows = static::consultar(
            "SELECT " . BloqueoCols::BLOQUEADOR_ID . " AS id FROM {$tabla}"
            . " WHERE " . BloqueoCols::BLOQUEADO_ID . " = :userId",
            ['userId' => $bloqueadoId]
        );
        return array_map(fn(array $r): int => (int) $r['id'], $rows);
    }

    /*
     * Todos los IDs con relacion de bloqueo (en cualquier direccion) para un usuario.
     * Usado para filtrar contenido: ni lo que yo bloquee ni lo que me bloquearon.
     */
    public static function idsBloqueoRelacionados(int $userId): array
    {
        $tabla = BloqueoCols::TABLA;

        $rows = static::consultar(
            "SELECT CASE WHEN " . BloqueoCols::BLOQUEADOR_ID . " = :userId THEN " . BloqueoCols::BLOQUEADO_ID
            . " ELSE " . BloqueoCols::BLOQUEADOR_ID . " END AS id FROM {$tabla}"
            . " WHERE " . BloqueoCols::BLOQUEADOR_ID . " = :userId2 OR " . BloqueoCols::BLOQUEADO_ID . " = :userId3",
            ['userId' => $userId, 'userId2' => $userId, 'userId3' => $userId]
        );
        return array_unique(array_map(fn(array $r): int => (int) $r['id'], $rows));
    }

    /*
     * Genera cláusula SQL para excluir contenido de usuarios bloqueados (bidireccional).
     * Retorna string con " AND {columna} NOT IN (subquery)" o vacío si no hay userId.
     * $columna DEBE venir de constantes *Cols (nunca de input externo).
     */
    public static function sqlExcluirBloqueados(string $columna, ?int $userId): string
    {
        if ($userId === null) return '';
        $userId = (int) $userId;
        $tabla = BloqueoCols::TABLA;
        $bloqueadorId = BloqueoCols::BLOQUEADOR_ID;
        $bloqueadoId = BloqueoCols::BLOQUEADO_ID;

        return " AND {$columna} NOT IN ("
            . "SELECT {$bloqueadoId} FROM {$tabla} WHERE {$bloqueadorId} = {$userId}"
            . " UNION SELECT {$bloqueadorId} FROM {$tabla} WHERE {$bloqueadoId} = {$userId}"
            . ")";
    }

    /*
     * Listar usuarios bloqueados con datos de perfil (para la UI de gestión).
     */
    public static function listarBloqueados(int $bloqueadorId, int $limit = 50, int $offset = 0): array
    {
        $tb = BloqueoCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT u." . UsuariosExtCols::ID . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE . ", u." . UsuariosExtCols::AVATAR_URL
            . ", b." . BloqueoCols::CREATED_AT . " AS bloqueado_at"
            . " FROM {$tb} b JOIN {$tu} u ON u." . UsuariosExtCols::ID . " = b." . BloqueoCols::BLOQUEADO_ID
            . " WHERE b." . BloqueoCols::BLOQUEADOR_ID . " = :userId"
            . " ORDER BY b." . BloqueoCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['userId' => $bloqueadorId, 'limit' => $limit, 'offset' => $offset]
        );
    }
}
