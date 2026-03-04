<?php

namespace App\Admin;

/**
 * Personalización del panel de administración para vehículos.
 *
 * - Columnas personalizadas (precio, capacidad, estado)
 * - Metabox de datos completos del vehículo
 * - Galería y equipamiento
 */
class VehiculoAdmin
{
    public static function register(): void
    {
        add_action('admin_init', [self::class, 'hooks']);
    }

    public static function hooks(): void
    {
        add_filter('manage_vehiculo_posts_columns', [self::class, 'columnas']);
        add_action('manage_vehiculo_posts_custom_column', [self::class, 'columnaContenido'], 10, 2);
        add_action('add_meta_boxes', [self::class, 'addMetaboxes']);
        add_action('save_post_vehiculo', [self::class, 'guardar'], 10, 2);
    }

    /* ── Columnas ── */

    public static function columnas(array $columns): array
    {
        $new = [];
        $new['cb']        = $columns['cb'];
        $new['title']     = 'Vehículo';
        $new['precio']    = 'Precio/noche';
        $new['capacidad'] = 'Plazas dormir';
        $new['plazas']    = 'Plazas viaje';
        $new['ubicacion'] = 'Ubicación';
        $new['activo']    = 'Activo';
        $new['date']      = 'Fecha';
        return $new;
    }

    public static function columnaContenido(string $column, int $postId): void
    {
        switch ($column) {
            case 'precio':
                $precio = (float) get_post_meta($postId, '_vehiculo_precio_base', true);
                echo $precio > 0 ? '<strong>' . number_format($precio, 2, ',', '.') . '€</strong>' : '—';
                break;

            case 'capacidad':
                echo (int) get_post_meta($postId, '_vehiculo_capacidad', true) ?: '—';
                break;

            case 'plazas':
                echo (int) get_post_meta($postId, '_vehiculo_plazas_viaje', true) ?: '—';
                break;

            case 'ubicacion':
                echo esc_html(get_post_meta($postId, '_vehiculo_ubicacion', true) ?: '—');
                break;

            case 'activo':
                $activo = get_post_meta($postId, '_vehiculo_activo', true);
                echo $activo === '1'
                    ? '<span style="color:#10b981;font-weight:600">● Sí</span>'
                    : '<span style="color:#ef4444">● No</span>';
                break;
        }
    }

    /* ── Metabox ── */

    public static function addMetaboxes(): void
    {
        add_meta_box(
            'cresta_vehiculo_datos',
            'Datos del Vehículo — Cresta Campers',
            [self::class, 'renderDatos'],
            'vehiculo',
            'normal',
            'high'
        );
    }

