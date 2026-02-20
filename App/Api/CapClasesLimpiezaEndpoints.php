<?php

/**
 * Endpoints REST API para limpieza masiva de clases CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;
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

        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        $where = $incluirBloqueadas ? '' : ' AND bloqueada = 0';
        $clasesIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM {$tablaClases} WHERE centro_id = %d{$where}",
            $centroId
        ));

        if (empty($clasesIds)) {
            return new \WP_REST_Response([
                'exito' => true,
                'mensaje' => 'No hay clases para eliminar',
                'eliminadas' => 0
            ]);
        }

        /* Transacción: DELETE asistencias + DELETE clases deben ser atómicos */
        $wpdb->query('START TRANSACTION');

        /* Usar $wpdb->prepare para DELETE IN() — defensa en profundidad */
        $placeholders = implode(',', array_fill(0, count($clasesIds), '%d'));
        $resultadoAsistencia = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tablaAsistencia} WHERE clase_id IN ({$placeholders})",
            ...$clasesIds
        ));
        if ($resultadoAsistencia === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'No se pudieron eliminar asistencias'], 500);
        }

        $eliminadas = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tablaClases} WHERE centro_id = %d{$where}",
            $centroId
        ));

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

        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        $where = $incluirBloqueadas ? '' : ' AND bloqueada = 0';
        $clasesIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM {$tablaClases} WHERE centro_id = %d AND fecha >= %s AND fecha <= %s{$where}",
            $centroId,
            $fecha,
            $finDia
        ));

        if (empty($clasesIds)) {
            return new \WP_REST_Response([
                'exito' => true,
                'mensaje' => 'No hay clases para eliminar en esta semana',
                'eliminadas' => 0
            ]);
        }

        /* Transacción: DELETE asistencias + DELETE clases deben ser atómicos */
        $wpdb->query('START TRANSACTION');

        /* Usar $wpdb->prepare para DELETE IN() — defensa en profundidad */
        $placeholders = implode(',', array_fill(0, count($clasesIds), '%d'));
        $resultadoAsistencia = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tablaAsistencia} WHERE clase_id IN ({$placeholders})",
            ...$clasesIds
        ));
        if ($resultadoAsistencia === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response(['error' => 'No se pudieron eliminar asistencias'], 500);
        }

        $eliminadas = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tablaClases} WHERE centro_id = %d AND fecha >= %s AND fecha <= %s{$where}",
            $centroId,
            $fecha,
            $finDia
        ));

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
