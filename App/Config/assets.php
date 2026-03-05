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
 * Imágenes del tema — alias registrados en control.php (que se carga antes
 * de do_action('glory/register_asset_paths')). Si se registran aquí vía
 * add_action, llegan tarde porque assets.php se carga después del boot de Glory.
 */

