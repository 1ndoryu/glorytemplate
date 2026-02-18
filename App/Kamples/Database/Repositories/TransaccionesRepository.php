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
            "SELECT * FROM {$tabla} WHERE {$col} = :creadorId ORDER BY id DESC LIMIT :limit OFFSET :offset",
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
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
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
}
