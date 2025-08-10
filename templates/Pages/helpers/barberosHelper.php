<?php
if (! defined('ABSPATH')) {
    exit;
}

use Glory\Components\FormularioFluente;
use Glory\Components\FormBuilder;
use Glory\Components\Modal;
use App\Handler\Form\BarberoHandler;

/**
 * Procesa el POST del formulario de barberos: crear/editar/eliminar y redirige.
 * @param string $option_key
 * @return void
 */
function processBarberosPost(string $option_key): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ! isset($_POST['barberos_nonce']) || ! wp_verify_nonce($_POST['barberos_nonce'], 'barberos_save')) {
        return;
    }

    $handler = new BarberoHandler($option_key);
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
function getBarberosData(string $option_key): array
{
    $terminos = get_terms(['taxonomy' => 'barbero', 'hide_empty' => false]);
    $servicios_terms = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
    $opcionesServicios = [];
    $servicios_map_id_to_name = [];
    foreach ($servicios_terms as $st) {
        $opcionesServicios[intval($st->term_id)] = $st->name;
        $servicios_map_id_to_name[intval($st->term_id)] = $st->name;
    }

    $barberos_from_terms = [];
    if (! is_wp_error($terminos)) {
        foreach ($terminos as $term) {
            $barberos_from_terms[] = [
                'name' => $term->name,
                'term_id' => intval($term->term_id),
                'image_id' => intval(get_term_meta($term->term_id, 'image_id', true)),
                'services' => [],
            ];
        }
    }

    $barberos_options = get_option($option_key, []);
    $barberos_merged = $barberos_from_terms;
    if (! empty($barberos_options)) {
        foreach ($barberos_options as $opt) {
            $services_ids = [];
            $services_names = [];
            if (! empty($opt['services'])) {
                if (is_array($opt['services'])) {
                    foreach ($opt['services'] as $s) {
                        foreach ($opcionesServicios as $sid => $sname) {
                            if (strcasecmp(trim($sname), trim($s)) === 0) {
                                $services_ids[] = $sid;
                                $services_names[] = $sname;
                                break;
                            }
                        }
                    }
                } else {
                    $parts = array_filter(array_map('trim', explode(',', $opt['services'])));
                    foreach ($parts as $p) {
                        foreach ($opcionesServicios as $sid => $sname) {
                            if (strcasecmp(trim($sname), trim($p)) === 0) {
                                $services_ids[] = $sid;
                                $services_names[] = $sname;
                                break;
                            }
                        }
                    }
                }
            }

            $opt['services_ids'] = $services_ids;
            if (empty($opt['services']) && ! empty($services_ids)) {
                $opt['services'] = array_map(function ($id) use ($servicios_map_id_to_name) {
                    return $servicios_map_id_to_name[$id] ?? '';
                }, $services_ids);
            }

            $exists = false;
            if (! empty($opt['term_id'])) {
                foreach ($barberos_merged as $m) {
                    if (! empty($m['term_id']) && intval($m['term_id']) === intval($opt['term_id'])) {
                        $exists = true;
                        break;
                    }
                }
            }
            if (! $exists) {
                $barberos_merged[] = $opt;
            }
        }
    }

    return [$opcionesServicios, $barberos_merged, $servicios_map_id_to_name];
}

/**
 * Renderiza el modal de añadir/editar barbero y encola el JS necesario
 * @param array $opcionesServicios
 * @param array $barberos
 * @param string $action
 */
