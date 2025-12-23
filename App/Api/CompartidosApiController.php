<?php

/**
 * Compartidos API Controller
 *
 * Maneja los endpoints REST para el sistema de elementos compartidos.
 * Permite compartir tareas, proyectos y hábitos con miembros del equipo.
 *
 * Endpoints:
 * - POST   /wp-json/glory/v1/compartidos              → Compartir elemento
 * - GET    /wp-json/glory/v1/compartidos              → Obtener compartidos conmigo
 * - GET    /wp-json/glory/v1/compartidos/mis          → Obtener lo que yo he compartido
 * - GET    /wp-json/glory/v1/compartidos/participantes/{tipo}/{id} → Participantes de un elemento
 * - PUT    /wp-json/glory/v1/compartidos/{id}/rol     → Actualizar rol
 * - DELETE /wp-json/glory/v1/compartidos/{id}         → Dejar de compartir
 * - GET    /wp-json/glory/v1/compartidos/contadores   → Contadores para badges
 *
 * @package App\Api
 */

namespace App\Api;

use App\Services\CompartidosService;

class CompartidosApiController
{
    /* Registra los endpoints REST */
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    /* Define las rutas REST */
    public static function registerRoutes(): void
    {
        $namespace = 'glory/v1';

        /* POST /compartidos - Compartir elemento */
        register_rest_route($namespace, '/compartidos', [
            'methods' => 'POST',
            'callback' => [self::class, 'compartir'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'tipo' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito']
                ],
                'elementoId' => [
                    'required' => true,
                    'type' => 'integer'
                ],
                'usuarioId' => [
                    'required' => true,
                    'type' => 'integer'
                ],
                'rol' => [
                    'required' => false,
                    'type' => 'string',
                    'enum' => ['colaborador', 'observador'],
                    'default' => 'colaborador'
                ]
            ]
        ]);

        /* GET /compartidos - Elementos compartidos conmigo */
        register_rest_route($namespace, '/compartidos', [
            'methods' => 'GET',
            'callback' => [self::class, 'obtenerCompartidosConmigo'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'tipo' => [
                    'required' => false,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito']
                ]
            ]
        ]);

        /* GET /compartidos/mis - Elementos que yo he compartido */
        register_rest_route($namespace, '/compartidos/mis', [
            'methods' => 'GET',
            'callback' => [self::class, 'obtenerMisCompartidos'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'tipo' => [
                    'required' => false,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito']
                ]
            ]
        ]);

