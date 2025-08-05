<?php

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


function incluirArchivos($directorio)
{
    $ruta_completa = get_template_directory() . "/$directorio";

    // Incluir archivos PHP en el directorio actual
    $archivos = glob($ruta_completa . "*.php");
    foreach ($archivos as $archivo) {
        include_once $archivo;
    }

    // Incluir archivos PHP en subdirectorios recursivamente
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

// Registrar el endpoint de la API REST
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

    // Opcional: Verificar que el usuario (ID: $resultadoValidacion) tenga permisos específicos
    // if (!user_can($resultadoValidacion, 'crear_reservas')) {
    //     return new WP_Error('permiso_insuficiente', 'El usuario no tiene permisos para crear reservas.', ['status' => 403]);
    // }

    return true;
}

function crearReservaDesdeApi(WP_REST_Request $request) {
    // Aquí iría la lógica para crear la reserva usando los parámetros del request
    // $params = $request->get_json_params();
    // Ejemplo:
    // $nombreCliente = sanitize_text_field($params['nombreCliente']);
    // ...

    // Por ahora, solo devolvemos un éxito simulado
    return new WP_REST_Response([
        'success' => true,
        'message' => 'Reserva creada exitosamente (simulado).',
        'data' => $request->get_json_params()
    ], 201);
}
