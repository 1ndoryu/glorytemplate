<?php
/**
 * AuthMiddleware — Kamples
 *
 * Verifica autenticación en endpoints protegidos de la API Kamples.
 * Funciona con el nonce de WordPress y el sistema de usuarios WP.
 */

namespace App\Kamples\Auth;

class AuthMiddleware
{
    /**
     * Permission callback para endpoints que requieren autenticación.
     * Se usa en register_rest_route como 'permission_callback'.
     */
    public static function requerirAuth(): bool
    {
        $userId = get_current_user_id();

        if (!$userId) {
            return false;
        }

        return true;
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

        $usuario = \App\Kamples\Api\Helpers\UsuarioHelper::obtenerPorWpId(get_current_user_id());
        if (!$usuario) return false;

        $rol = $usuario['rol'] ?? 'usuario';
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

        $usuario = \App\Kamples\Api\Helpers\UsuarioHelper::obtenerPorWpId(get_current_user_id());
        if (!$usuario) return false;

        $plan = $usuario['plan'] ?? 'free';
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
}
