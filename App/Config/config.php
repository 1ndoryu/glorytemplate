<?php 

use Glory\Manager\AssetManager;

use Glory\Admin\SyncManager;
use Glory\Core\GloryFeatures;

AssetManager::setThemeVersion('0.1.1');
add_filter('show_admin_bar', '__return_false');

/*
 * Inyectar datos de usuario en GLORY_CONTEXT para que React
 * detecte la sesión de WordPress sin necesidad de una llamada AJAX.
 */
add_filter('glory_react_context', function (array $context): array {
    $userId = get_current_user_id();
    $context['isLoggedIn'] = $userId > 0;
    $context['userId'] = $userId ?: null;

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

    return $context;
});
SyncManager::setAdminBarVisible(true); 
SyncManager::setResetButtonVisible(true);
