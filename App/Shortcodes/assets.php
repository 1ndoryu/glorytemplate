<?php

namespace App\Shortcodes;

use Glory\Utility\AssetsUtility;

\add_action('init', function () {
    \add_shortcode('glory_image', function ($atts = []): string {
        $atts = is_array($atts) ? $atts : [];
        $ref = isset($atts['ref']) ? (string) $atts['ref'] : '';
        if ($ref === '') return '';

        $imgAttrs = [];
        foreach (['alt','class','style','width','height','loading','decoding','fetchpriority'] as $key) {
            if (!empty($atts[$key])) $imgAttrs[$key] = (string) $atts[$key];
        }

        ob_start();
        // Si existe variación copy-context, solo imprime etiqueta <img> con URL para editor
        $url = AssetsUtility::imagenUrl($ref);
        if ($url) {
            $attrStr = '';
            foreach ($imgAttrs as $k => $v) { $attrStr .= ' ' . esc_attr($k) . '="' . esc_attr($v) . '"'; }
            echo '<img src="' . esc_url($url) . '"' . $attrStr . ' />';
        }
        return (string) ob_get_clean();
    });
});


