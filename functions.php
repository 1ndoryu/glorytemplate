<?php

use Glory\Handler\FormHandler;
use Glory\Core\GloryFeatures;


$directorioTemaActivo = get_stylesheet_directory();

$autoloader = get_template_directory() . '/vendor/autoload.php';
if (file_exists($autoloader)) {
    require_once $autoloader;
} else {
    error_log('Error: Composer autoload no encontrado. Ejecuta "composer install".');
}

// Cargar el archivo de control de App temprano para que GloryFeatures::disable()
// se ejecute antes de que Glory registre y encole los assets.
$control_file = get_template_directory() . '/App/Config/control.php';
if (file_exists($control_file)) {
    require_once $control_file;
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

FormHandler::registerHandlerNamespace('App\\Handler\\Form\\');


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
    'templates/',
];

foreach ($directorios as $directorio) {
    incluirArchivos($directorio);
}


function fuentes()
{

}
add_action('wp_head', 'fuentes', 1);


add_action('rest_api_init', function () {
    register_rest_route('glory/v1', '/reservas', [
        'methods' => 'POST',
        'callback' => 'crearReservaDesdeApi',
        'permission_callback' => 'tienePermisoApi',
    ]);
});

// Registrar callbacks AJAX relacionados con "glory" solo si la feature gloryAjax no está desactivada
if (GloryFeatures::isEnabled('gloryAjax') !== false) {
    add_action('wp_ajax_glory_verificar_disponibilidad', 'verificarDisponibilidadCallback');
    add_action('wp_ajax_nopriv_glory_verificar_disponibilidad', 'verificarDisponibilidadCallback');
    add_action('admin_init', 'manejarExportacionReservasCsv');
    add_action('wp_ajax_glory_actualizar_color_servicio', 'actualizarColorServicioCallback');
    add_action('wp_ajax_glory_obtener_reserva', 'obtenerReservaCallback');
}