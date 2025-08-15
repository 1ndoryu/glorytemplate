<?php
if (! defined('ABSPATH')) {
    exit;
}

use Glory\Components\FormularioFluente;
use Glory\Components\Modal;
use App\Handler\Form\BarberoHandler;

if (!function_exists('logBarberosDebug')) {
    function logBarberosDebug(string $mensaje, $data = null): void
    {
        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            $prefix = '[Barberos] ';
            if ($data !== null) {
                // wp_json_encode maneja arrays y objetos de forma segura
                # error_log($prefix . $mensaje . ' ' . wp_json_encode($data));
            } else {
                # error_log($prefix . $mensaje);
            }
        }
    }
}

/**
 * Procesa el POST del formulario de barberos: crear/editar/eliminar y redirige.
 * @param string $option_key
 * @return void
 */
function procesarPostBarberos(string $claveOpcion): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ! isset($_POST['barberos_nonce']) || ! wp_verify_nonce($_POST['barberos_nonce'], 'barberos_save')) {
        return;
    }

    $handler = new BarberoHandler($claveOpcion);
    try {
        $result = $handler->procesar($_POST, $_FILES);
        if (isset($result['alert'])) {
            // Puedes mostrar un mensaje de éxito si es necesario
        }
    } catch (\Exception $e) {
        // Puedes manejar errores aquí, por ejemplo, mostrando un mensaje al usuario
        error_log($e->getMessage());
    }

    wp_redirect(admin_url('admin.php?page=barberia-barberos'));
    exit;
}


/**
 * Obtiene y normaliza la lista de barberos y opciones de servicios.
 * @param string $option_key
 * @return array [opcionesServicios, barberos_merged, servicios_map_id_to_name]
 */
function obtenerDatosBarberos(string $claveOpcion): array
{
    $terminos = get_terms(['taxonomy' => 'barbero', 'hide_empty' => false]);
    $servicios_terms = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
    $opcionesServicios = [];
    $serviciosMapIdANombre = [];
    foreach ($servicios_terms as $st) {
        $opcionesServicios[intval($st->term_id)] = $st->name;
        $serviciosMapIdANombre[intval($st->term_id)] = $st->name;
    }

    // Log servicios disponibles
    logBarberosDebug('Servicios disponibles', $opcionesServicios);

    $barberosDesdeTerminos = [];
    if (! is_wp_error($terminos)) {
        foreach ($terminos as $term) {
            $services_ids_meta = get_term_meta($term->term_id, 'servicios', true);
            $services_ids_meta = is_array($services_ids_meta) ? array_map('intval', $services_ids_meta) : [];
            $services_names_meta = array_map(function ($id) use ($serviciosMapIdANombre) {
                return $serviciosMapIdANombre[intval($id)] ?? '';
            }, $services_ids_meta);

            $barberosDesdeTerminos[] = [
                'name' => $term->name,
                'term_id' => intval($term->term_id),
                'image_id' => intval(get_term_meta($term->term_id, 'image_id', true)),
                'services' => array_values(array_filter($services_names_meta)),
                'services_ids' => $services_ids_meta,
            ];
        }
    }

    logBarberosDebug('Barberos desde términos', $barberosDesdeTerminos);

    $barberos_options = get_option($claveOpcion, []);
    logBarberosDebug('Barberos desde options (resumen)', ['count' => is_array($barberos_options) ? count($barberos_options) : 0]);
    $barberosCombinados = $barberosDesdeTerminos;
    if (! empty($barberos_options)) {
        foreach ($barberos_options as $opt) {
            $barberoActual = $opt; // Trabajar con una copia para evitar problemas de referencia

            $servicesIds = [];
            $servicesNames = [];
            // Priorizar 'services_ids' si viene desde opciones
            if (!empty($barberoActual['services_ids']) && is_array($barberoActual['services_ids'])) {
                $servicesIds = array_map('intval', $barberoActual['services_ids']);
            } elseif (!empty($barberoActual['term_id'])) {
                // Si no, intentar desde meta del término
                $meta_ids = get_term_meta(intval($barberoActual['term_id']), 'servicios', true);
                if (is_array($meta_ids)) {
                    $servicesIds = array_map('intval', $meta_ids);
                }
            }
            // Si aún vacío, intentar mapear por nombres
            if (empty($servicesIds) && ! empty($barberoActual['services'])) {
                if (is_array($barberoActual['services'])) {
                    foreach ($barberoActual['services'] as $s) {
                        foreach ($opcionesServicios as $sid => $sname) {
                            if (strcasecmp(trim($sname), trim($s)) === 0) {
                                $servicesIds[] = intval($sid);
                                break;
                            }
                        }
                    }
                } else {
                    $parts = array_filter(array_map('trim', explode(',', $barberoActual['services'])));
                    foreach ($parts as $p) {
                        foreach ($opcionesServicios as $sid => $sname) {
                            if (strcasecmp(trim($sname), trim($p)) === 0) {
                                $servicesIds[] = intval($sid);
                                break;
                            }
                        }
                    }
                }
            }

            $servicesIds = array_values(array_unique(array_filter($servicesIds)));
            $barberoActual['services_ids'] = $servicesIds;
            $barberoActual['services'] = array_map(function ($id) use ($serviciosMapIdANombre) {
                return $serviciosMapIdANombre[intval($id)] ?? '';
            }, $servicesIds);

            $merged = false;
            if (! empty($barberoActual['term_id'])) {
                foreach ($barberosCombinados as $idx => $m) {
                    if (! empty($m['term_id']) && intval($m['term_id']) === intval($barberoActual['term_id'])) {
                        // Fusionar datos de servicios e imagen en la entrada existente del término
                        $barberosCombinados[$idx]['services_ids'] = $barberoActual['services_ids'];
                        $barberosCombinados[$idx]['services'] = $barberoActual['services'];
                        if (!empty($barberoActual['image_id'])) {
                            $barberosCombinados[$idx]['image_id'] = intval($barberoActual['image_id']);
                        }
                        $merged = true;
                        break;
                    }
                }
            }
            if (! $merged) {
                $barberosCombinados[] = $barberoActual;
            }
        }
    }

    logBarberosDebug('Barberos combinados (previo a render)', $barberosCombinados);

    return [$opcionesServicios, $barberosCombinados, $serviciosMapIdANombre];
}

