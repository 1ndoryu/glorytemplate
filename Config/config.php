<?php 

use Glory\Manager\AssetManager;
use Glory\Admin\SyncManager;
use Glory\Helpers\AjaxNav;
use App\Handlers\ContentAjaxHandler;

AssetManager::setThemeVersion('0.1.1');
add_filter('show_admin_bar', '__return_false');
SyncManager::setAdminBarVisible(true); 
SyncManager::setResetButtonVisible(true);


AjaxNav::contentSelector('#main');
AjaxNav::mainScrollSelector('#main');
AjaxNav::registerFilter();

require_once get_template_directory() . '/App/Handlers/ContentAjaxHandler.php';
ContentAjaxHandler::register();

// Solo eliminar transients en modo dev
if (defined('LOCAL') && LOCAL) {
    delete_transient('fusion_tos');
    delete_transient('fusion_fb_tos');
    delete_transient('fusionapp_to_sections');
    delete_transient('avada_options_sections');
}
