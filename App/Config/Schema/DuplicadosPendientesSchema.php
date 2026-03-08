<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class DuplicadosPendientesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'duplicados_pendientes';
    }

    public function columnas(): array
    {
        return [
            'id'                  => ['tipo' => 'serial'],
            'sample_original_id'  => ['tipo' => 'int', 'ref' => 'samples(id)'],
            'sample_duplicado_id' => ['tipo' => 'int', 'ref' => 'samples(id)'],
            'tipo'                => ['tipo' => 'varchar', 'enum' => ['cross_usuario', 'mismo_usuario', 'backfill']],
            'estado'              => ['tipo' => 'varchar', 'enum' => ['pendiente', 'aprobado', 'rechazado', 'fusionado'], 'default' => 'pendiente'],
            'resuelto_por'        => ['tipo' => 'int', 'nullable' => true, 'ref' => 'usuarios_ext(id)'],
            'resuelto_at'         => ['tipo' => 'datetime', 'nullable' => true],
            'notas'               => ['tipo' => 'text', 'nullable' => true],
            'created_at'          => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
