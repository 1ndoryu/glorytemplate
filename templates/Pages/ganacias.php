<?php

use Glory\Components\FormBuilder;
use Glory\Services\AnalyticsEngine;
use WP_Query;

function renderPaginaGanancias()
{
    // --- 1. OBTENER DATOS PARA FILTROS ---
    $barberos = get_terms(['taxonomy' => 'barbero', 'hide_empty' => false]);
    $servicios = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);

    $opcionesBarberos = ['' => 'Todos los Barberos'];
    if (!is_wp_error($barberos)) {
        foreach ($barberos as $barbero) {
            $opcionesBarberos[$barbero->term_id] = $barbero->name;
        }
    }

    $opcionesServicios = ['' => 'Todos los Servicios'];
    if (!is_wp_error($servicios)) {
        foreach ($servicios as $servicio) {
            $opcionesServicios[$servicio->term_id] = $servicio->name;
        }
    }

    // --- 2. RECOGER Y SANITIZAR VALORES DE FILTROS ---
    $fechaDesde = isset($_GET['fecha_desde']) ? sanitize_text_field($_GET['fecha_desde']) : '';
    $fechaHasta = isset($_GET['fecha_hasta']) ? sanitize_text_field($_GET['fecha_hasta']) : '';
    $barberoId = isset($_GET['filtro_barbero']) ? absint($_GET['filtro_barbero']) : '';
    $servicioId = isset($_GET['filtro_servicio']) ? absint($_GET['filtro_servicio']) : '';

    // --- 3. CONSTRUIR LA CONSULTA ---
    $argsConsulta = [
        'post_type' => 'reserva',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'meta_query' => ['relation' => 'AND'],
        'tax_query' => ['relation' => 'AND'],
    ];

    if (!empty($fechaDesde)) {
        $argsConsulta['meta_query'][] = [
            'key' => 'fecha_reserva',
            'value' => $fechaDesde,
            'compare' => '>=',
            'type' => 'DATE'
        ];
    }
    if (!empty($fechaHasta)) {
        $argsConsulta['meta_query'][] = [
            'key' => 'fecha_reserva',
            'value' => $fechaHasta,
            'compare' => '<=',
            'type' => 'DATE'
        ];
    }
    if (!empty($barberoId)) {
        $argsConsulta['tax_query'][] = ['taxonomy' => 'barbero', 'field' => 'term_id', 'terms' => $barberoId];
    }
    if (!empty($servicioId)) {
        $argsConsulta['tax_query'][] = ['taxonomy' => 'servicio', 'field' => 'term_id', 'terms' => $servicioId];
    }

    $consultaReservas = new WP_Query($argsConsulta);

    // --- 4. PROCESAR DATOS PARA EL ANÁLISIS ---
    $datosParaAnalisis = [];
    $reservasDetalladas = [];

    if ($consultaReservas->have_posts()) {
        while ($consultaReservas->have_posts()) {
            $consultaReservas->the_post();
            $postId = get_the_ID();
            $serviciosPost = get_the_terms($postId, 'servicio');
            $barberosPost = get_the_terms($postId, 'barbero');

            if (is_array($serviciosPost) && !empty($serviciosPost)) {
                $primerServicio = $serviciosPost[0];
                $precio = get_term_meta($primerServicio->term_id, 'precio', true);
                $precio = is_numeric($precio) ? floatval($precio) : 0;

                $datosParaAnalisis[] = ['precio' => $precio];

                $reservasDetalladas[] = [
                    'cliente' => get_the_title(),
                    'fecha' => get_post_meta($postId, 'fecha_reserva', true),
                    'servicio' => $primerServicio->name,
                    'barbero' => (is_array($barberosPost) && !empty($barberosPost)) ? $barberosPost[0]->name : 'N/A',
                    'precio' => number_format($precio, 2) . ' €'
                ];
            }
        }
    }
    wp_reset_postdata();

    // --- 5. REALIZAR CÁLCULOS ---
    $resultados = [];
    if (!empty($datosParaAnalisis)) {
        $analyticsEngine = new AnalyticsEngine($datosParaAnalisis);
        $configuracionCalculos = [
            'total_ganado' => 'sum(precio)',
            'total_reservas' => 'count(*)',
        ];
        $resultados = $analyticsEngine->calcular($configuracionCalculos);
        if ($resultados['total_reservas'] > 0) {
            $resultados['promedio_reserva'] = $resultados['total_ganado'] / $resultados['total_reservas'];
        } else {
            $resultados['promedio_reserva'] = 0;
        }
    }


    // --- 6. RENDERIZAR LA PÁGINA ---
?>
    <div class="wrap glory-admin-page">
        <h1>Análisis de Ganancias</h1>

        <div class="glory-analytics-filters postbox">
            <h2 class="hndle"><span>Filtrar Resultados</span></h2>
            <div class="inside">
                <form method="GET" action="">
                    <input type="hidden" name="page" value="<?php echo esc_attr($_REQUEST['page']); ?>">
                    <div class="form-row">
                        <?php
                        echo FormBuilder::campoFecha(['nombre' => 'fecha_desde', 'label' => 'Desde', 'valor' => $fechaDesde]);
                        echo FormBuilder::campoFecha(['nombre' => 'fecha_hasta', 'label' => 'Hasta', 'valor' => $fechaHasta]);
                        echo FormBuilder::campoSelect(['nombre' => 'filtro_barbero', 'label' => 'Barbero', 'opciones' => $opcionesBarberos, 'valor' => $barberoId]);
                        echo FormBuilder::campoSelect(['nombre' => 'filtro_servicio', 'label' => 'Servicio', 'opciones' => $opcionesServicios, 'valor' => $servicioId]);
                        ?>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="button button-primary">Aplicar Filtros</button>
                        <a href="<?php echo esc_url(admin_url('admin.php?page=' . $_REQUEST['page'])); ?>" class="button">Limpiar</a>
                    </div>
                </form>
            </div>
        </div>

        <div class="glory-analytics-summary">
            <div class="summary-card">
                <h3>Ingresos Totales</h3>
                <p><?php echo number_format($resultados['total_ganado'] ?? 0, 2); ?> €</p>
            </div>
            <div class="summary-card">
                <h3>Total de Reservas</h3>
                <p><?php echo $resultados['total_reservas'] ?? 0; ?></p>
            </div>
            <div class="summary-card">
                <h3>Media por Reserva</h3>
                <p><?php echo number_format($resultados['promedio_reserva'] ?? 0, 2); ?> €</p>
            </div>
        </div>

        <div class="glory-analytics-details postbox">
            <h2 class="hndle"><span>Detalle de Reservas Filtradas</span></h2>
            <div class="inside">
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Servicio</th>
                            <th>Barbero</th>
                            <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (!empty($reservasDetalladas)) : ?>
                            <?php foreach ($reservasDetalladas as $reserva) : ?>
                                <tr>
                                    <td><?php echo esc_html($reserva['cliente']); ?></td>
                                    <td><?php echo esc_html($reserva['fecha']); ?></td>
                                    <td><?php echo esc_html($reserva['servicio']); ?></td>
                                    <td><?php echo esc_html($reserva['barbero']); ?></td>
                                    <td><?php echo esc_html($reserva['precio']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <tr>
                                <td colspan="5">No se encontraron reservas con los filtros seleccionados.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
<?php
}
