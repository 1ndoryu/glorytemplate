<?php 

use Glory\Core\GloryFeatures;

//Managers
GloryFeatures::disable('menu');
GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
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
GloryFeatures::disable('headerAdaptativo');
GloryFeatures::enable('alertas');
GloryFeatures::enable('gestionarPreviews');
GloryFeatures::enable('paginacion');
GloryFeatures::enable('gloryFilters');
// Activar feature para BadgeList
GloryFeatures::disable('badgeList');
// Feature para control de highlight y GSAP
GloryFeatures::disable('highlight');
GloryFeatures::disable('gsap');


//Services
GloryFeatures::disable('cssCritico');
GloryFeatures::enable('navegacionAjax');
GloryFeatures::enable('gloryAjax');
GloryFeatures::enable('gloryForm');
GloryFeatures::disable('gloryBusqueda');
GloryFeatures::enable('gloryRealtime');

// Renderers
GloryFeatures::disable('logoRenderer');
GloryFeatures::disable('contentRender');
GloryFeatures::disable('termRender');

//Theme options
GloryFeatures::enable('titleTag');
GloryFeatures::enable('postThumbnails');

