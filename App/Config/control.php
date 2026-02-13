<?php

use Glory\Core\GloryFeatures;

/*
 * Cosmo Revenue - Features del tema
 * Adaptado de App1 para arquitectura Glory React
 */

/* Core Managers */
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::enable('pageManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('scheduleManager');
GloryFeatures::enable('defaultContentManager');

/* Theme Support */
GloryFeatures::enable('postThumbnails');
GloryFeatures::enable('titleTag');

/* Navegacion */
GloryFeatures::enable('menu');
GloryFeatures::enable('navegacionAjax');

/* UI Components */
GloryFeatures::enable('gsap');
GloryFeatures::enable('highlight');
GloryFeatures::enable('paginacion');
GloryFeatures::enable('themeToggle');
GloryFeatures::enable('gestionarPreviews');
GloryFeatures::enable('logoRenderer');

/* Formulario de contacto */
GloryFeatures::enable('gloryForm');
GloryFeatures::enable('gloryAjax');

/* Deshabilitados */
GloryFeatures::disable('modales');
GloryFeatures::disable('submenus');
GloryFeatures::disable('pestanas');
GloryFeatures::disable('scheduler');
GloryFeatures::disable('headerAdaptativo');
GloryFeatures::disable('alertas');
GloryFeatures::disable('gloryFilters');
GloryFeatures::disable('calendario');
GloryFeatures::disable('badgeList');
GloryFeatures::disable('gbnSplitContent');
GloryFeatures::disable('gloryLinkCpt');
GloryFeatures::disable('cssCritico');
GloryFeatures::disable('gloryBusqueda');
GloryFeatures::disable('gloryRealtime');
GloryFeatures::disable('contentRender');
GloryFeatures::disable('termRender');
GloryFeatures::disable('avadaIntegration');
GloryFeatures::disable('queryProfiler');
GloryFeatures::disable('performanceProfiler');
GloryFeatures::disable('queryProfilerLogs');
GloryFeatures::disable('amazonProduct');
GloryFeatures::disable('task');
GloryFeatures::disable('tailwind');
GloryFeatures::disable('shadcnUI');

/* Asset paths del proyecto */
add_action('glory/register_asset_paths', function () {
    \Glory\Utility\AssetResolver::registerAssetPath('equipo', 'App/Assets/equipo');
    \Glory\Utility\AssetResolver::registerAssetPath('tema', 'App/Assets/images');
});

