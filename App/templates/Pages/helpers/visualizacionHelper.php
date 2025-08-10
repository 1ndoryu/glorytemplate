<?php 

use Glory\Manager\OpcionManager;
use Glory\Core\OpcionRepository;
use Glory\Core\OpcionRegistry;


/**
 * Registra dinámicamente opciones de color para cada término de la taxonomía 'servicio'.
 * - Si ya existe la opción para un slug, no hace nada (evita duplicados).
 * - Para slugs desconocidos usa un color gris por defecto.
 */
function registrarOpcionesColoresServiciosDinamico(): void
{
    $seccionScheduler = 'scheduler';
    $etiquetaSeccionScheduler = 'Configuración del Calendario';
    $subSeccionColores = 'colores_servicios';

    // Asegurar clave 'default'
    if (!OpcionRegistry::getDefinicion('glory_scheduler_color_default')) {
        OpcionManager::register('glory_scheduler_color_default', [
            'valorDefault'    => '#9E9E9E',
            'tipo'            => 'color',
            'etiqueta'        => 'Color por Defecto',
            'descripcion'     => 'Color por defecto para servicios sin color asignado.',
            'seccion'         => $seccionScheduler,
            'etiquetaSeccion' => $etiquetaSeccionScheduler,
            'subSeccion'      => $subSeccionColores,
        ]);
    }

    // Mapeo de colores sugeridos por categorías (según el documento del proyecto)
    $categorias = [
        '#8BC34A' => [
            'corte-de-pelo', 'corte-extra-degradado', 'arreglo-de-cuello', 'corte-al-cero', 'lavar', 'lavar-y-peinar'
        ],
        '#FF9800' => [
            'arreglo-y-perfilado-de-barba', 'arreglo-de-barba'
        ],
        '#F44336' => [
            'corte-y-arreglo-de-barba', 'corte-y-afeitado'
        ],
        '#FFEB3B' => [
            'afeitado-de-barba', 'afeitado-de-cabeza'
        ],
        '#2196F3' => [
            'tinte-de-pelo', 'tinte-de-barba'
        ],
    ];

    $terminos = get_terms(['taxonomy' => 'servicio', 'hide_empty' => false]);
    if (is_wp_error($terminos) || empty($terminos)) {
        return;
    }

    foreach ($terminos as $term) {
        $slug = is_object($term) ? $term->slug : (string)$term;
        $key = 'glory_scheduler_color_' . str_replace('-', '_', $slug);

        // Evitar registrar si ya existe
        if (OpcionRegistry::getDefinicion($key)) {
            continue;
        }

        // Buscar color sugerido por categoría
        $defaultColor = '#9E9E9E';
        foreach ($categorias as $color => $slugs) {
            if (in_array($slug, $slugs, true)) {
                $defaultColor = $color;
                break;
            }
        }

        OpcionManager::register($key, [
            'valorDefault'    => $defaultColor,
            'tipo'            => 'color',
            'etiqueta'        => $term->name,
            'descripcion'     => 'Selecciona el color para el servicio ' . $term->name . ' en el calendario.',
            'seccion'         => $seccionScheduler,
            'etiquetaSeccion' => $etiquetaSeccionScheduler,
            'subSeccion'      => $subSeccionColores,
        ]);
    }
}

/**
 * Maneja el guardado de colores si viene por POST.
 * Imprime una notice con la cantidad guardada.
 */
function guardarColoresSiPost()
{
    if (!isset($_POST['accion']) || $_POST['accion'] !== 'guardar_colores_scheduler') {
        return;
    }
    if (!current_user_can('manage_options') || !check_admin_referer('guardar_colores_scheduler')) {
        return;
    }

    $coloresPost = isset($_POST['colores']) && is_array($_POST['colores']) ? $_POST['colores'] : [];
    $guardados = 0;
    foreach ($coloresPost as $key => $valor) {
        $key = sanitize_key($key);
        if (strpos($key, 'glory_scheduler_color_') !== 0) {
            continue;
        }
        $color = sanitize_hex_color($valor);
        if (!$color) {
            continue;
        }
        if (OpcionRepository::save($key, $color)) {
            $guardados++;
        }
    }
    echo '<div class="notice notice-success"><p>' . esc_html($guardados) . ' color(es) actualizado(s).</p></div>';
}

function obtenerFechaSeleccionada()
{
    return isset($_GET['fecha_visualizacion']) && !empty($_GET['fecha_visualizacion']) ? sanitize_text_field($_GET['fecha_visualizacion']) : date('Y-m-d');
}

function renderizarFormularioFecha(string $fecha)
{
    ?>
    <form method="get" class="formDatepicker">
        <input type="hidden" name="page" value="<?php echo esc_attr($_REQUEST['page']); ?>">
        <input type="date" id="fecha_visualizacion" name="fecha_visualizacion" value="<?php echo esc_attr($fecha); ?>">
        <button type="submit" class="button"><?php echo esc_html('Ver Fecha'); ?></button>
    </form>
    <?php
}

function renderizarConfiguradorColores(array $definiciones)
{
    ?>
    

    <form method="post" id="formConfigColores" class="form-config-colores" style="margin-bottom: 20px;">
        <?php wp_nonce_field('guardar_colores_scheduler'); ?>
        <input type="hidden" name="accion" value="guardar_colores_scheduler">

        <div class="grid-colores">
            <?php foreach ($definiciones as $key => $def):
                if (strpos($key, 'glory_scheduler_color_') !== 0) {
                    continue;
                }
                $label = $def['etiqueta'] ?? $key;
                $default = $def['valorDefault'] ?? '#6c757d';
                $valorActual = OpcionManager::get($key);
                if (empty($valorActual)) {
                    $valorActual = $default;
                }
            ?>
                <label class="color-item">
                    <span class="color-label"><?php echo esc_html($label); ?></span>
                    <input type="color" name="colores[<?php echo esc_attr($key); ?>]" value="<?php echo esc_attr($valorActual); ?>">
                </label>
            <?php endforeach; ?>
        </div>

        <div class="form-actions">
            <button type="submit" class="button button-primary"><?php echo esc_html('Guardar colores'); ?></button>
        </div>
    </form>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var boton = document.getElementById('toggleConfigColores');
        var form = document.getElementById('formConfigColores');
        if (boton && form) {
            boton.addEventListener('click', function() {
                form.classList.toggle('is-visible');
            });
        }
    });
    </script>
    <?php
}

