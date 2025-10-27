<?php

namespace App\Admin;

use Glory\Manager\OpcionManager;

\add_action('admin_bar_menu', function(\WP_Admin_Bar $bar){
    if (!current_user_can('manage_options')) { return; }
    $activo = (bool) OpcionManager::get('aawp_preview_activo', true);
    $title = $activo ? 'AAWP Vista previa: ON' : 'AAWP Vista previa: OFF';
    $bar->add_node([
        'id' => 'aawp_preview_toggle',
        'title' => $title,
        'href' => wp_nonce_url(admin_url('admin-post.php?action=toggle_aawp_preview'), 'toggle_aawp_preview'),
        'meta' => ['class' => $activo ? 'aawp-prev-on' : 'aawp-prev-off']
    ]);
}, 90);

\add_action('admin_post_toggle_aawp_preview', function(){
    if (!current_user_can('manage_options')) { wp_die('Not allowed'); }
    check_admin_referer('toggle_aawp_preview');
    $actual = (bool) OpcionManager::get('aawp_preview_activo', true);
    $nuevo = !$actual;
    \Glory\Core\OpcionRepository::save('aawp_preview_activo', $nuevo);
    OpcionManager::clearCache();
    wp_safe_redirect(wp_get_referer() ?: admin_url());
    exit;
});




