<?php

/**
 * Endpoints REST API para generación y consulta de calendario CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Services\CalendarEngine;
use Glory\App\Models\Alumno;
use Glory\App\Models\Clase;

class CapCalendarioGeneracionEndpoints
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
                error_log('[CAP REST Calendario] Error en ' . $metodo . ': ' . $error->getMessage());
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

    public function obtenerClases(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

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
        $fechaDesde = $datos['fechaDesde'] ?? null;

        $alumnoModel = new Alumno();

        if (empty($alumnosIds)) {
            $alumnos = $alumnoModel->obtenerPorCentro($centroId, ['limite' => 1000]);
            $alumnosIds = array_map(static fn($alumno) => (int) $alumno['id'], $alumnos);
        }

        $alumnoModel->recalcularProgresoAlumnos($alumnosIds);
        $alumnosIds = $alumnoModel->filtrarAlumnosNoCompletados($centroId, $alumnosIds, $semana);

        if (empty($alumnosIds)) {
            return new \WP_REST_Response([
                'exito' => false,
                'clases' => [],
                'conflictos' => [],
                'mensaje' => 'Todos los alumnos ya han completado las 35 horas del curso CAP.'
            ], 200);
        }

        $engine = new CalendarEngine($centroId);
        $resultado = $engine->generar($semana, $alumnosIds, $fechaDesde);

        if ($resultado['exito'] && !empty($alumnosIds)) {
            $alumnoModel->recalcularProgresoAlumnos($alumnosIds);
        }

        $statusCode = $resultado['exito'] ? 200 : 409;
        return new \WP_REST_Response($resultado, $statusCode);
    }

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

        if (empty($alumnosIds)) {
            $alumnoModel = new Alumno();
            $alumnos = $alumnoModel->obtenerPorCentro($centroId, ['limite' => 1000]);
            $alumnosIds = array_map(static fn($alumno) => (int) $alumno['id'], $alumnos);
        }

        $engine = new CalendarEngine($centroId);
        $preview = $engine->obtenerPreview($semana, $alumnosIds);

        return new \WP_REST_Response($preview);
    }

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

        $alumnoModel = new Alumno();

        if (empty($alumnosIds)) {
            $alumnos = $alumnoModel->obtenerPorCentro($centroId, ['limite' => 1000]);
            $alumnosIds = array_map(static fn($alumno) => (int) $alumno['id'], $alumnos);
        }

        $alumnoModel->recalcularProgresoAlumnos($alumnosIds);
        $alumnosIds = $alumnoModel->filtrarAlumnosNoCompletados($centroId, $alumnosIds, $semana);

        if (empty($alumnosIds)) {
            return new \WP_REST_Response([
                'exito' => false,
                'clases' => [],
                'conflictos' => [],
                'mensaje' => 'Todos los alumnos ya han completado las 35 horas del curso CAP.'
            ], 200);
        }

        $engine = new CalendarEngine($centroId);
        $resultado = $engine->generarConExclusiones($semana, $alumnosIds, $exclusiones);

        if ($resultado['exito'] && !empty($alumnosIds)) {
            $alumnoModel->recalcularProgresoAlumnos($alumnosIds);
        }

        $statusCode = $resultado['exito'] ? 200 : 409;
        return new \WP_REST_Response($resultado, $statusCode);
    }
}
