<?php

/**
 * BaseRepository — Clase base abstracta para repositorios del Schema System.
 *
 * Proporciona CRUD genérico sobre $wpdb con soporte para:
 * - Parámetros nombrados (:param) convertidos a $wpdb->prepare()
 * - Prefijo de tabla automático via tablaCompleta()
 * - Helper de transacciones conTransaccion(callable)
 * - Try-catch y error logging en todas las operaciones
 *
 * Los hijos generados por schema:generate solo definen tabla(), colId()
 * y métodos específicos del dominio.
 *
 * @package Glory\App\Database\Repositories
 */

namespace Glory\App\Database\Repositories;

abstract class BaseRepository
{
    /* Nombre de tabla sin prefijo WP (constante Cols::TABLA) */
    abstract protected static function tabla(): string;

    /* Nombre de la columna PK (constante Cols::ID) */
    abstract protected static function colId(): string;

    /**
     * Nombre completo de la tabla incluyendo prefijo de WordPress.
     * Usar SIEMPRE en SQL queries en lugar de Cols::TABLA directo.
     */
    protected static function tablaCompleta(): string
    {
        global $wpdb;
        return $wpdb->prefix . static::tabla();
    }

    /**
     * Ejecuta un SELECT con parámetros nombrados (:param).
     *
     * Convierte parámetros nombrados al formato %s/%d/%f de $wpdb->prepare()
     * según el tipo PHP del valor. Retorna array asociativo.
     *
     * @param string $sql Query con placeholders nombrados (:param)
     * @param array $params Mapa nombre => valor
     * @return array Filas como arrays asociativos
     */
    protected static function consultar(string $sql, array $params = []): array
    {
        global $wpdb;

        try {
            if (empty($params)) {
                $resultados = $wpdb->get_results($sql, ARRAY_A);
                return is_array($resultados) ? $resultados : [];
            }

            $valores = [];
            $sqlPreparado = preg_replace_callback('/:(\w+)/', function ($match) use ($params, &$valores) {
                $clave = $match[1];
                if (!array_key_exists($clave, $params)) {
                    return $match[0];
                }
                $valor = $params[$clave];
                $valores[] = $valor;
                if (is_int($valor)) {
                    return '%d';
                }
                if (is_float($valor)) {
                    return '%f';
                }
                return '%s';
            }, $sql);

            $queryFinal = $wpdb->prepare($sqlPreparado, ...$valores);
            $resultados = $wpdb->get_results($queryFinal, ARRAY_A);
            return is_array($resultados) ? $resultados : [];
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[BaseRepository::consultar] Error en %s: %s | SQL: %s',
                static::tabla(),
                $e->getMessage(),
                $sql
            ));
            return [];
        }
    }

    /**
     * Busca un registro por su ID (PK).
     *
     * @param int $id
     * @return array|null Fila como array asociativo o null si no existe
     */
    public static function buscarPorId(int $id): ?array
    {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colId = static::colId();

        try {
            $resultado = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM {$tabla} WHERE {$colId} = %d", $id),
                ARRAY_A
            );
            return is_array($resultado) ? $resultado : null;
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[BaseRepository::buscarPorId] Error en %s id=%d: %s',
                static::tabla(),
                $id,
                $e->getMessage()
            ));
            return null;
        }
    }

    /**
     * Obtiene todos los registros con paginación.
     *
     * @param int $limit Máximo de resultados
     * @param int $offset Desplazamiento
     * @return array Filas como arrays asociativos
     */
    public static function buscarTodos(int $limit = 100, int $offset = 0): array
    {
        $tabla = static::tablaCompleta();
        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY id DESC LIMIT :limit OFFSET :offset",
            ['limit' => $limit, 'offset' => $offset]
        );
    }

    /**
     * Inserta un registro nuevo.
     *
     * @param array $datos Mapa columna => valor
     * @return int|false ID insertado o false si falla
     */
    public static function insertar(array $datos): int|false
    {
        global $wpdb;
        $tabla = static::tablaCompleta();

        try {
            $resultado = $wpdb->insert($tabla, $datos);
            if ($resultado === false) {
                error_log(sprintf(
                    '[BaseRepository::insertar] Fallo en %s: %s',
                    static::tabla(),
                    $wpdb->last_error
                ));
                return false;
            }
            return (int) $wpdb->insert_id;
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[BaseRepository::insertar] Error en %s: %s',
                static::tabla(),
                $e->getMessage()
            ));
            return false;
        }
    }

    /**
     * Actualiza un registro por su ID.
     *
     * @param int $id
     * @param array $datos Mapa columna => valor
     * @return bool true si la operación fue exitosa
     */
    public static function actualizar(int $id, array $datos): bool
    {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colId = static::colId();

        try {
            $resultado = $wpdb->update($tabla, $datos, [$colId => $id]);
            if ($resultado === false) {
                error_log(sprintf(
                    '[BaseRepository::actualizar] Fallo en %s id=%d: %s',
                    static::tabla(),
                    $id,
                    $wpdb->last_error
                ));
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[BaseRepository::actualizar] Error en %s id=%d: %s',
                static::tabla(),
                $id,
                $e->getMessage()
            ));
            return false;
        }
    }

    /**
     * Elimina un registro por su ID.
     *
     * @param int $id
     * @return bool true si se eliminó al menos una fila
     */
    public static function eliminar(int $id): bool
    {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $colId = static::colId();

        try {
            $resultado = $wpdb->delete($tabla, [$colId => $id]);
            if ($resultado === false) {
                error_log(sprintf(
                    '[BaseRepository::eliminar] Fallo en %s id=%d: %s',
                    static::tabla(),
                    $id,
                    $wpdb->last_error
                ));
                return false;
            }
            return $resultado > 0;
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[BaseRepository::eliminar] Error en %s id=%d: %s',
                static::tabla(),
                $id,
                $e->getMessage()
            ));
            return false;
        }
    }

    /**
     * Cuenta registros, opcionalmente con filtro WHERE.
     *
     * @param string $where Cláusula WHERE sin la palabra WHERE (ej: "estado = :estado")
     * @param array $params Parámetros nombrados
     * @return int
     */
    public static function contar(string $where = '', array $params = []): int
    {
        global $wpdb;
        $tabla = static::tablaCompleta();
        $sql = "SELECT COUNT(*) FROM {$tabla}";

        if ($where !== '') {
            $sql .= " WHERE {$where}";
        }

        try {
            if (empty($params)) {
                return (int) ($wpdb->get_var($sql) ?? 0);
            }

            $valores = [];
            $sqlPreparado = preg_replace_callback('/:(\w+)/', function ($match) use ($params, &$valores) {
                $clave = $match[1];
                if (!array_key_exists($clave, $params)) {
                    return $match[0];
                }
                $valor = $params[$clave];
                $valores[] = $valor;
                return is_int($valor) ? '%d' : '%s';
            }, $sql);

            $queryFinal = $wpdb->prepare($sqlPreparado, ...$valores);
            return (int) ($wpdb->get_var($queryFinal) ?? 0);
        } catch (\Throwable $e) {
            error_log(sprintf(
                '[BaseRepository::contar] Error en %s: %s',
                static::tabla(),
                $e->getMessage()
            ));
            return 0;
        }
    }

    /**
     * Ejecuta una operación dentro de una transacción MySQL.
     *
     * Si el callable retorna con éxito, se hace COMMIT.
     * Si lanza excepción, se hace ROLLBACK y se re-lanza.
     *
     * @param callable $fn Función a ejecutar dentro de la transacción
     * @return mixed El valor retornado por $fn
     * @throws \Throwable Re-lanza la excepción después del ROLLBACK
     */
    public static function conTransaccion(callable $fn): mixed
    {
        global $wpdb;
        $wpdb->query('START TRANSACTION');

        try {
            $resultado = $fn();
            $wpdb->query('COMMIT');
            return $resultado;
        } catch (\Throwable $e) {
            $wpdb->query('ROLLBACK');
            error_log(sprintf(
                '[BaseRepository::conTransaccion] ROLLBACK en %s: %s',
                static::tabla(),
                $e->getMessage()
            ));
            throw $e;
        }
    }
}
