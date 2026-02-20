<?php

/**
 * Modelo para gestión de alumnos del curso CAP
 * 
 * @package Glory\App\Models
 */

namespace Glory\App\Models;

use App\Config\Schema\_generated\CapAlumnosCols;
use App\Config\Schema\_generated\CapAlumnosEnums;
use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;
use App\Config\Schema\_generated\CapDisponibilidadCols;
use App\Config\Schema\CapAsignaturasConstants;

class Alumno
{
    private string $tabla;

    /*
     * Delegación a CapAsignaturasConstants para compatibilidad.
     * La fuente de verdad es CapAsignaturasConstants.
     */

    public const ASIGNATURAS_CANONICAS = CapAsignaturasConstants::TODOS;

    /**
     * Normaliza un código de asignatura a su forma canónica.
     * Maneja IDs numéricos, códigos cortos y variantes legacy.
     *
     * @param string $codigo Valor crudo de asignatura desde la BD
     * @return string Código canónico (o el original si no hay alias definido)
     */
    public static function normalizarCodigoAsignatura(string $codigo): string
    {
        $codigo = trim($codigo);
        return CapAsignaturasConstants::ALIAS[$codigo] ?? $codigo;
    }

    /**
     * Normaliza y fusiona resultados GROUP BY asignatura.
     * Múltiples variantes del mismo código se suman bajo la clave canónica.
     * Garantiza que la suma de las filas devueltas coincida con el total flat.
     *
     * @param array $progreso Rows con claves 'asignatura' y 'horas'
     * @return array Rows normalizadas y fusionadas
     */
    public static function normalizarProgresoAsignaturas(array $progreso): array
    {
        $normalizado = [];

        foreach ($progreso as $fila) {
            $codigoCanon = self::normalizarCodigoAsignatura($fila[CapClasesCols::ASIGNATURA]);

            if (!isset($normalizado[$codigoCanon])) {
                $normalizado[$codigoCanon] = [
                    CapClasesCols::ASIGNATURA => $codigoCanon,
                    'horas' => 0,
                ];
            }

            $normalizado[$codigoCanon]['horas'] += (float) $fila['horas'];
        }

        /* Redondear a 2 decimales para evitar errores de punto flotante */
        foreach ($normalizado as &$fila) {
            $fila['horas'] = round($fila['horas'], 2);
        }

        return array_values($normalizado);
    }

    /**
     * Normaliza los valores de asignatura directamente en la BD para un centro.
     * Convierte variantes legacy/alias a códigos canónicos.
     * Operación idempotente: ejecutar varias veces no causa daño.
     */
    public function normalizarAsignaturasEnBD(int $centroId): int
    {
        global $wpdb;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
        $totalActualizados = 0;

        try {
            foreach (CapAsignaturasConstants::ALIAS as $alias => $canonico) {
                if ($alias === $canonico) {
                    continue;
                }

                $actualizados = $wpdb->query($wpdb->prepare(
                    "UPDATE {$tablaClases}
                     SET asignatura = %s
                     WHERE centro_id = %d AND asignatura = %s",
                    $canonico,
                    $centroId,
                    $alias
                ));

                if ($actualizados > 0) {
                    $totalActualizados += $actualizados;
                }
            }
        } catch (\Throwable $e) {
            error_log("[CAP Alumno] ERROR en normalizarAsignaturasEnBD centro {$centroId}: " . $e->getMessage());
        }

        return $totalActualizados;
    }

    public function __construct()
    {
        global $wpdb;
        $this->tabla = $wpdb->prefix . CapAlumnosCols::TABLA;
    }

    /**
     * Obtiene todos los alumnos de un centro
     * 
     * @param int $centroId ID del centro
     * @param array $opciones Opciones de filtrado y paginación
     * @return array Lista de alumnos
     */
    public function obtenerPorCentro(int $centroId, array $opciones = []): array
    {
        global $wpdb;

        $limite = $opciones['limite'] ?? 50;
        $offset = $opciones['offset'] ?? 0;
        $busqueda = $opciones['busqueda'] ?? '';
        $ordenarPor = $opciones['ordenar_por'] ?? CapAlumnosCols::NOMBRE;
        $orden = $opciones['orden'] ?? 'ASC';

        $columnas = [CapAlumnosCols::NOMBRE, CapAlumnosCols::EMAIL, CapAlumnosCols::CREATED_AT];
        if (!in_array($ordenarPor, $columnas)) {
            $ordenarPor = CapAlumnosCols::NOMBRE;
        }
        $orden = strtoupper($orden) === 'DESC' ? 'DESC' : 'ASC';

        $where = "a.centro_id = %d";
        $params = [$centroId];

        if (!empty($busqueda)) {
            $where .= " AND (a.nombre LIKE %s OR a.email LIKE %s OR a.dni LIKE %s)";
            $busquedaLike = '%' . $wpdb->esc_like($busqueda) . '%';
            $params[] = $busquedaLike;
            $params[] = $busquedaLike;
            $params[] = $busquedaLike;
        }

        $ordenarPorSql = "a.{$ordenarPor}";

        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        $query = $wpdb->prepare(
            "SELECT a.*, 
                (SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
                 FROM {$tablaAsistencia} ca
                 JOIN {$tablaClases} c ON c.id = ca.clase_id
                 WHERE ca.alumno_id = a.id) as horas_asignadas,
                (SELECT COALESCE(SUM(c2.duracion_minutos) / 60, 0)
                 FROM {$tablaAsistencia} ca2
                 JOIN {$tablaClases} c2 ON c2.id = ca2.clase_id
                 WHERE ca2.alumno_id = a.id
                 AND c2.centro_id = a.centro_id
                 AND c2.fecha <= CURDATE()) as horas_completadas_calculadas
             FROM {$this->tabla} a
             WHERE {$where}
             ORDER BY {$ordenarPorSql} {$orden}
             LIMIT %d OFFSET %d",
            array_merge($params, [$limite, $offset])
        );

        return $wpdb->get_results($query, 'ARRAY_A') ?: [];

    }

