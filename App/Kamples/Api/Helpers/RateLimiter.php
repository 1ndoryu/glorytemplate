<?php

/**
 * RateLimiter — Limitador de tasa de peticiones.
 *
 * Usa transients de WordPress para almacenar contadores por usuario/IP.
 * Crea una capa de protección contra spam y abuso sin dependencias externas.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Helpers;

use App\Kamples\Services\ServicioCache;

class RateLimiter
{
    /**
     * Verificar si una acción excede el límite de tasa.
     * Con Redis: usa INCR atomico (elimina race conditions entre requests concurrentes).
     * Con WP transients: mantiene comportamiento original como fallback.
     *
     * @param string $clave   Identificador unico (ej: "comentar_12" para userId 12)
     * @param int    $maximo  Numero maximo de acciones permitidas
     * @param int    $ventana Ventana de tiempo en segundos
     * @return bool true si el limite fue excedido (debe bloquear), false si esta permitido
     */
    public static function excedeLimite(string $clave, int $maximo, int $ventana): bool
    {
        $cacheKey = 'krl_' . md5($clave);
        $nuevoValor = ServicioCache::incrementar($cacheKey, $ventana);
        return $nuevoValor > $maximo;
    }

    /**
     * Respuesta estándar cuando se excede el rate limit.
     */
    public static function respuestaExcedido(string $mensaje = 'Demasiadas peticiones. Intenta de nuevo en unos minutos.'): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'code'    => 'rate_limit_excedido',
            'message' => $mensaje,
        ], 429);
    }

    /* Presets con limites razonables para cada tipo de accion */

    /**
     * Rate limit por usuario autenticado.
     * @param int $userId ID del usuario en Postgres
     * @param string $accion Nombre de la accion (ej: 'comentar', 'publicar')
     * @param int $maximo Maximo de acciones
     * @param int $ventana Ventana en segundos
     */
    public static function verificarUsuario(int $userId, string $accion, int $maximo, int $ventana): ?\WP_REST_Response
    {
        if (self::excedeLimite("{$accion}_{$userId}", $maximo, $ventana)) {
            return self::respuestaExcedido();
        }
        return null;
    }

    /**
     * Rate limit por IP (para endpoints publicos como login/registro).
     */
    public static function verificarIp(string $accion, int $maximo, int $ventana): ?\WP_REST_Response
    {
        $ip = self::obtenerIp();
        if (self::excedeLimite("{$accion}_ip_{$ip}", $maximo, $ventana)) {
            return self::respuestaExcedido();
        }
        return null;
    }

    /* [183A-69] Anti-abuso de descargas por IP.
     * Un usuario no puede bajar más de $maximo samples/día independientemente
     * de cuántas cuentas use. Retorna true si está bloqueado. */
    public static function excedeLimiteDescargasIP(int $maximo): bool
    {
        $ip  = self::obtenerIp();
        $hoy = \date('Ymd');
        return self::excedeLimite("descarga_ip_{$ip}_{$hoy}", $maximo, 86400);
    }

    /**
     * Obtener IP real del cliente (soporta proxies).
     * Público para reutilización en anti-abuso (registro IP, descargas por IP, etc.)
     */
    public static function obtenerIp(): string
    {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = explode(',', $_SERVER[$header])[0];
                $ip = trim($ip);
                if (\filter_var($ip, \FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '127.0.0.1';
    }
}
