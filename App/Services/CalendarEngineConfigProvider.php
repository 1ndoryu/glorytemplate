<?php

namespace Glory\App\Services;

use App\Config\Schema\_generated\CapConfiguracionCols;

class CalendarEngineConfigProvider
{
    /**
     * Carga la configuración del centro desde la base de datos.
     */
    public function cargarConfiguracion(int $centroId): array
    {
        global $wpdb;

        $tabla = $wpdb->prefix . CapConfiguracionCols::TABLA;
        $config = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tabla} WHERE centro_id = %d",
            $centroId
        ), 'ARRAY_A');

        $configuracion = $config ?: $this->configuracionDefecto();

        return [
            'configuracion' => $configuracion,
            'duracionClase' => (int) ($configuracion[CapConfiguracionCols::DURACION_CLASE] ?? 60),
            'alumnosMaxClase' => (int) ($configuracion[CapConfiguracionCols::ALUMNOS_MAX_CLASE] ?? 20),
        ];
    }

    /**
     * Aplica la zona horaria configurada para el centro.
     */
    public function aplicarTimezone(array $configuracion): void
    {
        $timezone = $configuracion[CapConfiguracionCols::TIMEZONE] ?? 'Europe/Madrid';

        if (in_array($timezone, timezone_identifiers_list(), true)) {
            date_default_timezone_set($timezone);
            return;
        }

        date_default_timezone_set('Europe/Madrid');
    }

    private function configuracionDefecto(): array
    {
        return [
            CapConfiguracionCols::TIMEZONE => 'Europe/Madrid',
            CapConfiguracionCols::HORA_INICIO_MANANA => '09:00',
            CapConfiguracionCols::HORA_FIN_MANANA => '14:00',
            CapConfiguracionCols::HORA_INICIO_TARDE => '16:00',
            CapConfiguracionCols::HORA_FIN_TARDE => '21:00',
            CapConfiguracionCols::VIERNES_ESPECIAL => false,
            CapConfiguracionCols::HORA_FIN_VIERNES => '15:00',
            CapConfiguracionCols::ALUMNOS_MAX_CLASE => 20,
            CapConfiguracionCols::DURACION_CLASE => 60,
            CapConfiguracionCols::DURACION_DESCANSO => 15,
        ];
    }
}
