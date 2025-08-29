<?php

use Glory\Components\DataGridRenderer;

function filtrarBarberosAjaxCallback()
{
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

/**
 * Devuelve todos los barberos (incluye dados de baja como "Vacaciones") con su estado para una fecha/servicio/hora.
 * - Disponible: tiene slots libres hoy (o exactamente a la hora dada si se pasa hora)
 * - Disponible a las hh:mm: si ahora no tiene el slot exacto pero sí uno más tarde el mismo día
 * - Vacaciones: si meta 'inactivo' = '1'
 * Siempre incluye la opción especial 'any' (Cualquier barbero) al inicio.
 */
function barberosConEstadoAjaxCallback()
{
    $fecha = sanitize_text_field($_POST['fecha'] ?? ($_POST['fecha_reserva'] ?? ''));
    $hora  = sanitize_text_field($_POST['hora'] ?? ($_POST['hora_reserva'] ?? ''));
    $servicioId = absint($_POST['servicio_id'] ?? 0);

    // Listar SIEMPRE todos los barberos (aunque no ofrezcan el servicio), pero el estado de disponibilidad
    // solo se calcula si hay servicio y fecha.
    $barberos = get_terms([
        'taxonomy'   => 'barbero',
        'hide_empty' => false,
    ]);
    if (is_wp_error($barberos)) {
        wp_send_json_success(['items' => []]);
        return;
    }

    $items = [];
    $tz = obtenerZonaHorariaWp();
    $fechaValida = !empty($fecha);
    $servicioValido = $servicioId > 0;

    foreach ($barberos as $term) {
        $barberoId = (int) $term->term_id;
        $inactivo = get_term_meta($barberoId, 'inactivo', true) === '1';

        $estado = 'Vacaciones';
        $estadoColor = 'gray';
        $siguienteHora = '';

        if ($inactivo) {
            $estado = 'Vacaciones';
            $estadoColor = 'gray';
        } else if ($fechaValida && $servicioValido) {
            // Duración del servicio
            $servicio = get_term($servicioId, 'servicio');
            $duracion = $servicio && !is_wp_error($servicio) ? (get_term_meta($servicio->term_id, 'duracion', true) ?: 30) : 30;

            // Slots disponibles del día para el barbero
            $slots = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, (int)$duracion);

            if (!empty($hora)) {
                if (in_array($hora, $slots, true)) {
                    $estado = 'Disponible';
                    $estadoColor = 'green';
                } else {
                    // Buscar el primer slot posterior a la hora solicitada
                    $posteriores = array_values(array_filter($slots, static function ($h) use ($hora) { return strcmp($h, $hora) > 0; }));
                    if (!empty($posteriores)) {
                        $siguienteHora = $posteriores[0];
                        $estado = 'Disponible a las ' . $siguienteHora;
                        $estadoColor = 'orange';
                    } else {
                        $estado = 'Sin disponibilidad hoy';
                        $estadoColor = 'red';
                    }
                }
            } else {
                // Sin hora específica: si tiene algún slot, está disponible
                if (!empty($slots)) {
                    $estado = 'Disponible';
                    $estadoColor = 'green';
                } else {
                    $estado = 'Sin disponibilidad hoy';
                    $estadoColor = 'red';
                }
            }
        } else {
            // Si falta fecha o servicio, no podemos calcular disponibilidad real
            $estado = 'Selecciona fecha y servicio';
            $estadoColor = 'gray';
        }

        // Imagen
        $image_id = (int) get_term_meta($barberoId, 'image_id', true);
        $image_url_meta = (string) get_term_meta($barberoId, 'image_url', true);
        $image_url = '';
        if ($image_id > 0) {
            $image_url = wp_get_attachment_image_url($image_id, 'thumbnail');
        }
        if (!$image_url && !empty($image_url_meta)) {
            $image_url = $image_url_meta;
        }
        if (!$image_url) {
            $nameForAvatar = urlencode($term->name);
            $image_url = "https://avatar.vercel.sh/{$nameForAvatar}.svg?size=80&rounded=80";
        }

        $items[] = [
            'id' => $barberoId,
            'nombre' => (string) $term->name,
            'estado' => $estado,
            'estadoColor' => $estadoColor,
            'imagen' => $image_url,
            'inactivo' => $inactivo,
        ];
    }

    wp_send_json_success([
        'items' => $items,
        'any' => [
            'id' => 'any',
            'nombre' => 'Cualquier barbero',
            'estado' => 'Mayor disponibilidad',
            'estadoColor' => 'green',
            'imagen' => 'https://avatar.vercel.sh/any.svg?size=80&rounded=80',
        ],
    ]);
}