    /**
     * Obtiene alumnos por IDs dentro de un centro.
     * Se agrega para evitar cargar listas completas cuando solo se necesita un subconjunto.
     */
    public function obtenerPorIds(int $centroId, array $ids): array
    {
        global $wpdb;

        $idsFiltrados = array_values(array_unique(array_filter(array_map('absint', $ids))));
        if (empty($idsFiltrados)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($idsFiltrados), '%d'));
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
        $query = $wpdb->prepare(
            "SELECT a.*, 
                (SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
                 FROM {$tablaAsistencia} ca
                 JOIN {$tablaClases} c ON c.id = ca.clase_id
                 WHERE ca.alumno_id = a.id) as horas_asignadas,
                (SELECT COALESCE(SUM(c2.duracion_minutos) / 60, 0)
                 FROM {$tablaAsistencia} ca2
                 JOIN {$tablaClases} c2 ON c2.id = ca2.clase_id
                 WHERE ca2.alumno_id = a.id
                 AND c2.centro_id = a.centro_id
                 AND c2.fecha <= CURDATE()) as horas_completadas_calculadas
             FROM {$this->tabla} a
             WHERE a.centro_id = %d AND a.id IN ({$placeholders})
             ORDER BY a.nombre ASC",
            array_merge([$centroId], $idsFiltrados)
        );

