<?php

/**
 * Schema Glory para la tabla cap_disponibilidad.
 * Fuente de verdad para columnas, tipos y constraints.
 * Los valores check de 'dia' generan CapDisponibilidadEnums con constantes para cada dia.
 */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CapDisponibilidadSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cap_disponibilidad';
    }

    public function columnas(): array
    {
        return [
            'id' => ['tipo' => 'int', 'pk' => true],
            'alumno_id' => ['tipo' => 'int', 'ref' => 'cap_alumnos(id)'],
            'dia' => ['tipo' => 'string', 'max' => 20, 'check' => ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']],
            'hora' => ['tipo' => 'string', 'max' => 10],
            'disponible' => ['tipo' => 'bool', 'default' => 1],
            'created_at' => ['tipo' => 'datetime', 'nullable' => true],
            'updated_at' => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
