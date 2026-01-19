<?php

/**
 * Endpoints REST API para el módulo CAP
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Services\CalendarEngine;
use Glory\App\Services\ReporteService;
use Glory\App\Models\Alumno;
use Glory\App\Models\Clase;
use Glory\App\Models\Configuracion;
use Glory\App\Database\CapSeeder;

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

        /* Actualizar clase individual */
        register_rest_route(self::NAMESPACE, '/clases/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'actualizarClase'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/generar', [
            'methods' => 'POST',
            'callback' => [$this, 'generarCalendario'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);

        /* Preview antes de generar */
        register_rest_route(self::NAMESPACE, '/generar/preview', [
            'methods' => 'POST',
            'callback' => [$this, 'previewCalendario'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);

        /* Generar con exclusiones (resolver conflictos) */
        register_rest_route(self::NAMESPACE, '/generar/con-exclusiones', [
            'methods' => 'POST',
            'callback' => [$this, 'generarConExclusiones'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);

        /* Toggle bloqueo de clase */
        register_rest_route(self::NAMESPACE, '/clases/(?P<id>\d+)/toggle-bloqueo', [
            'methods' => 'POST',
            'callback' => [$this, 'toggleBloqueoClase'],
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

        /* Endpoints de modo demo (solo administradores) */
        register_rest_route(self::NAMESPACE, '/demo/status', [
            'methods' => 'GET',
            'callback' => [$this, 'obtenerEstadoDemo'],
            'permission_callback' => [$this, 'verificarPermisosAdmin'],
        ]);

        register_rest_route(self::NAMESPACE, '/demo/seed', [
            'methods' => 'POST',
            'callback' => [$this, 'seedDatosDemo'],
            'permission_callback' => [$this, 'verificarPermisosAdmin'],
        ]);

        register_rest_route(self::NAMESPACE, '/demo/clean', [
            'methods' => 'DELETE',
            'callback' => [$this, 'limpiarDatosDemo'],
            'permission_callback' => [$this, 'verificarPermisosAdmin'],
        ]);

        /* Endpoints de reportes PDF */
        register_rest_route(self::NAMESPACE, '/reportes/plan-alumno/(?P<alumnoId>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'generarReportePlanAlumno'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/reportes/control-horas', [
            'methods' => 'GET',
            'callback' => [$this, 'generarReporteControlHoras'],
            'permission_callback' => [$this, 'verificarPermisos'],
        ]);
    }

    public function verificarPermisos(): bool
    {
        if (!is_user_logged_in()) return false;
        $user = wp_get_current_user();
        return in_array('cap_admin', $user->roles) || in_array('administrator', $user->roles);
    }

    /**
     * Verifica que el usuario sea administrator (para modo demo)
     */
    public function verificarPermisosAdmin(): bool
    {
        if (!is_user_logged_in()) return false;
        $user = wp_get_current_user();
        return in_array('administrator', $user->roles);
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
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $datos = $request->get_json_params();
        $semana = $datos['semana'] ?? date('Y-m-d');
        $alumnosIds = $datos['alumnos'] ?? [];

        /* Si no se especifican alumnos, obtener todos los activos del centro */
        if (empty($alumnosIds)) {
            $alumnoModel = new Alumno();
            $alumnos = $alumnoModel->obtenerPorCentro($centroId, ['limite' => 1000]);
            $alumnosIds = array_map(fn($a) => (int) $a['id'], $alumnos);
        }

        $engine = new CalendarEngine($centroId);
        $resultado = $engine->generar($semana, $alumnosIds);

        $statusCode = $resultado['exito'] ? 200 : 409;
        return new \WP_REST_Response($resultado, $statusCode);
    }

    /**
     * Preview de generación (estadísticas antes de generar)
     */
    public function previewCalendario(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $datos = $request->get_json_params();
        $semana = $datos['semana'] ?? date('Y-m-d');
        $alumnosIds = $datos['alumnos'] ?? [];

        /* Si no se especifican alumnos, obtener todos los activos */
        if (empty($alumnosIds)) {
            $alumnoModel = new Alumno();
            $alumnos = $alumnoModel->obtenerPorCentro($centroId, ['limite' => 1000]);
            $alumnosIds = array_map(fn($a) => (int) $a['id'], $alumnos);
        }

        $engine = new CalendarEngine($centroId);
        $preview = $engine->obtenerPreview($semana, $alumnosIds);

        return new \WP_REST_Response($preview);
    }

    /**
     * Genera calendario con exclusiones para resolver conflictos de aforo
     */
    public function generarConExclusiones(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $datos = $request->get_json_params();
        $semana = $datos['semana'] ?? date('Y-m-d');
        $alumnosIds = $datos['alumnos'] ?? [];
        $exclusiones = $datos['exclusiones'] ?? [];

        if (empty($alumnosIds)) {
            $alumnoModel = new Alumno();
            $alumnos = $alumnoModel->obtenerPorCentro($centroId, ['limite' => 1000]);
            $alumnosIds = array_map(fn($a) => (int) $a['id'], $alumnos);
        }

        $engine = new CalendarEngine($centroId);
        $resultado = $engine->generarConExclusiones($semana, $alumnosIds, $exclusiones);

        $statusCode = $resultado['exito'] ? 200 : 409;
        return new \WP_REST_Response($resultado, $statusCode);
    }

    /**
     * Toggle bloqueo de una clase
     */
    public function toggleBloqueoClase(\WP_REST_Request $request): \WP_REST_Response
    {
        $claseId = (int) $request->get_param('id');
        $claseModel = new Clase();

        if (!$claseModel->toggleBloqueo($claseId)) {
            return new \WP_REST_Response(['error' => 'Error al cambiar bloqueo'], 400);
        }

        return new \WP_REST_Response(['exito' => true]);
    }

    /**
     * Actualiza una clase existente (hora, asignatura, fecha)
     */
    public function actualizarClase(\WP_REST_Request $request): \WP_REST_Response
    {
        $claseId = (int) $request->get_param('id');
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $datos = $request->get_json_params();
        $claseModel = new Clase();

        /* Verificar que la clase pertenece al centro */
        $clase = $claseModel->obtenerPorId($claseId);
        if (!$clase || (int)$clase['centro_id'] !== $centroId) {
            return new \WP_REST_Response(['error' => 'Clase no encontrada'], 404);
        }

        /* Verificar que la clase no esté bloqueada */
        if ($clase['bloqueada']) {
            return new \WP_REST_Response(['error' => 'No se puede editar una clase bloqueada'], 400);
        }

        /* Preparar datos para actualización */
        $datosActualizar = [];

        if (isset($datos['hora_inicio'])) {
            $datosActualizar['hora_inicio'] = sanitize_text_field($datos['hora_inicio']);
        }
        if (isset($datos['hora_fin'])) {
            $datosActualizar['hora_fin'] = sanitize_text_field($datos['hora_fin']);
        }
        if (isset($datos['asignatura'])) {
            $datosActualizar['asignatura'] = (int) $datos['asignatura'];
        }
        /* Soporte para cambio de fecha (drag & drop entre días) */
        if (isset($datos['fecha'])) {
            $fecha = sanitize_text_field($datos['fecha']);
            /* Validar formato de fecha YYYY-MM-DD */
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                $datosActualizar['fecha'] = $fecha;
            }
        }

        if (empty($datosActualizar)) {
            return new \WP_REST_Response(['error' => 'No hay datos para actualizar'], 400);
        }

        if (!$claseModel->actualizar($claseId, $datosActualizar)) {
            return new \WP_REST_Response(['error' => 'Error al actualizar la clase'], 400);
        }

        return new \WP_REST_Response([
            'exito' => true,
            'clase' => $claseModel->obtenerPorId($claseId)
        ]);
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

    /**
     * Obtiene el estado del modo demo
     */
    public function obtenerEstadoDemo(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $seeder = new CapSeeder($centroId);
        return new \WP_REST_Response($seeder->obtenerEstado());
    }

    /**
     * Pobla datos de demostración
     */
    public function seedDatosDemo(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $seeder = new CapSeeder($centroId);
        $resultado = $seeder->seedAll();

        $statusCode = $resultado['exito'] ? 200 : 400;
        return new \WP_REST_Response($resultado, $statusCode);
    }

    /**
     * Limpia datos de demostración
     */
    public function limpiarDatosDemo(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $seeder = new CapSeeder($centroId);
        $resultado = $seeder->cleanAll();

        $statusCode = $resultado['exito'] ? 200 : 400;
        return new \WP_REST_Response($resultado, $statusCode);
    }

    /**
     * Genera el reporte PDF del plan de formación de un alumno
     */
    public function generarReportePlanAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        $alumnoId = (int) $request->get_param('alumnoId');
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $reporteService = new ReporteService($centroId);
        $pdf = $reporteService->generarPlanAlumno($alumnoId);

        if ($pdf === false) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado o no pertenece al centro'], 404);
        }

        /* Obtener nombre del alumno para el archivo */
        $alumnoModel = new Alumno();
        $alumno = $alumnoModel->obtenerPorId($alumnoId);
        $nombreArchivo = 'plan-formacion-' . sanitize_file_name($alumno['nombre']) . '.pdf';

        /* Devolver PDF como respuesta binaria */
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $nombreArchivo . '"');
        header('Content-Length: ' . strlen($pdf));
        header('Cache-Control: private, max-age=0, must-revalidate');
        header('Pragma: public');

        echo $pdf;
        exit;
    }

    /**
     * Genera el reporte PDF de control de horas semanal
     */
    public function generarReporteControlHoras(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        /* Obtener fecha de la semana (lunes) */
        $semana = $request->get_param('semana');
        if (!$semana) {
            /* Calcular lunes de la semana actual */
            $hoy = new \DateTime();
            $diaSemana = (int) $hoy->format('N');
            $diasHastaLunes = $diaSemana - 1;
            $semana = $hoy->modify("-{$diasHastaLunes} days")->format('Y-m-d');
        }

        $reporteService = new ReporteService($centroId);
        $pdf = $reporteService->generarControlHoras($semana);

        $nombreArchivo = 'control-horas-' . $semana . '.pdf';

        /* Devolver PDF como respuesta binaria */
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $nombreArchivo . '"');
        header('Content-Length: ' . strlen($pdf));
        header('Cache-Control: private, max-age=0, must-revalidate');
        header('Pragma: public');

        echo $pdf;
        exit;
    }
}
