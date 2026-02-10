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

use Dompdf\Dompdf;
use Dompdf\Options;
use Glory\App\Models\Alumno;
use Glory\App\Models\Clase;
use Glory\App\Models\Configuracion;

class ReporteService
{
    private Dompdf $dompdf;
    private int $centroId;
    private string $timezone;

    /* Constantes de asignaturas para referencia */
    private const ASIGNATURAS = [
        'CR' => 'Conducción racional',
        'REG' => 'Reglamentación',
        'SV' => 'Seguridad vial',
        'SL' => 'Servicio y logística',
        'SS' => 'Salud y seguridad',
        'MA' => 'Medio ambiente',
        'MP' => 'Mercancías peligrosas',
        'VIA' => 'Viajeros'
    ];

    /* Códigos alias del seeder para normalizar */
    private const CODIGOS_ALIAS = [
        'racionalizacion' => 'CR',
        'conduccion_racional' => 'CR',
        'reglamentacion' => 'REG',
        'seguridad_vial' => 'SV',
        'servicio_logistica' => 'SL',
        'salud_ergonomia' => 'SS',
        'salud_seguridad' => 'SS',
        'entorno_economico' => 'MA',
        'medio_ambiente' => 'MA',
        'evaluacion' => 'VIA',
        'viajeros' => 'VIA',
        'mercancias_peligrosas' => 'MP'
    ];

    public function __construct(int $centroId)
    {
        $this->centroId = $centroId;
        $this->cargarTimezone();

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', false);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'sans-serif');

        $this->dompdf = new Dompdf($options);
        $this->dompdf->setPaper('A4', 'portrait');
    }

    /**
     * Carga y aplica la zona horaria del centro
     */
    private function cargarTimezone(): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_configuracion';

        $config = $wpdb->get_row($wpdb->prepare(
            "SELECT timezone FROM {$tabla} WHERE centro_id = %d",
            $this->centroId
        ), 'ARRAY_A');

        $this->timezone = $config['timezone'] ?? 'Europe/Madrid';

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

        /* Generar HTML del reporte */
        $html = $this->generarHtmlPlanAlumno($alumno, $progreso, $clases, $centro);

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

        /* Generar HTML del reporte */
        $html = $this->generarHtmlControlHoras($clasesPorDia, $fechaSemana, $centro);

        /* Renderizar PDF */
        $this->dompdf->loadHtml($html);
        $this->dompdf->render();

