<?php

namespace App\Templates\Helpers;

function renderAawpPlaceholder(string $context = 'productos'): void
{
    echo '<div class="aawp-grid aawp-grid--placeholder" data-context="' . esc_attr($context) . '">';
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
}


