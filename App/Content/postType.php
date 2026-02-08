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
 * Servicio: has_archive desactivado porque la página de listado
 * la maneja PageManager::reactPage('servicios', ...) en pages.php.
 * Esto evita conflicto de rewrite con la URL /servicios/.
 */
PostTypeManager::define(
    'servicio',
    [
        'public' => true,
        'show_in_rest' => true,
        'has_archive' => false,
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
        'menu_icon' => 'dashicons-grid-view',
        'rewrite' => ['slug' => 'servicios']
    ],
    'Servicio',
    'Servicios'
);

/*
 * Proyecto: portfolio/showcase del sitio.
 * Single pages en /proyectos/slug/
 */
PostTypeManager::define(
    'proyecto',
    [
        'public' => true,
        'show_in_rest' => true,
        'has_archive' => false,
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
        'menu_icon' => 'dashicons-portfolio',
        'rewrite' => ['slug' => 'proyectos']
    ],
    'Proyecto',
    'Proyectos'
);

/*
 * Testimonio: reseñas/opiniones de clientes.
 * No tiene single page, solo se usa en el contexto React.
 */
PostTypeManager::define(
    'testimonio',
    [
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => true,
        'has_archive' => false,
        'supports' => ['title', 'editor', 'thumbnail'],
        'menu_icon' => 'dashicons-format-quote',
        'rewrite' => false
    ],
    'Testimonio',
    'Testimonios'
);

/*
 * Marca: logos de clientes/aliados.
 * No tiene single page, solo se usa en el contexto React.
 */
PostTypeManager::define(
    'marca',
    [
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => true,
        'has_archive' => false,
        'supports' => ['title', 'thumbnail'],
        'menu_icon' => 'dashicons-awards',
        'rewrite' => false
    ],
    'Marca',
    'Marcas'
);

/*
 * Miembro: equipo del sitio para la página Nosotros.
 * No tiene single page por ahora.
 */
PostTypeManager::define(
    'miembro',
    [
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => true,
        'has_archive' => false,
        'supports' => ['title', 'editor', 'thumbnail'],
        'menu_icon' => 'dashicons-groups',
        'rewrite' => false
    ],
    'Miembro',
    'Miembros'
);


