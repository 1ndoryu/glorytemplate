<?php

use Glory\Services\ReactIslands;

function planes()
{
    // Renderiza la pagina de planes completa en React
    // PricingIsland incluye su propio header y footer
    echo ReactIslands::render('PricingIsland');
}
