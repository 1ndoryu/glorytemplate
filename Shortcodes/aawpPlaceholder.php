<?php

use function App\Templates\Helpers\getAawpPlaceholderHtml;

if (!function_exists('aawpPlaceholderShortcode')) {
    function aawpPlaceholderShortcode($atts = [], $content = null)
    {
        $atts = is_array($atts) ? $atts : [];
        $context = isset($atts['context']) ? (string) $atts['context'] : 'productos';

        $cssPath = get_template_directory() . '/App/assets/css/aawp-placeholder.css';
        $cssUrl  = get_template_directory_uri() . '/App/assets/css/aawp-placeholder.css';
        $version = file_exists($cssPath) ? (string) filemtime($cssPath) : null;
        wp_enqueue_style('avada-aawp-placeholder', $cssUrl, [], $version);

        return getAawpPlaceholderHtml($context);
    }
}

add_shortcode('aawpPlaceholder', 'aawpPlaceholderShortcode');



