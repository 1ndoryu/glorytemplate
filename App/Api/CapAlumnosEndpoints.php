<?php

/**
 * Endpoints REST API para gestión base de alumnos CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use Glory\App\Api\Traits\ConCallbackSeguro;

class CapAlumnosEndpoints
{
    use ConCallbackSeguro;

    
    private function obtenerAlumnoDelCentro(int $alumnoId, int $centroId): ?array
    {
        $alumnoModel = new Alumno();
        $alumno = $alumnoModel->obtenerPorId($alumnoId);
        if (!$alumno || (int) ($alumno['centro_id'] ?? 0) !== $centroId) {
            return null;
        }

        return $alumno;
    }

    
    public function listarAlumnos(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $alumnoModel = new Alumno();
        $idsParam = $request->get_param('ids');
        if (!empty($idsParam)) {
            return $this->listarAlumnosPorIds($request);
        }

        $opciones = [
            'limite' => absint($request->get_param('limite') ?? 50),
            'offset' => absint($request->get_param('offset') ?? 0),
            'busqueda' => sanitize_text_field($request->get_param('busqueda') ?? ''),
        ];

        return new \WP_REST_Response([
            'alumnos' => $alumnoModel->obtenerPorCentro($centroId, $opciones),
            'total' => $alumnoModel->contarPorCentro($centroId),
        ]);
    }

    public function listarAlumnosPorIds(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $idsParam = $request->get_param('ids');
        $ids = is_array($idsParam) ? $idsParam : explode(',', (string) $idsParam);
        $ids = array_values(array_unique(array_filter(array_map('absint', $ids))));

        $alumnoModel = new Alumno();
        $alumnos = $alumnoModel->obtenerPorIds($centroId, $ids);

        return new \WP_REST_Response([
            'alumnos' => $alumnos,
            'total' => count($alumnos),
        ]);
    }

    public function crearAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $alumnoModel = new Alumno();
        /* Filtrar solo campos permitidos del payload — prevenir inyección de campos */
        $datos = $this->filtrarCamposAlumno($request->get_json_params());
        $datos['centro_id'] = $centroId;

        $id = $alumnoModel->crear($datos);
        if (!$id) {
            return new \WP_REST_Response(['error' => 'Error al crear'], 400);
        }

        return new \WP_REST_Response(['alumno' => $alumnoModel->obtenerPorId($id)], 201);
    }

    public function actualizarAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $id = (int) $request->get_param('id');
        $alumnoModel = new Alumno();

        if (!$this->obtenerAlumnoDelCentro($id, $centroId)) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado'], 404);
        }

        if (!$alumnoModel->actualizar($id, $this->filtrarCamposAlumno($request->get_json_params()))) {
            return new \WP_REST_Response(['error' => 'Error al actualizar'], 400);
        }

        return new \WP_REST_Response(['alumno' => $alumnoModel->obtenerPorId($id)]);
    }

    public function eliminarAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $alumnoId = (int) $request->get_param('id');
        if (!$this->obtenerAlumnoDelCentro($alumnoId, $centroId)) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado'], 404);
        }

        $alumnoModel = new Alumno();
        if (!$alumnoModel->eliminar($alumnoId)) {
            return new \WP_REST_Response(['error' => 'Error al eliminar'], 400);
        }

        return new \WP_REST_Response(['exito' => true]);
    }

    /**
     * Filtra campos permitidos del payload de alumno.
     * Previene inyección de campos no esperados (centro_id, rol, etc.).
     */
    private function filtrarCamposAlumno(array $datos): array
    {
        $permitidos = ['nombre', 'email', 'telefono', 'dni', 'horas_completadas', 'estado'];
        return array_intersect_key($datos, array_flip($permitidos));
    }
}
