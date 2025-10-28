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

// Optimización de jQuery: mover al footer, quitar jquery-migrate y aplicar defer
add_action('wp_default_scripts', function ($scripts) {
    if (is_admin()) { return; }
    if (!isset($scripts->registered['jquery'])) { return; }
    $scripts->registered['jquery']->deps = array_values(array_diff(
        $scripts->registered['jquery']->deps ?? [],
        ['jquery-migrate']
    ));
});

add_action('wp_enqueue_scripts', function () {
    if (is_admin()) { return; }
    if (wp_script_is('jquery', 'registered')) {
        wp_script_add_data('jquery', 'group', 1); // 1 => footer
    }
    if (wp_script_is('jquery-core', 'registered')) {
        wp_script_add_data('jquery-core', 'group', 1);
    }
}, 0);

add_filter('script_loader_tag', function ($tag, $handle) {
    if (is_admin()) { return $tag; }
    if ($handle === 'jquery' || $handle === 'jquery-core') {
        if (strpos($tag, ' defer') === false) {
            $tag = str_replace(' src=', ' defer src=', $tag);
        }
    }
    return $tag;
}, 10, 2);

