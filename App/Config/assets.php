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
    'App/Assets/css/task.css',
    [
        'deps'    => [],
        'media'   => 'all',
        'feature' => 'task',
    ]
);

