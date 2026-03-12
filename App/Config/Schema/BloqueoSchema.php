<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class BloqueoSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'bloqueos';
    }

    public function columnas(): array
    {
        return [
            'id'             => ['tipo' => 'int', 'pk' => true],
            'bloqueador_id'  => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'bloqueado_id'   => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'razon'          => ['tipo' => 'string', 'max' => 255, 'default' => ''],
            'created_at'     => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
