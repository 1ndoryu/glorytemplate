<?php

use Glory\Components\DataGridRenderer;

function filtrarGananciasAjaxCallback()
{
	// --- Recolectar filtros desde POST ---
	$fechaDesde = isset($_POST['fecha_desde']) ? sanitize_text_field((string) $_POST['fecha_desde']) : '';
	$fechaHasta = isset($_POST['fecha_hasta']) ? sanitize_text_field((string) $_POST['fecha_hasta']) : '';
	$barberoId  = isset($_POST['filtro_barbero']) ? absint((int) $_POST['filtro_barbero']) : 0;
	$servicioId = isset($_POST['filtro_servicio']) ? absint((int) $_POST['filtro_servicio']) : 0;

	// --- Construir consulta ---
	$argsConsulta = [
		'post_type'      => 'reserva',
		'posts_per_page' => -1,
		'post_status'    => 'publish',
		'meta_query'     => ['relation' => 'AND'],
		'tax_query'      => ['relation' => 'AND'],
	];

	if ($fechaDesde !== '') {
		$argsConsulta['meta_query'][] = [
			'key'     => 'fecha_reserva',
			'value'   => $fechaDesde,
			'compare' => '>=',
			'type'    => 'DATE'
		];
	}
	if ($fechaHasta !== '') {
		$argsConsulta['meta_query'][] = [
			'key'     => 'fecha_reserva',
			'value'   => $fechaHasta,
			'compare' => '<=',
			'type'    => 'DATE'
		];
	}
	if ($barberoId > 0) {
		$argsConsulta['tax_query'][] = [
			'taxonomy' => 'barbero',
			'field'    => 'term_id',
			'terms'    => $barberoId,
		];
	}
	if ($servicioId > 0) {
		$argsConsulta['tax_query'][] = [
			'taxonomy' => 'servicio',
			'field'    => 'term_id',
			'terms'    => $servicioId,
		];
	}

	$q = new WP_Query($argsConsulta);

	$reservasDetalladas = [];
	$totalGanado = 0.0;
	$totalReservas = 0;
	if ($q->have_posts()) {
		while ($q->have_posts()) {
			$q->the_post();
			$postId = get_the_ID();
			$serviciosPost = get_the_terms($postId, 'servicio');
			$barberosPost  = get_the_terms($postId, 'barbero');
			if (is_array($serviciosPost) && !empty($serviciosPost)) {
				$primerServicio = $serviciosPost[0];
				$precio = get_term_meta($primerServicio->term_id, 'precio', true);
				$precio = is_numeric($precio) ? floatval($precio) : 0;
				$totalGanado += $precio;
				$totalReservas++;
				$reservasDetalladas[] = [
					'cliente'  => get_the_title(),
					'fecha'    => (string) get_post_meta($postId, 'fecha_reserva', true),
					'servicio' => $primerServicio->name,
					'barbero'  => (is_array($barberosPost) && !empty($barberosPost)) ? $barberosPost[0]->name : 'N/A',
					'precio'   => $precio,
				];
			}
		}
	}
	wp_reset_postdata();

	$promedioReserva = $totalReservas > 0 ? ($totalGanado / $totalReservas) : 0;

	$configuracionColumnas = [
		'columnas' => [
			['etiqueta' => 'Cliente', 'clave' => 'cliente'],
			['etiqueta' => 'Fecha', 'clave' => 'fecha'],
			['etiqueta' => 'Servicio', 'clave' => 'servicio'],
			['etiqueta' => 'Barbero', 'clave' => 'barbero'],
			['etiqueta' => 'Precio', 'clave' => 'precio', 'callback' => function ($row) {
				$precio = isset($row['precio']) ? floatval($row['precio']) : 0;
				return number_format($precio, 2) . ' €';
			}],
		],
		'paginacion' => false,
	];

	ob_start();
	echo '<div class="ganancias-grid-wrap">';
	DataGridRenderer::render(array_values($reservasDetalladas), $configuracionColumnas);
	echo '</div>';
	$html = ob_get_clean();

	$summaryHtml = '<div class="glory-analytics-summary resumen-ganancias">'
		. '<div class="summary-card"><h3>Ingresos Totales</h3><p>' . number_format($totalGanado, 2) . ' €</p></div>'
		. '<div class="summary-card"><h3>Total de Reservas</h3><p>' . intval($totalReservas) . '</p></div>'
		. '<div class="summary-card"><h3>Media por Reserva</h3><p>' . number_format($promedioReserva, 2) . ' €</p></div>'
		. '</div>';

	wp_send_json_success([
		'html' => $html,
		'fragments' => [
			'.glory-analytics-summary' => $summaryHtml,
		],
	]);
}


