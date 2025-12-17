<?php

/**
 * Home Static - Landing SIN Page Builder
 * 
 * Esta pagina demuestra que el Page Builder es opcional.
 * Usa el mismo PageLayout pero con contenido estatico.
 * 
 * DIFERENCIAS con home.php:
 * - No carga bloques de post_meta
 * - No pasa saveEndpoint ni restNonce
 * - El contenido es estatico (no editable visualmente)
 * 
 * CUANDO USAR ESTO:
 * - Paginas que no necesitan edicion visual
 * - Contenido que cambia poco o nunca
 * - Layouts muy custom
 */

use Glory\Services\ReactIslands;

function homeStatic()
{
    $siteName = get_bloginfo('name') ?: 'Glory';
    $stripeUrl = get_option('glory_stripe_url', 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c');

    // Solo pasamos configuracion basica - NO bloques
    echo ReactIslands::render('HomeStaticIsland', [
        'siteName' => $siteName,
        'stripeUrl' => $stripeUrl
    ]);
}
