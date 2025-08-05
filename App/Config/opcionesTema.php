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

$seccionScheduler = 'scheduler';
$etiquetaSeccionScheduler = 'Configuración del Calendario';
$subSeccionColores = 'colores_servicios';

$serviciosParaColores = [
    'corte-de-pelo' => ['label' => 'Corte de Pelo', 'default' => '#8BC34A'],
    'corte-extra-degradado' => ['label' => 'Corte Extra Degradado', 'default' => '#8BC34A'],
    'arreglo-de-cuello' => ['label' => 'Arreglo de Cuello', 'default' => '#8BC34A'],
    'corte-al-cero' => ['label' => 'Corte al Cero', 'default' => '#8BC34A'],
    'lavar' => ['label' => 'Lavar', 'default' => '#8BC34A'],
    'lavar-y-peinar' => ['label' => 'Lavar y Peinar', 'default' => '#8BC34A'],
    'arreglo-y-perfilado-de-barba' => ['label' => 'Arreglo y Perfilado de Barba', 'default' => '#FF9800'],
    'arreglo-de-barba' => ['label' => 'Arreglo de Barba', 'default' => '#FF9800'],
    'corte-y-arreglo-de-barba' => ['label' => 'Corte y Arreglo de Barba', 'default' => '#F44336'],
    'corte-y-afeitado' => ['label' => 'Corte y Afeitado', 'default' => '#F44336'],
    'afeitado-de-barba' => ['label' => 'Afeitado de Barba', 'default' => '#FFEB3B'],
    'afeitado-de-cabeza' => ['label' => 'Afeitado de Cabeza', 'default' => '#FFEB3B'],
    'tinte-de-pelo' => ['label' => 'Tinte de Pelo', 'default' => '#2196F3'],
    'tinte-de-barba' => ['label' => 'Tinte de Barba', 'default' => '#2196F3'],
    'default' => ['label' => 'Color por Defecto', 'default' => '#9E9E9E'],
];

foreach ($serviciosParaColores as $slug => $data) {
    OpcionManager::register('glory_scheduler_color_' . str_replace('-', '_', $slug), [
        'valorDefault'    => $data['default'],
        'tipo'            => 'color',
        'etiqueta'        => 'Color para: ' . $data['label'],
        'descripcion'     => 'Selecciona el color para el servicio ' . $data['label'] . ' en el calendario.',
        'seccion'         => $seccionScheduler,
        'etiquetaSeccion' => $etiquetaSeccionScheduler,
        'subSeccion'      => $subSeccionColores,
    ]);
}