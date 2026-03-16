<?php

/**
 * ServicioCache — Capa de cache unificada con Redis + fallback WP transients.
 *
 * Drop-in replacement para get_transient/set_transient/delete_transient.
 * Cuando Redis esta disponible: latencia ~0.1ms vs ~3-8ms de WP transients (SQL).
 * Cuando Redis no esta disponible: degrada transparentemente a WP transients.
 *
 * Capacidades adicionales sobre WP transients:
 * - eliminarPatron(): borrado por glob pattern via SCAN (no bloquea como KEYS)
 * - incrementar(): operacion atomica para rate limiting (elimina race conditions)
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

class ServicioCache
{
    /**
     * Obtener valor de cache.
     * @return mixed El valor cacheado, o false si no existe
     */
    public static function obtener(string $clave): mixed
    {
        $redis = ServicioRedis::obtenerInstancia();

        if ($redis->estaDisponible()) {
            try {
                $valor = $redis->obtenerCliente()->get($clave);
                return $valor === false ? false : $valor;
            } catch (\Throwable $e) {
                error_log('[ServicioCache] Error GET ' . $clave . ': ' . $e->getMessage());
            }
        }

        return \get_transient($clave);
    }

    /**
     * Guardar valor en cache.
     * @param int $ttl Tiempo de vida en segundos
     */
    public static function guardar(string $clave, mixed $valor, int $ttl): bool
    {
        $redis = ServicioRedis::obtenerInstancia();

        if ($redis->estaDisponible()) {
            try {
                return $redis->obtenerCliente()->setex($clave, $ttl, $valor);
            } catch (\Throwable $e) {
                error_log('[ServicioCache] Error SETEX ' . $clave . ': ' . $e->getMessage());
            }
        }

        return \set_transient($clave, $valor, $ttl);
    }

    /**
     * Eliminar una clave especifica.
     */
    public static function eliminar(string $clave): bool
    {
        $redis = ServicioRedis::obtenerInstancia();

        if ($redis->estaDisponible()) {
            try {
                return $redis->obtenerCliente()->del($clave) > 0;
            } catch (\Throwable $e) {
                error_log('[ServicioCache] Error DEL ' . $clave . ': ' . $e->getMessage());
            }
        }

        return \delete_transient($clave);
    }

    /**
     * Eliminar todas las claves que coinciden con un patron glob-style.
     * Ejemplo: eliminarPatron('kamples_feed_15_*') borra todo el feed del usuario 15.
     *
     * En Redis usa SCAN (no-blocking). En WP transients hace DELETE SQL con LIKE.
     * @return int Cantidad de claves eliminadas
     */
    public static function eliminarPatron(string $patron): int
    {
        $redis = ServicioRedis::obtenerInstancia();
        $eliminados = 0;

        if ($redis->estaDisponible()) {
            try {
                $cliente = $redis->obtenerCliente();
                $iterator = null;
                while (($claves = $cliente->scan($iterator, $patron, 100)) !== false) {
                    if (!empty($claves)) {
                        $eliminados += $cliente->del($claves);
                    }
                }
                return $eliminados;
            } catch (\Throwable $e) {
                error_log('[ServicioCache] Error eliminarPatron ' . $patron . ': ' . $e->getMessage());
            }
        }

        /* Fallback WP transients: DELETE con LIKE en wp_options */
        global $wpdb;
        $likePattern = str_replace('*', '%', $patron);
        $resultado = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
                '_transient_' . $likePattern,
                '_transient_timeout_' . $likePattern
            )
        );

        return $resultado !== false ? (int) $resultado : 0;
    }

    /**
     * Incrementar un contador atomicamente. Ideal para rate limiting.
     * Si la clave no existe, la crea con valor 1 y le asigna el TTL.
     * Elimina race conditions del patron get+increment+set de WP transients.
     * @return int El nuevo valor del contador
     */
    public static function incrementar(string $clave, int $ttl): int
    {
        $redis = ServicioRedis::obtenerInstancia();

        if ($redis->estaDisponible()) {
            try {
                $cliente = $redis->obtenerCliente();
                /* INCR es atomico — no hay race condition entre lectura y escritura */
                $nuevoValor = $cliente->incr($clave);
                if ($nuevoValor === 1) {
                    $cliente->expire($clave, $ttl);
                }
                return $nuevoValor;
            } catch (\Throwable $e) {
                error_log('[ServicioCache] Error INCR ' . $clave . ': ' . $e->getMessage());
            }
        }

        /* Fallback WP transients (mantiene race condition original — aceptable como degradacion) */
        $actual = \get_transient($clave);
        $nuevoValor = $actual === false ? 1 : (int) $actual + 1;
        \set_transient($clave, $nuevoValor, $ttl);
        return $nuevoValor;
    }

    /**
     * Verificar si Redis esta activo. Util para diagnostico y health checks.
     */
    public static function redisActivo(): bool
    {
        return ServicioRedis::obtenerInstancia()->estaDisponible();
    }
}
