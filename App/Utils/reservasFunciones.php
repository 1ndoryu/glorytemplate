<?php
// Funciones relacionadas con reservas: disponibilidad, API REST y utilidades

function tienePermisoApi(WP_REST_Request $request) {
    $authHeader = $request->get_header('Authorization');
    if (!$authHeader) {
        return new WP_Error('sin_autorizacion', 'Falta el encabezado de autorización.', ['status' => 401]);
    }

    list($type, $token) = explode(' ', $authHeader, 2);
    if (strcasecmp($type, 'Bearer') !== 0 || empty($token)) {
        return new WP_Error('token_malformado', 'El formato del token es incorrecto.', ['status' => 401]);
    }

    $resultadoValidacion = TokenManager::validarToken($token);

    if (is_wp_error($resultadoValidacion)) {
        return $resultadoValidacion;
    }

    return true;
}

function crearReservaDesdeApi(WP_REST_Request $request) {

    return new WP_REST_Response([
        'success' => true,
        'message' => 'Reserva creada exitosamente (simulado).',
        'data' => $request->get_json_params()
    ], 201);
}

function obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion, $excludeId = 0)
{
    $horaInicioJornada = new DateTime('09:00');
    $horaFinJornada = new DateTime('21:00');
    $intervalo = 15; // minutos

    // Obtener todas las reservas para ese día y barbero
    $args = [
        'post_type' => 'reserva',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'meta_query' => [
            ['key' => 'fecha_reserva', 'value' => $fecha, 'compare' => '=']
        ],
        'tax_query' => [
            ['taxonomy' => 'barbero', 'field' => 'term_id', 'terms' => $barberoId]
        ]
    ];
    if ($excludeId > 0) {
        $args['post__not_in'] = [$excludeId];
    }
    $reservasQuery = new WP_Query($args);

    $horariosOcupados = [];
    if ($reservasQuery->have_posts()) {
        while ($reservasQuery->have_posts()) {
            $reservasQuery->the_post();
            $horaReserva = get_post_meta(get_the_ID(), 'hora_reserva', true);
            $serviciosReserva = get_the_terms(get_the_ID(), 'servicio');
            $duracionReserva = 30;
            if (!is_wp_error($serviciosReserva) && !empty($serviciosReserva)) {
                $duracion_meta = get_term_meta($serviciosReserva[0]->term_id, 'duracion', true);
                if (is_numeric($duracion_meta)) $duracionReserva = (int)$duracion_meta;
            }

            $inicioReserva = new DateTime($horaReserva);
            $finReserva = (clone $inicioReserva)->add(new DateInterval("PT{$duracionReserva}M"));
            $horariosOcupados[] = ['inicio' => $inicioReserva, 'fin' => $finReserva];
        }
    }
    wp_reset_postdata();

    // Generar todos los posibles slots de inicio
    $slotsDisponibles = [];
    $slotActual = clone $horaInicioJornada;
    $finPosibleSlot = (clone $horaFinJornada)->sub(new DateInterval("PT{$duracion}M"));

    while ($slotActual <= $finPosibleSlot) {
        $finSlotNuevo = (clone $slotActual)->add(new DateInterval("PT{$duracion}M"));
        $esDisponible = true;

        foreach ($horariosOcupados as $ocupado) {
            // Comprobar solapamiento
            if ($slotActual < $ocupado['fin'] && $finSlotNuevo > $ocupado['inicio']) {
                $esDisponible = false;
                break;
            }
        }

        if ($esDisponible) {
            $slotsDisponibles[] = $slotActual->format('H:i');
        }

        $slotActual->add(new DateInterval("PT{$intervalo}M"));
    }

    return $slotsDisponibles;
}


