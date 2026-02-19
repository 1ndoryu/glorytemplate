<?php

/**
 * ReproduccionesRepository — Acceso a datos para tabla 'reproducciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\ReproduccionesDTO;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;

class ReproduccionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ReproduccionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ReproduccionesCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = ReproduccionesCols::TABLA;
        $col = ReproduccionesCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . ReproduccionesCols::ID . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ReproduccionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ReproduccionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Eliminar todas las reproducciones de un sample.
     * Usado en cascada al eliminar un sample.
     */
    public static function eliminarPorSample(int $sampleId): void
    {
        $tabla = ReproduccionesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . ReproduccionesCols::SAMPLE_ID . " = :id",
            ['id' => $sampleId]
        );
    }

    /*
     * Contar reproducciones del mes actual para samples de un creador.
     */
    public static function contarDelCreadorMes(int $creadorId): int
    {
        $tr = ReproduccionesCols::TABLA;
        $ts = \App\Config\Schema\_generated\SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tr} r JOIN {$ts} s ON r." . ReproduccionesCols::SAMPLE_ID . " = s." . \App\Config\Schema\_generated\SamplesCols::ID
            . " WHERE s." . \App\Config\Schema\_generated\SamplesCols::CREADOR_ID . " = :userId"
            . " AND r." . ReproduccionesCols::CREATED_AT . " >= date_trunc('month', NOW())",
            ['userId' => $creadorId]
        );
        return (int) ($row['total'] ?? 0);
    }

    /*
     * Buscar reproducción reciente del mismo sample por usuario (anti-bot).
     */
    public static function buscarRecientePorUsuario(int $userId, int $sampleId, string $intervalo = '30 seconds'): ?array
    {
        $tabla = ReproduccionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . ReproduccionesCols::ID . " FROM {$tabla}"
            . " WHERE " . ReproduccionesCols::USUARIO_ID . " = :userId"
            . " AND " . ReproduccionesCols::SAMPLE_ID . " = :sampleId"
            . " AND " . ReproduccionesCols::CREATED_AT . " >= NOW() - INTERVAL '{$intervalo}'",
            ['userId' => $userId, 'sampleId' => $sampleId]
        );
    }

    /*
     * Registrar reproducción nueva con duración escuchada y flag de completada.
     */
    public static function registrar(int $userId, int $sampleId, float $duracion = 0, bool $completada = false): void
    {
        $tabla = ReproduccionesCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} (" . ReproduccionesCols::USUARIO_ID . ", " . ReproduccionesCols::SAMPLE_ID
            . ", " . ReproduccionesCols::DURACION_ESCUCHADA . ", " . ReproduccionesCols::COMPLETADA
            . ") VALUES (:userId, :sampleId, :duracion, :completada)",
            ['userId' => $userId, 'sampleId' => $sampleId, 'duracion' => $duracion, 'completada' => $completada ? 'true' : 'false']
        );
    }

    /*
     * Actualizar reproducción existente (para debounce).
     */
    public static function actualizarReproduccion(int $id, float $duracion, bool $completada): void
    {
        $tabla = ReproduccionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . ReproduccionesCols::DURACION_ESCUCHADA . " = :duracion, "
            . ReproduccionesCols::COMPLETADA . " = :completada WHERE " . ReproduccionesCols::ID . " = :id",
            ['id' => $id, 'duracion' => $duracion, 'completada' => $completada ? 'true' : 'false']
        );
    }

    /*
     * Listar historial de reproducciones de un usuario con datos completos del sample.
     * Usa NormalizadorSample::sqlSelectSamples() para mantener consistencia de columnas.
     */
    public static function historialUsuario(int $userId, int $limit = 20, int $offset = 0): array
    {
        $sql = \App\Kamples\Api\Helpers\NormalizadorSample::sqlSelectSamples()
             . " JOIN " . ReproduccionesCols::TABLA . " r ON r." . ReproduccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " WHERE r." . ReproduccionesCols::USUARIO_ID . " = :userId AND s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . " GROUP BY s." . SamplesCols::ID . ", u." . UsuariosExtCols::ID . ", u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::VERIFICADO . ", u." . UsuariosExtCols::WP_USER_ID
             . " ORDER BY MAX(r." . ReproduccionesCols::CREATED_AT . ") DESC LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['userId' => $userId, 'limit' => $limit, 'offset' => $offset]);
    }
}
