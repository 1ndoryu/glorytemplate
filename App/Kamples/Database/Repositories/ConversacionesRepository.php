<?php

/**
 * ConversacionesRepository — Acceso a datos para tabla 'conversaciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ConversacionesCols;
use App\Config\Schema\_generated\ConversacionesDTO;

class ConversacionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ConversacionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ConversacionesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ConversacionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /* Agregar metodos custom aqui (queries complejas, JOINs, CTEs, etc.) */
}