        return $wpdb->get_results($query, 'ARRAY_A') ?: [];
    }

    /**
     * Obtiene un alumno por su ID
     */
    public function obtenerPorId(int $id): ?array
    {
        global $wpdb;

        $alumno = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->tabla} WHERE id = %d",
            $id
        ), 'ARRAY_A');

        return $alumno ?: null;
    }

    /**
     * Cuenta el total de alumnos de un centro
     */
    public function contarPorCentro(int $centroId): int
    {
        global $wpdb;

        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->tabla} WHERE centro_id = %d",
            $centroId
        ));
    }

    /**
     * Crea un nuevo alumno
     * 
     * @param array $datos Datos del alumno
     * @return int|false ID del alumno creado o false si falla
     */
    public function crear(array $datos): int|false
    {
        global $wpdb;

        $datosValidados = $this->validarDatos($datos);
        if (!$datosValidados) {
            return false;
        }

        $datosValidados[CapAlumnosCols::CREATED_AT] = current_time('mysql');
        $datosValidados[CapAlumnosCols::UPDATED_AT] = current_time('mysql');

        try {
            $insertado = $wpdb->insert($this->tabla, $datosValidados);
            if ($insertado === false) {
                error_log("[CAP Alumno] ERROR: Fallo al crear alumno. DB error: {$wpdb->last_error}");
                return false;
            }
            return $wpdb->insert_id;
        } catch (\Throwable $e) {
            error_log('[CAP Alumno] ERROR en crear(): ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Actualiza un alumno existente
     */
    public function actualizar(int $id, array $datos): bool
    {
        global $wpdb;

        $datosValidados = $this->validarDatos($datos, true);
        if (!$datosValidados) {
            return false;
        }

        $datosValidados[CapAlumnosCols::UPDATED_AT] = current_time('mysql');

        try {
            $actualizado = $wpdb->update(
                $this->tabla,
                $datosValidados,
                [CapAlumnosCols::ID => $id]
            );

            if ($actualizado === false) {
                error_log("[CAP Alumno] ERROR: Fallo al actualizar alumno {$id}. DB error: {$wpdb->last_error}");
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            error_log("[CAP Alumno] ERROR en actualizar() alumno {$id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Elimina un alumno y sus datos asociados.
     * Elimina hijos primero (disponibilidad, asistencias) y luego el padre.
     * Verifica cada operación para evitar fallos silenciosos.
     */
    public function eliminar(int $id): bool
    {
        global $wpdb;

        /* Transacción: DELETE disponibilidad + asistencias + alumno deben ser atómicos */
        $wpdb->query('START TRANSACTION');

        try {
            /* Primero eliminar disponibilidad asociada */
            $tablaDisponibilidad = $wpdb->prefix . CapDisponibilidadCols::TABLA;
            $resultadoDisp = $wpdb->delete($tablaDisponibilidad, [CapDisponibilidadCols::ALUMNO_ID => $id]);
            if ($resultadoDisp === false) {
                $wpdb->query('ROLLBACK');
                error_log("[CAP Alumno] ERROR: Fallo al eliminar disponibilidad del alumno {$id}. DB error: {$wpdb->last_error}");
                return false;
            }

            /* Luego eliminar asistencias */
            $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
            $resultadoAsis = $wpdb->delete($tablaAsistencia, [CapAsistenciaCols::ALUMNO_ID => $id]);
            if ($resultadoAsis === false) {
                $wpdb->query('ROLLBACK');
                error_log("[CAP Alumno] ERROR: Fallo al eliminar asistencias del alumno {$id}. DB error: {$wpdb->last_error}");
                return false;
            }

            /* Finalmente eliminar el alumno */
            $eliminado = $wpdb->delete($this->tabla, [CapAlumnosCols::ID => $id]);
            if ($eliminado === false) {
                $wpdb->query('ROLLBACK');
                error_log("[CAP Alumno] ERROR: Fallo al eliminar alumno {$id}. DB error: {$wpdb->last_error}");
                return false;
            }

            $wpdb->query('COMMIT');
            return true;
        } catch (\Throwable $e) {
            $wpdb->query('ROLLBACK');
            error_log("[CAP Alumno] ERROR: Transacción fallida en eliminar alumno {$id}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Valida los datos de entrada
     */
    private function validarDatos(array $datos, bool $esActualizacion = false): ?array
    {
        $validados = [];

        if (isset($datos[CapAlumnosCols::CENTRO_ID])) {
            $validados[CapAlumnosCols::CENTRO_ID] = (int) $datos[CapAlumnosCols::CENTRO_ID];
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos[CapAlumnosCols::NOMBRE])) {
            $nombre = sanitize_text_field($datos[CapAlumnosCols::NOMBRE]);
            if (empty($nombre)) {
                return null;
            }
            $validados[CapAlumnosCols::NOMBRE] = $nombre;
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos[CapAlumnosCols::EMAIL])) {
            $email = sanitize_email($datos[CapAlumnosCols::EMAIL]);
            if (!is_email($email)) {
                return null;
            }
            $validados[CapAlumnosCols::EMAIL] = $email;
        }

        if (isset($datos[CapAlumnosCols::TELEFONO])) {
            $validados[CapAlumnosCols::TELEFONO] = sanitize_text_field($datos[CapAlumnosCols::TELEFONO]);
        }

        if (isset($datos[CapAlumnosCols::DNI])) {
            $validados[CapAlumnosCols::DNI] = sanitize_text_field($datos[CapAlumnosCols::DNI]);
        }

        if (isset($datos[CapAlumnosCols::HORAS_COMPLETADAS])) {
            $validados[CapAlumnosCols::HORAS_COMPLETADAS] = floatval($datos[CapAlumnosCols::HORAS_COMPLETADAS]);
        }

        if (isset($datos[CapAlumnosCols::ESTADO])) {
            $estadosValidos = [
                CapAlumnosEnums::ESTADO_ACTIVO,
                CapAlumnosEnums::ESTADO_COMPLETADO,
                CapAlumnosEnums::ESTADO_PAUSADO,
            ];
            $estado = sanitize_text_field($datos[CapAlumnosCols::ESTADO]);
            if (in_array($estado, $estadosValidos)) {
                $validados[CapAlumnosCols::ESTADO] = $estado;
            }
        }

        return $validados;
    }

    /**
    /*
     * Métodos de progreso delegados a AlumnoProgreso (SRP).
     * Se mantienen aquí para compatibilidad con código existente que llama $alumnoModel->obtenerProgreso().
     */

    public function obtenerProgreso(int $alumnoId): array
    {
        return (new AlumnoProgreso())->obtenerProgreso($alumnoId);
    }

    public function obtenerProgresoAsignado(int $alumnoId): array
    {
        return (new AlumnoProgreso())->obtenerProgresoAsignado($alumnoId);
    }

    public function obtenerHorasAsignadas(int $alumnoId): float
    {
        return (new AlumnoProgreso())->obtenerHorasAsignadas($alumnoId);
    }

    public function recalcularHorasCompletadas(int $alumnoId): float
    {
        return (new AlumnoProgreso())->recalcularHorasCompletadas($alumnoId);
    }

    public function recalcularProgresoCentro(int $centroId): bool
    {
        return (new AlumnoProgreso())->recalcularProgresoCentro($centroId);
    }

    public function recalcularProgresoAlumnos(array $alumnosIds): bool
    {
        return (new AlumnoProgreso())->recalcularProgresoAlumnos($alumnosIds);
    }

    public function filtrarAlumnosNoCompletados(int $centroId, array $alumnosIds, string $semanaExcluir = ''): array
    {
        return (new AlumnoProgreso())->filtrarAlumnosNoCompletados($centroId, $alumnosIds, $semanaExcluir);
    }
}
