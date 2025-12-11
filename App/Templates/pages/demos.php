<?php

use Glory\Services\ReactIslands;

function demos()
{
    // Renderiza la pagina de demos completa en React
    // DemosIsland incluye su propio header y footer
    echo ReactIslands::render('DemosIsland');
}
