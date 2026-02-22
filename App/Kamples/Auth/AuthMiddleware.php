<?php
/**
 * AuthMiddleware — Kamples
 *
 * Verifica autenticación en endpoints protegidos de la API Kamples.
 * Soporta dos métodos:
 * 1. Nonce de WordPress (web, same-origin)
 * 2. JWT Bearer token (desktop Tauri, cross-origin)
 */

namespace App\Kamples\Auth;

use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\ServicioBan;

class AuthMiddleware
{
    /**
     * Permission callback para endpoints que requieren autenticación.
     * Acepta tanto nonce WP como JWT Bearer token.
     */
    public static function requerirAuth(): bool
    {
        /* Primero intentar con sesión WP clásica (nonce) */
        $userId = get_current_user_id();

        /* Si no hay sesión WP, intentar JWT en header Authorization */
        if (!$userId) {
            $userId = self::autenticarConJwt();
        }

        return $userId > 0;
    }

    /**
     * Permission callback para endpoints que requieren ser creador.
     * Verifica que el usuario tenga rol 'creador' o 'admin' en usuarios_ext.
     */
    public static function requerirCreador(): bool
    {
        if (!self::requerirAuth()) {
            return false;
        }

        $usuario = UsuarioHelper::obtenerPorWpId(get_current_user_id());
        if (!$usuario) return false;

        $rol = $usuario[UsuariosExtCols::ROL] ?? 'usuario';
        return in_array($rol, ['creador', 'admin'], true);
    }

    /**
     * Permission callback para endpoints que requieren plan pro o premium.
     * Verifica el campo plan en usuarios_ext.
     */
    public static function requerirPlanPro(): bool
    {
        if (!self::requerirAuth()) {
            return false;
        }

        $usuario = UsuarioHelper::obtenerPorWpId(get_current_user_id());
        if (!$usuario) return false;

        $plan = $usuario[UsuariosExtCols::PLAN] ?? 'free';
        return in_array($plan, ['pro', 'premium'], true);
    }

    /**
     * Permission callback para endpoints de admin.
     */
    public static function requerirAdmin(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Obtiene el ID de WordPress del usuario autenticado actual.
     */
    public static function obtenerWpUserId(): int
    {
        return get_current_user_id();
    }

    /**
     * Obtiene datos básicos del usuario WP autenticado.
     * Retorna null si no hay sesión.
     */
    public static function obtenerUsuarioActual(): ?array
    {
        $userId = get_current_user_id();
        if (!$userId) {
            return null;
        }

        $wpUser = get_userdata($userId);
        if (!$wpUser) {
            return null;
        }

        return [
            'wp_user_id' => $userId,
            'email' => $wpUser->user_email,
            'display_name' => $wpUser->display_name,
            'username' => $wpUser->user_login,
            'avatar_url' => get_avatar_url($userId, ['size' => 256]),
        ];
    }

    /**
     * C132: Verifica si el usuario PG está baneado y retorna WP_REST_Response 403 si lo está.
     * Retorna null si no hay ban activo. Los controllers llaman esto al inicio de acciones de escritura.
     */
    public static function verificarBanActivo(int $pgUserId): ?\WP_REST_Response
    {
        $infoBan = ServicioBan::verificarBan($pgUserId);
        if (!$infoBan) {
            return null;
        }

        return new \WP_REST_Response([
            'code' => 'usuario_baneado',
            'message' => 'Tu cuenta está temporalmente restringida',
            'baneadoHasta' => $infoBan['baneadoHasta'],
            'razon' => $infoBan['razon'],
        ], 403);
    }

    /**
     * Intenta autenticar usando JWT Bearer token del header Authorization.
     * Si es válido, establece el usuario WP para que get_current_user_id() funcione.
     * Retorna el WP user ID o 0 si falla.
     */
    private static function autenticarConJwt(): int
    {
        $header = self::obtenerBearerToken();
        if (!$header) {
            return 0;
        }

        $wpUserId = JwtService::validar($header);
        if (!$wpUserId) {
            return 0;
        }

        /* Verificar que el usuario WP existe */
        $wpUser = get_userdata($wpUserId);
        if (!$wpUser) {
            return 0;
        }

        /* Establecer contexto WP para que el resto del request funcione igual */
        wp_set_current_user($wpUserId);

        return $wpUserId;
    }

    /**
     * Extrae el token del header Authorization: Bearer {token}.
     */
    private static function obtenerBearerToken(): ?string
    {
        /* WordPress REST API: leer del header directamente */
        $authHeader = '';

        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = sanitize_text_field($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            /* Apache con mod_rewrite a veces mueve el header aquí */
            $authHeader = sanitize_text_field($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (empty($authHeader)) {
            return null;
        }

        /* Formato esperado: "Bearer {token}" */
        if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }
}
