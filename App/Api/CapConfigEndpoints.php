<?php

/**
 * Endpoints REST API para configuración y dashboard CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Configuracion;
use App\Config\Schema\_generated\CapSuscripcionesCols;

class CapConfigEndpoints
{
    public function callbackSeguro(string $metodo): callable
    {
        return function (\WP_REST_Request $request) use ($metodo): \WP_REST_Response {
            try {
                $respuesta = $this->{$metodo}($request);
                if ($respuesta instanceof \WP_REST_Response) {
                    return $respuesta;
                }

                return new \WP_REST_Response($respuesta);
            } catch (\Throwable $error) {
                error_log('[CAP REST Config] Error en ' . $metodo . ': ' . $error->getMessage());
                return new \WP_REST_Response(['error' => 'Error interno del servidor'], 500);
            }
        };
    }

    public function verificarPermisos(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        return in_array('cap_admin', $user->roles, true) || in_array('administrator', $user->roles, true);
    }

    public function obtenerConfig(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $configModel = new Configuracion();

        global $wpdb;
        $tablaSuscripciones = $wpdb->prefix . CapSuscripcionesCols::TABLA;
        $suscripcion = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tablaSuscripciones} WHERE centro_id = %d ORDER BY id DESC LIMIT 1",
            $centroId
        ), 'ARRAY_A');

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
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $datos = $request->get_json_params();
        $configModel = new Configuracion();

        if (isset($datos['config'])) {
            $configModel->guardar($centroId, $datos['config']);
        }
        if (isset($datos['centro'])) {
            $configModel->actualizarDatosCentro($centroId, $datos['centro']);
        }

        return new \WP_REST_Response(['exito' => true]);
    }

    public function obtenerDashboard(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        return new \WP_REST_Response($capService->getDashboardResumen());
    }
}
