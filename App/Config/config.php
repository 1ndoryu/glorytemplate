<?php 

use Glory\Core\AssetManager;
use Glory\Core\PageManager;
use Glory\Admin\SyncManager;

define('LOCAL', true);
AssetManager::setGlobalDevMode(true);
AssetManager::setThemeVersion('0.1.1');
AssetManager::defineFolder('script', '/assets/js/');
AssetManager::defineFolder('style', '/assets/css/');
SyncManager::setAdminBarVisible(true);
SyncManager::setResetButtonVisible(true);

PageManager::define('home');

# test
# CreditosManager::init();
# CreditosManager::recargaPeriodica(true, 10, 1);
