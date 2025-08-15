<?php

function gloryDeleteBarberoHandler() {
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

function gloryDeleteServicioHandler() {
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

	try { Glory\Services\EventBus::emit('term_servicio', ['accion' => 'eliminar', 'term_id' => $term_id, 'name' => $name]); } catch (\Throwable $e) {}
	wp_redirect(admin_url('admin.php?page=barberia-servicios&deleted=1'));
	exit;
}


