<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;
use Glory\Helpers\AjaxNav;
use Glory\Core\GloryFeatures;
use App\Handlers\ContentAjaxHandler;

AssetManager::setThemeVersion('0.1.1');
add_filter('show_admin_bar', '__return_false');
SyncManager::setAdminBarVisible(true); 
SyncManager::setResetButtonVisible(true);


#PageManager::define('home', 'home');
if (GloryFeatures::isActive('task') !== false) {
    #PageManager::define('task', 'task');
}

AjaxNav::contentSelector('#main');
AjaxNav::mainScrollSelector('#main');
AjaxNav::registerFilter();

// Registrar handlers AJAX de contenido
require_once get_template_directory() . '/App/Handlers/ContentAjaxHandler.php';
ContentAjaxHandler::register();


delete_transient('fusion_tos');
delete_transient('fusion_fb_tos');
delete_transient('fusionapp_to_sections');
delete_transient('avada_options_sections');
