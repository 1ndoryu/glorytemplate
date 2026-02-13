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
        'has_archive' => false,
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
        'menu_icon' => 'dashicons-building',
        'rewrite' => ['slug' => 'caso', 'with_front' => false],
    ],
    'Casos',
    'Casos'
);


