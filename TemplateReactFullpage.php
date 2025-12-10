<?php

/**
 * Template Name: Glory React Fullpage
 *
 * Template especial para paginas que usan React como layout completo.
 * NO incluye header.php ni footer.php de WordPress.
 * El componente React controla todo el layout.
 */

use Glory\Manager\PageManager;

// Obtener la funcion de renderizado
$funcionRenderizar = PageManager::getFuncionParaRenderizar();
$postId = get_queried_object_id();
$modo = $postId ? PageManager::getModoContenidoParaPagina((int) $postId) : 'code';
?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>

<body <?php body_class('glory-react-fullpage'); ?>>
    <?php wp_body_open(); ?>

    <?php
    if ($modo === 'editor') {
        // Si esta en modo editor, mostrar contenido del editor
        while (have_posts()) {
            the_post();
            the_content();
        }
    } elseif ($funcionRenderizar && is_callable($funcionRenderizar)) {
        // Llamar a la funcion de renderizado (que debe usar ReactIslands::render)
        call_user_func($funcionRenderizar);
    } else {
        echo '<h1>Error: Pagina no configurada correctamente.</h1>';
    }
    ?>

    <?php wp_footer(); ?>
</body>

</html>