    public static function renderDatos(\WP_Post $post): void
    {
        $id = $post->ID;
        wp_nonce_field('cresta_vehiculo_datos', '_cresta_vehiculo_nonce');

        $campos = [
            ['key' => 'nombre',              'label' => 'Nombre comercial',            'type' => 'text'],
            ['key' => 'descripcion_corta',   'label' => 'Descripción corta',           'type' => 'textarea'],
            ['key' => 'precio_base',         'label' => 'Precio base (€/noche)',       'type' => 'number', 'step' => '0.01'],
            ['key' => 'capacidad',           'label' => 'Plazas para dormir',          'type' => 'number'],
            ['key' => 'plazas_viaje',        'label' => 'Plazas de viaje',             'type' => 'number'],
            ['key' => 'combustible',         'label' => 'Combustible',                  'type' => 'select', 'opts' => ['Diésel', 'Gasolina', 'Eléctrico', 'Híbrido']],
            ['key' => 'transmision',         'label' => 'Transmisión',                  'type' => 'select', 'opts' => ['Manual', 'Automática']],
            ['key' => 'ubicacion',           'label' => 'Ubicación de recogida',       'type' => 'text'],
            ['key' => 'km_incluidos',        'label' => 'Km incluidos/día (0=ilimitados)', 'type' => 'number'],
            ['key' => 'fianza',              'label' => 'Fianza (€)',                   'type' => 'number', 'step' => '0.01'],
            ['key' => 'edad_minima',         'label' => 'Edad mínima del conductor',   'type' => 'number'],
            ['key' => 'politica_cancelacion','label' => 'Política de cancelación',      'type' => 'textarea'],
            ['key' => 'activo',              'label' => 'Vehículo activo',              'type' => 'checkbox'],
        ];

        echo '<style>
            .cresta-veh-table { width:100%; border-collapse:collapse; }
            .cresta-veh-table th { text-align:left; padding:10px 12px; background:#f0fdf4; border-bottom:1px solid #e5e7eb; width:200px; font-size:13px; }
            .cresta-veh-table td { padding:10px 12px; border-bottom:1px solid #e5e7eb; }
            .cresta-veh-table input[type="text"],
            .cresta-veh-table input[type="number"],
            .cresta-veh-table select,
            .cresta-veh-table textarea { width:100%; padding:6px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; }
            .cresta-veh-table textarea { min-height:60px; }
        </style>';

        echo '<table class="cresta-veh-table">';

        foreach ($campos as $campo) {
            $metaKey = '_vehiculo_' . $campo['key'];
            $value   = get_post_meta($id, $metaKey, true);
            $name    = 'cresta_vehiculo[' . $campo['key'] . ']';

            echo '<tr><th>' . esc_html($campo['label']) . '</th><td>';

            switch ($campo['type']) {
                case 'text':
                    echo '<input type="text" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '">';
                    break;

                case 'number':
                    $step = $campo['step'] ?? '1';
                    echo '<input type="number" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" step="' . esc_attr($step) . '" min="0">';
                    break;

                case 'textarea':
                    echo '<textarea name="' . esc_attr($name) . '">' . esc_textarea($value) . '</textarea>';
                    break;

                case 'select':
                    echo '<select name="' . esc_attr($name) . '">';
                    echo '<option value="">— Seleccionar —</option>';
                    foreach ($campo['opts'] as $opt) {
                        echo '<option value="' . esc_attr($opt) . '" ' . selected($value, $opt, false) . '>' . esc_html($opt) . '</option>';
                    }
                    echo '</select>';
                    break;

                case 'checkbox':
                    echo '<label><input type="checkbox" name="' . esc_attr($name) . '" value="1" ' . checked($value, '1', false) . '> Visible en la web</label>';
                    break;
            }

            echo '</td></tr>';
        }

        // Equipamiento (JSON)
        $equipJson = get_post_meta($id, '_vehiculo_equipamiento', true);
        $equipDecoded = is_string($equipJson) ? json_decode($equipJson, true) : null;
        $equip     = is_array($equipDecoded) ? implode("\n", $equipDecoded) : '';
        echo '<tr><th>Equipamiento</th><td>';
        echo '<textarea name="cresta_vehiculo[equipamiento]" rows="6" placeholder="Un ítem por línea">' . esc_textarea($equip) . '</textarea>';
        echo '<p class="description">Un elemento por línea. Ej: Nevera portátil, Cocina de gas, etc.</p>';
        echo '</td></tr>';

        echo '</table>';
    }

    public static function guardar(int $postId, \WP_Post $post): void
    {
        if (
            !isset($_POST['_cresta_vehiculo_nonce']) ||
            !wp_verify_nonce($_POST['_cresta_vehiculo_nonce'], 'cresta_vehiculo_datos')
        ) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $postId)) {
            return;
        }

        $datos = $_POST['cresta_vehiculo'] ?? [];
        if (!is_array($datos)) {
            return;
        }

        $camposTexto   = ['nombre', 'descripcion_corta', 'combustible', 'transmision', 'ubicacion', 'politica_cancelacion'];
        $camposNumero  = ['precio_base', 'capacidad', 'plazas_viaje', 'km_incluidos', 'fianza', 'edad_minima'];

        foreach ($camposTexto as $key) {
            if (isset($datos[$key])) {
                update_post_meta($postId, '_vehiculo_' . $key, sanitize_text_field($datos[$key]));
            }
        }

        foreach ($camposNumero as $key) {
            $val = isset($datos[$key]) ? floatval($datos[$key]) : 0;
            update_post_meta($postId, '_vehiculo_' . $key, $val);
        }

        // Checkbox activo
        $activo = isset($datos['activo']) ? '1' : '0';
        update_post_meta($postId, '_vehiculo_activo', $activo);

        // Equipamiento (texto → JSON)
        if (isset($datos['equipamiento'])) {
            $lineas = array_filter(array_map('trim', explode("\n", $datos['equipamiento'])));
            update_post_meta($postId, '_vehiculo_equipamiento', wp_json_encode(array_values($lineas)));
        }
    }
}
