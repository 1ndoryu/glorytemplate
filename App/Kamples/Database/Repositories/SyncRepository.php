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
     * Estados visibles para sync desktop.
     * Incluye estados transitorios para evitar falsos "borrados" mientras
     * el pipeline async termina (procesando/en_supervision).
     */
    private static function sqlEstadosVisiblesSync(): string
    {
        $estados = [
            SamplesEnums::ESTADO_ACTIVO,
            SamplesEnums::ESTADO_PROCESANDO,
            SamplesEnums::ESTADO_EN_SUPERVISION,
        ];

        return "'" . \implode("','", \array_map('strval', $estados)) . "'";
    }

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
        $estadosVisibles = self::sqlEstadosVisiblesSync();

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
                WHERE s." . SamplesCols::ESTADO . " IN ({$estadosVisibles})
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
     * Obtener samples del usuario que NO están en ninguna colección.
     * Incluye:
     * 1) Samples descargados por el usuario.
     * 2) Samples propios subidos por el usuario.
     */
    public static function descargasSinColeccion(int $userId): array
    {
        $td = DescargasCols::TABLA;
        $ts = SamplesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $tc = ColeccionesCols::TABLA;
        $estadosVisibles = self::sqlEstadosVisiblesSync();

        $sql = "
            SELECT DISTINCT ON (s." . SamplesCols::ID . ")
                s." . SamplesCols::ID . ",
                s." . SamplesCols::TITULO . ",
                s." . SamplesCols::FORMATO . ",
                s." . SamplesCols::TAMANO . "
            FROM {$ts} s
            LEFT JOIN {$td} d
                   ON d." . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID . "
                  AND d." . DescargasCols::USUARIO_ID . " = :userId
            WHERE s." . SamplesCols::ESTADO . " IN ({$estadosVisibles})
              AND (
                    d." . DescargasCols::USUARIO_ID . " IS NOT NULL
                    OR s." . SamplesCols::CREADOR_ID . " = :userIdCreador
              )
              AND NOT EXISTS (
                  SELECT 1 FROM {$tcs} cs
                  JOIN {$tc} c ON cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . "
                  WHERE cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID . "
                    AND c." . ColeccionesCols::USUARIO_ID . " = :userIdColeccion
              )
            ORDER BY s." . SamplesCols::ID . ",
                     d." . DescargasCols::CREATED_AT . " DESC NULLS LAST,
                     s." . SamplesCols::UPDATED_AT . " DESC
        ";

        return static::consultar($sql, [
            'userId' => $userId,
            'userIdCreador' => $userId,
            'userIdColeccion' => $userId,
        ]);
    }
}
