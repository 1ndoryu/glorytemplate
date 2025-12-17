<?php

use Glory\Core\GloryFeatures;

/* 
 * Glory React - Configuración de Features
 * Solo features esenciales para el sistema React Islands
 */

/* 
 * Core Managers 
 */

GloryFeatures::enable('assetManager');
GloryFeatures::enable('opcionManagerSync');
GloryFeatures::enable('syncManager');
GloryFeatures::enable('gloryLogger');
GloryFeatures::enable('pageManager');
GloryFeatures::enable('postTypeManager');
GloryFeatures::enable('scheduleManager');
GloryFeatures::enable('defaultContentManager');

/* 
 * Theme Support 
 */
GloryFeatures::enable('postThumbnails');

/* 
 * Managers deshabilitados 
 */
GloryFeatures::disable('menu');

/* 
 * Plugins del proyecto 
 */
GloryFeatures::enable('amazonProduct');

/* 
 * Handlers AJAX del proyecto (App) 
 */
if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
    \App\Handlers\ContentAjaxHandler::register();
} else {
    add_action('init', function () {
        if (class_exists(\App\Handlers\ContentAjaxHandler::class)) {
            \App\Handlers\ContentAjaxHandler::register();
        }
    });
}
