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
