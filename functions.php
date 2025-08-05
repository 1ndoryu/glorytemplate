<?php
// FILE: functions.php
use Glory\Handler\FormHandler;

$directorioTemaActivo = get_stylesheet_directory();

$autoloader = get_template_directory() . '/vendor/autoload.php';
if (file_exists($autoloader)) {
    require_once $autoloader;
} else {
    error_log('Error: Composer autoload no encontrado. Ejecuta "composer install".');
}

$glory_loader = get_template_directory() . '/Glory/load.php';
if (file_exists($glory_loader)) {
    require_once $glory_loader;
} else {
    error_log('Error: Glory Framework loader no encontrado.');
}

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    error_log('Error al cargar el archivo .env: ' . $e->getMessage());
}

FormHandler::registerHandlerNamespace('App\\Handler\\Form\\');


function incluirArchivos($directorio)
{
    $ruta_completa = get_template_directory() . "/$directorio";

    $archivos = glob($ruta_completa . "*.php");
    foreach ($archivos as $archivo) {
        include_once $archivo;
    }

    $subdirectorios = glob($ruta_completa . "*/", GLOB_ONLYDIR);
    foreach ($subdirectorios as $subdirectorio) {
        $ruta_relativa = str_replace(get_template_directory() . '/', '', $subdirectorio);
        incluirArchivos($ruta_relativa);
    }
}

$directorios = [
    'App/',
    'templates/',
];

foreach ($directorios as $directorio) {
    incluirArchivos($directorio);
}


function fuentes()
{

}
add_action('wp_head', 'fuentes', 1);

add_action('rest_api_init', function () {
    register_rest_route('glory/v1', '/reservas', [
        'methods' => 'POST',
        'callback' => 'crearReservaDesdeApi',
        'permission_callback' => 'tienePermisoApi',
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

    return new WP_REST_Response([
        'success' => true,
        'message' => 'Reserva creada exitosamente (simulado).',
        'data' => $request->get_json_params()
    ], 201);
}

add_action('wp_ajax_glory_verificar_disponibilidad', 'glory_verificar_disponibilidad_callback');
add_action('wp_ajax_nopriv_glory_verificar_disponibilidad', 'glory_verificar_disponibilidad_callback');

function glory_verificar_disponibilidad_callback()
{
    $fecha = sanitize_text_field($_POST['fecha'] ?? '');
    $barberoId = absint($_POST['barbero_id'] ?? 0);
    $servicioId = absint($_POST['servicio_id'] ?? 0);

    if (empty($fecha) || empty($barberoId) || empty($servicioId)) {
        wp_send_json_error(['mensaje' => 'Faltan datos para verificar la disponibilidad.']);
        return;
    }

    try {
        $fechaObj = new DateTime($fecha);
        $hoy = new DateTime('today');
        if ($fechaObj < $hoy) {
            wp_send_json_error(['mensaje' => 'No puedes reservar en una fecha pasada.']);
            return;
        }
        if ($fechaObj->format('N') == 7) { // 7 = Domingo
            wp_send_json_error(['mensaje' => 'No se admiten reservas los domingos.']);
            return;
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

    $horariosDisponibles = obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion);

    wp_send_json_success(['horarios' => $horariosDisponibles]);
}

function obtenerHorariosDisponibles($fecha, $barberoId, $servicioId, $duracion)
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