<?php

/**
 * Template para single de Proyecto
 * Template Post Type: proyecto
 * 
 * Renderiza la isla React 'ProyectoIndividualIsland' con los datos del proyecto.
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
    if (class_exists('Glory\\Services\\ReactIslands')) {
        $categorias_raw = get_post_meta(get_the_ID(), 'categorias', true);
        $categorias = is_array($categorias_raw) ? implode(', ', $categorias_raw) : ($categorias_raw ?: '');

        echo ReactIslands::render('ProyectoIndividualIsland', [
            'titulo' => get_the_title(),
            'descripcion' => get_the_excerpt() ?: '',
            'cliente' => get_post_meta(get_the_ID(), 'cliente', true) ?: '',
            'categorias' => $categorias,
            'imagen' => get_the_post_thumbnail_url(get_the_ID(), 'full') ?: '',
            'slug' => get_post_field('post_name', get_the_ID()),
        ]);
    } else {
        echo '<p style="text-align:center; padding: 2rem;">Error: Servicio ReactIslands no disponible.</p>';
    }
    ?>

    <?php wp_footer(); ?>
</body>

</html>
