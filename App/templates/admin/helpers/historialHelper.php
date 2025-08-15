<?php

use Glory\Components\DataGridRenderer;

/**
 * Construye el array base del historial de clientes a partir de las reservas.
 *
 * @return array<int,array<string,mixed>>
 */
function obtenerHistorialClientes(): array
{
	$consultaReservas = new WP_Query([
		'post_type'      => 'reserva',
		'posts_per_page' => -1,
		'post_status'    => 'publish',
		'orderby'        => 'meta_value',
		'meta_key'       => 'fecha_reserva',
		'order'          => 'DESC',
	]);

	$historialClientes = [];

	if ($consultaReservas->have_posts()) {
		while ($consultaReservas->have_posts()) {
			$consultaReservas->the_post();
			$postId          = get_the_ID();
			$nombreCliente   = get_the_title();
			$telefonoCliente = get_post_meta($postId, 'telefono_cliente', true) ?: 'sin-telefono';

			$identificadorCliente = sanitize_key($nombreCliente . '_' . $telefonoCliente);

			if (!isset($historialClientes[$identificadorCliente])) {
				$historialClientes[$identificadorCliente] = [
					'nombre'            => $nombreCliente,
					'telefono'          => $telefonoCliente,
					'totalVisitas'      => 0,
					'gastoTotal'        => 0,
					'ultimaVisita'      => '0000-00-00',
					'ultimoServicio'    => '',
					'conteoServicios'   => [],
				];
			}

			$historialClientes[$identificadorCliente]['totalVisitas']++;

			$fechaReserva = get_post_meta($postId, 'fecha_reserva', true);
			if ($fechaReserva && $fechaReserva > $historialClientes[$identificadorCliente]['ultimaVisita']) {
				$historialClientes[$identificadorCliente]['ultimaVisita'] = $fechaReserva;
			}

			$servicios = get_the_terms($postId, 'servicio');
			if (!is_wp_error($servicios) && !empty($servicios)) {
				$primerServicio = $servicios[0];

				if ($fechaReserva === $historialClientes[$identificadorCliente]['ultimaVisita']) {
					$historialClientes[$identificadorCliente]['ultimoServicio'] = $primerServicio->name;
				}

				$nombreServicio = $primerServicio->name;
				if (!isset($historialClientes[$identificadorCliente]['conteoServicios'][$nombreServicio])) {
					$historialClientes[$identificadorCliente]['conteoServicios'][$nombreServicio] = 0;
				}
				$historialClientes[$identificadorCliente]['conteoServicios'][$nombreServicio]++;

				$precio = get_term_meta($primerServicio->term_id, 'precio', true);
				if (is_numeric($precio)) {
					$historialClientes[$identificadorCliente]['gastoTotal'] += floatval($precio);
				}
			}
		}
	}
	wp_reset_postdata();

	foreach ($historialClientes as &$cliente) {
		arsort($cliente['conteoServicios']);
		$serviciosFrecuentes = array_slice(array_keys($cliente['conteoServicios']), 0, 3);
		$cliente['serviciosFrecuentes'] = implode(', ', $serviciosFrecuentes);
	}
	unset($cliente);

	return array_values($historialClientes);
}

/**
 * Filtra el historial por coincidencia de nombre (title).
 */
function filtrarHistorialPorNombre(array $clientes, string $texto): array
{
	$texto = trim($texto);
	if ($texto === '') return $clientes;
	return array_values(array_filter($clientes, function ($c) use ($texto) {
		$nombre = (string) ($c['nombre'] ?? '');
		return stripos($nombre, $texto) !== false;
	}));
}

/**
 * Ordena el historial por nombre o fecha. Por defecto: fecha DESC.
 */
function ordenarHistorialClientes(array $clientes, string $orderby, string $order): array
{
	$clave = in_array($orderby, ['nombre', 'ultimaVisita'], true) ? $orderby : 'ultimaVisita';
	$desc = (strtolower($order) === 'desc');
	usort($clientes, function ($a, $b) use ($clave, $desc) {
		$va = $a[$clave] ?? '';
		$vb = $b[$clave] ?? '';
		if ($clave === 'nombre') {
			$cmp = strnatcasecmp((string)$va, (string)$vb);
		} else {
			// 'YYYY-MM-DD' compara bien lexicográficamente
			$cmp = strcmp((string)$va, (string)$vb);
		}
		return $desc ? -$cmp : $cmp;
	});
	return $clientes;
}

/**
 * Configuración de columnas del DataGrid para Historial.
 */
function columnasHistorial(): array
{
	return [
		'columnas' => [
			[
				'etiqueta' => 'Nombre del Cliente',
				'clave'    => 'nombre',
				'ordenable'=> true,
				'callback' => function ($cliente) {
					return '<strong>' . esc_html($cliente['nombre']) . '</strong>';
				}
			],
			['etiqueta' => 'Teléfono', 'clave' => 'telefono'],
			['etiqueta' => 'Total Visitas', 'clave' => 'totalVisitas'],
			[
				'etiqueta' => 'Gasto Total',
				'clave'    => 'gastoTotal',
				'callback' => function ($cliente) {
					return number_format((float) $cliente['gastoTotal'], 2) . ' €';
				}
			],
			[
				'etiqueta' => 'Fecha Última Visita',
				'clave'    => 'ultimaVisita',
				'ordenable'=> true,
				'callback' => function ($cliente) {
					return esc_html(date_format(date_create($cliente['ultimaVisita']), 'd/m/Y'));
				}
			],
			['etiqueta' => 'Último Servicio', 'clave' => 'ultimoServicio'],
			['etiqueta' => 'Servicios Frecuentes', 'clave' => 'serviciosFrecuentes'],
		],
		'paginacion' => true,
		'per_page' => 20,
	];
}


