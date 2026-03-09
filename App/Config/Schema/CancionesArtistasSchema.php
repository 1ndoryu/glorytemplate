<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

/**
 * Relación N:N entre canciones y artistas con roles.
 * PK compuesta: (cancion_id, artista_id, rol).
 * El artista principal de una canción también va aquí para queries uniformes.
 */
class CancionesArtistasSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'canciones_artistas';
    }

    public function columnas(): array
    {
        return [
            'cancion_id' => ['tipo' => 'int', 'ref' => 'canciones(id)'],
            'artista_id' => ['tipo' => 'int', 'ref' => 'artistas_musicales(id)'],
            'rol'        => ['tipo' => 'string', 'max' => 20, 'default' => 'principal', 'check' => ['principal', 'featuring', 'producer']],
        ];
    }

    public function pkCompuesta(): array
    {
        return ['cancion_id', 'artista_id', 'rol'];
    }
}
