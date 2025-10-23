<?php

namespace App\Templates\Helpers;

function renderAawpPlaceholder(string $context = 'productos'): void
{
    // Si estamos en contexto de copia para editor, emitir shortcode en lugar de HTML completo
    if (!empty($GLOBALS['gloryCopyContext'])) {
        echo '[aawp_placeholder context="' . esc_attr($context) . '"]';
        return;
    }
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


