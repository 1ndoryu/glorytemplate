<?php

namespace App\Shortcodes;

use Glory\Components\ContentRender;

\add_action('init', function () {
    \add_shortcode('glory_content_render', function ($atts = []): string {
        $atts = is_array($atts) ? $atts : [];
        $postType   = isset($atts['post_type']) ? sanitize_key((string) $atts['post_type']) : 'post';
        $plantilla  = isset($atts['template_id']) ? sanitize_text_field((string) $atts['template_id']) : '';
        $ppp        = isset($atts['ppp']) ? max(1, (int) $atts['ppp']) : 10;
        $gridCols   = isset($atts['grid_columns']) ? (int) $atts['grid_columns'] : 4;
        $itemClass  = isset($atts['item_class']) ? sanitize_html_class((string) $atts['item_class']) : 'glory-content-item';
        $contenedor = isset($atts['container_class']) ? sanitize_html_class((string) $atts['container_class']) : 'glory-content-list';

        ob_start();
        ContentRender::print($postType, [
            'publicacionesPorPagina' => $ppp,
            'paginacion'             => false,
            'plantillaCallback'      => $plantilla ?: null,
            'claseContenedor'        => $contenedor . ' grid-cols-' . $gridCols,
            'claseItem'              => $itemClass,
            'forzarSinCache'         => true,
        ]);
        return (string) ob_get_clean();
    });
});


