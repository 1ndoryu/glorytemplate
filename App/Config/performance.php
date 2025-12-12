<?php

/**
 * Preconexiones y Optimizaciones de Rendimiento
 * 
 * FASE 1.4 del roadmap: Agregar preconnect para recursos externos.
 * Este archivo se carga al inicio del tema para optimizar la carga.
 * 
 * @package Glory/App/Config
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Agregar preconnect y dns-prefetch para recursos externos
 * 
 * Mejora el rendimiento precargando conexiones a dominios externos:
 * - Google Fonts (tipografias Manrope e Inter)
 * - Calendly (widget de reservas)
 * - WhatsApp (enlaces wa.me)
 */
function glory_add_preconnects(): void
{
    // Google Fonts - para Manrope e Inter
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";

    // Calendly - widget de reservas
    echo '<link rel="preconnect" href="https://assets.calendly.com" crossorigin>' . "\n";
    echo '<link rel="dns-prefetch" href="https://calendly.com">' . "\n";

    // WhatsApp - enlaces de contacto
    echo '<link rel="dns-prefetch" href="https://wa.me">' . "\n";
    echo '<link rel="dns-prefetch" href="https://api.whatsapp.com">' . "\n";
}

// Registrar en wp_head con prioridad 1 (antes de otros recursos)
add_action('wp_head', 'glory_add_preconnects', 1);

/**
 * Agregar font-display: swap a las fuentes de Google
 * 
 * Mejora el First Contentful Paint mostrando texto del sistema
 * mientras las fuentes personalizadas cargan.
 * 
 * Optimizacion: Preload de archivos woff2 criticos para reducir
 * cadena de peticiones (~300ms de ahorro estimado).
 */
function glory_add_google_fonts(): void
{
    // Preload de fuentes criticas para reducir cadena de peticiones
    // Manrope 700 (titulos) e Inter 400 (cuerpo) son las mas usadas
    echo '<link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggexSg.woff2">' . "\n";
    echo '<link rel="preload" as="font" type="font/woff2" crossorigin href="https://fonts.gstatic.com/s/inter/v14/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2">' . "\n";

    // Cargar Manrope e Inter con font-display: swap
    // CARGA ASINCRONA: usando media="print" onload para no bloquear render
    $fonts_url = 'https://fonts.googleapis.com/css2?';
    $fonts_url .= 'family=Manrope:wght@600;700&';
    $fonts_url .= 'family=Inter:wght@400;500;600&';
    $fonts_url .= 'display=swap';

    // Stylesheet asincrono: carga sin bloquear, luego aplica al terminar
    echo '<link rel="stylesheet" href="' . esc_url($fonts_url) . '" media="print" onload="this.media=\'all\'">' . "\n";
    // Fallback para navegadores sin JS
    echo '<noscript><link rel="stylesheet" href="' . esc_url($fonts_url) . '"></noscript>' . "\n";
}

// Registrar despues de preconnects
add_action('wp_head', 'glory_add_google_fonts', 2);

/**
 * Desencolar CSS innecesarios en modo React
 * 
 * Cuando React maneja el frontend, no necesitamos:
 * - wp-block-library: Estilos de bloques Gutenberg (~16KB, 540ms bloqueo)
 * - wp-block-library-theme: Estilos de tema para bloques
 * - classic-theme-styles: Estilos de tema clasico
 * - global-styles: Estilos globales de FSE (si no se usa)
 */
function glory_dequeue_unnecessary_styles(): void
{
    // Solo en modo React
    if (!class_exists('Glory\\Services\\ReactIslands') || !Glory\Services\ReactIslands::isReactMode()) {
        return;
    }

    // Desencolar estilos de bloques Gutenberg (no usamos bloques en frontend)
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');

    // Desencolar estilos de tema clasico (React maneja los estilos)
    wp_dequeue_style('classic-theme-styles');

    // Desencolar estilos globales de FSE si existen
    wp_dequeue_style('global-styles');

    // Desencolar estilos inline de bloques
    wp_dequeue_style('core-block-supports');
}

// Registrar con prioridad alta (100) para que se ejecute despues de que WP encole los estilos
add_action('wp_enqueue_scripts', 'glory_dequeue_unnecessary_styles', 100);
