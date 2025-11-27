
<?php
/**
 * Template Name: Glory Central Template
 *
 * Este template central renderiza las páginas definidas a través de funciones en PageManager.
 */

use Glory\Manager\PageManager;

get_header();

$funcionRenderizar = PageManager::getFuncionParaRenderizar();
$postId = get_queried_object_id();
$modo = $postId ? PageManager::getModoContenidoParaPagina((int) $postId) : 'code';

if ($modo === 'editor') {
    while (have_posts()) {
        the_post();
        $contenido = get_the_content(null, false, get_the_ID());
        $contenido = apply_filters('the_content', $contenido);
        $textoPlano = trim(wp_strip_all_tags(str_replace('&nbsp;', ' ', (string) $contenido), true));
        if ($textoPlano !== '') {
            echo $contenido; // Imprimir solo si hay contenido real
        }
    }
} elseif ($funcionRenderizar && is_callable($funcionRenderizar)) {
    // Llama a la función específica de la página (ej: home(), contacto(), etc.)
    call_user_func($funcionRenderizar);
} else {
    // Contenido de respaldo si algo falla
    echo '<h1>Error: Página no configurada correctamente.</h1>';
    if (current_user_can('manage_options')) {
        echo '<p>Función de renderizado esperada: <strong>' . esc_html($funcionRenderizar) . '</strong> no fue encontrada.</p>';
        echo '<p>Asegúrate de que la función exista y esté cargada correctamente.</p>';
    }
}

get_footer();
