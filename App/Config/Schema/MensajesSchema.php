<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class MensajesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'mensajes';
    }

    public function columnas(): array
    {
        return [
            'id'              => ['tipo' => 'int', 'pk' => true],
            'conversacion_id' => ['tipo' => 'int', 'ref' => 'conversaciones(id)'],
            'autor_id'        => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'contenido'       => ['tipo' => 'text'],
            'leido'           => ['tipo' => 'bool', 'default' => false],
            'created_at'      => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'tipo'            => ['tipo' => 'string', 'max' => 20, 'default' => 'texto'],
            'media_url'       => ['tipo' => 'text', 'nullable' => true],
            'media_metadata'  => ['tipo' => 'json', 'nullable' => true],
        ];
    }
}
