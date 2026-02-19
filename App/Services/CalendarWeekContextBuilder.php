<?php

namespace Glory\App\Services;

class CalendarWeekContextBuilder
{
    private CalendarDataLoader $calendarDataLoader;
    private CalendarSlotsBuilder $calendarSlotsBuilder;

    public function __construct()
    {
        $this->calendarDataLoader = new CalendarDataLoader();
        $this->calendarSlotsBuilder = new CalendarSlotsBuilder();
    }

    public function construirParaGeneracion(
        int $centroId,
        array $configuracion,
        int $duracionClase,
        array $asignaturas,
        array $alumnosIds,
        string $fechaInicioSemana,
        ?string $fechaDesde = null
    ): array {
        $disponibilidadAlumnos = $this->calendarDataLoader->cargarDisponibilidad($alumnosIds);
        $clasesBloqueadas = $this->calendarDataLoader->cargarClasesBloqueadas($centroId, $fechaInicioSemana);
        $horasCompletadas = $this->calendarDataLoader->cargarHorasCompletadasAlumnos(
            $centroId,
            $alumnosIds,
            $fechaInicioSemana
        );
        $minutosRestantesAsignaturaPorAlumno = $this->calendarDataLoader->cargarMinutosRestantesAsignaturaAlumnos(
            $centroId,
            $alumnosIds,
            $asignaturas,
            $fechaInicioSemana
        );

        $slotsDisponibles = $this->calendarSlotsBuilder->generarSlotsDisponibles(
            $fechaInicioSemana,
            $configuracion,
            $duracionClase,
            $clasesBloqueadas
        );

        if ($fechaDesde !== null) {
            foreach ($slotsDisponibles as $fecha => $slots) {
                if ($fecha < $fechaDesde) {
                    unset($slotsDisponibles[$fecha]);
                }
            }
        }

        return [
            'disponibilidadAlumnos' => $disponibilidadAlumnos,
            'slotsDisponibles' => $slotsDisponibles,
            'minutosCompletadosPorAlumno' => $horasCompletadas['minutosCompletadosPorAlumno'],
            'minutosAsignadosPorAlumno' => $horasCompletadas['minutosAsignadosPorAlumno'],
            'minutosRestantesAsignaturaPorAlumno' => $minutosRestantesAsignaturaPorAlumno,
        ];
    }

    public function construirParaPreview(
        array $configuracion,
        int $duracionClase,
        array $alumnosIds,
        string $fechaInicioSemana
    ): array {
        $disponibilidadAlumnos = $this->calendarDataLoader->cargarDisponibilidad($alumnosIds);

        $slotsDisponibles = $this->calendarSlotsBuilder->generarSlotsDisponibles(
            $fechaInicioSemana,
            $configuracion,
            $duracionClase,
            []
        );

        return [
            'disponibilidadAlumnos' => $disponibilidadAlumnos,
            'slotsDisponibles' => $slotsDisponibles,
        ];
    }
}
