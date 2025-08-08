<?php

use Glory\Components\DataGridRenderer;
use Glory\Components\FormBuilder;
use Glory\Components\BarraFiltrosRenderer;

/**
 * Construye un array de opciones para un <select> a partir de una taxonomía.
 *
 * @param string $taxonomy
 * @param string $placeholder
 * @return array<int|string,string>
 */
function gloryOpcionesTaxonomia(string $taxonomy, string $placeholder): array
{
    $opciones = ['' => __($placeholder, 'glorytemplate')];
    $terminos = get_terms(['taxonomy' => $taxonomy, 'hide_empty' => false]);

    if (!is_wp_error($terminos)) {
        foreach ($terminos as $term) {
            $opciones[$term->term_id] = $term->name;
        }
    }

    return $opciones;
}

/**
 * Devuelve la consulta de reservas paginada.
 *
 * @return WP_Query
 */
function consultaReservas(): WP_Query
{
    $pagina = get_query_var('paged') ? get_query_var('paged') : 1;

    $args = [
        'post_type'      => 'reserva',
        'posts_per_page' => 20,
        'paged'          => $pagina,
        'post_status'    => 'publish',
        'meta_query'     => ['relation' => 'AND'],
        'tax_query'      => ['relation' => 'AND'],
    ];

    // Búsqueda por nombre de cliente (título)
    if (!empty($_GET['s'])) {
        $args['s'] = sanitize_text_field((string) $_GET['s']);
    }

    // Filtro por rango de fechas
    if (!empty($_GET['fecha_desde'])) {
        $args['meta_query'][] = [
            'key'     => 'fecha_reserva',
            'value'   => sanitize_text_field((string) $_GET['fecha_desde']),
            'compare' => '>=',
            'type'    => 'DATE',
        ];
    }
    if (!empty($_GET['fecha_hasta'])) {
        $args['meta_query'][] = [
            'key'     => 'fecha_reserva',
            'value'   => sanitize_text_field((string) $_GET['fecha_hasta']),
            'compare' => '<=',
            'type'    => 'DATE',
        ];
    }

    // Filtro por servicio (taxonomía)
    if (!empty($_GET['filtro_servicio'])) {
        $args['tax_query'][] = [
            'taxonomy' => 'servicio',
            'field'    => 'term_id',
            'terms'    => absint((int) $_GET['filtro_servicio']),
        ];
    }

    // Filtro por barbero (taxonomía)
    if (!empty($_GET['filtro_barbero'])) {
        $args['tax_query'][] = [
            'taxonomy' => 'barbero',
            'field'    => 'term_id',
            'terms'    => absint((int) $_GET['filtro_barbero']),
        ];
    }

    // Ordenamiento por columna
    $orderbyParam = isset($_GET['orderby']) ? sanitize_key((string) $_GET['orderby']) : '';
    $orderParam   = (isset($_GET['order']) && strtolower((string) $_GET['order']) === 'desc') ? 'DESC' : 'ASC';
    if ($orderbyParam === 'post_title') {
        $args['orderby'] = 'title';
        $args['order']   = $orderParam;
    }

    return new WP_Query($args);
}

/**
 * Configuración de columnas para el DataGrid.
 *
 * @return array
 */
function columnasReservas(): array
{
    return [
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
}

/**
 * Renderiza el modal de creación de reserva.
 *
 * @param array $opcionesServicios
 * @param array $opcionesBarberos
 * @return void
 */
function renderModalReserva(array $opcionesServicios, array $opcionesBarberos): void
{
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
}

/**
 * Imprime los scripts necesarios para el modal.
 *
 * @return void
 */
function imprimirScriptsModalReserva(): void
{
?>
    <script>
        jQuery(function($) {
            $('.openModal').on('click', function() {
                var modalId = $(this).data('modal');
                $('#' + modalId).fadeIn(200);
            });

            // Cerrar modal al hacer clic fuera del contenido o presionar Escape
            $(document).on('keyup', function(e) {
                if (e.key === 'Escape') {
                    $('.modal').fadeOut(200);
                }
            });

            $('.modal').on('click', function(e) {
                if ($(e.target).closest('.modalContenido').length === 0) {
                    $(this).fadeOut(200);
                }
            });
        });
    </script>
<?php
}


function renderPaginaReservas()
{
    if (isset($_GET['exportar_csv']) && $_GET['exportar_csv'] == 'true' && current_user_can('manage_options')) {
        exportarReservasACsv();
        exit;
    }

    $export_url = add_query_arg(['exportar_csv' => 'true'], admin_url('admin.php?page=barberia-reservas'));

    // Lógica: construir opciones para selects del formulario
    $opcionesServicios = gloryOpcionesTaxonomia('servicio', 'Selecciona un servicio');
    $opcionesBarberos  = gloryOpcionesTaxonomia('barbero', 'Selecciona un barbero');

    // Lógica: consulta y columnas del grid (necesarias para renderizar filtros arriba)
    $consultaReservas      = consultaReservas();
    $configuracionColumnas = columnasReservas();
    // Indicamos que los filtros ya se renderizaron fuera del DataGrid
    $configuracionColumnas['filtros_separados'] = true;
?>
    <h1><?php echo __('Panel de Reservas', 'glorytemplate'); ?></h1>
    <div class="acciones-reservas">
        <a href="<?php echo esc_url($export_url); ?>" class="button button-secondary">
            <?php echo __('Exportar a CSV', 'glorytemplate'); ?>
        </a>
        <button class="button button-primary openModal" data-modal="modalAnadirReserva">
            <?php echo __('Añadir Reserva Manual', 'glorytemplate'); ?>
        </button>
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

    // Vista: modal de creación de reservas
    renderModalReserva($opcionesServicios, $opcionesBarberos);

    // Vista: grid de datos
    DataGridRenderer::render($consultaReservas, $configuracionColumnas);

    // Scripts
    imprimirScriptsModalReserva();
}
