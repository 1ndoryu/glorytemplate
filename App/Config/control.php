<?php

use Glory\Core\GloryFeatures;

/* 
 * Cresta Campers - Configuración de Features
 * Alquiler de furgonetas camper con sistema de reservas + Stripe
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
GloryFeatures::enable('menu');

/* 
 * Theme Support 
 */
GloryFeatures::enable('postThumbnails');

/* 
 * Frontend: CSS propio (Tailwind deshabilitado)
 */
GloryFeatures::disable('tailwind');
GloryFeatures::disable('shadcnUI');

/* 
 * Servicios del proyecto 
 */
GloryFeatures::enable('stripe');
GloryFeatures::enable('gloryForm');

/* 
 * Deshabilitados 
 */
GloryFeatures::disable('amazonProduct');
GloryFeatures::disable('queryProfiler');

/*
 * Asset paths del proyecto — registra alias para AssetResolver.
 */
add_action('glory/register_asset_paths', function () {
    \Glory\Utility\AssetResolver::registerAssetPath('vehiculos', 'App/Assets/vehiculos');
    \Glory\Utility\AssetResolver::registerAssetPath('tema', 'App/Assets/images');
});

