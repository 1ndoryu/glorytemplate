<?php

use Glory\Core\OpcionRepository;
use Glory\Components\DataGridRenderer;

function actualizarColorServicioCallback()
{
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

function filtrarServiciosAjaxCallback() {
	error_log('[realtime] filtrarServiciosAjaxCallback llamado');
	if (!function_exists('obtenerDatosServicios') || !function_exists('columnasServicios')) {
		wp_send_json_error(['mensaje' => 'Configuración de servicios no disponible.']);
	}
	$lista = obtenerDatosServicios();
	$configuracionColumnas = columnasServicios();
	$configuracionColumnas['acciones_masivas_separadas'] = true;
	ob_start();
	DataGridRenderer::render($lista, $configuracionColumnas);
	$html = ob_get_clean();
	// Unificar con reservas y barberos: siempre envolver en .tablaWrap para mantener estilos/bordes
	$html = '<div class="tablaWrap">' . $html . '</div>';
	wp_send_json_success(['html' => $html]);
}


