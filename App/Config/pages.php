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

/*
PageManager::reactPage('home-static', 'HomeStaticIsland', [
    'stripeUrl' => 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c'
]);
*/

// Home — Feed principal de Kamples
PageManager::reactPage('home', 'InicioIsland');

/*
 * =====================================================
 * PAGINAS KAMPLES — Autenticación y Perfiles (Fase 1)
 * =====================================================
 */
PageManager::reactPage('auth/login', 'LoginIsland');
PageManager::reactPage('auth/registro', 'RegistroIsland');

/* Perfil público — recibe username como prop dinámica */
PageManager::reactPage('perfil', 'PerfilIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    /* /perfil/{username} → username es el último segmento */
    $username = end($partes);
    if ($username === 'editar') {
        return ['username' => ''];
    }
    return ['username' => sanitize_text_field($username)];
});

PageManager::reactPage('perfil/editar', 'EditarPerfilIsland');

/*
 * =====================================================
 * PAGINAS KAMPLES — Core de Samples (Fase 2)
 * =====================================================
 */
PageManager::reactPage('explorar', 'SamplesIsland');
/* Subir es ahora un modal global, no una página separada */

/* Detalle de sample — recibe slug dinámico */
PageManager::reactPage('sample', 'SampleDetalleIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    $slug = end($partes);
    return ['slug' => sanitize_text_field($slug)];
});

/*
 * =====================================================
 * DEV — Showcase de componentes (solo desarrollo)
 * =====================================================
 */
PageManager::reactPage('componentes', 'ShowcaseIsland');
PageManager::reactPage('dev/componentes', 'ShowcaseIsland');

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

// Home con Page Builder (necesita template PHP por los props dinamicos)
/*

PageManager::registerReactFullPages(['home', 'editor']);
PageManager::registerReactFullPages(['editor']);
PageManager::define('editor', 'editor');
PageManager::define('test', 'test');
*/ 

/*
 * =====================================================
 * PAGINAS CONDICIONALES (solo si feature activa)
 * =====================================================
 */

/*
if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
*/