<?php

use Glory\Manager\PostTypeManager;

/*
 * Cresta Campers — Custom Post Types
 */

PostTypeManager::define(
    'vehiculo',
    [
        'public'       => true,
        'has_archive'  => true,
        'supports'     => ['title', 'editor', 'thumbnail'],
        'menu_icon'    => 'dashicons-car',
        'rewrite'      => ['slug' => 'flota'],
        'show_in_rest' => true,
    ],
    'Vehículo',
    'Vehículos',
    [
        '_vehiculo_nombre'               => '',
        '_vehiculo_descripcion_corta'     => '',
        '_vehiculo_capacidad'             => 2,
        '_vehiculo_plazas_viaje'          => 2,
        '_vehiculo_combustible'           => 'diesel',
        '_vehiculo_transmision'           => 'manual',
        '_vehiculo_equipamiento'          => '[]',
        '_vehiculo_galeria'               => '[]',
        '_vehiculo_precio_base'           => 0,
        '_vehiculo_activo'                => '1',
        '_vehiculo_ubicacion'             => '',
        '_vehiculo_politica_cancelacion'  => 'estandar',
        '_vehiculo_fianza'                => 0,
        '_vehiculo_km_incluidos'          => 0,
        '_vehiculo_edad_minima'           => 21,
    ]
);

PostTypeManager::define(
    'reserva',
    [
        'public'              => false,
        'has_archive'         => false,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'supports'            => ['title'],
        'menu_icon'           => 'dashicons-calendar-alt',
        'exclude_from_search' => true,
        'publicly_queryable'  => false,
        'show_in_rest'        => false,
    ],
    'Reserva',
    'Reservas',
    [
        '_reserva_vehiculo_id'         => 0,
        '_reserva_fecha_inicio'        => '',
        '_reserva_fecha_fin'           => '',
        '_reserva_noches'              => 0,
        '_reserva_precio_noche'        => 0,
        '_reserva_precio_total'        => 0,
        '_reserva_estado'              => 'pendiente',
        '_reserva_nombre_cliente'      => '',
        '_reserva_email_cliente'       => '',
        '_reserva_telefono_cliente'    => '',
        '_reserva_stripe_session_id'   => '',
        '_reserva_stripe_payment_intent' => '',
        '_reserva_notas'               => '',
        '_reserva_temporada'           => '',
    ]
);


