<?php

use Glory\Manager\AssetManager;



AssetManager::defineFolder(
    'style',
    '/assets/css/',
    ['deps' => [], 'media' => 'all'],
    'tema-',
    ['vizualizacion.css', 'ganancias.css', 'home.css']
);

AssetManager::define(
    'style',
    'tema-home-front',
    '/assets/css/home.css',
    ['media' => 'all', 'area' => 'frontend']
);

AssetManager::define(
    'style',
    'tema-vizualizacion-admin',
    '/assets/css/vizualizacion-admin.css',
    ['media' => 'all', 'area' => 'admin']
);

AssetManager::define(
    'style',
    'tema-vizualizacion-front',
    '/assets/css/vizualizacion.css',
    ['media' => 'all', 'area' => 'frontend']
);

AssetManager::define(
    'style',
    'tema-ganancias-admin',
    '/assets/css/ganancias-admin.css',
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
    'tema-reserva-frontend-logica',
    '/assets/js/glory-reserva-publica.js',
    [
        'deps'      => ['jquery', 'glory-ajax'],
        'in_footer' => true,
        'area'      => 'both',
        'localize'  => [
            'nombreObjeto' => 'dataGlobal',
            'datos'        => [
                'nonce' => wp_create_nonce('globalNonce')
            ]
        ]
    ]
);

//movido la definicion de gloryScheduler y gloryRealtime a Glory/Config/scriptSetup.php donde realmente deberian de estar

AssetManager::define(
    'style',
    'barberos-admin-style',
    '/assets/css/barberos-admin.css',
    [
        'deps' => [],
        'in_footer' => false,
        'area' => 'admin',
    ]
);
