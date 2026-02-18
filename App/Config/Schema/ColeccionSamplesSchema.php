<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ColeccionSamplesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'coleccion_samples';
    }

    public function columnas(): array
    {
        return [
            'coleccion_id' => ['tipo' => 'int', 'ref' => 'colecciones(id)'],
            'sample_id'    => ['tipo' => 'int', 'ref' => 'samples(id)'],
            'posicion'     => ['tipo' => 'int', 'default' => 0],
            'added_at'     => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }

    public function pkCompuesta(): array
    {
        return ['coleccion_id', 'sample_id'];
    }
}
