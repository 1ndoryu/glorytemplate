<?php 

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

PageManager::setDefaultContentMode('code');

PageManager::define('home', 'home');
PageManager::define('contructor', 'contructor');

if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
    PageManager::define('logic', 'logic');
}
