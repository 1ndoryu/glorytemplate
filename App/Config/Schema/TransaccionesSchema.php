<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class TransaccionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'transacciones';
    }

    public function columnas(): array
    {
        return [
            'id'                  => ['tipo' => 'int', 'pk' => true],
            'comprador_id'        => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'creador_id'          => ['tipo' => 'int', 'nullable' => true, 'ref' => 'usuarios_ext(id)'],
            'sample_id'           => ['tipo' => 'int', 'nullable' => true, 'ref' => 'samples(id)'],
            'tipo'                => ['tipo' => 'string', 'max' => 30, 'check' => ['suscripcion', 'compra_sample', 'payout']],
            'monto'               => ['tipo' => 'decimal'],
            'moneda'              => ['tipo' => 'string', 'max' => 3, 'default' => 'USD'],
            'estado'              => ['tipo' => 'string', 'max' => 30, 'default' => 'pendiente', 'check' => ['completada', 'completed', 'pendiente', 'fallida', 'reembolsada']],
            'stripe_payment_id'   => ['tipo' => 'string', 'max' => 100, 'nullable' => true],
            'created_at'          => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'pago_creador'        => ['tipo' => 'decimal', 'default' => 0],
            'comision_plataforma' => ['tipo' => 'decimal', 'default' => 0],
        ];
    }
}
