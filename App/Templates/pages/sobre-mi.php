<?php

use Glory\Services\ReactIslands;

// Guion bajo para funcion valida en PHP (el slug usa guion)
function sobreMi()
{
    // Renderiza la pagina "sobre mi" completa en React
    // AboutIsland incluye su propio header y footer
    echo ReactIslands::render('AboutIsland');
}
