<?php

use Glory\Components\FormularioFluente;
use Glory\Components\Modal;
use Glory\Components\FormBuilder;
use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;

function renderPaginaServicios()
{
    if (! current_user_can('manage_options')) {
        wp_die('No autorizado');
    }

    $option_key = 'barberia_servicios';

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['servicios_nonce']) && wp_verify_nonce($_POST['servicios_nonce'], 'servicios_save')) {
        $servicios = get_option($option_key, []);
        $action = $_POST['action'] ?? '';

            if ($action === 'delete' && ! empty($_POST['id'])) {
            $id = intval($_POST['id']);
            if (isset($servicios[$id])) {
                // Si existe term_id asociado, eliminar término de la taxonomía
                if (!empty($servicios[$id]['term_id'])) {
                    $term_id = intval($servicios[$id]['term_id']);
                    if (term_exists($term_id, 'servicio')) {
                        wp_delete_term($term_id, 'servicio');
                    }
                }
                unset($servicios[$id]);
                update_option($option_key, array_values($servicios));
            }
        } else {
            $name = sanitize_text_field($_POST['name'] ?? '');
            $price = floatval($_POST['price'] ?? 0);
            $duration = intval($_POST['duration'] ?? 30);

            $editing = isset($_POST['id']) && $_POST['id'] !== '';
            if ($editing) {
                $id = intval($_POST['id']);
                if (isset($servicios[$id])) {
                    $servicios[$id]['name'] = $name;
                    $servicios[$id]['price'] = $price;
                    $servicios[$id]['duration'] = $duration;

                    // Sincronizar término de taxonomía 'servicio' y meta 'duracion'
                    $term_id = !empty($servicios[$id]['term_id']) ? intval($servicios[$id]['term_id']) : 0;
                    if ($term_id && term_exists($term_id, 'servicio')) {
                        wp_update_term($term_id, 'servicio', ['name' => $name, 'slug' => sanitize_title($name)]);
                        update_term_meta($term_id, 'duracion', $duration);
                        update_term_meta($term_id, 'precio', $price);
                    } else {
                        $existing = term_exists($name, 'servicio');
                        if ($existing === 0 || $existing === null) {
                            $inserted = wp_insert_term($name, 'servicio', ['slug' => sanitize_title($name)]);
                            if (!is_wp_error($inserted) && isset($inserted['term_id'])) {
                                $term_id = intval($inserted['term_id']);
                                $servicios[$id]['term_id'] = $term_id;
                                update_term_meta($term_id, 'duracion', $duration);
                                update_term_meta($term_id, 'precio', $price);
                            }
                        } else {
                            $term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
                            $servicios[$id]['term_id'] = $term_id;
                            update_term_meta($term_id, 'duracion', $duration);
                            update_term_meta($term_id, 'precio', $price);
                        }
                    }
                }
            } else {
                $new_entry = [
                    'name' => $name,
                    'price' => $price,
                    'duration' => $duration,
                ];

                $existing = term_exists($name, 'servicio');
                if ($existing === 0 || $existing === null) {
                    $inserted = wp_insert_term($name, 'servicio', ['slug' => sanitize_title($name)]);
                    if (!is_wp_error($inserted) && isset($inserted['term_id'])) {
                        $new_entry['term_id'] = intval($inserted['term_id']);
                        update_term_meta($new_entry['term_id'], 'duracion', $duration);
                        update_term_meta($new_entry['term_id'], 'precio', $price);
                    }
                } else {
                    $term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
                    $new_entry['term_id'] = $term_id;
                    update_term_meta($term_id, 'duracion', $duration);
                    update_term_meta($term_id, 'precio', $price);
                }

                $servicios[] = $new_entry;
            }

            update_option($option_key, array_values($servicios));
        }

        wp_redirect(admin_url('admin.php?page=barberia-servicios'));
        exit;
    }

    // Cargar términos de 'servicio' y combinarlos con opciones guardadas
    $terminos = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
    $servicios_from_terms = [];
    if (!is_wp_error($terminos)) {
        foreach ($terminos as $term) {
            $servicios_from_terms[] = [
                'name' => $term->name,
                'term_id' => intval($term->term_id),
                'duration' => intval(get_term_meta($term->term_id, 'duracion', true) ?: 30),
                'price' => floatval(get_term_meta($term->term_id, 'precio', true) ?: 0),
            ];
        }
    }

    $servicios_options = get_option($option_key, []);
    $servicios_merged = $servicios_from_terms;
    if (!empty($servicios_options)) {
        foreach ($servicios_options as $opt) {
            $exists = false;
            if (!empty($opt['term_id'])) {
                foreach ($servicios_merged as $m) {
                    if (!empty($m['term_id']) && intval($m['term_id']) === intval($opt['term_id'])) {
                        $exists = true;
                        break;
                    }
                }
            }
            if (!$exists) {
                $servicios_merged[] = $opt;
            }
        }
    }

    ?>
    <div class="wrap wrap-servicios-admin">
        <div class="acciones-pagina-header acciones-servicios-header">
            <h1>Servicios</h1>
            <div class="acciones-pagina-header-buttons acciones-servicios-header-buttons">
                <button class="button button-primary openModal noAjax" data-modal="modalAnadirServicio" data-form-mode="create" data-submit-action="guardarServicio" data-submit-text="Guardar" data-modal-title-create="<?php echo esc_attr('Añadir Servicio'); ?>">Añadir Servicio</button>
            </div>
        </div>

        <div class="acciones-pagina acciones-servicios" style="margin-bottom:12px;">
            <?php
            // Acciones masivas + filtros (si se agregan en el futuro)
            $configuracionColumnas = columnasServicios();
            $configuracionColumnas['acciones_masivas_separadas'] = true;
            DataGridRenderer::renderAccionesMasivasFromConfig($configuracionColumnas);
            ?>
        </div>

        <?php
        $servicios_listado = obtenerDatosServicios();
        if (!is_admin()) { echo '<div class="tablaWrap">'; }
        DataGridRenderer::render($servicios_listado, $configuracionColumnas);
        if (!is_admin()) { echo '</div>'; }
        ?>

        <?php
        function renderModalServicio(): void
        {
            $action = admin_url('admin.php?page=barberia-servicios');
            $config = [
                ['fn' => 'inicio', 'args' => [
                    'action' => $action,
                    'method' => 'post',
                    'extraClass' => 'formularioBarberia',
                    'atributos' => [
                        'data-fm-submit-habilitar-cuando' => 'name',
                    ],
                ]],
                ['fn' => 'campoTexto', 'args' => ['nombre' => 'name', 'label' => 'Nombre', 'obligatorio' => true]],
                ['fn' => 'campoTexto', 'args' => ['nombre' => 'duration', 'label' => 'Duración (min)']],
                ['fn' => 'campoTexto', 'args' => ['nombre' => 'price', 'label' => 'Precio']],
                ['fn' => 'botonEnviar', 'args' => ['accion' => 'guardarServicio', 'texto' => 'Guardar', 'extraClass' => 'button-primary']],
                ['fn' => 'fin'],
            ];

            $form = (new FormularioFluente())->agregarDesdeConfig($config);
            $contenido = wp_nonce_field('servicios_save','servicios_nonce', true, false) . '<input type="hidden" name="id" id="servicio-id" value="">' . $form->renderizar();
            echo Modal::render('modalAnadirServicio', 'Añadir/Editar Servicio', $contenido);
        }

        renderModalServicio();
        ?>

        
    </div>
    <?php
}


