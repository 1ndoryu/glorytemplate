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

        /* Transacción: DELETE clases + INSERT clases + INSERT asistencias deben ser atómicos */
        $wpdb->query('START TRANSACTION');

        try {
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
                $wpdb->query('ROLLBACK');
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

                /* [2003A-4] Optimizado: batch INSERT de asistencias en una sola query
                 * en vez de INSERT individual por alumno (N+1 → 1 query por clase). */
                if (!empty($clase['alumnos'])) {
                    $ahora = current_time('mysql');
                    $colClaseId = CapAsistenciaCols::CLASE_ID;
                    $colAlumnoId = CapAsistenciaCols::ALUMNO_ID;
                    $colAsistio = CapAsistenciaCols::ASISTIO;
                    $colCreatedAt = CapAsistenciaCols::CREATED_AT;

                    $placeholders = [];
                    $valores = [];
                    foreach ($clase['alumnos'] as $alumnoId) {
                        $placeholders[] = '(%d, %d, %d, %s)';
                        $valores[] = $claseId;
                        $valores[] = $alumnoId;
                        $valores[] = 0;
                        $valores[] = $ahora;
                    }

                    $sql = "INSERT INTO {$tablaAsistencia} ({$colClaseId}, {$colAlumnoId}, {$colAsistio}, {$colCreatedAt}) VALUES " . implode(', ', $placeholders);
                    $resultado = $wpdb->query($wpdb->prepare($sql, $valores));

                    if ($resultado === false) {
                        error_log("[CAP Calendar] ERROR: Fallo batch INSERT asistencias para clase_id={$claseId}. DB error: {$wpdb->last_error}");
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

            $wpdb->query('COMMIT');
            return $clasesCreadas;
        } catch (\Throwable $e) {
            $wpdb->query('ROLLBACK');
            error_log("[CAP Calendar] ERROR: Transacción fallida en crearClases para centro {$centroId}: {$e->getMessage()}");
            return [];
        }
    }
}
