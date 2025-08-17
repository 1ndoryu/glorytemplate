<?php

use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;


function renderPaginaReservas()
{
    if (function_exists('registrarOpcionesColoresServiciosDinamico')) {
        registrarOpcionesColoresServiciosDinamico();
    }
    if (
        isset($_GET['exportar_csv']) && $_GET['exportar_csv'] == 'true' &&
        current_user_can('manage_options') &&
        isset($_GET['_glory_export_nonce']) && wp_verify_nonce((string) $_GET['_glory_export_nonce'], 'exportar_reservas_csv')
    ) {
        exportarReservasACsv();
        exit;
    }

    // Construir URL de exportación: en admin usa admin.php, en frontend reutiliza la URL actual
    $export_ajax_action = 'glory_exportar_reservas_csv';
    $export_nonce = wp_create_nonce('exportar_reservas_csv');
    $export_url = admin_url('admin-ajax.php?action=' . $export_ajax_action . '&nonce=' . $export_nonce);
    $opcionesServicios = gloryOpcionesTaxonomia('servicio', 'Selecciona un servicio');
    $opcionesBarberos  = gloryOpcionesTaxonomia('barbero', 'Selecciona un barbero');
    // Orden por defecto: futuras y en proceso primero; pasadas al final. Si el usuario ordena por columna, se respeta.
    $orderbyParam = isset($_GET['orderby']) ? sanitize_key((string) $_GET['orderby']) : '';
    if ($orderbyParam !== '') {
        $consultaReservas = consultaReservas();
    } else {
        $consultaReservas = new WP_Query([
            'post_type' => 'reserva',
            'post__in' => wp_list_pluck(consultaReservasOrdenadas(), 'ID'),
            'orderby' => 'post__in',
            'posts_per_page' => 20,
            'post_status' => 'publish'
        ]);
    }
    $configuracionColumnas = columnasReservas();
    // Queremos que las acciones masivas se muestren fuera del DataGrid (en .acciones-pagina)
    $configuracionColumnas['acciones_masivas_separadas'] = true;
?>
    <div class="acciones-pagina-header acciones-reservas-header">
        <h1><?php echo 'Panel de Reservas'; ?></h1>
        <div class="acciones-pagina-header-buttons acciones-reservas-header-buttons">
            <a href="<?php echo esc_url($export_url); ?>" class="button button-secondary noAjax" id="btnExportarCsv" data-export-url="<?php echo esc_url($export_url); ?>">
                <?php echo 'Exportar a CSV'; ?>
            </a>
            <button class="button button-primary openModal noAjax" data-modal="modalAnadirReserva" data-form-mode="create" data-submit-action="crearReserva" data-submit-text="Añadir" data-modal-title-create="<?php echo esc_attr('Añadir Nueva Reserva'); ?>">
                <?php echo 'Añadir Reserva Manual'; ?>
            </button>
        </div>
    </div>
    <div class="acciones-pagina acciones-reservas">

        <?php
        $opcionesFiltros = [
            'preservar_keys' => ['orderby', 'order'],
            'scope' => 'reservas',
        ];
        if (!is_admin()) {
            $opcionesFiltros['ajax_action'] = 'glory_filtrar_reservas';
        }
        DataGridRenderer::renderAccionesMasivasFromConfig($configuracionColumnas);
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

    // Inyectar JS ligero para descargar CSV vía fetch sin recargar en frontend
    if (!is_admin()) {
        ?>
        <!-- Exportar CSV moved to App/assets/js/tema-exportar-reservas.js and enqueued via AssetManager defineFolder -->
        <?php
    }
}
