<?php

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

PageManager::setDefaultContentMode('code');

// Registrar paginas como React Fullpage (100% React, sin header/footer de WP)
PageManager::registerReactFullPages(['home']);

// Definir la pagina home con su funcion de renderizado
PageManager::define('home', 'home');

if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
