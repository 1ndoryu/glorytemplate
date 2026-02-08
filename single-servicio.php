<?php

/**
 * Template Name: Servicio Single React
 * Template Post Type: servicio
 * 
 * Este template se usa automaticamente para los posts del tipo 'servicio'.
 * Renderiza la isla React 'ServicioIndividualIsland' ocupando toda la pagina.
 */

use Glory\Services\ReactIslands;

?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); ?></title>
    <?php wp_head(); ?>
    <style>
        /* Asegurar que el body y html ocupen todo el alto para React */
        html,
        body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }

        #root,
        [id^="react-island-"] {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
    </style>
</head>

<body <?php body_class(); ?> style="display: unset;">
    <?php wp_body_open(); ?>

    <?php
    // Renderizamos la isla React pasando los datos del post actual
    if (class_exists('Glory\\Services\\ReactIslands')) {
        echo ReactIslands::render('ServicioIndividualIsland', [
            'titulo' => get_the_title(),
            'descripcion' => get_the_excerpt() ?: 'Servicio profesional especializado.',
            'precio_desde' => get_post_meta(get_the_ID(), 'precio_desde', true) ?: '$997',
            'slug' => get_post_field('post_name', get_the_ID()),
        ]);
    } else {
        echo '<p style="text-align:center; padding: 2rem;">Error: Servicio ReactIslands no disponible.</p>';
    }
    ?>

    <?php wp_footer(); ?>
</body>

</html>