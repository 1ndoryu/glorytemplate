<?php

namespace App\Templates\Helpers;

if (!function_exists(__NAMESPACE__ . '\\getAawpPlaceholderHtml')) {
    function getAawpPlaceholderHtml(string $context = 'productos'): string
    {
        $contextSafe = esc_attr($context);
        ob_start();
        echo '<div class="aawp-grid aawp-grid--placeholder" data-context="' . $contextSafe . '">';
        echo '<div class="aawp-grid__notice">';
        echo 'Aquí verás los productos de Amazon cuando el plugin esté activo.';
        echo '</div>';
        echo '<div class="aawp-grid__items">';
        for ($i = 0; $i < 6; $i++) {
            echo '<div class="aawp-card aawp-card--skeleton">';
            echo '<div class="aawp-card__media"></div>';
            echo '<div class="aawp-card__title"></div>';
            echo '<div class="aawp-card__cta"></div>';
            echo '</div>';
        }
        echo '</div>';
        echo '</div>';
        return (string) ob_get_clean();
    }
}

if (!function_exists(__NAMESPACE__ . '\\renderAawpPlaceholder')) {
    function renderAawpPlaceholder(string $context = 'productos'): void
    {
        echo getAawpPlaceholderHtml($context);
    }
}



