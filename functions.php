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

    // Evitar incluir dos veces por diferencias de mayúsculas/minúsculas en el FS
    static $directoriosVisitados = [];
    static $archivosIncluidos = [];

    $ruta_rel_completa = str_replace(get_template_directory() . '/', '', $ruta_completa);
    $dir_key = strtolower($ruta_rel_completa);
    if (isset($directoriosVisitados[$dir_key])) {
        return;
    }
    $directoriosVisitados[$dir_key] = true;

    $archivos = glob($ruta_completa . "*.php");
    foreach ($archivos as $archivo) {
        $archivo_rel = str_replace(get_template_directory() . '/', '', $archivo);
        $archivo_key = strtolower($archivo_rel);
        if (isset($archivosIncluidos[$archivo_key])) {
            continue;
        }
        include_once $archivo;
        $archivosIncluidos[$archivo_key] = true;
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
    add_action('wp_ajax_glory_exportar_reservas_csv', 'exportarReservasCsvAjax');
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

// AJAX: Configuración de API desde Home (solo admin logueado)
add_action('wp_ajax_glory_api_generar_token', 'gloryApiGenerarTokenCallback');
add_action('wp_ajax_glory_api_guardar_config', 'gloryApiGuardarConfigCallback');

// Forzar no-cache para ver cambios inmediatos cuando se use ?nocache o ?glory_debug
add_action('send_headers', function () {
    if (isset($_GET['nocache']) || isset($_GET['glory_debug'])) {
        if (!headers_sent()) {
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Cache-Control: post-check=0, pre-check=0', false);
            header('Pragma: no-cache');
            header('Expires: 0');
            header('Surrogate-Control: no-store');
            header('X-Glory-Bypass: nocache');
            header('X-Glory-Build: ' . time());
        }
    }
});

// Adjuntar un query param de bust para scripts/estilos cuando ?nocache o ?glory_debug
add_filter('script_loader_src', function ($src) {
    if (isset($_GET['nocache']) || isset($_GET['glory_debug'])) {
        $src = add_query_arg('nocache', time(), $src);
    }
    return $src;
}, 9999);

add_filter('style_loader_src', function ($src) {
    if (isset($_GET['nocache']) || isset($_GET['glory_debug'])) {
        $src = add_query_arg('nocache', time(), $src);
    }
    return $src;
}, 9999);