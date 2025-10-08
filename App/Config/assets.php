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
    '/assets/css/',
    ['deps' => [], 'media' => 'all'],
    'tema-',
    [
        // Excluir CSS específico de tareas; se definirá abajo con feature 'task'
        'task.css'
    ]
);

// Registrar CSS específico de tareas sólo si la feature 'task' está activa
AssetManager::define(
    'style',
    'tema-task',
    '/assets/css/task.css',
    [
        'deps'    => [],
        'media'   => 'all',
        'feature' => 'task',
    ]
);

// Carga todos los archivos JS de la carpeta /assets/js/ del tema, excluyendo la carpeta/archivos de tareas.
AssetManager::defineFolder(
    'script',
    '/assets/js/',
    ['deps' => ['jquery'], 'in_footer' => true],
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
    '/assets/js/task/',
    [
        'deps'     => ['jquery'],
        'in_footer'=> true,
        'feature'  => 'task',
    ],
    'tema-task-'
);
