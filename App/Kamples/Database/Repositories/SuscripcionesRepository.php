<?php

/**
 * SuscripcionesRepository — Acceso a datos para tabla 'suscripciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\SuscripcionesCols;
use App\Config\Schema\_generated\SuscripcionesEnums;
use App\Config\Schema\_generated\SuscripcionesDTO;

class SuscripcionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return SuscripcionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return SuscripcionesCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = SuscripcionesCols::TABLA;
        $col = SuscripcionesCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . SuscripcionesCols::ID . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = SuscripcionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . SuscripcionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

            

    /* Agregar metodos custom aqui (queries complejas, JOINs, CTEs, etc.) */
}
