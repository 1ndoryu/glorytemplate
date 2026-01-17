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

PageManager::setDefaultContentMode('code');

/*
 * =====================================================
 * PAGINAS DEL MODULO CAP
 * =====================================================
 * 
 * Solo necesitas:
 * 1. Crear el Island en App/React/islands/cap/
 * 2. Registrar en App/React/appIslands.tsx
 * 3. Agregar aqui con reactPage()
 * 
 * NO necesitas crear archivo PHP en templates/pages/
 */

/* 
 * TO-DO: Descomentar cuando se implemente Fase 1
 * 
 * PageManager::reactPage('cap-login', 'CapLoginIsland');
 * 
 * PageManager::reactPage('cap-registro', 'CapRegistroIsland');
 * 
 * PageManager::reactPage('cap-dashboard', 'CapDashboardIsland', function($pageId) {
 *     return [
 *         'user' => [
 *             'id' => get_current_user_id(),
 *             'name' => wp_get_current_user()->display_name,
 *             'email' => wp_get_current_user()->user_email,
 *         ],
 *         'restNonce' => wp_create_nonce('wp_rest'),
 *     ];
 * });
 */
