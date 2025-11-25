<?php

function logicValidateRequest(): int
{
    $nonce = $_POST['nonce'] ?? '';
    if (!wp_verify_nonce((string) $nonce, 'logic_actions')) {
        wp_send_json_error(['mensaje' => 'Solicitud no autorizada.']);
    }

    if (!current_user_can('edit_posts')) {
        wp_send_json_error(['mensaje' => 'No tienes permisos para Logic.']);
    }

    return get_current_user_id();
}





