<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class SuscripcionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'suscripciones';
    }

    public function columnas(): array
    {
        return [
            'id'                      => ['tipo' => 'int', 'pk' => true],
            'usuario_id'              => ['tipo' => 'int', 'ref' => 'usuarios_ext(id)'],
            'plan'                    => ['tipo' => 'string', 'max' => 20, 'default' => 'free'],
            'estado'                  => ['tipo' => 'string', 'max' => 30, 'default' => 'activa', 'check' => ['activa', 'cancelada', 'vencida', 'periodo_prueba']],
            'stripe_subscription_id'  => ['tipo' => 'string', 'max' => 100, 'nullable' => true],
            'inicio_at'               => ['tipo' => 'datetime', 'nullable' => true],
            'fin_at'                  => ['tipo' => 'datetime', 'nullable' => true],
            'created_at'              => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
