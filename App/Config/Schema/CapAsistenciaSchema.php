<?php

/**
 * Schema Glory para la tabla cap_asistencia.
 * Fuente de verdad para columnas, tipos y constraints.
 */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CapAsistenciaSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cap_asistencia';
    }

    public function columnas(): array
    {
        return [
            'id' => ['tipo' => 'int', 'pk' => true],
            'clase_id' => ['tipo' => 'int', 'ref' => 'cap_clases(id)'],
            'alumno_id' => ['tipo' => 'int', 'ref' => 'cap_alumnos(id)'],
            'asistio' => ['tipo' => 'bool', 'default' => 0],
            'created_at' => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }

    public function uniqueCompuestos(): array
    {
        return [
            ['clase_id', 'alumno_id'],
        ];
    }
}
