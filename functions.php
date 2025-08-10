<?php

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

use App\Handler\Form\BarberoHandler;
use Glory\Handler\FormHandler;

FormHandler::registerHandlerNamespace('App\\Handler\\Form\\');
BarberoHandler::registerAjaxEndpoints();

if (Glory\Core\GloryFeatures::isEnabled('gloryAjax') !== false) {
    add_action('wp_ajax_glory_verificar_disponibilidad', 'verificarDisponibilidadCallback');
    add_action('wp_ajax_nopriv_glory_verificar_disponibilidad', 'verificarDisponibilidadCallback');
    add_action('admin_init', 'manejarExportacionReservasCsv');
    add_action('wp_ajax_glory_actualizar_color_servicio', 'actualizarColorServicioCallback');
    add_action('wp_ajax_glory_obtener_reserva', 'obtenerReservaCallback');
}