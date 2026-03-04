<?php

namespace App\Config\Schema;

use Glory\Contracts\PostTypeSchema;

/**
 * Schema del CPT Vehículo.
 * Define todos los meta fields tipados para vehículos de alquiler.
 */
class VehiculoSchema extends PostTypeSchema
{
    public function postType(): string
    {
        return 'vehiculo';
    }

    public function meta(): array
    {
        return [
            '_vehiculo_nombre' => [
                'tipo'     => 'string',
                'required' => true,
                'max'      => 200,
            ],
            '_vehiculo_descripcion_corta' => [
                'tipo'     => 'text',
                'required' => false,
                'max'      => 500,
            ],
            '_vehiculo_capacidad' => [
                'tipo'    => 'int',
                'default' => 2,
            ],
            '_vehiculo_plazas_viaje' => [
                'tipo'    => 'int',
                'default' => 2,
            ],
            '_vehiculo_combustible' => [
                'tipo'    => 'string',
                'default' => 'diesel',
            ],
            '_vehiculo_transmision' => [
                'tipo'    => 'string',
                'default' => 'manual',
            ],
            '_vehiculo_equipamiento' => [
                'tipo'    => 'json',
                'default' => [],
            ],
            '_vehiculo_galeria' => [
                'tipo'    => 'json',
                'default' => [],
            ],
            '_vehiculo_precio_base' => [
                'tipo'     => 'float',
                'required' => true,
                'default'  => 0,
            ],
            '_vehiculo_activo' => [
                'tipo'    => 'bool',
                'default' => true,
            ],
            '_vehiculo_ubicacion' => [
                'tipo'    => 'string',
                'default' => '',
            ],
            '_vehiculo_politica_cancelacion' => [
                'tipo'    => 'string',
                'default' => 'estandar',
            ],
            '_vehiculo_fianza' => [
                'tipo'    => 'float',
                'default' => 0,
            ],
            '_vehiculo_km_incluidos' => [
                'tipo'    => 'int',
                'default' => 0,
            ],
            '_vehiculo_edad_minima' => [
                'tipo'    => 'int',
                'default' => 21,
            ],
        ];
    }
}
