<?php

namespace Glory\App\Services;

class CalendarCoverageNoticeBuilder
{
    /**
     * Calcula avisos de horas no cubiertas por día.
     */
    public function calcularAvisosHorasNoCubiertas(array $demandaPorSlot, array $slotsDisponibles, int $duracionClase): array
    {
        $avisos = [];
        $nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        $slotsPorFecha = [];
        foreach ($slotsDisponibles as $fecha => $slots) {
            $slotsPorFecha[$fecha] = [
                'disponibles' => count($slots),
                'cubiertos' => 0,
                'horasDisponibles' => 0,
                'horasCubiertas' => 0,
                'slotsNoCubiertos' => []
            ];

            foreach ($slots as $slot) {
                $slotsPorFecha[$fecha]['horasDisponibles'] += $duracionClase / 60;
            }
        }

        foreach ($demandaPorSlot as $datos) {
            $fecha = $datos['fecha'];
            if (!isset($slotsPorFecha[$fecha])) {
                continue;
            }

            if ($datos['total'] > 0) {
                $slotsPorFecha[$fecha]['cubiertos']++;
                $slotsPorFecha[$fecha]['horasCubiertas'] += $duracionClase / 60;
                continue;
            }

            $slotsPorFecha[$fecha]['slotsNoCubiertos'][] = [
                'inicio' => $datos['hora_inicio'],
                'fin' => $datos['hora_fin']
            ];
        }

        foreach ($slotsPorFecha as $fecha => $stats) {
            $noCubiertos = $stats['disponibles'] - $stats['cubiertos'];

            if ($noCubiertos <= 0) {
                continue;
            }

            $timestamp = strtotime($fecha);
            $diaSemana = (int) date('N', $timestamp);
            $nombreDia = $nombresDias[$diaSemana - 1] ?? 'Día';
            $rangosNoCubiertos = $this->agruparRangosConsecutivos($stats['slotsNoCubiertos']);

            $avisos[] = [
                'fecha' => $fecha,
                'diaNombre' => $nombreDia,
                'horasDisponibles' => round($stats['horasDisponibles'], 1),
                'horasCubiertas' => round($stats['horasCubiertas'], 1),
                'horasNoCubiertas' => round($stats['horasDisponibles'] - $stats['horasCubiertas'], 1),
                'rangosNoCubiertos' => $rangosNoCubiertos
            ];
        }

        return $avisos;
    }

    /**
     * Agrupa slots consecutivos en rangos para mostrar en avisos.
     */
    private function agruparRangosConsecutivos(array $slots): array
    {
        if (empty($slots)) {
            return [];
        }

        usort($slots, function ($a, $b) {
            return strcmp($a['inicio'], $b['inicio']);
        });

        $rangos = [];
        $rangoActual = [
            'inicio' => $slots[0]['inicio'],
            'fin' => $slots[0]['fin']
        ];

        for ($i = 1; $i < count($slots); $i++) {
            $slot = $slots[$i];

            if ($slot['inicio'] === $rangoActual['fin']) {
                $rangoActual['fin'] = $slot['fin'];
                continue;
            }

            $rangos[] = $rangoActual['inicio'] . ' - ' . $rangoActual['fin'];
            $rangoActual = [
                'inicio' => $slot['inicio'],
                'fin' => $slot['fin']
            ];
        }

        $rangos[] = $rangoActual['inicio'] . ' - ' . $rangoActual['fin'];

        return $rangos;
    }
}
