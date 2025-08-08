<?php

use Glory\Components\FormBuilder;
use Glory\Components\Modal;
use Glory\Components\FormularioFluente;
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
    $opciones = ['' => $placeholder];
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
            ['etiqueta' => 'Cliente', 'clave' => 'post_title', 'ordenable' => true],
            ['etiqueta' => 'Fecha', 'clave' => 'fecha_reserva', 'callback' => function ($post) {
                return get_post_meta($post->ID, 'fecha_reserva', true) ?: 'N/A';
            }],
            ['etiqueta' => 'Hora', 'clave' => 'hora_reserva', 'callback' => function ($post) {
                return get_post_meta($post->ID, 'hora_reserva', true) ?: 'N/A';
            }],
            ['etiqueta' => 'Servicio', 'clave' => 'servicio', 'callback' => function ($post) {
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
            ['etiqueta' => 'Teléfono', 'clave' => 'telefono_cliente', 'callback' => function ($post) {
                return get_post_meta($post->ID, 'telefono_cliente', true) ?: 'N/A';
            }],
            ['etiqueta' => 'Correo', 'clave' => 'correo_cliente', 'callback' => function ($post) {
                return get_post_meta($post->ID, 'correo_cliente', true) ?: 'N/A';
            }],
            ['etiqueta' => 'Barbero', 'clave' => 'barbero', 'callback' => function ($post) {
                $barberos = get_the_terms($post->ID, 'barbero');
                if (is_array($barberos) && !is_wp_error($barberos)) {
                    return implode(', ', wp_list_pluck($barberos, 'name'));
                }
                return 'N/A';
            }],
            ['etiqueta' => 'Acciones', 'clave' => 'acciones', 'callback' => function ($post) {
                $delete_link = get_delete_post_link($post->ID);
                $confirm_message = json_encode('¿Estás seguro de que quieres eliminar esta reserva?');

                // Icono editar (abre modal con data-id)
                $actions = '<a href="#" class="openModal" data-modal="modalAnadirReserva" data-form-mode="edit" data-fetch-action="glory_obtener_reserva" data-object-id="' . esc_attr($post->ID) . '" data-submit-action="actualizarReserva" data-modal-title-edit="' . esc_attr('Editar Reserva') . '" title="' . esc_attr('Editar') . '"><span class="dashicons dashicons-edit"></span></a>';

                // Separador
                $actions .= ' ';

                // Icono eliminar (link nativo WP)
                $actions .= '<a href="' . esc_url($delete_link) . '" onclick="return confirm(' . $confirm_message . ')" title="' . esc_attr('Eliminar') . '"><span class="dashicons dashicons-trash"></span></a>';
                return $actions;
            }],
        ],
        'filtros' => [
            's' => ['etiqueta' => 'Buscar por Cliente...'],
        ],
        'paginacion' => true,
    ];
}

// La implementación de FormularioFluente fue extraída a Glory/src/Components/FormularioFluente.php


/**
 * Renderiza el modal de creación de reserva usando la API fluida.
 *
 * @param array $opcionesServicios
 * @param array $opcionesBarberos
 * @return void
 */
function renderModalReserva(array $opcionesServicios, array $opcionesBarberos): void
{
    $config = [
        ['fn' => 'inicio', 'args' => [
            'extraClass' => 'formularioBarberia',
            'atributos'  => [
                'data-post-type'   => 'reserva',
                'data-post-status' => 'publish',
                // Reglas declarativas para habilitar submit (Glory agnóstico)
                'data-fm-submit-enable-when' => 'nombre_cliente,telefono_cliente,correo_cliente,servicio_id,barbero_id,fecha_reserva,hora_reserva',
            ]
        ]],
        ['fn' => 'campoTexto', 'args' => ['nombre' => 'nombre_cliente', 'label' => 'Nombre Cliente', 'obligatorio' => true]],
        ['fn' => 'campoTexto', 'args' => ['nombre' => 'telefono_cliente', 'label' => 'Teléfono', 'obligatorio' => true]],
        ['fn' => 'campoTexto', 'args' => ['nombre' => 'correo_cliente', 'label' => 'Correo', 'obligatorio' => true]],
        ['fn' => 'campoSelect', 'args' => ['nombre' => 'servicio_id', 'label' => 'Servicio', 'opciones' => $opcionesServicios, 'obligatorio' => true, 'extraClassInput' => 'selector-servicio']],
        ['fn' => 'campoSelect', 'args' => ['nombre' => 'barbero_id', 'label' => 'Barbero', 'opciones' => $opcionesBarberos, 'obligatorio' => true, 'extraClassInput' => 'selector-barbero']],
        ['fn' => 'campoFecha', 'args' => ['nombre' => 'fecha_reserva', 'label' => 'Fecha', 'obligatorio' => true, 'extraClassInput' => 'selector-fecha']],
        ['fn' => 'campoSelect', 'args' => [
            'nombre'          => 'hora_reserva',
            'label'           => 'Hora',
            'opciones'        => ['' => 'Selecciona fecha, servicio y barbero'],
            'obligatorio'     => true,
            'extraClassInput' => 'selector-hora',
        ]],
        ['fn' => 'botonEnviar', 'args' => ['accion' => 'crearReserva', 'texto' => 'Guardar Reserva', 'extraClass' => 'button-primary']],
        ['fn' => 'fin'],
    ];

    $form = (new FormularioFluente())->agregarDesdeConfig($config);
    $contenido = $form->renderizar();

    echo Modal::render('modalAnadirReserva', 'Añadir Nueva Reserva', $contenido);
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
