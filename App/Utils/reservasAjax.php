<?php
// Callbacks AJAX para reservas (antes en funcionesAjax.php)

use Glory\Core\OpcionRepository;

function verificarDisponibilidadCallback()
{
    // Aceptar tanto 'fecha' (antiguo) como 'fecha_reserva' (usado en formularios)
    $fecha = sanitize_text_field($_POST['fecha'] ?? ($_POST['fecha_reserva'] ?? ''));
    $barberoId = absint($_POST['barbero_id'] ?? 0);
    $servicioId = absint($_POST['servicio_id'] ?? 0);
    $excludeId = absint($_POST['exclude_id'] ?? 0);

    if (empty($fecha) || empty($barberoId) || empty($servicioId)) {
        wp_send_json_error(['mensaje' => 'Faltan datos para verificar la disponibilidad.']);
        return;
    }

    try {
        $fechaObj = new DateTime($fecha);
        $hoy = new DateTime('today');
        if ($fechaObj < $hoy) {
            wp_send_json_error(['mensaje' => 'No puedes reservar en una fecha pasada.']);
            return;
        }
        if ($fechaObj->format('N') == 7) { // 7 = Domingo
            wp_send_json_error(['mensaje' => 'No se admiten reservas los domingos.']);
            return;
        }
    } catch (Exception $e) {
        wp_send_json_error(['mensaje' => 'Formato de fecha inválido.']);
        return;
    }

    $servicio = get_term($servicioId, 'servicio');
    if (is_wp_error($servicio) || !$servicio) {
        wp_send_json_error(['mensaje' => 'Servicio no válido.']);
        return;
    }
    $duracion = get_term_meta($servicio->term_id, 'duracion', true) ?: 30;

    $horariosDisponibles = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion, $excludeId);

    wp_send_json_success(['options' => $horariosDisponibles]);
}

function serviciosPorBarberoCallback() {
    $barberoId = absint($_POST['barbero_id'] ?? 0);
    if (!$barberoId) {
        wp_send_json_error(['mensaje' => 'Barbero no válido.']);
        return;
    }

    // Leer IDs de servicios desde meta del término 'barbero'
    $servicesIds = get_term_meta($barberoId, 'servicios', true);
    if (!is_array($servicesIds)) {
        $servicesIds = [];
    }
    $servicesIds = array_values(array_unique(array_map('intval', $servicesIds)));

    $options = [];
    foreach ($servicesIds as $sid) {
        $term = get_term($sid, 'servicio');
        if ($term && !is_wp_error($term)) {
            $options[$term->term_id] = $term->name;
        }
    }

    wp_send_json_success(['options' => $options]);
}

function manejarExportacionReservasCsv() {
    if (
        isset($_GET['page']) && $_GET['page'] === 'barberia-reservas' &&
        isset($_GET['exportar_csv']) && $_GET['exportar_csv'] === 'true' &&
        current_user_can('manage_options')
    ) {
        exportarReservasACsv();
        exit;
    }
}

function actualizarColorServicioCallback() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['mensaje' => 'Permisos insuficientes.'], 403);
    }
    $nonce = $_POST['_wpnonce'] ?? '';
    if (!wp_verify_nonce($nonce, 'glory_color_servicio')) {
        wp_send_json_error(['mensaje' => 'Nonce inválido.'], 403);
    }

    $slug = sanitize_title($_POST['slug'] ?? '');
    $color = sanitize_hex_color($_POST['color'] ?? '');

    if (empty($slug) || empty($color)) {
        wp_send_json_error(['mensaje' => 'Datos incompletos.']);
    }

    $key = 'glory_scheduler_color_' . str_replace('-', '_', $slug);
    $ok = OpcionRepository::save($key, $color);

    if ($ok) {
        wp_send_json_success(['mensaje' => 'Color actualizado.', 'key' => $key, 'color' => $color]);
    } else {
        wp_send_json_error(['mensaje' => 'No se pudo guardar el color.']);
    }
}

function obtenerReservaCallback() {
    if (!current_user_can('edit_posts')) {
        wp_send_json_error(['mensaje' => 'Permisos insuficientes.'], 403);
    }

    $id = absint($_POST['id'] ?? 0);
    if (!$id) {
        wp_send_json_error(['mensaje' => 'ID inválido.'], 400);
    }

    $post = get_post($id);
    if (!$post || $post->post_type !== 'reserva') {
        wp_send_json_error(['mensaje' => 'Reserva no encontrada.'], 404);
    }

    $servicio = get_the_terms($id, 'servicio');
    $barbero = get_the_terms($id, 'barbero');

    wp_send_json_success([
        'id' => $id,
        'nombre_cliente' => $post->post_title,
        'telefono_cliente' => get_post_meta($id, 'telefono_cliente', true) ?: '',
        'correo_cliente' => get_post_meta($id, 'correo_cliente', true) ?: '',
        'fecha_reserva' => get_post_meta($id, 'fecha_reserva', true) ?: '',
        'hora_reserva' => get_post_meta($id, 'hora_reserva', true) ?: '',
        'servicio_id' => is_array($servicio) && !is_wp_error($servicio) && !empty($servicio) ? $servicio[0]->term_id : '',
        'barbero_id' => is_array($barbero) && !is_wp_error($barbero) && !empty($barbero) ? $barbero[0]->term_id : '',
    ]);
}


