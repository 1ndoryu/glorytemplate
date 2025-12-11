<?php

use Glory\Services\ReactIslands;

function planes()
{
    // Renderiza la aplicacion React SPA
    // MainAppIsland contiene el router y detecta la ruta actual
    echo ReactIslands::render('MainAppIsland');
}
