<?php

use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;
use Glory\Components\FormularioFluente;
use Glory\Components\Modal;
use Glory\Services\EventBus;

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Procesa el formulario de creación/edición/eliminación de servicios.
 * Realiza la sincronización con la taxonomía 'servicio' y sus metas.
 * Si procesa una acción válida, redirige a la página de servicios y hace exit.
 */
function procesarFormularioServicios(): void
{
	if ($_SERVER['REQUEST_METHOD'] !== 'POST') return;
	if (!isset($_POST['servicios_nonce']) || !wp_verify_nonce($_POST['servicios_nonce'], 'servicios_save')) return;

	$option_key = 'barberia_servicios';
	$servicios = get_option($option_key, []);
	$action = $_POST['action'] ?? '';

	if ($action === 'delete' && !empty($_POST['id'])) {
		$id = intval($_POST['id']);
		if (isset($servicios[$id])) {
			// Si existe term_id asociado, eliminar término de la taxonomía
			if (!empty($servicios[$id]['term_id'])) {
				$term_id = intval($servicios[$id]['term_id']);
				if (term_exists($term_id, 'servicio')) {
					wp_delete_term($term_id, 'servicio');
				}
			}
			unset($servicios[$id]);
			update_option($option_key, array_values($servicios));
			try { EventBus::emit('term_servicio', ['accion' => 'eliminar', 'id' => $id]); } catch (\Throwable $e) {}
		}
	} else {
		$name = sanitize_text_field($_POST['name'] ?? '');
		$price = floatval($_POST['price'] ?? 0);
		$duration = intval($_POST['duration'] ?? 30);

		$editing = isset($_POST['id']) && $_POST['id'] !== '';
		if ($editing) {
			$id = intval($_POST['id']);
			if (isset($servicios[$id])) {
				$servicios[$id]['name'] = $name;
				$servicios[$id]['price'] = $price;
				$servicios[$id]['duration'] = $duration;

				// Sincronizar término de taxonomía 'servicio' y meta 'duracion'/'precio'
				$term_id = !empty($servicios[$id]['term_id']) ? intval($servicios[$id]['term_id']) : 0;
				if ($term_id && term_exists($term_id, 'servicio')) {
					wp_update_term($term_id, 'servicio', ['name' => $name, 'slug' => sanitize_title($name)]);
					update_term_meta($term_id, 'duracion', $duration);
					update_term_meta($term_id, 'precio', $price);
				} else {
					$existing = term_exists($name, 'servicio');
					if ($existing === 0 || $existing === null) {
						$inserted = wp_insert_term($name, 'servicio', ['slug' => sanitize_title($name)]);
						if (!is_wp_error($inserted) && isset($inserted['term_id'])) {
							$term_id = intval($inserted['term_id']);
							$servicios[$id]['term_id'] = $term_id;
							update_term_meta($term_id, 'duracion', $duration);
							update_term_meta($term_id, 'precio', $price);
							if (function_exists('asignarServicioATodosLosBarberos')) {
								asignarServicioATodosLosBarberos($term_id);
							}
						}
					} else {
						$term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
						$servicios[$id]['term_id'] = $term_id;
						update_term_meta($term_id, 'duracion', $duration);
						update_term_meta($term_id, 'precio', $price);
					}
				}
			}
		} else {
			$new_entry = [
				'name' => $name,
				'price' => $price,
				'duration' => $duration,
			];

			$existing = term_exists($name, 'servicio');
			if ($existing === 0 || $existing === null) {
				$inserted = wp_insert_term($name, 'servicio', ['slug' => sanitize_title($name)]);
				if (!is_wp_error($inserted) && isset($inserted['term_id'])) {
					$new_entry['term_id'] = intval($inserted['term_id']);
					update_term_meta($new_entry['term_id'], 'duracion', $duration);
					update_term_meta($new_entry['term_id'], 'precio', $price);
					if (function_exists('asignarServicioATodosLosBarberos')) {
						asignarServicioATodosLosBarberos($new_entry['term_id']);
					}
				}
			} else {
				$term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
				$new_entry['term_id'] = $term_id;
				update_term_meta($term_id, 'duracion', $duration);
				update_term_meta($term_id, 'precio', $price);
			}

			$servicios[] = $new_entry;
		}

		update_option($option_key, array_values($servicios));
		try { EventBus::emit('term_servicio', ['accion' => ($editing ? 'actualizar' : 'crear')]); } catch (\Throwable $e) {}
	}

	wp_redirect(admin_url('admin.php?page=barberia-servicios'));
	exit;
}

/**
 * Obtiene y normaliza la lista de servicios combinando términos y opciones guardadas.
 * @return array<int, array{name:string, term_id?:int, duration:int, price:float}>
 */
function obtenerDatosServicios(): array
{
	$option_key = 'barberia_servicios';
	$terminos = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
	$servicios_from_terms = [];
	if (!is_wp_error($terminos)) {
		foreach ($terminos as $term) {
			$servicios_from_terms[] = [
				'name' => $term->name,
				'term_id' => intval($term->term_id),
				'duration' => intval(get_term_meta($term->term_id, 'duracion', true) ?: 30),
				'price' => floatval(get_term_meta($term->term_id, 'precio', true) ?: 0),
			];
		}
	}
	$servicios_options = get_option($option_key, []);
	$servicios_merged = $servicios_from_terms;
	if (is_array($servicios_options) && !empty($servicios_options)) {
		foreach ($servicios_options as $opt) {
			$exists = false;
			if (!empty($opt['term_id'])) {
				foreach ($servicios_merged as $m) {
					if (!empty($m['term_id']) && intval($m['term_id']) === intval($opt['term_id'])) {
						$exists = true;
						break;
					}
				}
			}
			if (!$exists) {
				$servicios_merged[] = $opt;
			}
		}
	}
	return array_values($servicios_merged);
}

