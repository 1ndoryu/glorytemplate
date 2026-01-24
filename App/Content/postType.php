<?php

use Glory\Manager\PostTypeManager;

PostTypeManager::define(
    'libro',
    [
        'public' => true,
        'has_archive' => true,
        'supports' => ['title', 'editor', 'thumbnail'],
        'menu_icon' => 'dashicons-book',
    ],
    'Libro',
    'Libros'
);

PostTypeManager::define(
    'tarea',
    [
        'public' => true,
        'has_archive' => false,
        'supports' => ['title', 'editor'],
        'menu_icon' => 'dashicons-clipboard',
    ],
    'Tarea',
    'Tareas'
);

/*
 * CPTs del Sistema de Facturación
 * Fase 11 - Integración WordPress Real
 */

/* Servicios Publicados - Catálogo de la agencia */
PostTypeManager::define(
    'glory_servicio',
    [
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'thumbnail', 'author', 'custom-fields'],
        'menu_icon' => 'dashicons-products',
        'rewrite' => ['slug' => 'servicios'],
        'capability_type' => 'post',
    ],
    'Servicio',
    'Servicios',
    [
        '_precio' => 0,
        '_tiempo_entrega_dias' => 30,
        '_categoria' => 'diseno_web',
        '_incluye_hosting_meses' => 0,
        '_incluye_dominio' => false,
        '_activo' => true,
    ]
);

/* Trabajos Contratados - Servicios en progreso por clientes */
PostTypeManager::define(
    'glory_trabajo',
    [
        'public' => false,
        'has_archive' => false,
        'show_in_rest' => true,
        'supports' => ['title', 'author', 'custom-fields'],
        'menu_icon' => 'dashicons-hammer',
        'capability_type' => 'post',
    ],
    'Trabajo',
    'Trabajos',
    [
        '_servicio_publicado_id' => 0,
        '_proveedor_id' => 0,
        '_estado' => 'pendiente',
        '_progreso_porcentaje' => 0,
        '_fecha_contratacion' => '',
        '_fecha_entrega_estimada' => '',
        '_precio_acordado' => 0,
        '_revisiones_restantes' => 3,
        '_factura_id' => null,
    ]
);

/* Facturas - Documentos de cobro */
PostTypeManager::define(
    'glory_factura',
    [
        'public' => false,
        'has_archive' => false,
        'show_in_rest' => true,
        'supports' => ['title', 'author', 'custom-fields'],
        'menu_icon' => 'dashicons-media-text',
        'capability_type' => 'post',
    ],
    'Factura',
    'Facturas',
    [
        '_items' => '[]',
        '_subtotal' => 0,
        '_impuestos' => 0,
        '_total' => 0,
        '_estado' => 'pendiente',
        '_fecha_emision' => '',
        '_fecha_vencimiento' => '',
        '_stripe_payment_id' => null,
    ]
);

/* Hostings Contratados */
PostTypeManager::define(
    'glory_hosting',
    [
        'public' => false,
        'has_archive' => false,
        'show_in_rest' => true,
        'supports' => ['title', 'author', 'custom-fields'],
        'menu_icon' => 'dashicons-cloud',
        'capability_type' => 'post',
    ],
    'Hosting',
    'Hostings',
    [
        '_dominio' => '',
        '_dominio_temporal' => null,
        '_stack_uuid' => '',
        '_plan' => 'mensual',
        '_precio_mensual' => 3,
        '_fecha_inicio' => '',
        '_fecha_renovacion' => '',
        '_estado' => 'activo',
        '_pagado' => false,
    ]
);

/* Dominios Contratados */
PostTypeManager::define(
    'glory_dominio',
    [
        'public' => false,
        'has_archive' => false,
        'show_in_rest' => true,
        'supports' => ['title', 'author', 'custom-fields'],
        'menu_icon' => 'dashicons-admin-site',
        'capability_type' => 'post',
    ],
    'Dominio',
    'Dominios',
    [
        '_dominio' => '',
        '_registrador' => 'namecheap',
        '_fecha_registro' => '',
        '_fecha_expiracion' => '',
        '_precio_anual' => 11,
        '_auto_renovacion' => true,
        '_estado' => 'activo',
        '_pagado' => false,
    ]
);
