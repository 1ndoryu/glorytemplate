<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;
use Dotenv\Dotenv;
use Glory\Helpers\AjaxNav;

AssetManager::setThemeVersion('0.1.1');
SyncManager::setAdminBarVisible(true);
SyncManager::setResetButtonVisible(true);

PageManager::define('home', 'home');
#PageManager::define('panel', 'renderPanel', null, ['administrator']);
PageManager::define('reservar', 'renderPaginaReservarPublica');

AjaxNav::contentSelector('#main');
AjaxNav::mainScrollSelector('#main');
AjaxNav::registerFilter();
