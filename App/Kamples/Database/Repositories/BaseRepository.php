<?php

/**
 * BaseRepository — Clase base para todos los repositorios.
 *
 * Centraliza el acceso a PostgresService y provee CRUD base tipado.
 * Cada repositorio concreto define tabla() y colId() usando Cols.
 *
 * Principios:
 * - Métodos estáticos (consistente con PostgresService)
 * - Usa Cols para tabla/columnas, Enums para valores
 * - Retorna arrays (flexibilidad) o DTOs (tipado fuerte)
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Kamples\Database\PostgresService;

abstract class BaseRepository
{
    /* Nombre de la tabla (desde Cols::TABLA) */
    abstract protected static function tabla(): string;

    /* Nombre de la columna PK (desde Cols::ID) */
    abstract protected static function colId(): string;

    /*
     * Ejecuta SELECT y retorna array de filas.
     * Delegado directo a PostgresService.
     * Publico para permitir que Services con SQL dinamico usen repos sin acceder a PostgresService.
     */
    public static function consultar(string $sql, array $params = []): array
    {
        return PostgresService::consultar($sql, $params);
    }

    /*
     * Ejecuta SELECT y retorna una sola fila o null.
     */
    public static function consultarUno(string $sql, array $params = []): ?array
    {
        return PostgresService::consultarUno($sql, $params);
    }

    /*
     * Ejecuta INSERT/UPDATE/DELETE y retorna filas afectadas (-1 si falla).
     */
    public static function ejecutar(string $sql, array $params = []): int
    {
        return PostgresService::ejecutar($sql, $params);
    }

    /*
     * Ejecuta INSERT y retorna el ID generado (null si falla).
     */
    public static function insertar(string $sql, array $params = []): ?int
    {
        return PostgresService::insertar($sql, $params);
    }

    /*
     * Buscar registro por ID (PK).
     */
    public static function buscarPorId(int $id): ?array
    {
        $tabla = static::tabla();
        $colId = static::colId();

        return static::consultarUno(
            "SELECT * FROM {$tabla} WHERE {$colId} = :id",
            ['id' => $id]
        );
    }

    /*
     * Listar registros con paginación.
     */
    public static function buscarTodos(int $limit = 100, int $offset = 0): array
    {
        $tabla = static::tabla();

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . static::colId() . " DESC LIMIT :limit OFFSET :offset",
            ['limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Eliminar registro por ID. Retorna true si eliminó al menos una fila.
     */
    public static function eliminarPorId(int $id): bool
    {
        $tabla = static::tabla();
        $colId = static::colId();

        $afectadas = static::ejecutar(
            "DELETE FROM {$tabla} WHERE {$colId} = :id",
            ['id' => $id]
        );

        return $afectadas > 0;
    }

    /*
     * Contar total de registros en la tabla.
     */
    public static function contar(): int
    {
        $tabla = static::tabla();

        $row = static::consultarUno("SELECT COUNT(*) as total FROM {$tabla}");

        return $row ? (int) $row['total'] : 0;
    }

    /*
     * Contar registros con condiciones WHERE.
     * Ejemplo: contarDonde(['estado' => 'activo', 'creador_id' => 5])
     */
    public static function contarDonde(array $condiciones): int
    {
        $tabla = static::tabla();
        $where = [];
        $params = [];

        foreach ($condiciones as $columna => $valor) {
            $paramName = str_replace('.', '_', $columna);
            $where[] = "{$columna} = :{$paramName}";
            $params[$paramName] = $valor;
        }

        $whereSql = implode(' AND ', $where);
        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla} WHERE {$whereSql}",
            $params
        );

        return $row ? (int) $row['total'] : 0;
    }

    /*
     * Buscar registros por condiciones simples (igualdad).
     * Ejemplo: buscarDonde(['estado' => 'activo'], 20, 0, 'created_at DESC')
     */
    public static function buscarDonde(
        array $condiciones,
        int $limit = 100,
        int $offset = 0,
        string $orderBy = 'id DESC'
    ): array {
        $tabla = static::tabla();
        $where = [];
        $params = ['limit' => $limit, 'offset' => $offset];

        foreach ($condiciones as $columna => $valor) {
            $paramName = str_replace('.', '_', $columna);
            $where[] = "{$columna} = :{$paramName}";
            $params[$paramName] = $valor;
        }

        $whereSql = implode(' AND ', $where);

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$whereSql} ORDER BY {$orderBy} LIMIT :limit OFFSET :offset",
            $params
        );
    }

    /*
     * Insertar un registro desde array asociativo [columna => valor].
     * Retorna el ID generado o null.
     */
    public static function insertarRegistro(array $datos): ?int
    {
        $tabla = static::tabla();
        $columnas = array_keys($datos);
        $placeholders = array_map(fn($c) => ':' . $c, $columnas);

        $sql = "INSERT INTO {$tabla} (" . implode(', ', $columnas) . ") "
             . "VALUES (" . implode(', ', $placeholders) . ") "
             . "RETURNING " . static::colId();

        return static::insertar($sql, $datos);
    }

    /*
     * Actualizar registro por ID con array de cambios [columna => valor].
     * Retorna true si actualizó al menos una fila.
     */
    public static function actualizarPorId(int $id, array $cambios): bool
    {
        $tabla = static::tabla();
        $colId = static::colId();
        $sets = [];
        $params = ['id' => $id];

        foreach ($cambios as $columna => $valor) {
            $paramName = 'set_' . $columna;
            $sets[] = "{$columna} = :{$paramName}";
            $params[$paramName] = $valor;
        }

        $setSql = implode(', ', $sets);
        $afectadas = static::ejecutar(
            "UPDATE {$tabla} SET {$setSql} WHERE {$colId} = :id",
            $params
        );

        return $afectadas > 0;
    }

    /*
     * Verificar si existe un registro con las condiciones dadas.
     */
    public static function existe(array $condiciones): bool
    {
        return static::contarDonde($condiciones) > 0;
    }

    /* Transacciones delegadas a PostgresService */
    protected static function iniciarTransaccion(): bool
    {
        return PostgresService::iniciarTransaccion();
    }

    protected static function confirmar(): bool
    {
        return PostgresService::confirmar();
    }

    protected static function revertir(): bool
    {
        return PostgresService::revertir();
    }

    /*
     * Health check de conexión a base de datos.
     */
    public static function estaConectado(): bool
    {
        return PostgresService::estaConectado();
    }
}
