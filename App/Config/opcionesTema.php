<?php

/**
 * Opciones de Tema para React
 * 
 * Este archivo define las opciones que React consume via ReactContentProvider.
 * Estas opciones se inyectan al frontend como `window.gloryReactContent.siteConfig`
 * y se acceden via el hook `useSiteUrls()` en React.
 * 
 * NOTA: El panel glory-opciones NO se usa con React.
 * Estas opciones se configuran directamente via OpcionManager y se persisten
 * en la base de datos de WordPress. Un futuro panel React las gestionara.
 * 
 * @package App\Config
 * @see Glory\Services\ReactContentProvider
 * @see App\Content\reactContent.php
 */

use Glory\Manager\OpcionManager;
use Glory\Integration\Compatibility;


$seccionIntegraciones = 'integrations';
$etiquetaSeccionIntegraciones = 'Integrations & Tracking';
$subSeccionCodigos = 'tracking_codes';

OpcionManager::register('glory_gsc_verification_code', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Google Search Console Verification Code',
    'descripcion'     => 'Paste the content of the GSC verification meta tag. Example: "ABC123xyz..." from the tag <meta name="google-site-verification" content="ABC123xyz...">.',
    'seccion'         => $seccionIntegraciones,
    'etiquetaSeccion' => $etiquetaSeccionIntegraciones,
    'subSeccion'      => $subSeccionCodigos,
]);

OpcionManager::register('glory_ga4_measurement_id', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Google Analytics 4 Measurement ID',
    'descripcion'     => 'Enter your GA4 Measurement ID (Example: G-XXXXXXXXXX) to enable basic tracking.',
    'seccion'         => $seccionIntegraciones,
    'etiquetaSeccion' => $etiquetaSeccionIntegraciones,
    'subSeccion'      => $subSeccionCodigos,
]);

OpcionManager::register('glory_custom_header_scripts', [
    'valorDefault'    => '',
    'tipo'            => 'textarea',
    'etiqueta'        => 'Custom Header Scripts',
    'descripcion'     => 'Paste here any additional script or meta tag that you need to add in the site <head> (e.g., Facebook Pixel, other verification codes).',
    'seccion'         => $seccionIntegraciones,
    'etiquetaSeccion' => $etiquetaSeccionIntegraciones,
    'subSeccion'      => 'manual_scripts',
]);

// ============================================================================
// SECCION: IDENTIDAD Y MARCA
// ============================================================================
$seccionIdentidad = 'identity';
$etiquetaSeccionIdentidad = 'Site Identity';

OpcionManager::register('glory_site_name', [
    'valorDefault'    => get_bloginfo('name', 'display'),
    'tipo'            => 'text',
    'etiqueta'        => 'Site/Brand Name',
    'descripcion'     => 'The name that will appear in headers, SEO, and JSON-LD schemas.',
    'seccion'         => $seccionIdentidad,
    'etiquetaSeccion' => $etiquetaSeccionIdentidad,
    'subSeccion'      => 'basic_info',
]);

OpcionManager::register('glory_site_tagline', [
    'valorDefault'    => get_bloginfo('description', 'display'),
    'tipo'            => 'text',
    'etiqueta'        => 'Tagline / Slogan',
    'descripcion'     => 'A short description of the site used in SEO and headers.',
    'seccion'         => $seccionIdentidad,
    'etiquetaSeccion' => $etiquetaSeccionIdentidad,
    'subSeccion'      => 'basic_info',
]);

OpcionManager::register('glory_site_phone', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Phone Number',
    'descripcion'     => 'Contact phone number with country code (e.g., +34 612 345 678). Used in JSON-LD and contact sections.',
    'seccion'         => $seccionIdentidad,
    'etiquetaSeccion' => $etiquetaSeccionIdentidad,
    'subSeccion'      => 'basic_info',
]);

OpcionManager::register('glory_site_email', [
    'valorDefault'    => get_bloginfo('admin_email'),
    'tipo'            => 'text',
    'etiqueta'        => 'Contact Email',
    'descripcion'     => 'Primary contact email address.',
    'seccion'         => $seccionIdentidad,
    'etiquetaSeccion' => $etiquetaSeccionIdentidad,
    'subSeccion'      => 'basic_info',
]);

