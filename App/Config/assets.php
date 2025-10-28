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
        'task.css',
        // Evitar cargar tweaks de Elementor Admin en el frontend (existe en App/Assets/css)
        'admin-elementor.css'
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

// Optimización de jQuery: quitar jquery-migrate (mantener jQuery en el head para compatibilidad)
add_action('wp_default_scripts', function ($scripts) {
    if (is_admin()) { return; }
    if (!isset($scripts->registered['jquery'])) { return; }
    $scripts->registered['jquery']->deps = array_values(array_diff(
        $scripts->registered['jquery']->deps ?? [],
        ['jquery-migrate']
    ));
});

// Hacer jQuery no bloqueante en el head (manteniendo compatibilidad)
add_filter('script_loader_tag', function ($tag, $handle) {
    if (in_array($handle, ['jquery', 'jquery-core'], true)) {
        if (strpos($tag, ' defer') === false) {
            $tag = str_replace(' src=', ' defer src=', $tag);
        }
    }
    return $tag;
}, 10, 2);

