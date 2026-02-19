<?php

/**
 * Endpoints REST API para registro público CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\StripeService;

class CapRegistroEndpoints
{
    public function callbackSeguro(string $metodo): callable
    {
        return function (\WP_REST_Request $request) use ($metodo): \WP_REST_Response {
            try {
                $respuesta = $this->{$metodo}($request);
                if ($respuesta instanceof \WP_REST_Response) {
                    return $respuesta;
                }

                return new \WP_REST_Response($respuesta);
            } catch (\Throwable $error) {
                error_log('[CAP REST Registro] Error en ' . $metodo . ': ' . $error->getMessage());
                return new \WP_REST_Response(['error' => 'Error interno del servidor'], 500);
            }
        };
    }

    private function excedioLimiteRegistro(string $ip): bool
    {
        $limiteIntentos = 5;
        $ventanaSegundos = 30 * 60;
        $hashIp = md5($ip);
        $transientKey = 'cap_registro_intentos_' . $hashIp;
        $intentos = (int) get_transient($transientKey);

        if ($intentos >= $limiteIntentos) {
            return true;
        }

        set_transient($transientKey, $intentos + 1, $ventanaSegundos);
        return false;
    }

    private function passwordEsValida(string $password): bool
    {
        if (strlen($password) < 8) {
            return false;
        }

        return preg_match('/[A-Z]/', $password)
            && preg_match('/[a-z]/', $password)
            && preg_match('/\d/', $password);
    }

    public function registrarUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        $datos = $request->get_json_params();
        $ip = sanitize_text_field((string) ($_SERVER['REMOTE_ADDR'] ?? 'desconocida'));

        if ($this->excedioLimiteRegistro($ip)) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'Demasiados intentos de registro. Intenta nuevamente en unos minutos.'
            ], 429);
        }

        $requeridos = ['nombreCentro', 'nombreUsuario', 'email', 'password'];
        foreach ($requeridos as $campo) {
            if (empty($datos[$campo])) {
                return new \WP_REST_Response([
                    'error' => true,
                    'message' => "El campo {$campo} es obligatorio"
                ], 400);
            }
        }

        $nombreUsuario = sanitize_user($datos['nombreUsuario']);
        $email = sanitize_email($datos['email']);
        $password = $datos['password'];
        $nombreCentro = sanitize_text_field($datos['nombreCentro']);

        if (username_exists($nombreUsuario)) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'El nombre de usuario ya está en uso'
            ], 409);
        }

        if (email_exists($email)) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'El correo electrónico ya está registrado'
            ], 409);
        }

        if (!$this->passwordEsValida($password)) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'La contraseña debe tener mínimo 8 caracteres, incluyendo mayúscula, minúscula y número'
            ], 400);
        }

        $userId = wp_create_user($nombreUsuario, $password, $email);

        if (is_wp_error($userId)) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => $userId->get_error_message()
            ], 500);
        }

        $user = new \WP_User($userId);
        $user->set_role('cap_admin');

        global $wpdb;
        $tablaCentros = $wpdb->prefix . 'cap_centros';
        $tablaConfig = $wpdb->prefix . 'cap_configuracion';
        $tablaSuscripciones = $wpdb->prefix . 'cap_suscripciones';

        $centroInsertado = $wpdb->insert($tablaCentros, [
            'user_id' => $userId,
            'nombre' => $nombreCentro,
            'email' => $email,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);

        if ($centroInsertado === false) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear el centro asociado'
            ], 500);
        }

        $centroId = (int) $wpdb->insert_id;

        $configInsertada = $wpdb->insert($tablaConfig, [
            'centro_id' => $centroId,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);

        if ($configInsertada === false) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear la configuración inicial'
            ], 500);
        }

        $suscripcionInsertada = $wpdb->insert($tablaSuscripciones, [
            'centro_id' => $centroId,
            'estado' => 'activa',
            'fecha_inicio' => current_time('mysql'),
            'fecha_fin' => date('Y-m-d', strtotime('+14 days')),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);

        if ($suscripcionInsertada === false) {
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear la suscripción inicial'
            ], 500);
        }

        $asunto = 'Bienvenido a la plataforma CAP';
        $mensaje = sprintf(
            "Hola %s,\n\nTu cuenta ha sido creada exitosamente.\n\nCentro: %s\nUsuario: %s\n\nTienes 14 días de prueba gratuita para explorar todas las funcionalidades.\n\n¡Gracias por registrarte!",
            $nombreUsuario,
            $nombreCentro,
            $nombreUsuario
        );
        wp_mail($email, $asunto, $mensaje);

        $respuesta = [
            'exito' => true,
            'message' => 'Usuario registrado correctamente',
            'userId' => $userId,
            'centroId' => $centroId,
            'diasTrial' => 14,
        ];

        $stripeService = new StripeService();
        if ($stripeService->estaConfigurado()) {
            $urlExito = home_url('/cap-dashboard/?pago=exitoso&registro=nuevo');
            $urlCancelado = home_url('/cap-login/?registro=pendiente');

            $checkoutResult = $stripeService->crearCheckoutSession(
                $centroId,
                $email,
                $urlExito,
                $urlCancelado
            );

            if (!isset($checkoutResult['error']) && isset($checkoutResult['url'])) {
                $respuesta['stripeCheckoutUrl'] = $checkoutResult['url'];
                $respuesta['stripeConfigurado'] = true;
            }
        } else {
            $respuesta['stripeConfigurado'] = false;
        }

        return new \WP_REST_Response($respuesta, 201);
    }
}
