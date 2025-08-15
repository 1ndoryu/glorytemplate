<?php

use Glory\Components\FormBuilder;
use Glory\Components\DataGridRenderer;
use Glory\Components\BarraFiltrosRenderer;
use Glory\Services\AnalyticsEngine;

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

    // --- 4. PROCESAR DATOS PARA EL ANÁLISIS Y GRID ---
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
                    'fecha' => (string) get_post_meta($postId, 'fecha_reserva', true),
                    'servicio' => $primerServicio->name,
                    'barbero' => (is_array($barberosPost) && !empty($barberosPost)) ? $barberosPost[0]->name : 'N/A',
                    'precio' => $precio,
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
        $resultados['promedio_reserva'] = ($resultados['total_reservas'] ?? 0) > 0
            ? ($resultados['total_ganado'] / $resultados['total_reservas'])
            : 0;
    }

    // --- 6. CONFIGURACIÓN DE COLUMNAS PARA DATAGRID ---
    $configuracionColumnas = [
        'columnas' => [
            ['etiqueta' => 'Cliente', 'clave' => 'cliente'],
            ['etiqueta' => 'Fecha', 'clave' => 'fecha'],
            ['etiqueta' => 'Servicio', 'clave' => 'servicio'],
            ['etiqueta' => 'Barbero', 'clave' => 'barbero'],
            ['etiqueta' => 'Precio', 'clave' => 'precio', 'callback' => function ($row) {
                $precio = isset($row['precio']) ? floatval($row['precio']) : 0;
                return number_format($precio, 2) . ' €';
            }],
        ],
        'paginacion' => false,
    ];

    // --- 7. RENDERIZAR LA PÁGINA ---
?>
    <div class="wrap glory-admin-page paginaGanancias">
        <h1>Análisis de Ganancias</h1>

        <div class="acciones-pagina acciones-ganancias">
            <?php
            $opcionesFiltros = [
                'preservar_keys' => [],
                'ajax_action' => 'glory_filtrar_ganancias',
                'target_selector' => '.ganancias-contenido',
                'scope' => 'ganancias'
            ];
            BarraFiltrosRenderer::render([
                ['tipo' => 'date_range', 'name' => 'rango', 'label' => 'Rango de fechas', 'from_name' => 'fecha_desde', 'to_name' => 'fecha_hasta', 'placeholder' => 'Fecha desde — hasta'],
                ['tipo' => 'select', 'name' => 'filtro_servicio', 'label' => 'Servicio', 'opciones' => $opcionesServicios],
                ['tipo' => 'select', 'name' => 'filtro_barbero', 'label' => 'Barbero', 'opciones' => $opcionesBarberos],
            ], $opcionesFiltros);
            ?>
        </div>

        <div class="ganancias-contenido">
            <div class="glory-analytics-summary resumen-ganancias">
                <div class="summary-card"><h3>Ingresos Totales</h3><p><?php echo number_format($resultados['total_ganado'] ?? 0, 2); ?> €</p></div>
                <div class="summary-card"><h3>Total de Reservas</h3><p><?php echo $resultados['total_reservas'] ?? 0; ?></p></div>
                <div class="summary-card"><h3>Media por Reserva</h3><p><?php echo number_format($resultados['promedio_reserva'] ?? 0, 2); ?> €</p></div>
            </div>

            <?php if (!is_admin()) { echo '<div class="tablaWrap">'; } ?>
            <?php DataGridRenderer::render(array_values($reservasDetalladas), $configuracionColumnas); ?>
            <?php if (!is_admin()) { echo '</div>'; } ?>
        </div>
    </div>
<?php
}
