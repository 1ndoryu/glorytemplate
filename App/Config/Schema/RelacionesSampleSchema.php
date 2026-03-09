<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

/**
 * Tabla central de relaciones entre canciones (sample, cover, remix, interpolation).
 * cancion_destino = la que USA el sample.
 * cancion_fuente = de DONDE VIENE el sample.
 */
class RelacionesSampleSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'relaciones_sample';
    }

    public function columnas(): array
    {
        return [
            'id'                 => ['tipo' => 'int', 'pk' => true],
            'cancion_destino_id' => ['tipo' => 'int', 'ref' => 'canciones(id)'],
            'cancion_fuente_id'  => ['tipo' => 'int', 'ref' => 'canciones(id)'],
            'whosampled_id'      => ['tipo' => 'int', 'unico' => true, 'nullable' => true],
            'tipo_relacion'      => ['tipo' => 'string', 'max' => 20, 'default' => 'sample', 'check' => ['sample', 'cover', 'remix', 'interpolation']],
            'tipo_elemento'      => ['tipo' => 'string', 'max' => 50, 'default' => 'multiple_elements', 'check' => ['hook_riff', 'vocals_lyrics', 'drums', 'bass', 'keys_synth', 'sound_effect', 'multiple_elements', 'other']],
            'timings_destino'    => ['tipo' => 'json', 'default' => '[]'],
            'timings_fuente'     => ['tipo' => 'json', 'default' => '[]'],
            'aparece_en_todo'    => ['tipo' => 'bool', 'default' => false],
            'sample_id'          => ['tipo' => 'int', 'nullable' => true, 'ref' => 'samples(id)'],
            'votos_total'        => ['tipo' => 'int', 'default' => 0],
            'votos_promedio'     => ['tipo' => 'decimal', 'default' => 0],
            'fuente'             => ['tipo' => 'string', 'max' => 20, 'default' => 'scraping', 'check' => ['scraping', 'comunidad', 'musicbrainz', 'import']],
            'contribuidor_id'    => ['tipo' => 'int', 'nullable' => true, 'ref' => 'usuarios_ext(id)'],
            'verificada'         => ['tipo' => 'bool', 'default' => false],
            'created_at'         => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'updated_at'         => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }

    public function uniqueCompuestos(): array
    {
        return [
            ['cancion_destino_id', 'cancion_fuente_id', 'tipo_relacion'],
        ];
    }
}
