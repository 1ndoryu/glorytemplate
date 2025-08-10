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

    // Obtener configuración de columnas desde helper
    $configuracionColumnas = columnasBarberos($opcionesServicios, $serviciosMapIdANombre);

?>
    <div class="wrap wrap-barberos-admin">
        <h1>Barberos</h1>

        <div style="margin-bottom:12px;">
            <button class="button button-primary openModal" data-modal="modalAnadirBarbero" data-form-mode="create" data-modal-title-create="<?php echo esc_attr('Añadir Barbero'); ?>">Añadir Barbero</button>
        </div>

        <div class="acciones-barberos" style="margin-bottom:12px;">

            <?php
            $opcionesServiciosFiltro = array_merge(['' => 'Todos los servicios'], $opcionesServicios);
            BarraFiltrosRenderer::render([
                [
                    'tipo' => 'search',
                    'name' => 's',
                    'label' => 'Nombre',
                    'placeholder' =>
                    'Buscar por nombre…'
                ],
                [
                    'tipo' => 'select',
                    'name' => 'filtro_servicio',
                    'label' => 'Servicio',
                    'opciones' => $opcionesServiciosFiltro
                ],
            ], [
                'preservar_keys' => ['orderby', 'order'],
            ]);
            ?>
            
        </div>

        <?php
        $barberosParaRenderizar = array_values($barberosCombinados);
        foreach ($barberosParaRenderizar as $k => &$v) {
            $v['index'] = $k;
        }
        DataGridRenderer::render($barberosParaRenderizar, $configuracionColumnas);

        $accion = admin_url('admin.php?page=barberia-barberos');
        renderizarModalBarbero($opcionesServicios, $barberosCombinados, $accion);
        ?>
    </div>
<?php
}
