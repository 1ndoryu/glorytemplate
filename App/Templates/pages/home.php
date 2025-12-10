<?php

use Glory\Services\ReactIslands;

function home()
{
    // Renderiza la pagina de inicio completa en React
    // HomeIsland incluye su propio header y footer
    echo ReactIslands::render('HomeIsland');
}
