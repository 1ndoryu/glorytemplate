<?php

use Glory\Components\FormBuilder;
use Glory\Manager\OpcionManager;
use Glory\Core\OpcionRepository;


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
                if (!is_array($servicios) || is_wp_error($servicios) || empty($servicios)) {
                    return 'N/A';
                }

                $items = [];
                foreach ($servicios as $term) {
                    $slug = $term->slug;
                    $key = 'glory_scheduler_color_' . str_replace('-', '_', $slug);

                    // Leer directamente de la BD; si no existe, usar default del scheduler o gris.
                    $color = OpcionRepository::get($key);
                    if ($color === OpcionRepository::getCentinela() || empty($color)) {
                        $colorDefault = OpcionRepository::get('glory_scheduler_color_default');
                        $color = ($colorDefault !== OpcionRepository::getCentinela() && !empty($colorDefault)) ? $colorDefault : '#9E9E9E';
                    }

                    $dot = '<span class="glory-servicio-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' . esc_attr($color) . ';margin-right:6px;vertical-align:middle;"></span>';
                    $picker = '<input type="color" class="glory-color-servicio-picker" value="' . esc_attr($color) . '" data-slug="' . esc_attr($slug) . '" style="width:18px;height:18px;border:none;padding:0;margin-left:6px;vertical-align:middle;">';
                    $items[] = $dot . esc_html($term->name) . $picker;
                }
                return implode('<br>', $items);
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
                $delete_link = get_delete_post_link($post->ID);
                $confirm_message = json_encode(__('¿Estás seguro de que quieres eliminar esta reserva?', 'glorytemplate'));

                // Icono editar (abre modal con data-id)
                $actions = '<a href="#" class="editar-reserva" data-id="' . esc_attr($post->ID) . '" title="' . esc_attr__('Editar', 'glorytemplate') . '"><span class="dashicons dashicons-edit"></span></a>';

                // Separador
                $actions .= ' ';

                // Icono eliminar (link nativo WP)
                $actions .= '<a href="' . esc_url($delete_link) . '" onclick="return confirm(' . $confirm_message . ')" title="' . esc_attr__('Eliminar', 'glorytemplate') . '"><span class="dashicons dashicons-trash"></span></a>';
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
            var $modal = $('#modalAnadirReserva');
            var $form = $modal.find('.gloryForm');
            var $btnSubmit = $modal.find('.dataSubir');
            var $nombre = $form.find('[name="nombre_cliente"]');
            var $telefono = $form.find('[name="telefono_cliente"]');
            var $correo = $form.find('[name="correo_cliente"]');
            var $servicio = $form.find('[name="servicio_id"]');
            var $barbero = $form.find('[name="barbero_id"]');
            var $fecha = $form.find('[name="fecha_reserva"]');
            var $hora = $form.find('[name="hora_reserva"]');

            function abrirModalCrear() {
                // Limpiar valores
                $nombre.val('');
                $telefono.val('');
                $correo.val('');
                $servicio.val('');
                $barbero.val('');
                $fecha.val('');
                // Reset de horas
                $hora.empty().append($('<option/>',{value:'', text:'<?php echo esc_js(__('Selecciona fecha, servicio y barbero', 'glorytemplate')); ?>'}));
                $hora.prop('disabled', true);
                // Modo crear
                $form.removeAttr('data-object-id');
                $btnSubmit.text('<?php echo esc_js(__('Guardar Reserva', 'glorytemplate')); ?>');
                $btnSubmit.attr('data-accion', 'crearReserva');
                $btnSubmit.prop('disabled', true);
                $modal.fadeIn(200);
            }

            $('.openModal').on('click', function() {
                var modalId = $(this).data('modal');
                if (modalId === 'modalAnadirReserva') {
                    abrirModalCrear();
                } else {
                    $('#' + modalId).fadeIn(200);
                }
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

            // Abrir modal en modo edición con datos precargados
            $(document).on('click', '.editar-reserva', function(e){
                e.preventDefault();
                var id = $(this).data('id');
                if (!id) return;

                // Obtener datos por AJAX
                $.post(ajaxurl, {action: 'glory_obtener_reserva', id: id})
                .done(function(resp){
                    if (!resp || !resp.success || !resp.data) {
                        alert(resp && resp.data && resp.data.mensaje ? resp.data.mensaje : 'No se pudo cargar la reserva.');
                        return;
                    }

                    var d = resp.data;
                    // Rellenar campos
                    $nombre.val(d.nombre_cliente || '');
                    $telefono.val(d.telefono_cliente || '');
                    $correo.val(d.correo_cliente || '');
                    $servicio.val(d.servicio_id || '');
                    $barbero.val(d.barbero_id || '');
                    $fecha.val(d.fecha_reserva || '');

                    // Horas: si viene hora actual, aseguramos opción seleccionada
                    $hora.empty();
                    if (d.hora_reserva) {
                        $hora.append($('<option/>',{value:d.hora_reserva, text:d.hora_reserva}));
                        $hora.val(d.hora_reserva);
                    } else {
                        $hora.append($('<option/>',{value:'', text:'<?php echo esc_js(__('Selecciona fecha, servicio y barbero', 'glorytemplate')); ?>'}));
                    }

                    // Modo editar
                    $form.attr('data-object-id', id);
                    $btnSubmit.text('<?php echo esc_js(__('Actualizar Reserva', 'glorytemplate')); ?>');
                    $btnSubmit.attr('data-accion', 'actualizarReserva');

                    // Abrir modal
                    $modal.fadeIn(200);
                    // Asegurar estado de envío
                    if ($hora.val()) {
                        $btnSubmit.prop('disabled', false);
                        $hora.prop('disabled', false);
                    } else {
                        $btnSubmit.prop('disabled', true);
                    }
                })
                .fail(function(){
                    alert('Error de red al cargar la reserva.');
                });
            });
        });
    </script>
<?php
}

/**
 * Script para actualizar el color de un servicio desde la tabla de reservas.
 */
function imprimirScriptsColoresServicios(): void
{
    $nonce = wp_create_nonce('glory_color_servicio');
?>
    <script>
    jQuery(function($){
        $(document).on('change', '.glory-color-servicio-picker', function(){
            var $input = $(this);
            var slug = $input.data('slug');
            var color = $input.val();
            $input.prop('disabled', true);
            $.post(ajaxurl, {
                action: 'glory_actualizar_color_servicio',
                slug: slug,
                color: color,
                _wpnonce: '<?php echo esc_js($nonce); ?>'
            }).done(function(resp){
                if (resp && resp.success) {
                    // Actualizar el punto de color adyacente
                    var $dot = $input.siblings('.glory-servicio-dot');
                    if ($dot.length) { $dot.css('background-color', color); }
                } else {
                    alert((resp && resp.data && resp.data.mensaje) ? resp.data.mensaje : 'No se pudo guardar el color.');
                }
            }).fail(function(){
                alert('Error de red al guardar el color.');
            }).always(function(){
                $input.prop('disabled', false);
            });
        });
    });
    </script>
<?php
}
