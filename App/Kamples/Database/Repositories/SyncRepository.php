<?php

/**
 * SyncRepository — Queries optimizadas para sync desktop (Tauri).
 *
 * Consultas diseñadas para minimizar roundtrips: colecciones + samples en 2 queries.
 * No usa NormalizadorSample porque el desktop solo necesita datos mínimos para sync.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;

class SyncRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ColeccionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ColeccionesCols::ID;
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /**
     * Obtener colecciones del usuario con samples para sync.
     * Una sola query con array_agg para evitar N+1.
     * Retorna colecciones con campo 'samples_json' (JSON array de {id, titulo, formato, tamano}).
     */
    public static function coleccionesConSamples(int $userId): array
    {
        $tc = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;

        /*
         * CTE: primero obtener todos los samples de colecciones del usuario,
         * luego agregar como JSON array por colección.
         * Evita N+1: 1 query en vez de 1 por colección.
         */
        $sql = "
            WITH samples_por_coleccion AS (
                SELECT
                    cs." . ColeccionSamplesCols::COLECCION_ID . ",
                    json_agg(
                        json_build_object(
                            'id', s." . SamplesCols::ID . ",
                            'titulo', s." . SamplesCols::TITULO . ",
                            'formato', s." . SamplesCols::FORMATO . ",
                            'tamano', s." . SamplesCols::TAMANO . "
                        ) ORDER BY cs." . ColeccionSamplesCols::POSICION . " ASC,
                                   cs." . ColeccionSamplesCols::ADDED_AT . " DESC
                    ) as samples_json
                FROM {$tcs} cs
                JOIN {$ts} s ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID . "
                WHERE s." . SamplesCols::ESTADO . " = '{$estadoActivo}'
                GROUP BY cs." . ColeccionSamplesCols::COLECCION_ID . "
            )
            SELECT
                c." . ColeccionesCols::ID . ",
                c." . ColeccionesCols::NOMBRE . ",
                COALESCE(spc.samples_json, '[]'::json) as samples_json
            FROM {$tc} c
            LEFT JOIN samples_por_coleccion spc ON spc." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . "
            WHERE c." . ColeccionesCols::USUARIO_ID . " = :userId
            ORDER BY c." . ColeccionesCols::UPDATED_AT . " DESC
        ";

        return static::consultar($sql, ['userId' => $userId]);
    }

    /**
     * Obtener samples descargados por el usuario que NO están en ninguna colección.
     * Usa LEFT JOIN + IS NULL para detectar huérfanos.
     */
    public static function descargasSinColeccion(int $userId): array
    {
        $td = DescargasCols::TABLA;
        $ts = SamplesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $tc = ColeccionesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;

        /*
         * Subquery: IDs de samples que están en alguna colección del usuario.
         * Comparar contra descargas del usuario para encontrar huérfanos.
         */
        $sql = "
            SELECT
                s." . SamplesCols::ID . ",
                s." . SamplesCols::TITULO . ",
                s." . SamplesCols::FORMATO . ",
                s." . SamplesCols::TAMANO . "
            FROM {$td} d
            JOIN {$ts} s ON d." . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID . "
            WHERE d." . DescargasCols::USUARIO_ID . " = :userId
              AND s." . SamplesCols::ESTADO . " = '{$estadoActivo}'
              AND NOT EXISTS (
                  SELECT 1 FROM {$tcs} cs
                  JOIN {$tc} c ON cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . "
                  WHERE cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID . "
                    AND c." . ColeccionesCols::USUARIO_ID . " = :userId2
              )
            ORDER BY d." . DescargasCols::CREATED_AT . " DESC
        ";

        return static::consultar($sql, ['userId' => $userId, 'userId2' => $userId]);
    }
}
