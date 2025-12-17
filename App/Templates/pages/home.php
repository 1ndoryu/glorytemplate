<?php

/**
 * Home Page - Glory SaaS Landing
 * 
 * Esta pagina usa el sistema SSG de Glory:
 * - HTML pre-renderizado para SEO (generado en build)
 * - React hidrata para interactividad y animaciones
 * - PHP inyecta configuracion dinamica
 */

use Glory\Services\ReactIslands;

function home()
{
    // Configuracion de la landing page
    // Estos valores pueden venir de WordPress options o hardcodeados
    $siteName = get_bloginfo('name') ?: 'Glory';

    // URL de Stripe para pagos (puede configurarse desde WP Admin)
    $stripeUrl = get_option('glory_stripe_url', 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c');

    // Renderizar la isla React con SSG
    // - Si existe dist/ssg/HomeIsland.html, se usa como base (SEO)
    // - Los props frescos se pasan via data-props
    // - React hidratara el componente con los datos actuales
    echo ReactIslands::render('HomeIsland', [
        'siteName' => $siteName,
        'stripeUrl' => $stripeUrl
    ]);
}
