<?php

/**
 * CapAsistenciaRepository — Acceso a datos para tabla 'cap_asistencia'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package App
 */

namespace Glory\App\Database\Repositories;

use App\Config\Schema\_generated\CapAsistenciaCols;

class CapAsistenciaRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CapAsistenciaCols::TABLA;
    }

    protected static function colId(): string
    {
        return CapAsistenciaCols::ID;
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
