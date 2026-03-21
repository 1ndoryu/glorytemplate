<?php

/**
 * [2003A-12] Endpoints REST para gestión de perfil de usuario.
 * Permite cambiar nombre, email y contraseña desde el frontend CAP.
 *
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Api\Traits\ConCallbackSeguro;

class CapPerfilEndpoints
{
    use ConCallbackSeguro;

    /**
     * Obtiene los datos del perfil del usuario actual.
     */
    public function obtenerPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $user = wp_get_current_user();

        return new \WP_REST_Response([
            'id' => $user->ID,
            'nombre' => $user->display_name,
            'email' => $user->user_email,
            'usuario' => $user->user_login,
        ]);
    }

    /**
     * Actualiza los datos del perfil del usuario actual.
     * Campos permitidos: nombre, email, contraseña.
     */
    public function actualizarPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $user = wp_get_current_user();
        $datos = $request->get_json_params();
        $cambios = [];

        /* Actualizar nombre */
        if (isset($datos['nombre'])) {
            $nombre = sanitize_text_field($datos['nombre']);
            if (empty($nombre)) {
                return new \WP_REST_Response(['error' => 'El nombre no puede estar vacío.'], 400);
            }
            $cambios['display_name'] = $nombre;
        }

        /* Actualizar email */
        if (isset($datos['email'])) {
            $email = sanitize_email($datos['email']);
            if (!is_email($email)) {
                return new \WP_REST_Response(['error' => 'El email no es válido.'], 400);
            }

            /* Verificar que no esté en uso por otro usuario */
            $existente = email_exists($email);
            if ($existente && $existente !== $user->ID) {
                return new \WP_REST_Response(['error' => 'Ese email ya está en uso por otro usuario.'], 400);
            }
            $cambios['user_email'] = $email;
        }

        /* Actualizar contraseña */
        if (!empty($datos['contrasenaActual']) || !empty($datos['contrasenaNueva'])) {
            if (empty($datos['contrasenaActual'])) {
                return new \WP_REST_Response(['error' => 'Debes ingresar tu contraseña actual.'], 400);
            }
            if (empty($datos['contrasenaNueva'])) {
                return new \WP_REST_Response(['error' => 'Debes ingresar la nueva contraseña.'], 400);
            }

            /* Verificar contraseña actual */
            if (!wp_check_password($datos['contrasenaActual'], $user->user_pass, $user->ID)) {
                return new \WP_REST_Response(['error' => 'La contraseña actual es incorrecta.'], 400);
            }

            $nueva = $datos['contrasenaNueva'];
            if (strlen($nueva) < 8) {
                return new \WP_REST_Response(['error' => 'La nueva contraseña debe tener al menos 8 caracteres.'], 400);
            }
            $cambios['user_pass'] = $nueva;
        }

        if (empty($cambios)) {
            return new \WP_REST_Response(['error' => 'No se enviaron cambios.'], 400);
        }

        $cambios['ID'] = $user->ID;
        $resultado = wp_update_user($cambios);

        if (is_wp_error($resultado)) {
            return new \WP_REST_Response([
                'error' => $resultado->get_error_message()
            ], 500);
        }

        /* Si se cambió la contraseña, regenerar cookies para no cerrar sesión */
        if (isset($cambios['user_pass'])) {
            wp_set_auth_cookie($user->ID, true);
        }

        return new \WP_REST_Response(['ok' => true, 'mensaje' => 'Perfil actualizado correctamente.']);
    }
}
