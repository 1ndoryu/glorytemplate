<?php

/**
 * CapDisponibilidadRepository — Acceso a datos para tabla 'cap_disponibilidad'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package App
 */

namespace Glory\App\Database\Repositories;

use App\Config\Schema\_generated\CapDisponibilidadCols;

class CapDisponibilidadRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CapDisponibilidadCols::TABLA;
    }

    protected static function colId(): string
    {
        return CapDisponibilidadCols::ID;
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
     * Obtiene todos los slots de disponibilidad de un alumno.
     */
    public static function buscarSlotsPorAlumno(int $alumnoId): array
    {
        $tabla = static::tablaCompleta();
        $colAlumnoId = CapDisponibilidadCols::ALUMNO_ID;
        $colDia = CapDisponibilidadCols::DIA;
        $colHora = CapDisponibilidadCols::HORA;
        $colDisponible = CapDisponibilidadCols::DISPONIBLE;

        return static::consultar(
            "SELECT {$colDia}, {$colHora}, {$colDisponible} FROM {$tabla} WHERE {$colAlumnoId} = :alumnoId",
            ['alumnoId' => $alumnoId]
        );
    }

    /**
     * Elimina toda la disponibilidad de un alumno.
     */
    public static function eliminarPorAlumno(int $alumnoId): bool
    {
        global $wpdb;
        $tabla = static::tablaCompleta();

        try {
            $resultado = $wpdb->delete($tabla, [CapDisponibilidadCols::ALUMNO_ID => $alumnoId]);
            if ($resultado === false) {
                error_log("[CapDisponibilidadRepo::eliminarPorAlumno] Fallo: {$wpdb->last_error}");
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            error_log("[CapDisponibilidadRepo::eliminarPorAlumno] Error: {$e->getMessage()}");
            return false;
        }
    }

    /* [2003A-4] Batch INSERT de slots de disponibilidad para evitar N+1.
     * Recibe un array de arrays con las columnas a insertar. */
    public static function insertarLote(array $slots): bool
    {
        if (empty($slots)) {
            return true;
        }

        global $wpdb;
        $tabla = static::tablaCompleta();
        $colAlumnoId = CapDisponibilidadCols::ALUMNO_ID;
        $colDia = CapDisponibilidadCols::DIA;
        $colHora = CapDisponibilidadCols::HORA;
        $colDisponible = CapDisponibilidadCols::DISPONIBLE;
        $colCreatedAt = CapDisponibilidadCols::CREATED_AT;
        $colUpdatedAt = CapDisponibilidadCols::UPDATED_AT;

        $placeholders = [];
        $valores = [];
        foreach ($slots as $s) {
            $placeholders[] = '(%d, %s, %s, %d, %s, %s)';
            $valores[] = $s['alumno_id'];
            $valores[] = $s['dia'];
            $valores[] = $s['hora'];
            $valores[] = $s['disponible'];
            $valores[] = $s['created_at'];
            $valores[] = $s['updated_at'];
        }

        $sql = "INSERT INTO {$tabla} ({$colAlumnoId}, {$colDia}, {$colHora}, {$colDisponible}, {$colCreatedAt}, {$colUpdatedAt}) VALUES " . implode(', ', $placeholders);

        try {
            $resultado = $wpdb->query($wpdb->prepare($sql, $valores));
            if ($resultado === false) {
                error_log("[CapDisponibilidadRepo::insertarLote] Fallo: {$wpdb->last_error}");
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            error_log("[CapDisponibilidadRepo::insertarLote] Error: {$e->getMessage()}");
            return false;
        }
    }
}
