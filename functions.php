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
use App\Handler\Form\GuardarServicioHandler;
use Glory\Handler\FormHandler;

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
    add_action('wp_ajax_glory_filtrar_barberos', 'filtrarBarberosAjaxCallback');
    add_action('wp_ajax_nopriv_glory_filtrar_barberos', 'filtrarBarberosAjaxCallback');
}

// Handler para eliminar barbero desde admin-post.php
function glory_delete_barbero_handler() {
    if (!current_user_can('manage_options')) {
        wp_die('No autorizado');
    }
    $nonce = $_POST['barberos_nonce'] ?? '';
    if (!wp_verify_nonce($nonce, 'barberos_save')) {
        wp_die('Nonce inválido');
    }
    $term_id = isset($_POST['term_id']) ? intval($_POST['term_id']) : 0;
    if ($term_id > 0 && term_exists($term_id, 'barbero')) {
        // Eliminar término
        wp_delete_term($term_id, 'barbero');
        // Limpiar opciones guardadas
        $option_key = 'barberia_barberos';
        $barberos = get_option($option_key, []);
        if (is_array($barberos) && !empty($barberos)) {
            $barberos = array_values(array_filter($barberos, function($b) use ($term_id) {
                return empty($b['term_id']) || intval($b['term_id']) !== $term_id;
            }));
            update_option($option_key, $barberos);
        }
    }
    wp_redirect(admin_url('admin.php?page=barberia-barberos&deleted=1'));
    exit;
}
add_action('admin_post_glory_delete_barbero', 'glory_delete_barbero_handler');

// Handler para eliminar servicio desde admin-post.php
function glory_delete_servicio_handler() {
    if (!current_user_can('manage_options')) {
        wp_die('No autorizado');
    }

    $nonce = $_POST['servicios_nonce'] ?? '';
    if (!wp_verify_nonce($nonce, 'servicios_save')) {
        wp_die('Nonce inválido');
    }

    $term_id = isset($_POST['term_id']) ? intval($_POST['term_id']) : 0;
    $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';

    if ($term_id > 0 && term_exists($term_id, 'servicio')) {
        wp_delete_term($term_id, 'servicio');
    }

    $option_key = 'barberia_servicios';
    $servicios = get_option($option_key, []);
    if (is_array($servicios) && !empty($servicios)) {
        $servicios = array_values(array_filter($servicios, function($s) use ($term_id, $name) {
            if ($term_id > 0 && !empty($s['term_id'])) {
                return intval($s['term_id']) !== $term_id;
            }
            if ($name !== '' && isset($s['name'])) {
                return sanitize_text_field($s['name']) !== $name;
            }
            return true;
        }));
        update_option($option_key, $servicios);
    }

    wp_redirect(admin_url('admin.php?page=barberia-servicios&deleted=1'));
    exit;
}
add_action('admin_post_glory_delete_servicio', 'glory_delete_servicio_handler');