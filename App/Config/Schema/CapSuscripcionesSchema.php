<?php

/**
 * Schema Glory para la tabla cap_suscripciones.
 * Fuente de verdad para columnas, tipos y constraints.
 * Los valores check de 'estado' generan CapSuscripcionesEnums.
 */

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class CapSuscripcionesSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'cap_suscripciones';
    }

    public function columnas(): array
    {
        return [
            'id' => ['tipo' => 'int', 'pk' => true],
            'centro_id' => ['tipo' => 'int', 'ref' => 'cap_centros(id)'],
            'stripe_customer_id' => ['tipo' => 'string', 'max' => 100, 'default' => ''],
            'stripe_subscription_id' => ['tipo' => 'string', 'max' => 100, 'default' => ''],
            'estado' => ['tipo' => 'string', 'check' => ['activa', 'expirada', 'cancelada', 'pago_fallido'], 'default' => 'activa'],
            'fecha_inicio' => ['tipo' => 'datetime', 'nullable' => true],
            'fecha_fin' => ['tipo' => 'datetime', 'nullable' => true],
            'created_at' => ['tipo' => 'datetime', 'nullable' => true],
            'updated_at' => ['tipo' => 'datetime', 'nullable' => true],
        ];
    }
}
