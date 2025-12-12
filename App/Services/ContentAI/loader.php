<?php

/**
 * ContentAI Loader
 * 
 * Archivo de inicializacion del sistema de IA para generacion de contenido.
 * Carga las clases necesarias y registra los endpoints REST.
 * 
 * @package Glory\Services\ContentAI
 */

namespace App\Services\ContentAI;

// Cargar clases del modulo
require_once __DIR__ . '/GeminiClient.php';
require_once __DIR__ . '/AIConfigManager.php';
require_once __DIR__ . '/DraftManager.php';
require_once __DIR__ . '/ContentGenerator.php';
require_once __DIR__ . '/AIRestApi.php';

/**
 * Inicializa el modulo de ContentAI
 */
function init(): void
{
    // Registrar endpoints REST
    AIRestApi::register();

    // Exponer nonce para REST API en el frontend (solo para admins)
    add_action('wp_enqueue_scripts', function () {
        if (current_user_can('manage_options')) {
            wp_localize_script('glory-react', 'wpApiSettings', [
                'root' => esc_url_raw(rest_url()),
                'nonce' => wp_create_nonce('wp_rest')
            ]);
        }
    }, 20);

    // Tambien agregar en el head por si el script no esta listo
    add_action('wp_head', function () {
        if (current_user_can('manage_options')) {
            echo '<script>window.wpApiSettings = window.wpApiSettings || { root: "' . esc_url_raw(rest_url()) . '", nonce: "' . wp_create_nonce('wp_rest') . '" };</script>';
        }
    }, 5);

    // Agregar pagina de menu en admin (opcional, el panel principal es React)
    add_action('admin_menu', function () {
        add_submenu_page(
            'tools.php',
            'Glory AI Content',
            'AI Content',
            'manage_options',
            'glory-ai-content',
            function () {
                echo '<div class="wrap">';
                echo '<h1>Glory AI Content Generator</h1>';
                echo '<p>El panel principal de generacion de contenido esta disponible en el frontend para administradores.</p>';
                echo '<p><a href="' . home_url('/panel-ia') . '" class="button button-primary">Abrir Panel de IA</a></p>';
                echo '</div>';
            }
        );
    });
}

// Inicializar si estamos en WordPress
if (function_exists('add_action')) {
    init();
}
