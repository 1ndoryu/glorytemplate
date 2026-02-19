<?php

/**
 * App Pages Configuration
 * 
 * Este archivo define todas las paginas gestionadas del proyecto.
 * 
 * METODOS DISPONIBLES:
 * 
 * 1. reactPage() - RECOMENDADO para paginas React (simplificado)
 *    PageManager::reactPage('mi-pagina', 'MiIsland');
 *    PageManager::reactPage('mi-pagina', 'MiIsland', ['prop' => 'valor']);
 *    PageManager::reactPage('mi-pagina', 'MiIsland', fn($id) => [...]);
 * 
 * 2. define() - Para paginas con templates PHP personalizados
 *    PageManager::define('mi-pagina', 'miFuncion');
 * 
 * 3. registerReactFullPages() - Solo si usas define() para React
 *    PageManager::registerReactFullPages(['mi-pagina']);
 */

use Glory\Manager\PageManager;

PageManager::setDefaultContentMode('code');

/*
 * =====================================================
 * PAGINAS DEL MODULO CAP
 * =====================================================
 * 
 * Solo necesitas:
 * 1. Crear el Island en App/React/islands/cap/
 * 2. Registrar en App/React/appIslands.tsx
 * 3. Agregar aqui con reactPage()
 * 
 * NO necesitas crear archivo PHP en templates/pages/
 */

/* Página de login estilizada */
PageManager::reactPage('cap-login', 'CapLoginIsland', function ($pageId) {
    return [
        'siteUrl' => home_url(),
        'redirectTo' => '/cap-dashboard/',
        'registroUrl' => '/cap-registro/',
    ];
});

/* Página de registro */
PageManager::reactPage('cap-registro', 'CapRegistroIsland', function ($pageId) {
    return [
        'restUrl' => rest_url('cap/v1'),
        'restNonce' => wp_create_nonce('wp_rest'),
        'loginUrl' => '/cap-login/',
    ];
});

/* Dashboard principal */
$dashboardUser = wp_get_current_user();
PageManager::reactPage('cap-dashboard', 'CapDashboardIsland', [
    'user' => [
        'id' => get_current_user_id(),
        'name' => $dashboardUser instanceof WP_User ? $dashboardUser->display_name : '',
        'email' => $dashboardUser instanceof WP_User ? $dashboardUser->user_email : '',
        'isAdmin' => $dashboardUser instanceof WP_User ? in_array('administrator', $dashboardUser->roles, true) : false,
    ],
    'restNonce' => wp_create_nonce('wp_rest'),
    'restUrl' => rest_url('cap/v1'),
    'siteUrl' => home_url(),
]);

/*
 * H.2 Fix: Redirección inteligente en la página de inicio
 * Si el usuario está logueado con rol cap_admin -> dashboard
 * Si no está logueado -> login
 */
add_action('template_redirect', function () {
    /* Proteger dashboard CAP: requiere sesión + rol permitido */
    if (is_page('cap-dashboard')) {
        if (!is_user_logged_in()) {
            wp_redirect(home_url('/cap-login/'));
            exit;
        }

        $dashboardUser = wp_get_current_user();
        $rolesUsuario = $dashboardUser instanceof WP_User ? $dashboardUser->roles : [];
        if (!in_array('cap_admin', $rolesUsuario, true) && !in_array('administrator', $rolesUsuario, true)) {
            wp_redirect(home_url('/cap-login/'));
            exit;
        }

        return;
    }

    /* Solo aplicar en la página de inicio */
    if (!is_front_page()) {
        return;
    }

    if (is_user_logged_in()) {
        $user = wp_get_current_user();
        if (in_array('cap_admin', $user->roles) || in_array('administrator', $user->roles)) {
            wp_redirect(home_url('/cap-dashboard/'));
            exit;
        }
    }

    /* Usuario no logueado o sin rol CAP -> login */
    wp_redirect(home_url('/cap-login/'));
    exit;
});
