<?php

namespace App\Api\Facturacion\Controllers;

use WP_REST_Response;
use WP_Query;

class AdminStatsController extends BaseController
{
    public static function getClientes(): WP_REST_Response
    {
        $users = get_users([
            'role__not_in' => ['administrator'],
            'orderby' => 'registered',
            'order' => 'DESC',
        ]);

        $clientes = [];
        foreach ($users as $user) {
            /* Calcular deuda del cliente */
            $facturas = new WP_Query([
                'post_type' => 'glory_factura',
                'post_status' => 'publish',
                'author' => $user->ID,
                'meta_query' => [
                    [
                        'key' => '_estado',
                        'value' => 'pendiente',
                        'compare' => '=',
                    ],
                ],
            ]);

            $deuda = 0;
            foreach ($facturas->posts as $factura) {
                $deuda += (float) get_post_meta($factura->ID, '_total', true);
            }

            /* Contar servicios activos */
            $trabajos = new WP_Query([
                'post_type' => 'glory_trabajo',
                'post_status' => 'publish',
                'author' => $user->ID,
                'meta_query' => [
                    [
                        'key' => '_estado',
                        'value' => ['en_progreso', 'revision'],
                        'compare' => 'IN',
                    ],
                ],
            ]);

            $clientes[] = [
                'id' => $user->ID,
                'nombre' => $user->display_name,
                'email' => $user->user_email,
                'avatar' => get_avatar_url($user->ID, ['size' => 48]),
                'fechaRegistro' => $user->user_registered,
                'deuda' => $deuda,
                'serviciosActivos' => $trabajos->found_posts,
            ];
        }

        return self::success($clientes, 200, '', ['total' => count($clientes)]);
    }

    public static function getEstadisticasAdmin(): WP_REST_Response
    {
        /* Total clientes */
        $totalClientes = count(get_users(['role__not_in' => ['administrator']]));

        /* Ingresos del mes */
        $inicioMes = date('Y-m-01 00:00:00');
        $facturasPagadas = new WP_Query([
            'post_type' => 'glory_factura',
            'post_status' => 'publish',
            'date_query' => [
                ['after' => $inicioMes],
            ],
            'meta_query' => [
                [
                    'key' => '_estado',
                    'value' => 'pagada',
                    'compare' => '=',
                ],
            ],
            'posts_per_page' => -1,
        ]);

        $ingresosMes = 0;
        foreach ($facturasPagadas->posts as $factura) {
            $ingresosMes += (float) get_post_meta($factura->ID, '_total', true);
        }

        /* Trabajos activos */
        $trabajosActivos = new WP_Query([
            'post_type' => 'glory_trabajo',
            'post_status' => 'publish',
            'meta_query' => [
                [
                    'key' => '_estado',
                    'value' => ['en_progreso', 'revision'],
                    'compare' => 'IN',
                ],
            ],
            'posts_per_page' => -1,
        ]);

        /* Facturas pendientes */
        $facturasPendientes = new WP_Query([
            'post_type' => 'glory_factura',
            'post_status' => 'publish',
            'meta_query' => [
                [
                    'key' => '_estado',
                    'value' => 'pendiente',
                    'compare' => '=',
                ],
            ],
            'posts_per_page' => -1,
        ]);

        $montoPendiente = 0;
        foreach ($facturasPendientes->posts as $factura) {
            $montoPendiente += (float) get_post_meta($factura->ID, '_total', true);
        }

        return self::success([
            'totalClientes' => $totalClientes,
            'ingresosMes' => $ingresosMes,
            'trabajosActivos' => $trabajosActivos->found_posts,
            'facturasPendientes' => $facturasPendientes->found_posts,
            'montoPendiente' => $montoPendiente,
        ]);
    }
}
