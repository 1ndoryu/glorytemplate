<?php

/**
 * Servicio de cálculo de progreso de alumnos
 * 
 * Separado de Alumno (modelo CRUD) para cumplir SRP.
 * Este servicio contiene toda la lógica de consulta y recálculo de horas/progreso.
 * 
 * @package Glory\App\Models
 */

namespace Glory\App\Models;

use App\Config\Schema\_generated\CapAlumnosCols;
use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;

class AlumnoProgreso
{
    private string $tablaAlumnos;

    public function __construct()
    {
        global $wpdb;
        $this->tablaAlumnos = $wpdb->prefix . CapAlumnosCols::TABLA;
    }

    /**
     * Obtiene el progreso real de un alumno por asignatura.
     * El calendario es la fuente de verdad: toda clase con fecha <= hoy
     * se cuenta como completada, sin depender del campo asistio.
     * Los códigos de asignatura se normalizan y fusionan a sus formas canónicas.
     */
    public function obtenerProgreso(int $alumnoId): array
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        $progreso = $wpdb->get_results($wpdb->prepare(
            "SELECT c.asignatura, SUM(c.duracion_minutos) / 60 as horas
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d AND c.fecha <= CURDATE()
             GROUP BY c.asignatura",
            $alumnoId
        ), 'ARRAY_A');

