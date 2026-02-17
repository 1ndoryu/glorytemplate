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

class RateLimiter
{
    /**
     * Verificar si una acción excede el límite de tasa.
     *
     * @param string $clave   Identificador unico (ej: "comentar_12" para userId 12)
     * @param int    $maximo  Numero maximo de acciones permitidas
     * @param int    $ventana Ventana de tiempo en segundos
     * @return bool true si el limite fue excedido (debe bloquear), false si esta permitido
     */
    public static function excedeLimite(string $clave, int $maximo, int $ventana): bool
    {
        $transientKey = 'krl_' . md5($clave);
        $actual = get_transient($transientKey);

        if ($actual === false) {
            /* Primera peticion en esta ventana */
            set_transient($transientKey, 1, $ventana);
            return false;
        }

        if ((int) $actual >= $maximo) {
            return true;
        }

        /* Incrementar contador manteniendo el TTL original */
        set_transient($transientKey, (int) $actual + 1, $ventana);
        return false;
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

    /**
     * Obtener IP real del cliente (soporta proxies).
     */
    private static function obtenerIp(): string
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
