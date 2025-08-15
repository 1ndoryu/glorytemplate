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
$subSeccionApi = 'api_access';

// Sub-sección para componentes de integraciones
$subSeccionComponentes = 'components';

// Registro de la opción que controla el componente "Integrations Manager"
OpcionManager::register('glory_componente_integrations_manager_activado', [
    'valorDefault'    => false,
    'tipo'            => 'checkbox',
    'etiqueta'        => 'Activar Integrations Manager',
    'descripcion'     => 'Habilita el componente que gestiona integraciones externas (p. ej. servicios de terceros).',
    'seccion'         => $seccionIntegraciones,
    'etiquetaSeccion' => $etiquetaSeccionIntegraciones,
    'subSeccion'      => $subSeccionComponentes,
]);

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

// --- API para Chatbot ---
OpcionManager::register('glory_api_habilitada', [
    'valorDefault'    => false,
    'tipo'            => 'checkbox',
    'etiqueta'        => 'Habilitar API para Chatbot',
    'descripcion'     => 'Permite que un chatbot externo cree reservas mediante la API protegida por token.',
    'seccion'         => $seccionIntegraciones,
    'etiquetaSeccion' => $etiquetaSeccionIntegraciones,
    'subSeccion'      => $subSeccionApi,
]);

OpcionManager::register('glory_api_token', [
    'valorDefault'    => '',
    'tipo'            => 'text',
    'etiqueta'        => 'API Token (Bearer)',
    'descripcion'     => 'Token secreto usado por el chatbot para autenticarse. Recomendado mínimo 32 caracteres aleatorios.',
    'seccion'         => $seccionIntegraciones,
    'etiquetaSeccion' => $etiquetaSeccionIntegraciones,
    'subSeccion'      => $subSeccionApi,
]);

// Colores del scheduler: ahora se registran dinámicamente según los términos de la taxonomía 'servicio'.

// --- Componentes del tema (solo los específicos del proyecto/tema) ---
// Nota: Las claves core del framework se resuelven ahora con alias dentro de GloryFeatures::isActive().