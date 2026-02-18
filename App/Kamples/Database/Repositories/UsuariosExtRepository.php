<?php

/**
 * UsuariosExtRepository — Acceso a datos para tabla 'usuarios_ext'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\UsuariosExtDTO;

class UsuariosExtRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return UsuariosExtCols::TABLA;
    }

    protected static function colId(): string
    {
        return UsuariosExtCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Actualizar campos arbitrarios de un usuario (admin).
     * Recibe array de cláusulas SET ya armadas y parámetros.
     */
    public static function actualizarCamposAdmin(int $id, array $clausulasSet, array $params): void
    {
        $tabla = UsuariosExtCols::TABLA;
        $set = implode(', ', $clausulasSet);
        $params['id'] = $id;

        static::ejecutar(
            "UPDATE {$tabla} SET {$set} WHERE " . UsuariosExtCols::ID . " = :id",
            $params
        );
    }

    /*
     * Incrementar contador de descargas del creador.
     */
    public static function incrementarDescargas(int $id): void
    {
        $tabla = UsuariosExtCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::TOTAL_DESCARGAS . " = " . UsuariosExtCols::TOTAL_DESCARGAS
            . " + 1 WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Obtener créditos bonus de un usuario.
     */
    public static function obtenerCreditosBonus(int $userId): int
    {
        $tabla = UsuariosExtCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . UsuariosExtCols::CREDITOS_BONUS . " FROM {$tabla} WHERE " . UsuariosExtCols::ID . " = :userId",
            ['userId' => $userId]
        );

        return (int) ($row[UsuariosExtCols::CREDITOS_BONUS] ?? 0);
    }

    /*
     * Adquirir advisory lock para operaciones TOCTOU.
     */
    public static function advisoryLock(int $userId): void
    {
        static::ejecutar("SELECT pg_advisory_xact_lock(:lockId)", ['lockId' => $userId]);
    }
}
