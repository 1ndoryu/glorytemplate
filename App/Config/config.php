<?php 

use Glory\Manager\AssetManager;

use Glory\Admin\SyncManager;
use Glory\Core\GloryFeatures;

AssetManager::setThemeVersion('0.1.1');
add_filter('show_admin_bar', '__return_false');
SyncManager::setAdminBarVisible(true); 
SyncManager::setResetButtonVisible(true);
