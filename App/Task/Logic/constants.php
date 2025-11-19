<?php

if (!defined('GLORY_LOGIC_MAX_STEPS')) {
    define('GLORY_LOGIC_MAX_STEPS', 5);
}

if (!defined('GLORY_LOGIC_DEFAULT_HABITS')) {
    define('GLORY_LOGIC_DEFAULT_HABITS', ['Ejercicio', 'Leer', 'Meditar']);
}

if (!defined('GLORY_LOGIC_HISTORY_LIMIT')) {
    define('GLORY_LOGIC_HISTORY_LIMIT', 30);
}

if (!defined('GLORY_LOGIC_PUBLIC_API_KEY')) {
    $envLogicKey = $_ENV['LOGIC_API_KEY'] ?? getenv('LOGIC_API_KEY');
    $panelLogicKey = '';
    if (class_exists(\Glory\Manager\OpcionManager::class)) {
        $panelLogicKey = \Glory\Manager\OpcionManager::get('glory_logic_api_key', '');
    }

    $resolvedLogicKey = $envLogicKey ?: $panelLogicKey;
    define('GLORY_LOGIC_PUBLIC_API_KEY', is_string($resolvedLogicKey) ? trim($resolvedLogicKey) : '');
}

