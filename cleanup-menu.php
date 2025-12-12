<?php

/**
 * Script temporal para limpiar menus duplicados
 * 
 * INSTRUCCIONES:
 * 1. Visita /wp-content/themes/glory/cleanup-menu.php en tu navegador
 * 2. Una vez ejecutado, ELIMINA este archivo
 * 
 * @package Glory
 */

// Cargar WordPress
$wpLoadPath = dirname(__FILE__, 4) . '/wp-load.php';
if (!file_exists($wpLoadPath)) {
    die('Error: No se pudo encontrar wp-load.php');
}
require_once $wpLoadPath;

// Verificar que el usuario es admin
if (!current_user_can('manage_options')) {
    die('Error: Necesitas permisos de administrador');
}

// Cargar el MenuManager
if (!class_exists(\Glory\Manager\MenuManager::class)) {
    die('Error: MenuManager no disponible');
}

echo '<h1>Limpieza de Menu Duplicado</h1>';
echo '<pre>';

// Ejecutar la limpieza
echo "Ejecutando restablecerMenusDesdeCodigo()...\n";
\Glory\Manager\MenuManager::restablecerMenusDesdeCodigo();
echo "Completado!\n\n";

// Verificar el resultado
$locations = get_nav_menu_locations();
echo "Ubicaciones de menu:\n";
print_r($locations);

if (isset($locations['main_navigation'])) {
    $menuId = $locations['main_navigation'];
    $items = wp_get_nav_menu_items($menuId);
    echo "\nItems del menu principal (ID: $menuId):\n";
    if (is_array($items)) {
        foreach ($items as $item) {
            echo "  - {$item->title} ({$item->url})\n";
        }
        echo "\nTotal items: " . count($items) . "\n";
    } else {
        echo "  No hay items\n";
    }
}

echo '</pre>';
echo '<p style="color: red; font-weight: bold;">IMPORTANTE: Elimina este archivo despues de ejecutarlo!</p>';
echo '<p>Ruta: ' . __FILE__ . '</p>';
