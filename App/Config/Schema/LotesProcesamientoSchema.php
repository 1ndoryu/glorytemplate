<?php

/* [223A-3] Schema para tabla lotes_procesamiento — historial por lote de automatización */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class LotesProcesamientoSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'lotes_procesamiento';
    }

    public function columnas(): array
    {
        return [
            'id'                 => ['tipo' => 'int', 'pk' => true],
            'tipo'               => ['tipo' => 'string', 'max' => 20, 'check' => ['extraccion', 'scraping']],
            'estado'             => ['tipo' => 'string', 'max' => 20, 'default' => 'ejecutando', 'check' => ['ejecutando', 'completado', 'error', 'detenido']],
            'iniciado_at'        => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'completado_at'      => ['tipo' => 'datetime', 'nullable' => true],
            'exitosos'           => ['tipo' => 'int', 'default' => 0],
            'fallidos'           => ['tipo' => 'int', 'default' => 0],
            'recortes'           => ['tipo' => 'int', 'default' => 0],
            'samples_publicados' => ['tipo' => 'int', 'default' => 0],
            'canciones_nuevas'   => ['tipo' => 'int', 'default' => 0],
            'sampleos_nuevos'    => ['tipo' => 'int', 'default' => 0],
            'error_mensaje'      => ['tipo' => 'text', 'nullable' => true],
            'metadata'           => ['tipo' => 'jsonb', 'nullable' => true],
        ];
    }
}
