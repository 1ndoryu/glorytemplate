<?php

use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;


function renderPaginaReservas()
{
    if (function_exists('registrarOpcionesColoresServiciosDinamico')) {
        registrarOpcionesColoresServiciosDinamico();
    }
    if (isset($_GET['exportar_csv']) && $_GET['exportar_csv'] == 'true' && current_user_can('manage_options')) {
        exportarReservasACsv();
        exit;
    }

    $export_url = add_query_arg(['exportar_csv' => 'true'], admin_url('admin.php?page=barberia-reservas'));
    $opcionesServicios = gloryOpcionesTaxonomia('servicio', 'Selecciona un servicio');
    $opcionesBarberos  = gloryOpcionesTaxonomia('barbero', 'Selecciona un barbero');
    $consultaReservas      = consultaReservas();
    $configuracionColumnas = columnasReservas();
    // moved: allowed_html and filtros_separados are defined in columnasReservas()
?>
    <h1><?php echo 'Panel de Reservas'; ?></h1>
    <div class="acciones-reservas" style="flex-direction: column; gap: 10px; align-items: flex-start;">
        <div>
            <a href="<?php echo esc_url($export_url); ?>" class="button button-secondary">
                <?php echo 'Exportar a CSV'; ?>
            </a>
            <button class="button button-primary openModal" data-modal="modalAnadirReserva" data-form-mode="create" data-submit-action="crearReserva" data-submit-text="Añadir" data-modal-title-create="<?php echo esc_attr('Añadir Nueva Reserva'); ?>">
                <?php echo 'Añadir Reserva Manual'; ?>
            </button>
        </div>
        <?php
        BarraFiltrosRenderer::render([
            ['tipo' => 'search', 'name' => 's', 'label' => 'Cliente', 'placeholder' => 'Buscar por nombre…'],
            ['tipo' => 'date', 'name' => 'fecha_desde', 'label' => 'Desde'],
            ['tipo' => 'date', 'name' => 'fecha_hasta', 'label' => 'Hasta'],
            ['tipo' => 'select', 'name' => 'filtro_servicio', 'label' => 'Servicio', 'opciones' => $opcionesServicios],
            ['tipo' => 'select', 'name' => 'filtro_barbero', 'label' => 'Barbero', 'opciones' => $opcionesBarberos],
        ], [
            'preservar_keys' => ['orderby', 'order'],
        ]);
        ?>
    </div>
<?php

    renderModalReserva($opcionesServicios, $opcionesBarberos);
    DataGridRenderer::render($consultaReservas, $configuracionColumnas);
    imprimirScriptsColoresServicios();
}
