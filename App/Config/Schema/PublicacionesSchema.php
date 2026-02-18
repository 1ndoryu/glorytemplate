<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class PublicacionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'publicaciones';
    }

    public function columnas(): array
    {
        return [
            'id'                  => ['tipo' => 'int', 'pk' => true],
            'autor_id'            => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'tipo'                => ['tipo' => 'string', 'max' => 20, 'default' => 'social', 'check' => ['social', 'sample']],
            'contenido'           => ['tipo' => 'text', 'default' => ''],
            'imagenes'            => ['tipo' => 'array', 'default' => '{}'],
            'samples_adjuntos'    => ['tipo' => 'array', 'default' => '{}'],
            'total_likes'         => ['tipo' => 'int', 'default' => 0],
            'total_comentarios'   => ['tipo' => 'int', 'default' => 0],
            'total_reposts'       => ['tipo' => 'int', 'default' => 0],
            'created_at'          => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'repost_id'           => ['tipo' => 'int', 'nullable' => true, 'ref' => 'publicaciones(id)'],
            'imagenes_metadata'   => ['tipo' => 'json', 'default' => '{}'],
            'moderacion_estado'   => ['tipo' => 'string', 'max' => 20, 'default' => 'pendiente'],
            'moderacion_detalle'  => ['tipo' => 'json', 'default' => '{}'],
        ];
    }
}
