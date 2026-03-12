<?php 

use Glory\Manager\AssetManager;

use Glory\Admin\SyncManager;
use Glory\Core\GloryFeatures;

AssetManager::setThemeVersion('0.1.1');
add_filter('show_admin_bar', '__return_false');

/*
 * Inyectar datos de usuario en GLORY_CONTEXT para que React
 * detecte la sesión de WordPress sin necesidad de una llamada AJAX.
 * devMode expuesto para herramientas de admin restringidas en frontend.
 */
add_filter('glory_react_context', function (array $context): array {
    $userId = get_current_user_id();
    $context['isLoggedIn'] = $userId > 0;
    $context['userId'] = $userId ?: null;

    /* Exponer devMode para controlar herramientas de admin en React */
    $modoGlobalDev = method_exists(AssetManager::class, 'isGlobalDevMode') && AssetManager::isGlobalDevMode();
    $context['devMode'] = $modoGlobalDev || (defined('WP_DEBUG') && WP_DEBUG);

    if ($userId > 0) {
        $user = get_userdata($userId);
        if ($user) {
            $context['currentUser'] = [
                'id'             => $userId,
                'username'       => $user->user_login,
                'email'          => $user->user_email,
                'nombreVisible'  => $user->display_name,
                'avatarUrl'      => get_avatar_url($userId, ['size' => 96]),
            ];
        }
    }

    /* Google OAuth Client ID — valor público para Google Identity Services */
    $googleClientId = $_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID') ?: '';
    if ($googleClientId) {
        $context['googleClientId'] = $googleClientId;
    }

    return $context;
});
SyncManager::setAdminBarVisible(true); 
SyncManager::setResetButtonVisible(true);
