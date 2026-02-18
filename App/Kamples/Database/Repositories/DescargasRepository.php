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
}
