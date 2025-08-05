<?php

use Glory\Manager\AssetManager;



AssetManager::defineFolder(
    'style',
    '/assets/css/',
    ['deps' => [], 'media' => 'all'],
    'tema-',
    ['vizualizacion.css', 'ganancias.css']
);

AssetManager::define(
    'style',
    'tema-vizualizacion-admin',
    '/assets/css/vizualizacion.css',
    ['media' => 'all', 'area' => 'admin']
);

AssetManager::define(
    'style',
    'tema-ganancias-admin',
    '/assets/css/ganancias.css',
    ['media' => 'all', 'area' => 'admin']
);

AssetManager::defineFolder(
    'script',
    '/assets/js/',
    ['deps' => ['jquery'], 'in_footer' => true],
    'tema-'
);

// SCRIPT FOR AJAX FUNCTIONALITY (Needed by the form modal in admin)
AssetManager::define(
    'script',
    'glory-ajax-admin',
    '/Glory/assets/js/genericAjax/gloryAjax.js',
    ['deps' => [], 'in_footer' => true, 'area' => 'admin']
);

// SCRIPT FOR DYNAMIC TIME SLOTS IN THE RESERVATION MODAL
AssetManager::define(
    'script',
    'tema-reserva-admin-logica',
    '/assets/js/glory-reserva-publica.js',
    ['deps' => ['jquery', 'glory-ajax-admin'], 'in_footer' => true, 'area' => 'admin']
);
