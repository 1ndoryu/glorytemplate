<?php

use Glory\Services\ReactIslands;

function servicios()
{
    // Renderiza la pagina de servicios completa en React
    // ServicesIsland incluye su propio header y footer
    echo ReactIslands::render('ServicesIsland');
}
