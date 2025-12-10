<?php

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

PageManager::setDefaultContentMode('code');

// Home: usa funcion home() que renderiza ReactIslands::render('HomeIsland')
// Marcamos con 'react-fullpage' para indicar que usa layout React completo
PageManager::define('home', 'home');

if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
