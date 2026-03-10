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

/* Paginas React (usando reactPage - simplificado)
 * Solo necesitas:
 * 1. Crear el Island en App/React/islands/
 * 2. Registrar en App/React/appIslands.tsx
 * 3. Agregar aqui con reactPage()
 * NO necesitas crear archivo PHP en templates/pages/ */

// Pagina estatica sin Page Builder (ejemplo de uso simple)

/*
PageManager::reactPage('home-static', 'HomeStaticIsland', [
    'stripeUrl' => 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c'
]);
*/

// Home — Feed principal de Kamples
PageManager::reactPage('home', 'InicioIsland');

/* Paginas Kamples — Autenticacion y Perfiles (Fase 1) */
PageManager::reactPage('auth/login', 'LoginIsland');
PageManager::reactPage('auth/registro', 'RegistroIsland');

/* Perfil público — recibe username como prop dinámica */
PageManager::reactPage('perfil', 'PerfilIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    /* /perfil/{username} → username es el último segmento */
    $username = end($partes);
    if ($username === 'perfil' || $username === 'editar') {
        return ['username' => ''];
    }
    return ['username' => sanitize_text_field($username)];
});

/* Rutas dinámicas: /perfil/{username} y /sample/{slug} resuelven a su página padre */
PageManager::registrarRutaDinamica('perfil');
PageManager::registrarRutaDinamica('sample');

PageManager::reactPage('perfil/editar', 'EditarPerfilIsland');

/* Paginas Kamples — Core de Samples (Fase 2) */
/* Explorar eliminado: la búsqueda se hace desde el feed principal */

PageManager::reactPage('libreria', 'LibreriaIsland');
PageManager::reactPage('descargas', 'DescargasIsland');
PageManager::reactPage('favoritos', 'FavoritosIsland');
PageManager::reactPage('reproductor', 'ReproductorIsland');
PageManager::reactPage('descubrir', 'DescubrirIsland');
PageManager::reactPage('planes', 'PlanesIsland');
PageManager::reactPage('comunidad', 'ComunidadIsland');

PageManager::reactPage('publicacion', 'PublicacionIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    $idx = array_search('publicacion', $partes);
    $pubId = ($idx !== false && isset($partes[$idx + 1])) ? $partes[$idx + 1] : '';
    return ['publicacionId' => sanitize_text_field($pubId)];
});

PageManager::registrarRutaDinamica('publicacion');

/*
 * C353: Explorador desactivado temporalmente.
 * El sistema de carpetas basado en metadata IA se reemplazara por uno basado en
 * colecciones del usuario (ver C355 en roadmap). Se reactivara cuando el nuevo
 * sistema de sincronizacion este listo.
 */
// PageManager::reactPage('explorador', 'ExploradorIsland');

/*
 * Colección detalle — recibe coleccionId como segmento dinámico
 */
PageManager::reactPage('coleccion', 'ColeccionDetalleIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    $idx = array_search('coleccion', $partes);
    $coleccionId = ($idx !== false && isset($partes[$idx + 1])) ? $partes[$idx + 1] : '';
    return ['coleccionId' => sanitize_text_field($coleccionId)];
});

/* Ruta dinámica: /coleccion/{slug} */
PageManager::registrarRutaDinamica('coleccion');

/* Paginas Kamples — Mensajeria (Fase 7) */
PageManager::reactPage('mensajes', 'MensajesIsland');

/* Chat individual — recibe conversacionId como segmento dinámico */
PageManager::reactPage('mensajes/chat', 'ChatIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    $idx = array_search('mensajes', $partes);
    $convId = ($idx !== false && isset($partes[$idx + 1])) ? $partes[$idx + 1] : '';
    return ['conversacionId' => sanitize_text_field($convId)];
});

/* Paginas Kamples — Admin / Dashboard Creador (Fase 6) */
PageManager::reactPage('admin/dashboard', 'DashboardCreadorIsland');
PageManager::reactPage('admin/panel', 'AdminPanelIsland');

/* Detalle de sample — recibe slug dinámico */
PageManager::reactPage('sample', 'SampleDetalleIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    $slug = end($partes);
    return ['slug' => sanitize_text_field($slug)];
});

/* Paginas Kamples — Sample Discovery (Canciones) */
PageManager::reactPage('musica', 'ExplorarCancionesIsland');

PageManager::reactPage('cancion', 'CancionDetalleIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    $slug = end($partes);
    return ['slug' => sanitize_text_field($slug)];
});

PageManager::registrarRutaDinamica('cancion');

/* Paginas Kamples — Detalle de relación de sampleo */
/* URL SEO: /sampleo/{id}/{slug-descriptivo} o /sampleo/{id} (retrocompat) */
PageManager::reactPage('sampleo', 'RelacionDetalleIsland', function($pageId) {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $partes = explode('/', $path);
    /* partes[0]='sampleo', partes[1]=id numérico, partes[2]=slug (opcional) */
    $id = isset($partes[1]) && is_numeric($partes[1]) ? $partes[1] : end($partes);
    return ['id' => sanitize_text_field($id)];
});

PageManager::registrarRutaDinamica('sampleo');

/* DEV — Showcase de componentes (solo desarrollo) */
PageManager::reactPage('componentes', 'ShowcaseIsland');
PageManager::reactPage('dev/componentes', 'ShowcaseIsland');

/* Paginas con templates PHP personalizados
 * Usa define() cuando necesitas:
 * - Logica PHP compleja para obtener props
 * - Acceso a funciones de WordPress que no estan disponibles durante config
 * - Compatibilidad con codigo existente */

// Home con Page Builder (necesita template PHP por los props dinamicos)
/*

PageManager::registerReactFullPages(['home', 'editor']);
PageManager::registerReactFullPages(['editor']);
PageManager::define('editor', 'editor');
PageManager::define('test', 'test');
*/ 

/* Paginas condicionales (solo si feature activa) */

/*
if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
*/