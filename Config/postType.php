<?php

use Glory\Manager\PostTypeManager;

PostTypeManager::define(
    'brand',
    [
        'public' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'publicly_queryable' => false,
        'exclude_from_search' => true,
        'has_archive' => false,
        'rewrite' => false,
        'query_var' => false,
        'show_in_rest' => false,
        'supports' => ['title', 'thumbnail'],
        'menu_icon' => 'dashicons-tag',
    ],
    'Marca',
    'Marcas'
);
