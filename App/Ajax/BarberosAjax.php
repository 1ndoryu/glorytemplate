<?php

use Glory\Components\DataGridRenderer;

function filtrarBarberosAjaxCallback()
{
    error_log('[realtime] filtrarBarberosAjaxCallback llamado');
    $claveOpcion = 'barberia_barberos';

    if (!function_exists('obtenerDatosBarberos') || !function_exists('columnasBarberos')) {
        wp_send_json_error(['mensaje' => 'Configuración de barberos no disponible.']);
        return;
    }

    list($opcionesServicios, $barberosCombinados, $serviciosMapIdANombre) = obtenerDatosBarberos($claveOpcion);

    $s = isset($_POST['s']) ? sanitize_text_field((string) $_POST['s']) : '';
    $filtroServicio = isset($_POST['filtro_servicio']) ? absint((int) $_POST['filtro_servicio']) : 0;

    $filtrados = array_filter($barberosCombinados, function ($b) use ($s, $filtroServicio) {
        // Filtro por nombre
        if ($s !== '') {
            $nombre = isset($b['name']) ? (string) $b['name'] : '';
            if (stripos($nombre, $s) === false) {
                return false;
            }
        }

        // Filtro por servicio
        if ($filtroServicio) {
            $ids = [];
            if (!empty($b['services_ids']) && is_array($b['services_ids'])) {
                $ids = array_map('intval', $b['services_ids']);
            }
            if (!in_array((int) $filtroServicio, $ids, true)) {
                return false;
            }
        }

        return true;
    });

    $barberosParaRenderizar = array_values($filtrados);
    foreach ($barberosParaRenderizar as $k => &$v) {
        $v['index'] = $k;
    }
    unset($v);

    $configuracionColumnas = columnasBarberos($opcionesServicios, $serviciosMapIdANombre);
    $configuracionColumnas['acciones_masivas_separadas'] = true;
    $configuracionColumnas['paginacion'] = true;

    ob_start();
    DataGridRenderer::render($barberosParaRenderizar, $configuracionColumnas);
    $html = ob_get_clean();
    $html = '<div class="tablaWrap">' . $html . '</div>';

    wp_send_json_success(['html' => $html]);
}
