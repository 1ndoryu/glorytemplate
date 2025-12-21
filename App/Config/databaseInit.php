<?php

use App\Database\Schema;

/**
 * Inicialización de base de datos
 *
 * Se ejecuta en 'init' para asegurar que el usuario esté disponible si fuera necesario,
 * aunque la creación de tablas es global.
 */
add_action('init', function () {
    Schema::init();
});
