<?php

use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;

require_once __DIR__ . '/helpers/historialHelper.php';

function renderPaginaHistorial()
{
	// 1) Construir datos base
	$clientes = obtenerHistorialClientes();

	// 2) Filtro por nombre (similar a reservas: input 's')
	$texto = isset($_GET['s']) ? sanitize_text_field((string) $_GET['s']) : '';
	if ($texto !== '') {
		$clientes = filtrarHistorialPorNombre($clientes, $texto);
	}

	// 3) Orden: soportar por nombre y por fecha (default fecha desc)
	$orderby = isset($_GET['orderby']) ? sanitize_key((string) $_GET['orderby']) : '';
	$order   = (isset($_GET['order']) && strtolower((string) $_GET['order']) === 'asc') ? 'asc' : 'desc';
	$map = [
		'post_title'   => 'nombre',
		'nombre'       => 'nombre',
		'ultimaVisita' => 'ultimaVisita',
	];
	$claveOrden = $map[$orderby] ?? 'ultimaVisita';
	$clientes = ordenarHistorialClientes($clientes, $claveOrden, $order);

	// 4) Columnas (ordenables en nombre y fecha)
	$configuracionColumnas = columnasHistorial();
	// Mostrar filtros arriba externos como en reservas
	$opcionesFiltros = [
		'preservar_keys' => ['orderby', 'order'],
	];
	// Activar modo AJAX también en admin, como en reservas
	$opcionesFiltros['ajax_action'] = 'glory_filtrar_historial';

?>
	<div class="acciones-pagina-header">
		<h1><?php echo 'Historial de Clientes'; ?></h1>
	</div>
	<div class="acciones-pagina">
		<?php
		BarraFiltrosRenderer::render([
			['tipo' => 'search', 'name' => 's', 'label' => 'Cliente', 'placeholder' => 'Buscar por nombre…'],
		], $opcionesFiltros);
		?>
    </div>
<?php
	if (!is_admin()) {
		echo '<div class="tablaWrap">';
	}
	DataGridRenderer::render($clientes, $configuracionColumnas);
	if (!is_admin()) {
		echo '</div>';
	}
}
