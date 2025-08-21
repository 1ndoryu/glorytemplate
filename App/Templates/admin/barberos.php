<?php

use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;

function renderPaginaBarberos()
{
    if (! current_user_can('manage_options')) {
        wp_die('No autorizado');
    }

    $claveOpcion = 'barberia_barberos';

    procesarPostBarberos($claveOpcion);
    list($opcionesServicios, $barberosCombinados, $serviciosMapIdANombre) = obtenerDatosBarberos($claveOpcion);
    wp_enqueue_media();
    $configuracionColumnas = columnasBarberos($opcionesServicios, $serviciosMapIdANombre);

?>

    <div class="acciones-pagina-header acciones-barberos-header">
        <h1>Barberos</h1>
        <div class="acciones-pagina-header-buttons acciones-barberos-header-buttons">
            <button class="button button-primary openModal noAjax" data-modal="modalAnadirBarbero" data-form-mode="create" data-modal-title-create="<?php echo esc_attr('Añadir Barbero'); ?>">Añadir Barbero</button>
        </div>
    </div>
    <?php if (!empty($_GET['deleted'])): ?>
        <div class="notice notice-success is-dismissible">
            <p><?php echo esc_html('Barbero eliminado correctamente.'); ?></p>
        </div>
    <?php endif; ?>

    <div class="acciones-pagina acciones-barberos">
        <?php
        // Mostrar acciones masivas al estilo reservas
        if (!isset($configuracionColumnas['acciones_masivas_separadas']) || $configuracionColumnas['acciones_masivas_separadas'] !== true) {
            $configuracionColumnas['acciones_masivas_separadas'] = true;
        }
        DataGridRenderer::renderAccionesMasivasFromConfig($configuracionColumnas);
        ?>

        <?php
        $opcionesFiltros = [
            'preservar_keys' => ['orderby', 'order'],
            'scope' => 'barberos',
        ];
        if (!is_admin()) {
            $opcionesFiltros['ajax_action'] = 'glory_filtrar_barberos';
        }
        BarraFiltrosRenderer::render([
            [
                'tipo' => 'search',
                'name' => 's',
                'label' => 'Nombre',
                'placeholder' =>
                'Buscar por nombre…'
            ],
        ], $opcionesFiltros);
        ?>

    </div>

    <?php
    $barberosParaRenderizar = array_values($barberosCombinados);
    foreach ($barberosParaRenderizar as $k => &$v) {
        $v['index'] = $k;
    }
    // En el admin queremos que la tabla tenga siempre la misma estructura que en frontend
    echo '<div class="tablaWrap">';
    DataGridRenderer::render($barberosParaRenderizar, $configuracionColumnas);
    echo '</div>';

    $accion = admin_url('admin.php?page=barberia-barberos');
    renderizarModalBarbero($opcionesServicios, $barberosCombinados, $accion);
    ?>

<?php
}
