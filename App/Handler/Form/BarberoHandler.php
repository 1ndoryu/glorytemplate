<?php

namespace App\Handler\Form;

use Glory\Handler\Form\FormHandlerInterface;

class BarberoHandler implements FormHandlerInterface
{
    private string $optionKey;

    public function __construct(string $optionKey = 'barberia_barberos')
    {
        $this->optionKey = $optionKey;
    }

    public function procesar(array $postDatos, array $archivos): array
    {
        $barberos = get_option($this->optionKey, []);
        $action = $postDatos['action'] ?? '';

        if ($action === 'delete' && ! empty($postDatos['id'])) {
            $id = intval($postDatos['id']);
            if (isset($barberos[$id])) {
                if (! empty($barberos[$id]['term_id'])) {
                    $term_id = intval($barberos[$id]['term_id']);
                    if (term_exists($term_id, 'barbero')) {
                        wp_delete_term($term_id, 'barbero');
                    }
                }
                unset($barberos[$id]);
                update_option($this->optionKey, array_values($barberos));
                return ['alert' => 'Barbero eliminado correctamente.'];
            }
        } else {
            $name = sanitize_text_field($postDatos['name'] ?? '');
            $services = sanitize_text_field($postDatos['services'] ?? '');
            $services_arr = array_filter(array_map('trim', explode(',', $services)));

            $image_id = 0;
            if (! empty($archivos['image']['name'])) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/media.php';
                require_once ABSPATH . 'wp-admin/includes/image.php';
                $file = media_handle_upload('image', 0);
                if (! is_wp_error($file)) {
                    $image_id = intval($file);
                }
            } elseif (! empty($postDatos['image_id'])) {
                $image_id = intval($postDatos['image_id']);
            }

            $editing = isset($postDatos['id']) && $postDatos['id'] !== '';
            if ($editing) {
                $id = intval($postDatos['id']);
                if (isset($barberos[$id])) {
                    $barberos[$id]['name'] = $name;
                    $barberos[$id]['services'] = $services_arr;
                    if ($image_id) {
                        $barberos[$id]['image_id'] = $image_id;
                    }

                    $term_id = ! empty($barberos[$id]['term_id']) ? intval($barberos[$id]['term_id']) : 0;
                    if ($term_id && term_exists($term_id, 'barbero')) {
                        wp_update_term($term_id, 'barbero', ['name' => $name, 'slug' => sanitize_title($name)]);
                    } else {
                        $existing = term_exists($name, 'barbero');
                        if ($existing === 0 || $existing === null) {
                            $inserted = wp_insert_term($name, 'barbero', ['slug' => sanitize_title($name)]);
                            if (! is_wp_error($inserted) && isset($inserted['term_id'])) {
                                $term_id = intval($inserted['term_id']);
                                $barberos[$id]['term_id'] = $term_id;
                            }
                        } else {
                            $term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
                            $barberos[$id]['term_id'] = $term_id;
                        }
                    }

                    if ($term_id) {
                        update_term_meta($term_id, 'image_id', $image_id);
                    }
                }
            } else {
                $new_entry = [
                    'name' => $name,
                    'services' => $services_arr,
                    'image_id' => $image_id,
                ];

                $existing = term_exists($name, 'barbero');
                if ($existing === 0 || $existing === null) {
                    $inserted = wp_insert_term($name, 'barbero', ['slug' => sanitize_title($name)]);
                    if (! is_wp_error($inserted) && isset($inserted['term_id'])) {
                        $new_entry['term_id'] = intval($inserted['term_id']);
                        update_term_meta($new_entry['term_id'], 'image_id', $image_id);
                    }
                } else {
                    $term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
                    $new_entry['term_id'] = $term_id;
                    update_term_meta($term_id, 'image_id', $image_id);
                }

                $barberos[] = $new_entry;
            }

            update_option($this->optionKey, array_values($barberos));
            return ['alert' => 'Barbero guardado correctamente.'];
        }

        return ['error' => 'No se pudo procesar la solicitud.'];
    }

    public static function registerAjaxEndpoints()
    {
        add_action('wp_ajax_glory_get_barbero_details', [__CLASS__, 'getBarberoDetailsAjax']);
        add_action('wp_ajax_nopriv_glory_get_barbero_details', [__CLASS__, 'getBarberoDetailsAjax']);
    }

    public static function getBarberoDetailsAjax()
    {
        if (!isset($_POST['id']) || !is_numeric($_POST['id'])) {
            wp_send_json_error(['mensaje' => 'ID de barbero no válido.']);
            return;
        }

        $term_id = intval($_POST['id']);
        $term = get_term($term_id, 'barbero');

        if (is_wp_error($term) || !$term) {
            wp_send_json_error(['mensaje' => 'Barbero no encontrado.']);
            return;
        }

        $image_id = get_term_meta($term->term_id, 'image_id', true);
        $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'thumbnail') : '';
        $services_ids = get_term_meta($term->term_id, 'servicios', true);

        $data = [
            'name' => $term->name,
            'term_id' => $term->term_id,
            'image_id' => [
                'id' => $image_id,
                'url' => $image_url,
            ],
            'services[]' => is_array($services_ids) ? $services_ids : [],
        ];

        wp_send_json_success($data);
    }
}
