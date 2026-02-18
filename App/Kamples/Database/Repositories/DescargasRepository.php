<?php

/**
 * DescargasRepository — Acceso a datos para tabla 'descargas'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\DescargasDTO;

class DescargasRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return DescargasCols::TABLA;
    }

    protected static function colId(): string
    {
        return DescargasCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = DescargasCols::TABLA;
        $col = DescargasCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY id DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = DescargasCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Verificar si el usuario ya descargó un sample.
     */
    public static function yaDescargado(int $userId, int $sampleId): bool
    {
        $tabla = DescargasCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . DescargasCols::ID . " FROM {$tabla}
             WHERE " . DescargasCols::USUARIO_ID . " = :userId
               AND " . DescargasCols::SAMPLE_ID . " = :sampleId LIMIT 1",
            ['userId' => $userId, 'sampleId' => $sampleId]
        );

        return !empty($row);
    }

    /*
     * Contar descargas del usuario hoy (desde medianoche).
     */
    public static function contarHoy(int $userId): int
    {
        $tabla = DescargasCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla}
             WHERE " . DescargasCols::USUARIO_ID . " = :userId
               AND " . DescargasCols::CREATED_AT . " >= CURRENT_DATE",
            ['userId' => $userId]
        );

        return (int) ($row['total'] ?? 0);
    }

    /*
     * Total de bytes transferidos este mes para un usuario.
     */
    public static function transferidoMesBytes(int $userId): int
    {
        $tabla = DescargasCols::TABLA;

        $row = static::consultarUno(
            "SELECT COALESCE(SUM(" . DescargasCols::TAMANO_BYTES . "), 0) as total FROM {$tabla}
             WHERE " . DescargasCols::USUARIO_ID . " = :userId
               AND " . DescargasCols::CREATED_AT . " >= date_trunc('month', CURRENT_DATE)",
            ['userId' => $userId]
        );

        return (int) ($row['total'] ?? 0);
    }

    /*
     * Registrar una descarga nueva.
     */
    public static function registrar(int $userId, int $sampleId, string $calidad, int $tamanoBytes): void
    {
        $tabla = DescargasCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} (" . DescargasCols::USUARIO_ID . ", " . DescargasCols::SAMPLE_ID
            . ", " . DescargasCols::CALIDAD . ", " . DescargasCols::TAMANO_BYTES
            . ") VALUES (:userId, :sampleId, :calidad, :tamano)",
            ['userId' => $userId, 'sampleId' => $sampleId, 'calidad' => $calidad, 'tamano' => $tamanoBytes]
        );
    }

    /*
     * Eliminar todas las descargas de un sample.
     * Usado en cascada al eliminar un sample.
     */
    public static function eliminarPorSample(int $sampleId): void
    {
        $tabla = DescargasCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . DescargasCols::SAMPLE_ID . " = :id",
            ['id' => $sampleId]
        );
    }

    /*
     * Contar descargas del mes actual para samples de un creador.
     */
    public static function contarDelCreadorMes(int $creadorId): int
    {
        $td = DescargasCols::TABLA;
        $ts = \App\Config\Schema\_generated\SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$td} d JOIN {$ts} s ON d." . DescargasCols::SAMPLE_ID . " = s." . \App\Config\Schema\_generated\SamplesCols::ID
            . " WHERE s." . \App\Config\Schema\_generated\SamplesCols::CREADOR_ID . " = :userId"
            . " AND d." . DescargasCols::CREATED_AT . " >= date_trunc('month', NOW())",
            ['userId' => $creadorId]
        );
        return (int) ($row['total'] ?? 0);
    }

    /*
     * Obtener tags/bpm/key de las descargas de un usuario (para sugerencias).
     */
    public static function contextoDescargas(int $userId): array
    {
        $td = DescargasCols::TABLA;
        $ts = \App\Config\Schema\_generated\SamplesCols::TABLA;

        return static::consultar(
            "SELECT s." . \App\Config\Schema\_generated\SamplesCols::TAGS
            . ", s." . \App\Config\Schema\_generated\SamplesCols::BPM
            . ", s." . \App\Config\Schema\_generated\SamplesCols::KEY
            . " FROM {$ts} s JOIN {$td} d ON d." . DescargasCols::SAMPLE_ID . " = s." . \App\Config\Schema\_generated\SamplesCols::ID
            . " WHERE d." . DescargasCols::USUARIO_ID . " = :uid AND s." . \App\Config\Schema\_generated\SamplesCols::ESTADO . " = 'activo'",
            ['uid' => $userId]
        );
    }

    /*
     * IDs de samples descargados por un usuario (para exclusión en sugerencias).
     */
    public static function idsDescargados(int $userId): array
    {
        $tabla = DescargasCols::TABLA;

        $rows = static::consultar(
            "SELECT " . DescargasCols::SAMPLE_ID . " FROM {$tabla} WHERE " . DescargasCols::USUARIO_ID . " = :uid",
            ['uid' => $userId]
        );

        return array_map(fn($r) => (int) $r[DescargasCols::SAMPLE_ID], $rows);
    }

    /*
     * Contar samples descargados de un usuario (para paginación).
     */
    public static function contarSamplesDescargados(int $userId): int
    {
        $td = DescargasCols::TABLA;
        $ts = \App\Config\Schema\_generated\SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$td} d JOIN {$ts} s ON d." . DescargasCols::SAMPLE_ID . " = s."
            . \App\Config\Schema\_generated\SamplesCols::ID
            . " WHERE d." . DescargasCols::USUARIO_ID . " = :uid"
            . " AND s." . \App\Config\Schema\_generated\SamplesCols::ESTADO . " = 'activo'",
            ['uid' => $userId]
        );
        return (int) ($row['total'] ?? 0);
    }

    /*
     * Filtrar qué sample IDs ya fueron descargados por un usuario.
     * Retorna array de IDs ya descargados que están en la lista dada.
     */
    public static function filtrarYaDescargados(int $userId, array $sampleIds): array
    {
        if (empty($sampleIds)) return [];

        $tabla = DescargasCols::TABLA;
        $params = ['userId' => $userId];
        $placeholders = [];
        foreach ($sampleIds as $idx => $sid) {
            $k = "sid{$idx}";
            $placeholders[] = ":{$k}";
            $params[$k] = $sid;
        }
        $in = implode(',', $placeholders);

        $rows = static::consultar(
            "SELECT DISTINCT " . DescargasCols::SAMPLE_ID . " FROM {$tabla}"
            . " WHERE " . DescargasCols::USUARIO_ID . " = :userId"
            . " AND " . DescargasCols::SAMPLE_ID . " IN ({$in})",
            $params
        );

        return array_map(fn($r) => (int) $r[DescargasCols::SAMPLE_ID], $rows);
    }
}
