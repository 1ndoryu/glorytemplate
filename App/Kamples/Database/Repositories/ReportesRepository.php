<?php

/**
 * ReportesRepository — Acceso a datos para tabla 'reportes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ReportesCols;
use App\Config\Schema\_generated\ReportesDTO;

class ReportesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ReportesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ReportesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ReportesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ReportesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Listar reportes pendientes con username del reportador.
     */
    public static function listarPendientes(int $limit = 10): array
    {
        $tr = ReportesCols::TABLA;
        $tu = \App\Config\Schema\_generated\UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT r." . ReportesCols::ID
            . ", r." . ReportesCols::TIPO
            . ", r." . ReportesCols::TARGET_ID
            . ", r." . ReportesCols::REPORTADOR_ID
            . ", r." . ReportesCols::RAZON
            . ", r." . ReportesCols::ESTADO
            . ", r." . ReportesCols::CREATED_AT
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::USERNAME . " as reportador_username"
            . " FROM {$tr} r JOIN {$tu} u ON r." . ReportesCols::REPORTADOR_ID . " = u." . \App\Config\Schema\_generated\UsuariosExtCols::ID
            . " WHERE r." . ReportesCols::ESTADO . " = 'pendiente'"
            . " ORDER BY r." . ReportesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /*
     * Verificar si un usuario ya reportó un target específico.
     */
    public static function yaReportado(string $tipo, int $targetId, int $userId): bool
    {
        $tabla = ReportesCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . ReportesCols::ID . " FROM {$tabla}"
            . " WHERE " . ReportesCols::TIPO . " = :tipo AND " . ReportesCols::TARGET_ID . " = :targetId"
            . " AND " . ReportesCols::REPORTADOR_ID . " = :userId",
            ['tipo' => $tipo, 'targetId' => $targetId, 'userId' => $userId]
        );

        return $row !== null;
    }

    /*
     * Crear nuevo reporte. Retorna el ID generado.
     */
    public static function crearReporte(string $tipo, int $targetId, int $userId, string $razon): int
    {
        $tabla = ReportesCols::TABLA;

        return static::insertar(
            "INSERT INTO {$tabla} (" . ReportesCols::TIPO . ", " . ReportesCols::TARGET_ID
            . ", " . ReportesCols::REPORTADOR_ID . ", " . ReportesCols::RAZON . ", " . ReportesCols::ESTADO . ")"
            . " VALUES (:tipo, :targetId, :userId, :razon, 'pendiente') RETURNING " . ReportesCols::ID,
            ['tipo' => $tipo, 'targetId' => $targetId, 'userId' => $userId, 'razon' => $razon]
        );
    }
}