function renderizarScriptNavegacionFecha()
{
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var inputFecha = document.getElementById('fecha_visualizacion');
        var form = document.querySelector('.formDatepicker');
        var btnPrev = document.getElementById('diaAnteriorBtn');
        var btnNext = document.getElementById('diaSiguienteBtn');

        function cambiarDia(offset) {
            if (!inputFecha || !form) return;
            var fechaActual = new Date(inputFecha.value + 'T00:00:00');
            if (isNaN(fechaActual.getTime())) {
                fechaActual = new Date();
            }
            fechaActual.setDate(fechaActual.getDate() + offset);
            var y = fechaActual.getFullYear();
            var m = ('0' + (fechaActual.getMonth() + 1)).slice(-2);
            var d = ('0' + fechaActual.getDate()).slice(-2);
            inputFecha.value = y + '-' + m + '-' + d;
            form.submit();
        }

        if (btnPrev) btnPrev.addEventListener('click', function() { cambiarDia(-1); });
        if (btnNext) btnNext.addEventListener('click', function() { cambiarDia(1); });
    });
    </script>
    <?php
}

function obtenerRecursos(): array
{
    $barberos_terms = get_terms(['taxonomy' => 'barbero', 'hide_empty' => false]);
    $recursos = [];
    if (!is_wp_error($barberos_terms) && !empty($barberos_terms)) {
        $recursos = wp_list_pluck($barberos_terms, 'name');
    }
    return $recursos;
}

function obtenerEventosPorFecha(string $fecha): array
{
    $consultaReservas = new WP_Query([
        'post_type' => 'reserva',
        'posts_per_page' => -1,
        'meta_query' => [
            [
                'key' => 'fecha_reserva',
                'value' => $fecha,
                'compare' => '='
            ]
        ]
    ]);

    $eventos = [];
    if ($consultaReservas->have_posts()) {
        while ($consultaReservas->have_posts()) {
            $consultaReservas->the_post();
            $post_id = get_the_ID();
            $hora_inicio = get_post_meta($post_id, 'hora_reserva', true);
            if (!$hora_inicio) {
                continue;
            }

            $servicios = get_the_terms($post_id, 'servicio');
            $duracion = 30;
            $tipo_servicio_slug = 'default';
            $servicio_nombre = 'Servicio no especificado';

            if (!is_wp_error($servicios) && !empty($servicios)) {
                $primer_servicio = $servicios[0];
                $tipo_servicio_slug = $primer_servicio->slug;
                $servicio_nombre = $primer_servicio->name;
                $duracion_meta = get_term_meta($primer_servicio->term_id, 'duracion', true);
                if (is_numeric($duracion_meta) && $duracion_meta > 0) {
                    $duracion = (int)$duracion_meta;
                }
            }

            $barberos = get_the_terms($post_id, 'barbero');
            $nombre_barbero = (!is_wp_error($barberos) && !empty($barberos)) ? $barberos[0]->name : 'Sin asignar';
            $exclusividad = get_post_meta($post_id, 'exclusividad', true);
            $telefono_cliente = get_post_meta($post_id, 'telefono_cliente', true);

            try {
                $inicio_dt = new DateTime($hora_inicio);
                $fin_dt = clone $inicio_dt;
                $fin_dt->add(new DateInterval("PT{$duracion}M"));

                $eventos[] = [
                    'titulo' => get_the_title(),
                    'detalle' => $servicio_nombre,
                    'telefono' => $telefono_cliente,
                    'horaInicio' => $inicio_dt->format('H:i'),
                    'horaFin' => $fin_dt->format('H:i'),
                    'recurso' => $nombre_barbero,
                    'tipoServicio' => $tipo_servicio_slug,
                    'exclusividad' => ($exclusividad === '1'),
                ];
            } catch (Exception $e) {
                error_log('Error al procesar fecha de reserva para el post ID ' . $post_id . ': ' . $e->getMessage());
            }
        }
    }
    wp_reset_postdata();
    return $eventos;
}

function construirMapaColores(array $definiciones): array
{
    $mapeoColores = [];
    foreach ($definiciones as $key => $def) {
        if (strpos($key, 'glory_scheduler_color_') !== 0) {
            continue;
        }
        $slugKey = substr($key, strlen('glory_scheduler_color_'));
        $slug = str_replace('_', '-', $slugKey);
        $valor = OpcionManager::get($key);
        if (empty($valor)) {
            $valor = $def['valorDefault'] ?? '#6c757d';
        }
        $mapeoColores[$slug] = $valor;
    }
    if (!isset($mapeoColores['default'])) {
        $mapeoColores['default'] = '#6c757d';
    }
    return $mapeoColores;
}

function asegurarSinAsignar(array &$recursos, array $eventos)
{
    $haySinAsignar = array_reduce($eventos, function($acc, $ev) { return $acc || ($ev['recurso'] === 'Sin asignar'); }, false);
    if ($haySinAsignar && !in_array('Sin asignar', $recursos, true)) {
        array_unshift($recursos, 'Sin asignar');
    }
}