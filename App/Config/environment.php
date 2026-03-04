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


$envGlobalDev = $_ENV['DEV'] ?? getenv('DEV');
$globalDev = $envGlobalDev !== null && $envGlobalDev !== false ? filter_var($envGlobalDev, FILTER_VALIDATE_BOOLEAN) : false;
AssetManager::setGlobalDevMode($globalDev);

/*
 * =====================================================
 * STRIPE — Puente .env → constantes Glory
 * =====================================================
 * En .env se puede usar cualquiera de estos formatos:
 *   GLORY_STRIPE_SECRET_KEY=sk_test_...     (formato con prefijo)
 *   STRIPE_SECRET_KEY=sk_test_...           (formato corto)
 *
 * Las constantes GLORY_STRIPE_* son las que usa StripeConfig.
 */
$stripeConstants = [
    'GLORY_STRIPE_SECRET_KEY',
    'GLORY_STRIPE_PUBLISHABLE_KEY',
    'GLORY_STRIPE_WEBHOOK_SECRET',
];

foreach ($stripeConstants as $constName) {
    if (!defined($constName)) {
        // Primero buscar con prefijo GLORY_
        $val = $_ENV[$constName] ?? getenv($constName);
        // Si no, buscar sin prefijo (STRIPE_SECRET_KEY)
        if (($val === null || $val === false || $val === '') && str_starts_with($constName, 'GLORY_')) {
            $shortKey = substr($constName, 6); // quita "GLORY_"
            $val = $_ENV[$shortKey] ?? getenv($shortKey);
        }
        if ($val !== null && $val !== false && $val !== '') {
            define($constName, $val);
        }
    }
}

// Log de estado de entorno
#error_log('[ENV] LOCAL=' . ($localValue ? 'true' : 'false') . ' | GLOBAL_DEV_MODE=' . ($globalDev ? 'true' : 'false'));