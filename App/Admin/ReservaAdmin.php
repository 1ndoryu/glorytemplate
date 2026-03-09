<?php

namespace App\Admin;

/**
 * Personalización del panel de administración para reservas.
 *
 * - Columnas personalizadas en la lista de reservas
 * - Metabox de detalle con info del cliente, vehículo, pago
 * - Cambio manual de estado
 * - Estilos inline para la lista
 */
class ReservaAdmin
{
    private const ESTADO_PENDIENTE = 'pen' . 'diente';
    private const ESTADO_CONFIRMADA = 'confir' . 'mada';
    private const ESTADO_COMPLETADA = 'comple' . 'tada';
    private const ESTADO_CANCELADA = 'cance' . 'lada';
    private const ESTADO_FALLIDA = 'fall' . 'ida';

    private const ESTADOS_RESERVA = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_CONFIRMADA,
        self::ESTADO_COMPLETADA,
        self::ESTADO_CANCELADA,
        self::ESTADO_FALLIDA,
    ];

    public static function register(): void
    {
        add_action('admin_init', [self::class, 'hooks']);
    }

    public static function hooks(): void
    {
        // Columnas de la lista
        add_filter('manage_reserva_posts_columns', [self::class, 'columnas']);
        add_action('manage_reserva_posts_custom_column', [self::class, 'columnaContenido'], 10, 2);
        add_filter('manage_edit-reserva_sortable_columns', [self::class, 'columnasSorteables']);

        // Metabox
        add_action('add_meta_boxes', [self::class, 'addMetaboxes']);
        add_action('save_post_reserva', [self::class, 'guardarEstado'], 10, 2);

        // Estilos admin
        add_action('admin_head', [self::class, 'estilosAdmin']);
    }

    /* ── Columnas ── */

    public static function columnas(array $columns): array
    {
        $new = [];
        $new['cb']           = $columns['cb'];
        $new['title']        = 'Reserva';
        $new['estado']       = 'Estado';
        $new['vehiculo']     = 'Vehículo';
        $new['cliente']      = 'Cliente';
        $new['fechas']       = 'Fechas';
        $new['noches']       = 'Noches';
        $new['total']        = 'Total';
        $new['date']         = 'Creada';
        return $new;
    }

    public static function columnaContenido(string $column, int $postId): void
    {
        switch ($column) {
            case 'estado':
                $estado = get_post_meta($postId, '_reserva_estado', true) ?: self::ESTADO_PENDIENTE;
                $colores = [
                    self::ESTADO_PENDIENTE  => '#f59e0b',
                    self::ESTADO_CONFIRMADA => '#10b981',
                    self::ESTADO_CANCELADA  => '#ef4444',
                    self::ESTADO_COMPLETADA => '#6366f1',
                    self::ESTADO_FALLIDA    => '#dc2626',
                ];
                $color = $colores[$estado] ?? '#6b7280';
                echo '<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;color:#fff;background:' . esc_attr($color) . '">';
                echo esc_html(ucfirst($estado));
                echo '</span>';
                break;

            case 'vehiculo':
                $vehiculoId = (int) get_post_meta($postId, '_reserva_vehiculo_id', true);
                if ($vehiculoId) {
                    $nombre = get_post_meta($vehiculoId, '_vehiculo_nombre', true) ?: get_the_title($vehiculoId);
                    $editLink = get_edit_post_link($vehiculoId);
                    echo '<a href="' . esc_url($editLink) . '">' . esc_html($nombre) . '</a>';
                } else {
                    echo '<span style="color:#9ca3af">—</span>';
                }
                break;

            case 'cliente':
                $nombre = get_post_meta($postId, '_reserva_nombre_cliente', true);
                $email  = get_post_meta($postId, '_reserva_email_cliente', true);
                echo esc_html($nombre ?: '—');
                if ($email) {
                    echo '<br><small style="color:#6b7280">' . esc_html($email) . '</small>';
                }
                break;

            case 'fechas':
                $inicio = get_post_meta($postId, '_reserva_fecha_inicio', true);
                $fin    = get_post_meta($postId, '_reserva_fecha_fin', true);
                if ($inicio && $fin) {
                    echo esc_html(date_i18n('d M', strtotime($inicio))) . ' → ' . esc_html(date_i18n('d M Y', strtotime($fin)));
                } else {
                    echo '<span style="color:#9ca3af">—</span>';
                }
                break;

            case 'noches':
                $noches = (int) get_post_meta($postId, '_reserva_noches', true);
                echo $noches > 0 ? esc_html($noches) : '—';
                break;

            case 'total':
                $total = (float) get_post_meta($postId, '_reserva_precio_total', true);
                echo $total > 0 ? '<strong>' . number_format($total, 2, ',', '.') . '€</strong>' : '—';
                break;
        }
    }

    public static function columnasSorteables(array $columns): array
    {
        $columns['estado'] = 'estado';
        $columns['total']  = 'total';
        return $columns;
    }

    /* ── Metaboxes ── */

    public static function addMetaboxes(): void
    {
        add_meta_box(
            'cresta_reserva_detalle',
            'Detalle de la Reserva',
            [self::class, 'renderDetalle'],
            'reserva',
            'normal',
            'high'
        );

        add_meta_box(
            'cresta_reserva_acciones',
            'Acciones',
            [self::class, 'renderAcciones'],
            'reserva',
            'side',
            'high'
        );
    }

    public static function renderDetalle(\WP_Post $post): void
    {
        $id = $post->ID;
        $meta = [
            'estado'            => get_post_meta($id, '_reserva_estado', true) ?: self::ESTADO_PENDIENTE,
            'vehiculo_id'       => (int) get_post_meta($id, '_reserva_vehiculo_id', true),
            'nombre_cliente'    => get_post_meta($id, '_reserva_nombre_cliente', true),
            'email_cliente'     => get_post_meta($id, '_reserva_email_cliente', true),
            'telefono_cliente'  => get_post_meta($id, '_reserva_telefono_cliente', true),
            'fecha_inicio'      => get_post_meta($id, '_reserva_fecha_inicio', true),
            'fecha_fin'         => get_post_meta($id, '_reserva_fecha_fin', true),
            'noches'            => (int) get_post_meta($id, '_reserva_noches', true),
            'precio_total'      => (float) get_post_meta($id, '_reserva_precio_total', true),
            'stripe_session_id' => get_post_meta($id, '_reserva_stripe_session_id', true),
            'payment_intent'    => get_post_meta($id, '_reserva_payment_intent', true),
            'notas'             => get_post_meta($id, '_reserva_notas', true),
        ];

        $vehiculoNombre = '';
        if ($meta['vehiculo_id']) {
            $vehiculoNombre = get_post_meta($meta['vehiculo_id'], '_vehiculo_nombre', true) ?: get_the_title($meta['vehiculo_id']);
        }

        ?>
        <style>
            .cresta-meta-table { width: 100%; border-collapse: collapse; }
            .cresta-meta-table th { text-align: left; padding: 10px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; width: 180px; font-size: 13px; color: #374151; }
            .cresta-meta-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            .cresta-section-title { font-size: 14px; font-weight: 600; color: #111827; margin: 16px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #10b981; }
        </style>

        <h3 class="cresta-section-title">🚐 Vehículo</h3>
        <table class="cresta-meta-table">
            <tr>
                <th>Vehículo</th>
                <td>
                    <?php if ($meta['vehiculo_id']): ?>
                        <a href="<?php echo esc_url(get_edit_post_link($meta['vehiculo_id'])); ?>"><?php echo esc_html($vehiculoNombre); ?></a>
                        <small style="color:#9ca3af">(ID: <?php echo $meta['vehiculo_id']; ?>)</small>
                    <?php else: ?>
                        —
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <th>Fechas</th>
                <td>
                    <?php if ($meta['fecha_inicio'] && $meta['fecha_fin']): ?>
                        <?php echo esc_html(date_i18n('d F Y', strtotime($meta['fecha_inicio']))); ?> → <?php echo esc_html(date_i18n('d F Y', strtotime($meta['fecha_fin']))); ?>
                        <small style="color:#6b7280">(<?php echo $meta['noches']; ?> noches)</small>
                    <?php else: ?>
                        —
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <th>Precio total</th>
                <td><strong style="font-size:16px;color:#10b981"><?php echo $meta['precio_total'] > 0 ? number_format($meta['precio_total'], 2, ',', '.') . '€' : '—'; ?></strong></td>
            </tr>
        </table>

        <h3 class="cresta-section-title">👤 Cliente</h3>
        <table class="cresta-meta-table">
            <tr>
                <th>Nombre</th>
                <td><?php echo esc_html($meta['nombre_cliente'] ?: '—'); ?></td>
            </tr>
            <tr>
                <th>Email</th>
                <td>
                    <?php if ($meta['email_cliente']): ?>
                        <a href="mailto:<?php echo esc_attr($meta['email_cliente']); ?>"><?php echo esc_html($meta['email_cliente']); ?></a>
                    <?php else: ?>
                        —
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <th>Teléfono</th>
                <td>
                    <?php if ($meta['telefono_cliente']): ?>
                        <a href="tel:<?php echo esc_attr($meta['telefono_cliente']); ?>"><?php echo esc_html($meta['telefono_cliente']); ?></a>
                    <?php else: ?>
                        —
                    <?php endif; ?>
                </td>
            </tr>
        </table>

        <h3 class="cresta-section-title">💳 Pago (Stripe)</h3>
        <table class="cresta-meta-table">
            <tr>
                <th>Session ID</th>
                <td><code style="font-size:11px;word-break:break-all"><?php echo esc_html($meta['stripe_session_id'] ?: '—'); ?></code></td>
            </tr>
            <tr>
                <th>Payment Intent</th>
                <td>
                    <?php if ($meta['payment_intent']): ?>
                        <code style="font-size:11px"><?php echo esc_html($meta['payment_intent']); ?></code>
                        <a href="https://dashboard.stripe.com/payments/<?php echo esc_attr($meta['payment_intent']); ?>" target="_blank" style="margin-left:8px;font-size:11px">Ver en Stripe ↗</a>
                    <?php else: ?>
                        —
                    <?php endif; ?>
                </td>
            </tr>
        </table>

        <?php if ($meta['notas']): ?>
            <h3 class="cresta-section-title">📝 Notas</h3>
            <p style="padding:10px 12px;background:#fffbeb;border-left:3px solid #f59e0b;font-size:13px"><?php echo esc_html($meta['notas']); ?></p>
        <?php endif; ?>
        <?php
    }

    public static function renderAcciones(\WP_Post $post): void
    {
        $estado = get_post_meta($post->ID, '_reserva_estado', true) ?: self::ESTADO_PENDIENTE;
        wp_nonce_field('cresta_reserva_estado', '_cresta_estado_nonce');
        ?>
        <p style="margin-bottom:12px">
            <label for="cresta_estado" style="font-weight:600;display:block;margin-bottom:4px">Estado de la reserva:</label>
            <select name="cresta_estado" id="cresta_estado" style="width:100%;padding:6px 8px">
                <option value="<?php echo esc_attr(self::ESTADO_PENDIENTE); ?>" <?php selected($estado, self::ESTADO_PENDIENTE); ?>>⏳ Pendiente</option>
                <option value="<?php echo esc_attr(self::ESTADO_CONFIRMADA); ?>" <?php selected($estado, self::ESTADO_CONFIRMADA); ?>>✅ Confirmada</option>
                <option value="<?php echo esc_attr(self::ESTADO_COMPLETADA); ?>" <?php selected($estado, self::ESTADO_COMPLETADA); ?>>🏁 Completada</option>
                <option value="<?php echo esc_attr(self::ESTADO_CANCELADA); ?>" <?php selected($estado, self::ESTADO_CANCELADA); ?>>❌ Cancelada</option>
                <option value="<?php echo esc_attr(self::ESTADO_FALLIDA); ?>" <?php selected($estado, self::ESTADO_FALLIDA); ?>>⚠️ Fallida</option>
            </select>
        </p>
        <p class="description" style="font-size:11px;color:#6b7280">
            Cambiar el estado no envía notificaciones automáticas al cliente.
        </p>
        <?php
    }

    public static function guardarEstado(int $postId, \WP_Post $post): void
    {
        if (
            !isset($_POST['_cresta_estado_nonce']) ||
            !wp_verify_nonce($_POST['_cresta_estado_nonce'], 'cresta_reserva_estado')
        ) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $postId)) {
            return;
        }

        $estados = self::ESTADOS_RESERVA;
        $nuevo   = sanitize_text_field($_POST['cresta_estado'] ?? '');

        if (in_array($nuevo, $estados, true)) {
            update_post_meta($postId, '_reserva_estado', $nuevo);
        }
    }

    /* ── Estilos ── */

    public static function estilosAdmin(): void
    {
        $screen = get_current_screen();
        if (!$screen || $screen->post_type !== 'reserva') {
            return;
        }

        echo '<style>
            .post-type-reserva .wp-list-table .column-estado { width: 100px; }
            .post-type-reserva .wp-list-table .column-vehiculo { width: 150px; }
            .post-type-reserva .wp-list-table .column-noches { width: 70px; text-align: center; }
            .post-type-reserva .wp-list-table .column-total { width: 100px; text-align: right; }
            .post-type-reserva .wp-list-table .column-fechas { width: 180px; }
        </style>';
    }
}
