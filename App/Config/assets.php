<?php

use Glory\Manager\AssetManager;

/**
 * Registro de Assets Específicos del Tema
 *
 * Este archivo se encarga de definir todos los scripts (JS) y estilos (CSS)
 * que pertenecen exclusivamente al tema activo, separando las responsabilidades
 * del framework Glory.
 */

/*
 * CSS principal — init.css importa toda la cadena:
 * variables -> base -> header -> footer -> componentes -> home -> paginas -> galeria-calendario
 */
AssetManager::define('style', 'cresta-styles', '/App/Assets/css/init.css');

/*
 * Imágenes del tema — alias para que PostSyncHandler pueda importar
 * imágenes destacadas desde defaultContent vía `imagenDestacadaAsset`.
 */
add_action('glory/register_asset_paths', function (): void {
    \Glory\Utility\AssetResolver::registerAssetPath('cresta', 'App/Assets/images');
    \Glory\Utility\AssetResolver::registerAssetPath('campers', 'App/Assets/images/campers');
});