/**
 * Renderiza el modal de añadir/editar barbero y encola el JS necesario
 * @param array $opcionesServicios
 * @param array $barberos
 * @param string $action
 */
function renderizarModalBarbero(array $opcionesServicios, array $barberos, string $accion)
{
    // Construir formulario con API fluente
    $config = [
        ['fn' => 'inicio', 'args' => [
            'action' => $accion,
            'method' => 'post',
            'extraClass' => 'formularioBarberia formularioBarberos',
            'atributos' => [
                // Habilita el submit cuando el campo 'name' (nombre del barbero) esté presente
                'data-fm-submit-habilitar-cuando' => 'name',
            ],
        ]],
        ['fn' => 'campoTexto', 'args' => ['nombre' => 'name', 'label' => 'Nombre', 'obligatorio' => true, 'classContainer' => 'name-field']],
        // No marcar todos por defecto; se preselecciona en modo edición vía AJAX
        // Importante: usar unión "+" para NO reindexar keys numéricas (array_merge reindexa)
        ['fn' => 'campoCheckboxGrupo', 'args' => ['nombre' => 'services[]', 'label' => 'Servicios', 'opciones' => (['all' => 'Todos los servicios'] + $opcionesServicios) , 'valor' => [], 'classContainer' => 'services-field']],
        ['fn' => 'campoImagen', 'args' => ['nombre' => 'image_id', 'label' => 'Imagen', 'valor' => '', 'classContainer' => 'image-field']],
        ['fn' => 'botonEnviar', 'args' => ['accion' => 'barbero', 'texto' => 'Guardar', 'extraClass' => 'button-primary']],
        ['fn' => 'fin'],
    ];

    $form = (new FormularioFluente())->agregarDesdeConfig($config);
    $formHtml = $form->renderizar();

    $contenido = wp_nonce_field('barberos_save','barberos_nonce', true, false) . '<input type="hidden" name="term_id" value="">' . $formHtml;

    echo Modal::render('modalAnadirBarbero', 'Añadir/Editar Barbero', $contenido);
}

/**
 * Configuración de columnas para el listado de barberos.
 *
 * @param array $opcionesServicios
 * @param array $servicios_map_id_to_name
 * @return array
 */
