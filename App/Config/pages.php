<?php

/**
 * Configuracion de paginas para Glory.
 * 
 * ARQUITECTURA REACT-FIRST:
 * -------------------------
 * Las paginas React se definen en un solo lugar (REACT_PAGES).
 * Todas usan el mismo handler (renderReactApp) que renderiza MainAppIsland.
 * El router de React (AppRouter.tsx) se encarga de mostrar el componente correcto.
 * 
 * Para agregar una nueva pagina React:
 * 1. Crea el componente Island en App/React/islands/
 * 2. Registra la ruta en App/React/components/router/AppRouter.tsx
 * 3. Agrega el slug al array REACT_PAGES abajo
 * 
 * NO necesitas crear archivos PHP individuales para cada pagina.
 */

use Glory\Manager\PageManager;
use Glory\Core\GloryFeatures;

// Incluir el handler centralizado de React
require_once get_template_directory() . '/App/Templates/handlers/reactApp.php';

PageManager::setDefaultContentMode('code');

// --- PAGINAS REACT (SPA) ---
// Todas estas paginas usan el router de React.
// El slug debe coincidir con la ruta definida en AppRouter.tsx
const REACT_PAGES = [
    'home',       // / -> HomeIsland
    'servicios',  // /servicios -> ServicesIsland
    'planes',     // /planes -> PricingIsland
    'demos',      // /demos -> DemosIsland
    'sobre-mi',   // /sobre-mi -> AboutIsland
    'blog',       // /blog -> BlogIsland
    'contacto',   // /contacto -> ContactIsland
    'privacidad', // /privacidad -> PrivacyIsland
    'cookies',    // /cookies -> CookiesIsland
    'panel-ia',   // /panel-ia -> AdminAIIsland (solo admins)
];

// Registrar TODAS las paginas React como Fullpage
// Glory es agnostico - todas las definiciones especificas van aqui en App/
PageManager::registerReactFullPages(REACT_PAGES);

// Registrar todas las paginas React con el mismo handler
foreach (REACT_PAGES as $slug) {
    PageManager::define($slug, 'renderReactApp');
}

// --- PAGINAS NO-REACT (nativas de Glory) ---
// Estas paginas usan el sistema tradicional de Glory

if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

if (GloryFeatures::isActive('amazonProduct') !== false) {
    PageManager::define('amazon-demo', 'Glory\Plugins\AmazonProduct\Controller\DemoController::render');
}
