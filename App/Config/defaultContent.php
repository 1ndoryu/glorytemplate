<?php
use Glory\Manager\DefaultContentManager;

// Sincronización de Taxonomías y sus metadatos
add_action('init', function () {
    $taxonomies_data = [
        'barbero' => [
            ['nombre' => 'Elkin'],
            ['nombre' => 'Juan'],
            ['nombre' => 'Pedro'],
        ],
        'servicio' => [
            ['nombre' => 'Corte de pelo', 'meta' => ['precio' => 15, 'duracion' => 30]],
            ['nombre' => 'Corte extra degradado', 'meta' => ['precio' => 18, 'duracion' => 45]],
            ['nombre' => 'Arreglo de barba', 'meta' => ['precio' => 10, 'duracion' => 15]],
            ['nombre' => 'Corte y arreglo de barba', 'meta' => ['precio' => 22, 'duracion' => 45]],
            ['nombre' => 'Afeitado de cabeza', 'meta' => ['precio' => 12, 'duracion' => 30]],
            ['nombre' => 'Tinte de pelo', 'meta' => ['precio' => 25, 'duracion' => 60]],
        ]
    ];

    foreach ($taxonomies_data as $tax_slug => $terms) {
        foreach ($terms as $term_data) {
            $term = term_exists($term_data['nombre'], $tax_slug);
            if (!$term) {
                $term = wp_insert_term($term_data['nombre'], $tax_slug);
            }

            if (!is_wp_error($term) && isset($term_data['meta'])) {
                $term_id = $term['term_id'];
                foreach ($term_data['meta'] as $meta_key => $meta_value) {
                    // Check if meta exists before adding to avoid duplicates on re-runs
                    if (!get_term_meta($term_id, $meta_key, true)) {
                        add_term_meta($term_id, $meta_key, $meta_value, true);
                    }
                }
            }
        }
    }
}, 20);


// Definición de Reservas de Ejemplo
DefaultContentManager::define('reserva', [
    [
        'slugDefault' => 'reserva-ejemplo-1',
        'titulo'      => 'Carlos Sánchez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-06',
            'hora_reserva'     => '10:00',
            'telefono_cliente' => '611223344',
            'correo_cliente'   => 'carlos.sanchez@email.com',
            'servicio'         => 'Corte de pelo',
            'barbero'          => 'Elkin',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-2',
        'titulo'      => 'Laura Gómez',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-06',
            'hora_reserva'     => '11:30',
            'telefono_cliente' => '622334455',
            'correo_cliente'   => 'laura.gomez@email.com',
            'servicio'         => 'Corte y arreglo de barba',
            'barbero'          => 'Juan',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-3',
        'titulo'      => 'Miguel Fernández',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-07',
            'hora_reserva'     => '16:00',
            'telefono_cliente' => '633445566',
            'correo_cliente'   => 'miguel.fernandez@email.com',
            'servicio'         => 'Afeitado de cabeza',
            'barbero'          => 'Pedro',
        ],
    ],
    [
        'slugDefault' => 'reserva-ejemplo-4',
        'titulo'      => 'Sofía Martín',
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-07',
            'hora_reserva'     => '17:00',
            'telefono_cliente' => '644556677',
            'correo_cliente'   => 'sofia.martin@email.com',
            'servicio'         => 'Tinte de pelo',
            'barbero'          => 'Elkin',
        ],
    ],
     [
        'slugDefault' => 'reserva-ejemplo-5',
        'titulo'      => 'Carlos Sánchez', // Repeated client
        'metaEntrada' => [
            'fecha_reserva'    => '2025-08-10',
            'hora_reserva'     => '12:00',
            'telefono_cliente' => '611223344',
            'correo_cliente'   => 'carlos.sanchez@email.com',
            'servicio'         => 'Arreglo de barba',
            'barbero'          => 'Juan',
        ],
    ],
]);