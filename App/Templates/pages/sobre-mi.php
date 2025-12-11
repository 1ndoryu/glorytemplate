<?php

use Glory\Services\ReactIslands;

// Guion bajo para funcion valida en PHP (el slug usa guion)
function sobreMi()
{
    // Renderiza la aplicacion React SPA
    // MainAppIsland contiene el router y detecta la ruta actual
    echo ReactIslands::render('MainAppIsland');
}
