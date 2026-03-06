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
use App\Config\Schema\_generated\ReportesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;

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
     * OPT05: Soporta offset para paginacion.
     */
    public static function listarPendientes(int $limit = 10, int $offset = 0): array
    {
        $tr = ReportesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $estadoPendiente = ReportesEnums::ESTADO_PENDIENTE;

        return static::consultar(
            "SELECT r." . ReportesCols::ID
            . ", r." . ReportesCols::TIPO
            . ", r." . ReportesCols::TARGET_ID
            . ", r." . ReportesCols::REPORTADOR_ID
            . ", r." . ReportesCols::RAZON
            . ", r." . ReportesCols::ESTADO
            . ", r." . ReportesCols::CREATED_AT
            . ", u." . UsuariosExtCols::USERNAME . " as reportador_username"
            . " FROM {$tr} r JOIN {$tu} u ON r." . ReportesCols::REPORTADOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE r." . ReportesCols::ESTADO . " = :estado"
            . " ORDER BY r." . ReportesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['estado' => $estadoPendiente, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Contar total de reportes pendientes (para paginacion).
     */
    public static function contarPendientes(): int
    {
        $tabla = ReportesCols::TABLA;
        $estadoPendiente = ReportesEnums::ESTADO_PENDIENTE;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla} WHERE " . ReportesCols::ESTADO . " = :estado",
            ['estado' => $estadoPendiente]
        );

        return $row ? (int) $row['total'] : 0;
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
            . " VALUES (:tipo, :targetId, :userId, :razon, '" . ReportesEnums::ESTADO_PENDIENTE . "') RETURNING " . ReportesCols::ID,
            ['tipo' => $tipo, 'targetId' => $targetId, 'userId' => $userId, ReportesCols::RAZON => $razon]
        );
    }

    /*
     * Resolver un reporte: cambiar estado a 'resuelto' o 'descartado'.
     * Registra quién lo resolvió y cuándo.
     * Retorna true si el reporte existía y fue actualizado.
     */
    public static function resolverReporte(int $reporteId, string $estado, int $resueltoPor): bool
    {
        $tabla = ReportesCols::TABLA;

        $filasAfectadas = static::ejecutar(
            "UPDATE {$tabla} SET "
            . ReportesCols::ESTADO . " = :estado, "
            . ReportesCols::RESUELTO_POR . " = :resueltoPor, "
            . ReportesCols::RESUELTO_AT . " = NOW()"
            . " WHERE " . ReportesCols::ID . " = :id"
            . " AND " . ReportesCols::ESTADO . " = :estadoPendiente",
            [
                'estado' => $estado,
                'resueltoPor' => $resueltoPor,
                'id' => $reporteId,
                'estadoPendiente' => ReportesEnums::ESTADO_PENDIENTE,
            ]
        );

        return $filasAfectadas > 0;
    }
}
