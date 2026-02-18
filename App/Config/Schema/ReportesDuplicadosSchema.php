<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ReportesDuplicadosSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'reportes_duplicados';
    }

    public function columnas(): array
    {
        return [
            'id'                   => ['tipo' => 'int', 'pk' => true],
            'sample_original_id'   => ['tipo' => 'int', 'ref' => 'samples(id)'],
            'sample_duplicado_id'  => ['tipo' => 'int', 'ref' => 'samples(id)'],
            'reportador_id'        => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'estado'               => ['tipo' => 'string', 'max' => 20, 'default' => 'reportado', 'check' => ['reportado', 'en_revision', 'resuelto', 'rechazado']],
            'pruebas_texto'        => ['tipo' => 'text', 'default' => ''],
            'resuelto_at'          => ['tipo' => 'datetime', 'nullable' => true],
            'created_at'           => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
