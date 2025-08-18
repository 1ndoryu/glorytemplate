<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;

AssetManager::setThemeVersion('0.1.1');
SyncManager::setAdminBarVisible(true);
SyncManager::setResetButtonVisible(true);

PageManager::define('home', 'home');

add_filter('glory/nav_config', function(array $config): array {
    $config['contentSelector'] = '#main';
    $config['mainScrollSelector'] = '#main';
    return $config;
});
