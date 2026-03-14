<?php

/**
 * BloqueoRepository — Acceso a datos para tabla 'bloqueos'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\BloqueoCols;
use App\Config\Schema\_generated\BloqueoDTO;

class BloqueoRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return BloqueoCols::TABLA;
    }

    protected static function colId(): string
    {
        return BloqueoCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = BloqueoCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . BloqueoCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */
                                /* Agregar metodos custom aqui (queries complejas, JOINs, CTEs, etc.) */
}
