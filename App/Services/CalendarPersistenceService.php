<?php

namespace Glory\App\Services;

use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;

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

        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;

        $fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
        $fechaFin = $fechaBase ? (clone $fechaBase)->modify('+4 days')->format('Y-m-d') : $fechaInicioSemana;
        $fechaBorradoDesde = $fechaDesde ?? $fechaInicioSemana;

        /* Eliminar clases existentes no bloqueadas del rango, verificar retorno */
        $resultadoDelete = $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tablaClases}
             WHERE centro_id = %d
             AND fecha BETWEEN %s AND %s
             AND bloqueada = 0",
            $centroId,
            $fechaBorradoDesde,
            $fechaFin
        ));

        if ($resultadoDelete === false) {
            error_log("[CAP Calendar] ERROR: Fallo al eliminar clases previas para centro {$centroId}. DB error: {$wpdb->last_error}");
            return [];
        }

        $clasesCreadas = [];

        foreach ($distribucion as $clase) {
            $insertado = $wpdb->insert($tablaClases, [
                CapClasesCols::CENTRO_ID => $centroId,
                CapClasesCols::FECHA => $clase['fecha'],
                CapClasesCols::HORA_INICIO => $clase['hora_inicio'],
                CapClasesCols::HORA_FIN => $clase['hora_fin'],
                CapClasesCols::ASIGNATURA => $clase['asignatura'],
                CapClasesCols::DURACION_MINUTOS => $duracionClase,
                CapClasesCols::BLOQUEADA => 0,
                CapClasesCols::CREATED_AT => current_time('mysql')
            ]);

            if (!$insertado) {
                continue;
            }

            $claseId = $wpdb->insert_id;

            foreach ($clase['alumnos'] as $alumnoId) {
                $asistenciaInsertada = $wpdb->insert($tablaAsistencia, [
                    CapAsistenciaCols::CLASE_ID => $claseId,
                    CapAsistenciaCols::ALUMNO_ID => $alumnoId,
                    CapAsistenciaCols::ASISTIO => 0,
                    CapAsistenciaCols::CREATED_AT => current_time('mysql')
                ]);

                if ($asistenciaInsertada === false) {
                    error_log("[CAP Calendar] ERROR: Fallo al insertar asistencia para clase_id={$claseId}, alumno_id={$alumnoId}. DB error: {$wpdb->last_error}");
                }
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