        /* GET /compartidos/participantes/{tipo}/{elementoId} */
        register_rest_route($namespace, '/compartidos/participantes/(?P<tipo>[a-z]+)/(?P<elementoId>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'obtenerParticipantes'],
            'permission_callback' => [self::class, 'requireAuthentication']
        ]);

        /* PUT /compartidos/{id}/rol - Actualizar rol */
        register_rest_route($namespace, '/compartidos/(?P<id>\d+)/rol', [
            'methods' => 'PUT',
            'callback' => [self::class, 'actualizarRol'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'rol' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['colaborador', 'observador']
                ]
            ]
        ]);

        /* DELETE /compartidos/{id} */
        register_rest_route($namespace, '/compartidos/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'eliminar'],
            'permission_callback' => [self::class, 'requireAuthentication']
        ]);

        /* GET /compartidos/contadores - Para badges */
        register_rest_route($namespace, '/compartidos/contadores', [
            'methods' => 'GET',
            'callback' => [self::class, 'obtenerContadores'],
            'permission_callback' => [self::class, 'requireAuthentication']
        ]);

        /* GET /compartidos/acceso/{tipo}/{elementoId}/{propietarioId} - Verificar acceso */
        register_rest_route($namespace, '/compartidos/acceso/(?P<tipo>[a-z]+)/(?P<elementoId>\d+)/(?P<propietarioId>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'verificarAcceso'],
            'permission_callback' => [self::class, 'requireAuthentication']
        ]);
    }

    /* Verifica que el usuario esté autenticado */
    public static function requireAuthentication(): bool
    {
        return is_user_logged_in();
    }

    /* POST /compartidos - Compartir un elemento */
    public static function compartir(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuarioId = get_current_user_id();
        $tipo = sanitize_text_field($request->get_param('tipo'));
        $elementoId = (int) $request->get_param('elementoId');
        $usuarioDestinoId = (int) $request->get_param('usuarioId');
        $rol = sanitize_text_field($request->get_param('rol') ?? 'colaborador');

        $servicio = new CompartidosService();
        $resultado = $servicio->compartir($usuarioId, $tipo, $elementoId, $usuarioDestinoId, $rol);

        if (!$resultado['exito']) {
            return new \WP_REST_Response([
                'exito' => false,
                'error' => $resultado['error']
            ], 400);
        }

        return new \WP_REST_Response([
            'exito' => true,
            'compartido' => $resultado['compartido']
        ], 201);
    }

    /* GET /compartidos - Obtener elementos compartidos conmigo */
    public static function obtenerCompartidosConmigo(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuarioId = get_current_user_id();
        $tipo = $request->get_param('tipo');

        $servicio = new CompartidosService();
        $compartidos = $servicio->obtenerCompartidosConmigo($usuarioId, $tipo);

        return new \WP_REST_Response([
            'exito' => true,
            'compartidos' => $compartidos
        ], 200);
    }

    /* GET /compartidos/mis - Obtener lo que yo he compartido */
    public static function obtenerMisCompartidos(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuarioId = get_current_user_id();
        $tipo = $request->get_param('tipo');

        $servicio = new CompartidosService();
        $compartidos = $servicio->obtenerMisCompartidos($usuarioId, $tipo);

        return new \WP_REST_Response([
            'exito' => true,
            'compartidos' => $compartidos
        ], 200);
    }

    /* GET /compartidos/participantes/{tipo}/{elementoId} */
    public static function obtenerParticipantes(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuarioId = get_current_user_id();
        $tipo = sanitize_text_field($request->get_param('tipo'));
        $elementoId = (int) $request->get_param('elementoId');

        $servicio = new CompartidosService();
        $participantes = $servicio->obtenerParticipantes($tipo, $elementoId, $usuarioId);

        return new \WP_REST_Response([
            'exito' => true,
            'participantes' => $participantes
        ], 200);
    }

    /* PUT /compartidos/{id}/rol - Actualizar rol de un participante */
    public static function actualizarRol(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuarioId = get_current_user_id();
        $compartidoId = (int) $request->get_param('id');
        $nuevoRol = sanitize_text_field($request->get_param('rol'));

        $servicio = new CompartidosService();
        $resultado = $servicio->actualizarRol($compartidoId, $usuarioId, $nuevoRol);

        if (!$resultado['exito']) {
            return new \WP_REST_Response([
                'exito' => false,
                'error' => $resultado['error']
            ], 400);
        }

        return new \WP_REST_Response(['exito' => true], 200);
    }

    /* DELETE /compartidos/{id} - Eliminar un compartido */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuarioId = get_current_user_id();
        $compartidoId = (int) $request->get_param('id');

        $servicio = new CompartidosService();
        $resultado = $servicio->dejarDeCompartir($compartidoId, $usuarioId);

        if (!$resultado['exito']) {
            return new \WP_REST_Response([
                'exito' => false,
                'error' => $resultado['error']
            ], 400);
        }

        return new \WP_REST_Response(['exito' => true], 200);
    }

    /* GET /compartidos/contadores */
    public static function obtenerContadores(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuarioId = get_current_user_id();

        $servicio = new CompartidosService();
        $contadores = $servicio->contarCompartidosConmigo($usuarioId);

        return new \WP_REST_Response([
            'exito' => true,
            'contadores' => $contadores
        ], 200);
    }

    /* GET /compartidos/acceso/{tipo}/{elementoId}/{propietarioId} */
    public static function verificarAcceso(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuarioId = get_current_user_id();
        $tipo = sanitize_text_field($request->get_param('tipo'));
        $elementoId = (int) $request->get_param('elementoId');
        $propietarioId = (int) $request->get_param('propietarioId');

        $servicio = new CompartidosService();
        $acceso = $servicio->verificarAcceso($usuarioId, $tipo, $elementoId, $propietarioId);

        if ($acceso === false) {
            return new \WP_REST_Response([
                'exito' => false,
                'tieneAcceso' => false
            ], 200);
        }

        return new \WP_REST_Response([
            'exito' => true,
            'tieneAcceso' => true,
            'acceso' => $acceso
        ], 200);
    }
}

/* Registrar el controlador automáticamente */
CompartidosApiController::register();