// ============================================================================
// SECCION: URLs DE CONTACTO
// ============================================================================
$seccionContacto = 'contact';
$etiquetaSeccionContacto = 'Contact URLs';

OpcionManager::register('glory_url_calendly', [
    'valorDefault'    => 'https://calendly.com/andoryyu',
    'tipo'            => 'text',
    'etiqueta'        => 'Calendly URL',
    'descripcion'     => 'Full URL to your Calendly calendar (e.g., https://calendly.com/username).',
    'seccion'         => $seccionContacto,
    'etiquetaSeccion' => $etiquetaSeccionContacto,
    'subSeccion'      => 'external_urls',
]);

OpcionManager::register('glory_url_whatsapp', [
    'valorDefault'    => '584120825234',
    'tipo'            => 'text',
    'etiqueta'        => 'WhatsApp Number',
    'descripcion'     => 'WhatsApp number without + or spaces (e.g., 34612345678). Will be used as wa.me/NUMBER.',
    'seccion'         => $seccionContacto,
    'etiquetaSeccion' => $etiquetaSeccionContacto,
    'subSeccion'      => 'external_urls',
]);

OpcionManager::register('glory_whatsapp_message', [
    'valorDefault'    => '',
    'tipo'            => 'textarea',
    'etiqueta'        => 'WhatsApp Default Message',
    'descripcion'     => 'Optional pre-filled message when users click WhatsApp links.',
    'seccion'         => $seccionContacto,
    'etiquetaSeccion' => $etiquetaSeccionContacto,
    'subSeccion'      => 'external_urls',
]);

// ============================================================================
// SECCION: REDES SOCIALES
// ============================================================================
$seccionSocial = 'social';
$etiquetaSeccionSocial = 'Social Profiles';

OpcionManager::register('glory_social_linkedin', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'LinkedIn Profile URL',
    'descripcion'     => 'Full URL to LinkedIn profile (e.g., https://linkedin.com/in/username).',
    'seccion'         => $seccionSocial,
    'etiquetaSeccion' => $etiquetaSeccionSocial,
    'subSeccion'      => 'profiles',
]);

OpcionManager::register('glory_social_twitter', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Twitter/X Profile URL',
    'descripcion'     => 'Full URL to Twitter/X profile (e.g., https://x.com/username).',
    'seccion'         => $seccionSocial,
    'etiquetaSeccion' => $etiquetaSeccionSocial,
    'subSeccion'      => 'profiles',
]);

OpcionManager::register('glory_social_youtube', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'YouTube Channel URL',
    'descripcion'     => 'Full URL to YouTube channel.',
    'seccion'         => $seccionSocial,
    'etiquetaSeccion' => $etiquetaSeccionSocial,
    'subSeccion'      => 'profiles',
]);

OpcionManager::register('glory_social_instagram', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Instagram Profile URL',
    'descripcion'     => 'Full URL to Instagram profile.',
    'seccion'         => $seccionSocial,
    'etiquetaSeccion' => $etiquetaSeccionSocial,
    'subSeccion'      => 'profiles',
]);

// ============================================================================
// SECCION: IMAGENES DEL SITIO
// ============================================================================
$seccionImagenes = 'images';
$etiquetaSeccionImagenes = 'Site Images';

OpcionManager::register('glory_image_hero', [
    'valorDefault'    => '',
    'tipo'            => 'imagen',
    'etiqueta'        => 'Hero/Profile Image',
    'descripcion'     => 'Main profile image used in Hero sections and About page.',
    'seccion'         => $seccionImagenes,
    'etiquetaSeccion' => $etiquetaSeccionImagenes,
    'subSeccion'      => 'profile_images',
]);

OpcionManager::register('glory_image_secondary', [
    'valorDefault'    => '',
    'tipo'            => 'imagen',
    'etiqueta'        => 'Secondary/Working Image',
    'descripcion'     => 'Secondary image used in About section (e.g., working photo).',
    'seccion'         => $seccionImagenes,
    'etiquetaSeccion' => $etiquetaSeccionImagenes,
    'subSeccion'      => 'profile_images',
]);

// ============================================================================
// SECCION: LOGO DEL SITIO
// ============================================================================
$seccionLogo = 'logo';
$etiquetaSeccionLogo = 'Site Logo';

