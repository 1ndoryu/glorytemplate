<?php

use Glory\Core\GloryFeatures;

//Managers
GloryFeatures::enable('menu');
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::disable('gbn');
GloryFeatures::enable('pageManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('taxonomyMetaManager');
GloryFeatures::enable('scheduleManager');
GloryFeatures::enable('defaultContentManager');
GloryFeatures::disable('licenseManager');
GloryFeatures::disable('creditosManager');

//UI Components
GloryFeatures::enable('modales');
GloryFeatures::enable('submenus');
GloryFeatures::enable('pestanas');
GloryFeatures::enable('scheduler');
GloryFeatures::enable('headerAdaptativo');
GloryFeatures::enable('themeToggle');
GloryFeatures::enable('alertas');
GloryFeatures::enable('gestionarPreviews');
GloryFeatures::enable('paginacion');
GloryFeatures::enable('gloryFilters');
GloryFeatures::enable('calendario');
GloryFeatures::enable('badgeList');
GloryFeatures::enable('highlight');
GloryFeatures::enable('gsap');
GloryFeatures::disable('gbnSplitContent');
GloryFeatures::disable('gloryLinkCpt');

//Services
GloryFeatures::disable('cssCritico');
GloryFeatures::enable('navegacionAjax');
GloryFeatures::enable('gloryAjax');
GloryFeatures::enable('gloryForm');
GloryFeatures::enable('gloryBusqueda');
GloryFeatures::enable('gloryRealtime');

// Task feature flag
GloryFeatures::enable('task');
GloryFeatures::enable('amazonProduct');

// Renderers
GloryFeatures::enable('logoRenderer');
GloryFeatures::enable('contentRender');
GloryFeatures::enable('termRender');

//Theme options
GloryFeatures::enable('titleTag');
GloryFeatures::enable('postThumbnails');

//Integrations
GloryFeatures::disable('avadaIntegration');

//Admin
GloryFeatures::disable('queryProfiler');
GloryFeatures::disable('performanceProfiler');
GloryFeatures::disable('queryProfilerLogs');

// Registrar handlers AJAX específicos del tema de forma segura (puede cargarse más tarde)
if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
    error_log("control.php: ContentAjaxHandler class exists, registering immediately");
    \App\Handlers\ContentAjaxHandler::register();
} else {
    error_log("control.php: ContentAjaxHandler class NOT found, hooking to init");
    add_action('init', function () {
        if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
            error_log("control.php (init): ContentAjaxHandler class exists, registering");
            \App\Handlers\ContentAjaxHandler::register();
        } else {
            error_log("control.php (init): ContentAjaxHandler class STILL NOT found");
        }
    });
}

// Registro de SeoManager para metadatos (Title, Description, JSON-LD)
if (class_exists(\App\Services\SeoManager::class)) {
    \App\Services\SeoManager::register();
} else {
    // Fallback si el autoloader no lo ha pillado aun (aunque deberia)
    $seoManagerPath = get_template_directory() . '/App/Services/SeoManager.php';
    if (file_exists($seoManagerPath)) {
        require_once $seoManagerPath;
        if (class_exists(\App\Services\SeoManager::class)) {
            \App\Services\SeoManager::register();
        }
    }
}

// Cargar configuracion de rendimiento (preconexiones, fuentes)
$performanceConfig = get_template_directory() . '/App/Config/performance.php';
if (file_exists($performanceConfig)) {
    require_once $performanceConfig;
}

// Cargar modulo de IA para generacion de contenido (Fase 6)
$contentAiLoader = get_template_directory() . '/App/Services/ContentAI/loader.php';
if (file_exists($contentAiLoader)) {
    require_once $contentAiLoader;
}
