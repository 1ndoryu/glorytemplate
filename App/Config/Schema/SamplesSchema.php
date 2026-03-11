<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class SamplesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'samples';
    }

    public function columnas(): array
    {
        return [
            'id'                   => ['tipo' => 'int', 'pk' => true],
            'creador_id'           => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'titulo'               => ['tipo' => 'string', 'max' => 200],
            'slug'                 => ['tipo' => 'string', 'max' => 250, 'unico' => true],
            'descripcion'          => ['tipo' => 'text', 'default' => ''],
            'bpm'                  => ['tipo' => 'int', 'nullable' => true],
            'key'                  => ['tipo' => 'string', 'max' => 3, 'nullable' => true],
            'escala'               => ['tipo' => 'string', 'max' => 10, 'nullable' => true],
            'duracion'             => ['tipo' => 'float', 'default' => 0],
            'formato'              => ['tipo' => 'string', 'max' => 10, 'default' => 'wav'],
            'tamano'               => ['tipo' => 'int', 'default' => 0],
            'metadata'             => ['tipo' => 'json', 'default' => '{}'],
            'tags'                 => ['tipo' => 'array', 'default' => '{}'],
            'estado'               => ['tipo' => 'string', 'max' => 20, 'default' => 'procesando', 'check' => ['procesando', 'activo', 'inactivo', 'eliminado', 'en_supervision']],
            'tipo'                 => ['tipo' => 'string', 'max' => 20, 'default' => 'loop', 'check' => ['loop', 'oneshot']],
            'es_premium'           => ['tipo' => 'bool', 'default' => false],
            'precio'               => ['tipo' => 'decimal', 'nullable' => true],
            'ruta_original'        => ['tipo' => 'text', 'nullable' => true],
            'ruta_optimizada'      => ['tipo' => 'text', 'nullable' => true],
            'ruta_preview'         => ['tipo' => 'text', 'nullable' => true],
            'ruta_waveform'        => ['tipo' => 'text', 'nullable' => true],
            'imagen_url'           => ['tipo' => 'text', 'nullable' => true],
            'embedding'            => ['tipo' => 'vector', 'nullable' => true],
            'total_descargas'      => ['tipo' => 'int', 'default' => 0],
            'total_likes'          => ['tipo' => 'int', 'default' => 0],
            'total_reproducciones' => ['tipo' => 'int', 'default' => 0],
            'publicado_at'         => ['tipo' => 'datetime', 'nullable' => true],
            'created_at'           => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'updated_at'           => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'id_corto'             => ['tipo' => 'string', 'max' => 10, 'unico' => true, 'nullable' => true],
            'permitir_descarga'    => ['tipo' => 'bool', 'default' => true],
            'licencia_libre'       => ['tipo' => 'bool', 'default' => false],
            'audio_hash'           => ['tipo' => 'string', 'max' => 64, 'nullable' => true],
            'hash_parcial'         => ['tipo' => 'string', 'max' => 64, 'nullable' => true],
            'total_comentarios'    => ['tipo' => 'int', 'default' => 0],
            'verificado'           => ['tipo' => 'bool', 'default' => false],
            'mostrar_en_comunidad' => ['tipo' => 'bool', 'default' => true],
            'cancion_origen_id'    => ['tipo' => 'int', 'nullable' => true, 'ref' => 'canciones(id)'],
            'relacion_sampleo_id'  => ['tipo' => 'int', 'nullable' => true, 'ref' => 'relaciones_sample(id)'],
        ];
    }
}
