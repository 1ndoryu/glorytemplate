<?php

$directorioTemaActivo = get_stylesheet_directory();

$autoloader = get_template_directory() . '/vendor/autoload.php';
if (file_exists($autoloader)) {
    require_once $autoloader;
} else {
    error_log('Error: Composer autoload no encontrado. Ejecuta "composer install".');
}

/*
 * IMPORTANTE: Cargar dotenv ANTES de Glory Framework
 * para que las variables de entorno esten disponibles
 * cuando los plugins se inicialicen.
 */
try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    error_log('Error al cargar el archivo .env: ' . $e->getMessage());
}

$glory_loader = get_template_directory() . '/Glory/load.php';
if (file_exists($glory_loader)) {
    require_once $glory_loader;
} else {
    error_log('Error: Glory Framework loader no encontrado.');
}


// Asegurar que los feature flags se establecen primero
$control_config = get_template_directory() . '/App/Config/control.php';
if (file_exists($control_config)) {
    include_once $control_config;
}

function incluirArchivos($directorio)
{
    $ruta_completa = get_template_directory() . "/$directorio";

    $archivos = glob($ruta_completa . "*.php");
    foreach ($archivos as $archivo) {
        include_once $archivo;
    }

    $subdirectorios = glob($ruta_completa . "*/", GLOB_ONLYDIR);
    foreach ($subdirectorios as $subdirectorio) {
        $ruta_relativa = str_replace(get_template_directory() . '/', '', $subdirectorio);
        incluirArchivos($ruta_relativa);
    }
}

$directorios = [
    'App/',
];

foreach ($directorios as $directorio) {
    incluirArchivos($directorio);
}


// Fix SVG MIME type support
add_filter('upload_mimes', function ($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
});
add_filter('mime_types', function ($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
});

/**
 * Inyectar estado de sesión para React.
 * Define window.GLORY_AUTH antes de que cargue la app.
 */
add_action('wp_head', function () {
    $estado = [
        'isLoggedIn' => is_user_logged_in(),
        'user' => is_user_logged_in() ? wp_get_current_user()->display_name : null
    ];
    echo '<script>window.GLORY_AUTH = ' . json_encode($estado) . ';</script>';

    /* Inyectar datos completos del usuario para el Panel React */
    $userData = null;
    if (is_user_logged_in()) {
        $user = wp_get_current_user();
        $roles = (array) $user->roles;

        // Mapeo simple de roles
        $rolPanel = 'cliente';
        if (in_array('administrator', $roles)) {
            $rolPanel = 'admin';
        } elseif (in_array('editor', $roles) || in_array('author', $roles)) {
            $rolPanel = 'proveedor';
        }

        $userData = [
            'id' => (string) $user->ID,
            'wpUserId' => $user->ID,
            'nombre' => $user->display_name,
            'email' => $user->user_email,
            'avatar' => get_avatar_url($user->ID),
            'rol' => $rolPanel,
            'fechaRegistro' => $user->user_registered
        ];
    }
    echo '<script>window.wpUser = ' . json_encode($userData) . ';</script>';

    /* Configuración de API REST */
    $apiSettings = [
        'root' => esc_url_raw(rest_url()),
        'nonce' => wp_create_nonce('wp_rest')
    ];
    echo '<script>window.gloryApiSettings = ' . json_encode($apiSettings) . ';</script>';
}, 1);
