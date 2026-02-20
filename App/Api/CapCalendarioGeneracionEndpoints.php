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
use Glory\App\Api\Traits\ConCallbackSeguro;

class CapCalendarioGeneracionEndpoints
{
    use ConCallbackSeguro;

    public function obtenerClases(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $capService = CapService::getInstance();
            $centroId = $capService->getCentroIdActual();
            if (!$centroId) {
                return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
            }

            $claseModel = new Clase();
            $semana = $this->validarFecha($request->get_param('semana')) ?? date('Y-m-d');
            return new \WP_REST_Response(['clases' => $claseModel->obtenerSemana($centroId, $semana)]);
        } catch (\Throwable $e) {
            guardarLog('[CapCalendarioGeneracion::obtenerClases] ' . $e->getMessage(), 'error');
            return new \WP_REST_Response(['error' => 'Error al obtener las clases'], 500);
        }
    }

    public function generarCalendario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $capService = CapService::getInstance();
            $centroId = $capService->getCentroIdActual();
            if (!$centroId) {
                return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
            }

            $datos = $request->get_json_params();
            $semana = $this->validarFecha($datos['semana'] ?? null) ?? date('Y-m-d');
            $alumnosIds = $this->sanitizarIdsArray($datos['alumnos'] ?? []);
            $fechaDesde = $this->validarFecha($datos['fechaDesde'] ?? null);

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

            /* Siempre HTTP 200: conflictos de aforo son resultados esperados
             * que el frontend procesa via modal de resolucion. El campo 'exito'
             * en el body ya distingue exito vs conflictos. Usar 409 provocaba
             * que el frontend tratara la respuesta como error generico sin
             * mostrar el modal de conflictos. */
            return new \WP_REST_Response($resultado, 200);
        } catch (\Throwable $e) {
            guardarLog('[CapCalendarioGeneracion::generarCalendario] ' . $e->getMessage(), 'error');
            return new \WP_REST_Response(['error' => 'Error al generar el calendario'], 500);
        }
    }

    public function previewCalendario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $capService = CapService::getInstance();
            $centroId = $capService->getCentroIdActual();
            if (!$centroId) {
                return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
            }

            $datos = $request->get_json_params();
            $semana = $this->validarFecha($datos['semana'] ?? null) ?? date('Y-m-d');
            $alumnosIds = $this->sanitizarIdsArray($datos['alumnos'] ?? []);

            if (empty($alumnosIds)) {
                $alumnoModel = new Alumno();
                $alumnos = $alumnoModel->obtenerPorCentro($centroId, ['limite' => 1000]);
                $alumnosIds = array_map(static fn($alumno) => (int) $alumno['id'], $alumnos);
            }

            $engine = new CalendarEngine($centroId);
            $preview = $engine->obtenerPreview($semana, $alumnosIds);

            return new \WP_REST_Response($preview);
        } catch (\Throwable $e) {
            guardarLog('[CapCalendarioGeneracion::previewCalendario] ' . $e->getMessage(), 'error');
            return new \WP_REST_Response(['error' => 'Error al obtener el preview del calendario'], 500);
        }
    }

    public function generarConExclusiones(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $capService = CapService::getInstance();
            $centroId = $capService->getCentroIdActual();
            if (!$centroId) {
                return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
            }

            $datos = $request->get_json_params();
            $semana = $this->validarFecha($datos['semana'] ?? null) ?? date('Y-m-d');
            $alumnosIds = $this->sanitizarIdsArray($datos['alumnos'] ?? []);
            $exclusiones = $this->sanitizarExclusiones($datos['exclusiones'] ?? []);

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

            /* HTTP 200 incluso con conflictos: el frontend usa 'exito' del body */
            return new \WP_REST_Response($resultado, 200);
        } catch (\Throwable $e) {
            guardarLog('[CapCalendarioGeneracion::generarConExclusiones] ' . $e->getMessage(), 'error');
            return new \WP_REST_Response(['error' => 'Error al generar el calendario con exclusiones'], 500);
        }
    }

    /**
     * Valida que una fecha tenga formato YYYY-MM-DD.
     * Retorna la fecha sanitizada o null si es invalida.
     */
    private function validarFecha(?string $fecha): ?string
    {
        if ($fecha === null) {
            return null;
        }
        $fecha = sanitize_text_field($fecha);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            return null;
        }
        /* Verificar que la fecha sea real (ej: 2024-02-30 no existe) */
        $partes = explode('-', $fecha);
        if (!checkdate((int) $partes[1], (int) $partes[2], (int) $partes[0])) {
            return null;
        }
        return $fecha;
    }

    /**
     * Sanitiza un array de IDs: verifica que sea array y convierte a enteros positivos.
     * @param mixed $ids Valor recibido del request (puede no ser array)
     * @return int[] Array de IDs enteros positivos
     */
    private function sanitizarIdsArray($ids): array
    {
        if (!is_array($ids)) {
            return [];
        }
        return array_values(array_filter(
            array_map('absint', $ids),
            static fn(int $id) => $id > 0
        ));
    }

    /**
     * Sanitiza el mapa de exclusiones para generarConExclusiones.
     *
     * Formato esperado del frontend: { slotKey: number[] }
     * Donde slotKey tiene formato "YYYY-MM-DD_HH:MM" y el valor es un
     * array de IDs de alumnos a excluir de ese slot.
     *
     * CalendarEngine::generarConExclusiones itera este mapa:
     *   foreach ($exclusiones as $slotKey => $alumnosExcluidos)
     *
     * @param mixed $exclusiones Datos del request
     * @return array Mapa sanitizado de slotKey => int[]
     */
    private function sanitizarExclusiones($exclusiones): array
    {
        if (!is_array($exclusiones)) {
            return [];
        }

        $resultado = [];
        foreach ($exclusiones as $slotKey => $alumnosExcluidos) {
            /* Validar formato de slotKey: YYYY-MM-DD_HH:MM */
            $slotKeySanitizado = sanitize_text_field((string) $slotKey);
            if (!preg_match('/^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}$/', $slotKeySanitizado)) {
                continue;
            }

            if (!is_array($alumnosExcluidos)) {
                continue;
            }

            /* Sanitizar IDs de alumnos */
            $idsSanitizados = array_values(array_filter(
                array_map('absint', $alumnosExcluidos),
                static fn(int $id) => $id > 0
            ));

            if (!empty($idsSanitizados)) {
                $resultado[$slotKeySanitizado] = $idsSanitizados;
            }
        }

        return $resultado;
    }
}
