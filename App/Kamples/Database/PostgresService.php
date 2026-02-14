<?php

/**
 * Kamples — Servicio de conexión a PostgreSQL (PDO)
 *
 * Bridge entre WordPress (MySQL) y la base de datos principal de Kamples.
 * Singleton que mantiene una sola conexión PDO durante el ciclo de vida del request.
 *
 * Las credenciales se leen desde variables de entorno (archivo .env).
 * Variables necesarias:
 *   KAMPLES_PG_HOST, KAMPLES_PG_PORT, KAMPLES_PG_DBNAME,
 *   KAMPLES_PG_USER, KAMPLES_PG_PASSWORD
 *
 * @package Kamples
 */

namespace App\Kamples\Database;

use PDO;
use PDOException;

class PostgresService
{
    private static ?PDO $conexion = null;
    private static bool $intentoFallido = false;

    /*
     * Obtiene la conexión PDO a PostgreSQL.
     * Si no existe, la crea automáticamente.
     * Retorna null si la conexión falla (sin lanzar excepción para no romper WP).
     */
    public static function obtenerConexion(): ?PDO
    {
        if (self::$conexion !== null) {
            return self::$conexion;
        }

        if (self::$intentoFallido) {
            return null;
        }

        try {
            $host = self::env('KAMPLES_PG_HOST', '127.0.0.1');
            $port = self::env('KAMPLES_PG_PORT', '5432');
            $dbname = self::env('KAMPLES_PG_DBNAME', 'kamples');
            $user = self::env('KAMPLES_PG_USER', 'kamples');
            $password = self::env('KAMPLES_PG_PASSWORD', '');

            if (empty($password)) {
                error_log('[Kamples] PostgresService: falta KAMPLES_PG_PASSWORD en .env');
                self::$intentoFallido = true;
                return null;
            }

            $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";

            self::$conexion = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);

            /* Configurar timezone y search_path */
            self::$conexion->exec("SET timezone = 'UTC'");
            self::$conexion->exec("SET search_path TO public");

            return self::$conexion;

        } catch (PDOException $e) {
            error_log('[Kamples] PostgresService: error de conexión — ' . $e->getMessage());
            self::$intentoFallido = true;
            return null;
        }
    }

    /*
     * Verifica si la conexión está activa y funcional.
     */
    public static function estaConectado(): bool
    {
        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return false;
        }

        try {
            $pdo->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    /*
     * Ejecuta una consulta preparada y retorna los resultados.
     * Retorna array vacío si la consulta falla.
     */
    public static function consultar(string $sql, array $params = []): array
    {
        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return [];
        }

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('[Kamples] PostgresService::consultar error — ' . $e->getMessage());
            return [];
        }
    }

    /*
     * Ejecuta una consulta preparada y retorna una sola fila.
     */
    public static function consultarUno(string $sql, array $params = []): ?array
    {
        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return null;
        }

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            return $result !== false ? $result : null;
        } catch (PDOException $e) {
            error_log('[Kamples] PostgresService::consultarUno error — ' . $e->getMessage());
            return null;
        }
    }

    /*
     * Ejecuta un INSERT/UPDATE/DELETE y retorna el número de filas afectadas.
     * Retorna -1 si falla.
     */
    public static function ejecutar(string $sql, array $params = []): int
    {
        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return -1;
        }

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log('[Kamples] PostgresService::ejecutar error — ' . $e->getMessage());
            return -1;
        }
    }

    /*
     * Ejecuta un INSERT y retorna el ID generado.
     * Retorna null si falla.
     */
    public static function insertar(string $sql, array $params = []): ?int
    {
        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return null;
        }

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return (int) $pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log('[Kamples] PostgresService::insertar error — ' . $e->getMessage());
            return null;
        }
    }

    /*
     * Inicia una transacción.
     */
    public static function iniciarTransaccion(): bool
    {
        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return false;
        }

        return $pdo->beginTransaction();
    }

    /*
     * Confirma la transacción actual.
     */
    public static function confirmar(): bool
    {
        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return false;
        }

        return $pdo->commit();
    }

    /*
     * Revierte la transacción actual.
     */
    public static function revertir(): bool
    {
        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return false;
        }

        return $pdo->rollBack();
    }

    /*
     * Lee una variable de entorno con fallback.
     */
    private static function env(string $key, string $default = ''): string
    {
        $value = $_ENV[$key] ?? getenv($key);
        return ($value !== false && $value !== null && $value !== '') ? (string)$value : $default;
    }

    /*
     * Cierra la conexión (para uso en tests o cleanup manual).
     */
    public static function cerrar(): void
    {
        self::$conexion = null;
        self::$intentoFallido = false;
    }
}
