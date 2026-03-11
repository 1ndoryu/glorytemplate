<?php

/**
 * ReportesDuplicadosRepository — Acceso a datos para tabla 'reportes_duplicados'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ReportesDuplicadosCols;
use App\Config\Schema\_generated\ReportesDuplicadosEnums;
use App\Config\Schema\_generated\ReportesDuplicadosDTO;

class ReportesDuplicadosRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ReportesDuplicadosCols::TABLA;
    }

    protected static function colId(): string
    {
        return ReportesDuplicadosCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ReportesDuplicadosCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ReportesDuplicadosCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        

            

    /* Agregar metodos custom aqui (queries complejas, JOINs, CTEs, etc.) */
}
