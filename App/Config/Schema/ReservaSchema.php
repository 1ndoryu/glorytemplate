<?php

namespace App\Config\Schema;

use Glory\Contracts\PostTypeSchema;

/**
 * Schema del CPT Reserva.
 * Define todos los meta fields tipados para reservas de vehículos.
 */
class ReservaSchema extends PostTypeSchema
{
    public function postType(): string
    {
        return 'reserva';
    }

    public function meta(): array
    {
        return [
            '_reserva_vehiculo_id' => [
                'tipo'     => 'int',
                'required' => true,
            ],
            '_reserva_fecha_inicio' => [
                'tipo'     => 'string',
                'required' => true,
            ],
            '_reserva_fecha_fin' => [
                'tipo'     => 'string',
                'required' => true,
            ],
            '_reserva_noches' => [
                'tipo'    => 'int',
                'default' => 0,
            ],
            '_reserva_precio_noche' => [
                'tipo'    => 'float',
                'default' => 0,
            ],
            '_reserva_precio_total' => [
                'tipo'    => 'float',
                'default' => 0,
            ],
            '_reserva_estado' => [
                'tipo'    => 'string',
                'default' => 'pendiente',
            ],
            '_reserva_nombre_cliente' => [
                'tipo'     => 'string',
                'required' => true,
                'max'      => 200,
            ],
            '_reserva_email_cliente' => [
                'tipo'     => 'string',
                'required' => true,
            ],
            '_reserva_telefono_cliente' => [
                'tipo'    => 'string',
                'default' => '',
            ],
            '_reserva_stripe_session_id' => [
                'tipo'    => 'string',
                'default' => '',
            ],
            '_reserva_stripe_payment_intent' => [
                'tipo'    => 'string',
                'default' => '',
            ],
            '_reserva_notas' => [
                'tipo'    => 'text',
                'default' => '',
            ],
            '_reserva_temporada' => [
                'tipo'    => 'string',
                'default' => '',
            ],
        ];
    }
}
