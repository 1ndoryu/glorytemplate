<?php

/**
 * Schema Glory para la tabla cap_centros.
 * Fuente de verdad para columnas, tipos y constraints.
 * Los archivos generados (Cols, DTO, TS) se derivan de esta declaración.
 */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CapCentrosSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cap_centros';
    }

    public function columnas(): array
    {
        return [
            'id' => ['tipo' => 'int', 'pk' => true],
            'user_id' => ['tipo' => 'int'],
            'nombre' => ['tipo' => 'string', 'max' => 200],
            'direccion' => ['tipo' => 'string', 'max' => 255, 'default' => ''],
            'telefono' => ['tipo' => 'string', 'max' => 50, 'default' => ''],
            'email' => ['tipo' => 'string', 'max' => 100, 'default' => ''],
            'logo_url' => ['tipo' => 'string', 'max' => 255, 'default' => ''],
            'created_at' => ['tipo' => 'datetime', 'nullable' => true],
            'updated_at' => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
