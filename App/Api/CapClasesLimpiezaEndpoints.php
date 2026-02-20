<?php

/**
 * Endpoints REST API para limpieza masiva de clases CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use Glory\App\Database\Repositories\CapAsistenciaRepository;
use Glory\App\Database\Repositories\CapClasesRepository;
use Glory\App\Api\Traits\ConCallbackSeguro;

class CapClasesLimpiezaEndpoints
{
    use ConCallbackSeguro;

    public function eliminarTodasLasClases(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $confirmacion = $request->get_param('confirmar');
        if ($confirmacion !== 'ELIMINAR_TODO') {
            return new \WP_REST_Response([
                'error' => 'Se requiere confirmación. Envía confirmar=ELIMINAR_TODO para proceder.',
                'requiereConfirmacion' => true
            ], 409);
        }

        $incluirBloqueadas = $request->get_param('incluirBloqueadas') === 'true' || $request->get_param('incluirBloqueadas') === true;

        $clasesIds = CapClasesRepository::buscarIdsPorCentro($centroId, $incluirBloqueadas);

        if (empty($clasesIds)) {
            return new \WP_REST_Response([
                'exito' => true,
                'mensaje' => 'No hay clases para eliminar',
                'eliminadas' => 0
            ]);
        }

        /* Transacción: DELETE asistencias + DELETE clases deben ser atómicos */
        global $wpdb;
        $wpdb->query('START TRANSACTION');

        if (!CapAsistenciaRepository::eliminarPorClaseIds($clasesIds)) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'No se pudieron eliminar asistencias'], 500);
        }

        $eliminadas = CapClasesRepository::eliminarPorCentro($centroId, $incluirBloqueadas);

        if ($eliminadas === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'No se pudieron eliminar clases'], 500);
        }

        $wpdb->query('COMMIT');

        $alumnoModel = new Alumno();
        $alumnoModel->recalcularProgresoCentro($centroId);

        return new \WP_REST_Response([
            'exito' => true,
            'mensaje' => "Se eliminaron {$eliminadas} clases",
            'eliminadas' => (int) $eliminadas
        ]);
    }

    public function eliminarClasesSemana(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $fecha = sanitize_text_field($request->get_param('fecha') ?? '');
        if (!$fecha) {
            return new \WP_REST_Response(['error' => 'Se requiere parámetro "fecha" (lunes de la semana)'], 400);
        }

        /* Validar formato de fecha antes de instanciar DateTime */
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            return new \WP_REST_Response(['error' => 'Formato de fecha inválido. Usar YYYY-MM-DD'], 400);
        }

        $inicio = new \DateTime($fecha);
        if ($inicio->format('N') != 1) {
            return new \WP_REST_Response(['error' => 'La fecha debe ser un lunes (formato YYYY-MM-DD)'], 400);
        }

        $fin = clone $inicio;
        $fin->modify('+6 days');
        $finDia = $fin->format('Y-m-d') . ' 23:59:59';

        $incluirBloqueadas = $request->get_param('incluirBloqueadas') === 'true' || $request->get_param('incluirBloqueadas') === true;

        $clasesIds = CapClasesRepository::buscarIdsPorCentroYSemana($centroId, $fecha, $finDia, $incluirBloqueadas);

        if (empty($clasesIds)) {
            return new \WP_REST_Response([
                'exito' => true,
                'mensaje' => 'No hay clases para eliminar en esta semana',
                'eliminadas' => 0
            ]);
        }

        /* Transacción: DELETE asistencias + DELETE clases deben ser atómicos */
        global $wpdb;
        $wpdb->query('START TRANSACTION');

        if (!CapAsistenciaRepository::eliminarPorClaseIds($clasesIds)) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'No se pudieron eliminar asistencias'], 500);
        }

        $eliminadas = CapClasesRepository::eliminarPorCentroYSemana($centroId, $fecha, $finDia, $incluirBloqueadas);

        if ($eliminadas === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'No se pudieron eliminar clases de la semana'], 500);
        }

        $wpdb->query('COMMIT');

        $alumnoModel = new Alumno();
        $alumnoModel->recalcularProgresoCentro($centroId);

        return new \WP_REST_Response([
            'exito' => true,
            'mensaje' => "Se eliminaron {$eliminadas} clases de la semana",
            'eliminadas' => (int) $eliminadas
        ]);
    }
}
