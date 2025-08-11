<?php

namespace App\Handler\Form;

use Glory\Handler\Form\FormHandlerInterface;

class GuardarServicioHandler implements FormHandlerInterface
{
    private string $optionKey;

    public function __construct(string $optionKey = 'barberia_servicios')
    {
        $this->optionKey = $optionKey;
    }

    public function procesar(array $postDatos, array $archivos): array
    {
        // Nonce opcional: si viene, verificar; si no, continuar (otros listados ya dependen del nonce global)
        if (isset($postDatos['servicios_nonce']) && ! wp_verify_nonce($postDatos['servicios_nonce'], 'servicios_save')) {
            throw new \Exception('Nonce inválido.');
        }

        $servicios = get_option($this->optionKey, []);

        $name = sanitize_text_field($postDatos['name'] ?? '');
        $price = floatval($postDatos['price'] ?? 0);
        $duration = intval($postDatos['duration'] ?? 30);

        if ($name === '') {
            throw new \Exception('El nombre del servicio es obligatorio.');
        }

        // Detección de edición: aceptar 'id' (índice en opciones), 'objectId' o 'term_id' (término WP)
        $editing = false;
        $indexUpdate = null;
        $termIdUpdate = 0;

        if (isset($postDatos['id']) && $postDatos['id'] !== '') {
            $indexUpdate = intval($postDatos['id']);
            $editing = isset($servicios[$indexUpdate]);
        }

        if (! $editing) {
            $objectId = isset($postDatos['objectId']) ? intval($postDatos['objectId']) : 0;
            $termIdPost = isset($postDatos['term_id']) ? intval($postDatos['term_id']) : 0;
            $termIdUpdate = $objectId ?: $termIdPost;
            if ($termIdUpdate > 0) {
                // Buscar si ya hay una entrada en opciones con este term_id
                foreach ($servicios as $idx => $s) {
                    if (!empty($s['term_id']) && intval($s['term_id']) === $termIdUpdate) {
                        $indexUpdate = $idx;
                        $editing = true;
                        break;
                    }
                }
            }
        }

        if ($editing) {
            $id = ($indexUpdate !== null) ? $indexUpdate : 0;
            if (!isset($servicios[$id])) {
                $servicios[$id] = [];
            }
            $servicios[$id]['name'] = $name;
            $servicios[$id]['price'] = $price;
            $servicios[$id]['duration'] = $duration;

            // Sincronizar término de taxonomía 'servicio' y meta 'duracion'/'precio'
            $term_id = !empty($servicios[$id]['term_id']) ? intval($servicios[$id]['term_id']) : 0;
            if (!$term_id && $termIdUpdate > 0) {
                $term_id = $termIdUpdate;
                $servicios[$id]['term_id'] = $term_id;
            }
            if ($term_id && term_exists($term_id, 'servicio')) {
                wp_update_term($term_id, 'servicio', ['name' => $name, 'slug' => sanitize_title($name)]);
            } else {
                $existing = term_exists($name, 'servicio');
                if ($existing === 0 || $existing === null) {
                    $inserted = wp_insert_term($name, 'servicio', ['slug' => sanitize_title($name)]);
                    if (!is_wp_error($inserted) && isset($inserted['term_id'])) {
                        $term_id = intval($inserted['term_id']);
                        $servicios[$id]['term_id'] = $term_id;
                    }
                } else {
                    $term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
                    $servicios[$id]['term_id'] = $term_id;
                }
            }

            if ($term_id) {
                update_term_meta($term_id, 'duracion', $duration);
                update_term_meta($term_id, 'precio', $price);
            }
        } else {
            $new_entry = [
                'name' => $name,
                'price' => $price,
                'duration' => $duration,
            ];

            $existing = term_exists($name, 'servicio');
            if ($existing === 0 || $existing === null) {
                $inserted = wp_insert_term($name, 'servicio', ['slug' => sanitize_title($name)]);
                if (!is_wp_error($inserted) && isset($inserted['term_id'])) {
                    $new_entry['term_id'] = intval($inserted['term_id']);
                    update_term_meta($new_entry['term_id'], 'duracion', $duration);
                    update_term_meta($new_entry['term_id'], 'precio', $price);
                }
            } else {
                $term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
                $new_entry['term_id'] = $term_id;
                update_term_meta($term_id, 'duracion', $duration);
                update_term_meta($term_id, 'precio', $price);
            }

            $servicios[] = $new_entry;
        }

        update_option($this->optionKey, array_values($servicios));

        return ['alert' => 'Servicio guardado correctamente.'];
    }

    public static function registerAjaxEndpoints(): void
    {
        add_action('wp_ajax_glory_get_servicio_details', [__CLASS__, 'getServicioDetailsAjax']);
        add_action('wp_ajax_nopriv_glory_get_servicio_details', [__CLASS__, 'getServicioDetailsAjax']);
    }

    public static function getServicioDetailsAjax(): void
    {
        // Acepta id como term_id o como índice de la opción
        if (!isset($_POST['id']) || $_POST['id'] === '') {
            wp_send_json_error(['mensaje' => 'ID no válido.']);
            return;
        }
        $id = intval($_POST['id']);

        $term = get_term($id, 'servicio');
        if ($term && ! is_wp_error($term)) {
            $data = [
                'name' => $term->name,
                'term_id' => $term->term_id,
                'duration' => intval(get_term_meta($term->term_id, 'duracion', true) ?: 30),
                'price' => floatval(get_term_meta($term->term_id, 'precio', true) ?: 0),
            ];
            wp_send_json_success($data);
            return;
        }

        // Fallback: tratar id como índice en options
        $option = get_option('barberia_servicios', []);
        if (is_array($option) && isset($option[$id])) {
            $s = $option[$id];
            $data = [
                'name' => (string)($s['name'] ?? ''),
                'term_id' => intval($s['term_id'] ?? 0),
                'duration' => intval($s['duration'] ?? 30),
                'price' => floatval($s['price'] ?? 0),
            ];
            wp_send_json_success($data);
            return;
        }

        wp_send_json_error(['mensaje' => 'Servicio no encontrado.']);
    }
}


