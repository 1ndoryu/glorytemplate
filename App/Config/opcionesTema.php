<?php

use Glory\Manager\OpcionManager;
use Glory\Integration\Compatibility;

if (Compatibility::avadaActivo()) {
    OpcionManager::register('glory_logo_mode', [
        'valorDefault'    => 'default',
        'tipo'            => 'select',
        'etiqueta'        => 'Header Logo Mode',
        'descripcion'     => 'Select how the site logo should be displayed. In "Default" mode, the logo is managed via <strong>Avada > Options > Logo</strong>.',
        'opciones'        => [
            'default' => 'Default (Managed by Avada)',
            'text'    => 'Custom Text',
            'none'    => 'No Logo',
        ],
        'seccion'         => 'header',
        'etiquetaSeccion' => 'Header Settings',
        'subSeccion'      => 'logo_configuration',
    ]);
} else {
    OpcionManager::register('glory_logo_mode', [
        'valorDefault'    => 'image',
        'tipo'            => 'select',
        'etiqueta'        => 'Header Logo Mode',
        'descripcion'     => 'Select how the site logo should be displayed.',
        'opciones'        => [
            'image' => 'Image Logo',
            'text'  => 'Custom Text',
            'none'  => 'No Logo',
        ],
        'seccion'         => 'header',
        'etiquetaSeccion' => 'Header Settings',
        'subSeccion'      => 'logo_configuration',
    ]);

    OpcionManager::register('glory_logo_image', [
        'valorDefault' => '',
        'tipo'         => 'imagen',
        'etiqueta'     => 'Logo Image',
        'descripcion'  => 'Upload or select the logo image to be used when "Image Logo" mode is selected.',
        'seccion'      => 'header',
        'subSeccion'   => 'logo_configuration',
    ]);
}

OpcionManager::register('glory_logo_text', [
    'valorDefault' => get_bloginfo('name', 'display'),
    'tipo'         => 'text',
    'etiqueta'     => 'Logo Text',
    'descripcion'  => 'This text will be used as the logo when "Custom Text" mode is selected.',
    'seccion'      => 'header',
    'subSeccion'   => 'logo_configuration',
]);


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
