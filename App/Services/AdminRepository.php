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
}
