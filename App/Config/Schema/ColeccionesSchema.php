<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ColeccionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'colecciones';
    }

    public function columnas(): array
    {
        return [
            'id'             => ['tipo' => 'int', 'pk' => true],
            'usuario_id'     => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'parent_id'      => ['tipo' => 'int', 'nullable' => true, 'ref' => 'colecciones(id)'],
            'nombre'         => ['tipo' => 'string', 'max' => 200],
            'descripcion'    => ['tipo' => 'text', 'default' => ''],
            'imagen_url'     => ['tipo' => 'text', 'nullable' => true],
            'publica'        => ['tipo' => 'bool', 'default' => true],
            'total_samples'  => ['tipo' => 'int', 'default' => 0],
            'created_at'     => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'updated_at'     => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'portada_url'    => ['tipo' => 'text', 'nullable' => true],
            'version'        => ['tipo' => 'int', 'default' => 1],
        ];
    }
}
