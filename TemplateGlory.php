<?php

/**
 * Template Name: Glory Central Template
 *
 * Este template central renderiza las páginas definidas a través de funciones en PageManager.
 */

use Glory\Manager\PageManager;

// Obtener parametros de renderizado
$funcionRenderizar = PageManager::getFuncionParaRenderizar();
$postId = get_queried_object_id();
$modo = $postId ? PageManager::getModoContenidoParaPagina((int) $postId) : 'code';

// Para paginas React fullpage, verificar meta o slug especifico
$slug = get_post_field('post_name', $postId);
$isReactFullpage = PageManager::isReactFullPage($slug);

if ($isReactFullpage) {
    // React fullpage: HTML completo sin header/footer de WordPress
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
        if ($funcionRenderizar && is_callable($funcionRenderizar)) {
            call_user_func($funcionRenderizar);
        } else {
            echo '<p>Error: Funcion de renderizado no encontrada.</p>';
        }
        ?>

        <?php wp_footer(); ?>
    </body>

    </html>
<?php
} else {
    // Pagina normal con header/footer de WordPress
    get_header();

    if ($modo === 'editor') {
        while (have_posts()) {
            the_post();
            $contenido = get_the_content(null, false, get_the_ID());
            $contenido = apply_filters('the_content', $contenido);
            $textoPlano = trim(wp_strip_all_tags(str_replace('&nbsp;', ' ', (string) $contenido), true));
            if ($textoPlano !== '') {
                echo $contenido;
            }
        }
    } elseif ($funcionRenderizar && is_callable($funcionRenderizar)) {
        $pageSettings = get_post_meta($postId, 'gbn_page_settings', true);
        $pageSettings = is_array($pageSettings) ? $pageSettings : [];

        $rootClass = 'gbnPage-' . $postId;
        $rootStyle = '';

        if (empty($pageSettings['padding'])) {
            $rootStyle .= 'padding: 20px;';
        } else {
            if (is_array($pageSettings['padding'])) {
                $p = $pageSettings['padding'];
                $rootStyle .= "padding: " . intval($p['superior']) . "px " . intval($p['derecha']) . "px " . intval($p['inferior']) . "px " . intval($p['izquierda']) . "px;";
            } else {
                $rootStyle .= 'padding: ' . intval($pageSettings['padding']) . 'px;';
            }
        }

        if (!empty($pageSettings['background'])) {
            $rootStyle .= 'background-color: ' . esc_attr($pageSettings['background']) . ';';
        }

        echo '<div data-gbn-root class="' . esc_attr($rootClass) . '" style="' . esc_attr($rootStyle) . '">';
        call_user_func($funcionRenderizar);
        echo '</div>';
    } else {
        echo '<h1>Error: Pagina no configurada correctamente.</h1>';
        if (current_user_can('manage_options')) {
            echo '<p>Funcion de renderizado esperada: <strong>' . esc_html($funcionRenderizar) . '</strong> no fue encontrada.</p>';
        }
    }

    get_footer();
}
