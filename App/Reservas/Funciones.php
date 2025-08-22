<?php
// Funciones relacionadas con reservas: disponibilidad, API REST y utilidades

use Glory\Services\TokenManager;
use Glory\Manager\OpcionManager;

/**
 * Devuelve la zona horaria a usar según la configuración de WordPress.
 * Intenta usar wp_timezone() si está disponible; si no, usa el option
 * 'timezone_string' y, como último recurso, la zona por defecto de PHP.
 */
function obtenerZonaHorariaWp(): \DateTimeZone
{
    if (function_exists('wp_timezone')) {
        return wp_timezone();
    }
    $tz = get_option('timezone_string', '');
    if (!empty($tz)) {
        try {
            return new \DateTimeZone($tz);
        } catch (Exception $e) {
            // fallthrough
        }
    }
    // Fallback: usar la zona por defecto de PHP
    return new \DateTimeZone(date_default_timezone_get());
}

add_action('rest_api_init', function () {
	register_rest_route('glory/v1', '/reservas', [
		'methods'             => 'POST',
		'callback'            => 'crearReservaDesdeApi',
		'permission_callback' => function ($request) {
			$habilitada = (bool) OpcionManager::get('glory_api_habilitada', false);
			if (!$habilitada) {
				return new WP_Error('api_deshabilitada', 'La API está deshabilitada.', ['status' => 403]);
			}
			return tienePermisoApi($request);
		},
		'args' => [
			'nombre_cliente' => [
				'required' => true,
				'type'     => 'string',
			],
			'telefono_cliente' => [
				'required' => true,
				'type'     => 'string',
			],
			'correo_cliente' => [
				'required' => true,
				'type'     => 'string',
				'validate_callback' => function ($value) { return is_email($value); }
			],
			'servicio_id' => [
				'required' => true,
				'type'     => 'integer',
			],
			'barbero_id' => [
				'required' => true,
				'type'     => 'string', // puede ser 'any' o id numérico
			],
			'fecha_reserva' => [
				'required' => true,
				'type'     => 'string',
			],
			'hora_reserva' => [
				'required' => true,
				'type'     => 'string',
			],
		],
	]);

	// Consultar horas disponibles
	register_rest_route('glory/v1', '/horas-disponibles', [
		'methods'             => 'GET',
		'callback'            => 'obtenerHorasDisponiblesApi',
		'permission_callback' => function ($request) {
			$habilitada = (bool) OpcionManager::get('glory_api_habilitada', false);
			if (!$habilitada) {
				return new WP_Error('api_deshabilitada', 'La API está deshabilitada.', ['status' => 403]);
			}
			return tienePermisoApi($request);
		},
		'args' => [
			'fecha' => [
				'required' => true,
				'type'     => 'string',
			],
			'servicio_id' => [
				'required' => true,
				'type'     => 'integer',
			],
			'barbero_id' => [
				'required' => true,
				'type'     => 'string', // 'any' o id numérico
			],
			'exclude_id' => [
				'required' => false,
				'type'     => 'integer',
			],
		],
	]);

	// Consultar servicios que ofrece un barbero
	register_rest_route('glory/v1', '/barberos/(?P<barbero_id>\\d+)/servicios', [
		'methods'             => 'GET',
		'callback'            => 'obtenerServiciosPorBarberoApi',
		'permission_callback' => function ($request) {
			$habilitada = (bool) OpcionManager::get('glory_api_habilitada', false);
			if (!$habilitada) {
				return new WP_Error('api_deshabilitada', 'La API está deshabilitada.', ['status' => 403]);
			}
			return tienePermisoApi($request);
		},
	]);

	// Listar barberos (id y nombre) para identificar sus IDs
	register_rest_route('glory/v1', '/barberos', [
		'methods'             => 'GET',
		'callback'            => 'listarBarberosApi',
		'permission_callback' => function ($request) {
			$habilitada = (bool) OpcionManager::get('glory_api_habilitada', false);
			if (!$habilitada) {
				return new WP_Error('api_deshabilitada', 'La API está deshabilitada.', ['status' => 403]);
			}
			return tienePermisoApi($request);
		},
	]);

	// Listar servicios (opcionalmente filtrar por barbero_id)
	register_rest_route('glory/v1', '/servicios', [
		'methods'             => 'GET',
		'callback'            => 'listarServiciosApi',
		'permission_callback' => function ($request) {
			$habilitada = (bool) OpcionManager::get('glory_api_habilitada', false);
			if (!$habilitada) {
				return new WP_Error('api_deshabilitada', 'La API está deshabilitada.', ['status' => 403]);
			}
			return tienePermisoApi($request);
		},
	]);
});

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
	$params = $request->get_json_params();

	$handler = new \App\Handler\Form\CrearReservaHandler();

	try {
		$resultado = $handler->procesar($params, []);
		return new WP_REST_Response([
			'success' => true,
			'id'      => isset($resultado['post_id']) ? (int) $resultado['post_id'] : null,
			'message' => $resultado['alert'] ?? 'Reserva creada exitosamente.',
		], 201);
	} catch (\Throwable $e) {
		return new WP_REST_Response([
			'success' => false,
			'error'   => $e->getMessage(),
		], 400);
	}
}

