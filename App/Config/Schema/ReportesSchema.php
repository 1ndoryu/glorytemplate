<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class ReportesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'reportes';
    }

    public function columnas(): array
    {
        return [
            'id'             => ['tipo' => 'int', 'pk' => true],
            'tipo'           => ['tipo' => 'string', 'max' => 30],
            'target_id'      => ['tipo' => 'int'],
            'reportador_id'  => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'reportado_id'   => ['tipo' => 'int', 'nullable' => true, 'ref' => 'usuarios_ext(id)'],
            'razon'          => ['tipo' => 'text'],
            'detalles'       => ['tipo' => 'text', 'nullable' => true],
            'estado'         => ['tipo' => 'string', 'max' => 20, 'default' => 'pendiente'],
            'resuelto_por'   => ['tipo' => 'int', 'nullable' => true, 'ref' => 'usuarios_ext(id)'],
            'resuelto_at'    => ['tipo' => 'datetime', 'nullable' => true],
            'created_at'     => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
