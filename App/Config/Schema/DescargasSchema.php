<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class DescargasSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'descargas';
    }

    public function columnas(): array
    {
        return [
            'id'           => ['tipo' => 'int', 'pk' => true],
            'usuario_id'   => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'sample_id'    => ['tipo' => 'int', 'ref' => 'samples(id)'],
            'calidad'      => ['tipo' => 'string', 'max' => 10, 'default' => 'mp3'],
            'created_at'   => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'tamano_bytes' => ['tipo' => 'int', 'default' => 0],
        ];
    }
}
