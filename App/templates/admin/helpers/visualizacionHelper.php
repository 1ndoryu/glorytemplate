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
        // Persistir default si no existe en BD (evita gris tras restablecer)
        $val = OpcionRepository::get('glory_scheduler_color_default');
        if ($val === OpcionRepository::getCentinela()) {
            OpcionRepository::save('glory_scheduler_color_default', '#9E9E9E');
        }
    }

    // Mapeo de colores sugeridos por categorías (según el documento del proyecto)
    $categorias = [
        '#8BC34A' => [
            'corte-de-pelo',
            'corte-extra-degradado',
            'arreglo-de-cuello',
            'corte-al-cero',
            'lavar',
            'lavar-y-peinar'
        ],
        '#FF9800' => [
            'arreglo-y-perfilado-de-barba',
            'arreglo-de-barba'
        ],
        '#F44336' => [
            'corte-y-arreglo-de-barba',
            'corte-y-afeitado'
        ],
        '#FFEB3B' => [
            'afeitado-de-barba',
            'afeitado-de-cabeza'
        ],
        '#2196F3' => [
            'tinte-de-pelo',
            'tinte-de-barba'
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
        // Persistir valor por defecto si no existe (evita gris hasta que el admin guarde manualmente)
        $actual = OpcionRepository::get($key);
        if ($actual === OpcionRepository::getCentinela()) {
            OpcionRepository::save($key, $defaultColor);
        }
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
        <?php if (isset($_REQUEST['page'])): ?>
        <input type="hidden" name="page" value="<?php echo esc_attr(sanitize_key($_REQUEST['page'])); ?>">
        <?php endif; ?>
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
            var contenedorPagina = document.querySelector('.wrap.paginaVisual');
            var esAdmin = window.location && window.location.pathname && window.location.pathname.indexOf('/wp-admin/') !== -1;

            function formatear(fecha) {
                var y = fecha.getFullYear();
                var m = ('0' + (fecha.getMonth() + 1)).slice(-2);
                var d = ('0' + fecha.getDate()).slice(-2);
                return y + '-' + m + '-' + d;
            }

            async function cargarScheduler(fechaStr) {
                if (!contenedorPagina) return;
                // Intentar usar gloryAjax si está disponible
                var usarGloryAjax = (typeof window.gloryAjax === 'function');
                try {
                    var resp;
                    if (usarGloryAjax) {
                        resp = await window.gloryAjax('glory_visualizacion_por_fecha', { fecha: fechaStr });
                    } else {
                        var params = new URLSearchParams({ action: 'glory_visualizacion_por_fecha', fecha: fechaStr });
                        var url = (typeof window.ajax_params !== 'undefined' && window.ajax_params.ajax_url) ? window.ajax_params.ajax_url : '/wp-admin/admin-ajax.php';
                        var r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
                        var t = await r.text();
                        try { resp = JSON.parse(t); } catch (e) { resp = { success: false, message: 'Respuesta no válida' }; }
                    }
                    if (resp && resp.success && resp.data && resp.data.html) {
                        // Reemplazar solo el contenedor del scheduler
                        var temp = document.createElement('div');
                        temp.innerHTML = resp.data.html;
                        var nuevo = temp.querySelector('.glorySchedulerContenedor');
                        var viejo = document.querySelector('.glorySchedulerContenedor');
                        if (nuevo && viejo && viejo.parentNode) {
                            viejo.parentNode.replaceChild(nuevo, viejo);
                        } else {
                            // Fallback: insertar completo
                            var existente = document.querySelector('.glorySchedulerContenedor');
                            if (existente) existente.outerHTML = resp.data.html; else contenedorPagina.insertAdjacentHTML('beforeend', resp.data.html);
                        }
                        // Actualizar input
                        if (inputFecha) inputFecha.value = fechaStr;
                        // Actualizar URL para permitir compartir/recargar misma fecha
                        try {
                            var url = new URL(window.location.href);
                            url.searchParams.set('fecha_visualizacion', fechaStr);
                            window.history.pushState({ path: url.href }, '', url.href);
                        } catch (e) {}
                        // Disparar evento de recarga para re-inicializaciones (pestañas, scheduler, verTodo, etc.)
                        // Retrasar ligeramente para asegurar layout aplicado y alturas correctas
                        try {
                            requestAnimationFrame(function(){
                                setTimeout(function(){
                                    var ev1 = new CustomEvent('gloryRecarga', { bubbles: true, cancelable: true });
                                    document.dispatchEvent(ev1);
                                }, 0);
                                // Disparo adicional tras un pequeño retraso para casos de fonts/layout tardíos
                                setTimeout(function(){
                                    var ev2 = new CustomEvent('gloryRecarga', { bubbles: true, cancelable: true });
                                    document.dispatchEvent(ev2);
                                }, 80);
                            });
                        } catch(e) {
                            var ev = new CustomEvent('gloryRecarga', { bubbles: true, cancelable: true });
                            document.dispatchEvent(ev);
                        }
                        return true;
                    }
                } catch (err) {
                    console.error('Error cargando scheduler:', err);
                }
                return false;
            }

            function cambiarDia(offset) {
                if (!inputFecha || !form) return;
                var fechaActual = new Date(inputFecha.value + 'T00:00:00');
                if (isNaN(fechaActual.getTime())) {
                    fechaActual = new Date();
                }
                fechaActual.setDate(fechaActual.getDate() + offset);
                var nueva = formatear(fechaActual);

                if (esAdmin) {
                    inputFecha.value = nueva;
                    form.submit();
                } else {
                    cargarScheduler(nueva).then(function(exito){
                        if (!exito) {
                            // Fallback si falla AJAX en front
                            inputFecha.value = nueva;
                            form.submit();
                        }
                    });
                }
            }

            if (btnPrev) btnPrev.addEventListener('click', function() {
                cambiarDia(-1);
            });
            if (btnNext) btnNext.addEventListener('click', function() {
                cambiarDia(1);
            });
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
    $haySinAsignar = array_reduce($eventos, function ($acc, $ev) {
        return $acc || ($ev['recurso'] === 'Sin asignar');
    }, false);
    if ($haySinAsignar && !in_array('Sin asignar', $recursos, true)) {
        array_unshift($recursos, 'Sin asignar');
    }
}

/**
 * Inserta un script mínimo para asegurar scroll vertical en el contenedor del scheduler.
 * Mantiene compatibilidad con llamadas existentes en la plantilla.
 */
function renderizarScriptVerTodo()
{
?>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const CONTADOR_MS_POPUP = 4500; 
            const OVERFLOW_RATIO_THRESHOLD = 0.9; // Mostrar botón solo si se ve menos del 90% del contenido

            function crearBotonParaBloque(bloque) {
                if (!bloque) return;
                const contenido = bloque.querySelector('.eventoContenido');
                if (!contenido) return;
                // Mostrar botón únicamente si el visible/total < 0.9 (tolerancia); si no, remover si existe
                const total = Math.max(1, contenido.scrollHeight);
                const visible = contenido.clientHeight;
                const ratioVisible = visible / total;
                const debeMostrar = ratioVisible < OVERFLOW_RATIO_THRESHOLD;

                const esAdmin = window.location && window.location.pathname && window.location.pathname.indexOf('/wp-admin/') !== -1;
                const esFront = !esAdmin;
                const existenteBtn = bloque.querySelector('.eventoVerTodoBtn');
                const existenteFlecha = bloque.querySelector('.eventoVerTodoFlecha');
                const existeControl = existenteBtn || existenteFlecha;

                if (!debeMostrar) {
                    if (existeControl) existeControl.remove();
                    delete bloque.dataset.btnVerTodoAgregado;
                    return;
                }

                if (bloque.dataset.btnVerTodoAgregado === '1' && existeControl) return;

                if (esFront) {
                    // Crear flecha con overlay degradado
                    const flecha = document.createElement('div');
                    flecha.className = 'eventoVerTodoFlecha';
                    flecha.innerHTML = '<svg data-testid="geist-icon" height="16" stroke-linejoin="round" style="color:currentColor" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.0607 6.74999L11.5303 7.28032L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L5.53032 6.21966L7.99999 8.68933L10.4697 6.21966L11 5.68933L12.0607 6.74999Z" fill="currentColor"></path></svg>';
                    // Colores desde estilos computados del bloque
                    const estilos = getComputedStyle(bloque);
                    const fondo = estilos.backgroundColor || 'rgba(0,0,0,0.6)';
                    const texto = estilos.color || '#111827';
                    // Intentar crear transparente desde rgb/rgba
                    let transparente = 'rgba(0,0,0,0)';
                    try {
                        const m = fondo.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9\.]+))?\)/);
                        if (m) {
                            transparente = `rgba(${m[1]}, ${m[2]}, ${m[3]}, 0)`;
                        }
                    } catch (e) {}
                    flecha.style.position = 'absolute';
                    flecha.style.left = '0';
                    flecha.style.right = '0';
                    flecha.style.bottom = '0';
                    flecha.style.height = '20px';
                    flecha.style.display = 'flex';
                    flecha.style.alignItems = 'flex-end';
                    flecha.style.justifyContent = 'center';
                    flecha.style.fontSize = '12px';
                    flecha.style.lineHeight = '1';
                    flecha.style.cursor = 'pointer';
                    flecha.style.color = texto;
                    flecha.style.background = `linear-gradient(180deg, ${transparente} 0%, ${fondo} 100%)`;
                    flecha.style.pointerEvents = 'auto';
                    flecha.addEventListener('click', function(e) {
                        e.stopPropagation();
                        expandirEnSitio(bloque, contenido);
                    });
                    bloque.appendChild(flecha);
                } else {
                    // Admin: mantener botón por compatibilidad
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'eventoVerTodoBtn';
                    btn.textContent = 'ver completo';
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        expandirEnSitio(bloque, contenido);
                    });
                    bloque.appendChild(btn);
                }
                bloque.dataset.btnVerTodoAgregado = '1';
            }

            function crearBotonesVerTodo() {
                document.querySelectorAll('.bloqueEvento').forEach(crearBotonParaBloque);
            }

            function expandirEnSitio(bloque, contenido) {
                if (!bloque || !contenido) return;

                // Si ya existe overlay, cerrarlo (toggle)
                const existente = bloque.querySelector('.eventoOverlayExpand');
                if (existente) {
                    existente.remove();
                    // restaurar overflow si lo cambiamos
                    if (bloque.dataset._overflowPrevio) {
                        bloque.style.overflow = bloque.dataset._overflowPrevio;
                        delete bloque.dataset._overflowPrevio;
                    }
                    return;
                }

                // Crear overlay absoluto que expande hacia abajo sin mover el inicio del bloque
                const overlay = document.createElement('div');
                overlay.className = 'eventoOverlayExpand';
                const estiloBloque = getComputedStyle(bloque);
                overlay.style.position = 'absolute';
                overlay.style.left = '0';
                overlay.style.top = '0';
                overlay.style.width = '100%';
                overlay.style.minWidth = '220px';
                overlay.style.padding = '8px';
                overlay.style.borderRadius = estiloBloque.borderRadius || '4px';
                // Mantener colores del bloque para coherencia visual
                overlay.style.background = estiloBloque.backgroundColor || '#fff';
                overlay.style.color = estiloBloque.color || '#1d2327';
                overlay.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
                overlay.style.zIndex = '10000';
                overlay.style.pointerEvents = 'auto';

                const clon = contenido.cloneNode(true);
                clon.style.height = 'auto';
                clon.style.maxHeight = 'none';
                overlay.appendChild(clon);

                // Permitir que sobresalga del bloque
                if (!bloque.dataset._overflowPrevio) {
                    bloque.dataset._overflowPrevio = bloque.style.overflow || '';
                }
                bloque.style.overflow = 'visible';
                bloque.appendChild(overlay);

                // Cerrar al cabo de unos segundos o al segundo click
                const timeoutId = setTimeout(function() {
                    overlay.remove();
                    if (bloque.dataset._overflowPrevio !== undefined) {
                        bloque.style.overflow = bloque.dataset._overflowPrevio;
                        delete bloque.dataset._overflowPrevio;
                    }
                }, CONTADOR_MS_POPUP);

                // Cancelar el timeout si el usuario cierra manualmente
                overlay.addEventListener('click', function(ev) {
                    ev.stopPropagation();
                    overlay.remove();
                    clearTimeout(timeoutId);
                    if (bloque.dataset._overflowPrevio !== undefined) {
                        bloque.style.overflow = bloque.dataset._overflowPrevio;
                        delete bloque.dataset._overflowPrevio;
                    }
                });
            }

            // Ejecutar al cargar y reintentar tras el render del scheduler
            const reintentos = [0, 60, 200, 600];
            reintentos.forEach(function(delay) {
                setTimeout(crearBotonesVerTodo, delay);
            });

            // Mutations: observar cuando la capa de eventos cambie
            const capas = document.querySelectorAll('.glorySchedulerContenedor .capaEventos');
            capas.forEach(function(capa) {
                const obs = new MutationObserver(function(mutations) {
                    mutations.forEach(function(m) {
                        m.addedNodes && m.addedNodes.forEach(function(n) {
                            if (n.nodeType === 1) {
                                if (n.classList.contains('bloqueEvento')) {
                                    crearBotonParaBloque(n);
                                } else {
                                    // Si se agregan otros nodos, escanear por si acaso
                                    n.querySelectorAll && n.querySelectorAll('.bloqueEvento').forEach(crearBotonParaBloque);
                                }
                            }
                        });
                    });
                });
                obs.observe(capa, {
                    childList: true,
                    subtree: true
                });
            });

            // Por si hay listeners externos que disparan una recarga custom
            document.addEventListener('gloryRecarga', function() {
                // Asegurar que el layout haya aplicado alturas
                requestAnimationFrame(function() {
                    setTimeout(crearBotonesVerTodo, 0);
                });
            });
        });
    </script>
<?php
}
