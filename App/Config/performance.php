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
 * - Calendly (widget de reservas)
 * - WhatsApp (enlaces wa.me)
 * 
 * NOTA: Las fuentes Inter y Manrope ahora se sirven localmente
 * desde App/Assets/fonts/ para evitar FOUT y mejorar PageSpeed.
 */
function glory_add_preconnects(): void
{
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
 * Cargar fuentes locales (Inter y Manrope)
 * 
 * Las fuentes se sirven localmente desde App/Assets/fonts/ para:
 * - Eliminar peticiones a Google Fonts
 * - Evitar FOUT (Flash of Unstyled Text)
 * - Mejorar metricas de PageSpeed (LCP, CLS)
 * 
 * Optimizacion: Preload de archivos woff2 criticos para reducir
 * cadena de peticiones (~300ms de ahorro estimado).
 */
function glory_add_local_fonts(): void
{
    $fonts_dir = get_template_directory_uri() . '/App/Assets/fonts';

    // Preload de fuentes criticas para reducir cadena de peticiones
    // Inter 400 (cuerpo) y Manrope 700 (titulos) son las mas usadas
    echo '<link rel="preload" as="font" type="font/woff2" crossorigin href="' . esc_url($fonts_dir . '/inter-latin-400.woff2') . '">' . "\n";
    echo '<link rel="preload" as="font" type="font/woff2" crossorigin href="' . esc_url($fonts_dir . '/manrope-latin-700.woff2') . '">' . "\n";

    // Cargar el CSS de @font-face que define las fuentes locales
    echo '<link rel="stylesheet" href="' . esc_url($fonts_dir . '/fonts.css') . '">' . "\n";
}

// Registrar despues de preconnects
add_action('wp_head', 'glory_add_local_fonts', 2);

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
