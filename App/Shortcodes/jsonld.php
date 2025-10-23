<?php

namespace App\Shortcodes;

\add_action('init', function () {
    \add_shortcode('json_ld', function ($atts = [], $content = null): string {
        $json = is_string($content) ? trim($content) : '';
        if ($json === '') {
            return '';
        }
        // No escapamos para permitir JSON válido, el shortcode debe usarse con contenido de confianza
        return "<script type=\"application/ld+json\">{$json}</script>\n";
    });
});


