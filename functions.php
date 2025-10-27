<?php

$directorioTemaActivo = get_stylesheet_directory();

$autoloader = get_template_directory() . '/vendor/autoload.php';
if (file_exists($autoloader)) {
    require_once $autoloader;
} else {
    error_log('Error: Composer autoload no encontrado. Ejecuta "composer install".');
}

$glory_loader = get_template_directory() . '/Glory/load.php';
if (file_exists($glory_loader)) {
    require_once $glory_loader;
} else {
    error_log('Error: Glory Framework loader no encontrado.');
}

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    error_log('Error al cargar el archivo .env: ' . $e->getMessage());
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

// Toggle en admin bar para vista previa AAWP (global)
\add_action('admin_bar_menu', function (\WP_Admin_Bar $wp_admin_bar) {
    if (!current_user_can('manage_options')) { return; }
    if (!class_exists('Glory\\Manager\\OpcionManager')) { return; }
    $estado = (bool) Glory\Manager\OpcionManager::get('aawp_preview_activo', true);
    $titulo = $estado ? 'AAWP Preview: ON' : 'AAWP Preview: OFF';
    $wp_admin_bar->add_node([
        'id'    => 'aawp_preview_toggle',
        'title' => $titulo,
        'href'  => wp_nonce_url(add_query_arg(['aawp_preview_toggle' => $estado ? '0' : '1']), 'aawp_preview_toggle'),
        'meta'  => ['title' => 'Alternar vista previa de productos AAWP']
    ]);
}, 100);

\add_action('init', function () {
    if (!isset($_GET['aawp_preview_toggle'])) { return; }
    if (!current_user_can('manage_options')) { return; }
    if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', 'aawp_preview_toggle')) { return; }
    $nuevo = ($_GET['aawp_preview_toggle'] === '1');
    if (class_exists('Glory\\Core\\OpcionRepository')) {
        Glory\Core\OpcionRepository::save('aawp_preview_activo', $nuevo);
    }
    if (class_exists('Glory\\Manager\\OpcionManager')) {
        Glory\Manager\OpcionManager::clearCache();
    }
    wp_safe_redirect(remove_query_arg(['aawp_preview_toggle', '_wpnonce']));
    exit;
});

