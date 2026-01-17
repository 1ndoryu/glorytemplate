<?php

/**
 * Endpoints REST API para el módulo CAP
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use Glory\App\Models\Clase;
use Glory\App\Models\Configuracion;

class CapEndpoints
{
    private const NAMESPACE = 'cap/v1';

    public function registrar(): void
    {
        add_action('rest_api_init', [$this, 'registrarRutas']);
    }

    public function registrarRutas(): void
    {
        register_rest_route(self::NAMESPACE, '/config', [
            ['methods' => 'GET', 'callback' => [$this, 'obtenerConfig'], 'permission_callback' => [$this, 'verificarPermisos']],
            ['methods' => 'POST', 'callback' => [$this, 'guardarConfig'], 'permission_callback' => [$this, 'verificarPermisos']],
        ]);

        register_rest_route(self::NAMESPACE, '/alumnos', [
            ['methods' => 'GET', 'callback' => [$this, 'listarAlumnos'], 'permission_callback' => [$this, 'verificarPermisos']],
            ['methods' => 'POST', 'callback' => [$this, 'crearAlumno'], 'permission_callback' => [$this, 'verificarPermisos']],
        ]);

        register_rest_route(self::NAMESPACE, '/alumnos/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [$this, 'actualizarAlumno'], 'permission_callback' => [$this, 'verificarPermisos']],
            ['methods' => 'DELETE', 'callback' => [$this, 'eliminarAlumno'], 'permission_callback' => [$this, 'verificarPermisos']],
        ]);

        register_rest_route(self::NAMESPACE, '/clases', [
            'methods' => 'GET',
            'callback' => [$this, 'obtenerClases'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/generar', [
            'methods' => 'POST',
            'callback' => [$this, 'generarCalendario'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/dashboard', [
            'methods' => 'GET',
            'callback' => [$this, 'obtenerDashboard'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);

        /* Endpoint público de registro */
        register_rest_route(self::NAMESPACE, '/registro', [
            'methods' => 'POST',
            'callback' => [$this, 'registrarUsuario'],
            'permission_callback' => '__return_true',
        ]);

        /* Endpoints de disponibilidad */
        register_rest_route(self::NAMESPACE, '/disponibilidad/(?P<alumnoId>\d+)', [
            ['methods' => 'GET', 'callback' => [$this, 'obtenerDisponibilidad'], 'permission_callback' => [$this, 'verificarPermisos']],
            ['methods' => 'POST', 'callback' => [$this, 'guardarDisponibilidad'], 'permission_callback' => [$this, 'verificarPermisos']],
        ]);
    }

    public function verificarPermisos(): bool
    {
        if (!is_user_logged_in()) return false;
        $user = wp_get_current_user();
        return in_array('cap_admin', $user->roles) || in_array('administrator', $user->roles);
    }

    public function obtenerConfig(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);

        $configModel = new Configuracion();

        /* Obtener datos de suscripción */
        global $wpdb;
        $tablaSuscripciones = $wpdb->prefix . 'cap_suscripciones';
        $suscripcion = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tablaSuscripciones} WHERE centro_id = %d ORDER BY id DESC LIMIT 1",
            $centroId
        ), ARRAY_A);

        return new \WP_REST_Response([
            'config' => $configModel->obtener($centroId),
            'centro' => $configModel->obtenerDatosCentro($centroId),
            'suscripcion' => $suscripcion,
        ]);
    }

    public function guardarConfig(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);

        $datos = $request->get_json_params();
        $configModel = new Configuracion();

        if (isset($datos['config'])) $configModel->guardar($centroId, $datos['config']);
        if (isset($datos['centro'])) $configModel->actualizarDatosCentro($centroId, $datos['centro']);

        return new \WP_REST_Response(['exito' => true]);
    }

    public function listarAlumnos(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);

        $alumnoModel = new Alumno();
        $opciones = [
            'limite' => $request->get_param('limite') ?? 50,
            'offset' => $request->get_param('offset') ?? 0,
            'busqueda' => $request->get_param('busqueda') ?? '',
        ];

        return new \WP_REST_Response([
            'alumnos' => $alumnoModel->obtenerPorCentro($centroId, $opciones),
            'total' => $alumnoModel->contarPorCentro($centroId),
        ]);
    }

    public function crearAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);

        $alumnoModel = new Alumno();
        $datos = $request->get_json_params();
        $datos['centro_id'] = $centroId;

        $id = $alumnoModel->crear($datos);
        if (!$id) return new \WP_REST_Response(['error' => 'Error al crear'], 400);

        return new \WP_REST_Response(['alumno' => $alumnoModel->obtenerPorId($id)], 201);
    }

    public function actualizarAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $alumnoModel = new Alumno();

        if (!$alumnoModel->actualizar($id, $request->get_json_params())) {
            return new \WP_REST_Response(['error' => 'Error al actualizar'], 400);
        }
        return new \WP_REST_Response(['alumno' => $alumnoModel->obtenerPorId($id)]);
    }

    public function eliminarAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        $alumnoModel = new Alumno();
        if (!$alumnoModel->eliminar((int) $request->get_param('id'))) {
            return new \WP_REST_Response(['error' => 'Error al eliminar'], 400);
        }
        return new \WP_REST_Response(['exito' => true]);
    }

    public function obtenerClases(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);

        $claseModel = new Clase();
        $semana = $request->get_param('semana') ?? date('Y-m-d');
        return new \WP_REST_Response(['clases' => $claseModel->obtenerSemana($centroId, $semana)]);
    }

    public function generarCalendario(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);

        /* TO-DO: Implementar llamada al CalendarEngine */
        return new \WP_REST_Response(['exito' => true, 'clases' => [], 'conflictos' => []]);
    }

    public function obtenerDashboard(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        return new \WP_REST_Response($capService->getDashboardResumen());
    }

    /**
     * Registra un nuevo usuario con rol cap_admin y crea su centro
     */
    public function registrarUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        $datos = $request->get_json_params();

        /* Validación de campos obligatorios */
        $requeridos = ['nombreCentro', 'nombreUsuario', 'email', 'password'];
        foreach ($requeridos as $campo) {
            if (empty($datos[$campo])) {
                return new \WP_REST_Response([
                    'error' => true,
                    'message' => "El campo {$campo} es obligatorio"
                ], 400);
            }
        }

        $nombreUsuario = sanitize_user($datos['nombreUsuario']);
        $email = sanitize_email($datos['email']);
        $password = $datos['password'];
        $nombreCentro = sanitize_text_field($datos['nombreCentro']);

        /* Validar que el usuario no exista */
        if (username_exists($nombreUsuario)) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'El nombre de usuario ya está en uso'
            ], 409);
        }

        if (email_exists($email)) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'El correo electrónico ya está registrado'
            ], 409);
        }

        /* Validar longitud de contraseña */
        if (strlen($password) < 8) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'La contraseña debe tener mínimo 8 caracteres'
            ], 400);
        }

        /* Crear usuario WordPress */
        $userId = wp_create_user($nombreUsuario, $password, $email);

        if (is_wp_error($userId)) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => $userId->get_error_message()
            ], 500);
        }

        /* Asignar rol cap_admin */
        $user = new \WP_User($userId);
        $user->set_role('cap_admin');

        /* Crear centro asociado */
        global $wpdb;
        $tablaCentros = $wpdb->prefix . 'cap_centros';

        $wpdb->insert($tablaCentros, [
            'user_id' => $userId,
            'nombre' => $nombreCentro,
            'email' => $email,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);

        $centroId = $wpdb->insert_id;

        /* Crear configuración por defecto del centro */
        $tablaConfig = $wpdb->prefix . 'cap_configuracion';
        $wpdb->insert($tablaConfig, [
            'centro_id' => $centroId,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);

        /* Crear suscripción inicial (trial) */
        $tablaSuscripciones = $wpdb->prefix . 'cap_suscripciones';
        $wpdb->insert($tablaSuscripciones, [
            'centro_id' => $centroId,
            'estado' => 'activa',
            'fecha_inicio' => current_time('mysql'),
            'fecha_fin' => date('Y-m-d', strtotime('+14 days')),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);

        /* Enviar email de bienvenida (opcional) */
        $asunto = 'Bienvenido a la plataforma CAP';
        $mensaje = sprintf(
            "Hola %s,\n\nTu cuenta ha sido creada exitosamente.\n\nCentro: %s\nUsuario: %s\n\n¡Gracias por registrarte!",
            $nombreUsuario,
            $nombreCentro,
            $nombreUsuario
        );
        wp_mail($email, $asunto, $mensaje);

        return new \WP_REST_Response([
            'exito' => true,
            'message' => 'Usuario registrado correctamente',
            'userId' => $userId,
            'centroId' => $centroId
        ], 201);
    }

    /**
     * Obtiene la disponibilidad horaria de un alumno
     */
    public function obtenerDisponibilidad(\WP_REST_Request $request): \WP_REST_Response
    {
        $alumnoId = (int) $request->get_param('alumnoId');

        if (!$alumnoId) {
            return new \WP_REST_Response(['error' => 'ID de alumno requerido'], 400);
        }

        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_disponibilidad';

        $slots = $wpdb->get_results($wpdb->prepare(
            "SELECT dia, hora, disponible FROM {$tabla} WHERE alumno_id = %d",
            $alumnoId
        ), ARRAY_A);

        /* Convertir disponible a boolean */
        $slotsFormateados = array_map(function ($slot) {
            return [
                'dia' => $slot['dia'],
                'hora' => $slot['hora'],
                'disponible' => (bool) $slot['disponible']
            ];
        }, $slots);

        return new \WP_REST_Response(['slots' => $slotsFormateados]);
    }

    /**
     * Guarda la disponibilidad horaria de un alumno
     */
    public function guardarDisponibilidad(\WP_REST_Request $request): \WP_REST_Response
    {
        $alumnoId = (int) $request->get_param('alumnoId');
        $datos = $request->get_json_params();

        if (!$alumnoId) {
            return new \WP_REST_Response(['error' => 'ID de alumno requerido'], 400);
        }

        if (!isset($datos['slots']) || !is_array($datos['slots'])) {
            return new \WP_REST_Response(['error' => 'Datos de slots requeridos'], 400);
        }

        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_disponibilidad';

        /* Eliminar disponibilidad anterior del alumno */
        $wpdb->delete($tabla, ['alumno_id' => $alumnoId]);

        /* Insertar nuevos slots */
        $diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

        foreach ($datos['slots'] as $slot) {
            if (!isset($slot['dia']) || !isset($slot['hora'])) {
                continue;
            }

            $dia = sanitize_text_field($slot['dia']);
            $hora = sanitize_text_field($slot['hora']);
            $disponible = isset($slot['disponible']) ? (bool) $slot['disponible'] : true;

            /* Validar día */
            if (!in_array($dia, $diasValidos)) {
                continue;
            }

            /* Validar formato de hora (HH:MM) */
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $hora)) {
                continue;
            }

            $wpdb->insert($tabla, [
                'alumno_id' => $alumnoId,
                'dia' => $dia,
                'hora' => $hora,
                'disponible' => $disponible ? 1 : 0,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql'),
            ]);
        }

        return new \WP_REST_Response(['exito' => true, 'message' => 'Disponibilidad guardada']);
    }
}
