<?php

/**
 * Endpoints REST API para autenticación del módulo CAP.
 *
 * [2003A-7+2003A-9] Login via REST API en vez de form POST a wp-login.php.
 * Esto permite manejar errores de credenciales en el frontend sin salir
 * de la página de login personalizada.
 *
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Api\Traits\ConCallbackSeguro;

class CapAuthEndpoints
{
    use ConCallbackSeguro;

    /**
     * POST /cap/v1/auth/login
     * Autentica al usuario con wp_signon() y retorna JSON.
     * Las cookies de sesión se setean server-side.
     */
    public function login(\WP_REST_Request $request): \WP_REST_Response
    {
        $usuario = sanitize_text_field($request->get_param('usuario') ?? '');
        $password = $request->get_param('password') ?? '';
        $recordar = (bool) $request->get_param('recordar');

        if (empty($usuario) || empty($password)) {
            return new \WP_REST_Response(
                ['ok' => false, 'error' => 'Usuario y contraseña son obligatorios.'],
                400
            );
        }

        $credenciales = [
            'user_login'    => $usuario,
            'user_password' => $password,
            'remember'      => $recordar,
        ];

        $resultado = wp_signon($credenciales, is_ssl());

        if (is_wp_error($resultado)) {
            $codigoError = $resultado->get_error_code();
            $mensaje = $this->traducirErrorLogin($codigoError);

            return new \WP_REST_Response(
                ['ok' => false, 'error' => $mensaje],
                401
            );
        }

        /* Login exitoso: wp_signon ya setea las cookies */
        wp_set_current_user($resultado->ID);

        $tieneAcceso = in_array('cap_admin', $resultado->roles, true)
            || in_array('administrator', $resultado->roles, true);

        if (!$tieneAcceso) {
            wp_logout();
            return new \WP_REST_Response(
                ['ok' => false, 'error' => 'Tu cuenta no tiene acceso al sistema CAP.'],
                403
            );
        }

        return new \WP_REST_Response([
            'ok' => true,
            'user' => [
                'id'    => $resultado->ID,
                'name'  => $resultado->display_name,
                'email' => $resultado->user_email,
            ],
        ]);
    }

    /**
     * Traduce códigos de error de wp_signon a mensajes amigables.
     */
    private function traducirErrorLogin(string $codigo): string
    {
        $mensajes = [
            'invalid_username'  => 'El usuario no existe. Verifica tus datos.',
            'invalid_email'     => 'El correo electrónico no está registrado.',
            'incorrect_password'=> 'La contraseña es incorrecta.',
            'empty_username'    => 'Ingresa tu nombre de usuario.',
            'empty_password'    => 'Ingresa tu contraseña.',
        ];

        return $mensajes[$codigo] ?? 'Error al iniciar sesión. Intenta de nuevo.';
    }
}
