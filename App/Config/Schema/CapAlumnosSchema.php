<?php

/**
 * Schema Glory para la tabla cap_alumnos.
 * Fuente de verdad para columnas, tipos y constraints.
 * Los archivos generados (Cols, DTO, TS) se derivan de esta declaración.
 */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CapAlumnosSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cap_alumnos';
    }

    public function columnas(): array
    {
        return [
            'id' => ['tipo' => 'int', 'pk' => true],
            'centro_id' => ['tipo' => 'int', 'ref' => 'cap_centros(id)'],
            'nombre' => ['tipo' => 'string', 'max' => 200],
            'email' => ['tipo' => 'string', 'max' => 100, 'default' => ''],
            'telefono' => ['tipo' => 'string', 'max' => 50, 'default' => ''],
            'dni' => ['tipo' => 'string', 'max' => 20, 'default' => ''],
            'horas_completadas' => ['tipo' => 'decimal', 'default' => 0],
            'estado' => ['tipo' => 'string', 'check' => ['activo', 'completado', 'pausado'], 'default' => 'activo'],
            'created_at' => ['tipo' => 'datetime', 'nullable' => true],
            'updated_at' => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
