<?php

use WP_Query;
use Glory\Components\DataGridRenderer;

/**
 * Renderiza la página principal de reservas
 */
function renderPaginaReservas()
{
    if (isset($_GET['exportar_csv']) && $_GET['exportar_csv'] == 'true' && current_user_can('manage_options')) {
        exportarReservasACsv();
        exit;
    }

    echo '<h1>Panel de Reservas</h1>';
    $export_url = add_query_arg(['exportar_csv' => 'true'], admin_url('admin.php?page=barberia-reservas'));
    echo '<a href="' . esc_url($export_url) . '" class="button button-primary" style="margin-bottom: 15px;">Exportar a CSV</a>';

    $argsConsulta = [
        'post_type' => 'reserva',
        'posts_per_page' => 20,
        'paged' => get_query_var('paged') ? get_query_var('paged') : 1,
    ];
    $consultaReservas = new WP_Query($argsConsulta);

    $configuracionColumnas = [
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
                if (is_array($servicios) && !is_wp_error($servicios)) {
                    return implode(', ', wp_list_pluck($servicios, 'name'));
                }
                return 'N/A';
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
                $edit_link = get_edit_post_link($post->ID);
                $delete_link = get_delete_post_link($post->ID, '', true);
                $confirm_message = json_encode('¿Estás seguro de que quieres eliminar esta reserva?');
                $actions = '<a href="' . esc_url($edit_link) . '">Editar</a>';
                $actions .= ' | <a href="' . esc_url($delete_link) . '" onclick="return confirm(' . $confirm_message . ')">Eliminar</a>';
                return $actions;
            }],
        ],
        'filtros' => [
            's' => ['etiqueta' => 'Buscar por Cliente...'],
        ],
        'paginacion' => true,
    ];

    DataGridRenderer::render($consultaReservas, $configuracionColumnas);
}