        return Alumno::normalizarProgresoAsignaturas($progreso ?: []);
    }

    /**
     * Obtiene el progreso asignado de un alumno por asignatura.
     * Considera todas las clases (pasadas y futuras) asignadas al alumno.
     * Los códigos de asignatura se normalizan y fusionan a sus formas canónicas.
     */
    public function obtenerProgresoAsignado(int $alumnoId): array
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        $progreso = $wpdb->get_results($wpdb->prepare(
            "SELECT c.asignatura, SUM(c.duracion_minutos) / 60 as horas
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d
             GROUP BY c.asignatura",
            $alumnoId
        ), 'ARRAY_A');

        return Alumno::normalizarProgresoAsignaturas($progreso ?: []);
    }

    /**
     * Obtiene el total de horas asignadas (pasadas y futuras).
     */
    public function obtenerHorasAsignadas(int $alumnoId): float
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        return (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d",
            $alumnoId
        ));
    }

    /**
     * Recalcula y actualiza horas_completadas de un alumno.
     * Suma la duración de todas las clases con fecha <= hoy asignadas al alumno.
     * Retorna el total de horas actualizado.
     */
    public function recalcularHorasCompletadas(int $alumnoId): float
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        try {
            $horas = (float) $wpdb->get_var($wpdb->prepare(
                "SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
                 FROM {$tablaAsistencia} a
                 JOIN {$tablaClases} c ON a.clase_id = c.id
                 WHERE a.alumno_id = %d AND c.fecha <= CURDATE()",
                $alumnoId
            ));

            /* Actualizar cache en tabla de alumnos, verificar retorno */
            $resultado = $wpdb->update(
                $this->tablaAlumnos,
                [CapAlumnosCols::HORAS_COMPLETADAS => $horas, CapAlumnosCols::UPDATED_AT => current_time('mysql')],
                [CapAlumnosCols::ID => $alumnoId]
            );

            if ($resultado === false) {
                error_log("[CAP Alumno] ERROR: Fallo al actualizar horas_completadas del alumno {$alumnoId}. DB error: {$wpdb->last_error}");
            }

            return $horas;
        } catch (\Throwable $e) {
            error_log("[CAP Alumno] ERROR en recalcularHorasCompletadas alumno {$alumnoId}: " . $e->getMessage());
            return 0.0;
        }
    }

    /**
     * Recalcula horas_completadas de todos los alumnos de un centro.
     * Útil tras generar o eliminar clases.
     * @return bool true si la operación fue exitosa
     */
    public function recalcularProgresoCentro(int $centroId): bool
    {
        global $wpdb;

        $alumnosIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM {$this->tablaAlumnos} WHERE centro_id = %d",
            $centroId
        ));

        return $this->recalcularProgresoEnLote($alumnosIds);
    }

    /**
     * Recalcula horas_completadas de un conjunto específico de alumnos.
     * Se usa tras generar calendario para actualizar solo los alumnos afectados.
     * @return bool true si la operación fue exitosa
     */
    public function recalcularProgresoAlumnos(array $alumnosIds): bool
    {
        return $this->recalcularProgresoEnLote($alumnosIds);
    }

    /**
     * Ejecuta UPDATE masivo para recalcular horas en lote.
     * @return bool true si la operación fue exitosa, false si hubo error de BD
     */
    private function recalcularProgresoEnLote(array $alumnosIds): bool
    {
        global $wpdb;
        $ids = array_values(array_unique(array_filter(array_map('intval', $alumnosIds))));
        if (empty($ids)) {
            return true;
        }

        try {
            $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
            $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
            $placeholdersSubquery = implode(',', array_fill(0, count($ids), '%d'));
            $placeholdersWhere = implode(',', array_fill(0, count($ids), '%d'));

            $query = "
                UPDATE {$this->tablaAlumnos} al
                LEFT JOIN (
                    SELECT a.alumno_id, COALESCE(SUM(c.duracion_minutos) / 60, 0) AS horas
                    FROM {$tablaAsistencia} a
                    JOIN {$tablaClases} c ON a.clase_id = c.id
                    WHERE c.fecha <= CURDATE() AND a.alumno_id IN ({$placeholdersSubquery})
                    GROUP BY a.alumno_id
                ) calc ON al.id = calc.alumno_id
                SET al.horas_completadas = COALESCE(calc.horas, 0),
                    al.updated_at = %s
                WHERE al.id IN ({$placeholdersWhere})
            ";

            $params = array_merge($ids, [current_time('mysql')], $ids);
            $resultado = $wpdb->query($wpdb->prepare($query, ...$params));

            if ($resultado === false) {
                error_log('[CAP Alumno] ERROR: Fallo en recalcularProgresoEnLote para ' . count($ids) . " alumnos. DB error: {$wpdb->last_error}");
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            error_log('[CAP Alumno] ERROR en recalcularProgresoEnLote: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Filtra una lista de alumnos para devolver solo los que NO han completado las 35 horas.
     * Esto previene que el motor de calendario siga asignando clases a alumnos que ya terminaron.
     * 
     * @param int $centroId ID del centro (para validación de pertenencia)
     * @param array $alumnosIds Lista de IDs de alumnos a filtrar
     * @param string $semanaExcluir Fecha del lunes de la semana a excluir (si se regenera)
     * @return array Lista de IDs de alumnos que aún necesitan más horas
     */
    public function filtrarAlumnosNoCompletados(int $centroId, array $alumnosIds, string $semanaExcluir = ''): array
    {
        global $wpdb;

        if (empty($alumnosIds)) {
            return [];
        }

        $idsFiltrados = array_values(array_unique(array_filter(array_map('absint', $alumnosIds))));
        if (empty($idsFiltrados)) {
            return [];
        }

        /* 35 horas = límite del curso CAP */
        $limitMinutos = 35 * 60;

        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
        $placeholders = implode(',', array_fill(0, count($idsFiltrados), '%d'));

        $condicionExcluir = '';
        $params = [$centroId];

        if (!empty($semanaExcluir)) {
            $fechaBase = \DateTime::createFromFormat('!Y-m-d', $semanaExcluir);
            if ($fechaBase) {
                $fechaFinSemana = (clone $fechaBase)->modify('+4 days')->format('Y-m-d');
                $condicionExcluir = ' AND (c.fecha < %s OR c.fecha > %s)';
                $params[] = $semanaExcluir;
                $params[] = $fechaFinSemana;
            }
        }

        $params[] = $centroId;

        $query = $wpdb->prepare(
            "SELECT a.id
             FROM {$this->tablaAlumnos} a
             LEFT JOIN {$tablaAsistencia} ca ON ca.alumno_id = a.id
             LEFT JOIN {$tablaClases} c ON c.id = ca.clase_id
                AND c.centro_id = %d
                {$condicionExcluir}
             WHERE a.centro_id = %d
             AND a.id IN ({$placeholders})
             GROUP BY a.id
             HAVING COALESCE(SUM(c.duracion_minutos), 0) < %d
             ORDER BY a.id",
            array_merge($params, $idsFiltrados, [$limitMinutos])
        );

        $idsValidos = $wpdb->get_col($query);

        return array_map('intval', $idsValidos ?: []);
    }
}
