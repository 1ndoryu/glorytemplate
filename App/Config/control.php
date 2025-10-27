<?php

use Glory\Core\GloryFeatures;

//Managers
GloryFeatures::enable('menu');
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::disable('gloryLogger');
GloryFeatures::enable('pageManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('taxonomyMetaManager');
GloryFeatures::disable('scheduleManager');
GloryFeatures::enable('defaultContentManager');
GloryFeatures::disable('licenseManager');
GloryFeatures::disable('creditosManager');

//UI Components
GloryFeatures::disable('modales');
GloryFeatures::enable('submenus');
GloryFeatures::disable('pestanas');
GloryFeatures::disable('scheduler');
GloryFeatures::enable('headerAdaptativo');
GloryFeatures::disable('themeToggle');
GloryFeatures::disable('alertas');
GloryFeatures::disable('gestionarPreviews');
GloryFeatures::disable('paginacion');
GloryFeatures::disable('gloryFilters');
GloryFeatures::disable('calendario');
GloryFeatures::disable('badgeList');
GloryFeatures::disable('highlight');
GloryFeatures::enable('gsap');
GloryFeatures::disable('contentActions');

//Services
GloryFeatures::disable('cssCritico');
GloryFeatures::enable('navegacionAjax');
GloryFeatures::enable('gloryAjax');
GloryFeatures::disable('gloryForm');
GloryFeatures::disable('gloryBusqueda');
GloryFeatures::disable('gloryRealtime');

// Task feature flag
GloryFeatures::disable('task');

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
