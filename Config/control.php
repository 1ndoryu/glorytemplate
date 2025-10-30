<?php

use Glory\Core\GloryFeatures;

//Managers
GloryFeatures::enable('menu');
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::disable('pageManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('taxonomyMetaManager');
GloryFeatures::enable('scheduleManager');
GloryFeatures::enable('defaultContentManager');
GloryFeatures::disable('licenseManager');
GloryFeatures::disable('creditosManager');

//UI Components
GloryFeatures::disable('modales');
GloryFeatures::enable('submenus');
GloryFeatures::enable('pestanas');
GloryFeatures::disable('scheduler');
GloryFeatures::disable('headerAdaptativo');
GloryFeatures::disable('themeToggle');
GloryFeatures::enable('alertas');
GloryFeatures::enable('gestionarPreviews');
GloryFeatures::enable('paginacion');
GloryFeatures::disable('gloryFilters');
GloryFeatures::disable('calendario');
GloryFeatures::disable('badgeList');
GloryFeatures::disable('highlight');
GloryFeatures::disable('gsap');

//Services
GloryFeatures::disable('cssCritico');
GloryFeatures::enable('navegacionAjax');
GloryFeatures::enable('gloryAjax');
GloryFeatures::disable('gloryForm');
GloryFeatures::disable('gloryBusqueda');
GloryFeatures::enable('gloryRealtime');

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
GloryFeatures::enable('avadaIntegration');

// GBN y CPT glory_link (feature flags)
GloryFeatures::disable('gbn');
GloryFeatures::enable('gbnSplitContent');
GloryFeatures::enable('gloryLinkCpt');

//Admin
GloryFeatures::disable('queryProfiler');
GloryFeatures::disable('queryProfilerLogs'); 
GloryFeatures::disable('performanceProfiler');


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
