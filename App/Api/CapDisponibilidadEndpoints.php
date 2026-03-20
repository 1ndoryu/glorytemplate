<?php

/**
 * Endpoints REST API para disponibilidad de alumnos CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use Glory\App\Database\Repositories\CapDisponibilidadRepository;
use App\Config\Schema\_generated\CapDisponibilidadCols;
use App\Config\Schema\_generated\CapDisponibilidadEnums;
use Glory\App\Api\Traits\ConCallbackSeguro;

class CapDisponibilidadEndpoints
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

    public function obtenerDisponibilidad(\WP_REST_Request $request): \WP_REST_Response
    {
        $alumnoId = (int) $request->get_param('alumnoId');
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        if (!$alumnoId) {
            return new \WP_REST_Response(['error' => 'ID de alumno requerido'], 400);
        }

        if (!$this->obtenerAlumnoDelCentro($alumnoId, $centroId)) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado'], 404);
        }

        $slots = CapDisponibilidadRepository::buscarSlotsPorAlumno($alumnoId);

        $slotsFormateados = array_map(static function ($slot) {
            return [
                'dia' => $slot['dia'],
                'hora' => $slot['hora'],
                'disponible' => (bool) $slot['disponible']
            ];
        }, $slots);

        return new \WP_REST_Response(['slots' => $slotsFormateados]);
    }

    public function guardarDisponibilidad(\WP_REST_Request $request): \WP_REST_Response
    {
        $alumnoId = (int) $request->get_param('alumnoId');
        $datos = $request->get_json_params();
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        if (!$alumnoId) {
            return new \WP_REST_Response(['error' => 'ID de alumno requerido'], 400);
        }

        if (!$this->obtenerAlumnoDelCentro($alumnoId, $centroId)) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado'], 404);
        }

        if (!isset($datos['slots']) || !is_array($datos['slots'])) {
            return new \WP_REST_Response(['error' => 'Datos de slots requeridos'], 400);
        }

        /* Transacción: DELETE slots anteriores + INSERT nuevos deben ser atómicos */
        global $wpdb;
        $wpdb->query('START TRANSACTION');

        if (!CapDisponibilidadRepository::eliminarPorAlumno($alumnoId)) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'No se pudo limpiar la disponibilidad anterior'], 500);
        }

        $diasValidos = [
            CapDisponibilidadEnums::DIA_LUNES,
            CapDisponibilidadEnums::DIA_MARTES,
            CapDisponibilidadEnums::DIA_MIERCOLES,
            CapDisponibilidadEnums::DIA_JUEVES,
            CapDisponibilidadEnums::DIA_VIERNES,
        ];

        /* [2003A-4] Optimizado: validar todos los slots y hacer batch INSERT
         * en vez de INSERT individual por slot (N+1 → 1 query). */
        $slotsValidados = [];
        $ahora = current_time('mysql');

        foreach ($datos['slots'] as $slot) {
            if (!isset($slot['dia']) || !isset($slot['hora'])) {
                continue;
            }

            $dia = sanitize_text_field($slot['dia']);
            $hora = sanitize_text_field($slot['hora']);
            $disponible = isset($slot['disponible']) ? (bool) $slot['disponible'] : true;

            if (!in_array($dia, $diasValidos, true)) {
                continue;
            }

            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $hora)) {
                continue;
            }

            $slotsValidados[] = [
                'alumno_id' => $alumnoId,
                'dia' => $dia,
                'hora' => $hora,
                'disponible' => $disponible ? 1 : 0,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        if (!empty($slotsValidados)) {
            if (!CapDisponibilidadRepository::insertarLote($slotsValidados)) {
                $wpdb->query('ROLLBACK');
                return new \WP_REST_Response(['error' => 'No se pudo guardar la disponibilidad'], 500);
            }
        }

        $wpdb->query('COMMIT');
        return new \WP_REST_Response(['exito' => true, 'message' => 'Disponibilidad guardada']);
    }
}
