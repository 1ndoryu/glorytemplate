<?php

use Dotenv\Dotenv;
use Glory\Manager\AssetManager;

/* 
*    Este archivo es el encargado de cargar las variables de entorno desde el archivo .env.
*/

if (class_exists(Dotenv::class)) {
    try {
        $dotenv = Dotenv::createImmutable(get_template_directory());
        $dotenv->safeLoad();
    } catch (\Throwable $e) {
        error_log('Dotenv load error: ' . $e->getMessage());
    }
}

// Variables esperadas: LOCAL, GLOBAL_DEV_MODE (valores: true/false, 1/0, yes/no)
$envLocal = $_ENV['LOCAL'] ?? getenv('LOCAL');
$localValue = $envLocal !== null && $envLocal !== false ? filter_var($envLocal, FILTER_VALIDATE_BOOLEAN) : false;
define('LOCAL', $localValue);


$envGlobalDev = $_ENV['GLOBAL_DEV_MODE'] ?? getenv('GLOBAL_DEV_MODE');
$globalDev = $envGlobalDev !== null && $envGlobalDev !== false ? filter_var($envGlobalDev, FILTER_VALIDATE_BOOLEAN) : false;
AssetManager::setGlobalDevMode($globalDev);
