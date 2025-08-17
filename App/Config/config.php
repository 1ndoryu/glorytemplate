<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;
use Dotenv\Dotenv;

// Cargar variables desde .env (phdotenv si está disponible)
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

// Variables de configuración
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

