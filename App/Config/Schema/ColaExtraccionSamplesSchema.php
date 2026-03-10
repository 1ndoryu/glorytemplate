<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

/**
 * Cola de procesamiento para extracción de audio de samples.
 * Cada fila representa un sample pendiente de descargar, analizar y recortar.
 */
class ColaExtraccionSamplesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cola_extraccion_samples';
    }

    public function columnas(): array
    {
        return [
            'id'                  => ['tipo' => 'int', 'pk' => true],
            'relacion_id'         => ['tipo' => 'int', 'ref' => 'relaciones_sample(id)'],
            'youtube_id'          => ['tipo' => 'string', 'max' => 20, 'nullable' => true],
            'timing_inicio_seg'   => ['tipo' => 'int'],
            'bpm_detectado'       => ['tipo' => 'int', 'nullable' => true],
            'duracion_compas_seg' => ['tipo' => 'decimal', 'nullable' => true],
            'compas_inicio_seg'   => ['tipo' => 'decimal', 'nullable' => true],
            'compas_fin_seg'      => ['tipo' => 'decimal', 'nullable' => true],
            'estado'              => ['tipo' => 'string', 'max' => 20, 'default' => 'pendiente', 'check' => ['pendiente', 'descargando', 'analizando', 'recortando', 'completado', 'error', 'revision_humana']],
            'sample_id'           => ['tipo' => 'int', 'nullable' => true, 'ref' => 'samples(id)'],
            'error_mensaje'       => ['tipo' => 'text', 'nullable' => true],
            'intentos'            => ['tipo' => 'int', 'default' => 0],
            'procesado_at'        => ['tipo' => 'datetime', 'nullable' => true],
            'created_at'          => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'lado'                => ['tipo' => 'string', 'max' => 10, 'default' => 'fuente', 'check' => ['fuente', 'destino']],
            'spotify_id'          => ['tipo' => 'string', 'max' => 30, 'nullable' => true],
        ];
    }
}
