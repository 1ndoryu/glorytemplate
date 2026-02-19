<?php

namespace Glory\App\Services;

class CalendarSlotsBuilder
{
    public function generarSlotsDisponibles(
        string $fechaInicioSemana,
        array $configuracion,
        int $duracionClase,
        array $clasesBloqueadas
    ): array {
        $slotsDisponibles = [];
        $horariosFlexibles = $this->obtenerHorariosFlexiblesNormalizados($configuracion);
        $usarHorarioFlexible = $horariosFlexibles !== null;

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $modo = $usarHorarioFlexible ? 'flexible' : 'legacy';
            error_log("[CAP ENGINE] generarSlotsDisponibles usando modo: {$modo}");
        }

        $nombresDias = [0 => 'lunes', 1 => 'martes', 2 => 'miercoles', 3 => 'jueves', 4 => 'viernes'];
        $fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
        if (!$fechaBase) {
            error_log("[CAP ENGINE ERROR] No se pudo parsear fecha: '{$fechaInicioSemana}'");
            return [];
        }

        for ($dia = 0; $dia < 5; $dia++) {
            $fechaObj = clone $fechaBase;
            $fechaObj->modify("+{$dia} days");
            $fecha = $fechaObj->format('Y-m-d');
            $diaSemana = $dia + 1;
            $nombreDia = $nombresDias[$dia];

            $slotsDisponibles[$fecha] = [];

            if ($usarHorarioFlexible) {
                $rangosDia = $horariosFlexibles[$nombreDia] ?? [];
                foreach ($rangosDia as $rango) {
                    if (!isset($rango['inicio'], $rango['fin'])) {
                        continue;
                    }

                    $nuevosSlots = $this->generarSlotsRango(
                        $rango['inicio'],
                        $rango['fin'],
                        $fecha,
                        $diaSemana,
                        $duracionClase,
                        $clasesBloqueadas
                    );
                    $slotsDisponibles[$fecha] = array_merge($slotsDisponibles[$fecha], $nuevosSlots);
                }
                continue;
            }

            $slotsMorning = $this->generarSlotsRango(
                (string) $configuracion['hora_inicio_manana'],
                (string) $configuracion['hora_fin_manana'],
                $fecha,
                $diaSemana,
                $duracionClase,
                $clasesBloqueadas
            );

            $horaFinTarde = (string) $configuracion['hora_fin_tarde'];
            if ($diaSemana === 5 && !empty($configuracion['viernes_especial'])) {
                $horaFinTarde = (string) $configuracion['hora_fin_viernes'];
            }

            $slotsAfternoon = $this->generarSlotsRango(
                (string) $configuracion['hora_inicio_tarde'],
                $horaFinTarde,
                $fecha,
                $diaSemana,
                $duracionClase,
                $clasesBloqueadas
            );

            $slotsDisponibles[$fecha] = array_merge($slotsMorning, $slotsAfternoon);
        }

        return $slotsDisponibles;
    }

    private function obtenerHorariosFlexiblesNormalizados(array $configuracion): ?array
    {
        $raw = $configuracion['horarios_semanales'] ?? null;
        if ($raw === null || $raw === '') {
            return null;
        }

        $horarios = is_string($raw) ? json_decode($raw, true) : $raw;
        if (!is_array($horarios)) {
            return null;
        }

        $dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        $normalizados = [];
        foreach ($dias as $dia) {
            $normalizados[$dia] = [];
        }

        foreach ($horarios as $diaRaw => $rangosRaw) {
            if (!is_string($diaRaw)) {
                continue;
            }

            $dia = $this->normalizarClaveDia($diaRaw);
            if (!isset($normalizados[$dia])) {
                continue;
            }

            $rangos = $rangosRaw;
            if (is_array($rangosRaw) && isset($rangosRaw['rangos']) && is_array($rangosRaw['rangos'])) {
                $rangos = $rangosRaw['rangos'];
            }

            if (!is_array($rangos)) {
                continue;
            }

            foreach ($rangos as $rango) {
                if (!is_array($rango) || !isset($rango['inicio'], $rango['fin'])) {
                    continue;
                }

                $inicio = $this->normalizarHora((string) $rango['inicio']);
                $fin = $this->normalizarHora((string) $rango['fin']);

                if ($inicio === '' || $fin === '' || strtotime($inicio) >= strtotime($fin)) {
                    continue;
                }

                $normalizados[$dia][] = ['inicio' => $inicio, 'fin' => $fin];
            }
        }

        return $normalizados;
    }

    private function normalizarClaveDia(string $dia): string
    {
        $dia = strtolower(trim($dia));
        return str_replace(['á', 'é', 'í', 'ó', 'ú'], ['a', 'e', 'i', 'o', 'u'], $dia);
    }

    private function normalizarHora(string $hora): string
    {
        $hora = trim($hora);

        if (!preg_match('/^([0-1]?\d|2[0-3]):([0-5]\d)$/', $hora, $matches)) {
            return '';
        }

        $h = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        return "{$h}:{$matches[2]}";
    }

    private function generarSlotsRango(
        string $horaInicio,
        string $horaFin,
        string $fecha,
        int $diaSemana,
        int $duracionClase,
        array $clasesBloqueadas
    ): array {
        $slots = [];
        $inicio = strtotime($horaInicio);
        $fin = strtotime($horaFin);

        if ($inicio >= $fin) {
            return [];
        }

        $duracion = $duracionClase * 60;

        while ($inicio + $duracion <= $fin) {
            $slotInicio = date('H:i', $inicio);
            $slotFin = date('H:i', $inicio + $duracion);

            if (!$this->slotEstaBloqueado($fecha, $slotInicio, $clasesBloqueadas)) {
                $slots[] = [
                    'fecha' => $fecha,
                    'dia_semana' => $diaSemana,
                    'hora_inicio' => $slotInicio,
                    'hora_fin' => $slotFin,
                    'disponible' => true,
                ];
            }

            $inicio += $duracion;
        }

        return $slots;
    }

    private function slotEstaBloqueado(string $fecha, string $horaInicio, array $clasesBloqueadas): bool
    {
        foreach ($clasesBloqueadas as $clase) {
            if (($clase['fecha'] ?? '') === $fecha && ($clase['hora_inicio'] ?? '') === $horaInicio) {
                return true;
            }
        }

        return false;
    }
}