function columnasBarberos(array $opcionesServicios, array $servicios_map_id_to_name): array
{
    return [
        'columnas' => [
            ['etiqueta' => 'Imagen', 'clave' => 'image_id', 'callback' => function ($b) {
                $row_image_url = !empty($b['image_id']) ? wp_get_attachment_image_url(intval($b['image_id']), 'thumbnail') : '';
                if (! empty($b['image_id'])) {
                    return wp_get_attachment_image($b['image_id'], [80, 80]);
                }
                $barber_name_for_avatar = urlencode($b['name'] ?? 'Undefined');
                $avatar_url = "https://avatar.vercel.sh/{$barber_name_for_avatar}.svg?size=80&rounded=80";
                return '<img src="' . esc_url($avatar_url) . '" alt="' . esc_attr($b['name'] ?? '') . '" width="80" height="80" class="barbero-avatar-placeholder">';
            }],
            ['etiqueta' => 'Nombre', 'clave' => 'name'],
            ['etiqueta' => 'Servicios', 'clave' => 'services', 'callback' => function ($b) use ($servicios_map_id_to_name, $opcionesServicios) {
                /* Ver logger */
                logBarberosDebug('Render columna Servicios — entrada', $b);

                // 1) IDs tal cual
                $ids = [];
                if (!empty($b['services_ids']) && is_array($b['services_ids'])) {
                    $ids = array_map('intval', $b['services_ids']);
                }

                // 2) Convertir nombres → IDs cuando no existan IDs
                if (empty($ids) && !empty($b['services'])) {
                    $nombresServ = is_array($b['services']) ? array_values(array_filter(array_map('trim', $b['services']))) : array_filter(array_map('trim', explode(',', (string) $b['services'])));
                    foreach ($nombresServ as $nombreServ) {
                        foreach ($servicios_map_id_to_name as $sid => $sname) {
                            if (strcasecmp(trim($sname), trim($nombreServ)) === 0) {
                                $ids[] = intval($sid);
                                break;
                            }
                        }
                    }
                }

                $ids = array_values(array_unique(array_filter($ids, static fn($v) => (int)$v !== 0)));
                logBarberosDebug('Render columna Servicios — IDs normalizados', $ids);

                // Detectar "Todos los servicios"
                $allServiceIds = array_map('intval', array_keys($opcionesServicios));
                if (!empty($ids) && empty(array_diff($allServiceIds, $ids))) {
                    logBarberosDebug('Render columna Servicios — detectado TODOS', ['ids' => $ids]);
                    return esc_html('Todos los servicios');
                }

                // Mapear IDs a nombres
                $names = [];
                if (!empty($ids)) {
                    foreach ($ids as $id) {
                        if (isset($servicios_map_id_to_name[$id])) {
                            $names[] = $servicios_map_id_to_name[$id];
                        }
                    }
                }

                // Fallback: usar los nombres tal cual estaban en la entrada
                if (empty($names) && !empty($b['services'])) {
                    $names = is_array($b['services']) ? array_values(array_filter(array_map('trim', $b['services']))) : array_filter(array_map('trim', explode(',', (string) $b['services'])));
                }

                $names = array_values(array_filter($names));
                logBarberosDebug('Render columna Servicios — nombres a mostrar', $names);

                if (empty($names)) {
                    return '';
                }

                return esc_html(implode(', ', $names));
            }],
            ['etiqueta' => 'Acciones', 'clave' => 'acciones', 'callback' => function ($b) {
                $objectId = $b['term_id'] ?? ($b['id'] ?? null);
                if (!$objectId) return '';

                $menu_id = 'glory-submenu-barbero-' . intval($objectId);
                $trigger = '<a href="#" class="glory-submenu-trigger noAjax" data-submenu="' . esc_attr($menu_id) . '" aria-label="' . esc_attr__('Acciones', 'glorytemplate') . '">⋯</a>';

                $nonce = wp_nonce_field('barberos_save', 'barberos_nonce', true, false);
                $formAction = admin_url('admin-post.php');

                $menu  = '<div id="' . esc_attr($menu_id) . '" class="glory-submenu" style="display:none;flex-direction:column;">';
                $menu .= '<a href="#" class="openModal noAjax" data-modal="modalAnadirBarbero" data-form-mode="edit" data-fetch-action="glory_get_barbero_details" data-object-id="' . esc_attr($objectId) . '" data-submit-action="barbero" data-submit-text="Guardar Cambios" data-modal-title-edit="' . esc_attr('Editar Barbero') . '">' . esc_html__('Editar', 'glorytemplate') . '</a>';
                // En frontend: AJAX; en admin: fallback a admin-post
                $menu .= '<a href="#" class="noAjax js-eliminar-barbero" data-term-id="' . esc_attr($objectId) . '">' . esc_html__('Eliminar', 'glorytemplate') . '</a>';
                $menu .= '<form method="post" action="' . esc_attr($formAction) . '" style="display:none" class="glory-delete-barbero-fallback">'
                    . $nonce
                    . '<input type="hidden" name="action" value="glory_delete_barbero">'
                    . '<input type="hidden" name="term_id" value="' . esc_attr($objectId) . '">'
                    . '</form>';
                $menu .= '</div>';

                return $trigger . $menu;
            }],
        ],
        'seleccionMultiple' => true,
        'accionesMasivas' => [
            [
                'id' => 'eliminar',
                'etiqueta' => 'Eliminar',
                'ajax_action' => 'glory_eliminar_barberos',
                'confirmacion' => '¿Eliminar los barberos seleccionados?'
            ]
        ],
        'paginacion' => true,
        // Tamaño de página para arrays
        'per_page' => 20,
        'allowed_html' => [
            'a' => ['href' => true, 'class' => true, 'data-modal' => true, 'data-form-mode' => true, 'data-object-id' => true, 'data-fetch-action' => true, 'data-submit-action' => true, 'data-submit-text' => true, 'data-modal-title-edit' => true, 'title' => true, 'data-submenu' => true, 'data-posicion' => true, 'data-evento' => true, 'data-term-id' => true],
            'img' => ['src' => true, 'alt' => true, 'width' => true, 'height' => true, 'class' => true],
            'input' => ['type' => true, 'name' => true, 'value' => true],
            'form' => ['method' => true, 'style' => true, 'action' => true],
            'button' => ['type' => true, 'class' => true, 'onclick' => true, 'title' => true],
            'span' => ['class' => true],
            'div' => ['id' => true, 'class' => true, 'style' => true],
        ],
    ];
}

?>


