<?php
use Glory\Manager\PostTypeManager;

PostTypeManager::define(
    'reserva',
    [
        'public' => false,
        'publicly_queryable' => false,
        'show_ui' => true,
        'show_in_menu' => false,
        'supports' => ['title'],
        'rewrite' => false,
    ],
    'Reserva',
    'Reservas'
);

register_taxonomy('servicio', 'reserva', [
    'label' => 'Servicios',
    'rewrite' => ['slug' => 'servicio'],
    'hierarchical' => true,
    'public' => true,
    'show_ui' => true,
    'show_admin_column' => true,
]);

register_taxonomy('barbero', 'reserva', [
    'label' => 'Barberos',
    'rewrite' => ['slug' => 'barbero'],
    'hierarchical' => true,
    'public' => true,
    'show_ui' => true,
    'show_admin_column' => true,
]);

add_action('init', function() {
    register_term_meta('servicio', 'precio', [
        'type' => 'number',
        'description' => 'Precio del servicio',
        'single' => true,
        'show_in_rest' => true,
    ]);
    register_term_meta('servicio', 'duracion', [
        'type' => 'number',
        'description' => 'Duración del servicio en minutos',
        'single' => true,
        'show_in_rest' => true,
    ]);
});