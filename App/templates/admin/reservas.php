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
?>
    <div class="acciones-reservas-header">
        <h1><?php echo 'Panel de Reservas';?></h1>
        <div class="acciones-reservas-header-buttons">
            <a href="<?php echo esc_url($export_url); ?>" class="button button-secondary">
                <?php echo 'Exportar a CSV'; ?>
            </a>
            <button class="button button-primary openModal" data-modal="modalAnadirReserva" data-form-mode="create" data-submit-action="crearReserva" data-submit-text="Añadir" data-modal-title-create="<?php echo esc_attr('Añadir Nueva Reserva'); ?>">
                <?php echo 'Añadir Reserva Manual'; ?>
            </button>
        </div>
    </div>
    <div class="acciones-reservas" style="flex-direction: column; gap: 10px;">

        <?php
        $opcionesFiltros = [
            'preservar_keys' => ['orderby', 'order'],
        ];
        if (!is_admin()) {
            $opcionesFiltros['ajax_action'] = 'glory_filtrar_reservas';
        }
        BarraFiltrosRenderer::render([
            ['tipo' => 'search', 'name' => 's', 'label' => 'Cliente', 'placeholder' => 'Buscar por nombre…'],
            ['tipo' => 'date_range', 'name' => 'rango', 'label' => 'Rango de fechas', 'from_name' => 'fecha_desde', 'to_name' => 'fecha_hasta', 'placeholder' => 'Fecha desde — hasta'],
            ['tipo' => 'select', 'name' => 'filtro_servicio', 'label' => 'Servicio', 'opciones' => $opcionesServicios],
            ['tipo' => 'select', 'name' => 'filtro_barbero', 'label' => 'Barbero', 'opciones' => $opcionesBarberos],
        ], $opcionesFiltros);
        ?>
    </div>
<?php

    renderModalReserva($opcionesServicios, $opcionesBarberos);
    if (!is_admin()) {
        echo '<div class="tablaWrap">';
    }
    DataGridRenderer::render($consultaReservas, $configuracionColumnas);
    if (!is_admin()) {
        echo '</div>';
    }
    imprimirScriptsColoresServicios();
}
