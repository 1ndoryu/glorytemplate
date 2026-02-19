<?php

/**
 * Endpoints REST API para reportes CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Models\Alumno;
use Glory\App\Services\CapService;
use Glory\App\Services\ReporteService;

class CapReportesEndpoints
{
    private function registrarLog(string $mensaje): void
    {
        error_log('[CAP Reportes] ' . $mensaje);
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
                $this->registrarLog('Error en ' . $metodo . ': ' . $error->getMessage());
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

    public function generarReportePlanAlumno(\WP_REST_Request $request): \WP_REST_Response
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

        $alumnoModel = new Alumno();
        $alumno = $alumnoModel->obtenerPorId($alumnoId);

        if (!$alumno) {
            return new \WP_REST_Response(['error' => 'Alumno no encontrado'], 404);
        }

        if ((int) $alumno['centro_id'] !== $centroId) {
            return new \WP_REST_Response(['error' => 'El alumno no pertenece a este centro'], 403);
        }

        if (!class_exists('Dompdf\\Options')) {
            return new \WP_REST_Response([
                'error' => 'Dompdf no está disponible. Ejecuta composer install en el tema.'
            ], 500);
        }

        try {
            ob_start();

            $reporteService = new ReporteService($centroId);
            $pdf = $reporteService->generarPlanAlumno($alumnoId);

            $output = ob_get_clean();
            if (!empty($output)) {
                $this->registrarLog('Output capturado antes del PDF: ' . substr($output, 0, 500));
            }

            if ($pdf === false) {
                return new \WP_REST_Response([
                    'error' => 'No se pudo generar el PDF. El alumno podría no tener datos suficientes.'
                ], 500);
            }

            if (empty($pdf)) {
                return new \WP_REST_Response([
                    'error' => 'El PDF generado está vacío'
                ], 500);
            }

            $nombreArchivo = 'plan-formacion-' . sanitize_file_name($alumno['nombre']) . '.pdf';

            return new \WP_REST_Response([
                'exito' => true,
                'pdf' => base64_encode($pdf),
                'nombre' => $nombreArchivo,
                'tipo' => 'application/pdf'
            ]);
        } catch (\Throwable $error) {
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
            $this->registrarLog('Error (plan-alumno): ' . $error->getMessage() . ' | Trace: ' . $error->getTraceAsString());
            return new \WP_REST_Response([
                'error' => 'Error al generar el PDF: ' . $error->getMessage()
            ], 500);
        }
    }

    public function generarReporteControlHoras(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        try {
            $semana = $request->get_param('semana');
            if (!$semana) {
                $hoy = new \DateTime();
                $diaSemana = (int) $hoy->format('N');
                $diasHastaLunes = $diaSemana - 1;
                $semana = $hoy->modify("-{$diasHastaLunes} days")->format('Y-m-d');
            }

            $reporteService = new ReporteService($centroId);
            $pdf = $reporteService->generarControlHoras($semana);

            $nombreArchivo = 'control-horas-' . $semana . '.pdf';

            if ($pdf === false || empty($pdf)) {
                return new \WP_REST_Response([
                    'error' => 'No se pudo generar el PDF de control de horas.'
                ], 500);
            }

            return new \WP_REST_Response([
                'exito' => true,
                'pdf' => base64_encode($pdf),
                'nombre' => $nombreArchivo,
                'tipo' => 'application/pdf'
            ]);
        } catch (\Throwable $error) {
            $this->registrarLog('Error (control-horas): ' . $error->getMessage());
            return new \WP_REST_Response(['error' => 'Error al generar el PDF: ' . $error->getMessage()], 500);
        }
    }
}
