<?php

use Glory\Components\DataGridRenderer;
use Glory\Components\FormBuilder;


function renderPaginaReservas()
{
    if (isset($_GET['exportar_csv']) && $_GET['exportar_csv'] == 'true' && current_user_can('manage_options')) {
        exportarReservasACsv();
        exit;
    }

    echo '<h1>' . __('Panel de Reservas', 'glorytemplate') . '</h1>';
    $export_url = add_query_arg(['exportar_csv' => 'true'], admin_url('admin.php?page=barberia-reservas'));
    echo '<a href="' . esc_url($export_url) . '" class="button button-secondary" style="margin-bottom: 15px;">' . __('Exportar a CSV', 'glorytemplate') . '</a>';
    echo '<button class="button button-primary openModal" data-modal="modalAnadirReserva" style="margin-bottom: 15px; margin-left: 10px;">' . __('Añadir Reserva Manual', 'glorytemplate') . '</button>';


    $serviciosTerms = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
    $opcionesServicios = ['' => __('Selecciona un servicio', 'glorytemplate')];
    if (!is_wp_error($serviciosTerms)) {
        foreach ($serviciosTerms as $term) {
            $opcionesServicios[$term->term_id] = $term->name;
        }
    }

    $barberosTerms = get_terms(['taxonomy' => 'barbero', 'hide_empty' => false]);
    $opcionesBarberos = ['' => __('Selecciona un barbero', 'glorytemplate')];
    if (!is_wp_error($barberosTerms)) {
        foreach ($barberosTerms as $term) {
            $opcionesBarberos[$term->term_id] = $term->name;
        }
    }
?>
    <div id="modalAnadirReserva" class="modal" style="display:none;">
        <div class="modalContenido" style="max-width: 600px;">
            <h2><?php _e('Añadir Nueva Reserva', 'glorytemplate'); ?></h2>
            <?php
            echo FormBuilder::inicio([
                'extraClass' => 'formularioBarberia',
                'atributos'  => [
                    'data-post-type'   => 'reserva',
                    'data-post-status' => 'publish',
                ]
            ]);

            echo FormBuilder::campoTexto(['nombre' => 'nombre_cliente', 'label' => __('Nombre Cliente', 'glorytemplate'), 'obligatorio' => true]);
            echo FormBuilder::campoTexto(['nombre' => 'telefono_cliente', 'label' => __('Teléfono', 'glorytemplate'), 'obligatorio' => true]);
            echo FormBuilder::campoTexto(['nombre' => 'correo_cliente', 'label' => __('Correo', 'glorytemplate'), 'obligatorio' => true]);
            echo FormBuilder::campoSelect(['nombre' => 'servicio_id', 'label' => __('Servicio', 'glorytemplate'), 'opciones' => $opcionesServicios, 'obligatorio' => true, 'extraClassInput' => 'selector-servicio']);
            echo FormBuilder::campoSelect(['nombre' => 'barbero_id', 'label' => __('Barbero', 'glorytemplate'), 'opciones' => $opcionesBarberos, 'obligatorio' => true, 'extraClassInput' => 'selector-barbero']);
            echo FormBuilder::campoFecha(['nombre' => 'fecha_reserva', 'label' => __('Fecha', 'glorytemplate'), 'obligatorio' => true, 'extraClassInput' => 'selector-fecha']);
            echo FormBuilder::campoSelect([
                'nombre'          => 'hora_reserva',
                'label'           => __('Hora', 'glorytemplate'),
                'opciones'        => ['' => __('Selecciona fecha, servicio y barbero', 'glorytemplate')],
                'obligatorio'     => true,
                'extraClassInput' => 'selector-hora',
            ]);

            echo FormBuilder::botonEnviar(['accion' => 'crearReserva', 'texto' => __('Guardar Reserva', 'glorytemplate'), 'extraClass' => 'button-primary']);

            echo FormBuilder::fin();
            ?>
        </div>
    </div>
<?php
    $argsConsulta = [
        'post_type' => 'reserva',
        'posts_per_page' => 20,
        'paged' => get_query_var('paged') ? get_query_var('paged') : 1,
    ];
    $consultaReservas = new WP_Query($argsConsulta);

    $configuracionColumnas = [
        'columnas' => [
            ['etiqueta' => __('Cliente', 'glorytemplate'), 'clave' => 'post_title', 'ordenable' => true],
            ['etiqueta' => __('Fecha', 'glorytemplate'), 'clave' => 'fecha_reserva', 'callback' => function ($post) {
                return get_post_meta($post->ID, 'fecha_reserva', true) ?: 'N/A';
            }],
            ['etiqueta' => __('Hora', 'glorytemplate'), 'clave' => 'hora_reserva', 'callback' => function ($post) {
                return get_post_meta($post->ID, 'hora_reserva', true) ?: 'N/A';
            }],
            ['etiqueta' => __('Servicio', 'glorytemplate'), 'clave' => 'servicio', 'callback' => function ($post) {
                $servicios = get_the_terms($post->ID, 'servicio');
                if (is_array($servicios) && !is_wp_error($servicios)) {
                    return implode(', ', wp_list_pluck($servicios, 'name'));
                }
                return 'N/A';
            }],
            ['etiqueta' => __('Teléfono', 'glorytemplate'), 'clave' => 'telefono_cliente', 'callback' => function ($post) {
                return get_post_meta($post->ID, 'telefono_cliente', true) ?: 'N/A';
            }],
            ['etiqueta' => __('Correo', 'glorytemplate'), 'clave' => 'correo_cliente', 'callback' => function ($post) {
                return get_post_meta($post->ID, 'correo_cliente', true) ?: 'N/A';
            }],
            ['etiqueta' => __('Barbero', 'glorytemplate'), 'clave' => 'barbero', 'callback' => function ($post) {
                $barberos = get_the_terms($post->ID, 'barbero');
                if (is_array($barberos) && !is_wp_error($barberos)) {
                    return implode(', ', wp_list_pluck($barberos, 'name'));
                }
                return 'N/A';
            }],
            ['etiqueta' => __('Acciones', 'glorytemplate'), 'clave' => 'acciones', 'callback' => function ($post) {
                $edit_link = get_edit_post_link($post->ID);
                $delete_link = get_delete_post_link($post->ID);
                $confirm_message = json_encode(__('¿Estás seguro de que quieres eliminar esta reserva?', 'glorytemplate'));
                $actions = '<a href="' . esc_url($edit_link) . '">' . __('Editar', 'glorytemplate') . '</a>';
                $actions .= ' | <a href="' . esc_url($delete_link) . '" onclick="return confirm(' . $confirm_message . ')">' . __('Eliminar', 'glorytemplate') . '</a>';
                return $actions;
            }],
        ],
        'filtros' => [
            's' => ['etiqueta' => __('Buscar por Cliente...', 'glorytemplate')],
        ],
        'paginacion' => true,
    ];

    DataGridRenderer::render($consultaReservas, $configuracionColumnas);
}