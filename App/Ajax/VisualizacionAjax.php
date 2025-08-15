<?php

use Glory\Components\SchedulerRenderer;
use Glory\Core\OpcionRegistry;

/**
 * Devuelve el HTML del scheduler para una fecha dada, para usarse vía AJAX en el frontend.
 */
function visualizacionPorFechaCallback()
{
    $fecha = isset($_POST['fecha']) ? sanitize_text_field((string) $_POST['fecha']) : '';
    if ($fecha === '') {
        wp_send_json_error(['mensaje' => 'Fecha requerida.']);
        return;
    }

    // Reusar helpers ya existentes
    if (!function_exists('obtenerRecursos') || !function_exists('obtenerEventosPorFecha') || !function_exists('construirMapaColores') || !function_exists('asegurarSinAsignar')) {
        wp_send_json_error(['mensaje' => 'Dependencias no disponibles.']);
        return;
    }

    // Asegurar que las definiciones de colores estén registradas (igual que en render de página)
    if (function_exists('registrarOpcionesColoresServiciosDinamico')) {
        registrarOpcionesColoresServiciosDinamico();
    }
    $definiciones = OpcionRegistry::getDefiniciones();
    $recursos = obtenerRecursos();
    $eventos = obtenerEventosPorFecha($fecha);
    $mapeoColores = construirMapaColores($definiciones);
    asegurarSinAsignar($recursos, $eventos);

    $configScheduler = [
        'recursos'     => array_values(array_unique($recursos)),
        'horaInicio'   => '09:00',
        'horaFin'      => '21:00',
        'intervalo'    => 15,
        'pxPorMinuto'  => 2,
        'mapeoColores' => $mapeoColores,
    ];

    ob_start();
    SchedulerRenderer::render($eventos, $configScheduler);
    $html = ob_get_clean();

    wp_send_json_success([
        'html'  => $html,
        'fecha' => $fecha,
    ]);
}


