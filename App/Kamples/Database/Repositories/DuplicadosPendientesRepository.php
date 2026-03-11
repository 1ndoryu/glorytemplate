<?php

/**
 * DuplicadosPendientesRepository — Acceso a datos para tabla 'duplicados_pendientes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\DuplicadosPendientesCols;
use App\Config\Schema\_generated\DuplicadosPendientesEnums;
use App\Config\Schema\_generated\DuplicadosPendientesDTO;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\DescargasCols;

class DuplicadosPendientesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return DuplicadosPendientesCols::TABLA;
    }

    protected static function colId(): string
    {
        return DuplicadosPendientesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = DuplicadosPendientesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . DuplicadosPendientesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        /* Agregar metodos custom aqui (queries complejas, JOINs, CTEs, etc.) */
}
