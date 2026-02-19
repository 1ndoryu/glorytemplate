<?php

/**
 * CapAlumnosRepository — Acceso a datos para tabla 'cap_alumnos'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package App
 */

namespace Glory\App\Database\Repositories;

use App\Config\Schema\_generated\CapAlumnosCols;
use App\Config\Schema\_generated\CapAlumnosEnums;

class CapAlumnosRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CapAlumnosCols::TABLA;
    }

    protected static function colId(): string
    {
        return CapAlumnosCols::ID;
    }

    /*
     * Buscar registros con estado activo, paginados.
     */
    public static function buscarActivos(int $limit = 20, int $offset = 0): array
    {
        $tabla = static::tablaCompleta();
        $colEstado = CapAlumnosCols::ESTADO;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$colEstado} = :estado ORDER BY id DESC LIMIT :limit OFFSET :offset",
            [
                'estado' => CapAlumnosEnums::ESTADO_ACTIVO,
                'limit' => $limit,
                'offset' => $offset,
            ]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = static::tablaCompleta();

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /* Agregar metodos custom aqui (queries complejas, JOINs, CTEs, etc.) */
}
