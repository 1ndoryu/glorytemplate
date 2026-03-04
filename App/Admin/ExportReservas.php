<?php

namespace App\Admin;

/**
 * Export de reservas a CSV desde el panel de administración.
 *
 * Añade un botón "Exportar CSV" en el listado de reservas (edit.php?post_type=reserva).
 * El CSV incluye: fecha de reserva, estado, vehículo, cliente, email, teléfono,
 * fechas, noches, precio/noche, total, temporada, Stripe session_id.
 *
 * Acceso restringido a administradores (manage_options).
 */
class ExportReservas
{
    private const NONCE_ACTION = 'cresta_export_reservas';
    private const NONCE_NAME   = '_cresta_export_nonce';
    private const QUERY_ARG    = 'cresta_export_csv';

    public static function register(): void
    {
        add_action('admin_init', [self::class, 'manejarExport']);
        add_action('restrict_manage_posts', [self::class, 'botonExport']);
    }

    /* ── Botón en la barra de filtros del listado ── */

    public static function botonExport(): void
    {
        $screen = get_current_screen();
        if (!$screen || $screen->post_type !== 'reserva') {
            return;
        }

        if (!current_user_can('manage_options')) {
            return;
        }

        $url = wp_nonce_url(
            add_query_arg(self::QUERY_ARG, '1', admin_url('edit.php?post_type=reserva')),
            self::NONCE_ACTION,
            self::NONCE_NAME
        );

        echo '<a href="' . esc_url($url) . '" class="button button-secondary" style="margin-left:8px">Exportar CSV</a>';
    }

    /* ── Handler del export: valida, consulta y descarga ── */

    public static function manejarExport(): void
    {
        if (!isset($_GET[self::QUERY_ARG])) {
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_die('Acceso denegado.', 403);
        }

        if (
            !isset($_GET[self::NONCE_NAME]) ||
            !wp_verify_nonce(sanitize_text_field(wp_unslash($_GET[self::NONCE_NAME])), self::NONCE_ACTION)
        ) {
            wp_die('Nonce inválido. Vuelve a la página e inténtalo de nuevo.', 400);
        }

        $reservas = self::obtenerReservas();
        self::enviarCsv($reservas);
    }

    /* ── Consulta todas las reservas ── */

    private static function obtenerReservas(): array
    {
        $args = [
            'post_type'      => 'reserva',
            'post_status'    => 'any',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ];

        $query   = new \WP_Query($args);
        $filas   = [];

        foreach ($query->posts as $post) {
            $id = $post->ID;

            $vehiculoId     = (int) get_post_meta($id, '_reserva_vehiculo_id', true);
            $vehiculoNombre = '';
            if ($vehiculoId) {
                $vehiculoNombre = get_post_meta($vehiculoId, '_vehiculo_nombre', true)
                    ?: get_the_title($vehiculoId);
            }

            $filas[] = [
                'id'              => $id,
                'fecha_creacion'  => get_the_date('Y-m-d H:i:s', $post),
                'estado'          => get_post_meta($id, '_reserva_estado', true) ?: 'pendiente',
                'vehiculo'        => $vehiculoNombre,
                'cliente'         => get_post_meta($id, '_reserva_nombre_cliente', true),
                'email'           => get_post_meta($id, '_reserva_email_cliente', true),
                'telefono'        => get_post_meta($id, '_reserva_telefono_cliente', true),
                'fecha_inicio'    => get_post_meta($id, '_reserva_fecha_inicio', true),
                'fecha_fin'       => get_post_meta($id, '_reserva_fecha_fin', true),
                'noches'          => get_post_meta($id, '_reserva_noches', true),
                'precio_noche'    => get_post_meta($id, '_reserva_precio_noche', true),
                'precio_total'    => get_post_meta($id, '_reserva_precio_total', true),
                'temporada'       => get_post_meta($id, '_reserva_temporada', true),
                'stripe_session'  => get_post_meta($id, '_reserva_stripe_session_id', true),
                'notas'           => get_post_meta($id, '_reserva_notas', true),
            ];
        }

        return $filas;
    }

    /* ── Genera y envía el CSV como descarga ── */

    private static function enviarCsv(array $filas): void
    {
        $nombre = 'reservas-cresta-campers-' . date('Y-m-d') . '.csv';

        /* Evitar que WordPress o plugins añadan output antes de los headers */
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $nombre . '"');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        /* BOM UTF-8 para compatibilidad con Excel */
        echo "\xEF\xBB\xBF";

        $output = fopen('php://output', 'w');
        if ($output === false) {
            wp_die('Error al generar el CSV.', 500);
        }

        /* Cabecera */
        fputcsv($output, [
            'ID',
            'Fecha creación',
            'Estado',
            'Vehículo',
            'Nombre cliente',
            'Email',
            'Teléfono',
            'Fecha inicio',
            'Fecha fin',
            'Noches',
            'Precio/noche (€)',
            'Total (€)',
            'Temporada',
            'Stripe Session ID',
            'Notas',
        ], ';');

        foreach ($filas as $fila) {
            fputcsv($output, array_values($fila), ';');
        }

        fclose($output);
        exit;
    }
}
