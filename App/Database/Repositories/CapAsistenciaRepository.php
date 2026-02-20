<?php

/**
 * CapAsistenciaRepository — Acceso a datos para tabla 'cap_asistencia'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package App
 */

namespace Glory\App\Database\Repositories;

use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;

class CapAsistenciaRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CapAsistenciaCols::TABLA;
    }

    protected static function colId(): string
    {
        return CapAsistenciaCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = static::tablaCompleta();

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /**
     * Obtiene IDs de alumnos asignados a una clase.
     */
    public static function buscarAlumnoIdsPorClase(int $claseId): array
    {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colClaseId = CapAsistenciaCols::CLASE_ID;
        $colAlumnoId = CapAsistenciaCols::ALUMNO_ID;

        try {
            $ids = $wpdb->get_col($wpdb->prepare(
                "SELECT {$colAlumnoId} FROM {$tabla} WHERE {$colClaseId} = %d",
                $claseId
            ));
            return array_map('intval', $ids ?: []);
        } catch (\Throwable $e) {
            error_log("[CapAsistenciaRepo::buscarAlumnoIdsPorClase] Error: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Elimina todas las asistencias de una clase específica.
     */
    public static function eliminarPorClaseId(int $claseId): bool
    {
        global $wpdb;
        $tabla = static::tablaCompleta();

        try {
            $resultado = $wpdb->delete($tabla, [CapAsistenciaCols::CLASE_ID => $claseId]);
            if ($resultado === false) {
                error_log("[CapAsistenciaRepo::eliminarPorClaseId] Fallo: {$wpdb->last_error}");
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            error_log("[CapAsistenciaRepo::eliminarPorClaseId] Error: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Elimina asistencias de múltiples clases (batch DELETE con prepare).
     */
    public static function eliminarPorClaseIds(array $claseIds): bool
    {
        if (empty($claseIds)) {
            return true;
        }

        global $wpdb;
        $tabla = static::tablaCompleta();
        $colClaseId = CapAsistenciaCols::CLASE_ID;

        try {
            $placeholders = implode(',', array_fill(0, count($claseIds), '%d'));
            $resultado = $wpdb->query($wpdb->prepare(
                "DELETE FROM {$tabla} WHERE {$colClaseId} IN ({$placeholders})",
                ...$claseIds
            ));
            if ($resultado === false) {
                error_log("[CapAsistenciaRepo::eliminarPorClaseIds] Fallo: {$wpdb->last_error}");
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            error_log("[CapAsistenciaRepo::eliminarPorClaseIds] Error: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Cuenta pares duplicados (clase_id, alumno_id) para un alumno.
     * Usado por el endpoint de diagnóstico.
     */
    public static function contarDuplicadosPorAlumno(int $alumnoId): int
    {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colClaseId = CapAsistenciaCols::CLASE_ID;
        $colAlumnoId = CapAsistenciaCols::ALUMNO_ID;

        try {
            return (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM (
                    SELECT {$colClaseId}, {$colAlumnoId}, COUNT(*) as cnt
                    FROM {$tabla}
                    WHERE {$colAlumnoId} = %d
                    GROUP BY {$colClaseId}, {$colAlumnoId}
                    HAVING cnt > 1
                ) as dupes",
                $alumnoId
            ));
        } catch (\Throwable $e) {
            error_log("[CapAsistenciaRepo::contarDuplicadosPorAlumno] Error: {$e->getMessage()}");
            return 0;
        }
    }

    /**
     * Obtiene detalle de clases asignadas a un alumno (JOIN con cap_clases).
     */
    public static function obtenerClasesDeAlumno(int $alumnoId): array
    {
        global $wpdb;
        $tablaAsist = static::tablaCompleta();
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        try {
            $resultados = $wpdb->get_results($wpdb->prepare(
                "SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.asignatura,
                        c.duracion_minutos, c.bloqueada
                 FROM {$tablaAsist} a
                 JOIN {$tablaClases} c ON a.clase_id = c.id
                 WHERE a.alumno_id = %d
                 ORDER BY c.fecha ASC, c.hora_inicio ASC",
                $alumnoId
            ), ARRAY_A);
            return is_array($resultados) ? $resultados : [];
        } catch (\Throwable $e) {
            error_log("[CapAsistenciaRepo::obtenerClasesDeAlumno] Error: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Obtiene resumen de horas por asignatura para un alumno (GROUP BY).
     */
    public static function obtenerResumenPorAsignatura(int $alumnoId): array
    {
        global $wpdb;
        $tablaAsist = static::tablaCompleta();
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        try {
            $resultados = $wpdb->get_results($wpdb->prepare(
                "SELECT c.asignatura, SUM(c.duracion_minutos) / 60 as horas, COUNT(*) as num_clases
                 FROM {$tablaAsist} a
                 JOIN {$tablaClases} c ON a.clase_id = c.id
                 WHERE a.alumno_id = %d
                 GROUP BY c.asignatura",
                $alumnoId
            ), ARRAY_A);
            return is_array($resultados) ? $resultados : [];
        } catch (\Throwable $e) {
            error_log("[CapAsistenciaRepo::obtenerResumenPorAsignatura] Error: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Obtiene total de horas de un alumno (todas o solo completadas).
     *
     * @param bool $soloCompletadas true = solo clases con fecha <= hoy
     */
    public static function obtenerTotalHoras(int $alumnoId, bool $soloCompletadas = false): float
    {
        global $wpdb;
        $tablaAsist = static::tablaCompleta();
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
        $filtroFecha = $soloCompletadas ? ' AND c.fecha <= CURDATE()' : '';

        try {
            return (float) $wpdb->get_var($wpdb->prepare(
                "SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
                 FROM {$tablaAsist} a
                 JOIN {$tablaClases} c ON a.clase_id = c.id
                 WHERE a.alumno_id = %d{$filtroFecha}",
                $alumnoId
            ));
        } catch (\Throwable $e) {
            error_log("[CapAsistenciaRepo::obtenerTotalHoras] Error: {$e->getMessage()}");
            return 0.0;
        }
    }
}
