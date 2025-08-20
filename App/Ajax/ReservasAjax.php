<?php

use Glory\Components\DataGridRenderer;

function verificarDisponibilidadCallback()
{
    $fecha = sanitize_text_field($_POST['fecha'] ?? ($_POST['fecha_reserva'] ?? ''));
    $barberoRaw = sanitize_text_field($_POST['barbero_id'] ?? '');
    $barberoId = is_numeric($barberoRaw) ? absint($barberoRaw) : 0;
    $servicioId = absint($_POST['servicio_id'] ?? 0);
    $excludeId = absint($_POST['exclude_id'] ?? 0);

    if (empty($fecha) || empty($barberoRaw) || empty($servicioId)) {
        wp_send_json_error(['mensaje' => 'Faltan datos para verificar la disponibilidad.']);
        return;
    }

    try {
        $fechaObj = new DateTime($fecha);
        $hoy = new DateTime('today');
        // En modo edición (exclude_id > 0), permitimos cargar opciones incluso si la fecha es pasada o domingo.
        if ($excludeId <= 0) {
            if ($fechaObj < $hoy) {
                wp_send_json_error(['mensaje' => 'No puedes reservar en una fecha pasada.']);
                return;
            }
            if ($fechaObj->format('N') == 7) { // 7 = Domingo
                wp_send_json_error(['mensaje' => 'No se admiten reservas los domingos.']);
                return;
            }
        }
    } catch (Exception $e) {
        wp_send_json_error(['mensaje' => 'Formato de fecha inválido.']);
        return;
    }

    $servicio = get_term($servicioId, 'servicio');
    if (is_wp_error($servicio) || !$servicio) {
        wp_send_json_error(['mensaje' => 'Servicio no válido.']);
        return;
    }
    $duracion = get_term_meta($servicio->term_id, 'duracion', true) ?: 30;

    if ($barberoRaw === 'any') {
        if (!function_exists('obtenerHorariosDisponiblesCualquierBarbero')) {
            wp_send_json_error(['mensaje' => 'Función de disponibilidad no disponible.']);
            return;
        }
        $horariosDisponibles = obtenerHorariosDisponiblesCualquierBarbero($fecha, $servicioId, $duracion, $excludeId);
    } else {
        $horariosDisponibles = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion, $excludeId);
    }

    // Si estamos editando, garantizar que la hora actual de la reserva esté presente en las opciones
    if ($excludeId > 0) {
        $horaActual = (string) get_post_meta($excludeId, 'hora_reserva', true);
        if ($horaActual !== '' && !in_array($horaActual, $horariosDisponibles, true)) {
            array_unshift($horariosDisponibles, $horaActual);
        }
    }

    wp_send_json_success(['options' => $horariosDisponibles]);
}

function manejarExportacionReservasCsv()
{
    if (
        isset($_GET['page']) && $_GET['page'] === 'barberia-reservas' &&
        isset($_GET['exportar_csv']) && $_GET['exportar_csv'] === 'true' &&
        current_user_can('manage_options')
    ) {
        exportarReservasACsv();
        exit;
    }
}

function exportarReservasCsvAjax()
{
    // Solo admins y con nonce válido
    if (!current_user_can('manage_options')) {
        status_header(403);
        echo 'Permisos insuficientes.';
        wp_die();
    }
    $nonce = isset($_REQUEST['nonce']) ? (string) $_REQUEST['nonce'] : '';
    if (!wp_verify_nonce($nonce, 'exportar_reservas_csv')) {
        status_header(400);
        echo 'Nonce inválido.';
        wp_die();
    }

    exportarReservasACsv();
    wp_die();
}

