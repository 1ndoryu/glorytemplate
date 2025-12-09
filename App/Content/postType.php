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


//portfolio
PostTypeManager::define(
    'portfolio',
    [
        'public' => true,
        'has_archive' => true,
        'supports' => ['title', 'editor', 'thumbnail'],
        'menu_icon' => 'dashicons-portfolio',
    ],
    'Portafolio',
    'Portafolios'
);
//Services 
PostTypeManager::define(
    'services',
    [
        'public' => true,
        'has_archive' => true,
        'supports' => ['title', 'editor', 'thumbnail'],
        'menu_icon' => 'dashicons-services',
    ],
    'Services',
    'Services'
);

//Casos
// Nota: El slug de rewrite es 'caso' (singular) para evitar conflicto con la pagina /casos/
// Los posts individuales usaran: /caso/nombre-del-caso/
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
