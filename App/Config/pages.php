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

// Home (Bienvenida)
// Usa callback fn($id) para evaluación lazy (AssetHelper se carga después de Config/)
PageManager::reactPage('home', 'BienvenidaIsland', fn($id) => [
    'titulo' => 'Bienvenido a Glory React',
    'bgImage' => \App\Helpers\AssetHelper::getRandomHeroImage()
]);

// Servicios
PageManager::reactPage('servicios', 'ServiciosIsland', [
    'titulo' => 'Nuestros Servicios'
]);

// Proyectos
PageManager::reactPage('proyectos', 'ProyectosIsland', [
    'titulo' => 'Nuestros Proyectos'
]);

// Nosotros
PageManager::reactPage('nosotros', 'NosotrosIsland', [
    'titulo' => 'Sobre Nosotros'
]);

// Blog
PageManager::reactPage('blog', 'BlogIsland', [
    'titulo' => 'Blog'
]);

// Soluciones - Landing principal
PageManager::reactPage('soluciones', 'SolucionesIsland', [
    'titulo' => 'Soluciones'
]);

// Soluciones - Sub-páginas (placeholder)
PageManager::reactPage('soluciones/hosting', 'SolucionPlaceholderIsland', [
    'titulo' => 'Hosting Administrado',
    'descripcion' => 'Estamos preparando toda la información sobre nuestro servicio de hosting profesional. Pronto podrás ver planes, precios y beneficios.'
]);

PageManager::reactPage('soluciones/vps', 'SolucionPlaceholderIsland', [
    'titulo' => 'Servidores VPS',
    'descripcion' => 'Nuestras soluciones de servidores VPS están en camino. Muy pronto podrás conocer todas las opciones disponibles.'
]);

PageManager::reactPage('soluciones/agentes-ia', 'SolucionPlaceholderIsland', [
    'titulo' => 'Agentes de IA',
    'descripcion' => 'Estamos diseñando las mejores soluciones de inteligencia artificial para tu negocio. Contáctanos para una consulta personalizada.'
]);

// Contacto
PageManager::reactPage('contacto', 'ContactoIsland', [
    'titulo' => 'Contacto'
]);

// Panel de usuario (placeholder, requiere autenticación futura)
PageManager::reactPage('panel', 'PanelIsland', [
    'titulo' => 'Mi Panel'
]);
