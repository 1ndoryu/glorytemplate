<?php

use Glory\Manager\AssetManager;

/**
 * Registro de Assets Específicos del Tema
 *
 * Este archivo se encarga de definir todos los scripts (JS) y estilos (CSS)
 * que pertenecen exclusivamente al tema activo, separando las responsabilidades
 * del framework Glory.
 */

// Carga todos los archivos CSS de la carpeta /assets/css/ del tema, excluyendo el CSS de tareas.
AssetManager::defineFolder(
    'style',
    'App/Assets/css/',
    ['deps' => [], 'media' => 'all', 'exclude_on' => ['gbn-control-panel']],
    'tema-',
    [
        // Excluir CSS específico de tareas; se definirá abajo con feature 'task'
        'task.css',
        'cache_buster.css', // Forzar regeneración de caché
        'casos.css',
        'about.css',
        'contact.css',
        'service-detail.css'
    ]
);

// Registrar CSS de Contacto manualmente para asegurar carga
AssetManager::define(
    'style',
    'tema-contact',
    '/App/Assets/css/contact.css',
    [
        'deps'    => [],
        'media'   => 'all',
        'exclude_on' => ['gbn-control-panel'],
    ]
);

// Registrar CSS específico de tareas sólo si la feature 'task' está activa
AssetManager::define(
    'style',
    'tema-task',
    '/App/Assets/css/task.css',
    [
        'deps'    => [],
        'media'   => 'all',
        'feature' => 'task',
        'exclude_on' => ['gbn-control-panel'],
    ]
);

// Registrar CSS de Casos de Éxito manualmente para asegurar carga
AssetManager::define(
    'style',
    'tema-casos',
    '/App/Assets/css/casos.css',
    [
        'deps'    => [],
        'media'   => 'all',
        'exclude_on' => ['gbn-control-panel'],
    ]
);

// Registrar CSS de About (Sobre Nosotros) manualmente
AssetManager::define(
    'style',
    'tema-about',
    '/App/Assets/css/about.css',
    [
        'deps'    => [],
        'media'   => 'all',
        'exclude_on' => ['gbn-control-panel'],
    ]
);

// Registrar CSS de paginas de detalle de servicios
AssetManager::define(
    'style',
    'tema-service-detail',
    '/App/Assets/css/service-detail.css',
    [
        'deps'    => [],
        'media'   => 'all',
        'exclude_on' => ['gbn-control-panel'],
    ]
);

// Registrar JS de About para alinear markers en mobile
AssetManager::define(
    'script',
    'tema-about-align',
    '/App/Assets/js/about-align.js',
    [
        'deps'       => [],
        'in_footer'  => true,
        'exclude_on' => ['gbn-control-panel'],
    ]
);

// Carga todos los archivos JS de la carpeta /assets/js/ del tema, excluyendo la carpeta/archivos de tareas.
AssetManager::defineFolder(
    'script',
    'App/Assets/js/',
    ['deps' => ['jquery'], 'in_footer' => true, 'exclude_on' => ['gbn-control-panel']],
    'tema-',
    [
        // Excluir los JS de tareas; se registran abajo con feature 'task'
        'icons.js',
        'taskCal.js',
        'taskCore.js',
        'taskCRUD.js',
        'taskDates.js',
        'taskEnter.js',
        'taskmove.js',
        'taskProperties.js',
        'taskSesiones.js',
        'taskUtils.js'
    ]
);

// Registrar todos los JS de la carpeta /assets/js/task/ con la feature 'task'
AssetManager::defineFolder(
    'script',
    'App/Assets/js/task/',
    [
        'deps'     => ['jquery'],
        'in_footer' => true,
        'feature'  => 'task',
        'exclude_on' => ['gbn-control-panel'],
    ],
    'tema-task-'
);
