<?php

/**
 * Dashboard Scripts Setup
 *
 * Configura los scripts del dashboard de productividad,
 * incluyendo el nonce para autenticación de la API REST.
 *
 * @package App\Config
 */

namespace App\Config;

class DashboardScripts
{
    /**
     * Registra los hooks necesarios
     */
    public static function register(): void
    {
        add_action('wp_enqueue_scripts', [self::class, 'enqueueScripts']);
    }

    /**
     * Encola scripts y estilos del dashboard
     */
    public static function enqueueScripts(): void
    {
        /* Inyectar datos de usuario en todas las páginas del frontend */
        self::localizeScripts();
    }

    /**
     * Verifica si estamos en la página del dashboard
     */
    private static function isDashboardPage(): bool
    {
        global $post;

        if (!$post) {
            return false;
        }

        /* Verificar por slug o template */
        $dashboardSlugs = ['dashboard', 'productivity', 'productividad'];

        if (in_array($post->post_name, $dashboardSlugs, true)) {
            return true;
        }

        /* Verificar por template */
        $template = get_page_template_slug($post->ID);

        return $template === 'TemplateReact.php' || str_contains($template, 'dashboard');
    }

    /**
     * Pasa datos al JavaScript del frontend
     */
    private static function localizeScripts(): void
    {
        $currentUser = null;
        $suscripcion = null;

        if (is_user_logged_in()) {
            $user = wp_get_current_user();
            $userId = $user->ID;
            $avatarUrl = get_user_meta($userId, 'glory_avatar_url', true);

            $currentUser = [
                'name' => $user->display_name,
                'email' => $user->user_email,
                'login' => $user->user_login,
                'description' => get_the_author_meta('description', $userId),
                'avatarUrl' => $avatarUrl ?: ''
            ];

            /* Obtener info de suscripción */
            $suscripcionService = new \App\Services\SuscripcionService(get_current_user_id());
            $suscripcion = $suscripcionService->getInfoCompleta();
        }

        $data = [
            'nonce' => wp_create_nonce('wp_rest'),
            'apiBase' => rest_url('glory/v1/dashboard'),
            'apiUrl' => rest_url('glory/v1'),
            'userId' => get_current_user_id(),
            'isLoggedIn' => is_user_logged_in(),
            'esAdmin' => current_user_can('manage_options'),
            'currentUser' => $currentUser,
            'suscripcion' => $suscripcion,
            'locale' => get_locale(),
        ];

        /* Añadir script inline antes del bundle de React */
        add_action('wp_head', function () use ($data) {
            $json = wp_json_encode($data, JSON_UNESCAPED_SLASHES);
            echo "<script>window.gloryDashboard = {$json};</script>\n";
        }, 5);
    }
}

/* Registrar automáticamente */
DashboardScripts::register();
