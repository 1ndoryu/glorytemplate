<?php

/**
 * ColeccionSamplesRepository — Acceso a datos para tabla 'coleccion_samples'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\ColeccionSamplesDTO;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Kamples\Api\Helpers\NormalizadorSample;

class ColeccionSamplesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ColeccionSamplesCols::TABLA;
    }

    /* PK compuesta — colId no aplica directamente */
    protected static function colId(): string
    {
        return ColeccionSamplesCols::COLECCION_ID;
    }


    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Obtener samples de una colección con datos normalizados (JOIN samples + usuarios_ext).
     */
    public static function samplesDeColeccion(int $colId, ?int $userId = null): array
    {
        $t = ColeccionSamplesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " JOIN {$t} cs ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = :colId AND s." . SamplesCols::ESTADO . " = '{$estadoActivo}'"
             . " ORDER BY cs." . ColeccionSamplesCols::POSICION . " ASC, cs." . ColeccionSamplesCols::ADDED_AT . " DESC";

        return static::consultar($sql, ['colId' => $colId]);
    }

    /*
     * Obtener siguiente posición disponible en una colección.
     */
    public static function siguientePosicion(int $colId): int
    {
        $t = ColeccionSamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COALESCE(MAX(" . ColeccionSamplesCols::POSICION . "), 0) + 1 as next FROM {$t} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :colId",
            ['colId' => $colId]
        );

        return $row ? (int) $row['next'] : 1;
    }

    /*
     * Agregar sample a colección (ON CONFLICT DO NOTHING para idempotencia).
     */
    public static function agregar(int $colId, int $sampleId, int $posicion): void
    {
        $t = ColeccionSamplesCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$t} (" . ColeccionSamplesCols::COLECCION_ID . ", " . ColeccionSamplesCols::SAMPLE_ID . ", " . ColeccionSamplesCols::POSICION . ")
             VALUES (:colId, :sampleId, :pos) ON CONFLICT DO NOTHING",
            ['colId' => $colId, 'sampleId' => $sampleId, 'pos' => $posicion]
        );
    }

    /*
     * Quitar sample de una colección.
     */
    public static function quitar(int $colId, int $sampleId): void
    {
        $t = ColeccionSamplesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$t} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :colId AND " . ColeccionSamplesCols::SAMPLE_ID . " = :sampleId",
            ['colId' => $colId, 'sampleId' => $sampleId]
        );
    }

    /*
     * Verificar si un sample ya está en una colección.
     */
    public static function contiene(int $colId, int $sampleId): bool
    {
        $t = ColeccionSamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT 1 FROM {$t} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :colId AND " . ColeccionSamplesCols::SAMPLE_ID . " = :sampleId",
            ['colId' => $colId, 'sampleId' => $sampleId]
        );

        return $row !== null;
    }

    /*
     * Obtener IDs de samples en una colección.
     */
    public static function idsDeColeccion(int $colId): array
    {
        $t = ColeccionSamplesCols::TABLA;

        return static::consultar(
            "SELECT " . ColeccionSamplesCols::SAMPLE_ID . " FROM {$t} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :colId",
            ['colId' => $colId]
        );
    }

    /*
     * Obtener contexto de tags/BPM/key de los samples de una colección (para sugerencias).
     */
    public static function contextoParaSugerencias(int $colId): array
    {
        $t = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;

        return static::consultar(
            "SELECT s." . SamplesCols::TAGS . ", s." . SamplesCols::BPM . ", s." . SamplesCols::KEY . ", s." . SamplesCols::TIPO . "
             FROM {$ts} s
             JOIN {$t} cs ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID . "
             WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = :colId AND s." . SamplesCols::ESTADO . " = '{$estadoActivo}'",
            ['colId' => $colId]
        );
    }

    /*
     * Eliminar todas las relaciones de un sample en colecciones.
     * Usado en cascada al eliminar un sample.
     */
    public static function eliminarPorSample(int $sampleId): void
    {
        $t = ColeccionSamplesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$t} WHERE " . ColeccionSamplesCols::SAMPLE_ID . " = :id",
            ['id' => $sampleId]
        );
    }
}
