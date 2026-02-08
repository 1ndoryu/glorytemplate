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

/*
 * Estructura de permalinks: /blog/%postname%/ para que
 * los posts nativos de WP coincidan con los links de React.
 * Solo se aplica una vez (after_switch_theme) para no pisar config manual.
 */
add_action('after_switch_theme', function () {
    global $wp_rewrite;
    $wp_rewrite->set_permalink_structure('/blog/%postname%/');
    $wp_rewrite->flush_rules();
});

/*
 * Si la estructura actual no es la esperada, sugerir flush.
 * Esto cubre el caso donde el tema ya estaba activo.
 */
add_action('init', function () {
    $estructura = get_option('permalink_structure');
    if ($estructura && $estructura !== '/blog/%postname%/') {
        /* Solo registramos: la estructura la cambia el usuario en Settings > Permalinks */
        if (!get_option('glory_permalink_notice_shown')) {
            add_action('admin_notices', function () {
                echo '<div class="notice notice-warning is-dismissible"><p>';
                echo '<strong>Glory Template:</strong> Se recomienda usar la estructura de permalinks <code>/blog/%postname%/</code> para compatibilidad con las rutas de React. ';
                echo 'Ve a <a href="' . admin_url('options-permalink.php') . '">Ajustes → Enlaces permanentes</a> y selecciona "Estructura personalizada" con <code>/blog/%postname%/</code>.';
                echo '</p></div>';
            });
            update_option('glory_permalink_notice_shown', true);
        }
    }
});
