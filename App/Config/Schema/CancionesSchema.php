<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CancionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'canciones';
    }

    public function columnas(): array
    {
        return [
            'id'                => ['tipo' => 'int', 'pk' => true],
            'titulo'            => ['tipo' => 'string', 'max' => 500],
            'slug'              => ['tipo' => 'string', 'max' => 550, 'unico' => true],
            'artista_id'        => ['tipo' => 'int', 'ref' => 'artistas_musicales(id)'],
            'album'             => ['tipo' => 'string', 'max' => 500, 'nullable' => true],
            'sello'             => ['tipo' => 'string', 'max' => 200, 'nullable' => true],
            'anio'              => ['tipo' => 'int', 'nullable' => true],
            'duracion_segundos' => ['tipo' => 'int', 'nullable' => true],
            'genero'            => ['tipo' => 'string', 'max' => 100, 'nullable' => true],
            'youtube_id'        => ['tipo' => 'string', 'max' => 20, 'nullable' => true],
            'imagen_url'        => ['tipo' => 'text', 'nullable' => true],
            'whosampled_url'    => ['tipo' => 'string', 'max' => 500, 'unico' => true, 'nullable' => true],
            'bpm'               => ['tipo' => 'int', 'nullable' => true],
            'tonalidad'         => ['tipo' => 'string', 'max' => 5, 'nullable' => true],
            'metadata'          => ['tipo' => 'json', 'default' => '{}'],
            'total_sampleada'   => ['tipo' => 'int', 'default' => 0],
            'total_samplea'     => ['tipo' => 'int', 'default' => 0],
            'total_likes'       => ['tipo' => 'int', 'default' => 0],
            'total_comentarios' => ['tipo' => 'int', 'default' => 0],
            'created_at'        => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'updated_at'        => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
