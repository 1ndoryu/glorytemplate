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
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\KamplesLogger;

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
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . static::colId() . " DESC LIMIT :limit OFFSET :offset",
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
        $ts = SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tr} r JOIN {$ts} s ON r." . ReproduccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . " WHERE s." . SamplesCols::CREADOR_ID . " = :userId"
            . " AND r." . ReproduccionesCols::CREATED_AT . " >= date_trunc('month', NOW())",
            ['userId' => $creadorId]
        );
        return (int) ($row['total'] ?? 0);
    }

    /*
     * Buscar reproducción reciente del mismo sample por usuario (anti-bot).
     */
    /*
     * Whitelist de intervalos válidos para debounce.
     * Previene SQL interpolation en INTERVAL.
     */
    private static function intervaloSegundos(string $intervalo): int
    {
        $mapa = [
            '10 seconds' => 10,
            '30 seconds' => 30,
            '60 seconds' => 60,
        ];
        return $mapa[$intervalo] ?? 30;
    }

    public static function buscarRecientePorUsuario(int $userId, int $sampleId, string $intervalo = '30 seconds'): ?array
    {
        $tabla = ReproduccionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . ReproduccionesCols::ID . " FROM {$tabla}"
            . " WHERE " . ReproduccionesCols::USUARIO_ID . " = :userId"
            . " AND " . ReproduccionesCols::SAMPLE_ID . " = :sampleId"
            . " AND " . ReproduccionesCols::CREATED_AT . " >= NOW() - INTERVAL '1 second' * :seg",
            ['userId' => $userId, 'sampleId' => $sampleId, 'seg' => self::intervaloSegundos($intervalo)]
        );
    }

    /*
     * Registrar reproducción nueva con duración escuchada y flag de completada.
     */
    public static function registrar(int $userId, int $sampleId, float $duracion = 0, bool $completada = false): bool
    {
        $tabla = ReproduccionesCols::TABLA;

        try {
            static::ejecutar(
                "INSERT INTO {$tabla} (" . ReproduccionesCols::USUARIO_ID . ", " . ReproduccionesCols::SAMPLE_ID
                . ", " . ReproduccionesCols::DURACION_ESCUCHADA . ", " . ReproduccionesCols::COMPLETADA
                . ") VALUES (:userId, :sampleId, :" . ReproduccionesCols::DURACION_ESCUCHADA . ", :" . ReproduccionesCols::COMPLETADA . ")",
                ['userId' => $userId, 'sampleId' => $sampleId, ReproduccionesCols::DURACION_ESCUCHADA => $duracion, ReproduccionesCols::COMPLETADA => $completada ? 'true' : 'false']
            );
            return true;
        } catch (\Throwable $e) {
            /* FK violation cuando el sample fue eliminado entre play y registro */
            KamplesLogger::error('ReproduccionesRepository::registrar FK error', [
                'userId' => $userId,
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /*
     * Actualizar reproducción existente (para debounce).
     */
    public static function actualizarReproduccion(int $id, float $duracion, bool $completada): void
    {
        $tabla = ReproduccionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . ReproduccionesCols::DURACION_ESCUCHADA . " = :" . ReproduccionesCols::DURACION_ESCUCHADA . ", "
            . ReproduccionesCols::COMPLETADA . " = :" . ReproduccionesCols::COMPLETADA . " WHERE " . ReproduccionesCols::ID . " = :id",
            ['id' => $id, ReproduccionesCols::DURACION_ESCUCHADA => $duracion, ReproduccionesCols::COMPLETADA => $completada ? 'true' : 'false']
        );
    }

    /*
     * Listar historial de reproducciones de un usuario con datos completos del sample.
     * Usa NormalizadorSample::sqlSelectSamples() para mantener consistencia de columnas.
     */
    public static function historialUsuario(int $userId, int $limit = 20, int $offset = 0): array
    {
        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " JOIN " . ReproduccionesCols::TABLA . " r ON r." . ReproduccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " WHERE r." . ReproduccionesCols::USUARIO_ID . " = :userId AND s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . " GROUP BY s." . SamplesCols::ID . ", u." . UsuariosExtCols::ID . ", u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::VERIFICADO . ", u." . UsuariosExtCols::WP_USER_ID
             . " ORDER BY MAX(r." . ReproduccionesCols::CREATED_AT . ") DESC LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['userId' => $userId, 'limit' => $limit, 'offset' => $offset]);
    }

    /*
     * QQ46: Devuelve solo los IDs de samples que el usuario ha reproducido.
     * Query liviana (solo DISTINCT sample_id) usada por el frontend para
     * mostrar punto rojo en samples no reproducidos.
     */
    public static function listarIdsReproducidos(int $userId): array
    {
        $tabla = ReproduccionesCols::TABLA;
        $colSample = ReproduccionesCols::SAMPLE_ID;
        $colUsuario = ReproduccionesCols::USUARIO_ID;

        $rows = static::consultar(
            "SELECT DISTINCT {$colSample} FROM {$tabla} WHERE {$colUsuario} = :userId",
            ['userId' => $userId]
        );

        return array_map(fn($r) => (int) $r[$colSample], $rows);
    }
}
