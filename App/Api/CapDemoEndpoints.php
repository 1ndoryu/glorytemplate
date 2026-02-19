<?php

/**
 * Endpoints REST API para operaciones de demo CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Database\CapSeeder;
use Glory\App\Services\CapService;

class CapDemoEndpoints
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
                error_log('[CAP REST Demo] Error en ' . $metodo . ': ' . $error->getMessage());
                return new \WP_REST_Response(['error' => 'Error interno del servidor'], 500);
            }
        };
    }

    public function verificarPermisosAdmin(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        return in_array('administrator', $user->roles, true);
    }

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

    public function seedDatosDemo(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        if (!CapSeeder::estaPermitido()) {
            return new \WP_REST_Response(['error' => 'Modo demo no permitido en este entorno'], 403);
        }

        $seeder = new CapSeeder($centroId);
        $resultado = $seeder->seedAll();

        $statusCode = $resultado['exito'] ? 200 : 400;
        return new \WP_REST_Response($resultado, $statusCode);
    }

    public function limpiarDatosDemo(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        if (!CapSeeder::estaPermitido()) {
            return new \WP_REST_Response(['error' => 'Modo demo no permitido en este entorno'], 403);
        }

        $seeder = new CapSeeder($centroId);
        $resultado = $seeder->cleanAll();

        $statusCode = $resultado['exito'] ? 200 : 400;
        return new \WP_REST_Response($resultado, $statusCode);
    }
}
