<?php

/**
 * Renderiza la página de administración del historial de clientes.
 */
function renderPaginaHistorial()
{
    // --- 1. Obtención de todas las reservas ---
    $consultaReservas = new WP_Query([
        'post_type'      => 'reserva',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'meta_value',
        'meta_key'       => 'fecha_reserva',
        'order'          => 'DESC',
    ]);

    $historialClientes = [];

    if ($consultaReservas->have_posts()) {
        while ($consultaReservas->have_posts()) {
            $consultaReservas->the_post();
            $postId          = get_the_ID();
            $nombreCliente   = get_the_title();
            $telefonoCliente = get_post_meta($postId, 'telefono_cliente', true) ?: 'sin-telefono';

            // Usamos el teléfono como identificador único del cliente.
            $identificadorCliente = sanitize_key($nombreCliente . '_' . $telefonoCliente);

            // Si es la primera vez que vemos a este cliente, inicializamos su historial.
            if (!isset($historialClientes[$identificadorCliente])) {
                $historialClientes[$identificadorCliente] = [
                    'nombre'             => $nombreCliente,
                    'telefono'           => $telefonoCliente,
                    'totalVisitas'       => 0,
                    'gastoTotal'         => 0,
                    'ultimaVisita'       => '0000-00-00',
                    'ultimoServicio'     => '',
                    'conteoServicios'    => [],
                ];
            }

            // --- 2. Cálculo de estadísticas por cada reserva ---
            $historialClientes[$identificadorCliente]['totalVisitas']++;

            $fechaReserva = get_post_meta($postId, 'fecha_reserva', true);
            if ($fechaReserva && $fechaReserva > $historialClientes[$identificadorCliente]['ultimaVisita']) {
                $historialClientes[$identificadorCliente]['ultimaVisita'] = $fechaReserva;
            }

            $servicios = get_the_terms($postId, 'servicio');
            if (!is_wp_error($servicios) && !empty($servicios)) {
                $primerServicio = $servicios[0];

                if ($fechaReserva === $historialClientes[$identificadorCliente]['ultimaVisita']) {
                    $historialClientes[$identificadorCliente]['ultimoServicio'] = $primerServicio->name;
                }

                // Acumulamos el conteo de servicios para calcular los más frecuentes.
                $nombreServicio = $primerServicio->name;
                if (!isset($historialClientes[$identificadorCliente]['conteoServicios'][$nombreServicio])) {
                    $historialClientes[$identificadorCliente]['conteoServicios'][$nombreServicio] = 0;
                }
                $historialClientes[$identificadorCliente]['conteoServicios'][$nombreServicio]++;

                // Sumamos el precio del servicio al gasto total.
                $precio = get_term_meta($primerServicio->term_id, 'precio', true);
                if (is_numeric($precio)) {
                    $historialClientes[$identificadorCliente]['gastoTotal'] += floatval($precio);
                }
            }
        }
    }
    wp_reset_postdata();

    // --- 3. Procesamiento final de estadísticas (servicios más frecuentes) ---
    foreach ($historialClientes as &$cliente) {
        arsort($cliente['conteoServicios']); // Ordenar servicios por frecuencia
        $serviciosFrecuentes = array_slice(array_keys($cliente['conteoServicios']), 0, 3);
        $cliente['serviciosFrecuentes'] = implode(', ', $serviciosFrecuentes);
    }
    unset($cliente); // Romper la referencia

    // --- 4. Renderizado de la tabla HTML ---
    // Nota: DataGridRenderer requeriría una adaptación para aceptar un array de datos procesados
    // en lugar de un objeto WP_Query. Por ahora, se renderiza una tabla estándar de WordPress.
?>
    <div class="wrap glory-admin-page">
        <h1>Historial de Clientes</h1>
        <p>Un resumen de la actividad y el valor de cada cliente en la barbería.</p>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th scope="col">Nombre del Cliente</th>
                    <th scope="col">Teléfono</th>
                    <th scope="col">Total Visitas</th>
                    <th scope="col">Gasto Total</th>
                    <th scope="col">Fecha Última Visita</th>
                    <th scope="col">Último Servicio</th>
                    <th scope="col">Servicios Frecuentes</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($historialClientes)) : ?>
                    <?php foreach ($historialClientes as $cliente) : ?>
                        <tr>
                            <td><strong><?php echo esc_html($cliente['nombre']); ?></strong></td>
                            <td><?php echo esc_html($cliente['telefono']); ?></td>
                            <td><?php echo esc_html($cliente['totalVisitas']); ?></td>
                            <td><?php echo number_format($cliente['gastoTotal'], 2); ?> €</td>
                            <td><?php echo esc_html(date_format(date_create($cliente['ultimaVisita']), 'd/m/Y')); ?></td>
                            <td><?php echo esc_html($cliente['ultimoServicio']); ?></td>
                            <td><?php echo esc_html($cliente['serviciosFrecuentes']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else : ?>
                    <tr>
                        <td colspan="7">No hay datos de reservas para generar el historial.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
<?php
}
