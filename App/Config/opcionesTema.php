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