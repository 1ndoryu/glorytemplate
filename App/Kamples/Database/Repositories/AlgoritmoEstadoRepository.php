<?php

/**
 * AlgoritmoEstadoRepository — Acceso a datos para tabla 'algoritmo_estado'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\AlgoritmoEstadoCols;
use App\Config\Schema\_generated\AlgoritmoEstadoDTO;

class AlgoritmoEstadoRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return AlgoritmoEstadoCols::TABLA;
    }

    protected static function colId(): string
    {
        return AlgoritmoEstadoCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = AlgoritmoEstadoCols::TABLA;
        $col = AlgoritmoEstadoCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY id DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /* Agregar metodos custom aqui (queries complejas, JOINs, CTEs, etc.) */
}
