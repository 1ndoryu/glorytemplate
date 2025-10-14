<?php

use Glory\Manager\AssetManager;

/**
 * Registro de Assets Específicos del Tema
 *
 * Este archivo se encarga de definir todos los scripts (JS) y estilos (CSS)
 * que pertenecen exclusivamente al tema activo, separando las responsabilidades
 * del framework Glory.
 */


AssetManager::defineFolder(
    'style',
    '/App/assets/css/',
    ['deps' => [], 'media' => 'all'],
    'tema-',
    [

    ]
);


AssetManager::defineFolder(
    'script',
    '/App/assets/js/',
    ['deps' => ['jquery'], 'in_footer' => true],
    'tema-',
    [

    ]
);
