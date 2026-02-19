<?php

namespace Glory\App\Services;

class CalendarEngineConfigProvider
{
    /**
     * Carga la configuración del centro desde la base de datos.
     */
    public function cargarConfiguracion(int $centroId): array
    {
        global $wpdb;

        $tabla = $wpdb->prefix . 'cap_configuracion';
        $config = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tabla} WHERE centro_id = %d",
            $centroId
        ), 'ARRAY_A');

        $configuracion = $config ?: $this->configuracionDefecto();

        return [
            'configuracion' => $configuracion,
            'duracionClase' => (int) ($configuracion['duracion_clase'] ?? 60),
            'alumnosMaxClase' => (int) ($configuracion['alumnos_max_clase'] ?? 20),
        ];
    }

    /**
     * Aplica la zona horaria configurada para el centro.
     */
    public function aplicarTimezone(array $configuracion): void
    {
        $timezone = $configuracion['timezone'] ?? 'Europe/Madrid';

        if (in_array($timezone, timezone_identifiers_list(), true)) {
            date_default_timezone_set($timezone);
            return;
        }

        date_default_timezone_set('Europe/Madrid');
    }

    private function configuracionDefecto(): array
    {
        return [
            'timezone' => 'Europe/Madrid',
            'hora_inicio_manana' => '09:00',
            'hora_fin_manana' => '14:00',
            'hora_inicio_tarde' => '16:00',
            'hora_fin_tarde' => '21:00',
            'viernes_especial' => false,
            'hora_fin_viernes' => '15:00',
            'alumnos_max_clase' => 20,
            'duracion_clase' => 60,
            'duracion_descanso' => 15,
        ];
    }
}
