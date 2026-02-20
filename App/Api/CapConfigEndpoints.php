<?php

/**
 * Endpoints REST API para configuración y dashboard CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Configuracion;
use Glory\App\Database\Repositories\CapSuscripcionesRepository;
use Glory\App\Api\Traits\ConCallbackSeguro;

class CapConfigEndpoints
{
    use ConCallbackSeguro;

    public function obtenerConfig(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $configModel = new Configuracion();

        $suscripcion = CapSuscripcionesRepository::buscarUltimaPorCentro($centroId);

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

        /* Solo pasar sub-objetos si son arrays validos; el modelo valida campos internos */
        if (isset($datos['config']) && is_array($datos['config'])) {
            $configModel->guardar($centroId, $datos['config']);
        }
        if (isset($datos['centro']) && is_array($datos['centro'])) {
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
