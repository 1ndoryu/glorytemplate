<?php

namespace Glory\App\Services;

class CalendarReglasValidator
{
    public function validarReglas(
        array $clases,
        int $alumnoId,
        int $duracionClase,
        int $horasTotalesCurso,
        int $minimoDias,
        int $maximoHorasDiaAlumno
    ): array {
        $errores = [];

        $horasTotales = $this->calcularHorasTotales($clases, $alumnoId, $duracionClase);
        $diasUnicos = $this->contarDiasUnicos($clases, $alumnoId);
        $maxHorasDia = $this->calcularMaxHorasDia($clases, $alumnoId, $duracionClase);

        if ($horasTotales < $horasTotalesCurso) {
            $errores[] = 'Faltan ' . ($horasTotalesCurso - $horasTotales) . ' horas para completar el curso';
        }

        if ($diasUnicos < $minimoDias) {
            $errores[] = 'El curso debe realizarse en al menos ' . $minimoDias . ' días';
        }

        if ($maxHorasDia > $maximoHorasDiaAlumno) {
            $errores[] = 'Ningún día puede superar ' . $maximoHorasDiaAlumno . ' horas por alumno';
        }

        return $errores;
    }

    private function calcularHorasTotales(array $clases, int $alumnoId, int $duracionClase): float
    {
        $minutosTotales = 0;

        foreach ($clases as $clase) {
            if (in_array($alumnoId, $clase['alumnos'] ?? [], true)) {
                $minutosTotales += $duracionClase;
            }
        }

        return $minutosTotales / 60;
    }

    private function contarDiasUnicos(array $clases, int $alumnoId): int
    {
        $dias = [];

        foreach ($clases as $clase) {
            if (in_array($alumnoId, $clase['alumnos'] ?? [], true)) {
                $dias[$clase['fecha']] = true;
            }
        }

        return count($dias);
    }

    private function calcularMaxHorasDia(array $clases, int $alumnoId, int $duracionClase): float
    {
        $minutosPorDia = [];

        foreach ($clases as $clase) {
            if (in_array($alumnoId, $clase['alumnos'] ?? [], true)) {
                $fecha = $clase['fecha'];
                if (!isset($minutosPorDia[$fecha])) {
                    $minutosPorDia[$fecha] = 0;
                }
                $minutosPorDia[$fecha] += $duracionClase;
            }
        }

        return empty($minutosPorDia) ? 0 : max($minutosPorDia) / 60;
    }
}
