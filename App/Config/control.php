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

// GloryFeatures::enable('amazonProduct');
GloryFeatures::disable('amazonProduct');
GloryFeatures::disable('queryProfiler');

/* 
 * Frontend Opt-in: Tailwind CSS y shadcn/ui
 * Activar/desactivar via feature flags.
 * Tailwind v4 ya esta integrado en Vite; este flag controla si PHP lo referencia.
 * shadcn/ui requiere que Tailwind este activo.
 */
GloryFeatures::disable('tailwind');
GloryFeatures::disable('shadcnUI');

/*
 * Asset paths del proyecto — registra alias para AssetResolver.
 * Esto evita que Glory hardcodee rutas de App/.
 */
add_action('glory/register_asset_paths', function () {
    \Glory\Utility\AssetResolver::registerAssetPath('equipo', 'App/Assets/equipo');
    \Glory\Utility\AssetResolver::registerAssetPath('tema', 'App/Assets/images');
});

