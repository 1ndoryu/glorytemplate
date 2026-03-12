<?php

/**
 * GuardiaWpAdmin — Kamples
 *
 * Bloquea el acceso a wp-admin y wp-login.php para usuarios no administradores.
 * Los administradores conservan acceso completo al backoffice de WordPress.
 *
 * Excepciones: admin-ajax.php, admin-post.php y REST API siguen accesibles
 * para usuarios autenticados (las manejan sus propios middlewares).
 *
 * QQ14: se integra con el endpoint POST /auth/logout para que los usuarios
 * normales nunca necesiten pasar por wp-login.php.
 *
 * @package Kamples\Auth
 */

namespace App\Kamples\Auth;

class GuardiaWpAdmin
{
    /*
     * Registra los hooks de bloqueo.
     * Llamar desde KamplesInit::init().
     */
    public static function registrar(): void
    {
        /* Bloquear wp-admin para no-admins (excepto AJAX y admin-post) */
        add_action('admin_init', [self::class, 'bloquearWpAdmin']);

        /* Bloquear wp-login.php para no-admins (excepto logout nativo como fallback) */
        add_action('login_init', [self::class, 'bloquearWpLogin']);
    }

    /*
     * Redirige a / si un usuario no-admin intenta acceder a wp-admin.
     * Excluye admin-ajax.php y admin-post.php que usan plugins y el frontend.
     */
    public static function bloquearWpAdmin(): void
    {
        /* Permitir requests AJAX y admin-post (usados por plugins y frontend) */
        if (
            defined('DOING_AJAX') && DOING_AJAX
            || self::esAdminPost()
        ) {
            return;
        }

        /* Admins pasan sin restricción */
        if (current_user_can('manage_options')) {
            return;
        }

        wp_safe_redirect(home_url('/'));
        exit;
    }

    /*
     * Redirige a / si un usuario no-admin intenta acceder a wp-login.php.
     * Excluye las acciones de logout y postpass (contraseña de post protegido)
     * como fallback para compatibilidad.
     */
    public static function bloquearWpLogin(): void
    {
        $accion = sanitize_text_field(wp_unslash($_GET['action'] ?? ''));

        /* Permitir logout nativo como fallback de seguridad */
        $accionesPermitidas = ['logout', 'postpass'];
        if (in_array($accion, $accionesPermitidas, true)) {
            return;
        }

        /* Admins pasan sin restricción */
        if (current_user_can('manage_options')) {
            return;
        }

        wp_safe_redirect(home_url('/'));
        exit;
    }

    /*
     * Detecta si el request actual es a admin-post.php.
     */
    private static function esAdminPost(): bool
    {
        $script = $_SERVER['SCRIPT_FILENAME'] ?? '';
        return basename($script) === 'admin-post.php';
    }
}
