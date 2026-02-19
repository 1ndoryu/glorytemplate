<?php

namespace Glory\App\Services;

class CalendarSubjectDistributor
{
    /**
     * Distribuye asignaturas en slots y devuelve estado actualizado de minutos.
     */
    public function distribuirAsignaturas(
        array $demandaPorSlot,
        array $asignaturas,
        int $duracionClase,
        int $horasTotalesCurso,
        array $minutosCompletadosPorAlumno,
        array $minutosAsignadosPorAlumno,
        array $minutosRestantesAsignaturaPorAlumno
    ): array {
        $distribucion = [];

        uksort($demandaPorSlot, function ($a, $b) {
            return strcmp($a, $b);
        });

        foreach ($demandaPorSlot as $datos) {
            if ($datos['total'] === 0) {
                continue;
            }

            $alumnosElegibles = [];
            foreach ($datos['alumnos'] as $alumnoId) {
                $alumnoIdInt = (int) $alumnoId;
                if ($this->alumnoNecesitaMasHoras(
                    $alumnoIdInt,
                    $horasTotalesCurso,
                    $minutosCompletadosPorAlumno,
                    $minutosAsignadosPorAlumno
                )) {
                    $alumnosElegibles[] = $alumnoIdInt;
                }
            }

            if (empty($alumnosElegibles)) {
                continue;
            }

            $asignaturaSeleccionada = null;
            $alumnosParaAsignar = [];
            $mejorScore = -1.0;
            $mejorCantidad = -1;
            $mejorMinutos = -1;

            foreach (array_keys($asignaturas) as $codigoAsignatura) {
                $score = 0.0;
                $cantidad = 0;
                $minutosPendientes = 0;
                $candidatos = [];

                foreach ($alumnosElegibles as $alumnoId) {
                    $minutosRestantes = $this->obtenerMinutosRestantesAsignatura(
                        $alumnoId,
                        $codigoAsignatura,
                        $minutosRestantesAsignaturaPorAlumno
                    );

                    if ($minutosRestantes <= 0) {
                        continue;
                    }

                    $candidatos[] = $alumnoId;
                    $cantidad++;
                    $minutosPendientes += $minutosRestantes;
                    $totalAsignatura = (int) $asignaturas[$codigoAsignatura]['horas'] * 60;
                    $score += $minutosRestantes / max(1, $totalAsignatura);
                }

                if ($cantidad === 0) {
                    continue;
                }

                if (
                    $score > $mejorScore
                    || ($score === $mejorScore && $cantidad > $mejorCantidad)
                    || ($score === $mejorScore && $cantidad === $mejorCantidad && $minutosPendientes > $mejorMinutos)
                ) {
                    $mejorScore = $score;
                    $mejorCantidad = $cantidad;
                    $mejorMinutos = $minutosPendientes;
                    $asignaturaSeleccionada = $codigoAsignatura;
                    $alumnosParaAsignar = $candidatos;
                }
            }

            if ($asignaturaSeleccionada === null || empty($alumnosParaAsignar)) {
                continue;
            }

            $distribucion[] = [
                'fecha' => $datos['fecha'],
                'hora_inicio' => $datos['hora_inicio'],
                'hora_fin' => $datos['hora_fin'],
                'asignatura' => $asignaturaSeleccionada,
                'asignatura_nombre' => $asignaturas[$asignaturaSeleccionada]['nombre'],
                'alumnos' => $alumnosParaAsignar
            ];

            foreach ($alumnosParaAsignar as $alumnoId) {
                $minutosAsignadosPorAlumno[$alumnoId] = ($minutosAsignadosPorAlumno[$alumnoId] ?? 0) + $duracionClase;
                $this->registrarMinutosAsignadosAsignatura(
                    $alumnoId,
                    $asignaturaSeleccionada,
                    $duracionClase,
                    $minutosRestantesAsignaturaPorAlumno
                );
            }
        }

        return [
            'distribucion' => $distribucion,
            'minutosAsignadosPorAlumno' => $minutosAsignadosPorAlumno,
            'minutosRestantesAsignaturaPorAlumno' => $minutosRestantesAsignaturaPorAlumno,
        ];
    }

    private function alumnoNecesitaMasHoras(
        int $alumnoId,
        int $horasTotalesCurso,
        array $minutosCompletadosPorAlumno,
        array $minutosAsignadosPorAlumno
    ): bool {
        $limitMinutos = $horasTotalesCurso * 60;
        $minutosActuales = (int) ($minutosCompletadosPorAlumno[$alumnoId] ?? 0)
            + (int) ($minutosAsignadosPorAlumno[$alumnoId] ?? 0);

        return $minutosActuales < $limitMinutos;
    }

    private function obtenerMinutosRestantesAsignatura(
        int $alumnoId,
        string $asignatura,
        array $minutosRestantesAsignaturaPorAlumno
    ): int {
        return (int) ($minutosRestantesAsignaturaPorAlumno[$alumnoId][$asignatura] ?? 0);
    }

    private function registrarMinutosAsignadosAsignatura(
        int $alumnoId,
        string $asignatura,
        int $minutos,
        array &$minutosRestantesAsignaturaPorAlumno
    ): void {
        if (!isset($minutosRestantesAsignaturaPorAlumno[$alumnoId][$asignatura])) {
            return;
        }

        $restante = (int) $minutosRestantesAsignaturaPorAlumno[$alumnoId][$asignatura];
        $minutosRestantesAsignaturaPorAlumno[$alumnoId][$asignatura] = max(0, $restante - $minutos);
    }
}
