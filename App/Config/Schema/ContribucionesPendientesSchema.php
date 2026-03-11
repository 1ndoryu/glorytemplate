<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

/**
 * Tabla de contribuciones de relaciones de sampleo pendientes de moderacion.
 * Al aprobar, se crea la relacion en relaciones_sample y se vincula via relacion_creada_id.
 */
class ContribucionesPendientesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'contribuciones_pendientes';
    }

    public function columnas(): array
    {
        return [
            'id'                     => ['tipo' => 'int', 'pk' => true],
            'contribuidor_id'        => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'cancion_destino_id'     => ['tipo' => 'int', 'nullable' => true, 'ref' => 'canciones(id)'],
            'cancion_fuente_id'      => ['tipo' => 'int', 'nullable' => true, 'ref' => 'canciones(id)'],
            'cancion_nueva_titulo'   => ['tipo' => 'string', 'max' => 500, 'nullable' => true],
            'cancion_nueva_artista'  => ['tipo' => 'string', 'max' => 300, 'nullable' => true],
            'cancion_nueva_youtube_url' => ['tipo' => 'string', 'max' => 500, 'nullable' => true],
            'cancion_nueva_lado'     => ['tipo' => 'string', 'max' => 10, 'nullable' => true, 'check' => ['destino', 'fuente']],
            'tipo_relacion'          => ['tipo' => 'string', 'max' => 20, 'default' => 'sample', 'check' => ['sample', 'cover', 'remix', 'interpolation']],
            'tipo_elemento'          => ['tipo' => 'string', 'max' => 50, 'default' => 'multiple_elements', 'check' => ['hook_riff', 'vocals_lyrics', 'drums', 'bass', 'keys_synth', 'sound_effect', 'multiple_elements', 'other']],
            'estado'                 => ['tipo' => 'string', 'max' => 20, 'default' => 'pendiente', 'check' => ['pendiente', 'aprobada', 'rechazada']],
            'moderador_id'           => ['tipo' => 'int', 'nullable' => true, 'ref' => 'usuarios_ext(id)'],
            'moderador_nota'         => ['tipo' => 'text', 'nullable' => true],
            'relacion_creada_id'     => ['tipo' => 'int', 'nullable' => true, 'ref' => 'relaciones_sample(id)'],
            'relacion_existente_id'  => ['tipo' => 'int', 'nullable' => true, 'ref' => 'relaciones_sample(id)'],
            'tipo_contribucion'      => ['tipo' => 'string', 'max' => 20, 'default' => 'nueva', 'check' => ['nueva', 'edicion', 'eliminacion']],
            'cambios_propuestos'     => ['tipo' => 'jsonb', 'nullable' => true],
            'created_at'             => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'resuelto_at'            => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
