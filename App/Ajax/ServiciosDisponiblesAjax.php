<?php

function serviciosDisponiblesPorHoraCallback()
{
    $fecha = sanitize_text_field($_POST['fecha'] ?? ($_POST['fecha_reserva'] ?? ''));
    $hora  = sanitize_text_field($_POST['hora'] ?? ($_POST['hora_reserva'] ?? ''));
    $barberoRaw = sanitize_text_field($_POST['barbero_id'] ?? '');
    if ($barberoRaw === '') { $barberoRaw = 'any'; }
    $barberoId = is_numeric($barberoRaw) ? absint($barberoRaw) : 0;

    if (empty($fecha) || empty($hora)) {
        wp_send_json_error(['mensaje' => 'Faltan datos para listar servicios disponibles.']);
        return;
    }

    $terms = get_terms([
        'taxonomy' => 'servicio',
        'hide_empty' => false,
    ]);
    if (is_wp_error($terms)) {
        wp_send_json_success(['options' => []]);
        return;
    }

    $options = [];
    foreach ($terms as $term) {
        // Omitir servicios inactivos
        if (get_term_meta($term->term_id, 'inactivo', true) === '1') continue;
        $duracion = get_term_meta($term->term_id, 'duracion', true) ?: 30;

        if ($barberoRaw === 'any') {
            // Ver si existe al menos un barbero que ofrezca el servicio y esté libre a esa hora
            $barberos = get_terms(['taxonomy' => 'barbero', 'hide_empty' => false]);
            if (is_wp_error($barberos) || empty($barberos)) continue;
            $disponible = false;
            foreach ($barberos as $b) {
                $bid = (int) $b->term_id;
                if (get_term_meta($bid, 'inactivo', true) === '1') continue;
                if (!function_exists('barberoOfreceServicio') || !barberoOfreceServicio($bid, (int) $term->term_id)) continue;
                if (!function_exists('obtenerHorariosDisponibles')) continue;
                $slots = obtenerHorariosDisponibles($fecha, $bid, (int) $term->term_id, (int) $duracion);
                if (in_array($hora, $slots, true)) { $disponible = true; break; }
            }
            if ($disponible) {
                $options[(int) $term->term_id] = (string) $term->name;
            }
        } else {
            if (!function_exists('barberoOfreceServicio') || !barberoOfreceServicio($barberoId, (int) $term->term_id)) continue;
            if (!function_exists('obtenerHorariosDisponibles')) continue;
            $slots = obtenerHorariosDisponibles($fecha, $barberoId, (int) $term->term_id, (int) $duracion);
            if (in_array($hora, $slots, true)) {
                $options[(int) $term->term_id] = (string) $term->name;
            }
        }
    }

    wp_send_json_success(['options' => $options]);
}


