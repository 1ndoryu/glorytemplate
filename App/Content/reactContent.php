<?php

/**
 * Configuracion de contenido para React
 * 
 * Este archivo define que contenido de WordPress se inyecta a React.
 * Usa ReactContentProvider para registrar queries que se ejecutan
 * y pasan datos a los componentes React.
 * 
 * Los posts se definen en defaultContent.php usando DefaultContentManager,
 * que los sincroniza automaticamente con WordPress.
 * 
 * En React, usa el hook useContent para acceder a los datos:
 *   const posts = useContent<WordPressPost[]>('blogPosts');
 */

use Glory\Services\ReactContentProvider;

// Solo cargar si ReactContentProvider existe
if (!class_exists(ReactContentProvider::class)) {
    return;
}

/**
 * BLOG: Todos los posts publicados
 * 
 * Se obtienen todos los posts para que el router SPA pueda
 * renderizar tanto el listado (/blog) como los single posts (/blog/:slug)
 */
ReactContentProvider::register('blogPosts', 'post', [
    'posts_per_page' => -1, // Todos los posts
    'orderby' => 'date',
    'order' => 'DESC',
]);

/**
 * BLOG DESTACADOS: Posts destacados (sticky) o de categoria "caso-exito"
 * 
 * Segun project-extends.md: Seccion "Casos destacados" con 3 posts
 * Prioriza sticky posts, si no hay suficientes, usa categoria "caso-exito"
 */
ReactContentProvider::register('blogFeatured', 'post', [
    'posts_per_page' => 3,
    'ignore_sticky_posts' => false,
    'post__in' => get_option('sticky_posts') ?: [0], // Posts sticky primero
    'orderby' => 'post__in',
    'order' => 'DESC',
]);

/**
 * BLOG RECIENTES: Ultimos 6 posts (excluyendo sticky)
 * 
 * Segun project-extends.md: Seccion "Lo ultimo" con rejilla de 6 posts
 */
ReactContentProvider::register('blogRecent', 'post', [
    'posts_per_page' => 6,
    'ignore_sticky_posts' => true,
    'orderby' => 'date',
    'order' => 'DESC',
]);

/**
 * SITE CONFIG: Configuracion del sitio desde Theme Options
 * 
 * Inyecta todas las opciones configurables del tema a React.
 * Incluye: identidad, URLs de contacto, redes sociales, analytics.
 * 
 * En React, usar:
 *   const config = useContent<SiteConfig>('siteConfig');
 *   // o el hook especializado:
 *   const { urls, identity, social, analytics } = useSiteConfig();
 */

use Glory\Manager\OpcionManager;

// Construir URL de WhatsApp completa
$whatsappNumber = OpcionManager::get('glory_url_whatsapp', '584120825234');
$whatsappMessage = OpcionManager::get('glory_whatsapp_message', '');
$whatsappUrl = 'https://wa.me/' . preg_replace('/[^0-9]/', '', $whatsappNumber);
if (!empty($whatsappMessage)) {
    $whatsappUrl .= '?text=' . rawurlencode($whatsappMessage);
}

ReactContentProvider::registerStatic('siteConfig', [
    // Identidad del sitio
    'identity' => [
        'name' => OpcionManager::get('glory_site_name', get_bloginfo('name')),
        'tagline' => OpcionManager::get('glory_site_tagline', get_bloginfo('description')),
        'phone' => OpcionManager::get('glory_site_phone', ''),
        'email' => OpcionManager::get('glory_site_email', get_bloginfo('admin_email')),
        'siteUrl' => home_url(),
    ],

    // URLs de contacto
    'urls' => [
        'calendly' => OpcionManager::get('glory_url_calendly', 'https://calendly.com/andoryyu'),
        'whatsapp' => $whatsappUrl,
        'whatsappNumber' => $whatsappNumber,
        // Paginas internas (estaticas)
        'servicios' => '/servicios',
        'planes' => '/planes',
        'demos' => '/demos',
        'blog' => '/blog',
        'sobreMi' => '/sobre-mi',
        'contacto' => '/contacto',
        'privacidad' => '/privacidad',
        'cookies' => '/cookies',
    ],

    // Redes sociales
    'social' => [
        'linkedin' => OpcionManager::get('glory_social_linkedin', ''),
        'twitter' => OpcionManager::get('glory_social_twitter', ''),
        'youtube' => OpcionManager::get('glory_social_youtube', ''),
        'instagram' => OpcionManager::get('glory_social_instagram', ''),
    ],

    // Imagenes del sitio
    'images' => [
        'hero' => OpcionManager::get('glory_image_hero', ''),
        'secondary' => OpcionManager::get('glory_image_secondary', ''),
        'logo' => OpcionManager::get('glory_logo_image', ''),
        'logoMode' => OpcionManager::get('glory_logo_mode', 'text'),
        'logoText' => OpcionManager::get('glory_logo_text', ''),
    ],

    // Analytics y tracking
    'analytics' => [
        'gtmId' => OpcionManager::get('glory_gtm_id', ''),
        'ga4Id' => OpcionManager::get('glory_ga4_measurement_id', ''),
        'gscCode' => OpcionManager::get('glory_gsc_verification_code', ''),
    ],

    // Usuario actual
    'user' => [
        'isLoggedIn' => is_user_logged_in(),
        'isAdmin' => current_user_can('manage_options'),
    ],

    // Precios de planes
    'pricing' => [
        'basico' => OpcionManager::get('glory_pricing_basico', '99'),
        'avanzado' => OpcionManager::get('glory_pricing_avanzado', '149'),
        'total' => OpcionManager::get('glory_pricing_total', '199'),
        'currency' => OpcionManager::get('glory_pricing_currency', '€'),
        'period' => OpcionManager::get('glory_pricing_period', '/mes'),
    ],
]);

/**
 * Inyectar el contenido como variable global de JavaScript.
 * Esto hace que los datos esten disponibles en window.__GLORY_CONTENT__
 * y accesibles via useContent('blogPosts') o useContent('siteConfig')
 */
ReactContentProvider::injectGlobal();
