<?php

namespace Glory\App\Services;

class CalendarConflictDetector
{
    /**
     * Detecta conflictos de aforo (más alumnos que capacidad).
     */
    public function detectarConflictosAforo(array $demandaPorSlot, int $alumnosMaxClase): array
    {
        $conflictos = [];

        foreach ($demandaPorSlot as $slotKey => $datos) {
            if ($datos['total'] <= $alumnosMaxClase) {
                continue;
            }

            $conflictos[] = [
                'tipo' => 'aforo',
                'slot_key' => $slotKey,
                'fecha' => $datos['fecha'],
                'hora_inicio' => $datos['hora_inicio'],
                'hora_fin' => $datos['hora_fin'],
                'demanda' => $datos['total'],
                'capacidad' => $alumnosMaxClase,
                'exceso' => $datos['total'] - $alumnosMaxClase,
                'alumnos' => $datos['alumnos']
            ];
        }

        return $conflictos;
    }
}
