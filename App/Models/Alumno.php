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
    private function normalizarProgresoAsignaturas(array $progreso): array
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

        $insertado = $wpdb->insert($this->tabla, $datosValidados);

        return $insertado ? $wpdb->insert_id : false;
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

        $actualizado = $wpdb->update(
            $this->tabla,
            $datosValidados,
            [CapAlumnosCols::ID => $id]
        );

        return $actualizado !== false;
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

        return $this->normalizarProgresoAsignaturas($progreso ?: []);
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

        return $this->normalizarProgresoAsignaturas($progreso ?: []);
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

        $horas = (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d AND c.fecha <= CURDATE()",
            $alumnoId
        ));

        /* Actualizar cache en tabla de alumnos, verificar retorno */
        $resultado = $wpdb->update(
            $this->tabla,
            [CapAlumnosCols::HORAS_COMPLETADAS => $horas, CapAlumnosCols::UPDATED_AT => current_time('mysql')],
            [CapAlumnosCols::ID => $alumnoId]
        );

        if ($resultado === false) {
            error_log("[CAP Alumno] ERROR: Fallo al actualizar horas_completadas del alumno {$alumnoId}. DB error: {$wpdb->last_error}");
        }

        return $horas;
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
            "SELECT id FROM {$this->tabla} WHERE centro_id = %d",
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

        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
        $placeholdersSubquery = implode(',', array_fill(0, count($ids), '%d'));
        $placeholdersWhere = implode(',', array_fill(0, count($ids), '%d'));

        $query = "
            UPDATE {$this->tabla} al
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
             FROM {$this->tabla} a
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
