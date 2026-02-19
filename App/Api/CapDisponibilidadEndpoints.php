<?php

/**
 * Endpoints REST API para disponibilidad de alumnos CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use App\Config\Schema\_generated\CapDisponibilidadCols;
use App\Config\Schema\_generated\CapDisponibilidadEnums;

class CapDisponibilidadEndpoints
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
                error_log('[CAP REST Disponibilidad] Error en ' . $metodo . ': ' . $error->getMessage());
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

        global $wpdb;
        $tabla = $wpdb->prefix . CapDisponibilidadCols::TABLA;

        $slots = $wpdb->get_results($wpdb->prepare(
            "SELECT dia, hora, disponible FROM {$tabla} WHERE alumno_id = %d",
            $alumnoId
        ), 'ARRAY_A');

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

        global $wpdb;
        $tabla = $wpdb->prefix . CapDisponibilidadCols::TABLA;

        $eliminado = $wpdb->delete($tabla, [CapDisponibilidadCols::ALUMNO_ID => $alumnoId]);
        if ($eliminado === false) {
            return new \WP_REST_Response(['error' => 'No se pudo limpiar la disponibilidad anterior'], 500);
        }

        $diasValidos = [
            CapDisponibilidadEnums::DIA_LUNES,
            CapDisponibilidadEnums::DIA_MARTES,
            CapDisponibilidadEnums::DIA_MIERCOLES,
            CapDisponibilidadEnums::DIA_JUEVES,
            CapDisponibilidadEnums::DIA_VIERNES,
        ];

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

            $insertado = $wpdb->insert($tabla, [
                CapDisponibilidadCols::ALUMNO_ID => $alumnoId,
                CapDisponibilidadCols::DIA => $dia,
                CapDisponibilidadCols::HORA => $hora,
                CapDisponibilidadCols::DISPONIBLE => $disponible ? 1 : 0,
                CapDisponibilidadCols::CREATED_AT => current_time('mysql'),
                CapDisponibilidadCols::UPDATED_AT => current_time('mysql'),
            ]);

            if ($insertado === false) {
                return new \WP_REST_Response(['error' => 'No se pudo guardar la disponibilidad'], 500);
            }
        }

        return new \WP_REST_Response(['exito' => true, 'message' => 'Disponibilidad guardada']);
    }
}
