<?php

function barberosDisponiblesPorHoraCallback()
{
    $fecha = sanitize_text_field($_POST['fecha'] ?? ($_POST['fecha_reserva'] ?? ''));
    $hora  = sanitize_text_field($_POST['hora'] ?? ($_POST['hora_reserva'] ?? ''));
    $servicioId = absint($_POST['servicio_id'] ?? 0);

    if (empty($fecha) || empty($hora) || empty($servicioId)) {
        wp_send_json_error(['mensaje' => 'Faltan datos para listar barberos disponibles.']);
        return;
    }

    $servicio = get_term($servicioId, 'servicio');
    if (is_wp_error($servicio) || !$servicio) {
        wp_send_json_error(['mensaje' => 'Servicio no válido.']);
        return;
    }
    $duracion = get_term_meta($servicio->term_id, 'duracion', true) ?: 30;

    // Buscar barberos activos que ofrezcan el servicio
    $barberos = get_terms([
        'taxonomy'   => 'barbero',
        'hide_empty' => false,
    ]);
    if (is_wp_error($barberos)) {
        wp_send_json_success(['options' => []]);
        return;
    }

    $options = [];
    foreach ($barberos as $term) {
        $barberoId = (int) $term->term_id;
        // Omitir barberos dados de baja
        if (get_term_meta($barberoId, 'inactivo', true) === '1') {
            continue;
        }
        if (!function_exists('barberoOfreceServicio') || !function_exists('obtenerHorariosDisponibles')) {
            continue;
        }
        if (!barberoOfreceServicio($barberoId, $servicioId)) {
            continue;
        }
        $slots = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion);
        if (in_array($hora, $slots, true)) {
            $options[$barberoId] = (string) $term->name;
        }
    }

    // Incluir 'Cualquier barbero' como primera opción si hay barberos disponibles
    if (!empty($options)) {
        $options = array_merge(['any' => 'Cualquier barbero'], $options);
    }

    wp_send_json_success(['options' => $options]);
}