function obtenerHorasDisponiblesApi(WP_REST_Request $request) {
	$fecha = sanitize_text_field((string) $request->get_param('fecha'));
	$barberoRaw = sanitize_text_field((string) $request->get_param('barbero_id'));
	$servicioId = absint((int) $request->get_param('servicio_id'));
	$excludeId = absint((int) $request->get_param('exclude_id'));

	if (empty($fecha) || empty($barberoRaw) || empty($servicioId)) {
		return new WP_REST_Response([
			'success' => false,
			'error'   => 'Faltan datos para verificar la disponibilidad.'
		], 400);
	}

	try {
		$fechaObj = new DateTime($fecha);
		$hoy = new DateTime('today');
		if ($excludeId <= 0) {
			if ($fechaObj < $hoy) {
				return new WP_REST_Response(['success' => false, 'error' => 'No puedes reservar en una fecha pasada.'], 400);
			}
			if ($fechaObj->format('N') == 7) {
				return new WP_REST_Response(['success' => false, 'error' => 'No se admiten reservas los domingos.'], 400);
			}
		}
	} catch (Exception $e) {
		return new WP_REST_Response(['success' => false, 'error' => 'Formato de fecha inválido.'], 400);
	}

	$servicio = get_term($servicioId, 'servicio');
	if (is_wp_error($servicio) || !$servicio) {
		return new WP_REST_Response(['success' => false, 'error' => 'Servicio no válido.'], 400);
	}
	$duracion = get_term_meta($servicio->term_id, 'duracion', true) ?: 30;

	if ($barberoRaw === 'any') {
		$horariosDisponibles = obtenerHorariosDisponiblesCualquierBarbero($fecha, $servicioId, $duracion, $excludeId);
	} else {
		$barberoId = is_numeric($barberoRaw) ? absint($barberoRaw) : 0;
		$horariosDisponibles = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion, $excludeId);
	}

	return new WP_REST_Response([
		'success' => true,
		'options' => array_values($horariosDisponibles),
	]);
}

