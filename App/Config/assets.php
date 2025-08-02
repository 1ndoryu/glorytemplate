<?php

use Glory\Core\AssetManager;

/**
 * Registro de Assets Específicos del Tema
 *
 * Este archivo se encarga de definir todos los scripts (JS) y estilos (CSS)
 * que pertenecen exclusivamente al tema activo, separando las responsabilidades
 * del framework Glory.
 */

// Carga todos los archivos CSS de la carpeta /assets/css/ del tema.
AssetManager::defineFolder(
    'style',
    '/assets/css/',
    ['deps' => [], 'media' => 'all'],
    'tema-'
);

// Carga todos los archivos JS de la carpeta /assets/js/ del tema.
AssetManager::defineFolder(
    'script',
    '/assets/js/',
    ['deps' => ['jquery'], 'in_footer' => true],
    'tema-'
);