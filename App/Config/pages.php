<?php

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

PageManager::setDefaultContentMode('code');
PageManager::define('home', 'landing_render');
PageManager::define('servicios', 'services_render');
PageManager::define('casos', 'casos_render');
PageManager::define('about', 'about_render');
PageManager::define('contacto', 'contact_render');
PageManager::define('contructor', 'contructor');

// Paginas de servicios individuales
PageManager::define('servicio-comet', 'service_comet_render');
PageManager::define('servicio-nebula', 'service_nebula_render');
PageManager::define('servicio-quasar', 'service_quasar_render');
PageManager::define('servicio-orbit', 'service_orbit_render');
PageManager::define('servicio-galaxy', 'service_galaxy_render');
PageManager::define('servicio-universe', 'service_universe_render');

if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
