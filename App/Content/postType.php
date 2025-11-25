<?php

use Glory\Manager\PostTypeManager;

// CPT para marcas (brands) usado por el DefaultContent
PostTypeManager::define(
    'brand',
    [
        // Dejo labels en blanco para usar la generación automática en español
        'public'       => true,
        'show_ui'      => true,
        'show_in_menu' => true,
        'has_archive'  => false,
        'rewrite'      => [
            'slug'       => 'brand',
            'with_front' => false,
        ],
        // Soportes básicos: título, editor y thumbnail (se rellenan por defecto,
        // pero los dejo explícitos por claridad)
        'supports' => ['title', 'editor', 'thumbnail'],
    ],
    'Marca',
    'Marcas'
);
