<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ReproduccionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'reproducciones';
    }

    public function columnas(): array
    {
        return [
            'id'                  => ['tipo' => 'int', 'pk' => true],
            'usuario_id'          => ['tipo' => 'int', 'nullable' => true, 'ref' => 'usuarios_ext(id)'],
            'sample_id'           => ['tipo' => 'int', 'ref' => 'samples(id)'],
            'duracion_escuchada'  => ['tipo' => 'float', 'default' => 0],
            'completada'          => ['tipo' => 'bool', 'default' => false],
            'created_at'          => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
