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
    // Permitir HTML necesario en celdas: puntos de color, picker y enlaces de acción
    $configuracionColumnas['allowed_html'] = [
        'a' => [
            'href' => true,
            'onclick' => true,
            'class' => true,
            'target' => true,
            'data-modal' => true,
            'data-id' => true,
            'title' => true,
        ],
        'span' => [
            'class' => true,
            'style' => true,
            'data-color' => true,
        ],
        'input' => [
            'type' => true,
            'class' => true,
            'value' => true,
            'data-slug' => true,
            'style' => true,
            'disabled' => true,
        ],
        'br' => [],
    ];
    $configuracionColumnas['filtros_separados'] = true;
?>
    <h1><?php echo __('Panel de Reservas', 'glorytemplate'); ?></h1>
    <div class="acciones-reservas" style="flex-direction: column; gap: 10px; align-items: flex-start;">
        <div>
            <a href="<?php echo esc_url($export_url); ?>" class="button button-secondary">
                <?php echo __('Exportar a CSV', 'glorytemplate'); ?>
            </a>
            <button class="button button-primary openModal" data-modal="modalAnadirReserva">
                <?php echo __('Añadir Reserva Manual', 'glorytemplate'); ?>
            </button>
        </div>
        <?php
        BarraFiltrosRenderer::render([
            ['tipo' => 'search', 'name' => 's', 'label' => __('Cliente', 'glorytemplate'), 'placeholder' => __('Buscar por nombre…', 'glorytemplate')],
            ['tipo' => 'date', 'name' => 'fecha_desde', 'label' => __('Desde', 'glorytemplate')],
            ['tipo' => 'date', 'name' => 'fecha_hasta', 'label' => __('Hasta', 'glorytemplate')],
            ['tipo' => 'select', 'name' => 'filtro_servicio', 'label' => __('Servicio', 'glorytemplate'), 'opciones' => $opcionesServicios],
            ['tipo' => 'select', 'name' => 'filtro_barbero', 'label' => __('Barbero', 'glorytemplate'), 'opciones' => $opcionesBarberos],
        ], [
            'preservar_keys' => ['orderby', 'order'],
        ]);
        ?>
    </div>
<?php

    renderModalReserva($opcionesServicios, $opcionesBarberos);
    DataGridRenderer::render($consultaReservas, $configuracionColumnas);
    imprimirScriptsColoresServicios();
    imprimirScriptsModalReserva();
}
