<?php
/**
 * Template Name: Glory Central Template
 *
 * Este template central renderiza las páginas definidas a través de funciones en PageManager.
 */

use Glory\Manager\PageManager;
// Compat Elementor: no usar import directo para evitar errores si no está activo

get_header();

$funcionRenderizar = PageManager::getFuncionParaRenderizar();

// Si Elementor Theme Builder define la ubicación 'single', dejar que renderice
if (function_exists('elementor_theme_do_location') && elementor_theme_do_location('single')) {
    get_footer();
    return;
}

// Detectar Elementor y modo edición del editor
$elementorCargado = did_action('elementor/loaded');
$estaEnModoEdicion = false;
$elementorInstance = null;
if ($elementorCargado && class_exists('Elementor\\Plugin')) {
    $elementorInstance = \Elementor\Plugin::instance();
    if ($elementorInstance && isset($elementorInstance->editor) && method_exists($elementorInstance->editor, 'is_edit_mode')) {
        $estaEnModoEdicion = $elementorInstance->editor->is_edit_mode();
    }
}

if (have_posts()) {
    while (have_posts()) {
        the_post();

        $postId = get_the_ID();
        $construidoConElementor = false;
        if ($elementorInstance && isset($elementorInstance->db) && method_exists($elementorInstance->db, 'is_built_with_elementor')) {
            $construidoConElementor = $elementorInstance->db->is_built_with_elementor($postId);
        }

        if ($estaEnModoEdicion || $construidoConElementor) {
            // Elementor engancha filtros de the_content; esto evita el error "content area not found"
            the_content();
        } elseif ($funcionRenderizar && function_exists($funcionRenderizar)) {
            // Render propio del tema cuando no es Elementor
            call_user_func($funcionRenderizar);
        } else {
            // Fallback a contenido estándar
            the_content();
        }
    }
} else {
    echo '<h1>Error: Página no configurada correctamente.</h1>';
    if (current_user_can('manage_options')) {
        echo '<p>Función de renderizado esperada: <strong>' . esc_html($funcionRenderizar) . '</strong> no fue encontrada.</p>';
        echo '<p>Asegúrate de que la función exista y esté cargada correctamente.</p>';
    }
}

get_footer();