function obtenerServiciosPorBarberoApi(WP_REST_Request $request) {
	$barberoId = absint((int) $request['barbero_id']);
	if ($barberoId <= 0) {
		return new WP_REST_Response(['success' => false, 'error' => 'ID de barbero inválido.'], 400);
	}
	$barbero = get_term($barberoId, 'barbero');
	if (is_wp_error($barbero) || !$barbero) {
		return new WP_REST_Response(['success' => false, 'error' => 'Barbero no encontrado.'], 404);
	}

	// No exponer barberos dados de baja a la API
	if (get_term_meta($barberoId, 'inactivo', true) === '1') {
		return new WP_REST_Response(['success' => false, 'error' => 'Barbero no disponible.'], 404);
	}

	$servicesIds = get_term_meta($barberoId, 'servicios', true);
	if (!is_array($servicesIds)) $servicesIds = [];
	$servicesIds = array_map('intval', $servicesIds);

	$servicios = [];
	foreach ($servicesIds as $sid) {
		$term = get_term($sid, 'servicio');
		if (is_wp_error($term) || !$term) continue;
		$duracion = get_term_meta($term->term_id, 'duracion', true);
		$precio = get_term_meta($term->term_id, 'precio', true);
		$servicios[] = [
			'id' => (int) $term->term_id,
			'nombre' => (string) $term->name,
			'slug' => (string) $term->slug,
			'duracion' => is_numeric($duracion) ? (int) $duracion : null,
			'precio' => is_numeric($precio) ? (float) $precio : null,
		];
	}

	return new WP_REST_Response([
		'success' => true,
		'items' => $servicios,
	]);
}

/** Listar todos los servicios o filtrar por barbero_id si se pasa como query param */
function listarServiciosApi(WP_REST_Request $request) {
    $barberoId = $request->get_param('barbero_id');
    $items = [];

    if (!empty($barberoId)) {
        $barberoId = absint((int) $barberoId);
        if ($barberoId <= 0) {
            return new WP_REST_Response(['success' => false, 'error' => 'ID de barbero inválido.'], 400);
        }
        $servicesIds = get_term_meta($barberoId, 'servicios', true);
        if (!is_array($servicesIds)) $servicesIds = [];
        $servicesIds = array_map('intval', $servicesIds);
        foreach ($servicesIds as $sid) {
            $term = get_term($sid, 'servicio');
            if (is_wp_error($term) || !$term) continue;
            // Omitir servicios si están marcados inactivos (meta 'inactivo' = '1')
            if (get_term_meta($term->term_id, 'inactivo', true) === '1') continue;
            $duracion = get_term_meta($term->term_id, 'duracion', true);
            $precio = get_term_meta($term->term_id, 'precio', true);
            $items[] = [
                'id' => (int) $term->term_id,
                'nombre' => (string) $term->name,
                'slug' => (string) $term->slug,
                'duracion' => is_numeric($duracion) ? (int) $duracion : null,
                'precio' => is_numeric($precio) ? (float) $precio : null,
            ];
        }
    } else {
        $terms = get_terms([
            'taxonomy' => 'servicio',
            'hide_empty' => false,
        ]);
        if (is_wp_error($terms)) {
            return new WP_REST_Response(['success' => false, 'error' => 'No se pudo obtener la lista de servicios.'], 500);
        }
        foreach ($terms as $term) {
            if (get_term_meta($term->term_id, 'inactivo', true) === '1') continue;
            $duracion = get_term_meta($term->term_id, 'duracion', true);
            $precio = get_term_meta($term->term_id, 'precio', true);
            $items[] = [
                'id' => (int) $term->term_id,
                'nombre' => (string) $term->name,
                'slug' => (string) $term->slug,
                'duracion' => is_numeric($duracion) ? (int) $duracion : null,
                'precio' => is_numeric($precio) ? (float) $precio : null,
            ];
        }
    }

    return new WP_REST_Response([
        'success' => true,
        'items' => $items,
    ]);
}

function listarBarberosApi(WP_REST_Request $request) {
	$terms = get_terms([
		'taxonomy'   => 'barbero',
		'hide_empty' => false,
	]);

	if (is_wp_error($terms)) {
		return new WP_REST_Response([
			'success' => false,
			'error'   => 'No se pudo obtener la lista de barberos.'
		], 500);
	}

	$items = [];
	foreach ($terms as $term) {
		// Omitir barberos dados de baja
		if (get_term_meta($term->term_id, 'inactivo', true) === '1') continue;
		$items[] = [
			'id'     => (int) $term->term_id,
			'nombre' => (string) $term->name,
			'slug'   => (string) $term->slug,
		];
	}

	return new WP_REST_Response([
		'success' => true,
		'items'   => $items,
	]);
}

function obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion, $excludeId = 0)
{
    $horaInicioJornada = new DateTime('09:00');
    $horaFinJornada = new DateTime('20:00'); // L-V 09:00 - 20:00
    $intervalo = 15; // minutos

    // Obtener el día de la semana (1 = Lunes, 7 = Domingo)
    $diaSemana = (new DateTime($fecha))->format('N');

    // Ajustar horario de fin de jornada para el sábado
    if ((int)$diaSemana === 6) { // Sábado
        $horaFinJornada = new DateTime('14:00'); // Sábado 09:00 - 14:00
    }

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

/** Verifica si un barbero ofrece un servicio dado. */
function barberoOfreceServicio(int $barberoId, int $servicioId): bool
{
    if ($barberoId <= 0 || $servicioId <= 0) return false;
    $servicesIds = get_term_meta($barberoId, 'servicios', true);
    if (!is_array($servicesIds)) $servicesIds = [];
    $servicesIds = array_map('intval', $servicesIds);
    return in_array((int)$servicioId, $servicesIds, true);
}

/**
 * Devuelve la intersección de horas disponibles entre todos los barberos que ofrecen el servicio dado.
 * Si alguno tiene el slot ocupado, el slot se excluye. Sirve para opción "Cualquier barbero".
 */
function obtenerHorariosDisponiblesCualquierBarbero($fecha, $servicioId, $duracion, $excludeId = 0)
{
    // Buscar todos los barberos que ofrecen el servicio
    $barberos = get_terms([
        'taxonomy' => 'barbero',
        'hide_empty' => false,
    ]);
    if (is_wp_error($barberos) || empty($barberos)) {
        return [];
    }

    $barberosQueOfrecen = [];
    foreach ($barberos as $barbero) {
        $servicesIds = get_term_meta($barbero->term_id, 'servicios', true);
        if (!is_array($servicesIds)) $servicesIds = [];
        $servicesIds = array_map('intval', $servicesIds);
        if (in_array((int)$servicioId, $servicesIds, true)) {
            $barberosQueOfrecen[] = (int)$barbero->term_id;
        }
    }

    if (empty($barberosQueOfrecen)) {
        return [];
    }

    // Construir un mapa de disponibilidad por barbero y luego intersectar
    $disponibilidades = [];
    foreach ($barberosQueOfrecen as $bid) {
        $slots = obtenerHorariosDisponibles($fecha, $bid, $servicioId, $duracion, $excludeId);
        $disponibilidades[] = $slots;
    }

    // Intersección: slots que están disponibles en al menos un barbero
    // Para que "Cualquier barbero" funcione como "encuéntrame cualquier barbero libre",
    // necesitamos la unión, no la intersección. Así habrá más opciones de horas.
    $union = [];
    foreach ($disponibilidades as $slots) {
        foreach ($slots as $h) {
            $union[$h] = true;
        }
    }
    $horas = array_keys($union);
    sort($horas);
    return $horas;
}


/**
 * Asigna un servicio (term_id) a todos los barberos agregándolo al meta 'servicios'.
 */
function asignarServicioATodosLosBarberos(int $servicioId): void
{
    $servicioId = absint($servicioId);
    if ($servicioId <= 0) {
        return;
    }

    $barberos = get_terms([
        'taxonomy' => 'barbero',
        'hide_empty' => false,
    ]);
    if (is_wp_error($barberos) || empty($barberos)) {
        return;
    }

    foreach ($barberos as $barbero) {
        $ids = get_term_meta($barbero->term_id, 'servicios', true);
        if (!is_array($ids)) {
            $ids = [];
        }
        $ids[] = $servicioId;
        $ids = array_values(array_unique(array_map('intval', $ids)));
        update_term_meta($barbero->term_id, 'servicios', $ids);
    }
}