        return $this->dompdf->output();
    }

    /**
     * Obtiene las clases asignadas a un alumno
     */
    private function obtenerClasesAlumno(int $alumnoId): array
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT c.*, a.asistio
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d
             ORDER BY c.fecha ASC, c.hora_inicio ASC",
            $alumnoId
        ), ARRAY_A) ?: [];
    }

    /**
     * Obtiene datos del centro
     */
    private function obtenerDatosCentro(): array
    {
        global $wpdb;
        $tablaCentros = $wpdb->prefix . 'cap_centros';

        $centro = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tablaCentros} WHERE id = %d",
            $this->centroId
        ), ARRAY_A);

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
            'lunes' => [],
            'martes' => [],
            'miercoles' => [],
            'jueves' => [],
            'viernes' => []
        ];

        foreach ($clases as $clase) {
            $diaSemana = strtolower(date('l', strtotime($clase['fecha'])));
            $diaMap = [
                'monday' => 'lunes',
                'tuesday' => 'martes',
                'wednesday' => 'miercoles',
                'thursday' => 'jueves',
                'friday' => 'viernes'
            ];

            $dia = $diaMap[$diaSemana] ?? 'lunes';
            $dias[$dia][] = $clase;
        }

        return $dias;
    }

    /**
     * Normaliza el código de asignatura usando los alias
     */
    private function normalizarCodigoAsignatura(string $codigo): string
    {
        return self::CODIGOS_ALIAS[$codigo] ?? $codigo;
    }

    /**
     * Obtiene el nombre de una asignatura por su código
     */
    private function getNombreAsignatura(string $codigo): string
    {
        $codigoNormalizado = $this->normalizarCodigoAsignatura($codigo);
        return self::ASIGNATURAS[$codigoNormalizado] ?? $codigo;
    }

    /**
     * Genera el HTML para el reporte de plan individual
     */
    private function generarHtmlPlanAlumno(array $alumno, array $progreso, array $clases, array $centro): string
    {
        $estilos = $this->getEstilosPdf();
        $fechaGeneracion = date('d/m/Y H:i');
        $horasCompletadas = (float)($alumno['horas_completadas'] ?? 0);
        $horasTotales = 35;
        $porcentaje = min(100, round(($horasCompletadas / $horasTotales) * 100));

        /* Calcular horas por asignatura */
        $horasPorAsignatura = [];
        foreach ($progreso as $p) {
            $codigo = $this->normalizarCodigoAsignatura($p['asignatura']);
            $horasPorAsignatura[$codigo] = (float)$p['horas'];
        }

        $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Plan de Formación - {$alumno['nombre']}</title>
    {$estilos}
</head>
<body>
    <div class="cabecera">
        <div class="logoCentro">
            <h1>{$centro['nombre']}</h1>
            <p>{$centro['direccion']}</p>
        </div>
        <div class="informe">
            <h2>Plan de Formación CAP</h2>
            <p>Generado: {$fechaGeneracion}</p>
        </div>
    </div>
    
    <div class="seccion">
        <h3>Datos del Alumno</h3>
        <table class="datosSimples">
            <tr>
                <td><strong>Nombre:</strong></td>
                <td>{$alumno['nombre']}</td>
                <td><strong>DNI:</strong></td>
                <td>{$alumno['dni']}</td>
            </tr>
            <tr>
                <td><strong>Email:</strong></td>
                <td>{$alumno['email']}</td>
                <td><strong>Teléfono:</strong></td>
                <td>{$alumno['telefono']}</td>
            </tr>
        </table>
    </div>
    
    <div class="seccion">
        <h3>Progreso General</h3>
        <div class="progresoContenedor">
            <div class="progresoTexto">
                <span class="horasActuales">{$horasCompletadas}h</span> / {$horasTotales}h completadas ({$porcentaje}%)
            </div>
            <div class="barraProgreso">
                <div class="barraProgresoRelleno" style="width: {$porcentaje}%;"></div>
            </div>
        </div>
    </div>
    
    <div class="seccion">
        <h3>Progreso por Asignatura</h3>
        <table class="tablaAsignaturas">
            <thead>
                <tr>
                    <th>Asignatura</th>
                    <th>Horas Requeridas</th>
                    <th>Horas Completadas</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
HTML;

        /* Horas requeridas por asignatura */
        $horasRequeridas = [
            'CR' => 7,
            'REG' => 4,
            'SV' => 6,
            'SL' => 4,
            'SS' => 4,
            'MA' => 4,
            'MP' => 3,
            'VIA' => 3
        ];

        foreach (self::ASIGNATURAS as $codigo => $nombre) {
            $completadas = $horasPorAsignatura[$codigo] ?? 0;
            $requeridas = $horasRequeridas[$codigo] ?? 0;
            $estado = $completadas >= $requeridas ? '✓ Completada' : 'En progreso';
            $claseEstado = $completadas >= $requeridas ? 'completada' : 'pendiente';

            $html .= <<<HTML
                <tr>
                    <td>{$nombre}</td>
                    <td class="centrado">{$requeridas}h</td>
                    <td class="centrado">{$completadas}h</td>
                    <td class="centrado {$claseEstado}">{$estado}</td>
                </tr>
HTML;
        }

        $html .= <<<HTML
            </tbody>
        </table>
    </div>
    
    <div class="seccion">
        <h3>Historial de Clases</h3>
        <table class="tablaClases">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Asignatura</th>
                    <th>Asistencia</th>
                </tr>
            </thead>
            <tbody>
HTML;

        if (empty($clases)) {
            $html .= '<tr><td colspan="4" class="centrado">Sin clases asignadas</td></tr>';
        } else {
            foreach ($clases as $clase) {
                $fecha = date('d/m/Y', strtotime($clase['fecha']));
                $horario = substr($clase['hora_inicio'], 0, 5) . ' - ' . substr($clase['hora_fin'], 0, 5);
                $asignatura = $this->getNombreAsignatura($clase['asignatura']);
                $asistio = $clase['asistio'] ? '✓ Asistió' : '✗ No asistió';
                $claseAsistencia = $clase['asistio'] ? 'asistio' : 'noAsistio';

                $html .= <<<HTML
                <tr>
                    <td>{$fecha}</td>
                    <td class="centrado">{$horario}</td>
                    <td>{$asignatura}</td>
                    <td class="centrado {$claseAsistencia}">{$asistio}</td>
                </tr>
HTML;
            }
        }

        $html .= <<<HTML
            </tbody>
        </table>
    </div>
    
    <div class="piePagina">
        <p>Documento generado automáticamente por el Sistema de Gestión CAP</p>
        <p>Este documento es válido como comprobante de formación según RD 1032/2007</p>
    </div>
</body>
</html>
HTML;

        return $html;
    }

    /**
     * Genera el HTML para el reporte de control de horas
     */
    private function generarHtmlControlHoras(array $clasesPorDia, string $fechaSemana, array $centro): string
    {
        $estilos = $this->getEstilosPdf();
        $fechaGeneracion = date('d/m/Y H:i');

        /* Calcular fechas de la semana */
        $lunes = new \DateTime($fechaSemana);
        $viernes = (clone $lunes)->modify('+4 days');
        $rangoFechas = $lunes->format('d/m/Y') . ' - ' . $viernes->format('d/m/Y');

        /* Calcular totales */
        $totalClases = 0;
        $totalHoras = 0;
        foreach ($clasesPorDia as $clases) {
            $totalClases += count($clases);
            foreach ($clases as $clase) {
                $totalHoras += ($clase['duracion_minutos'] ?? 45) / 60;
            }
        }

        $diasLabels = [
            'lunes' => 'Lunes',
            'martes' => 'Martes',
            'miercoles' => 'Miércoles',
            'jueves' => 'Jueves',
            'viernes' => 'Viernes'
        ];

        $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Control de Horas - Semana {$rangoFechas}</title>
    {$estilos}
</head>
<body>
    <div class="cabecera">
        <div class="logoCentro">
            <h1>{$centro['nombre']}</h1>
            <p>{$centro['direccion']}</p>
        </div>
        <div class="informe">
            <h2>Control de Horas Semanal</h2>
            <p>Semana: {$rangoFechas}</p>
            <p>Generado: {$fechaGeneracion}</p>
        </div>
    </div>
    
    <div class="seccion">
        <h3>Resumen Semanal</h3>
        <table class="datosSimples">
            <tr>
                <td><strong>Total de clases:</strong></td>
                <td>{$totalClases} clases</td>
                <td><strong>Total de horas:</strong></td>
                <td>{$totalHoras}h</td>
            </tr>
        </table>
    </div>
HTML;

        /* Generar tabla por cada día */
        $fechaActual = clone $lunes;
        foreach ($clasesPorDia as $dia => $clases) {
            $diaLabel = $diasLabels[$dia];
            $fechaDia = $fechaActual->format('d/m/Y');
            $numClases = count($clases);

            $html .= <<<HTML
    <div class="seccion">
        <h3>{$diaLabel} ({$fechaDia}) - {$numClases} clases</h3>
HTML;

            if (empty($clases)) {
                $html .= '<p class="sinClases">Sin clases programadas</p>';
            } else {
                $html .= <<<HTML
        <table class="tablaClases">
            <thead>
                <tr>
                    <th>Horario</th>
                    <th>Asignatura</th>
                    <th>Alumnos</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
HTML;

                foreach ($clases as $clase) {
                    $horario = substr($clase['hora_inicio'], 0, 5) . ' - ' . substr($clase['hora_fin'], 0, 5);
                    $asignatura = $this->getNombreAsignatura($clase['asignatura']);
                    $numAlumnos = is_array($clase['alumnos']) ? count($clase['alumnos']) : 0;
                    /* Cast explícito para evitar problemas con strings "0"/"1" de la BD */
                    $esBloqueada = (int) $clase['bloqueada'] === 1;
                    $bloqueada = $esBloqueada ? '[B] Bloqueada' : 'Libre';
                    $claseBloqueada = $esBloqueada ? 'bloqueada' : '';

                    $html .= <<<HTML
                <tr class="{$claseBloqueada}">
                    <td class="centrado">{$horario}</td>
                    <td>{$asignatura}</td>
                    <td class="centrado">{$numAlumnos} alumnos</td>
                    <td class="centrado">{$bloqueada}</td>
                </tr>
HTML;
                }

                $html .= '</tbody></table>';
            }

            $html .= '</div>';
            $fechaActual->modify('+1 day');
        }

        $html .= <<<HTML
    <div class="piePagina">
        <p>Documento generado automáticamente por el Sistema de Gestión CAP</p>
        <p>Este documento es de uso interno del centro de formación</p>
    </div>
</body>
</html>
HTML;

        return $html;
    }

    /**
     * Retorna los estilos CSS para los PDFs
     */
    private function getEstilosPdf(): string
    {
        return <<<CSS
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 10pt;
        line-height: 1.4;
        color: #333;
        padding: 20px;
    }
    
    .cabecera {
        display: table;
        width: 100%;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 15px;
        margin-bottom: 20px;
    }
    
    .logoCentro {
        display: table-cell;
        width: 60%;
        vertical-align: top;
    }
    
    .logoCentro h1 {
        color: #1e40af;
        font-size: 16pt;
        margin-bottom: 5px;
    }
    
    .logoCentro p {
        color: #666;
        font-size: 9pt;
    }
    
    .informe {
        display: table-cell;
        width: 40%;
        text-align: right;
        vertical-align: top;
    }
    
    .informe h2 {
        color: #1e40af;
        font-size: 12pt;
        margin-bottom: 5px;
    }
    
    .informe p {
        color: #666;
        font-size: 9pt;
    }
    
    .seccion {
        margin-bottom: 20px;
    }
    
    .seccion h3 {
        color: #1e40af;
        font-size: 11pt;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
        margin-bottom: 10px;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
    }
    
    .datosSimples td {
        padding: 5px;
        border: none;
    }
    
    .tablaAsignaturas th,
    .tablaAsignaturas td,
    .tablaClases th,
    .tablaClases td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    
    .tablaAsignaturas th,
    .tablaClases th {
        background-color: #f3f4f6;
        font-weight: bold;
        color: #374151;
    }
    
    .tablaAsignaturas tbody tr:nth-child(even),
    .tablaClases tbody tr:nth-child(even) {
        background-color: #f9fafb;
    }
    
    .centrado {
        text-align: center;
    }
    
    .completada {
        color: #059669;
        font-weight: bold;
    }
    
    .pendiente {
        color: #d97706;
    }
    
    .asistio {
        color: #059669;
    }
    
    .noAsistio {
        color: #dc2626;
    }
    
    .bloqueada {
        background-color: #fef2f2 !important;
    }
    
    .sinClases {
        color: #6b7280;
        font-style: italic;
        text-align: center;
        padding: 15px;
    }
    
    .progresoContenedor {
        margin: 10px 0;
    }
    
    .progresoTexto {
        margin-bottom: 5px;
    }
    
    .horasActuales {
        font-size: 14pt;
        font-weight: bold;
        color: #2563eb;
    }
    
    .barraProgreso {
        background-color: #e5e7eb;
        border-radius: 4px;
        height: 12px;
        overflow: hidden;
    }
    
    .barraProgresoRelleno {
        background-color: #2563eb;
        height: 100%;
        border-radius: 4px;
    }
    
    .piePagina {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        text-align: center;
        font-size: 8pt;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
        padding-top: 10px;
    }
    
    .piePagina p {
        margin-bottom: 3px;
    }
</style>
CSS;
    }
}
