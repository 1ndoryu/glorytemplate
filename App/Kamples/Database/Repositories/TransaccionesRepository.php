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
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;

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
     * TO-DO: 'descarga' hardcodeado como tipo — no existe TIPO_DESCARGA en TransaccionesEnums.
     * Crear constante en schema y reemplazar aqui.
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
            . " WHERE " . TransaccionesCols::CREADOR_ID . " = :userId AND " . TransaccionesCols::ESTADO . " = :estado"
            . " AND " . TransaccionesCols::CREATED_AT . " >= date_trunc('month', NOW())",
            ['userId' => $creadorId, 'estado' => TransaccionesEnums::ESTADO_COMPLETED]
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
            . " WHERE " . TransaccionesCols::CREADOR_ID . " = :userId AND " . TransaccionesCols::ESTADO . " = :estado"
            . " AND " . TransaccionesCols::CREATED_AT . " >= date_trunc('month', NOW()) - INTERVAL '1 month'"
            . " AND " . TransaccionesCols::CREATED_AT . " < date_trunc('month', NOW())",
            ['userId' => $creadorId, 'estado' => TransaccionesEnums::ESTADO_COMPLETED]
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
            . " WHERE " . TransaccionesCols::CREADOR_ID . " = :userId AND " . TransaccionesCols::ESTADO . " = :estado",
            ['userId' => $creadorId, 'estado' => TransaccionesEnums::ESTADO_COMPLETED]
        );
        return (float) ($row['total'] ?? 0);
    }

    /**
     * Retorna ingresos del creador: mes actual, mes anterior y total, en una sola query.
     * Optimizacion OPT02: 3 roundtrips a 1 con SUM() FILTER().
     */
    public static function ingresosDashboard(int $userId): array
    {
        $tabla = TransaccionesCols::TABLA;
        $creadorId = TransaccionesCols::CREADOR_ID;
        $pagCreador = TransaccionesCols::PAGO_CREADOR;
        $estado = TransaccionesCols::ESTADO;
        $createdAt = TransaccionesCols::CREATED_AT;

        $sql = "
            SELECT
                COALESCE(SUM({$pagCreador}), 0) AS ingresos_total,
                COALESCE(SUM({$pagCreador}) FILTER (WHERE {$createdAt} >= date_trunc('month', NOW())), 0) AS ingresos_mes,
                COALESCE(SUM({$pagCreador}) FILTER (
                    WHERE {$createdAt} >= date_trunc('month', NOW()) - INTERVAL '1 month'
                      AND {$createdAt} < date_trunc('month', NOW())
                ), 0) AS ingresos_anterior
            FROM {$tabla}
            WHERE {$creadorId} = :userId AND {$estado} = :estado
        ";

        $row = static::consultarUno($sql, [
            'userId' => $userId,
            'estado' => TransaccionesEnums::ESTADO_COMPLETED,
        ]);

        return [
            'ingresosMes'      => (float) ($row['ingresos_mes'] ?? 0),
            'ingresosAnterior' => (float) ($row['ingresos_anterior'] ?? 0),
            'ingresosTotal'    => (float) ($row['ingresos_total'] ?? 0),
        ];
    }

    /*
     * Listar transacciones del creador con datos de sample y comprador.
     */
    public static function listarDelCreador(int $creadorId, int $limit = 20, int $offset = 0): array
    {
        $tt = TransaccionesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT t." . TransaccionesCols::ID . ", t." . TransaccionesCols::CREATED_AT . " as fecha"
            . ", t." . TransaccionesCols::MONTO . ", t." . TransaccionesCols::COMISION_PLATAFORMA . " as comision"
            . ", t." . TransaccionesCols::PAGO_CREADOR . " as neto, t." . TransaccionesCols::ESTADO
            . ", s." . SamplesCols::TITULO . " as sample"
            . ", u." . UsuariosExtCols::USERNAME . " as comprador"
            . " FROM {$tt} t LEFT JOIN {$ts} s ON t." . TransaccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . " LEFT JOIN {$tu} u ON t." . TransaccionesCols::COMPRADOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE t." . TransaccionesCols::CREADOR_ID . " = :userId"
            . " ORDER BY t." . TransaccionesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['userId' => $creadorId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Ingresos agrupados por día para gráfico de dashboard.
     */
    /*
     * Whitelist de intervalos válidos → número de días.
     * Previene SQL interpolation en INTERVAL.
     */
    private static function intervaloDias(string $intervalo): int
    {
        $mapa = [
            '7 days'   => 7,
            '30 days'  => 30,
            '90 days'  => 90,
            '365 days' => 365,
            '1 year'   => 365,
        ];
        return $mapa[$intervalo] ?? 30;
    }

    public static function ingresosGrafico(int $creadorId, string $intervalo): array
    {
        $tabla = TransaccionesCols::TABLA;

        return static::consultar(
            "SELECT DATE(" . TransaccionesCols::CREATED_AT . ") as fecha"
            . ", COALESCE(SUM(" . TransaccionesCols::PAGO_CREADOR . "), 0) as monto"
            . " FROM {$tabla} WHERE " . TransaccionesCols::CREADOR_ID . " = :userId"
            . " AND " . TransaccionesCols::ESTADO . " = :estado"
            . " AND " . TransaccionesCols::CREATED_AT . " >= NOW() - INTERVAL '1 day' * :dias"
            . " GROUP BY DATE(" . TransaccionesCols::CREATED_AT . ") ORDER BY fecha ASC",
            ['userId' => $creadorId, 'dias' => self::intervaloDias($intervalo), 'estado' => TransaccionesEnums::ESTADO_COMPLETED]
        );
    }
}
