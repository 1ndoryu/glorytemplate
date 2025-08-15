<?php

use Glory\Manager\OpcionManager;
use Glory\Core\OpcionRepository;

function gloryApiGenerarTokenCallback()
{
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['mensaje' => 'No autorizado.'], 403);
    }

    check_ajax_referer('glory_api_config_ajax', 'nonce');

    $nuevoToken = wp_generate_password(48, true, false);
    OpcionRepository::save('glory_api_token', $nuevoToken);
    OpcionManager::clearCache();

    wp_send_json_success(['token' => $nuevoToken]);
}

function gloryApiGuardarConfigCallback()
{
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['mensaje' => 'No autorizado.'], 403);
    }

    check_ajax_referer('glory_api_config_ajax', 'nonce');

    $habilitada = isset($_POST['habilitada']) && $_POST['habilitada'] === '1';
    $token = isset($_POST['token']) ? sanitize_text_field((string) $_POST['token']) : '';

    OpcionRepository::save('glory_api_habilitada', $habilitada);
    OpcionRepository::save('glory_api_token', $token);
    OpcionManager::clearCache();

    wp_send_json_success(['habilitada' => $habilitada, 'token' => $token]);
}


