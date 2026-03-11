<?php

/**
 * ScrapingLogRepository — Acceso a datos para tabla 'scraping_log'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ScrapingLogCols;
use App\Config\Schema\_generated\ScrapingLogEnums;
use App\Config\Schema\_generated\ScrapingLogDTO;

class ScrapingLogRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ScrapingLogCols::TABLA;
    }

    protected static function colId(): string
    {
        return ScrapingLogCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ScrapingLogCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ScrapingLogCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        /**
     * Verificar si una URL ya fue procesada.
     */
    public static function urlProcesada(string $url): bool
    {
        $fila = static::consultarUno(
            "SELECT " . ScrapingLogCols::ID . " FROM " . ScrapingLogCols::TABLA
            . " WHERE " . ScrapingLogCols::URL . " = :url AND "
            . ScrapingLogCols::ESTADO . " = :estado",
            ['url' => $url, 'estado' => ScrapingLogEnums::ESTADO_PROCESADO]
        );

        return $fila !== null;
    }

    /**
     * Registrar URL en el log (ignore si ya existe).
     */
    public static function registrarUrl(string $url, string $tipoPagina, string $estado = ScrapingLogEnums::ESTADO_PENDIENTE): ?int
    {
        $tabla = ScrapingLogCols::TABLA;

        return static::insertar(
            "INSERT INTO {$tabla} (" . ScrapingLogCols::URL . ", "
            . ScrapingLogCols::TIPO_PAGINA . ", " . ScrapingLogCols::ESTADO . ") "
            . "VALUES (:url, :tipo, :estado) "
            . "ON CONFLICT (" . ScrapingLogCols::URL . ") DO NOTHING "
            . "RETURNING " . ScrapingLogCols::ID,
            ['url' => $url, 'tipo' => $tipoPagina, 'estado' => $estado]
        );
    }

    /**
     * URLs pendientes de un tipo específico.
     */
    public static function pendientes(string $tipoPagina, int $limit = 50): array
    {
        $tabla = ScrapingLogCols::TABLA;
        $cols = implode(', ', ScrapingLogCols::TODAS);

        return static::consultar(
            "SELECT {$cols} FROM {$tabla} WHERE "
            . ScrapingLogCols::TIPO_PAGINA . " = :tipo AND "
            . ScrapingLogCols::ESTADO . " = :estado "
            . "ORDER BY " . ScrapingLogCols::CREATED_AT . " ASC LIMIT :limit",
            ['tipo' => $tipoPagina, 'estado' => ScrapingLogEnums::ESTADO_PENDIENTE, 'limit' => $limit]
        );
    }

    /**
     * Obtener la URL pendiente más antigua de la cola (cualquier tipo).
     * Retorna id, url y tipo_pagina, o null si no hay pendientes.
     */
    public static function pendienteUno(): ?array
    {
        $tabla = ScrapingLogCols::TABLA;

        return static::consultarUno(
            "SELECT " . ScrapingLogCols::ID . ", " . ScrapingLogCols::URL . ", " . ScrapingLogCols::TIPO_PAGINA
            . " FROM {$tabla}"
            . " WHERE " . ScrapingLogCols::ESTADO . " = :estado"
            . " ORDER BY " . ScrapingLogCols::CREATED_AT . " ASC LIMIT 1",
            ['estado' => ScrapingLogEnums::ESTADO_PENDIENTE]
        );
    }

    /**
     * Marcar URL como procesada con bytes consumidos.
     */
    public static function marcarProcesada(int $id, int $bytes = 0): bool
    {
        $tabla = ScrapingLogCols::TABLA;

        $afectadas = static::ejecutar(
            "UPDATE {$tabla} SET "
            . ScrapingLogCols::ESTADO . " = :estado, "
            . ScrapingLogCols::BYTES_DESCARGADOS . " = :bytes, "
            . ScrapingLogCols::PROCESADO_AT . " = NOW() "
            . "WHERE " . ScrapingLogCols::ID . " = :id",
            ['estado' => ScrapingLogEnums::ESTADO_PROCESADO, 'bytes' => $bytes, 'id' => $id]
        );

        return $afectadas > 0;
    }

    /**
     * Total de bytes consumidos (para control de presupuesto proxy).
     */
    public static function totalBytesConsumidos(): int
    {
        $valor = static::consultarValor(
            "SELECT COALESCE(SUM(" . ScrapingLogCols::BYTES_DESCARGADOS . "), 0) FROM " . ScrapingLogCols::TABLA
        );

        return (int) $valor;
    }

    /**
     * Estadísticas: total por estado.
     */
    public static function estadisticasPorEstado(): array
    {
        return static::consultar(
            "SELECT " . ScrapingLogCols::ESTADO . " AS estado, COUNT(*) AS total "
            . "FROM " . ScrapingLogCols::TABLA . " GROUP BY " . ScrapingLogCols::ESTADO
        );
    }

    /**
     * URLs que necesitan rescrape (proximo_rescrape ya pasó).
     * Retorna ordenadas por prioridad (más antiguas primero).
     */
    public static function pendientesRescrape(int $limit = 50): array
    {
        $tabla = ScrapingLogCols::TABLA;
        $cols = implode(', ', ScrapingLogCols::TODAS);

        return static::consultar(
            "SELECT {$cols} FROM {$tabla} WHERE "
            . ScrapingLogCols::RE_SCRAPEABLE . " = TRUE AND "
            . ScrapingLogCols::PROXIMO_RESCRAPE . " <= NOW() "
            . "ORDER BY " . ScrapingLogCols::PROXIMO_RESCRAPE . " ASC "
            . "LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /**
     * Marcar URL como rescrapeada: incrementar contador, programar próximo rescrape.
     * Intervalo base 180 días (6 meses). Crece con cada iteración: 180d, 360d, 540d...
     */
    public static function marcarRescrapeada(int $id): bool
    {
        $tabla = ScrapingLogCols::TABLA;

        $afectadas = static::ejecutar(
            "UPDATE {$tabla} SET "
            . ScrapingLogCols::VECES_RESCRAPEADO . " = " . ScrapingLogCols::VECES_RESCRAPEADO . " + 1, "
            . ScrapingLogCols::PROXIMO_RESCRAPE . " = NOW() + ((" . ScrapingLogCols::VECES_RESCRAPEADO . " + 1) * INTERVAL '180 days'), "
            . ScrapingLogCols::PROCESADO_AT . " = NOW() "
            . "WHERE " . ScrapingLogCols::ID . " = :id",
            ['id' => $id]
        );

        return $afectadas > 0;
    }

    /**
     * Marcar URL como re-scrapeable con próximo rescrape en N días.
     */
    public static function marcarReScrapeable(int $id, int $diasHastaRescrape = 180): bool
    {
        $tabla = ScrapingLogCols::TABLA;
        $intervalo = max(1, $diasHastaRescrape);

        $afectadas = static::ejecutar(
            "UPDATE {$tabla} SET "
            . ScrapingLogCols::RE_SCRAPEABLE . " = TRUE, "
            . ScrapingLogCols::PROXIMO_RESCRAPE . " = NOW() + (:dias * INTERVAL '1 day') "
            . "WHERE " . ScrapingLogCols::ID . " = :id",
            ['dias' => $intervalo, 'id' => $id]
        );

        return $afectadas > 0;
    }
}
