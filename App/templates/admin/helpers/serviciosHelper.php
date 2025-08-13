<?php

use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;

if (!defined('ABSPATH')) {
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
	];
}
