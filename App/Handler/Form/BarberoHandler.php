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
        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('[Barberos][Handler] POST recibido: ' . wp_json_encode($postDatos));
        }

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

            // Normalizar servicios desde el formulario: aceptar tanto 'services' (string) como 'services' (array de IDs)
            $servicesIds = [];
            if (isset($postDatos['services'])) {
                if (is_array($postDatos['services'])) {
                    // Grupo de checkboxes name="services[]" → PHP recibe key 'services'
                    // Soportar opción especial "all" o "*" que indica todos los servicios
                    if (in_array('all', $postDatos['services'], true) || in_array('*', $postDatos['services'], true)) {
                        $servicios_terms = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
                        foreach ($servicios_terms as $st) {
                            $servicesIds[] = intval($st->term_id);
                        }
                    } else {
                        $servicesIds = array_values(array_unique(array_map('intval', $postDatos['services'])));
                    }
                } elseif (is_string($postDatos['services'])) {
                    // Cadena separada por comas (IDs o nombres)
                    $parts = array_filter(array_map('trim', explode(',', $postDatos['services'])));
                    foreach ($parts as $p) {
                        if (is_numeric($p)) {
                            $servicesIds[] = intval($p);
                        } else {
                            if ($p === 'all' || $p === '*') {
                                $servicios_terms = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
                                foreach ($servicios_terms as $st) {
                                    $servicesIds[] = intval($st->term_id);
                                }
                                continue;
                            }
                            // Buscar por nombre de servicio si se envió texto
                            $term = get_term_by('name', $p, 'servicio');
                            if ($term && !is_wp_error($term)) {
                                $servicesIds[] = intval($term->term_id);
                            }
                        }
                    }
                    $servicesIds = array_values(array_unique($servicesIds));
                }
            }

            if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
                error_log('[Barberos][Handler] servicesIds normalizados: ' . wp_json_encode($servicesIds));
            }

            // Construir nombres de servicios para almacenamiento legible
            $services_arr = [];
            if (!empty($servicesIds)) {
                foreach ($servicesIds as $sid) {
                    $t = get_term($sid, 'servicio');
                    if ($t && !is_wp_error($t)) {
                        $services_arr[] = $t->name;
                    }
                }
            }

            $image_id = 0;
            $image_url = '';

            // Detectar edición y precargar valores existentes si es necesario
            $current_term_id = isset($postDatos['term_id']) ? intval($postDatos['term_id']) : 0;
            if ($current_term_id > 0) {
                $image_id = intval(get_term_meta($current_term_id, 'image_id', true));
                $image_url = get_term_meta($current_term_id, 'image_url', true) ?: '';
                if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
                    error_log('[BarberoHandler][procesar] Valores iniciales precargados (term_id ' . $current_term_id . '): image_id=' . $image_id . ', image_url=' . $image_url);
                }
            }

            // Soportar nuevo nombre de input: <nombre>_file (p.ej. image_id_file)
            $expectedFileKey = null;
            if (isset($archivos['image_id_file']) && !empty($archivos['image_id_file']['name'])) {
                $expectedFileKey = 'image_id_file';
            } else {
                // Buscar cualquier archivo que termine en _file y tenga nombre
                foreach ($archivos as $k => $v) {
                    if (is_array($v) && !empty($v['name']) && str_ends_with($k, '_file')) {
                        $expectedFileKey = $k;
                        break;
                    }
                }
            }

            if ($expectedFileKey) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/media.php';
                require_once ABSPATH . 'wp-admin/includes/image.php';

                $storeModeKey = str_replace('_file', '_store', $expectedFileKey);
                $storeMode = $postDatos[$storeModeKey] ?? 'media';

                if ($storeMode === 'media') {
                    $file = media_handle_upload($expectedFileKey, 0);
                    if (! is_wp_error($file)) {
                        $image_id = intval($file);
                    }
                } else {
                    // Subir sin registrar como attachment y guardar URL en meta
                    $overrides = ['test_form' => false];
                    $movefile = wp_handle_upload($archivos[$expectedFileKey], $overrides);
                    if (! empty($movefile) && empty($movefile['error'])) {
                        $image_url = $movefile['url'];
                    }
                }
            } elseif (! empty($postDatos['image_id'])) {
                $image_id = intval($postDatos['image_id']);
            } elseif (! empty($postDatos['image_id_url'])) {
                $image_url = sanitize_text_field($postDatos['image_id_url']);
            }

            if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
                error_log('[BarberoHandler][procesar] Después de procesamiento de archivos: image_id=' . $image_id . ', image_url=' . $image_url);
            }

            // Detectar edición: soportar 'id' (índice), 'objectId' (term_id desde el modal), o 'term_id'
            $editing = false;
            $indexUpdate = null;
            $termIdUpdate = 0;
            if (isset($postDatos['id']) && $postDatos['id'] !== '') {
                $indexUpdate = intval($postDatos['id']);
                $editing = isset($barberos[$indexUpdate]);
            } else {
                $objectId = isset($postDatos['objectId']) ? intval($postDatos['objectId']) : 0;
                $termIdPost = isset($postDatos['term_id']) ? intval($postDatos['term_id']) : 0;
                $termIdUpdate = $objectId ?: $termIdPost;
                if ($termIdUpdate > 0) {
                    foreach ($barberos as $idx => $b) {
                        if (!empty($b['term_id']) && intval($b['term_id']) === $termIdUpdate) {
                            $indexUpdate = $idx;
                            $editing = true;
                            break;
                        }
                    }
                }
            }

            if ($editing) {
                $id = ($indexUpdate !== null) ? $indexUpdate : 0;
                // Si no se encontró entrada existente, crear una nueva asociada al término
                if (!isset($barberos[$id])) {
                    $barberos[$id] = [];
                }
                $barberos[$id]['name'] = $name;
                $barberos[$id]['services'] = $services_arr;
                $barberos[$id]['services_ids'] = $servicesIds;
                // Asegurar que las opciones reflejen el estado actual de la imagen
                $barberos[$id]['image_id'] = intval($image_id);
                $barberos[$id]['image_url'] = is_string($image_url) ? $image_url : '';

                $term_id = ! empty($barberos[$id]['term_id']) ? intval($barberos[$id]['term_id']) : 0;
                if (!$term_id && $termIdUpdate > 0) {
                    $term_id = $termIdUpdate;
                    $barberos[$id]['term_id'] = $term_id;
                }
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
                    $delete_image = isset($postDatos['image_id_delete']) && $postDatos['image_id_delete'] === '1';
                    if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
                        error_log('[BarberoHandler][procesar] image_id_delete recibido: ' . ($delete_image ? 'true' : 'false'));
                    }

                    if ($delete_image) {
                        // Eliminación explícita solicitada
                        delete_term_meta($term_id, 'image_id');
                        delete_term_meta($term_id, 'image_url');
                        $image_id = 0;
                        $image_url = '';
                    } else {
                        // Si hay image_id, guardarlo y borrar la url si existía
                        if ($image_id) {
                            update_term_meta($term_id, 'image_id', $image_id);
                            delete_term_meta($term_id, 'image_url');
                        } elseif ($image_url) {
                            // Si hay image_url, guardarlo y borrar el id si existía
                            update_term_meta($term_id, 'image_url', $image_url);
                            delete_term_meta($term_id, 'image_id');
                        }
                        // Si no hay image_id ni image_url (y no se pidió eliminar), no hacer nada para mantener los existentes
                    }

                    update_term_meta($term_id, 'servicios', $servicesIds);
                    if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
                        error_log('[Barberos][Handler] Edit guardado term_id=' . $term_id . ' services=' . wp_json_encode($servicesIds));
                    }
                }
            } else {
                $new_entry = [
                    'name' => $name,
                    'services' => $services_arr,
                    'services_ids' => $servicesIds,
                    'image_id' => intval($image_id),
                    'image_url' => is_string($image_url) ? $image_url : '',
                ];

                $existing = term_exists($name, 'barbero');
                if ($existing === 0 || $existing === null) {
                    $inserted = wp_insert_term($name, 'barbero', ['slug' => sanitize_title($name)]);
                    if (! is_wp_error($inserted) && isset($inserted['term_id'])) {
                        $new_entry['term_id'] = intval($inserted['term_id']);
                        if ($image_id) update_term_meta($new_entry['term_id'], 'image_id', $image_id);
                        if (!empty($image_url)) update_term_meta($new_entry['term_id'], 'image_url', $image_url);
                        // Bandera de todos
                        $allIds = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false, 'fields' => 'ids']);
                        if (is_array($allIds) && !array_diff(array_map('intval', $allIds), $servicesIds)) {
                            update_term_meta($new_entry['term_id'], 'servicios_all', '1');
                        } else {
                            delete_term_meta($new_entry['term_id'], 'servicios_all');
                        }
                        update_term_meta($new_entry['term_id'], 'servicios', $servicesIds);
                        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
                            error_log('[Barberos][Handler] Create guardado term_id=' . $new_entry['term_id'] . ' services=' . wp_json_encode($servicesIds));
                        }
                    }
                } else {
                    $term_id = is_array($existing) ? intval($existing['term_id']) : intval($existing);
                    $new_entry['term_id'] = $term_id;
                    if ($image_id) update_term_meta($term_id, 'image_id', $image_id);
                    if (!empty($image_url)) update_term_meta($term_id, 'image_url', $image_url);
                    // Reflejar también en la opción
                    $new_entry['image_id'] = intval($image_id);
                    $new_entry['image_url'] = is_string($image_url) ? $image_url : '';
                    $allIds = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false, 'fields' => 'ids']);
                    if (is_array($allIds) && !array_diff(array_map('intval', $allIds), $servicesIds)) {
                        update_term_meta($term_id, 'servicios_all', '1');
                    } else {
                        delete_term_meta($term_id, 'servicios_all');
                    }
                    update_term_meta($term_id, 'servicios', $servicesIds);
                    if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
                        error_log('[Barberos][Handler] Link existente term_id=' . $term_id . ' services=' . wp_json_encode($servicesIds));
                    }
                }

                $barberos[] = $new_entry;
            }

            update_option($this->optionKey, array_values($barberos));
        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('[Barberos][Handler] Option guardada: total=' . count($barberos));
        }
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
        $image_url = '';
        if ($image_id) {
            $image_url = wp_get_attachment_image_url($image_id, 'thumbnail');
        } else {
            $meta_url = get_term_meta($term->term_id, 'image_url', true);
            if (!empty($meta_url)) {
                $image_url = esc_url_raw($meta_url);
            }
        }
        $services_ids = get_term_meta($term->term_id, 'servicios', true);
        if (!is_array($services_ids)) {
            // Fallback: intentar recuperar desde options (para barberos antiguos)
            $services_ids = [];
            $barberos = get_option('barberia_barberos', []);
            $servicios_terms = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
            $nombre_to_id = [];
            if (!is_wp_error($servicios_terms)) {
                foreach ($servicios_terms as $st) {
                    $nombre_to_id[strtolower(trim($st->name))] = intval($st->term_id);
                }
            }
            foreach ($barberos as $b) {
                $matches = false;
                if (!empty($b['term_id']) && intval($b['term_id']) === $term->term_id) $matches = true;
                if (!$matches && !empty($b['name']) && strcasecmp(trim($b['name']), trim($term->name)) === 0) $matches = true;
                if ($matches) {
                    if (!empty($b['services_ids']) && is_array($b['services_ids'])) {
                        $services_ids = array_map('intval', $b['services_ids']);
                    } elseif (!empty($b['services'])) {
                        $names = is_array($b['services']) ? $b['services'] : array_filter(array_map('trim', explode(',', $b['services'])));
                        foreach ($names as $n) {
                            $key = strtolower(trim($n));
                            if (isset($nombre_to_id[$key])) $services_ids[] = $nombre_to_id[$key];
                        }
                    }
                    break;
                }
            }
        }

        $allFlag = get_term_meta($term->term_id, 'servicios_all', true) === '1';
        $data = [
            'name' => $term->name,
            'term_id' => $term->term_id,
            'image_id' => [
                'id' => $image_id,
                'url' => $image_url,
            ],
            'services[]' => is_array($services_ids) ? $services_ids : [],
            'services_all' => $allFlag ? '1' : '0',
        ];

        wp_send_json_success($data);
    }
}
