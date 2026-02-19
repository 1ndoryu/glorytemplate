<?php

/**
 * Modelo para gestión de clases/slots del calendario CAP
 * 
 * @package Glory\App\Models
 */

namespace Glory\App\Models;

use App\Config\Schema\_generated\CapAlumnosCols;
use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;

class Clase
{
    private string $tabla;
    private string $tablaAsistencia;

    public function __construct()
    {
        global $wpdb;
        $this->tabla = $wpdb->prefix . CapClasesCols::TABLA;
        $this->tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
    }

    /**
     * Obtiene las clases de una semana específica
     * 
     * @param int $centroId ID del centro
     * @param string $fechaInicio Fecha del lunes (Y-m-d)
     * @return array Lista de clases
     */
    public function obtenerSemana(int $centroId, string $fechaInicio): array
    {
        global $wpdb;
        $tablaAlumnos = $wpdb->prefix . CapAlumnosCols::TABLA;

        $fechaFin = date('Y-m-d', strtotime($fechaInicio . ' +4 days'));

        $clases = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->tabla} 
             WHERE centro_id = %d 
             AND fecha BETWEEN %s AND %s
             ORDER BY fecha ASC, hora_inicio ASC",
            $centroId,
            $fechaInicio,
            $fechaFin
        ), 'ARRAY_A');

        if (empty($clases)) {
            return [];
        }

        $idsClases = array_map(static fn(array $clase): int => (int) $clase['id'], $clases);
        $placeholders = implode(',', array_fill(0, count($idsClases), '%d'));

        $sqlAlumnos = $wpdb->prepare(
            "SELECT asi.clase_id, a.id, a.nombre, asi.asistio
             FROM {$this->tablaAsistencia} asi
             JOIN {$tablaAlumnos} a ON asi.alumno_id = a.id
             WHERE asi.clase_id IN ({$placeholders})",
            ...$idsClases
        );

        $filasAlumnos = $wpdb->get_results($sqlAlumnos, 'ARRAY_A') ?: [];
        $alumnosPorClase = [];
        foreach ($filasAlumnos as $filaAlumno) {
            $claseId = (int) $filaAlumno['clase_id'];
            if (!isset($alumnosPorClase[$claseId])) {
                $alumnosPorClase[$claseId] = [];
            }

            $alumnosPorClase[$claseId][] = [
                'id' => (int) $filaAlumno['id'],
                'nombre' => $filaAlumno['nombre'],
                'asistio' => (int) $filaAlumno['asistio'],
            ];
        }

        /* Añadir alumnos asignados a cada clase */
        foreach ($clases as &$clase) {
            $clase['alumnos'] = $alumnosPorClase[(int) $clase['id']] ?? [];
        }

        return $clases ?: [];
    }

    /**
     * Obtiene los alumnos asignados a una clase
     */
    public function obtenerAlumnosClase(int $claseId): array
    {
        global $wpdb;
        $tablaAlumnos = $wpdb->prefix . CapAlumnosCols::TABLA;

        return $wpdb->get_results($wpdb->prepare(
            "SELECT a.id, a.nombre, asi.asistio
             FROM {$this->tablaAsistencia} asi
             JOIN {$tablaAlumnos} a ON asi.alumno_id = a.id
             WHERE asi.clase_id = %d",
            $claseId
        ), 'ARRAY_A') ?: [];
    }

    /**
     * Cuenta las clases de la semana actual para un centro
     */
    public function contarSemanaActual(int $centroId): int
    {
        global $wpdb;

        /* Calcular lunes de la semana actual */
        $hoy = new \DateTime();
        $diaSemana = (int) $hoy->format('N');
        $diasHastaLunes = $diaSemana - 1;
        $lunes = $hoy->modify("-{$diasHastaLunes} days")->format('Y-m-d');
        $viernes = date('Y-m-d', strtotime($lunes . ' +4 days'));

        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->tabla} 
             WHERE centro_id = %d 
             AND fecha BETWEEN %s AND %s",
            $centroId,
            $lunes,
            $viernes
        ));
    }

    /**
     * Obtiene una clase por su ID
     */
    public function obtenerPorId(int $id): ?array
    {
        global $wpdb;

        $clase = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->tabla} WHERE id = %d",
            $id
        ), 'ARRAY_A');

        if (!$clase) {
            return null;
        }

        $clase['alumnos'] = $this->obtenerAlumnosClase($id);
        return $clase;
    }

    /**
     * Crea una nueva clase
     */
    public function crear(array $datos): int|false
    {
        global $wpdb;

        $datosValidados = $this->validarDatos($datos);
        if (!$datosValidados) {
            return false;
        }

        $datosValidados[CapClasesCols::CREATED_AT] = current_time('mysql');

        $insertado = $wpdb->insert($this->tabla, $datosValidados);

        return $insertado ? $wpdb->insert_id : false;
    }

    /**
     * Actualiza una clase existente
     */
    public function actualizar(int $id, array $datos): bool
    {
        global $wpdb;

        $datosValidados = $this->validarDatos($datos, true);
        if (!$datosValidados) {
            return false;
        }

        $actualizado = $wpdb->update(
            $this->tabla,
            $datosValidados,
            [CapClasesCols::ID => $id]
        );

        return $actualizado !== false;
    }

    /**
     * Elimina una clase (solo si no está bloqueada)
     */
    public function eliminar(int $id): bool
    {
        global $wpdb;

        /* Verificar que no esté bloqueada */
        $colBloqueada = CapClasesCols::BLOQUEADA;
        $bloqueada = $wpdb->get_var($wpdb->prepare(
            "SELECT {$colBloqueada} FROM {$this->tabla} WHERE id = %d",
            $id
        ));

        if ($bloqueada) {
            return false;
        }

        /* Eliminar asistencias asociadas, verificar retorno */
        $resultadoAsis = $wpdb->delete($this->tablaAsistencia, [CapAsistenciaCols::CLASE_ID => $id]);
        if ($resultadoAsis === false) {
            error_log("[CAP Clase] ERROR: Fallo al eliminar asistencias de la clase {$id}. DB error: {$wpdb->last_error}");
            return false;
        }

        /* Eliminar la clase */
        $eliminado = $wpdb->delete($this->tabla, [CapClasesCols::ID => $id]);

        return $eliminado !== false;
    }

    /**
     * Bloquea o desbloquea una clase
     */
    public function toggleBloqueo(int $id): bool
    {
        global $wpdb;

        $colBloqueada = CapClasesCols::BLOQUEADA;
        $estadoActual = $wpdb->get_var($wpdb->prepare(
            "SELECT {$colBloqueada} FROM {$this->tabla} WHERE id = %d",
            $id
        ));

        $nuevoEstado = $estadoActual ? 0 : 1;

        $actualizado = $wpdb->update(
            $this->tabla,
            [CapClasesCols::BLOQUEADA => $nuevoEstado],
            [CapClasesCols::ID => $id]
        );

        return $actualizado !== false;
    }

    /**
     * Asigna un alumno a una clase
     */
    public function asignarAlumno(int $claseId, int $alumnoId): bool
    {
        global $wpdb;

        /* Verificar que no exista ya la asignación */
        $existe = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->tablaAsistencia} 
             WHERE clase_id = %d AND alumno_id = %d",
            $claseId,
            $alumnoId
        ));

        if ($existe) {
            return true;
        }

        $insertado = $wpdb->insert($this->tablaAsistencia, [
            CapAsistenciaCols::CLASE_ID => $claseId,
            CapAsistenciaCols::ALUMNO_ID => $alumnoId,
            CapAsistenciaCols::ASISTIO => 0,
            CapAsistenciaCols::CREATED_AT => current_time('mysql'),
        ]);

        return $insertado !== false;
    }

    /**
     * Marca la asistencia de un alumno a una clase
     */
    public function marcarAsistencia(int $claseId, int $alumnoId, bool $asistio): bool
    {
        global $wpdb;

        $actualizado = $wpdb->update(
            $this->tablaAsistencia,
            [CapAsistenciaCols::ASISTIO => $asistio ? 1 : 0],
            [
                CapAsistenciaCols::CLASE_ID => $claseId,
                CapAsistenciaCols::ALUMNO_ID => $alumnoId,
            ]
        );

        return $actualizado !== false;
    }

    /**
     * Valida los datos de entrada
     */
    private function validarDatos(array $datos, bool $esActualizacion = false): ?array
    {
        $validados = [];

        if (isset($datos[CapClasesCols::CENTRO_ID])) {
            $validados[CapClasesCols::CENTRO_ID] = (int) $datos[CapClasesCols::CENTRO_ID];
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos[CapClasesCols::FECHA])) {
            $fecha = sanitize_text_field($datos[CapClasesCols::FECHA]);
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                return null;
            }
            $diaSemana = (int) date('N', strtotime($fecha));
            if ($diaSemana > 5) {
                return null;
            }
            $validados[CapClasesCols::FECHA] = $fecha;
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos[CapClasesCols::HORA_INICIO])) {
            $hora = sanitize_text_field($datos[CapClasesCols::HORA_INICIO]);
            if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $hora)) {
                return null;
            }
            $validados[CapClasesCols::HORA_INICIO] = $hora;
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos[CapClasesCols::HORA_FIN])) {
            $hora = sanitize_text_field($datos[CapClasesCols::HORA_FIN]);
            if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $hora)) {
                return null;
            }
            $validados[CapClasesCols::HORA_FIN] = $hora;
        }

        if (isset($datos[CapClasesCols::ASIGNATURA])) {
            $validados[CapClasesCols::ASIGNATURA] = sanitize_text_field($datos[CapClasesCols::ASIGNATURA]);
        }

        if (isset($datos[CapClasesCols::DURACION_MINUTOS])) {
            $validados[CapClasesCols::DURACION_MINUTOS] = (int) $datos[CapClasesCols::DURACION_MINUTOS];
        }

        if (isset($datos[CapClasesCols::BLOQUEADA])) {
            $validados[CapClasesCols::BLOQUEADA] = $datos[CapClasesCols::BLOQUEADA] ? 1 : 0;
        }

        return $validados;
    }
}