function filtrarReservasAjaxCallback()
{
    // Asegurar que las definiciones de colores estén registradas antes de renderizar
    if (function_exists('registrarOpcionesColoresServiciosDinamico')) {
        registrarOpcionesColoresServiciosDinamico();
    }

    $t0 = microtime(true);
    // Construir args similares a consultaReservas() pero con $_POST
    $pagina = isset($_POST['paged']) ? max(1, absint($_POST['paged'])) : 1;

    $args = [
        'post_type'      => 'reserva',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'meta_query'     => ['relation' => 'AND'],
        'tax_query'      => ['relation' => 'AND'],
    ];

    if (!empty($_POST['s'])) {
        $args['s'] = sanitize_text_field((string) $_POST['s']);
    }
    if (!empty($_POST['fecha_desde'])) {
        $args['meta_query'][] = [
            'key'     => 'fecha_reserva',
            'value'   => sanitize_text_field((string) $_POST['fecha_desde']),
            'compare' => '>=',
            'type'    => 'DATE',
        ];
    }
    if (!empty($_POST['fecha_hasta'])) {
        $args['meta_query'][] = [
            'key'     => 'fecha_reserva',
            'value'   => sanitize_text_field((string) $_POST['fecha_hasta']),
            'compare' => '<=',
            'type'    => 'DATE',
        ];
    }
    if (!empty($_POST['filtro_servicio'])) {
        $args['tax_query'][] = [
            'taxonomy' => 'servicio',
            'field'    => 'term_id',
            'terms'    => absint((int) $_POST['filtro_servicio']),
        ];
    }
    if (!empty($_POST['filtro_barbero'])) {
        $args['tax_query'][] = [
            'taxonomy' => 'barbero',
            'field'    => 'term_id',
            'terms'    => absint((int) $_POST['filtro_barbero']),
        ];
    }

    $orderbyParam = isset($_POST['orderby']) ? sanitize_key((string) $_POST['orderby']) : '';
    $orderParam   = (isset($_POST['order']) && strtolower((string) $_POST['order']) === 'desc') ? 'DESC' : 'ASC';

    // Si hay orden explícito, delegar al orden nativo
    if ($orderbyParam !== '') {
        if ($orderbyParam === 'post_title') {
            $args['orderby'] = 'title';
            $args['order']   = $orderParam;
        } elseif ($orderbyParam === 'fecha_reserva') {
            $args['meta_key'] = 'fecha_reserva';
            $args['orderby']  = 'meta_value';
            $args['order']    = $orderParam;
        } elseif ($orderbyParam === 'hora_reserva') {
            $args['meta_key'] = 'hora_reserva';
            $args['orderby']  = 'meta_value';
            $args['order']    = $orderParam;
        }
        $query = new WP_Query(['paged' => $pagina] + $args);
    } else {
        // Orden por defecto: futuras y en proceso primero; pasadas al final
        // Optimización: solo traer los IDs para ordenar en PHP y luego cargar la página actual
        $qAll = new WP_Query($args + ['fields' => 'ids', 'no_found_rows' => true, 'update_post_meta_cache' => false, 'update_post_term_cache' => false]);
        $posts = is_array($qAll->posts) ? array_map(function ($id) {
            return (object)['ID' => (int)$id];
        }, $qAll->posts) : [];
        $ahora = new DateTime();
        $leerDuracion = function (int $postId): int {
            $servicios = get_the_terms($postId, 'servicio');
            if (!is_wp_error($servicios) && !empty($servicios)) {
                $dur = get_term_meta($servicios[0]->term_id, 'duracion', true);
                if (is_numeric($dur)) return max(0, (int) $dur);
            }
            return 30;
        };
        $part = function ($p) use ($ahora, $leerDuracion): array {
            $fecha = (string) get_post_meta($p->ID, 'fecha_reserva', true);
            $hora  = (string) get_post_meta($p->ID, 'hora_reserva', true);
            if (!$fecha || !$hora) return ['grupo' => 2, 'inicio' => null];
            try {
                $inicio = new DateTime($fecha . ' ' . $hora);
            } catch (Exception $e) {
                return ['grupo' => 2, 'inicio' => null];
            }
            $fin = (clone $inicio)->add(new DateInterval('PT' . $leerDuracion($p->ID) . 'M'));
            $grupo = ($fin < $ahora) ? 2 : 1;
            return ['grupo' => $grupo, 'inicio' => $inicio];
        };
        usort($posts, function ($a, $b) use ($part) {
            $pa = $part($a);
            $pb = $part($b);
            if ($pa['grupo'] !== $pb['grupo']) return $pa['grupo'] <=> $pb['grupo'];
            // Orden dentro del grupo: DESC por fecha/hora de inicio
            if ($pa['inicio'] && $pb['inicio']) return $pb['inicio']->getTimestamp() <=> $pa['inicio']->getTimestamp();
            return 0;
        });
        // Paginación básica tras ordenar (20 por página)
        $perPage = 20;
        $offset = ($pagina - 1) * $perPage;
        $slice = array_slice($posts, $offset, $perPage);
        $ids = wp_list_pluck($slice, 'ID');
        if (empty($ids)) {
            $query = new WP_Query(['post_type' => 'reserva', 'post__in' => [0]]);
        } else {
            $query = new WP_Query([
                'post_type' => 'reserva',
                'post__in' => $ids,
                'orderby' => 'post__in',
                'posts_per_page' => count($ids),
                'post_status' => 'publish',
                'no_found_rows' => true,
                'ignore_sticky_posts' => true,
            ]);
            // Ajustar manualmente paginación para el renderer
            $totalPosts = count($posts);
            $query->max_num_pages = max(1, (int) ceil($totalPosts / $perPage));
            $query->set('paged', $pagina);
        }
    }

    // Reutilizar la configuración de columnas existente
    if (!function_exists('columnasReservas')) {
        wp_send_json_error(['mensaje' => 'Configuración no disponible.']);
        return;
    }
    $configuracionColumnas = columnasReservas();
    // Respetar que las acciones masivas se muestren fuera del DataGrid en las vistas
    $configuracionColumnas['acciones_masivas_separadas'] = true;

    ob_start();
    DataGridRenderer::render($query, $configuracionColumnas);
    $html = ob_get_clean();
    // Envolver en frontend con un contenedor para aplicar border-radius real
    $html = '<div class="tablaWrap">' . $html . '</div>';

    $t1 = microtime(true);
    wp_send_json_success(['html' => $html, 'renderMs' => (int)(($t1 - $t0) * 1000)]);
}

