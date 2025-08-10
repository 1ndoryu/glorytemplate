<?php
if (! defined('ABSPATH')) {
    exit;
}

use Glory\Components\FormularioFluente;
use Glory\Components\Modal;
use App\Handler\Form\BarberoHandler;

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

    $barberosDesdeTerminos = [];
    if (! is_wp_error($terminos)) {
        foreach ($terminos as $term) {
            $barberosDesdeTerminos[] = [
                'name' => $term->name,
                'term_id' => intval($term->term_id),
                'image_id' => intval(get_term_meta($term->term_id, 'image_id', true)),
                'services' => [],
            ];
        }
    }

    $barberos_options = get_option($claveOpcion, []);
    $barberosCombinados = $barberosDesdeTerminos;
    if (! empty($barberos_options)) {
        foreach ($barberos_options as $opt) {
            $servicesIds = [];
            $servicesNames = [];
            if (! empty($opt['services'])) {
                if (is_array($opt['services'])) {
                    foreach ($opt['services'] as $s) {
                        foreach ($opcionesServicios as $sid => $sname) {
                            if (strcasecmp(trim($sname), trim($s)) === 0) {
                                $servicesIds[] = $sid;
                                $servicesNames[] = $sname;
                                break;
                            }
                        }
                    }
                } else {
                    $parts = array_filter(array_map('trim', explode(',', $opt['services'])));
                    foreach ($parts as $p) {
                        foreach ($opcionesServicios as $sid => $sname) {
                            if (strcasecmp(trim($sname), trim($p)) === 0) {
                                $servicesIds[] = $sid;
                                $servicesNames[] = $sname;
                                break;
                            }
                        }
                    }
                }
            }

            $opt['services_ids'] = $servicesIds;
            if (empty($opt['services']) && ! empty($servicesIds)) {
                $opt['services'] = array_map(function ($id) use ($serviciosMapIdANombre) {
                    return $serviciosMapIdANombre[$id] ?? '';
                }, $servicesIds);
            }

            $exists = false;
            if (! empty($opt['term_id'])) {
                foreach ($barberosCombinados as $m) {
                    if (! empty($m['term_id']) && intval($m['term_id']) === intval($opt['term_id'])) {
                        $exists = true;
                        break;
                    }
                }
            }
            if (! $exists) {
                $barberosCombinados[] = $opt;
            }
        }
    }

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
            'extraClass' => 'formularioBarberia',
            'atributos' => [
                // Habilita el submit cuando el campo 'name' (nombre del barbero) esté presente
                'data-fm-submit-enable-when' => 'name',
            ],
        ]],
        ['fn' => 'campoTexto', 'args' => ['nombre' => 'name', 'label' => 'Nombre', 'obligatorio' => true, 'classContainer' => 'name-field']],
        ['fn' => 'campoCheckboxGrupo', 'args' => ['nombre' => 'services[]', 'label' => 'Servicios', 'opciones' => $opcionesServicios , 'valor' => array_keys($opcionesServicios), 'classContainer' => 'services-field']],
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
            ['etiqueta' => 'Servicios', 'clave' => 'services', 'callback' => function ($b) use ($servicios_map_id_to_name) {
                $services = [];
                if (!empty($b['services']) && is_array($b['services'])) {
                    $services = $b['services'];
                } elseif (!empty($b['services_ids']) && is_array($b['services_ids'])) {
                    $services = array_map(function ($id) use ($servicios_map_id_to_name) {
                        return $servicios_map_id_to_name[intval($id)] ?? '';
                    }, $b['services_ids']);
                }
                return esc_html(implode(', ', array_filter($services)));
            }],
            ['etiqueta' => 'Acciones', 'clave' => 'acciones', 'callback' => function ($b) use ($opcionesServicios) {
                $objectId = $b['term_id'] ?? ($b['id'] ?? null);
                if (!$objectId) return '';

                $nonce = wp_nonce_field('barberos_save', 'barberos_nonce', true, false);

                // Icono editar (abre modal)
                $edit = '<a href="#" class="openModal"'
                    . ' data-modal="modalAnadirBarbero"'
                    . ' data-form-mode="edit"'
                    . ' data-object-id="' . esc_attr($objectId) . '"'
                    . ' data-fetch-action="glory_get_barbero_details"'
                    . ' data-submit-action="actualizarBarbero"'
                    . ' data-submit-text="Guardar Cambios"'
                    . ' data-modal-title-edit="' . esc_attr('Editar Barbero') . '"'
                    . ' title="' . esc_attr('Editar') . '"><span class="dashicons dashicons-edit"></span></a>';

                // Icono eliminar (form POST con nonce)
                $formAction = admin_url('admin-post.php');
                $form = '<form method="post" action="' . esc_attr($formAction) . '" style="display:inline">'
                    . $nonce
                    . '<input type="hidden" name="action" value="glory_delete_barbero">'
                    . '<input type="hidden" name="term_id" value="' . esc_attr($objectId) . '">'
                    . '<button class="button-link" type="submit" onclick="return confirm(' . json_encode('¿Estás seguro de que quieres eliminar este barbero?') . ');" title="' . esc_attr('Eliminar') . '">'
                    . '<span class="dashicons dashicons-trash"></span></button></form>';

                return $edit . ' ' . $form;
            }],
        ],
        'paginacion' => false,
        'allowed_html' => [
            'a' => ['href' => true, 'class' => true, 'data-modal' => true, 'data-form-mode' => true, 'data-object-id' => true, 'data-fetch-action' => true, 'data-submit-action' => true, 'data-submit-text' => true, 'data-modal-title-edit' => true, 'title' => true],
            'img' => ['src' => true, 'alt' => true, 'width' => true, 'height' => true, 'class' => true],
            'input' => ['type' => true, 'name' => true, 'value' => true],
            'form' => ['method' => true, 'style' => true, 'action' => true],
            'button' => ['type' => true, 'class' => true, 'onclick' => true, 'title' => true],
            'span' => ['class' => true],
        ],
    ];
}

?>


