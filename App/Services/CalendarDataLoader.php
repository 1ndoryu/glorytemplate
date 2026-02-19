<?php

namespace Glory\App\Services;

use Glory\App\Models\Alumno;

class CalendarDataLoader
{
    /**
     * Mapeo de nombre de día a número (1=lunes ... 5=viernes).
     */
    private const DIAS_A_NUMERO = [
        'lunes' => 1,
        'martes' => 2,
        'miercoles' => 3,
        'miércoles' => 3,
        'jueves' => 4,
        'viernes' => 5,
    ];

    /**
     * Carga disponibilidad normalizada por alumno.
     */
    public function cargarDisponibilidad(array $alumnosIds): array
    {
        global $wpdb;

        $tabla = $wpdb->prefix . 'cap_disponibilidad';

        if (empty($alumnosIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($alumnosIds), '%d'));
        $query = $wpdb->prepare(
            "SELECT alumno_id, dia, hora, disponible
             FROM {$tabla}
             WHERE alumno_id IN ($placeholders)
             AND disponible = 1",
            $alumnosIds
        );

        $resultados = $wpdb->get_results($query, 'ARRAY_A');
        $disponibilidadAlumnos = [];

        foreach ($resultados as $row) {
            $alumnoId = (int) $row['alumno_id'];
            $diaTexto = strtolower(trim($row['dia']));
            $hora = $row['hora'];

            $diaSemana = self::DIAS_A_NUMERO[$diaTexto] ?? null;
            if ($diaSemana === null) {
                continue;
            }

            if (!isset($disponibilidadAlumnos[$alumnoId])) {
                $disponibilidadAlumnos[$alumnoId] = [];
            }

            $horaFin = date('H:i', strtotime($hora) + 3600);

            $disponibilidadAlumnos[$alumnoId][] = [
                'dia' => $diaSemana,
                'inicio' => $hora,
                'fin' => $horaFin,
            ];
        }

        return $disponibilidadAlumnos;
    }

