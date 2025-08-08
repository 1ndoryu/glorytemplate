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

AssetManager::define(
    'style',
    'tema-reservas-admin',
    '/assets/css/reservas-admin.css',
    ['media' => 'all', 'area' => 'admin']
);

AssetManager::defineFolder(
    'script',
    '/assets/js/',
    ['deps' => ['jquery'], 'in_footer' => true],
    'tema-'
);

// SCRIPT FOR DYNAMIC TIME SLOTS IN THE RESERVATION MODAL
AssetManager::define(
    'script',
    'tema-reserva-admin-logica',
    '/assets/js/glory-reserva-publica.js',
    [
        'deps'      => ['jquery', 'glory-ajax'],
        'in_footer' => true,
        'area'      => 'admin',
        'localize'  => [
            'nombreObjeto' => 'dataGlobal',
            'datos'        => [
                'nonce' => wp_create_nonce('globalNonce')
            ]
        ]
    ]
);

AssetManager::define(
    'script',
    'glory-scheduler-admin',
    '/Glory/assets/js/UI/gloryScheduler.js',
    [
        'deps'      => [],
        'in_footer' => true,
        'area'      => 'admin',
        'feature'   => 'scheduler',
    ]
);
