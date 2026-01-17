<?php

/**
 * Inicialización de la API REST del módulo CAP
 * 
 * Este archivo se carga automáticamente por functions.php
 * y garantiza que los endpoints se registren correctamente.
 * 
 * @package Glory\App
 */

/* Cargar y registrar endpoints CAP */
add_action('rest_api_init', function () {
    if (!class_exists('Glory\App\Api\CapEndpoints')) {
        return;
    }

    $endpoints = new \Glory\App\Api\CapEndpoints();
    $endpoints->registrarRutas();
});