OpcionManager::register('glory_logo_mode', [
    'valorDefault'    => 'text',
    'tipo'            => 'text',
    'etiqueta'        => 'Logo Mode',
    'descripcion'     => 'How to display the logo: "text" or "image".',
    'seccion'         => $seccionLogo,
    'etiquetaSeccion' => $etiquetaSeccionLogo,
    'subSeccion'      => 'logo_settings',
]);

OpcionManager::register('glory_logo_text', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Logo Text',
    'descripcion'     => 'Text to display as logo when mode is "text". Falls back to site name if empty.',
    'seccion'         => $seccionLogo,
    'etiquetaSeccion' => $etiquetaSeccionLogo,
    'subSeccion'      => 'logo_settings',
]);

OpcionManager::register('glory_logo_image', [
    'valorDefault'    => '',
    'tipo'            => 'imagen',
    'etiqueta'        => 'Logo Image',
    'descripcion'     => 'Image URL for the logo when mode is "image".',
    'seccion'         => $seccionLogo,
    'etiquetaSeccion' => $etiquetaSeccionLogo,
    'subSeccion'      => 'logo_settings',
]);

// ============================================================================
// SECCION: GTM ID (separado de GA4 para mayor claridad)
// ============================================================================
OpcionManager::register('glory_gtm_id', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'Google Tag Manager ID',
    'descripcion'     => 'Enter your GTM Container ID (e.g., GTM-XXXXXXX). This is used to load GTM after cookie consent.',
    'seccion'         => $seccionIntegraciones,
    'etiquetaSeccion' => $etiquetaSeccionIntegraciones,
    'subSeccion'      => $subSeccionCodigos,
]);

/*
 * SECCION: PRECIOS DE PLANES
 * Configuracion de precios mensuales para cada plan
 */
$seccionPrecios = 'pricing';
$etiquetaSeccionPrecios = 'Plan Pricing';

OpcionManager::register('glory_pricing_basico', [
    'valorDefault'    => '99',
    'tipo'            => 'text',
    'etiqueta'        => 'Precio Plan Básico',
    'descripcion'     => 'Precio mensual del plan Básico (solo número, sin símbolo de moneda).',
    'seccion'         => $seccionPrecios,
    'etiquetaSeccion' => $etiquetaSeccionPrecios,
    'subSeccion'      => 'plan_prices',
]);

OpcionManager::register('glory_pricing_avanzado', [
    'valorDefault'    => '149',
    'tipo'            => 'text',
    'etiqueta'        => 'Precio Plan Avanzado',
    'descripcion'     => 'Precio mensual del plan Avanzado (solo número, sin símbolo de moneda).',
    'seccion'         => $seccionPrecios,
    'etiquetaSeccion' => $etiquetaSeccionPrecios,
    'subSeccion'      => 'plan_prices',
]);

OpcionManager::register('glory_pricing_total', [
    'valorDefault'    => '199',
    'tipo'            => 'text',
    'etiqueta'        => 'Precio Plan Total',
    'descripcion'     => 'Precio mensual del plan Total (solo número, sin símbolo de moneda).',
    'seccion'         => $seccionPrecios,
    'etiquetaSeccion' => $etiquetaSeccionPrecios,
    'subSeccion'      => 'plan_prices',
]);

OpcionManager::register('glory_pricing_currency', [
    'valorDefault'    => '€',
    'tipo'            => 'text',
    'etiqueta'        => 'Símbolo de Moneda',
    'descripcion'     => 'Símbolo de la moneda a mostrar (ej: €, $, £).',
    'seccion'         => $seccionPrecios,
    'etiquetaSeccion' => $etiquetaSeccionPrecios,
    'subSeccion'      => 'plan_prices',
]);

OpcionManager::register('glory_pricing_period', [
    'valorDefault'    => '/mes',
    'tipo'            => 'text',
    'etiqueta'        => 'Período de Facturación',
    'descripcion'     => 'Texto del período de facturación (ej: /mes, /año).',
    'seccion'         => $seccionPrecios,
    'etiquetaSeccion' => $etiquetaSeccionPrecios,
    'subSeccion'      => 'plan_prices',
]);
