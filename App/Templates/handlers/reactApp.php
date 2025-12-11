<?php

/**
 * Handler para renderizar la aplicacion React SPA.
 * 
 * Todas las paginas que usan React comparten este mismo handler.
 * El router de React (AppRouter) se encarga de mostrar el componente
 * correcto segun la URL actual.
 * 
 * Esto permite:
 * - Centralizar la logica de renderizado React
 * - Agregar nuevas paginas React sin crear nuevos archivos PHP
 * - Mantener una unica fuente de verdad (el router de React)
 */

use Glory\Services\ReactIslands;

function renderReactApp(): void
{
    // MainAppIsland contiene el router SPA que detecta la ruta actual
    // y renderiza el componente correspondiente (HomeIsland, BlogIsland, etc.)
    echo ReactIslands::render('MainAppIsland');
}
