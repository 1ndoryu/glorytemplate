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
 * Casos de éxito - Cosmo Revenue
 * Slug de rewrite 'caso' (singular) para evitar conflicto con la pagina /casos/
 */
PostTypeManager::define(
    'casos',
    [
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'casos',
        'has_archive' => false,
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'menu_icon' => 'dashicons-building',
        'rewrite' => ['slug' => 'caso', 'with_front' => false],
    ],
    'Casos',
    'Casos'
);

/*
 * Registrar meta fields del CPT casos para exposición en REST API.
 * Cada meta se registra individualmente con show_in_rest para que
 * tanto ReactContentProvider (server-side) como el fallback REST
 * puedan acceder a los datos.
 */
add_action('init', function () {
    $metaFields = [
        'caso_tipo',
        'caso_ubicacion',
        'caso_valor',
        'caso_descripcion',
        'caso_cliente',
        'caso_servicios',
        'caso_duracion',
        'caso_cita',
        'caso_cita_autor',
        'caso_resultados',
    ];

    foreach ($metaFields as $field) {
        register_post_meta('casos', $field, [
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ]);
    }
});


