<?php

use Glory\Components\DataGridRenderer;

function renderPaginaServicios()
{
    if (! current_user_can('manage_options')) {
        wp_die('No autorizado');
    }

    if (function_exists('procesarFormularioServicios')) {
        procesarFormularioServicios();
    }

?>

    <div class="acciones-pagina-header acciones-servicios-header">
        <h1>Servicios</h1>
        <div class="acciones-pagina-header-buttons acciones-servicios-header-buttons">
            <button class="button button-primary openModal noAjax" data-modal="modalAnadirServicio" data-form-mode="create" data-submit-action="guardarServicio" data-submit-text="Guardar" data-modal-title-create="<?php echo esc_attr('Añadir Servicio'); ?>">Añadir Servicio</button>
        </div>
    </div>

    <div class="acciones-pagina acciones-servicios">
        <?php
        $configuracionColumnas = columnasServicios();
        $configuracionColumnas['acciones_masivas_separadas'] = true;
        DataGridRenderer::renderAccionesMasivasFromConfig($configuracionColumnas);
        ?>
    </div>

    <?php
    $servicios_listado = obtenerDatosServicios();
    if (!is_admin()) {
        echo '<div class="tablaWrap">';
    }
    DataGridRenderer::render($servicios_listado, $configuracionColumnas);
    if (!is_admin()) {
        echo '</div>';
    }
    ?>

    <?php
    if (function_exists('renderModalServicio')) {
        renderModalServicio();
    }
    ?>


<?php
}