    /**
     * Carga clases bloqueadas de la semana.
     */
    public function cargarClasesBloqueadas(int $centroId, string $fechaInicioSemana): array
    {
        global $wpdb;

        $tabla = $wpdb->prefix . 'cap_clases';
        $fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
        if (!$fechaBase) {
            return [];
        }

        $fechaFinObj = clone $fechaBase;
        $fechaFinObj->modify('+4 days');
        $fechaFin = $fechaFinObj->format('Y-m-d');

        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$tabla}
             WHERE centro_id = %d
             AND fecha BETWEEN %s AND %s
             AND bloqueada = 1",
            $centroId,
            $fechaInicioSemana,
            $fechaFin
        ), 'ARRAY_A');
    }

    /**
     * Carga minutos completados y asignados por alumno.
     */
    public function cargarHorasCompletadasAlumnos(int $centroId, array $alumnosIds, string $semanaExcluir = ''): array
    {
        global $wpdb;

        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';
        $minutosCompletadosPorAlumno = [];
        $minutosAsignadosPorAlumno = [];

        if (empty($alumnosIds)) {
            return [
                'minutosCompletadosPorAlumno' => $minutosCompletadosPorAlumno,
                'minutosAsignadosPorAlumno' => $minutosAsignadosPorAlumno,
            ];
        }

        $placeholders = implode(',', array_fill(0, count($alumnosIds), '%d'));
        $condicionExcluir = '';
        $params = $alumnosIds;
        $params[] = $centroId;

        if (!empty($semanaExcluir)) {
            $fechaBase = \DateTime::createFromFormat('!Y-m-d', $semanaExcluir);
            if ($fechaBase) {
                $fechaFinSemana = (clone $fechaBase)->modify('+4 days')->format('Y-m-d');
                $condicionExcluir = ' AND (c.fecha < %s OR c.fecha > %s)';
                $params[] = $semanaExcluir;
                $params[] = $fechaFinSemana;
            }
        }

        $queryStr = "SELECT a.alumno_id, COALESCE(SUM(c.duracion_minutos), 0) as minutos_completados
               FROM {$tablaAsistencia} a
               JOIN {$tablaClases} c ON a.clase_id = c.id
               WHERE a.alumno_id IN ({$placeholders})
               AND c.centro_id = %d
               {$condicionExcluir}
               GROUP BY a.alumno_id";

        $resultados = $wpdb->get_results($wpdb->prepare($queryStr, $params), 'ARRAY_A');

        foreach ($alumnosIds as $alumnoId) {
            $alumnoIdInt = (int) $alumnoId;
            $minutosCompletadosPorAlumno[$alumnoIdInt] = 0;
            $minutosAsignadosPorAlumno[$alumnoIdInt] = 0;
        }

        foreach ($resultados as $row) {
            $minutosCompletadosPorAlumno[(int) $row['alumno_id']] = (int) $row['minutos_completados'];
        }

        return [
            'minutosCompletadosPorAlumno' => $minutosCompletadosPorAlumno,
            'minutosAsignadosPorAlumno' => $minutosAsignadosPorAlumno,
        ];
    }

    /**
     * Carga minutos restantes por asignatura para cada alumno.
     */
    public function cargarMinutosRestantesAsignaturaAlumnos(
        int $centroId,
        array $alumnosIds,
        array $asignaturas,
        string $semanaExcluir = ''
    ): array {
        global $wpdb;

        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';
        $minutosRestantesAsignaturaPorAlumno = [];

        if (empty($alumnosIds)) {
            return $minutosRestantesAsignaturaPorAlumno;
        }

        foreach ($alumnosIds as $alumnoId) {
            $alumnoIdInt = (int) $alumnoId;
            $minutosRestantesAsignaturaPorAlumno[$alumnoIdInt] = [];
            foreach ($asignaturas as $codigo => $asignatura) {
                $minutosRestantesAsignaturaPorAlumno[$alumnoIdInt][$codigo] = (int) $asignatura['horas'] * 60;
            }
        }

        $placeholders = implode(',', array_fill(0, count($alumnosIds), '%d'));
        $condicionExcluir = '';
        $params = $alumnosIds;
        $params[] = $centroId;

        if (!empty($semanaExcluir)) {
            $fechaBase = \DateTime::createFromFormat('!Y-m-d', $semanaExcluir);
            if ($fechaBase) {
                $fechaFinSemana = (clone $fechaBase)->modify('+4 days')->format('Y-m-d');
                $condicionExcluir = ' AND (c.fecha < %s OR c.fecha > %s)';
                $params[] = $semanaExcluir;
                $params[] = $fechaFinSemana;
            }
        }

        $queryStr = "SELECT a.alumno_id, c.asignatura, COALESCE(SUM(c.duracion_minutos), 0) as minutos
            FROM {$tablaAsistencia} a
            JOIN {$tablaClases} c ON a.clase_id = c.id
            WHERE a.alumno_id IN ({$placeholders})
              AND c.centro_id = %d
              {$condicionExcluir}
            GROUP BY a.alumno_id, c.asignatura";

        $resultados = $wpdb->get_results($wpdb->prepare($queryStr, $params), 'ARRAY_A');

        foreach ($resultados as $row) {
            $alumnoId = (int) $row['alumno_id'];
            $codigo = Alumno::normalizarCodigoAsignatura((string) $row['asignatura']);
            if (!isset($asignaturas[$codigo])) {
                continue;
            }

            $minutosAsignados = (int) $row['minutos'];
            $restanteActual = $minutosRestantesAsignaturaPorAlumno[$alumnoId][$codigo] ?? 0;
            $minutosRestantesAsignaturaPorAlumno[$alumnoId][$codigo] = max(0, $restanteActual - $minutosAsignados);
        }

        return $minutosRestantesAsignaturaPorAlumno;
    }
}
