<?php

namespace App\Services;

/**
 * AdminRepository — Capa de datos para el panel de administración.
 *
 * Encapsula queries directas a $wpdb para estadísticas, clientes
 * y otras consultas agregadas que no se pueden resolver con WP_Query solo.
 */
class AdminRepository
{
    /**
     * Obtiene estadísticas agregadas de reservas en un solo roundtrip.
     *
     * @return array{total: int, confirmadas: int, pendientes: int, ingresos_totales: float, ingresos_mes: float}
     */
    public static function obtenerEstadisticasReservas(): array
    {
        global $wpdb;

        $mesActual = gmdate('Y-m-01');

        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN pm_estado.meta_value = %s THEN 1 ELSE 0 END) as confirmadas,
                    SUM(CASE WHEN pm_estado.meta_value = %s THEN 1 ELSE 0 END) as pendientes,
                    COALESCE(SUM(CAST(pm_precio.meta_value AS DECIMAL(10,2))), 0) as ingresos_totales,
                    COALESCE(SUM(
                        CASE WHEN p.post_date >= %s AND pm_estado.meta_value IN (%s, %s)
                        THEN CAST(pm_precio.meta_value AS DECIMAL(10,2)) ELSE 0 END
                    ), 0) as ingresos_mes
                FROM {$wpdb->posts} p
                LEFT JOIN {$wpdb->postmeta} pm_estado ON p.ID = pm_estado.post_id AND pm_estado.meta_key = '_reserva_estado'
                LEFT JOIN {$wpdb->postmeta} pm_precio ON p.ID = pm_precio.post_id AND pm_precio.meta_key = '_reserva_precio_total'
                WHERE p.post_type = %s AND p.post_status = 'publish'",
                'confirmada',
                'pendiente',
                $mesActual,
                'confirmada',
                'completada',
                'reserva'
            )
        );

        return [
            'total'            => (int) ($row->total ?? 0),
            'confirmadas'      => (int) ($row->confirmadas ?? 0),
            'pendientes'       => (int) ($row->pendientes ?? 0),
            'ingresos_totales' => (float) ($row->ingresos_totales ?? 0),
            'ingresos_mes'     => (float) ($row->ingresos_mes ?? 0),
        ];
    }

    /**
     * Cuenta vehículos activos publicados.
     */
    public static function contarVehiculosActivos(): int
    {
        global $wpdb;

        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->posts} p
                INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_vehiculo_activo' AND pm.meta_value = %s
                WHERE p.post_type = %s AND p.post_status = 'publish'",
                '1',
                'vehiculo'
            )
        );
    }

    /**
     * Cuenta clientes únicos (por email distinto en reservas).
     */
    public static function contarClientesUnicos(): int
    {
        global $wpdb;

        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(DISTINCT pm.meta_value) FROM {$wpdb->posts} p
                INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_reserva_email_cliente'
                WHERE p.post_type = %s AND p.post_status = 'publish'",
                'reserva'
            )
        );
    }

    /**
     * Lista clientes agregados desde metas de reservas.
     *
     * @return array<int, array{nombre: string, email: string, telefono: string, totalReservas: int, ultimaReserva: string, gastoTotal: float}>
     */
    public static function listarClientes(): array
    {
        global $wpdb;

        $filas = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT
                    pm_email.meta_value as email,
                    MAX(pm_nombre.meta_value) as nombre,
                    MAX(pm_tel.meta_value) as telefono,
                    COUNT(*) as total_reservas,
                    MAX(p.post_date) as ultima_reserva,
                    COALESCE(SUM(CAST(pm_precio.meta_value AS DECIMAL(10,2))), 0) as gasto_total
                FROM {$wpdb->posts} p
                INNER JOIN {$wpdb->postmeta} pm_email ON p.ID = pm_email.post_id AND pm_email.meta_key = '_reserva_email_cliente'
                LEFT JOIN {$wpdb->postmeta} pm_nombre ON p.ID = pm_nombre.post_id AND pm_nombre.meta_key = '_reserva_nombre_cliente'
                LEFT JOIN {$wpdb->postmeta} pm_tel ON p.ID = pm_tel.post_id AND pm_tel.meta_key = '_reserva_telefono_cliente'
                LEFT JOIN {$wpdb->postmeta} pm_precio ON p.ID = pm_precio.post_id AND pm_precio.meta_key = '_reserva_precio_total'
                WHERE p.post_type = %s AND p.post_status = 'publish'
                GROUP BY pm_email.meta_value
                ORDER BY ultima_reserva DESC",
                'reserva'
            )
        );

        $resultado = [];
        foreach ($filas as $c) {
            $resultado[] = [
                'nombre'        => $c->nombre ?? '',
                'email'         => $c->email ?? '',
                'telefono'      => $c->telefono ?? '',
                'totalReservas' => (int) $c->total_reservas,
                'ultimaReserva' => $c->ultima_reserva,
                'gastoTotal'    => (float) $c->gasto_total,
            ];
        }

        return $resultado;
    }

    /**
     * Genera lista de eventos de actividad reciente para el dashboard.
     *
     * Tipos: nueva_reserva, reserva_confirmada, reserva_cancelada, pago_fallido,
     * entrega_hoy, devolucion_hoy, devolucion_manana.
     *
     * @return array<int, array{tipo: string, mensaje: string, fecha: string, reservaId: int, vehiculoNombre: string, clienteNombre: string}>
     */
    public static function obtenerActividadReciente(): array
    {
        global $wpdb;

        $eventos = [];
        $hoy = gmdate('Y-m-d');
        $manana = gmdate('Y-m-d', strtotime('+1 day'));

        /* Reservas recientes (últimas 20) con todos los metas necesarios */
        $reservas = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT p.ID, p.post_date,
                    MAX(CASE WHEN pm.meta_key = '_reserva_estado' THEN pm.meta_value END) as estado,
                    MAX(CASE WHEN pm.meta_key = '_reserva_nombre_cliente' THEN pm.meta_value END) as cliente,
                    MAX(CASE WHEN pm.meta_key = '_reserva_vehiculo_id' THEN pm.meta_value END) as vehiculo_id,
                    MAX(CASE WHEN pm.meta_key = '_reserva_fecha_inicio' THEN pm.meta_value END) as fecha_inicio,
                    MAX(CASE WHEN pm.meta_key = '_reserva_fecha_fin' THEN pm.meta_value END) as fecha_fin,
                    MAX(CASE WHEN pm.meta_key = '_reserva_precio_total' THEN pm.meta_value END) as precio_total
                FROM {$wpdb->posts} p
                INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
                WHERE p.post_type = %s AND p.post_status = 'publish'
                GROUP BY p.ID, p.post_date
                ORDER BY p.post_date DESC
                LIMIT 50",
                'reserva'
            )
        );

        foreach ($reservas as $r) {
            $vehiculoNombre = '';
            if ($r->vehiculo_id) {
                $vehiculoNombre = get_post_meta((int) $r->vehiculo_id, '_vehiculo_nombre', true)
                    ?: get_the_title((int) $r->vehiculo_id);
            }

            $base = [
                'reservaId'      => (int) $r->ID,
                'vehiculoNombre' => $vehiculoNombre,
                'clienteNombre'  => $r->cliente ?? '',
            ];

            /* Entrega hoy: fecha_inicio = hoy y estado confirmada */
            if ($r->fecha_inicio === $hoy && $r->estado === 'confirmada') {
                $eventos[] = array_merge($base, [
                    'tipo'    => 'entrega_hoy',
                    'mensaje' => sprintf('Entregar %s a %s', $vehiculoNombre, $r->cliente),
                    'fecha'   => $hoy,
                ]);
            }

            /* Devolución hoy */
            if ($r->fecha_fin === $hoy && in_array($r->estado, ['confirmada', 'completada'], true)) {
                $eventos[] = array_merge($base, [
                    'tipo'    => 'devolucion_hoy',
                    'mensaje' => sprintf('Recibir %s de %s', $vehiculoNombre, $r->cliente),
                    'fecha'   => $hoy,
                ]);
            }

            /* Devolución mañana */
            if ($r->fecha_fin === $manana && in_array($r->estado, ['confirmada', 'completada'], true)) {
                $eventos[] = array_merge($base, [
                    'tipo'    => 'devolucion_manana',
                    'mensaje' => sprintf('Mañana: recibir %s de %s', $vehiculoNombre, $r->cliente),
                    'fecha'   => $manana,
                ]);
            }

            /* Eventos por estado de la reserva (las más recientes) */
            $fechaCreacion = $r->post_date;
            switch ($r->estado) {
                case 'pendiente':
                    $eventos[] = array_merge($base, [
                        'tipo'    => 'nueva_reserva',
                        'mensaje' => sprintf('Nueva reserva pendiente de %s — %s', $r->cliente, $vehiculoNombre),
                        'fecha'   => $fechaCreacion,
                    ]);
                    break;

                case 'confirmada':
                    $eventos[] = array_merge($base, [
                        'tipo'    => 'reserva_confirmada',
                        'mensaje' => sprintf('Reserva confirmada de %s — %s (%.2f€)', $r->cliente, $vehiculoNombre, (float) $r->precio_total),
                        'fecha'   => $fechaCreacion,
                    ]);
                    break;

                case 'cancelada':
                    $eventos[] = array_merge($base, [
                        'tipo'    => 'reserva_cancelada',
                        'mensaje' => sprintf('Reserva cancelada: %s — %s', $r->cliente, $vehiculoNombre),
                        'fecha'   => $fechaCreacion,
                    ]);
                    break;

                case 'fallida':
                    $eventos[] = array_merge($base, [
                        'tipo'    => 'pago_fallido',
                        'mensaje' => sprintf('Pago fallido: %s — %s', $r->cliente, $vehiculoNombre),
                        'fecha'   => $fechaCreacion,
                    ]);
                    break;
            }
        }

        /* Ordenar por fecha descendente y limitar a 20 eventos */
        usort($eventos, function ($a, $b) {
            return strcmp($b['fecha'], $a['fecha']);
        });

        return array_slice($eventos, 0, 20);
    }
}
