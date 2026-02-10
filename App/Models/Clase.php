<?php

/**
 * Modelo para gestión de clases/slots del calendario CAP
 * 
 * @package Glory\App\Models
 */

namespace Glory\App\Models;

class Clase
{
    private string $tabla;
    private string $tablaAsistencia;

    public function __construct()
    {
        global $wpdb;
        $this->tabla = $wpdb->prefix . 'cap_clases';
        $this->tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
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

        $fechaFin = date('Y-m-d', strtotime($fechaInicio . ' +4 days'));

        $clases = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->tabla} 
             WHERE centro_id = %d 
             AND fecha BETWEEN %s AND %s
             ORDER BY fecha ASC, hora_inicio ASC",
            $centroId,
            $fechaInicio,
            $fechaFin
        ), ARRAY_A);

        /* Añadir alumnos asignados a cada clase */
        foreach ($clases as &$clase) {
            $clase['alumnos'] = $this->obtenerAlumnosClase($clase['id']);
        }

        return $clases ?: [];
    }

    /**
     * Obtiene los alumnos asignados a una clase
     */
    public function obtenerAlumnosClase(int $claseId): array
    {
        global $wpdb;
        $tablaAlumnos = $wpdb->prefix . 'cap_alumnos';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT a.id, a.nombre, asi.asistio
             FROM {$this->tablaAsistencia} asi
             JOIN {$tablaAlumnos} a ON asi.alumno_id = a.id
             WHERE asi.clase_id = %d",
            $claseId
        ), ARRAY_A) ?: [];
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
        ), ARRAY_A);

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

        $datosValidados['created_at'] = current_time('mysql');

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
            ['id' => $id]
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
        $bloqueada = $wpdb->get_var($wpdb->prepare(
            "SELECT bloqueada FROM {$this->tabla} WHERE id = %d",
            $id
        ));

        if ($bloqueada) {
            return false;
        }

        /* Eliminar asistencias asociadas */
        $wpdb->delete($this->tablaAsistencia, ['clase_id' => $id]);

        /* Eliminar la clase */
        $eliminado = $wpdb->delete($this->tabla, ['id' => $id]);

        return $eliminado !== false;
    }

    /**
     * Bloquea o desbloquea una clase
     */
    public function toggleBloqueo(int $id): bool
    {
        global $wpdb;

        $estadoActual = $wpdb->get_var($wpdb->prepare(
            "SELECT bloqueada FROM {$this->tabla} WHERE id = %d",
            $id
        ));

        $nuevoEstado = $estadoActual ? 0 : 1;

        $actualizado = $wpdb->update(
            $this->tabla,
            ['bloqueada' => $nuevoEstado],
            ['id' => $id]
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
            'clase_id' => $claseId,
            'alumno_id' => $alumnoId,
            'asistio' => 0,
            'created_at' => current_time('mysql'),
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
            ['asistio' => $asistio ? 1 : 0],
            [
                'clase_id' => $claseId,
                'alumno_id' => $alumnoId,
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

        if (isset($datos['centro_id'])) {
            $validados['centro_id'] = absint($datos['centro_id']);
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos['fecha'])) {
            $fecha = sanitize_text_field($datos['fecha']);
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
                return null;
            }
            $diaSemana = (int) date('N', strtotime($fecha));
            if ($diaSemana > 5) {
                return null;
            }
            $validados['fecha'] = $fecha;
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos['hora_inicio'])) {
            $hora = sanitize_text_field($datos['hora_inicio']);
            if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $hora)) {
                return null;
            }
            $validados['hora_inicio'] = $hora;
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos['hora_fin'])) {
            $hora = sanitize_text_field($datos['hora_fin']);
            if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $hora)) {
                return null;
            }
            $validados['hora_fin'] = $hora;
        }

        if (isset($datos['asignatura'])) {
            $validados['asignatura'] = sanitize_text_field($datos['asignatura']);
        }

        if (isset($datos['duracion_minutos'])) {
            $validados['duracion_minutos'] = absint($datos['duracion_minutos']);
        }

        if (isset($datos['bloqueada'])) {
            $validados['bloqueada'] = $datos['bloqueada'] ? 1 : 0;
        }

        return $validados;
    }
}
