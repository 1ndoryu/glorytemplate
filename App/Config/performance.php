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
 */
function glory_add_google_fonts(): void
{
    // Cargar Manrope e Inter con font-display: swap
    $fonts_url = 'https://fonts.googleapis.com/css2?';
    $fonts_url .= 'family=Manrope:wght@600;700&';
    $fonts_url .= 'family=Inter:wght@400;500;600&';
    $fonts_url .= 'display=swap';

    echo '<link rel="stylesheet" href="' . esc_url($fonts_url) . '">' . "\n";
}

// Registrar despues de preconnects
add_action('wp_head', 'glory_add_google_fonts', 2);
