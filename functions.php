<?php
//No mover esto de aqui
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
// Hasta aqui no mover

use App\Handler\Form\BarberoHandler;
use App\Handler\Form\GuardarServicioHandler;
use Glory\Handler\FormHandler;
use Glory\Services\EventBus;

FormHandler::registerHandlerNamespace('App\\Handler\\Form\\');
BarberoHandler::registerAjaxEndpoints();
GuardarServicioHandler::registerAjaxEndpoints();

if (Glory\Core\GloryFeatures::isEnabled('gloryAjax') !== false) {
    add_action('wp_ajax_glory_verificar_disponibilidad', 'verificarDisponibilidadCallback');
    add_action('wp_ajax_nopriv_glory_verificar_disponibilidad', 'verificarDisponibilidadCallback');
    add_action('wp_ajax_glory_servicios_por_barbero', 'serviciosPorBarberoCallback');
    add_action('wp_ajax_nopriv_glory_servicios_por_barbero', 'serviciosPorBarberoCallback');
    add_action('admin_init', 'manejarExportacionReservasCsv');
    add_action('wp_ajax_glory_actualizar_color_servicio', 'actualizarColorServicioCallback');
    add_action('wp_ajax_glory_obtener_reserva', 'obtenerReservaCallback');

    // Filtros en tiempo real (frontend)
    add_action('wp_ajax_glory_filtrar_reservas', 'filtrarReservasAjaxCallback');
    add_action('wp_ajax_nopriv_glory_filtrar_reservas', 'filtrarReservasAjaxCallback');
    add_action('wp_ajax_glory_filtrar_historial', 'filtrarHistorialAjaxCallback');
    add_action('wp_ajax_nopriv_glory_filtrar_historial', 'filtrarHistorialAjaxCallback');
    add_action('wp_ajax_glory_filtrar_barberos', 'filtrarBarberosAjaxCallback');
    add_action('wp_ajax_nopriv_glory_filtrar_barberos', 'filtrarBarberosAjaxCallback');
    add_action('wp_ajax_glory_filtrar_servicios', 'filtrarServiciosAjaxCallback');
    add_action('wp_ajax_nopriv_glory_filtrar_servicios', 'filtrarServiciosAjaxCallback');
    add_action('wp_ajax_glory_filtrar_ganancias', 'filtrarGananciasAjaxCallback');
    add_action('wp_ajax_nopriv_glory_filtrar_ganancias', 'filtrarGananciasAjaxCallback');

    // Acciones masivas del DataGrid (frontend y admin)
    add_action('wp_ajax_glory_eliminar_reservas', 'gloryEliminarReservasCallback');
    add_action('wp_ajax_nopriv_glory_eliminar_reservas', 'gloryEliminarReservasCallback');
    add_action('wp_ajax_glory_eliminar_barberos', 'gloryEliminarBarberosCallback');
    add_action('wp_ajax_nopriv_glory_eliminar_barberos', 'gloryEliminarBarberosCallback');
    add_action('wp_ajax_glory_eliminar_servicios', 'gloryEliminarServiciosCallback');
    add_action('wp_ajax_nopriv_glory_eliminar_servicios', 'gloryEliminarServiciosCallback');

    // Visualización dinámica del scheduler por fecha (frontend)
    add_action('wp_ajax_glory_visualizacion_por_fecha', 'visualizacionPorFechaCallback');
    add_action('wp_ajax_nopriv_glory_visualizacion_por_fecha', 'visualizacionPorFechaCallback');
}

add_action('admin_post_glory_delete_barbero', 'gloryDeleteBarberoHandler');
add_action('admin_post_glory_delete_servicio', 'gloryDeleteServicioHandler');