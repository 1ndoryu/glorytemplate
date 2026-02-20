<?php

/**
 * Endpoints REST API para progreso y diagnóstico de alumnos CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Models\Alumno;
use Glory\App\Database\Repositories\CapAlumnosRepository;
use Glory\App\Database\Repositories\CapAsistenciaRepository;
use App\Config\Schema\CapAsignaturasConstants;
use Glory\App\Api\Traits\ConCallbackSeguro;

class CapAlumnosProgresoEndpoints
{
    use ConCallbackSeguro;

    private const LOGS_ACTIVOS = false;

    private function registrarLog(string $mensaje): void
    {
        if (!self::LOGS_ACTIVOS) {
            return;
        }

        error_log($mensaje);
    }

    public function obtenerProgresoAlumno(\WP_REST_Request $request): \WP_REST_Response
    {
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
            $duplicados = CapAsistenciaRepository::contarDuplicadosPorAlumno($alumnoId);

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
        $alumnoId = (int) $request->get_param('id');
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $alumno = CapAlumnosRepository::buscarPorId($alumnoId);

        if (!$alumno || (int) $alumno['centro_id'] !== $centroId) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado en este centro'], 404);
        }

        $clasesRaw = CapAsistenciaRepository::obtenerClasesDeAlumno($alumnoId);
        $groupByCrudo = CapAsistenciaRepository::obtenerResumenPorAsignatura($alumnoId);
        $totalFlat = CapAsistenciaRepository::obtenerTotalHoras($alumnoId, false);
        $totalFlatCompletadas = CapAsistenciaRepository::obtenerTotalHoras($alumnoId, true);

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
