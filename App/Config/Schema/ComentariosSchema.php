<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ComentariosSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'comentarios';
    }

    public function columnas(): array
    {
        return [
            'id'                 => ['tipo' => 'int', 'pk' => true],
            'autor_id'           => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'tipo'               => ['tipo' => 'string', 'max' => 20, 'check' => ['sample', 'publicacion']],
            'target_id'          => ['tipo' => 'int'],
            'contenido'          => ['tipo' => 'text', 'nullable' => true],
            'created_at'         => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'tipo_contenido'     => ['tipo' => 'string', 'max' => 20, 'default' => 'texto'],
            'media_url'          => ['tipo' => 'text', 'nullable' => true],
            'media_metadata'     => ['tipo' => 'json', 'nullable' => true],
            'moderacion_estado'  => ['tipo' => 'string', 'max' => 20, 'default' => 'aprobado'],
            'moderacion_detalle' => ['tipo' => 'json', 'default' => '{}'],
            'parent_id'          => ['tipo' => 'int', 'nullable' => true, 'ref' => 'comentarios(id)'],
            'total_respuestas'   => ['tipo' => 'int', 'default' => 0],
            'total_likes'        => ['tipo' => 'int', 'default' => 0],
            'updated_at'         => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
