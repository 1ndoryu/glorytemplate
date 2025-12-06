<?php 

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

PageManager::setDefaultContentMode('code');
PageManager::define('home', 'landing_render');
PageManager::define('servicios', 'services_render');
PageManager::define('casos', 'casos_render');
PageManager::define('about', 'about_render');
PageManager::define('contructor', 'contructor');

if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
