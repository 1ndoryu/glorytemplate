<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;
use Dotenv\Dotenv;
use Glory\Helpers\AjaxNav;

AssetManager::setThemeVersion('0.1.4');
SyncManager::setAdminBarVisible(true);
SyncManager::setResetButtonVisible(true);

PageManager::define('home', 'home');
#PageManager::define('panel', 'renderPanel', null, ['administrator']);
PageManager::define('reservar', 'renderPaginaReservarPublica');
// Página de documentación pública de la API (Chatbot)
PageManager::define('documentacion-api', 'renderPaginaDocumentacion');

AjaxNav::contentSelector('#main');
AjaxNav::mainScrollSelector('#main');
AjaxNav::registerFilter();
