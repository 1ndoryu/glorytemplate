<?php

/**
 * App Pages Configuration
 * 
 * Este archivo define todas las paginas gestionadas del proyecto.
 * 
 * METODOS DISPONIBLES:
 * 
 * 1. reactPage() - RECOMENDADO para paginas React (simplificado)
 *    PageManager::reactPage('mi-pagina', 'MiIsland');
 *    PageManager::reactPage('mi-pagina', 'MiIsland', ['prop' => 'valor']);
 *    PageManager::reactPage('mi-pagina', 'MiIsland', fn($id) => [...]);
 * 
 * 2. define() - Para paginas con templates PHP personalizados
 *    PageManager::define('mi-pagina', 'miFuncion');
 * 
 * 3. registerReactFullPages() - Solo si usas define() para React
 *    PageManager::registerReactFullPages(['mi-pagina']);
 */

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

PageManager::setDefaultContentMode('code');

/*
 * =====================================================
 * PAGINAS REACT (usando reactPage - simplificado)
 * =====================================================
 * 
 * Solo necesitas:
 * 1. Crear el Island en App/React/islands/
 * 2. Registrar en App/React/appIslands.tsx
 * 3. Agregar aqui con reactPage()
 * 
 * NO necesitas crear archivo PHP en templates/pages/
 */

// Pagina estatica sin Page Builder (ejemplo de uso simple)
// PageManager::reactPage('home-static', 'HomeStaticIsland', ...);

// Landing principal del sitio
PageManager::reactPage('home', 'LandingIsland');

/*
 * =====================================================
 * PAGINAS CON TEMPLATES PHP PERSONALIZADOS
 * =====================================================
 * 
 * Usa define() cuando necesitas:
 * - Logica PHP compleja para obtener props
 * - Acceso a funciones de WordPress que no estan disponibles durante config
 * - Compatibilidad con codigo existente
 */

// Editor con Page Builder
PageManager::registerReactFullPages(['editor']);
PageManager::define('editor', 'editor');

// Pagina de prueba - LIMPIADO
// PageManager::define('test', 'test');

/*
 * =====================================================
 * PAGINAS CONDICIONALES (solo si feature activa)
 * =====================================================
 */

if (GloryFeatures::isActive('task') !== false) {
    // PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    // PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