function obtenerReservaCallback()
{
    if (!current_user_can('edit_posts')) {
        wp_send_json_error(['mensaje' => 'Permisos insuficientes.'], 403);
    }

    $id = absint($_POST['id'] ?? 0);
    if (!$id) {
        wp_send_json_error(['mensaje' => 'ID inválido.'], 400);
    }

    $post = get_post($id);
    if (!$post || $post->post_type !== 'reserva') {
        wp_send_json_error(['mensaje' => 'Reserva no encontrada.'], 404);
    }

    $servicio = get_the_terms($id, 'servicio');
    $barbero = get_the_terms($id, 'barbero');

    wp_send_json_success([
        'id' => $id,
        'nombre_cliente' => $post->post_title,
        'telefono_cliente' => get_post_meta($id, 'telefono_cliente', true) ?: '',
        'correo_cliente' => get_post_meta($id, 'correo_cliente', true) ?: '',
        'fecha_reserva' => get_post_meta($id, 'fecha_reserva', true) ?: '',
        'hora_reserva' => get_post_meta($id, 'hora_reserva', true) ?: '',
        'servicio_id' => is_array($servicio) && !is_wp_error($servicio) && !empty($servicio) ? $servicio[0]->term_id : '',
        'barbero_id' => is_array($barbero) && !is_wp_error($barbero) && !empty($barbero) ? $barbero[0]->term_id : '',
        'exclusividad' => get_post_meta($id, 'exclusividad', true) ?: '0',
    ]);
}
