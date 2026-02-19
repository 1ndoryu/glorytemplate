<?php

namespace Glory\App\Services;

class CalendarDemandCalculator
{
    public function calcularDemandaPorSlot(
        array $slotsDisponibles,
        array $alumnosIds,
        array $disponibilidadAlumnos
    ): array {
        $demanda = [];

        foreach ($slotsDisponibles as $fecha => $slots) {
            foreach ($slots as $slot) {
                $slotKey = $fecha . '_' . $slot['hora_inicio'];
                $demanda[$slotKey] = [
                    'fecha' => $fecha,
                    'dia_semana' => $slot['dia_semana'],
                    'hora_inicio' => $slot['hora_inicio'],
                    'hora_fin' => $slot['hora_fin'],
                    'alumnos' => [],
                    'total' => 0,
                ];

                foreach ($alumnosIds as $alumnoId) {
                    if ($this->alumnoDisponibleEnSlot(
                        (int) $alumnoId,
                        (int) $slot['dia_semana'],
                        (string) $slot['hora_inicio'],
                        (string) $slot['hora_fin'],
                        $disponibilidadAlumnos
                    )) {
                        $demanda[$slotKey]['alumnos'][] = (int) $alumnoId;
                        $demanda[$slotKey]['total']++;
                    }
                }
            }
        }

        return $demanda;
    }

    private function alumnoDisponibleEnSlot(
        int $alumnoId,
        int $diaSemana,
        string $horaInicio,
        string $horaFin,
        array $disponibilidadAlumnos
    ): bool {
        if (!isset($disponibilidadAlumnos[$alumnoId])) {
            return false;
        }

        $inicioSlot = strtotime($horaInicio);
        $finSlot = strtotime($horaFin);

        foreach ($disponibilidadAlumnos[$alumnoId] as $disponibilidad) {
            if (($disponibilidad['dia'] ?? 0) !== $diaSemana) {
                continue;
            }

            $inicioDisp = strtotime((string) $disponibilidad['inicio']);
            $finDisp = strtotime((string) $disponibilidad['fin']);

            if ($inicioSlot >= $inicioDisp && $finSlot <= $finDisp) {
                return true;
            }
        }

        return false;
    }
}
