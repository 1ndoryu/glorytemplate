<?php

/**
 * Endpoints REST API para registro público CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\StripeService;
use App\Config\Schema\_generated\CapCentrosCols;
use App\Config\Schema\_generated\CapConfiguracionCols;
use App\Config\Schema\_generated\CapSuscripcionesCols;
use App\Config\Schema\_generated\CapSuscripcionesEnums;
use Glory\App\Api\Traits\ConCallbackSeguro;

class CapRegistroEndpoints
{
    use ConCallbackSeguro;

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
        $tablaCentros = $wpdb->prefix . CapCentrosCols::TABLA;
        $tablaConfig = $wpdb->prefix . CapConfiguracionCols::TABLA;
        $tablaSuscripciones = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        /* Transacción: centro + config + suscripción deben ser atómicos */
        $wpdb->query('START TRANSACTION');

        $centroInsertado = $wpdb->insert($tablaCentros, [
            CapCentrosCols::USER_ID => $userId,
            CapCentrosCols::NOMBRE => $nombreCentro,
            CapCentrosCols::EMAIL => $email,
            CapCentrosCols::CREATED_AT => current_time('mysql'),
            CapCentrosCols::UPDATED_AT => current_time('mysql'),
        ]);

        if ($centroInsertado === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear el centro asociado'
            ], 500);
        }

        $centroId = (int) $wpdb->insert_id;

        $configInsertada = $wpdb->insert($tablaConfig, [
            CapConfiguracionCols::CENTRO_ID => $centroId,
            CapConfiguracionCols::CREATED_AT => current_time('mysql'),
            CapConfiguracionCols::UPDATED_AT => current_time('mysql'),
        ]);

        if ($configInsertada === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear la configuración inicial'
            ], 500);
        }

        $suscripcionInsertada = $wpdb->insert($tablaSuscripciones, [
            CapSuscripcionesCols::CENTRO_ID => $centroId,
            CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_ACTIVA,
            CapSuscripcionesCols::FECHA_INICIO => current_time('mysql'),
            CapSuscripcionesCols::FECHA_FIN => date('Y-m-d', strtotime('+14 days')),
            CapSuscripcionesCols::CREATED_AT => current_time('mysql'),
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ]);

        if ($suscripcionInsertada === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear la suscripción inicial'
            ], 500);
        }

        $wpdb->query('COMMIT');

        $asunto = 'Bienvenido a la plataforma CAP';
        $mensaje = sprintf(
            "Hola %s,\n\nTu cuenta ha sido creada exitosamente.\n\nCentro: %s\nUsuario: %s\n\nTienes 14 días de prueba gratuita para explorar todas las funcionalidades.\n\n¡Gracias por registrarte!",
            $nombreUsuario,
            $nombreCentro,
            $nombreUsuario
        );

        /* Verificar retorno de wp_mail para diagnosticar problemas de envío */
        $mailEnviado = wp_mail($email, $asunto, $mensaje);
        if (!$mailEnviado) {
            error_log("[CAP Registro] WARN: Fallo al enviar email de bienvenida a {$email}. El registro fue exitoso igualmente.");
        }

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
