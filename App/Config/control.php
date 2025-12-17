<?php

use Glory\Core\GloryFeatures;
use Glory\Services\NextjsApiService;

//Managers
GloryFeatures::disable('menu');
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::enable('pageManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('scheduleManager');
GloryFeatures::enable('defaultContentManager');

GloryFeatures::disable('gbn');
GloryFeatures::disable('licenseManager');
GloryFeatures::disable('creditosManager');
GloryFeatures::disable('taxonomyMetaManager');

//UI Components
GloryFeatures::disable('modales');
GloryFeatures::disable('submenus');
GloryFeatures::disable('pestanas');
GloryFeatures::disable('scheduler');
GloryFeatures::disable('headerAdaptativo');
GloryFeatures::disable('themeToggle');
GloryFeatures::disable('alertas');
GloryFeatures::disable('gestionarPreviews');
GloryFeatures::disable('paginacion');
GloryFeatures::disable('gloryFilters');
GloryFeatures::disable('calendario');
GloryFeatures::disable('badgeList');
GloryFeatures::disable('highlight');
GloryFeatures::disable('gsap');
GloryFeatures::disable('gbnSplitContent');
GloryFeatures::disable('gloryLinkCpt');

//Services
GloryFeatures::disable('cssCritico');
GloryFeatures::disable('navegacionAjax');
GloryFeatures::disable('gloryAjax');
GloryFeatures::disable('gloryForm');
GloryFeatures::disable('gloryBusqueda');
GloryFeatures::disable('gloryRealtime');

// Task feature flag
GloryFeatures::disable('task');
GloryFeatures::enable('amazonProduct');

// Renderers
GloryFeatures::disable('logoRenderer');
GloryFeatures::disable('contentRender');
GloryFeatures::disable('termRender');

//Theme options
GloryFeatures::disable('titleTag');
GloryFeatures::enable('postThumbnails');

//Integrations
GloryFeatures::disable('avadaIntegration');

//Admin
GloryFeatures::disable('queryProfiler');
GloryFeatures::disable('performanceProfiler');
GloryFeatures::disable('queryProfilerLogs');

// Habilitar modo React (Islands/Next.js)
if (method_exists(GloryFeatures::class, 'applyReactMode')) {
    GloryFeatures::applyReactMode();
}

// Inicializar servicio de API para Next.js SSR
if (class_exists(NextjsApiService::class)) {
    NextjsApiService::inicializar();
}

// Registrar handlers AJAX específicos del tema de forma segura (puede cargarse más tarde)
// Registrar handlers AJAX específicos del tema de forma segura (puede cargarse más tarde)
if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
    // error_log("control.php: ContentAjaxHandler class exists, registering immediately");
    \App\Handlers\ContentAjaxHandler::register();
} else {
    // error_log("control.php: ContentAjaxHandler class NOT found, hooking to init");
    add_action('init', function () {
        if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
            // error_log("control.php (init): ContentAjaxHandler class exists, registering");
            \App\Handlers\ContentAjaxHandler::register();
        } else {
            // error_log("control.php (init): ContentAjaxHandler class STILL NOT found");
        }
    });
}
