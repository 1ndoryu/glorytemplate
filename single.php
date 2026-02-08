<?php

/**
 * Single Post Template (Blog)
 * 
 * Renderiza posts nativos de WordPress (type = post) usando la
 * isla React 'BlogSingleIsland'.
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
        $imagenDestacada = '';
        if (has_post_thumbnail()) {
            $imagenDestacada = get_the_post_thumbnail_url(get_the_ID(), 'large');
        }

        $categorias = get_the_category();
        $categoriaNombre = !empty($categorias) ? $categorias[0]->name : '';

        echo ReactIslands::render('BlogSingleIsland', [
            'slug'      => get_post_field('post_name', get_the_ID()),
            'titulo'    => get_the_title(),
            'contenido' => apply_filters('the_content', get_the_content()),
            'fecha'     => get_the_date('M j, Y'),
            'categoria' => $categoriaNombre,
            'imagen'    => $imagenDestacada,
        ]);
    } else {
        echo '<p style="text-align:center; padding: 2rem;">Error: ReactIslands no disponible.</p>';
    }
    ?>

    <?php wp_footer(); ?>
</body>

</html>
