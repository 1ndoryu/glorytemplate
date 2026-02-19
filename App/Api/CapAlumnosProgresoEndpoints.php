<?php

/**
 * Endpoints REST API para progreso y diagnóstico de alumnos CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use App\Config\Schema\_generated\CapAlumnosCols;
use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;
use App\Config\Schema\CapAsignaturasConstants;

class CapAlumnosProgresoEndpoints
{
    private const LOGS_ACTIVOS = false;

    private function registrarLog(string $mensaje): void
    {
        if (!self::LOGS_ACTIVOS) {
            return;
        }

        error_log($mensaje);
    }

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
                error_log('[CAP REST Progreso] Error en ' . $metodo . ': ' . $error->getMessage());
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

    public function verificarPermisosAdmin(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        return in_array('administrator', $user->roles, true);
    }

    public function obtenerProgresoAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;

        $alumnoId = (int) $request->get_param('id');
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $alumnoModel = new Alumno();
        $alumno = $alumnoModel->obtenerPorId($alumnoId);

        if (!$alumno || (int) $alumno['centro_id'] !== $centroId) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado'], 404);
        }

        $debugProgreso = (defined('WP_DEBUG') && WP_DEBUG) || ((int) $request->get_param('debug') === 1);

        if ($debugProgreso) {
            $this->registrarLog("=== PROGRESO ALUMNO #{$alumnoId} ({$alumno['nombre']}) ===");
        }

        $normalizados = $alumnoModel->normalizarAsignaturasEnBD($centroId);

        if ($debugProgreso && $normalizados > 0) {
            $this->registrarLog("  [NORM] {$normalizados} clases normalizadas en BD");
        }

        $progresoCompletado = $alumnoModel->obtenerProgreso($alumnoId);
        $progresoAsignado = $alumnoModel->obtenerProgresoAsignado($alumnoId);

        if ($debugProgreso) {
            $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;

            $duplicados = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM (
                    SELECT clase_id, alumno_id, COUNT(*) as cnt
                    FROM {$tablaAsistencia}
                    WHERE alumno_id = %d
                    GROUP BY clase_id, alumno_id
                    HAVING cnt > 1
                ) as dupes",
                $alumnoId
            ));

            if ($duplicados > 0) {
                $this->registrarLog("  [ALERTA] {$duplicados} pares duplicados en cap_asistencia para alumno #{$alumnoId}");
            }

            $this->registrarLog('  [NORMALIZADO] progresoAsignado:');
            foreach ($progresoAsignado as $fila) {
                $this->registrarLog("    - {$fila['asignatura']}: {$fila['horas']}h asignadas");
            }

            $this->registrarLog('  [NORMALIZADO] progresoCompletado:');
            foreach ($progresoCompletado as $fila) {
                $this->registrarLog("    - {$fila['asignatura']}: {$fila['horas']}h completadas");
            }
        }

        $horasCompletadas = 0;
        foreach ($progresoCompletado as $fila) {
            $horasCompletadas += (float) $fila['horas'];
        }
        $horasCompletadas = round($horasCompletadas, 2);

        $horasAsignadas = 0;
        foreach ($progresoAsignado as $fila) {
            $horasAsignadas += (float) $fila['horas'];
        }
        $horasAsignadas = round($horasAsignadas, 2);

        if ($debugProgreso) {
            $requeridas = CapAsignaturasConstants::HORAS_REQUERIDAS;

            $this->registrarLog('  [COMPARACION] Asignadas vs requeridas por asignatura:');
            foreach ($requeridas as $codigo => $horasReq) {
                $horasAsig = 0.0;
                foreach ($progresoAsignado as $fila) {
                    if ($fila['asignatura'] === $codigo) {
                        $horasAsig = (float) $fila['horas'];
                        break;
                    }
                }

                $diff = round($horasAsig - $horasReq, 2);
                $estado = $diff >= 0 ? 'OK' : 'FALTANTE';
                $this->registrarLog("    - {$codigo}: asignadas={$horasAsig}h, requeridas={$horasReq}h, diff={$diff}h [{$estado}]");
            }

            $this->registrarLog("  [RESULTADO] horasCompletadas={$horasCompletadas}h, horasAsignadas={$horasAsignadas}h");
            $this->registrarLog("=== FIN PROGRESO ALUMNO #{$alumnoId} ===");
        }

        $alumnoModel->actualizar($alumnoId, ['horas_completadas' => $horasCompletadas]);

        return new \WP_REST_Response([
            'alumnoId' => $alumnoId,
            'horasCompletadas' => $horasCompletadas,
            'horasAsignadas' => $horasAsignadas,
            'horasTotales' => 35,
            'porcentajeCompletadas' => min(100, round(($horasCompletadas / 35) * 100, 1)),
            'porcentajeAsignadas' => min(100, round(($horasAsignadas / 35) * 100, 1)),
            'asignaturas' => $progresoCompletado,
            'asignaturasCompletadas' => $progresoCompletado,
            'asignaturasAsignadas' => $progresoAsignado
        ]);
    }

    public function debugProgresoAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;

        $alumnoId = (int) $request->get_param('id');
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
        $tablaAlumnos = $wpdb->prefix . CapAlumnosCols::TABLA;

        $alumno = $wpdb->get_row($wpdb->prepare(
            "SELECT id, nombre, horas_completadas, centro_id FROM {$tablaAlumnos} WHERE id = %d",
            $alumnoId
        ), 'ARRAY_A');

        if (!$alumno || (int) $alumno['centro_id'] !== $centroId) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado en este centro'], 404);
        }

        $clasesRaw = $wpdb->get_results($wpdb->prepare(
            "SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.asignatura,
                    c.duracion_minutos, c.bloqueada
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d
             ORDER BY c.fecha ASC, c.hora_inicio ASC",
            $alumnoId
        ), 'ARRAY_A');

        $groupByCrudo = $wpdb->get_results($wpdb->prepare(
            "SELECT c.asignatura, SUM(c.duracion_minutos) / 60 as horas, COUNT(*) as num_clases
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d
             GROUP BY c.asignatura",
            $alumnoId
        ), 'ARRAY_A');

        $totalFlat = (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d",
            $alumnoId
        ));

        $totalFlatCompletadas = (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d AND c.fecha <= CURDATE()",
            $alumnoId
        ));

        $alumnoModel = new Alumno();
        $progresoCompletado = $alumnoModel->obtenerProgreso($alumnoId);
        $progresoAsignado = $alumnoModel->obtenerProgresoAsignado($alumnoId);

        $sumaCompletadoNormalizado = 0;
        foreach ($progresoCompletado as $fila) {
            $sumaCompletadoNormalizado += (float) $fila['horas'];
        }

        $sumaAsignadoNormalizado = 0;
        foreach ($progresoAsignado as $fila) {
            $sumaAsignadoNormalizado += (float) $fila['horas'];
        }

        $codigosNoCanonicos = [];
        foreach ($groupByCrudo as $fila) {
            $canonico = Alumno::normalizarCodigoAsignatura($fila['asignatura']);
            if ($canonico !== $fila['asignatura']) {
                $codigosNoCanonicos[] = [
                    'original' => $fila['asignatura'],
                    'canonico' => $canonico,
                    'horas' => $fila['horas'],
                ];
            }
        }

        return new \WP_REST_Response([
            'alumno' => $alumno,
            'totalClases' => count($clasesRaw),
            'clasesDetalle' => $clasesRaw,
            'groupByCrudo' => $groupByCrudo,
            'totalFlatAsignadas' => round($totalFlat, 2),
            'totalFlatCompletadas' => round($totalFlatCompletadas, 2),
            'progresoNormalizadoCompletado' => $progresoCompletado,
            'progresoNormalizadoAsignado' => $progresoAsignado,
            'sumaCompletadoNormalizado' => round($sumaCompletadoNormalizado, 2),
            'sumaAsignadoNormalizado' => round($sumaAsignadoNormalizado, 2),
            'codigosNoCanonicos' => $codigosNoCanonicos,
            'diagnostico' => [
                'flatVsSumaAsignadas' => abs($totalFlat - $sumaAsignadoNormalizado) < 0.01
                    ? 'OK: Totales coinciden'
                    : 'ALERTA: Divergencia de ' . round(abs($totalFlat - $sumaAsignadoNormalizado), 2) . 'h',
                'flatVsSumaCompletadas' => abs($totalFlatCompletadas - $sumaCompletadoNormalizado) < 0.01
                    ? 'OK: Totales coinciden'
                    : 'ALERTA: Divergencia de ' . round(abs($totalFlatCompletadas - $sumaCompletadoNormalizado), 2) . 'h',
                'hayCodigosLegacy' => count($codigosNoCanonicos) > 0,
            ],
        ]);
    }
}