function renderModalBarbero(array $opcionesServicios, array $barberos, string $action)
{
    // Construir formulario con API fluente
    $config = [
        ['fn' => 'inicio', 'args' => [
            'action' => $action,
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
    $form_html = $form->renderizar();

    $contenido = wp_nonce_field('barberos_save','barberos_nonce', true, false) . '<input type="hidden" name="id" id="barbero-id" value="">' . $form_html;

    echo Modal::render('modalAnadirBarbero', 'Añadir/Editar Barbero', $contenido);

    // Inyectar JS que maneja la apertura del modal y la carga de datos
    ?>
    <script>
    (function(){
        document.addEventListener('gloryModal:open', function(e){
            var trigger = e.detail && e.detail.trigger;
            if (!trigger) return;
            var mode = trigger.dataset.formMode || trigger.getAttribute('data-form-mode') || 'create';
            var modal = document.getElementById(trigger.dataset.modal);
            if (!modal) return;
            var title = mode === 'edit' ? (trigger.dataset.modalTitleEdit || trigger.getAttribute('data-modal-title-edit')) : (trigger.dataset.modalTitleCreate || trigger.getAttribute('data-modal-title-create'));
            if (title) {
                var h2 = modal.querySelector('.modalContenido h2');
                if (h2) h2.textContent = title;
            }

            // rellenar campos si edit
            var form = modal.querySelector('.formularioBarberia');
            if (!form) return;

            if (mode === 'edit') {
                var id = trigger.dataset.id || '';
                var name = trigger.dataset.name || '';
                var services = trigger.dataset.services || '';
                var imageId = trigger.dataset.imageId || '';
                var termId = trigger.dataset.termId || '';

                var elId = form.querySelector('#barbero-id'); if (elId) elId.value = id || termId || '';
                var elName = form.querySelector('[name="name"]'); if (elName) elName.value = name;

                var servicesList = services ? services.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
                var checkboxes = form.querySelectorAll('input[name="services[]"]');
                checkboxes.forEach(function(ch){ ch.checked = servicesList.length === 0 ? true : (servicesList.indexOf(ch.value) !== -1); });

                var hiddenImage = form.querySelector('.glory-image-id'); if (hiddenImage) hiddenImage.value = imageId;
                var imagePreview = form.querySelector('.image-preview');
                if (imagePreview) {
                    if (imageId && (trigger.dataset.imageUrl || trigger.getAttribute('data-image-url'))) {
                        var imgUrl = trigger.dataset.imageUrl || trigger.getAttribute('data-image-url');
                        imagePreview.innerHTML = '<img src="' + imgUrl + '" alt="Previsualización">';
                    } else if (imageId) {
                        imagePreview.innerHTML = '<img alt="Previsualización">';
                    } else {
                        var placeholderText = imagePreview.getAttribute('data-placeholder') || '';
                        imagePreview.innerHTML = '<span class="image-preview-placeholder">' + placeholderText + '</span>';
                    }
                }

                var removeBtn = form.querySelector('.glory-remove-image-button'); if (removeBtn) removeBtn.style.display = imageId ? '' : 'none';
            } else {
                form.querySelectorAll('input[type="text"]').forEach(function(i){ i.value = ''; });
                form.querySelectorAll('input[name="services[]"]').forEach(function(ch){ ch.checked = true; });
                var hid = form.querySelector('#barbero-id'); if (hid) hid.value = '';
                var hiddenImage = form.querySelector('.glory-image-id'); if (hiddenImage) hiddenImage.value = '';
                var imagePreview = form.querySelector('.image-preview'); if (imagePreview) imagePreview.innerHTML = '<span class="image-preview-placeholder">' + (imagePreview.getAttribute('data-placeholder')||'Haz clic para subir una imagen') + '</span>';
                var removeBtn = form.querySelector('.glory-remove-image-button'); if (removeBtn) removeBtn.style.display = 'none';
            }
        });

        // Inicializar uploader WP usando delegación si WP.media está disponible
        document.addEventListener('click', function(ev){
            var but = ev.target.closest('.glory-upload-image-button');
            if (!but) return;
            ev.preventDefault();
            var uploaderContainer = but.closest('.glory-image-uploader');

            if (typeof wp === 'undefined' || !wp.media) {
                alert('El cargador de medios no está disponible. Asegúrate de llamar a wp_enqueue_media().');
                return;
            }

            var frame = wp.media.frames.file_frame = wp.media({
                title: 'Seleccionar una Imagen',
                button: { text: 'Usar esta imagen' },
                multiple: false
            });

            frame.on('select', function(){
                var attachment = frame.state().get('selection').first().toJSON();
                var previewUrl = attachment.sizes && attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url;
                if (uploaderContainer) {
                    var hidden = uploaderContainer.querySelector('.glory-image-id'); if (hidden) hidden.value = attachment.id;
                    var preview = uploaderContainer.querySelector('.image-preview'); if (preview) preview.innerHTML = '<img src="' + previewUrl + '" alt="Previsualización">';
                    var rem = uploaderContainer.querySelector('.glory-remove-image-button'); if (rem) rem.style.display = '';
                }
            });

            frame.open();
        });

        document.addEventListener('click', function(ev){
            var but = ev.target.closest('.glory-remove-image-button');
            if (!but) return;
            ev.preventDefault();
            var uploaderContainer = but.closest('.glory-image-uploader');
            if (uploaderContainer) {
                var hidden = uploaderContainer.querySelector('.glory-image-id'); if (hidden) hidden.value = '';
                var preview = uploaderContainer.querySelector('.image-preview'); if (preview) preview.innerHTML = '<span class="image-preview-placeholder">' + (preview.getAttribute('data-placeholder')||'Haz clic para subir una imagen') + '</span>';
                but.style.display = 'none';
            }
        });
    })();
    </script>
    <?php
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
                $index = isset($b['index']) ? $b['index'] : (isset($b['term_id']) ? intval($b['term_id']) : '');
                $row_image_url = !empty($b['image_id']) ? wp_get_attachment_image_url(intval($b['image_id']), 'thumbnail') : '';
                $data_services_attr = '';
                if (!empty($b['services_ids'])) {
                    $data_services_attr = implode(',', array_map('intval', $b['services_ids']));
                } elseif (!empty($b['services']) && is_array($b['services'])) {
                    $ids = [];
                    foreach ($b['services'] as $sname) {
                        foreach ($opcionesServicios as $sid => $sna) {
                            if (strcasecmp($sna, $sname) === 0) {
                                $ids[] = $sid;
                                break;
                            }
                        }
                    }
                    $data_services_attr = implode(',', $ids);
                }

                $nonce = wp_nonce_field('barberos_save', 'barberos_nonce', true, false);

                // Icono editar (abre modal)
                $edit = '<a href="#" class="openModal" data-modal="modalAnadirBarbero" data-form-mode="edit" data-id="' . esc_attr($index) . '" data-name="' . esc_attr($b['name'] ?? '') . '" data-services="' . esc_attr($data_services_attr) . '" data-image-id="' . intval($b['image_id'] ?? 0) . '" data-image-url="' . esc_attr($row_image_url) . '" data-term-id="' . intval($b['term_id'] ?? 0) . '" data-modal-title-edit="' . esc_attr('Editar Barbero') . '" title="' . esc_attr('Editar') . '"><span class="dashicons dashicons-edit"></span></a>';

                // Icono eliminar (form POST con nonce)
                $form = '<form method="post" style="display:inline">' . $nonce . '<input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="' . esc_attr($index) . '"><button class="button-link" type="submit" onclick="return confirm(' . json_encode('¿Estás seguro de que quieres eliminar este barbero?') . ');" title="' . esc_attr('Eliminar') . '"><span class="dashicons dashicons-trash"></span></button></form>';

                return $edit . ' ' . $form;
            }],
        ],
        'paginacion' => false,
        'allowed_html' => [
            'a' => ['href' => true, 'class' => true, 'data-modal' => true, 'data-id' => true, 'data-form-mode' => true, 'data-image-url' => true, 'data-image-id' => true, 'data-services' => true, 'data-term-id' => true, 'data-modal-title-edit' => true, 'title' => true],
            'img' => ['src' => true, 'alt' => true, 'width' => true, 'height' => true, 'class' => true],
            'input' => ['type' => true, 'name' => true, 'value' => true],
            'form' => ['method' => true, 'style' => true],
            'button' => ['type' => true, 'class' => true, 'onclick' => true, 'title' => true],
            'span' => ['class' => true],
        ],
    ];
}

?>


