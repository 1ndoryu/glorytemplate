<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;

define('LOCAL', true);
AssetManager::setGlobalDevMode(true);
AssetManager::setThemeVersion('0.1.1');
SyncManager::setAdminBarVisible(true);
SyncManager::setResetButtonVisible(true);

PageManager::define('home', 'home');

# test
# CreditosManager::init();
# CreditosManager::recargaPeriodica(true, 10, 1);
