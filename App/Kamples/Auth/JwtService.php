<?php

/**
 * JwtService — Generación y validación de tokens JWT.
 *
 * Usa firebase/php-jwt para crear tokens firmados con HS256.
 * El secret se obtiene de la constante AUTH_KEY de WordPress.
 * Duración por defecto: 30 días (para la app desktop).
 *
 * @package Kamples
 */

namespace App\Kamples\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use App\Kamples\KamplesLogger;

class JwtService
{
    private const ALGORITMO = 'HS256';

    /* Duración del token en segundos: 30 días */
    private const DURACION_SEGUNDOS = 30 * 24 * 60 * 60;

    /**
     * Genera un JWT para un usuario de WordPress.
     *
     * Claims incluidos:
     * - sub: WordPress user ID
     * - iss: dominio del sitio
     * - iat: timestamp de creación
     * - exp: timestamp de expiración
     * - user_login: nombre de usuario WP (para debugging)
     */
    public static function generar(int $wpUserId, string $userLogin = ''): string
    {
        $ahora = time();

        $payload = [
            'sub'        => $wpUserId,
            'iss'        => get_site_url(),
            'iat'        => $ahora,
            'exp'        => $ahora + self::DURACION_SEGUNDOS,
            'user_login' => $userLogin,
        ];

        return JWT::encode($payload, self::obtenerSecret(), self::ALGORITMO);
    }

    /**
     * Valida un JWT y retorna el WordPress user ID.
     * Retorna null si el token es inválido o expirado.
     */
    public static function validar(string $token): ?int
    {
        try {
            $decoded = JWT::decode($token, new Key(self::obtenerSecret(), self::ALGORITMO));

            if (empty($decoded->sub)) {
                return null;
            }

            return (int) $decoded->sub;
        } catch (ExpiredException $e) {
            KamplesLogger::warning('JWT expirado', [
                'error' => $e->getMessage(),
            ]);
            return null;
        } catch (\Throwable $e) {
            KamplesLogger::warning('JWT inválido', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Obtiene el secret para firmar tokens.
     * Usa AUTH_KEY de wp-config.php (garantizado único por instalación WP).
     */
    private static function obtenerSecret(): string
    {
        if (defined('AUTH_KEY') && AUTH_KEY !== '') {
            return AUTH_KEY;
        }

        /* Fallback: generar y guardar un secret en opciones */
        $saved = get_option('kamples_jwt_secret', '');
        if ($saved) {
            return $saved;
        }

        $nuevo = wp_generate_password(64, true, true);
        update_option('kamples_jwt_secret', $nuevo, false);

        return $nuevo;
    }
}
