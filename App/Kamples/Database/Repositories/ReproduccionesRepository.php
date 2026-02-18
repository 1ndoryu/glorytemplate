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
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY id DESC LIMIT :limit OFFSET :offset",
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
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
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
}
