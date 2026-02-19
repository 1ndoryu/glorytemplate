<?php

namespace Glory\App\Services;

use Glory\App\Models\Alumno;

class ReporteControlHorasHtmlBuilder
{
    private const ASIGNATURAS = [
        'conduccion_racional' => 'Conducción racional',
        'reglamentacion' => 'Reglamentación',
        'seguridad_vial' => 'Seguridad vial',
        'servicio_logistica' => 'Servicio y logística',
        'salud_seguridad' => 'Salud y seguridad',
        'medio_ambiente' => 'Medio ambiente',
        'mercancias_peligrosas' => 'Mercancías peligrosas',
        'viajeros' => 'Viajeros',
    ];

    public function construir(array $clasesPorDia, string $fechaSemana, array $centro, string $estilos): string
    {
        $fechaGeneracion = date('d/m/Y H:i');
        $lunes = new \DateTime($fechaSemana);
        $viernes = (clone $lunes)->modify('+4 days');
        $rangoFechas = $lunes->format('d/m/Y') . ' - ' . $viernes->format('d/m/Y');

        $totalClases = 0;
        $totalHoras = 0.0;
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
            'viernes' => 'Viernes',
        ];

        $nombreCentro = $this->esc((string)($centro['nombre'] ?? 'Centro CAP'));
        $direccionCentro = $this->esc((string)($centro['direccion'] ?? ''));

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
            <h1>{$nombreCentro}</h1>
            <p>{$direccionCentro}</p>
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
            <tr><td><strong>Total de clases:</strong></td><td>{$totalClases} clases</td><td><strong>Total de horas:</strong></td><td>{$totalHoras}h</td></tr>
        </table>
    </div>
HTML;

        $fechaActual = clone $lunes;
        foreach ($clasesPorDia as $dia => $clases) {
            $diaLabel = $diasLabels[$dia] ?? 'Día';
            $fechaDia = $fechaActual->format('d/m/Y');
            $numClases = count($clases);

            $html .= '<div class="seccion"><h3>' . $this->esc($diaLabel) . ' (' . $this->esc($fechaDia) . ') - ' . $numClases . ' clases</h3>';

            if (empty($clases)) {
                $html .= '<p class="sinClases">Sin clases programadas</p>';
            } else {
                $html .= '<table class="tablaClases"><thead><tr><th>Horario</th><th>Asignatura</th><th>Alumnos</th><th>Estado</th></tr></thead><tbody>';

                foreach ($clases as $clase) {
                    $horario = substr((string)$clase['hora_inicio'], 0, 5) . ' - ' . substr((string)$clase['hora_fin'], 0, 5);
                    $asignatura = $this->getNombreAsignatura((string)$clase['asignatura']);
                    $numAlumnos = is_array($clase['alumnos']) ? count($clase['alumnos']) : 0;
                    $esBloqueada = (int)$clase['bloqueada'] === 1;
                    $estado = $esBloqueada ? '[B] Bloqueada' : 'Libre';
                    $claseBloqueada = $esBloqueada ? 'bloqueada' : '';

                    $html .= '<tr class="' . $claseBloqueada . '">'
                        . '<td class="centrado">' . $this->esc($horario) . '</td>'
                        . '<td>' . $this->esc($asignatura) . '</td>'
                        . '<td class="centrado">' . $numAlumnos . ' alumnos</td>'
                        . '<td class="centrado">' . $estado . '</td>'
                        . '</tr>';
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
