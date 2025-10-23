<?php

namespace App\Shortcodes;

use function App\Templates\Helpers\renderAawpPlaceholder;

\add_action('init', function () {
    \add_shortcode('aawp_placeholder', function ($atts = []): string {
        $atts = is_array($atts) ? $atts : [];
        $context = isset($atts['context']) ? sanitize_key((string) $atts['context']) : 'productos';
        ob_start();
        renderAawpPlaceholder($context);
        return (string) ob_get_clean();
    });
});


