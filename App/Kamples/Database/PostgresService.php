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

use App\Kamples\KamplesLogger;
use Glory\Core\SchemaRegistry;
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
            /* Intentar cargar .env manualmente si Dotenv no lo hizo */
            self::cargarEnvSiNecesario();

            $host = self::env('KAMPLES_PG_HOST', '127.0.0.1');
            $port = self::env('KAMPLES_PG_PORT', '5432');
            $dbname = self::env('KAMPLES_PG_DBNAME', 'kamples');
            $user = self::env('KAMPLES_PG_USER', 'postgres');
            $password = self::env('KAMPLES_PG_PASSWORD', 'root');

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
            KamplesLogger::error('PostgresService: Error de conexión', [
                'error' => $e->getMessage(),
            ]);
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
     * En modo estricto (WP_DEBUG), valida tablas contra SchemaRegistry.
     */
    public static function consultar(string $sql, array $params = []): array
    {
        self::validarQueryContraSchema($sql);

        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return [];
        }

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            KamplesLogger::error('PostgresService::consultar error', [
                'error' => $e->getMessage(),
                'sql' => mb_substr($sql, 0, 200),
            ]);
            return [];
        }
    }

    /*
     * Ejecuta una consulta preparada y retorna una sola fila.
     * En modo estricto (WP_DEBUG), valida tablas contra SchemaRegistry.
     */
    public static function consultarUno(string $sql, array $params = []): ?array
    {
        self::validarQueryContraSchema($sql);

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
            KamplesLogger::error('PostgresService::consultarUno error', [
                'error' => $e->getMessage(),
                'sql' => mb_substr($sql, 0, 200),
            ]);
            return null;
        }
    }

    /*
     * Ejecuta un INSERT/UPDATE/DELETE y retorna el número de filas afectadas.
     * Retorna -1 si falla.
     */
    public static function ejecutar(string $sql, array $params = []): int
    {
        self::validarQueryContraSchema($sql);

        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return -1;
        }

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            KamplesLogger::error('PostgresService::ejecutar error', [
                'error' => $e->getMessage(),
                'sql' => mb_substr($sql, 0, 200),
            ]);
            return -1;
        }
    }

    /*
     * Ejecuta un INSERT y retorna el ID generado.
     * Retorna null si falla.
     */
    public static function insertar(string $sql, array $params = []): ?int
    {
        self::validarQueryContraSchema($sql);

        $pdo = self::obtenerConexion();
        if ($pdo === null) {
            return null;
        }

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return (int) $pdo->lastInsertId();
        } catch (PDOException $e) {
            KamplesLogger::error('PostgresService::insertar error', [
                'error' => $e->getMessage(),
                'sql' => mb_substr($sql, 0, 200),
            ]);
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
     * Carga el .env directamente si Dotenv no lo hizo.
     * Fallback para contextos donde functions.php no se ejecutó primero.
     */
    private static function cargarEnvSiNecesario(): void
    {
        /* Si ya hay variables KAMPLES_PG_*, Dotenv ya las cargó */
        if (!empty($_ENV['KAMPLES_PG_HOST']) || !empty(getenv('KAMPLES_PG_HOST'))) {
            return;
        }

        /* Buscar .env en la raíz del tema */
        $envPath = get_stylesheet_directory() . '/.env';
        if (!file_exists($envPath)) {
            return;
        }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            /* Ignorar comentarios */
            if (str_starts_with($line, '#')) {
                continue;
            }
            /* Solo procesar KAMPLES_PG_* */
            if (!str_starts_with($line, 'KAMPLES_PG_')) {
                continue;
            }
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $key = trim($parts[0]);
                $val = trim($parts[1]);
                $_ENV[$key] = $val;
                putenv("{$key}={$val}");
            }
        }
    }

    /*
     * Cierra la conexión (para uso en tests o cleanup manual).
     */
    public static function cerrar(): void
    {
        self::$conexion = null;
        self::$intentoFallido = false;
    }

    /*
     * Valida tablas referenciadas en una query SQL contra SchemaRegistry.
     * Solo activo en modo estricto (WP_DEBUG).
     * Extrae nombres de tabla de FROM/JOIN/INTO/UPDATE y verifica que tengan schema.
     */
    private static function validarQueryContraSchema(string $sql): void
    {
        if (!SchemaRegistry::modoEstricto()) {
            return;
        }

        /* Extraer nombres de CTEs definidos con WITH para ignorarlos como tablas */
        $ctes = [];
        if (preg_match_all('/\bWITH\s+([a-z_]+)\s+AS\s*\(/i', $sql, $cteMatches)) {
            $ctes = array_map('strtolower', $cteMatches[1]);
        }
        /* Soporte para CTEs encadenados: WITH cte1 AS (...), cte2 AS (...) */
        if (preg_match_all('/,\s*([a-z_]+)\s+AS\s*\(/i', $sql, $cteChain)) {
            $ctes = array_merge($ctes, array_map('strtolower', $cteChain[1]));
        }

        /* Extraer tablas de la query: FROM tabla, JOIN tabla, INTO tabla, UPDATE tabla */
        $patron = '/\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z_]+)/i';
        if (preg_match_all($patron, $sql, $matches)) {
            foreach ($matches[1] as $tabla) {
                $tabla = strtolower($tabla);
                /* Ignorar tablas del sistema PG, aliases cortos y CTEs */
                if (in_array($tabla, ['information_schema', 'pg_extension', 'pg_indexes', 'pg_class', 'pg_attribute', 'lateral', 'select', 'set'])) {
                    continue;
                }
                /* Ignorar CTEs definidos en WITH */
                if (in_array($tabla, $ctes)) {
                    continue;
                }
                /* Ignorar aliases cortos (1-2 chars) que no son tablas reales */
                if (strlen($tabla) <= 2) {
                    continue;
                }
                SchemaRegistry::exigirTabla($tabla);
            }
        }
    }
}