/**
 * Configuración de columnas y acciones para el DataGrid de servicios.
 * @return array
 */
function columnasServicios(): array
{
	return [
		'columnas' => [
			['etiqueta' => 'Nombre', 'clave' => 'name'],
			['etiqueta' => 'Duración (min)', 'clave' => 'duration', 'callback' => function ($s) { return intval($s['duration'] ?? 0); }],
			['etiqueta' => 'Precio (€)', 'clave' => 'price', 'callback' => function ($s) { return number_format(floatval($s['price'] ?? 0), 2); }],
			['etiqueta' => 'Acciones', 'clave' => 'acciones', 'callback' => function ($s) {
				$objectId = $s['term_id'] ?? null;
				$menu_id = 'glory-submenu-servicio-' . intval($objectId ?: 0);
				$trigger = '<a href="#" class="glory-submenu-trigger noAjax" data-submenu="' . esc_attr($menu_id) . '" aria-label="' . esc_attr__('Acciones', 'glorytemplate') . '">⋯</a>';
				$nonce = wp_nonce_field('servicios_save','servicios_nonce', true, false);
				$formAction = admin_url('admin-post.php');
				$menu  = '<div id="' . esc_attr($menu_id) . '" class="glory-submenu" style="display:none;flex-direction:column;">';
				$menu .= '<a href="#" class="openModal noAjax" data-modal="modalAnadirServicio" data-form-mode="edit" data-object-id="' . esc_attr($objectId ?: 0) . '" data-fetch-action="glory_get_servicio_details" data-submit-action="guardarServicio" data-modal-title-edit="' . esc_attr('Editar Servicio') . '">' . esc_html__('Editar', 'glorytemplate') . '</a>';
				$menu .= '<a href="#" class="noAjax js-eliminar-servicio" data-term-id="' . esc_attr($objectId ?: 0) . '">' . esc_html__('Eliminar', 'glorytemplate') . '</a>';
				$menu .= '<form method="post" action="' . esc_attr($formAction) . '" style="display:none" class="glory-delete-servicio-fallback">'
					. $nonce
					. '<input type="hidden" name="action" value="glory_delete_servicio">'
					. '<input type="hidden" name="term_id" value="' . esc_attr($objectId ?: 0) . '">'
					. '<input type="hidden" name="name" value="' . esc_attr($s['name'] ?? '') . '">'
					. '</form>';
				$menu .= '</div>';
				return $trigger . $menu;
			}],
		],
		'seleccionMultiple' => true,
		'accionesMasivas' => [
			[
				'id' => 'eliminar',
				'etiqueta' => 'Eliminar',
				'ajax_action' => 'glory_eliminar_servicios',
				'confirmacion' => '¿Eliminar los servicios seleccionados?'
			]
		],
		'allowed_html' => [
			'a' => ['href' => true, 'class' => true, 'data-modal' => true, 'data-form-mode' => true, 'data-object-id' => true, 'data-fetch-action' => true, 'data-submit-action' => true, 'data-submit-text' => true, 'data-modal-title-edit' => true, 'title' => true, 'data-submenu' => true, 'data-posicion' => true, 'data-evento' => true, 'data-term-id' => true],
			'img' => ['src' => true, 'alt' => true, 'width' => true, 'height' => true, 'class' => true],
			'input' => ['type' => true, 'name' => true, 'value' => true],
			'form' => ['method' => true, 'style' => true, 'action' => true],
			'button' => ['type' => true, 'class' => true, 'onclick' => true, 'title' => true],
			'span' => ['class' => true],
			'div' => ['id' => true, 'class' => true, 'style' => true],
		],
		'filtros_separados' => true,
		'paginacion' => true,
		'per_page' => 20,
	];
}

/**
 * Renderiza el modal de creación/edición de servicio usando la API fluida.
 */
function renderModalServicio(): void
{
	$action = admin_url('admin.php?page=barberia-servicios');
	$config = [
		['fn' => 'inicio', 'args' => [
			'action' => $action,
			'method' => 'post',
			'extraClass' => 'formularioBarberia',
			'atributos' => [
				'data-fm-submit-habilitar-cuando' => 'name',
			],
		]],
		['fn' => 'campoTexto', 'args' => ['nombre' => 'name', 'label' => 'Nombre', 'obligatorio' => true]],
		['fn' => 'campoTexto', 'args' => ['nombre' => 'duration', 'label' => 'Duración (min)']],
		['fn' => 'campoTexto', 'args' => ['nombre' => 'price', 'label' => 'Precio']],
		['fn' => 'botonEnviar', 'args' => ['accion' => 'guardarServicio', 'texto' => 'Guardar', 'extraClass' => 'button-primary']],
		['fn' => 'fin'],
	];

	$form = (new FormularioFluente())->agregarDesdeConfig($config);
	$contenido = wp_nonce_field('servicios_save','servicios_nonce', true, false) . '<input type="hidden" name="id" id="servicio-id" value="">' . $form->renderizar();
	echo Modal::render('modalAnadirServicio', 'Añadir/Editar Servicio', $contenido);
}
