<?php

use Glory\Components\SchedulerRenderer;
use Glory\Manager\OpcionManager;

function renderPaginaVisualizacion()
{
    echo '<div class="page-visualizacion">';
    echo '<h1>Visualización de Citas</h1>';

    $barberos_terms = get_terms(['taxonomy' => 'barbero', 'hide_empty' => false]);
    if (is_wp_error($barberos_terms) || empty($barberos_terms)) {
        echo '<p>No hay barberos configurados. Por favor, añada barberos en la taxonomía correspondiente.</p>';
        return;
    }
    $recursos = wp_list_pluck($barberos_terms, 'name');

    $consultaReservas = new WP_Query([
        'post_type' => 'reserva',
        'posts_per_page' => -1,
        'meta_query' => [
            [
                'key' => 'fecha_reserva',
                'value' => date('Y-m-d'),
                'compare' => '='
            ]
        ]
    ]);
    $eventos = [];

    if ($consultaReservas->have_posts()) {
        while ($consultaReservas->have_posts()) {
            $consultaReservas->the_post();
            $post_id = get_the_ID();
            $hora_inicio = get_post_meta($post_id, 'hora_reserva', true);
            if (!$hora_inicio) continue;

            $servicios = get_the_terms($post_id, 'servicio');
            $duracion = 30;
            $tipo_servicio_slug = 'default';
            $servicio_nombre = 'Servicio no especificado';

            if (!is_wp_error($servicios) && !empty($servicios)) {
                $primer_servicio = $servicios[0];
                $tipo_servicio_slug = $primer_servicio->slug;
                $servicio_nombre = $primer_servicio->name;
                $duracion_meta = get_term_meta($primer_servicio->term_id, 'duracion', true);
                if (is_numeric($duracion_meta) && $duracion_meta > 0) {
                    $duracion = (int)$duracion_meta;
                }
            }

            $barberos = get_the_terms($post_id, 'barbero');
            $nombre_barbero = (!is_wp_error($barberos) && !empty($barberos)) ? $barberos[0]->name : 'Sin asignar';
            $exclusividad = get_post_meta($post_id, 'exclusividad', true);

            try {
                $inicio_dt = new DateTime($hora_inicio);
                $fin_dt = clone $inicio_dt;
                $fin_dt->add(new DateInterval("PT{$duracion}M"));

                $eventos[] = [
                    'titulo' => get_the_title(),
                    'detalle' => $servicio_nombre,
                    'horaInicio' => $inicio_dt->format('H:i'),
                    'horaFin' => $fin_dt->format('H:i'),
                    'recurso' => $nombre_barbero,
                    'tipoServicio' => $tipo_servicio_slug,
                    'exclusividad' => ($exclusividad === '1'),
                ];
            } catch (Exception $e) {
                error_log('Error al procesar fecha de reserva para el post ID ' . $post_id . ': ' . $e->getMessage());
            }
        }
    }
    wp_reset_postdata();

    $mapeoColores = [];
    $serviciosParaColores = [
        'corte-de-pelo',
        'corte-extra-degradado',
        'arreglo-de-cuello',
        'corte-al-cero',
        'lavar',
        'lavar-y-peinar',
        'arreglo-y-perfilado-de-barba',
        'arreglo-de-barba',
        'corte-y-arreglo-de-barba',
        'corte-y-afeitado',
        'afeitado-de-barba',
        'afeitado-de-cabeza',
        'tinte-de-pelo',
        'tinte-de-barba',
        'default'
    ];

    foreach ($serviciosParaColores as $slug) {
        $option_key = 'glory_scheduler_color_' . str_replace('-', '_', $slug);
        $mapeoColores[$slug] = OpcionManager::get($option_key);
    }

    $configScheduler = [
        'recursos' => $recursos,
        'horaInicio' => '09:00',
        'horaFin' => '21:00',
        'intervalo' => 15,
        'mapeoColores' => $mapeoColores,
    ];

    SchedulerRenderer::render($eventos, $configScheduler);
    echo '</div>';
}
