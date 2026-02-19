<?php

/**
 * Schema Glory para la tabla cap_clases.
 * Fuente de verdad para columnas, tipos y constraints.
 */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CapClasesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cap_clases';
    }

    public function columnas(): array
    {
        return [
            'id' => ['tipo' => 'int', 'pk' => true],
            'centro_id' => ['tipo' => 'int', 'ref' => 'cap_centros(id)'],
            'fecha' => ['tipo' => 'string', 'max' => 10],
            'hora_inicio' => ['tipo' => 'string', 'max' => 8],
            'hora_fin' => ['tipo' => 'string', 'max' => 8],
            'asignatura' => ['tipo' => 'string', 'max' => 100],
            'duracion_minutos' => ['tipo' => 'int', 'default' => 60],
            'bloqueada' => ['tipo' => 'bool', 'default' => 0],
            'created_at' => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
