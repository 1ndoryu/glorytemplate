<?php

/**
 * Exporta las reservas a formato CSV
 */
function exportarReservasACsv()
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=reservas-' . date('Y-m-d') . '.csv');

    $output = fopen('php://output', 'w');
    fputcsv($output, ['Cliente', 'Fecha', 'Hora', 'Servicio', 'Teléfono', 'Correo', 'Barbero']);

    $query = new WP_Query([
        'post_type' => 'reserva',
        'posts_per_page' => -1,
        'post_status' => 'any',
    ]);

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();

            $servicios = get_the_terms($post_id, 'servicio');
            $servicio_nombres = (!is_wp_error($servicios) && !empty($servicios)) ? implode(', ', wp_list_pluck($servicios, 'name')) : '';

            $barberos = get_the_terms($post_id, 'barbero');
            $barbero_nombres = (!is_wp_error($barberos) && !empty($barberos)) ? implode(', ', wp_list_pluck($barberos, 'name')) : '';

            fputcsv($output, [
                get_the_title(),
                get_post_meta($post_id, 'fecha_reserva', true),
                get_post_meta($post_id, 'hora_reserva', true),
                $servicio_nombres,
                get_post_meta($post_id, 'telefono_cliente', true),
                get_post_meta($post_id, 'correo_cliente', true),
                $barbero_nombres,
            ]);
        }
    }
    wp_reset_postdata();
    fclose($output);
}