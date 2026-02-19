<?php

/**
 * TransaccionesRepository — Acceso a datos para tabla 'transacciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\TransaccionesCols;
use App\Config\Schema\_generated\TransaccionesEnums;
use App\Config\Schema\_generated\TransaccionesDTO;

class TransaccionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return TransaccionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return TransaccionesCols::ID;
    }

    /*
     * Buscar registros del creador dado.
     */
    public static function buscarPorCreador(int $creadorId, int $limit = 20, int $offset = 0): array
    {
        $tabla = TransaccionesCols::TABLA;
        $col = TransaccionesCols::CREADOR_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :creadorId ORDER BY " . TransaccionesCols::ID . " DESC LIMIT :limit OFFSET :offset",
            ['creadorId' => $creadorId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = TransaccionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . TransaccionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Registrar transacción de revenue share por descarga.
     */
    public static function registrarRevenueShare(
        int $compradorId,
        int $creadorId,
        int $sampleId,
        float $monto,
        float $pagoCreador,
        float $comisionPlataforma
    ): void {
        $tabla = TransaccionesCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} (" . TransaccionesCols::COMPRADOR_ID
            . ", " . TransaccionesCols::CREADOR_ID
            . ", " . TransaccionesCols::SAMPLE_ID
            . ", " . TransaccionesCols::TIPO
            . ", " . TransaccionesCols::MONTO
            . ", " . TransaccionesCols::PAGO_CREADOR
            . ", " . TransaccionesCols::COMISION_PLATAFORMA
            . ", " . TransaccionesCols::ESTADO
            . ") VALUES (:comprador, :creador, :sample, 'descarga', :monto, :pago, :comision, '"
            . TransaccionesEnums::ESTADO_COMPLETED . "')",
            [
                'comprador' => $compradorId,
                'creador'   => $creadorId,
                'sample'    => $sampleId,
                'monto'     => $monto,
                'pago'      => $pagoCreador,
                'comision'  => $comisionPlataforma,
            ]
        );
    }

    /*
     * Ingresos del creador en el mes actual.
     */
    public static function ingresosCreadorMes(int $creadorId): float
    {
        $tabla = TransaccionesCols::TABLA;
        $row = static::consultarUno(
            "SELECT COALESCE(SUM(" . TransaccionesCols::PAGO_CREADOR . "), 0) as total FROM {$tabla}"
            . " WHERE " . TransaccionesCols::CREADOR_ID . " = :userId AND " . TransaccionesCols::ESTADO . " = 'completed'"
            . " AND " . TransaccionesCols::CREATED_AT . " >= date_trunc('month', NOW())",
            ['userId' => $creadorId]
        );
        return (float) ($row['total'] ?? 0);
    }

    /*
     * Ingresos del creador en el mes anterior.
     */
    public static function ingresosCreadorMesAnterior(int $creadorId): float
    {
        $tabla = TransaccionesCols::TABLA;
        $row = static::consultarUno(
            "SELECT COALESCE(SUM(" . TransaccionesCols::PAGO_CREADOR . "), 0) as total FROM {$tabla}"
            . " WHERE " . TransaccionesCols::CREADOR_ID . " = :userId AND " . TransaccionesCols::ESTADO . " = 'completed'"
            . " AND " . TransaccionesCols::CREATED_AT . " >= date_trunc('month', NOW()) - INTERVAL '1 month'"
            . " AND " . TransaccionesCols::CREATED_AT . " < date_trunc('month', NOW())",
            ['userId' => $creadorId]
        );
        return (float) ($row['total'] ?? 0);
    }

    /*
     * Ingresos totales del creador.
     */
    public static function ingresosCreadorTotal(int $creadorId): float
    {
        $tabla = TransaccionesCols::TABLA;
        $row = static::consultarUno(
            "SELECT COALESCE(SUM(" . TransaccionesCols::PAGO_CREADOR . "), 0) as total FROM {$tabla}"
            . " WHERE " . TransaccionesCols::CREADOR_ID . " = :userId AND " . TransaccionesCols::ESTADO . " = 'completed'",
            ['userId' => $creadorId]
        );
        return (float) ($row['total'] ?? 0);
    }

    /*
     * Listar transacciones del creador con datos de sample y comprador.
     */
    public static function listarDelCreador(int $creadorId, int $limit = 20, int $offset = 0): array
    {
        $tt = TransaccionesCols::TABLA;
        $ts = \App\Config\Schema\_generated\SamplesCols::TABLA;
        $tu = \App\Config\Schema\_generated\UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT t." . TransaccionesCols::ID . ", t." . TransaccionesCols::CREATED_AT . " as fecha"
            . ", t." . TransaccionesCols::MONTO . ", t." . TransaccionesCols::COMISION_PLATAFORMA . " as comision"
            . ", t." . TransaccionesCols::PAGO_CREADOR . " as neto, t." . TransaccionesCols::ESTADO
            . ", s." . \App\Config\Schema\_generated\SamplesCols::TITULO . " as sample"
            . ", u." . \App\Config\Schema\_generated\UsuariosExtCols::USERNAME . " as comprador"
            . " FROM {$tt} t LEFT JOIN {$ts} s ON t." . TransaccionesCols::SAMPLE_ID . " = s." . \App\Config\Schema\_generated\SamplesCols::ID
            . " LEFT JOIN {$tu} u ON t." . TransaccionesCols::COMPRADOR_ID . " = u." . \App\Config\Schema\_generated\UsuariosExtCols::ID
            . " WHERE t." . TransaccionesCols::CREADOR_ID . " = :userId"
            . " ORDER BY t." . TransaccionesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['userId' => $creadorId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Ingresos agrupados por día para gráfico de dashboard.
     */
    public static function ingresosGrafico(int $creadorId, string $intervalo): array
    {
        $tabla = TransaccionesCols::TABLA;

        return static::consultar(
            "SELECT DATE(" . TransaccionesCols::CREATED_AT . ") as fecha"
            . ", COALESCE(SUM(" . TransaccionesCols::PAGO_CREADOR . "), 0) as monto"
            . " FROM {$tabla} WHERE " . TransaccionesCols::CREADOR_ID . " = :userId"
            . " AND " . TransaccionesCols::ESTADO . " = 'completed'"
            . " AND " . TransaccionesCols::CREATED_AT . " >= NOW() - INTERVAL '{$intervalo}'"
            . " GROUP BY DATE(" . TransaccionesCols::CREATED_AT . ") ORDER BY fecha ASC",
            ['userId' => $creadorId]
        );
    }
}
