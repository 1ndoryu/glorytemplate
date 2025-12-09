<?php

use Glory\Core\GloryFeatures;
use Glory\Manager\AssetManager;

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
GloryFeatures::disable('modales');
GloryFeatures::disable('submenus');
GloryFeatures::disable('pestanas');
GloryFeatures::disable('scheduler');
GloryFeatures::disable('headerAdaptativo');
GloryFeatures::enable('themeToggle');
GloryFeatures::disable('alertas');
GloryFeatures::enable('gestionarPreviews');
GloryFeatures::enable('paginacion');
GloryFeatures::disable('gloryFilters');
GloryFeatures::disable('calendario');
GloryFeatures::disable('badgeList');
GloryFeatures::enable('highlight');
GloryFeatures::enable('gsap');
GloryFeatures::disable('gbnSplitContent');
GloryFeatures::disable('gloryLinkCpt');

//Services
GloryFeatures::enable('cssCritico');
GloryFeatures::enable('navegacionAjax');
GloryFeatures::enable('gloryAjax');
GloryFeatures::enable('gloryForm');
GloryFeatures::disable('gloryBusqueda');
GloryFeatures::disable('gloryRealtime');

// Activar CSS asincrono para evitar bloqueo de renderizado
// Todos los CSS se cargaran con media="print" y onload para no bloquear
AssetManager::enableAsyncStyles();

// Task feature flag
GloryFeatures::disable('task');
GloryFeatures::disable('amazonProduct');

// Renderers
GloryFeatures::enable('logoRenderer');
GloryFeatures::disable('contentRender');
GloryFeatures::disable('termRender');

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
// Registrar handlers AJAX específicos del tema de forma segura (puede cargarse más tarde)
if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
    \App\Handlers\ContentAjaxHandler::register();
} else {
    add_action('init', function () {
        if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
            \App\Handlers\ContentAjaxHandler::register();
        }
    });
}
