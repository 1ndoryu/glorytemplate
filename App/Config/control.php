<?php

use Glory\Core\GloryFeatures;

//Managers
GloryFeatures::enable('menu');
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::enable('gbn');
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
    \App\Handlers\ContentAjaxHandler::register();
} else {
    add_action('init', function() {
        if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
            \App\Handlers\ContentAjaxHandler::register();
        }
    });
}
