<?php

use Glory\Manager\DefaultContentManager;

/*
 * Cresta Campers — Contenido por defecto
 * Vehículo semilla para desarrollo.
 */

DefaultContentManager::define('vehiculo', [
    [
        'slugDefault' => 'cresta-one',
        'titulo'      => 'Cresta One',
        'contenido'   => 'Nuestra primera furgoneta camper, completamente equipada para tu aventura. Cocina, nevera, cama doble, calefacción estacionaria y mucho más. Perfecta para parejas o familias pequeñas que buscan libertad en la carretera.',
        'meta'        => [
            '_vehiculo_nombre'               => 'Cresta One',
            '_vehiculo_descripcion_corta'     => 'Furgoneta camper equipada para 2 personas. Cocina, nevera, calefacción y todo lo que necesitas.',
            '_vehiculo_capacidad'             => 2,
            '_vehiculo_plazas_viaje'          => 4,
            '_vehiculo_combustible'           => 'diesel',
            '_vehiculo_transmision'           => 'manual',
            '_vehiculo_equipamiento'          => json_encode([
                'Cocina con fogón',
                'Nevera portátil',
                'Calefacción estacionaria',
                'Cama doble',
                'Mesa plegable',
                'Ducha exterior',
                'Toldo lateral',
                'Batería auxiliar',
                'Paneles solares',
                'Agua caliente',
            ]),
            '_vehiculo_galeria'               => '[]',
            '_vehiculo_precio_base'           => 89,
            '_vehiculo_activo'                => '1',
            '_vehiculo_ubicacion'             => 'Madrid',
            '_vehiculo_politica_cancelacion'  => 'estandar',
            '_vehiculo_fianza'                => 500,
            '_vehiculo_km_incluidos'          => 250,
            '_vehiculo_edad_minima'           => 21,
        ],
    ],
]);

