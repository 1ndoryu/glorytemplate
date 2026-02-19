<?php

/**
 * Modelo para gestión de alumnos del curso CAP
 * 
 * @package Glory\App\Models
 */

namespace Glory\App\Models;

class Alumno
{
    private string $tabla;

    /*
     * Mapa completo de alias de asignatura a códigos canónicos.
     * Incluye IDs numéricos, códigos cortos y variantes legacy del seeder.
     * Fuente de verdad única para normalizar cualquier valor de asignatura.
     */
    private const ASIGNATURA_ALIAS = [
        /* IDs numéricos */
        '1' => 'conduccion_racional',
        '2' => 'reglamentacion',
        '3' => 'seguridad_vial',
        '4' => 'servicio_logistica',
        '5' => 'salud_seguridad',
        '6' => 'medio_ambiente',
        '7' => 'mercancias_peligrosas',
        '8' => 'viajeros',
        /* Códigos cortos del frontend */
        'CR' => 'conduccion_racional',
        'REG' => 'reglamentacion',
        'SV' => 'seguridad_vial',
        'SL' => 'servicio_logistica',
        'SS' => 'salud_seguridad',
        'MA' => 'medio_ambiente',
        'MP' => 'mercancias_peligrosas',
        'VIA' => 'viajeros',
        /* Variantes legacy del seeder */
        'racionalizacion' => 'conduccion_racional',
        'salud_ergonomia' => 'salud_seguridad',
        'entorno_economico' => 'medio_ambiente',
        'evaluacion' => 'viajeros',
    ];

    /*
     * Los 8 códigos canónicos que son la fuente de verdad.
     * Cualquier otro valor debe mapearse a uno de estos.
     */
    public const ASIGNATURAS_CANONICAS = [
        'conduccion_racional',
        'reglamentacion',
        'seguridad_vial',
        'servicio_logistica',
        'salud_seguridad',
        'medio_ambiente',
        'mercancias_peligrosas',
        'viajeros',
    ];

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
        return self::ASIGNATURA_ALIAS[$codigo] ?? $codigo;
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
            $codigoCanon = self::normalizarCodigoAsignatura($fila['asignatura']);

            if (!isset($normalizado[$codigoCanon])) {
                $normalizado[$codigoCanon] = [
                    'asignatura' => $codigoCanon,
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
        $tablaClases = $wpdb->prefix . 'cap_clases';
        $totalActualizados = 0;

        foreach (self::ASIGNATURA_ALIAS as $alias => $canonico) {
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
        $this->tabla = $wpdb->prefix . 'cap_alumnos';
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
        $ordenarPor = $opciones['ordenar_por'] ?? 'nombre';
        $orden = $opciones['orden'] ?? 'ASC';

        $columnas = ['nombre', 'email', 'created_at'];
        if (!in_array($ordenarPor, $columnas)) {
            $ordenarPor = 'nombre';
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

        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';

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
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';
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

        $datosValidados['created_at'] = current_time('mysql');
        $datosValidados['updated_at'] = current_time('mysql');

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

        $datosValidados['updated_at'] = current_time('mysql');

        $actualizado = $wpdb->update(
            $this->tabla,
            $datosValidados,
            ['id' => $id]
        );

        return $actualizado !== false;
    }

    /**
     * Elimina un alumno
     */
    public function eliminar(int $id): bool
    {
        global $wpdb;

        /* Primero eliminar disponibilidad asociada */
        $tablaDisponibilidad = $wpdb->prefix . 'cap_disponibilidad';
        $wpdb->delete($tablaDisponibilidad, ['alumno_id' => $id]);

        /* Luego eliminar asistencias */
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $wpdb->delete($tablaAsistencia, ['alumno_id' => $id]);

        /* Finalmente eliminar el alumno */
        $eliminado = $wpdb->delete($this->tabla, ['id' => $id]);

        return $eliminado !== false;
    }

    /**
     * Valida los datos de entrada
     */
    private function validarDatos(array $datos, bool $esActualizacion = false): ?array
    {
        $validados = [];

        if (isset($datos['centro_id'])) {
            $validados['centro_id'] = (int) $datos['centro_id'];
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos['nombre'])) {
            $nombre = sanitize_text_field($datos['nombre']);
            if (empty($nombre)) {
                return null;
            }
            $validados['nombre'] = $nombre;
        } elseif (!$esActualizacion) {
            return null;
        }

        if (isset($datos['email'])) {
            $email = sanitize_email($datos['email']);
            if (!is_email($email)) {
                return null;
            }
            $validados['email'] = $email;
        }

        if (isset($datos['telefono'])) {
            $validados['telefono'] = sanitize_text_field($datos['telefono']);
        }

        if (isset($datos['dni'])) {
            $validados['dni'] = sanitize_text_field($datos['dni']);
        }

        if (isset($datos['horas_completadas'])) {
            $validados['horas_completadas'] = floatval($datos['horas_completadas']);
        }

        if (isset($datos['estado'])) {
            $estadosValidos = ['activo', 'completado', 'pausado'];
            $estado = sanitize_text_field($datos['estado']);
            if (in_array($estado, $estadosValidos)) {
                $validados['estado'] = $estado;
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
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';

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
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';

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
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';

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
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';

        $horas = (float) $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(c.duracion_minutos) / 60, 0)
             FROM {$tablaAsistencia} a
             JOIN {$tablaClases} c ON a.clase_id = c.id
             WHERE a.alumno_id = %d AND c.fecha <= CURDATE()",
            $alumnoId
        ));

        /* Actualizar cache en tabla de alumnos */
        $wpdb->update(
            $this->tabla,
            ['horas_completadas' => $horas, 'updated_at' => current_time('mysql')],
            ['id' => $alumnoId]
        );

        return $horas;
    }

    /**
     * Recalcula horas_completadas de todos los alumnos de un centro.
     * Útil tras generar o eliminar clases.
     */
    public function recalcularProgresoCentro(int $centroId): void
    {
        global $wpdb;

        $alumnosIds = $wpdb->get_col($wpdb->prepare(
            "SELECT id FROM {$this->tabla} WHERE centro_id = %d",
            $centroId
        ));

        $this->recalcularProgresoEnLote($alumnosIds);
    }

    /**
     * Recalcula horas_completadas de un conjunto específico de alumnos.
     * Se usa tras generar calendario para actualizar solo los alumnos afectados.
     */
    public function recalcularProgresoAlumnos(array $alumnosIds): void
    {
        $this->recalcularProgresoEnLote($alumnosIds);
    }

    private function recalcularProgresoEnLote(array $alumnosIds): void
    {
        global $wpdb;
        $ids = array_values(array_unique(array_filter(array_map('intval', $alumnosIds))));
        if (empty($ids)) {
            return;
        }

        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';
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
        $wpdb->query($wpdb->prepare($query, ...$params));
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

        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';
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
