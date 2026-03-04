<?php

namespace App\Admin;

/**
 * Widget de dashboard para resumen de reservas.
 * Muestra contadores por estado y las últimas 5 reservas.
 */
class DashboardWidget
{
    public static function register(): void
    {
        add_action('wp_dashboard_setup', [self::class, 'addWidget']);
    }

    public static function addWidget(): void
    {
        wp_add_dashboard_widget(
            'cresta_reservas_dashboard',
            '🚐 Cresta Campers — Reservas',
            [self::class, 'render']
        );
    }

    public static function render(): void
    {
        // Contadores por estado
        $estados = ['pendiente', 'confirmada', 'completada', 'cancelada'];
        $contadores = [];

        foreach ($estados as $estado) {
            $query = new \WP_Query([
                'post_type'      => 'reserva',
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'fields'         => 'ids',
                'meta_query'     => [
                    [
                        'key'   => '_reserva_estado',
                        'value' => $estado,
                    ],
                ],
            ]);
            $contadores[$estado] = $query->found_posts;
            wp_reset_postdata();
        }

        $colores = [
            'pendiente'  => ['#f59e0b', '#fffbeb'],
            'confirmada' => ['#10b981', '#ecfdf5'],
            'completada' => ['#6366f1', '#eef2ff'],
            'cancelada'  => ['#ef4444', '#fef2f2'],
        ];

        echo '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">';
        foreach ($contadores as $estado => $count) {
            [$color, $bg] = $colores[$estado];
            echo '<div style="background:' . $bg . ';border-radius:8px;padding:12px;text-align:center;border-left:3px solid ' . $color . '">';
            echo '<div style="font-size:24px;font-weight:700;color:' . $color . '">' . $count . '</div>';
            echo '<div style="font-size:11px;color:#6b7280;text-transform:uppercase">' . esc_html($estado) . '</div>';
            echo '</div>';
        }
        echo '</div>';

        // Últimas reservas
        $recientes = new \WP_Query([
            'post_type'      => 'reserva',
            'post_status'    => 'publish',
            'posts_per_page' => 5,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ]);

        if ($recientes->have_posts()) {
            echo '<table style="width:100%;font-size:12px;border-collapse:collapse">';
            echo '<tr style="border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:6px 4px;color:#6b7280">Cliente</th><th style="text-align:left;padding:6px 4px;color:#6b7280">Fechas</th><th style="text-align:right;padding:6px 4px;color:#6b7280">Total</th><th style="text-align:center;padding:6px 4px;color:#6b7280">Estado</th></tr>';

            while ($recientes->have_posts()) {
                $recientes->the_post();
                $id      = get_the_ID();
                $nombre  = get_post_meta($id, '_reserva_nombre_cliente', true) ?: '—';
                $inicio  = get_post_meta($id, '_reserva_fecha_inicio', true);
                $fin     = get_post_meta($id, '_reserva_fecha_fin', true);
                $total   = (float) get_post_meta($id, '_reserva_precio_total', true);
                $estado  = get_post_meta($id, '_reserva_estado', true) ?: 'pendiente';
                $editUrl = get_edit_post_link($id);
                [$color] = $colores[$estado] ?? ['#6b7280', '#f9fafb'];

                echo '<tr style="border-bottom:1px solid #f3f4f6">';
                echo '<td style="padding:8px 4px"><a href="' . esc_url($editUrl) . '">' . esc_html($nombre) . '</a></td>';
                echo '<td style="padding:8px 4px">';
                if ($inicio && $fin) {
                    echo esc_html(date_i18n('d/m', strtotime($inicio))) . '–' . esc_html(date_i18n('d/m', strtotime($fin)));
                } else {
                    echo '—';
                }
                echo '</td>';
                echo '<td style="padding:8px 4px;text-align:right;font-weight:600">' . ($total > 0 ? number_format($total, 0, ',', '.') . '€' : '—') . '</td>';
                echo '<td style="padding:8px 4px;text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;color:#fff;background:' . esc_attr($color) . '">' . esc_html(ucfirst($estado)) . '</span></td>';
                echo '</tr>';
            }

            echo '</table>';
            wp_reset_postdata();
        } else {
            echo '<p style="color:#9ca3af;text-align:center;padding:16px 0">No hay reservas todavía.</p>';
        }

        echo '<p style="text-align:right;margin-top:8px"><a href="' . admin_url('edit.php?post_type=reserva') . '">Ver todas las reservas →</a></p>';
    }
}
