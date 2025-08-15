<?php

use Glory\Components\DataGridRenderer;

require_once get_template_directory() . '/App/Templates/admin/helpers/historialHelper.php';

function filtrarHistorialAjaxCallback()
{
	// Construir datos base
	$clientes = obtenerHistorialClientes();

	// Filtros desde POST
	$texto = isset($_POST['s']) ? sanitize_text_field((string) $_POST['s']) : '';
	if ($texto !== '') {
		$clientes = filtrarHistorialPorNombre($clientes, $texto);
	}

	// Ordenamiento
	$orderby = isset($_POST['orderby']) ? sanitize_key((string) $_POST['orderby']) : '';
	$order   = (isset($_POST['order']) && strtolower((string) $_POST['order']) === 'asc') ? 'asc' : 'desc';
	$map = [
		'post_title'   => 'nombre',
		'nombre'       => 'nombre',
		'ultimaVisita' => 'ultimaVisita',
	];
	$claveOrden = $map[$orderby] ?? 'ultimaVisita';
	$clientes = ordenarHistorialClientes($clientes, $claveOrden, $order);

	// Renderizado
	$configuracionColumnas = columnasHistorial();
	$configuracionColumnas['paginacion'] = true;
	ob_start();
	// Envolver con tablaWrap para consistencia visual
	echo '<div class="tablaWrap">';
	DataGridRenderer::render($clientes, $configuracionColumnas);
	echo '</div>';
	$html = ob_get_clean();

	wp_send_json_success(['html' => $html]);
}


