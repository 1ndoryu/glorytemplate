<?php 

use Glory\Manager\PageManager;

PageManager::setDefaultContentMode('code');

PageManager::define('home', 'home');
PageManager::define('contructor', 'contructor');

if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}
