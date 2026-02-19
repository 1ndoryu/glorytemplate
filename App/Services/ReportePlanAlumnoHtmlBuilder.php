<?php

namespace Glory\App\Services;

use App\Config\Schema\CapAsignaturasConstants;
use Glory\App\Models\Alumno;

class ReportePlanAlumnoHtmlBuilder
{
    /* Delegadas a CapAsignaturasConstants (fuente unica de verdad) */
    private const ASIGNATURAS = CapAsignaturasConstants::NOMBRES;
    private const HORAS_REQUERIDAS = CapAsignaturasConstants::HORAS_REQUERIDAS;

    public function construir(array $alumno, array $progreso, array $clases, array $centro, string $estilos): string
    {
        $fechaGeneracion = date('d/m/Y H:i');
        $horasCompletadas = (float)($alumno['horas_completadas'] ?? 0);
        $horasTotales = 35;
        $porcentaje = min(100, round(($horasCompletadas / $horasTotales) * 100));

        $horasPorAsignatura = [];
        foreach ($progreso as $itemProgreso) {
            $codigo = Alumno::normalizarCodigoAsignatura((string)$itemProgreso['asignatura']);
            $horasPorAsignatura[$codigo] = (float)$itemProgreso['horas'];
        }

        $nombreCentro = $this->esc((string)($centro['nombre'] ?? 'Centro CAP'));
        $direccionCentro = $this->esc((string)($centro['direccion'] ?? ''));
        $nombreAlumno = $this->esc((string)($alumno['nombre'] ?? ''));
        $dniAlumno = $this->esc((string)($alumno['dni'] ?? ''));
        $emailAlumno = $this->esc((string)($alumno['email'] ?? ''));
        $telefonoAlumno = $this->esc((string)($alumno['telefono'] ?? ''));

        $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Plan de Formación - {$nombreAlumno}</title>
    {$estilos}
</head>
<body>
    <div class="cabecera">
        <div class="logoCentro">
            <h1>{$nombreCentro}</h1>
            <p>{$direccionCentro}</p>
        </div>
        <div class="informe">
            <h2>Plan de Formación CAP</h2>
            <p>Generado: {$fechaGeneracion}</p>
        </div>
    </div>
    <div class="seccion">
        <h3>Datos del Alumno</h3>
        <table class="datosSimples">
            <tr><td><strong>Nombre:</strong></td><td>{$nombreAlumno}</td><td><strong>DNI:</strong></td><td>{$dniAlumno}</td></tr>
            <tr><td><strong>Email:</strong></td><td>{$emailAlumno}</td><td><strong>Teléfono:</strong></td><td>{$telefonoAlumno}</td></tr>
        </table>
    </div>
    <div class="seccion">
        <h3>Progreso General</h3>
        <div class="progresoContenedor">
            <div class="progresoTexto"><span class="horasActuales">{$horasCompletadas}h</span> / {$horasTotales}h completadas ({$porcentaje}%)</div>
            <div class="barraProgreso"><div class="barraProgresoRelleno" style="width: {$porcentaje}%;"></div></div>
        </div>
    </div>
    <div class="seccion">
        <h3>Progreso por Asignatura</h3>
        <table class="tablaAsignaturas">
            <thead><tr><th>Asignatura</th><th>Horas Requeridas</th><th>Horas Completadas</th><th>Estado</th></tr></thead>
            <tbody>
HTML;

        foreach (self::ASIGNATURAS as $codigo => $nombreAsignatura) {
            $completadas = $horasPorAsignatura[$codigo] ?? 0;
            $requeridas = self::HORAS_REQUERIDAS[$codigo] ?? 0;
            $estado = $completadas >= $requeridas ? '✓ Completada' : 'En progreso';
            $claseEstado = $completadas >= $requeridas ? 'completada' : 'pendiente';
            $nombreEscapado = $this->esc($nombreAsignatura);

            $html .= <<<HTML
                <tr>
                    <td>{$nombreEscapado}</td>
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
            <thead><tr><th>Fecha</th><th>Horario</th><th>Asignatura</th><th>Asistencia</th></tr></thead>
            <tbody>
HTML;

        if (empty($clases)) {
            $html .= '<tr><td colspan="4" class="centrado">Sin clases asignadas</td></tr>';
        } else {
            $fechaHoy = date('Y-m-d');
            foreach ($clases as $clase) {
                $fecha = date('d/m/Y', strtotime((string)$clase['fecha']));
                $horario = substr((string)$clase['hora_inicio'], 0, 5) . ' - ' . substr((string)$clase['hora_fin'], 0, 5);
                $asignatura = $this->getNombreAsignatura((string)$clase['asignatura']);
                $pendiente = (string)$clase['fecha'] > $fechaHoy;
                $asistenciaTexto = $pendiente ? 'Pendiente' : '✓ Asistió';
                $asistenciaClase = $pendiente ? 'pendiente' : 'asistio';

                $html .= '<tr>'
                    . '<td>' . $this->esc($fecha) . '</td>'
                    . '<td class="centrado">' . $this->esc($horario) . '</td>'
                    . '<td>' . $this->esc($asignatura) . '</td>'
                    . '<td class="centrado ' . $asistenciaClase . '">' . $asistenciaTexto . '</td>'
                    . '</tr>';
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

    private function getNombreAsignatura(string $codigo): string
    {
        $codigoNormalizado = Alumno::normalizarCodigoAsignatura($codigo);
        return self::ASIGNATURAS[$codigoNormalizado] ?? $codigo;
    }

    private function esc(string $valor): string
    {
        return htmlspecialchars($valor, ENT_QUOTES, 'UTF-8');
    }
}
