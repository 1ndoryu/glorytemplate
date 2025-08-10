<?php
if (! defined('ABSPATH')) {
    exit;
}

use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;

function renderPaginaBarberos()
{
    if (! current_user_can('manage_options')) {
        wp_die('No autorizado');
    }

    $option_key = 'barberia_barberos';

    processBarberosPost($option_key);
    list($opcionesServicios, $barberos_merged, $servicios_map_id_to_name) = getBarberosData($option_key);
    wp_enqueue_media();

    // Obtener configuración de columnas desde helper
    $configuracionColumnas = columnasBarberos($opcionesServicios, $servicios_map_id_to_name);

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
        $barberos_for_render = array_values($barberos_merged);
        foreach ($barberos_for_render as $k => &$v) {
            $v['index'] = $k;
        }
        DataGridRenderer::render($barberos_for_render, $configuracionColumnas);

        $action = admin_url('admin.php?page=barberia-barberos');
        renderModalBarbero($opcionesServicios, $barberos_merged, $action);
        ?>
    </div>
<?php
}
