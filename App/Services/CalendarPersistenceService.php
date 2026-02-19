<?php

namespace Glory\App\Services;

class CalendarPersistenceService
{
    /**
     * Crea las clases y asistencias en la base de datos.
     *
     * @param array $distribucion Clases a insertar
     * @param int $centroId ID del centro
     * @param int $duracionClase Duración en minutos
     * @param string $fechaInicioSemana Fecha de inicio de semana (Y-m-d)
     * @param string|null $fechaDesde Fecha desde la que se regenera (Y-m-d)
     * @return array
     */
    public function crearClases(
        array $distribucion,
        int $centroId,
        int $duracionClase,
        string $fechaInicioSemana,
        ?string $fechaDesde = null
    ): array {
        global $wpdb;

        $tablaClases = $wpdb->prefix . 'cap_clases';
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';

        $fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
        $fechaFin = $fechaBase ? (clone $fechaBase)->modify('+4 days')->format('Y-m-d') : $fechaInicioSemana;
        $fechaBorradoDesde = $fechaDesde ?? $fechaInicioSemana;

        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tablaClases}
             WHERE centro_id = %d
             AND fecha BETWEEN %s AND %s
             AND bloqueada = 0",
            $centroId,
            $fechaBorradoDesde,
            $fechaFin
        ));

        $clasesCreadas = [];

        foreach ($distribucion as $clase) {
            $insertado = $wpdb->insert($tablaClases, [
                'centro_id' => $centroId,
                'fecha' => $clase['fecha'],
                'hora_inicio' => $clase['hora_inicio'],
                'hora_fin' => $clase['hora_fin'],
                'asignatura' => $clase['asignatura'],
                'duracion_minutos' => $duracionClase,
                'bloqueada' => 0,
                'created_at' => current_time('mysql')
            ]);

            if (!$insertado) {
                continue;
            }

            $claseId = $wpdb->insert_id;

            foreach ($clase['alumnos'] as $alumnoId) {
                $wpdb->insert($tablaAsistencia, [
                    'clase_id' => $claseId,
                    'alumno_id' => $alumnoId,
                    'asistio' => 0,
                    'created_at' => current_time('mysql')
                ]);
            }

            $clasesCreadas[] = [
                'id' => $claseId,
                'fecha' => $clase['fecha'],
                'hora_inicio' => $clase['hora_inicio'],
                'hora_fin' => $clase['hora_fin'],
                'asignatura' => $clase['asignatura'],
                'asignatura_nombre' => $clase['asignatura_nombre'],
                'alumnos_count' => count($clase['alumnos'])
            ];
        }

        return $clasesCreadas;
    }
}
