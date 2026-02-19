<?php

/**
 * CapConfiguracionRepository — Acceso a datos para tabla 'cap_configuracion'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package App
 */

namespace Glory\App\Database\Repositories;

use App\Config\Schema\_generated\CapConfiguracionCols;

class CapConfiguracionRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CapConfiguracionCols::TABLA;
    }

    protected static function colId(): string
    {
        return CapConfiguracionCols::ID;
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
