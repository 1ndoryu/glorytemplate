<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;
use Glory\Helpers\AjaxNav;
use Glory\Core\GloryFeatures;
use App\Handlers\ContentAjaxHandler;

AssetManager::setThemeVersion('0.1.1');
add_filter('show_admin_bar', '__return_false');
SyncManager::setAdminBarVisible(false); 
SyncManager::setResetButtonVisible(false);


#PageManager::define('home', 'home');
if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

AjaxNav::contentSelector('#main');
AjaxNav::mainScrollSelector('#main');
AjaxNav::registerFilter();

// Registrar handlers AJAX de contenido
require_once get_template_directory() . '/App/Handlers/ContentAjaxHandler.php';
ContentAjaxHandler::register();

// Redirigir singles de post y glory_link a la home con #slug
add_action('template_redirect', function () {
    if (is_admin() || wp_doing_ajax()) {
        return;
    }
    if (!is_singular()) {
        return;
    }
    // Excepciones para el live builder de Avada (parámetros y referer del iframe)
    if (
        (isset($_GET['fb-edit']) && $_GET['fb-edit'] === '1') ||
        (isset($_GET['awb-preview']) && $_GET['awb-preview'] === '1') ||
        (isset($_GET['awb_preview']) && $_GET['awb_preview'] === '1')
    ) {
        return;
    }
    $referer = isset($_SERVER['HTTP_REFERER']) ? (string) $_SERVER['HTTP_REFERER'] : '';
    if ($referer !== '' && (
        strpos($referer, 'fb-edit=1') !== false ||
        strpos($referer, 'awb-preview') !== false ||
        strpos($referer, 'awb_preview') !== false ||
        strpos($referer, '/wp-admin/') !== false
    )) {
        return;
    }
    // Evitar redirección en modos de vista previa/customizer
    if (function_exists('is_customize_preview') && is_customize_preview()) {
        return;
    }
    if (is_preview()) {
        return;
    }
    $obj = get_queried_object();
    if (!$obj || empty($obj->post_name)) {
        return;
    }
    $tipo = get_post_type($obj);
    if ($tipo !== 'post' && $tipo !== 'glory_link') {
        return;
    }
    $destino = home_url('/#' . $obj->post_name);
    wp_safe_redirect($destino, 301);
    exit;
});
