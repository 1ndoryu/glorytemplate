<?php

/**
 * App Pages Configuration
 * 
 * Este archivo define todas las páginas gestionadas del proyecto.
 * 
 * MÉTODOS DISPONIBLES:
 * 
 * 1. reactPage() - RECOMENDADO para páginas React (simplificado)
 *    PageManager::reactPage('mi-pagina', 'MiIsland');
 *    PageManager::reactPage('mi-pagina', 'MiIsland', ['prop' => 'valor']);
 *    PageManager::reactPage('mi-pagina', 'MiIsland', fn($id) => [...]);
 * 
 * 2. define() - Para páginas con templates PHP personalizados
 *    PageManager::define('mi-pagina', 'miFuncion');
 * 
 * 3. registerReactFullPages() - Solo si usas define() para React
 *    PageManager::registerReactFullPages(['mi-pagina']);
 */

use Glory\Manager\PageManager;

PageManager::setDefaultContentMode('code');

/*
 * DASHBOARD
 * Página principal de productividad personal
 * Incluye: Hábitos, Tareas, Notas rápidas
 */
PageManager::reactPage('home', 'DashboardIsland', [
    'titulo' => 'DASHBOARD_01',
    'version' => 'v1.0.1-beta',
    'usuario' => 'user@admin'
]);
