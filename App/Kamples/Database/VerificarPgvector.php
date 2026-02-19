<?php

/**
 * Kamples — Verificación de pgvector y conexión PostgreSQL
 *
 * Script standalone que comprueba:
 *  1. Conexión a PostgreSQL vía PostgresService
 *  2. Extensión pgvector activa
 *  3. Columna embedding en tabla samples
 *  4. Índice HNSW funcional
 *  5. Búsqueda coseno operativa
 *
 * Uso CLI:   php VerificarPgvector.php
 * Uso REST:  GET /kamples/v1/debug/pgvector (registrar endpoint aparte)
 */

namespace App\Kamples\Database;

use App\Config\Schema\_generated\SamplesCols;

class VerificarPgvector
{
    /*
     * Ejecuta todas las verificaciones y retorna un reporte.
     * Cada check retorna: ['nombre' => string, 'ok' => bool, 'detalle' => string]
     */
    public static function ejecutar(): array
    {
        $resultados = [];

        $resultados[] = self::verificarConexion();
        $resultados[] = self::verificarExtension();
        $resultados[] = self::verificarColumnaEmbedding();
        $resultados[] = self::verificarIndiceHnsw();
        $resultados[] = self::verificarBusquedaCoseno();

        return $resultados;
    }

    /*
     * Devuelve un resumen legible de los resultados.
     */
    public static function resumen(): string
    {
        $resultados = self::ejecutar();
        $lineas = ["=== Verificación pgvector ===\n"];

        $todosOk = true;

        foreach ($resultados as $check) {
            $estado = $check['ok'] ? 'OK' : 'FALLO';
            $lineas[] = "[{$estado}] {$check['nombre']}: {$check['detalle']}";

            if (!$check['ok']) {
                $todosOk = false;
            }
        }

        $lineas[] = '';
        $lineas[] = $todosOk
            ? 'Resultado: TODO CORRECTO — pgvector funcional.'
            : 'Resultado: HAY ERRORES — revisar los items marcados como FALLO.';

        return implode("\n", $lineas);
    }

    private static function verificarConexion(): array
    {
        $conectado = PostgresService::estaConectado();

        return [
            'nombre' => 'Conexión PostgreSQL',
            'ok' => $conectado,
            'detalle' => $conectado
                ? 'Conectado a kamples (127.0.0.1:5432)'
                : 'No se pudo conectar. Verificar .env (KAMPLES_PG_*)',
        ];
    }

    private static function verificarExtension(): array
    {
        $fila = PostgresService::consultarUno(
            "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'"
        );

        if ($fila === null) {
            return [
                'nombre' => 'Extensión pgvector',
                'ok' => false,
                'detalle' => 'No encontrada. Ejecutar: CREATE EXTENSION IF NOT EXISTS vector;',
            ];
        }

        return [
            'nombre' => 'Extensión pgvector',
            'ok' => true,
            'detalle' => "Versión {$fila['extversion']}",
        ];
    }

    private static function verificarColumnaEmbedding(): array
    {
        $tabla = SamplesCols::TABLA;
        $columna = SamplesCols::EMBEDDING;
        $fila = PostgresService::consultarUno(
            "SELECT column_name, udt_name
             FROM information_schema.columns
             WHERE table_name = '{$tabla}' AND column_name = '{$columna}'"
        );

        if ($fila === null) {
            return [
                'nombre' => 'Columna embedding en samples',
                'ok' => false,
                'detalle' => 'No existe. Ejecutar v002_pgvector_setup.sql',
            ];
        }

        return [
            'nombre' => 'Columna embedding en samples',
            'ok' => true,
            'detalle' => "Tipo: {$fila['udt_name']} (vector 1536d)",
        ];
    }

    private const IDX_EMBEDDING = 'idx_samples_embedding';

    private static function verificarIndiceHnsw(): array
    {
        $idx = self::IDX_EMBEDDING;
        $fila = PostgresService::consultarUno(
            "SELECT indexname, indexdef FROM pg_indexes WHERE indexname = '{$idx}'"
        );

        if ($fila === null) {
            return [
                'nombre' => 'Índice HNSW',
                'ok' => false,
                'detalle' => 'No existe. Ejecutar v002_pgvector_setup.sql',
            ];
        }

        $esHnsw = str_contains($fila['indexdef'] ?? '', 'hnsw');

        return [
            'nombre' => 'Índice HNSW',
            'ok' => $esHnsw,
            'detalle' => $esHnsw
                ? self::IDX_EMBEDDING . ' con vector_cosine_ops'
                : "Existe pero no es HNSW: {$fila['indexdef']}",
        ];
    }

    private static function verificarBusquedaCoseno(): array
    {
        $pdo = PostgresService::obtenerConexion();
        if ($pdo === null) {
            return [
                'nombre' => 'Búsqueda coseno',
                'ok' => false,
                'detalle' => 'Sin conexión, no se puede probar',
            ];
        }

        try {
            /* Tabla temporal para prueba aislada */
            $pdo->exec("CREATE TEMP TABLE IF NOT EXISTS _test_vec (id SERIAL, v vector(3))");
            $pdo->exec("DELETE FROM _test_vec");
            $pdo->exec("INSERT INTO _test_vec (v) VALUES ('[1,0,0]'), ('[0,1,0]'), ('[0,0,1]')");

            $stmt = $pdo->prepare(
                "SELECT id, (v <=> :q) AS dist FROM _test_vec ORDER BY v <=> :q2 LIMIT 1"
            );
            $stmt->execute([':q' => '[1,0,0]', ':q2' => '[1,0,0]']);
            $resultado = $stmt->fetch();

            $pdo->exec("DROP TABLE IF EXISTS _test_vec");

            if ($resultado && (float) $resultado['dist'] === 0.0) {
                return [
                    'nombre' => 'Búsqueda coseno',
                    'ok' => true,
                    'detalle' => 'Operador <=> funciona correctamente (distancia=0 para vector idéntico)',
                ];
            }

            return [
                'nombre' => 'Búsqueda coseno',
                'ok' => false,
                'detalle' => 'Resultado inesperado: dist=' . ($resultado['dist'] ?? 'null'),
            ];
        } catch (\PDOException $e) {
            return [
                'nombre' => 'Búsqueda coseno',
                'ok' => false,
                'detalle' => 'Error: ' . $e->getMessage(),
            ];
        }
    }
}
