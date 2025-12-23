<?php

namespace App\Api;

use App\Services\CompartirService;
use WP_REST_Request;
use WP_REST_Response;

class CompartirApiController
{
    private CompartirService $compartirService;

    public function __construct()
    {
        $this->compartirService = new CompartirService();
    }

    public function registerRoutes(): void
    {
        register_rest_route('glory/v1', '/compartir', [
            'methods' => 'POST',
            'callback' => [$this, 'compartirElemento'],
            'permission_callback' => [$this, 'checkPermission']
        ]);

        register_rest_route('glory/v1', '/compartir/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'dejarDeCompartir'],
            'permission_callback' => [$this, 'checkPermission']
        ]);

        register_rest_route('glory/v1', '/compartir/(?P<tipo>[a-zA-Z]+)/(?P<elemento_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'obtenerParticipantes'],
            'permission_callback' => [$this, 'checkPermission']
        ]);

        register_rest_route('glory/v1', '/compartir/conmigo/(?P<tipo>[a-zA-Z]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'obtenerCompartidosConmigo'],
            'permission_callback' => [$this, 'checkPermission']
        ]);
    }

    public function checkPermission(): bool
    {
        return is_user_logged_in();
    }

    public function compartirElemento(WP_REST_Request $request)
    {
        $usuarioId = get_current_user_id();
        $params = $request->get_json_params();

        $tipo = sanitize_text_field($params['tipo'] ?? '');
        $elementoId = (int)($params['elemento_id'] ?? 0);
        $companeroId = (int)($params['companero_id'] ?? 0);
        $rol = sanitize_text_field($params['rol'] ?? 'colaborador');

        if (!$tipo || !$elementoId || !$companeroId) {
            return new WP_REST_Response(['exito' => false, 'mensaje' => 'Faltan parámetros'], 400);
        }

        $resultado = $this->compartirService->compartirElemento($usuarioId, $tipo, $elementoId, $companeroId, $rol);

        return new WP_REST_Response($resultado, $resultado['exito'] ? 200 : 400);
    }

    public function dejarDeCompartir(WP_REST_Request $request)
    {
        $usuarioId = get_current_user_id();
        $compartidoId = (int)$request->get_param('id');

        $resultado = $this->compartirService->dejarDeCompartir($usuarioId, $compartidoId);

        return new WP_REST_Response($resultado, $resultado['exito'] ? 200 : 400);
    }

    public function obtenerParticipantes(WP_REST_Request $request)
    {
        $usuarioId = get_current_user_id();
        $tipo = $request->get_param('tipo');
        $elementoId = (int)$request->get_param('elemento_id');

        $participantes = $this->compartirService->obtenerParticipantes($usuarioId, $tipo, $elementoId);

        return new WP_REST_Response(['exito' => true, 'participantes' => $participantes], 200);
    }

    public function obtenerCompartidosConmigo(WP_REST_Request $request)
    {
        $usuarioId = get_current_user_id();
        $tipo = $request->get_param('tipo');

        $compartidos = $this->compartirService->obtenerDatosCompartidos($usuarioId, $tipo);

        return new WP_REST_Response(['exito' => true, 'items' => $compartidos], 200);
    }
}

/* Registrar rutas */
add_action('rest_api_init', function () {
    $controller = new CompartirApiController();
    $controller->registerRoutes();
});
