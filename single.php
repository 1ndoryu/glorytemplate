<?php

/**
 * Template para single posts.
 * 
 * Renderiza posts individuales usando la aplicacion React SPA.
 * El router de React (AppRouter) detecta la URL /blog/:slug
 * y renderiza SinglePostIsland con el contenido del post.
 * 
 * El contenido del post se inyecta via ReactContentProvider en
 * App/Content/reactContent.php
 */

use Glory\Services\ReactIslands;

?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>

<body <?php body_class('glory-react-fullpage glory-single-post'); ?>>
    <?php wp_body_open(); ?>

    <?php
    // Renderizar la aplicacion React
    // El router detectará que es /blog/:slug y renderizará SinglePostIsland
    echo ReactIslands::render('MainAppIsland');
    ?>

    <?php wp_footer(); ?>
</body>

</html>