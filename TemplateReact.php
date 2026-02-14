<?php

/**
 * Template Name: Glory React Template
 *
 * Template minimalista para paginas 100% React.
 * NO incluye header/footer de WordPress.
 * React maneja todo el layout.
 * 
 * Uso con PageManager:
 *   PageManager::define('mi-pagina', 'miFuncion', 'TemplateReact.php');
 * 
 * Uso con registerReactFullPages (automatico):
 *   PageManager::registerReactFullPages(['home', 'servicios']);
 */

use Glory\Manager\PageManager;
use Glory\Services\ReactIslands;

// Obtener la funcion a renderizar
$funcionRenderizar = PageManager::getFuncionParaRenderizar();

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>

<body style="display: unset;">
    <?php wp_body_open(); ?>

    <?php
    if ($funcionRenderizar && is_callable($funcionRenderizar)) {
        // Llamar a la funcion que renderiza la isla React
        call_user_func($funcionRenderizar);
    } else {
        // Fallback: Mostrar mensaje de error
        echo '<div style="padding: 40px; text-align: center;">';
        echo '<h1>Pagina React no configurada</h1>';
        if (current_user_can('manage_options')) {
            echo '<p>Funcion esperada: <strong>' . esc_html($funcionRenderizar) . '</strong></p>';
            echo '<p>Asegurate de que la funcion exista y este cargada.</p>';
        }
        echo '</div>';
    }
    ?>

    <?php wp_footer(); ?>
</body>

</html>