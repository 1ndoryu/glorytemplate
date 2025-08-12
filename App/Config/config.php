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
#PageManager::define('panel', 'renderPanel', null, ['administrator']);
PageManager::define('reservar', 'renderPaginaReservarPublica');

# Permitir configurar gloryAjaxNav desde el tema (selectors, etc.)
add_filter('glory/nav_config', function(array $config): array {
    // Ajusta aquí los selectores por defecto del tema
    $config['contentSelector'] = '#main';
    $config['mainScrollSelector'] = '#main';
    // $config['loadingBarSelector'] = '#loadingBar'; // opcional
    // $config['cacheEnabled'] = true; // opcional
    return $config;
});

