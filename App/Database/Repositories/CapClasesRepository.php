<?php

/**
 * CapClasesRepository — Acceso a datos para tabla 'cap_clases'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package App
 */

namespace Glory\App\Database\Repositories;

use App\Config\Schema\_generated\CapClasesCols;

class CapClasesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CapClasesCols::TABLA;
    }

    protected static function colId(): string
    {
        return CapClasesCols::ID;
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
     * Busca IDs de clases de un centro, con filtro de bloqueadas opcional.
     */
    public static function buscarIdsPorCentro(int $centroId, bool $incluirBloqueadas = false): array
    {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colCentroId = CapClasesCols::CENTRO_ID;
        $colBloqueada = CapClasesCols::BLOQUEADA;

        $where = $incluirBloqueadas ? '' : " AND {$colBloqueada} = 0";

        try {
            $ids = $wpdb->get_col($wpdb->prepare(
                "SELECT id FROM {$tabla} WHERE {$colCentroId} = %d{$where}",
                $centroId
            ));
            return array_map('intval', $ids ?: []);
        } catch (\Throwable $e) {
            error_log("[CapClasesRepo::buscarIdsPorCentro] Error: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Busca IDs de clases de un centro dentro de un rango de fechas.
     */
    public static function buscarIdsPorCentroYSemana(
        int $centroId,
        string $fechaInicio,
        string $fechaFin,
        bool $incluirBloqueadas = false
    ): array {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colCentroId = CapClasesCols::CENTRO_ID;
        $colFecha = CapClasesCols::FECHA;
        $colBloqueada = CapClasesCols::BLOQUEADA;

        $where = $incluirBloqueadas ? '' : " AND {$colBloqueada} = 0";

        try {
            $ids = $wpdb->get_col($wpdb->prepare(
                "SELECT id FROM {$tabla} WHERE {$colCentroId} = %d AND {$colFecha} >= %s AND {$colFecha} <= %s{$where}",
                $centroId,
                $fechaInicio,
                $fechaFin
            ));
            return array_map('intval', $ids ?: []);
        } catch (\Throwable $e) {
            error_log("[CapClasesRepo::buscarIdsPorCentroYSemana] Error: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Elimina clases de un centro, opcionalmente excluyendo bloqueadas.
     * Retorna cantidad de filas eliminadas o false si falla.
     */
    public static function eliminarPorCentro(int $centroId, bool $incluirBloqueadas = false): int|false
    {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colCentroId = CapClasesCols::CENTRO_ID;
        $colBloqueada = CapClasesCols::BLOQUEADA;

        $where = $incluirBloqueadas ? '' : " AND {$colBloqueada} = 0";

        try {
            $resultado = $wpdb->query($wpdb->prepare(
                "DELETE FROM {$tabla} WHERE {$colCentroId} = %d{$where}",
                $centroId
            ));
            if ($resultado === false) {
                error_log("[CapClasesRepo::eliminarPorCentro] Fallo: {$wpdb->last_error}");
            }
            return $resultado;
        } catch (\Throwable $e) {
            error_log("[CapClasesRepo::eliminarPorCentro] Error: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Elimina clases de un centro dentro de un rango de fechas.
     * Retorna cantidad de filas eliminadas o false si falla.
     */
    public static function eliminarPorCentroYSemana(
        int $centroId,
        string $fechaInicio,
        string $fechaFin,
        bool $incluirBloqueadas = false
    ): int|false {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colCentroId = CapClasesCols::CENTRO_ID;
        $colFecha = CapClasesCols::FECHA;
        $colBloqueada = CapClasesCols::BLOQUEADA;

        $where = $incluirBloqueadas ? '' : " AND {$colBloqueada} = 0";

        try {
            $resultado = $wpdb->query($wpdb->prepare(
                "DELETE FROM {$tabla} WHERE {$colCentroId} = %d AND {$colFecha} >= %s AND {$colFecha} <= %s{$where}",
                $centroId,
                $fechaInicio,
                $fechaFin
            ));
            if ($resultado === false) {
                error_log("[CapClasesRepo::eliminarPorCentroYSemana] Fallo: {$wpdb->last_error}");
            }
            return $resultado;
        } catch (\Throwable $e) {
            error_log("[CapClasesRepo::eliminarPorCentroYSemana] Error: {$e->getMessage()}");
            return false;
        }
    }
}
