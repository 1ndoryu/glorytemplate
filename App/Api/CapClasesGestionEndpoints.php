<?php

/**
 * Endpoints REST API para gestión de clases CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use Glory\App\Models\Clase;
use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;

class CapClasesGestionEndpoints
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
                error_log('[CAP REST Clases] Error en ' . $metodo . ': ' . $error->getMessage());
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

    private function normalizarAsignaturaParaPersistencia($asignatura): string
    {
        return Alumno::normalizarCodigoAsignatura(sanitize_text_field((string) $asignatura));
    }

    public function toggleBloqueoClase(\WP_REST_Request $request): \WP_REST_Response
    {
        $claseId = (int) $request->get_param('id');
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();
        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $claseModel = new Clase();
        $clase = $claseModel->obtenerPorId($claseId);
        if (!$clase || (int) $clase['centro_id'] !== $centroId) {
            return new \WP_REST_Response(['error' => 'Clase no encontrada'], 404);
        }

        if (!$claseModel->toggleBloqueo($claseId)) {
            return new \WP_REST_Response(['error' => 'Error al cambiar bloqueo'], 400);
        }

        return new \WP_REST_Response(['exito' => true]);
    }

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

        $clase = $claseModel->obtenerPorId($claseId);
        if (!$clase || (int) $clase['centro_id'] !== $centroId) {
            return new \WP_REST_Response(['error' => 'Clase no encontrada'], 404);
        }

        if ($clase['bloqueada']) {
            return new \WP_REST_Response(['error' => 'No se puede editar una clase bloqueada'], 400);
        }

        $datosActualizar = [];

        if (isset($datos['hora_inicio'])) {
            $datosActualizar[CapClasesCols::HORA_INICIO] = sanitize_text_field($datos['hora_inicio']);
        }
        if (isset($datos['hora_fin'])) {
            $datosActualizar[CapClasesCols::HORA_FIN] = sanitize_text_field($datos['hora_fin']);
        }
        if (isset($datos['asignatura'])) {
            $datosActualizar[CapClasesCols::ASIGNATURA] = $this->normalizarAsignaturaParaPersistencia($datos['asignatura']);
        }
        if (isset($datos['fecha'])) {
            $fecha = sanitize_text_field($datos['fecha']);
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                $datosActualizar[CapClasesCols::FECHA] = $fecha;
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

    public function eliminarClase(\WP_REST_Request $request): \WP_REST_Response
    {
        $claseId = (int) $request->get_param('id');
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $claseModel = new Clase();
        $clase = $claseModel->obtenerPorId($claseId);

        if (!$clase || (int) $clase['centro_id'] !== $centroId) {
            return new \WP_REST_Response(['error' => 'Clase no encontrada'], 404);
        }

        $forzar = $request->get_param('forzar') === 'true' || $request->get_param('forzar') === true;
        if ($clase['bloqueada'] && !$forzar) {
            return new \WP_REST_Response([
                'error' => 'La clase está bloqueada. Envía forzar=true para eliminarla igualmente.',
                'requiereConfirmacion' => true
            ], 409);
        }

        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        $alumnosAfectados = $wpdb->get_col($wpdb->prepare(
            "SELECT alumno_id FROM {$tablaAsistencia} WHERE clase_id = %d",
            $claseId
        ));

        /* Transacción: DELETE asistencias + DELETE clase deben ser atómicos */
        $wpdb->query('START TRANSACTION');

        $asistenciaEliminada = $wpdb->delete($tablaAsistencia, [CapAsistenciaCols::CLASE_ID => $claseId]);
        if ($asistenciaEliminada === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'Error al eliminar asistencias'], 500);
        }

        $eliminado = $wpdb->delete($tablaClases, [CapClasesCols::ID => $claseId]);
        if ($eliminado === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'Error al eliminar la clase'], 500);
        }

        $wpdb->query('COMMIT');

        if (!empty($alumnosAfectados)) {
            $alumnoModel = new Alumno();
            $alumnoModel->recalcularProgresoAlumnos($alumnosAfectados);
        }

        return new \WP_REST_Response(['exito' => true, 'mensaje' => 'Clase eliminada correctamente']);
    }

}
