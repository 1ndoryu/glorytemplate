<?php

function serviciosPorBarberoCallback()
{
	$barberoRaw = sanitize_text_field($_POST['barbero_id'] ?? '');
	if ($barberoRaw === 'any') {
		// Devolver todos los servicios disponibles (para "Cualquier barbero")
		$servicios = get_terms([
			'taxonomy' => 'servicio',
			'hide_empty' => false,
		]);
		$options = [];
		if (!is_wp_error($servicios)) {
			foreach ($servicios as $term) {
				$options[$term->term_id] = $term->name;
			}
		}
		wp_send_json_success(['options' => $options]);
		return;
	}

	$barberoId = absint($barberoRaw);
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


