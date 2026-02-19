<?php

/**
 * Servicio de generación de reportes PDF para el módulo CAP
 * 
 * Genera reportes como:
 * - Plan individual del alumno
 * - Control de horas semanal
 * 
 * @package Glory\App\Services
 */

namespace Glory\App\Services;

use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapCentrosCols;
use App\Config\Schema\_generated\CapClasesCols;
use App\Config\Schema\_generated\CapConfiguracionCols;
use App\Config\Schema\_generated\CapDisponibilidadEnums;
use Glory\App\Models\Alumno;
use Glory\App\Models\Clase;

class ReporteService
{
    private $dompdf;
    private int $centroId;
    private string $timezone;
    private ReportePdfStyles $reportePdfStyles;
    private ReportePlanAlumnoHtmlBuilder $reportePlanAlumnoHtmlBuilder;
    private ReporteControlHorasHtmlBuilder $reporteControlHorasHtmlBuilder;

    public function __construct(int $centroId)
    {
        $this->centroId = $centroId;
        $this->reportePdfStyles = new ReportePdfStyles();
        $this->reportePlanAlumnoHtmlBuilder = new ReportePlanAlumnoHtmlBuilder();
        $this->reporteControlHorasHtmlBuilder = new ReporteControlHorasHtmlBuilder();
        $this->cargarTimezone();

        $optionsClass = '\\Dompdf\\Options';
        $dompdfClass = '\\Dompdf\\Dompdf';

        $options = new $optionsClass();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', false);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'sans-serif');

        $this->dompdf = new $dompdfClass($options);
        $this->dompdf->setPaper('A4', 'portrait');
    }

    /**
     * Carga y aplica la zona horaria del centro
     */
    private function cargarTimezone(): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapConfiguracionCols::TABLA;

        $config = $wpdb->get_row($wpdb->prepare(
            "SELECT timezone FROM {$tabla} WHERE centro_id = %d",
            $this->centroId
        ), 'ARRAY_A');

        $this->timezone = $config[CapConfiguracionCols::TIMEZONE] ?? 'Europe/Madrid';

        /* Aplicar timezone si es válida */
        if (in_array($this->timezone, timezone_identifiers_list(), true)) {
            date_default_timezone_set($this->timezone);
        } else {
            date_default_timezone_set('Europe/Madrid');
        }
    }

    /**
     * Genera el reporte de plan individual de un alumno
     * 
     * @param int $alumnoId ID del alumno
     * @return string|false PDF en formato string o false si falla
     */
    public function generarPlanAlumno(int $alumnoId): string|false
    {
        $alumnoModel = new Alumno();
        $alumno = $alumnoModel->obtenerPorId($alumnoId);

        if (!$alumno || (int)$alumno['centro_id'] !== $this->centroId) {
            return false;
        }

        /* Obtener progreso por asignatura */
        $progreso = $alumnoModel->obtenerProgreso($alumnoId);

        /* Obtener clases asignadas al alumno */
        $clases = $this->obtenerClasesAlumno($alumnoId);

        /* Obtener datos del centro */
        $centro = $this->obtenerDatosCentro();

        $html = $this->reportePlanAlumnoHtmlBuilder->construir(
            $alumno,
            $progreso,
            $clases,
            $centro,
            $this->reportePdfStyles->obtener()
        );

        try {
            /* Renderizar PDF */
            $this->dompdf->loadHtml($html);
            $this->dompdf->render();

            return $this->dompdf->output();
        } catch (\Throwable $e) {
            error_log('CAP PDF Error (reporte-plan): ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Genera el reporte de control de horas semanal
     * 
     * @param string $fechaSemana Fecha del lunes de la semana (Y-m-d)
     * @return string PDF en formato string
     */
    public function generarControlHoras(string $fechaSemana): string
    {
        $claseModel = new Clase();
        $clases = $claseModel->obtenerSemana($this->centroId, $fechaSemana);

        /* Agrupar clases por día */
        $clasesPorDia = $this->agruparClasesPorDia($clases);

        /* Obtener datos del centro */
        $centro = $this->obtenerDatosCentro();

        $html = $this->reporteControlHorasHtmlBuilder->construir(
            $clasesPorDia,
            $fechaSemana,
            $centro,
            $this->reportePdfStyles->obtener()
        );

        try {
            $this->dompdf->loadHtml($html);
            $this->dompdf->render();

            return $this->dompdf->output();
        } catch (\Throwable $e) {
            error_log('CAP PDF Error (control-horas): ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Obtiene las clases asignadas a un alumno
     */
    private function obtenerClasesAlumno(int $alumnoId): array
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        return $wpdb->get_results($wpdb->prepare(
            "SELECT c.*, a.asistio
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d
             ORDER BY c.fecha ASC, c.hora_inicio ASC",
            $alumnoId
        ), 'ARRAY_A') ?: [];
    }

    /**
     * Obtiene datos del centro
     */
    private function obtenerDatosCentro(): array
    {
        global $wpdb;
        $tablaCentros = $wpdb->prefix . CapCentrosCols::TABLA;

        $centro = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tablaCentros} WHERE id = %d",
            $this->centroId
        ), 'ARRAY_A');

        return $centro ?: [
            'nombre' => 'Centro CAP',
            'direccion' => '',
            'telefono' => '',
            'email' => ''
        ];
    }

    /**
     * Agrupa las clases por día de la semana
     */
    private function agruparClasesPorDia(array $clases): array
    {
        $dias = [
            CapDisponibilidadEnums::DIA_LUNES => [],
            CapDisponibilidadEnums::DIA_MARTES => [],
            CapDisponibilidadEnums::DIA_MIERCOLES => [],
            CapDisponibilidadEnums::DIA_JUEVES => [],
            CapDisponibilidadEnums::DIA_VIERNES => []
        ];

        foreach ($clases as $clase) {
            $diaSemana = strtolower(date('l', strtotime($clase['fecha'])));
            $diaMap = [
                'monday' => CapDisponibilidadEnums::DIA_LUNES,
                'tuesday' => CapDisponibilidadEnums::DIA_MARTES,
                'wednesday' => CapDisponibilidadEnums::DIA_MIERCOLES,
                'thursday' => CapDisponibilidadEnums::DIA_JUEVES,
                'friday' => CapDisponibilidadEnums::DIA_VIERNES
            ];

            $dia = $diaMap[$diaSemana] ?? CapDisponibilidadEnums::DIA_LUNES;
            $dias[$dia][] = $clase;
        }

        return $dias;
    }

}
