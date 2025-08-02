<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;

define('LOCAL', true);
AssetManager::setGlobalDevMode(true);
AssetManager::setThemeVersion('0.1.1');
AssetManager::defineFolder('script', '/assets/js/');
AssetManager::defineFolder('style', '/assets/css/');
SyncManager::setAdminBarVisible(true);
SyncManager::setResetButtonVisible(true);

PageManager::define('home', 'Home', 'templates/TemplateHome.php');

# test
# CreditosManager::init();
# CreditosManager::recargaPeriodica(true, 10, 1);
