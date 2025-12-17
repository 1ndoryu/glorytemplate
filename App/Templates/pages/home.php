<?php

/**
 * Home Page - Glory SaaS Landing
 * 
 * Esta pagina usa el sistema Page Builder de Glory:
 * - Los bloques se cargan desde post_meta (o defaults si no hay)
 * - Los admins pueden editar visualmente la pagina
 * - PHP inyecta configuracion dinamica
 */

use Glory\Services\ReactIslands;

function home()
{
    $pageId = get_the_ID() ?: 0;

    // Configuracion de la landing page
    $siteName = get_bloginfo('name') ?: 'Glory';
    $stripeUrl = get_option('glory_stripe_url', 'https://buy.stripe.com/8x26oG58XchA56va31cAo0c');

    // Cargar bloques guardados (si existen)
    $blocksJson = get_post_meta($pageId, '_glory_page_blocks', true);
    $blocks = $blocksJson ? json_decode($blocksJson, true) : null;

    // Verificar si el usuario actual puede editar
    $isAdmin = current_user_can('edit_pages');

    // Endpoint para guardar cambios
    $saveEndpoint = $isAdmin ? rest_url('glory/v1/page-blocks/' . $pageId) : null;
    $restNonce = $isAdmin ? wp_create_nonce('wp_rest') : null;

    // Renderizar la isla React
    echo ReactIslands::render('HomeIsland', [
        'siteName' => $siteName,
        'stripeUrl' => $stripeUrl,
        'pageId' => $pageId,
        'blocks' => $blocks,
        'isAdmin' => $isAdmin,
        'saveEndpoint' => $saveEndpoint,
        'restNonce' => $restNonce
    ]);
}
