<?php

/**
 * AlgoTimingLogger — Registra timings detallados del algoritmo de feed para debugging.
 *
 * Solo activo para userId = 1 (referencia de QA permanente).
 * Zero overhead para cualquier otro usuario — todos los métodos son no-ops inmediatos.
 * Almacena historial de hasta 100 mediciones en WP options (no autoloaded).
 *
 * Uso:
 *   AlgoTimingLogger::iniciar($userId);
 *   ... código A ...
 *   AlgoTimingLogger::marcar($userId, 'pasoA');
 *   ... código B ...
 *   AlgoTimingLogger::marcar($userId, 'pasoB');
 *   AlgoTimingLogger::guardar($userId, ['totalSamples' => 2459, ...]);
 *
 * Duración de cada paso = tiempo transcurrido desde la marca anterior (o desde iniciar).
 *
 * [2003A-3] Agregado para profiling del algoritmo de feed. Permite llevar
 * un historial versionado de rendimiento accesible desde el modal de métricas en el frontend.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\PostgresService;
use App\Kamples\LogAlgoritmo as KamplesLogger;

class AlgoTimingLogger
{
    private const OPTION_KEY  = 'kamples_algo_timing_history';
    private const MAX_ENTRIES = 100;

    /* Solo medir para este user ID como referencia permanente de QA */
    public const USER_ID_REF = 1;

    /* Estado estático (por proceso PHP = por request) */
    private static ?float $inicioGlobal = null;
    private static ?float $ultimaMarca  = null;
    private static array  $marcas       = [];
    private static ?array $explainData  = null;

    /**
     * Inicia un ciclo de medición. No hace nada si userId !== USER_ID_REF.
     */
    public static function iniciar(int $userId): void
    {
        if ($userId !== self::USER_ID_REF) {
            return;
        }
        $now = microtime(true);
        self::$inicioGlobal = $now;
        self::$ultimaMarca  = $now;
        self::$marcas       = [];
    }

    /**
     * Registra una marca de tiempo con etiqueta.
     * Su duración = tiempo transcurrido desde la última marca (o desde iniciar).
     */
    public static function marcar(int $userId, string $etapa): void
    {
        if ($userId !== self::USER_ID_REF || self::$inicioGlobal === null) {
            return;
        }
        $now = microtime(true);
        self::$marcas[$etapa] = round(($now - (self::$ultimaMarca ?? $now)) * 1000, 2);
        self::$ultimaMarca = $now;
    }

    /**
     * Finaliza la medición, construye el registro y persiste en WP options.
     *
     * @param array $meta Datos contextuales: totalSamples, usoCandidatos, usoMV, configHash, etc.
     */
    public static function guardar(int $userId, array $meta = []): void
    {
        if ($userId !== self::USER_ID_REF || self::$inicioGlobal === null) {
            return;
        }

        $totalMs = round((microtime(true) - self::$inicioGlobal) * 1000, 2);

        $registro = [
            'ts'      => date('c'),
            'totalMs' => $totalMs,
            'etapas'  => self::$marcas,
            'meta'    => $meta,
        ];

        /* [2003A-3-B] Incluir desglose EXPLAIN ANALYZE si fue capturado */
        if (self::$explainData !== null) {
            $registro['explain'] = self::$explainData;
        }

        $historial = get_option(self::OPTION_KEY, []);
        if (!\is_array($historial)) {
            $historial = [];
        }
        array_unshift($historial, $registro);
        $historial = array_slice($historial, 0, self::MAX_ENTRIES);
        update_option(self::OPTION_KEY, $historial, false);

        /* Reset para la próxima medición del mismo request (si hay warm-up, etc.) */
        self::$inicioGlobal = null;
        self::$ultimaMarca  = null;
        self::$marcas       = [];
        self::$explainData  = null;
    }

    /**
     * [2003A-3-B] Captura EXPLAIN ANALYZE de la query del feed para desglose detallado.
     * Solo ejecutar para userId=1. Ejecuta la query de nuevo con EXPLAIN — acepta ~1s extra
     * de overhead porque es herramienta de profiling admin-only.
     *
     * @param string $sql   La query CTE completa del feed
     * @param array  $params Parámetros bind de la query
     */
    public static function capturarExplain(int $userId, string $sql, array $params): void
    {
        if ($userId !== self::USER_ID_REF || self::$inicioGlobal === null) {
            return;
        }

        try {
            $explainSql = "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " . $sql;
            $resultado = PostgresService::consultar($explainSql, $params);
            if (empty($resultado)) return;

            /* PostgreSQL retorna 1 fila, 1 columna con el JSON del plan */
            $jsonText = $resultado[0][array_key_first($resultado[0])] ?? null;
            if (!$jsonText) return;

            $plan = \is_string($jsonText) ? \json_decode($jsonText, true) : $jsonText;
            if (!\is_array($plan) || empty($plan[0])) return;

            $raiz = $plan[0];
            $nodos = [];
            self::visitarNodoExplain($raiz['Plan'] ?? [], $nodos, 0);

            /* Ordenar por tiempo total descendente para mostrar lo más lento primero */
            \usort($nodos, fn($a, $b) => $b['totalMs'] <=> $a['totalMs']);

            self::$explainData = [
                'planificacionMs' => round($raiz['Planning Time'] ?? 0, 2),
                'ejecucionMs'     => round($raiz['Execution Time'] ?? 0, 2),
                'nodos'           => \array_slice($nodos, 0, 25),
            ];
        } catch (\Throwable $e) {
            KamplesLogger::error('AlgoTimingLogger: Error capturando EXPLAIN', [
                'error' => $e->getMessage(),
            ]);
            self::$explainData = null;
        }
    }

    /**
     * Recorre recursivamente el árbol de nodos del EXPLAIN y extrae los significativos.
     * Cada CTE aparece como InitPlan con Subplan Name = "CTE nombre".
     */
    private static function visitarNodoExplain(array $plan, array &$nodos, int $profundidad): void
    {
        $tipo = $plan['Node Type'] ?? 'Unknown';
        $loops = max(1, (int) ($plan['Actual Loops'] ?? 1));
        $tiempoTotal = round(($plan['Actual Total Time'] ?? 0) * $loops, 2);
        $filas = (int) ($plan['Actual Rows'] ?? 0) * $loops;
        $nombre = $plan['Subplan Name'] ?? '';
        $relacion = $plan['Parent Relationship'] ?? '';

        /* Tiempo exclusivo = total de este nodo - suma de hijos */
        $tiempoHijos = 0.0;
        foreach (($plan['Plans'] ?? []) as $hijo) {
            $hijoLoops = max(1, (int) ($hijo['Actual Loops'] ?? 1));
            $tiempoHijos += ($hijo['Actual Total Time'] ?? 0) * $hijoLoops;
        }
        $tiempoExclusivo = round(max(0, $tiempoTotal - $tiempoHijos), 2);

        $esCte = $relacion === 'InitPlan' && str_starts_with($nombre, 'CTE ');
        $tabla = $plan['Relation Name'] ?? '';
        $indice = $plan['Index Name'] ?? '';

        /* Etiqueta user-friendly */
        if ($esCte) {
            $etiqueta = $nombre;
        } else {
            $etiqueta = $tipo;
            if ($tabla) $etiqueta .= " ({$tabla})";
            if ($indice) $etiqueta .= " [{$indice}]";
        }

        /* Solo registrar nodos significativos: CTEs, >0.5ms o profundidad <=2 */
        if ($esCte || $tiempoTotal > 0.5 || $profundidad <= 2) {
            $nodos[] = [
                'etiqueta'     => $etiqueta,
                'tipo'         => $tipo,
                'totalMs'      => $tiempoTotal,
                'exclusivoMs'  => $tiempoExclusivo,
                'filas'        => $filas,
                'profundidad'  => $profundidad,
                'esCte'        => $esCte,
                'buffers'      => ($plan['Shared Hit Blocks'] ?? 0) + ($plan['Shared Read Blocks'] ?? 0),
            ];
        }

        foreach (($plan['Plans'] ?? []) as $hijo) {
            self::visitarNodoExplain($hijo, $nodos, $profundidad + 1);
        }
    }

    /**
     * Retorna el historial completo (más reciente primero).
     */
    public static function obtenerHistorial(): array
    {
        return get_option(self::OPTION_KEY, []) ?: [];
    }

    /**
     * Elimina todo el historial almacenado.
     */
    public static function limpiarHistorial(): void
    {
        delete_option(self::OPTION_KEY);
    }
}
