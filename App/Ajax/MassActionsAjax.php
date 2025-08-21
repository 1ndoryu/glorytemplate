<?php

use Glory\Components\DataGridRenderer;
use Glory\Services\EventBus;

function gloryEliminarReservasCallback() {
	error_log('[realtime] glory_eliminar_reservas_callback llamado');
	// Requiere login y capacidad apropiada
	if (!is_user_logged_in() || !current_user_can('delete_posts')) {
		wp_send_json_error(['mensaje' => 'No autorizado.'], 403);
	}
	$idsRaw = $_POST['ids'] ?? '';
	$ids = array_filter(array_map('absint', explode(',', (string)$idsRaw)));
	if (empty($ids)) {
		wp_send_json_error(['mensaje' => 'Sin IDs.']);
	}
	foreach ($ids as $id) {
		$post = get_post($id);
		if ($post && $post->post_type === 'reserva') {
			wp_delete_post($id, true);
		}
	}

	// Re-renderizar el grid con la misma configuración
	if (!function_exists('consultaReservas') || !function_exists('columnasReservas')) {
		wp_send_json_error(['mensaje' => 'Config no disponible.']);
	}
	$consultaReservas = consultaReservas();
	$configuracionColumnas = columnasReservas();
	// Asegurar que, al re-renderizar vía AJAX, respetemos la intención de mostrar
	// las acciones masivas fuera del DataGrid (coincide con lo que hace la plantilla)
	$configuracionColumnas['acciones_masivas_separadas'] = true;
	ob_start();
	DataGridRenderer::render($consultaReservas, $configuracionColumnas);
	$html = ob_get_clean();
	// Envolver siempre en .tablaWrap para mantener consistencia visual
	$html = '<div class="tablaWrap">' . $html . '</div>';
	// Emitir evento realtime para reservas tras eliminación masiva
	try { EventBus::emit('post_reserva', ['accion' => 'eliminar_masivo', 'ids' => $ids]); } catch (\Throwable $e) {}

	wp_send_json_success(['html' => $html]);
}

function gloryEliminarBarberosCallback() {
	error_log('[realtime] glory_eliminar_barberos_callback llamado');
	if (!is_user_logged_in() || !current_user_can('manage_options')) {
		wp_send_json_error(['mensaje' => 'No autorizado.'], 403);
	}
	$idsRaw = $_POST['ids'] ?? '';
	$ids = array_filter(array_map('absint', explode(',', (string)$idsRaw)));
	if (empty($ids)) {
		wp_send_json_error(['mensaje' => 'Sin IDs.']);
	}
	$option_key = 'barberia_barberos';
	$barberos = get_option($option_key, []);
	foreach ($ids as $term_id) {
		if (term_exists($term_id, 'barbero')) {
			wp_delete_term($term_id, 'barbero');
		}
		if (is_array($barberos) && !empty($barberos)) {
			$barberos = array_values(array_filter($barberos, function($b) use ($term_id) {
				return empty($b['term_id']) || intval($b['term_id']) !== $term_id;
			}));
		}
	}
	update_option($option_key, $barberos);

	if (!function_exists('obtenerDatosBarberos') || !function_exists('columnasBarberos')) {
		wp_send_json_error(['mensaje' => 'Config no disponible.']);
	}
	list($opcionesServicios, $barberosCombinados, $serviciosMapIdANombre) = obtenerDatosBarberos($option_key);
	$configuracionColumnas = columnasBarberos($opcionesServicios, $serviciosMapIdANombre);
	$configuracionColumnas['acciones_masivas_separadas'] = true;
	ob_start();
	DataGridRenderer::render($barberosCombinados, $configuracionColumnas);
	$html = ob_get_clean();
	// Envolver siempre en .tablaWrap para mantener consistencia visual
	$html = '<div class="tablaWrap">' . $html . '</div>';
	try { EventBus::emit('term_barbero', ['accion' => 'eliminar_masivo', 'ids' => $ids]); } catch (\Throwable $e) {}
	wp_send_json_success(['html' => $html]);
}

function gloryToggleBarberoCallback() {
    error_log('[realtime] glory_toggle_barbero_callback llamado');
    if (!is_user_logged_in() || !current_user_can('manage_options')) {
        wp_send_json_error(['mensaje' => 'No autorizado.'], 403);
    }
    $term_id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    if ($term_id <= 0 || !term_exists($term_id, 'barbero')) {
        wp_send_json_error(['mensaje' => 'ID inválido.']);
    }
    $current = get_term_meta($term_id, 'inactivo', true) === '1';
    $new = $current ? '0' : '1';
    update_term_meta($term_id, 'inactivo', $new);

    // Re-renderizar lista
    $option_key = 'barberia_barberos';
    if (!function_exists('obtenerDatosBarberos') || !function_exists('columnasBarberos')) {
        wp_send_json_error(['mensaje' => 'Config no disponible.']);
    }
    list($opcionesServicios, $barberosCombinados, $serviciosMapIdANombre) = obtenerDatosBarberos($option_key);
    $configuracionColumnas = columnasBarberos($opcionesServicios, $serviciosMapIdANombre);
    $configuracionColumnas['acciones_masivas_separadas'] = true;
    ob_start();
    DataGridRenderer::render($barberosCombinados, $configuracionColumnas);
    $html = ob_get_clean();
    // Unificar respuesta: siempre devolver envuelto en .tablaWrap para reemplazo consistente en frontend
    $html = '<div class="tablaWrap">' . $html . '</div>';
    try { EventBus::emit('term_barbero', ['accion' => 'toggle', 'term_id' => $term_id, 'nuevo' => $new]); } catch (
    \Throwable $e) {}
    wp_send_json_success(['html' => $html]);
}

function gloryEliminarServiciosCallback() {
	error_log('[realtime] glory_eliminar_servicios_callback llamado');
	if (!is_user_logged_in() || !current_user_can('manage_options')) {
		wp_send_json_error(['mensaje' => 'No autorizado.'], 403);
	}
	$idsRaw = $_POST['ids'] ?? '';
	$ids = array_filter(array_map('absint', explode(',', (string)$idsRaw)));
	if (empty($ids)) { wp_send_json_error(['mensaje' => 'Sin IDs.']); }
	$option_key = 'barberia_servicios';
	$servicios = get_option($option_key, []);
	foreach ($ids as $term_id) {
		if (term_exists($term_id, 'servicio')) { wp_delete_term($term_id, 'servicio'); }
		if (is_array($servicios) && !empty($servicios)) {
			$servicios = array_values(array_filter($servicios, function($s) use ($term_id) {
				return empty($s['term_id']) || intval($s['term_id']) !== $term_id;
			}));
		}
	}
	update_option($option_key, $servicios);
	if (!function_exists('obtenerDatosServicios') || !function_exists('columnasServicios')) {
		wp_send_json_error(['mensaje' => 'Config no disponible.']);
	}
	$lista = obtenerDatosServicios();
	$configuracionColumnas = columnasServicios();
	$configuracionColumnas['acciones_masivas_separadas'] = true;
	ob_start();
	DataGridRenderer::render($lista, $configuracionColumnas);
	$html = ob_get_clean();
	// Envolver siempre en .tablaWrap para mantener consistencia visual
	$html = '<div class="tablaWrap">' . $html . '</div>';
	try { EventBus::emit('term_servicio', ['accion' => 'eliminar_masivo', 'ids' => $ids]); } catch (\Throwable $e) {}
	wp_send_json_success(['html' => $html]);
}


