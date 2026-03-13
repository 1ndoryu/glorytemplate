<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ArtistasMusicalesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'artistas_musicales';
    }

    public function columnas(): array
    {
        return [
            'id'              => ['tipo' => 'int', 'pk' => true],
            'nombre'          => ['tipo' => 'string', 'max' => 300],
            'slug'            => ['tipo' => 'string', 'max' => 350, 'unico' => true],
            'imagen_url'      => ['tipo' => 'text', 'nullable' => true],
            'whosampled_slug' => ['tipo' => 'string', 'max' => 350, 'unico' => true, 'nullable' => true],
            'musicbrainz_id'  => ['tipo' => 'string', 'max' => 36, 'nullable' => true],
            'metadata'        => ['tipo' => 'json', 'default' => '{}'],
            'total_canciones' => ['tipo' => 'int', 'default' => 0],
            'prioridad'       => ['tipo' => 'int', 'default' => 0],
            'created_at'      => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'updated_at'      => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
