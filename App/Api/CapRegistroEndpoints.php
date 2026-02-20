<?php

/**
 * Endpoints REST API para registro público CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\StripeService;
use Glory\App\Database\Repositories\CapCentrosRepository;
use Glory\App\Database\Repositories\CapConfiguracionRepository;
use Glory\App\Database\Repositories\CapSuscripcionesRepository;
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
        try {
            return $this->procesarRegistro($request);
        } catch (\Throwable $e) {
            error_log("[CAP Registro] ERROR: {$e->getMessage()} en {$e->getFile()}:{$e->getLine()}");
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'Error interno al procesar el registro. Inténtalo de nuevo.'
            ], 500);
        }
    }

    /**
     * Lógica interna de registro, extraída para envolver en try-catch global.
     */
    private function procesarRegistro(\WP_REST_Request $request): \WP_REST_Response
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
            /*
             * 8.17 Fix: wp_create_user hace su propia verificación de duplicados.
             * Si otro registro concurrente creó el usuario entre nuestros checks
             * y este punto, WP devuelve error con código específico.
             */
            $codigoError = $userId->get_error_code();
            if ($codigoError === 'existing_user_login') {
                return new \WP_REST_Response([
                    'error' => true,
                    'message' => 'El nombre de usuario ya está en uso'
                ], 409);
            }
            if ($codigoError === 'existing_user_email') {
                return new \WP_REST_Response([
                    'error' => true,
                    'message' => 'El correo electrónico ya está registrado'
                ], 409);
            }
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear el usuario. Inténtalo de nuevo.'
            ], 500);
        }

        $user = new \WP_User($userId);
        $user->set_role('cap_admin');

        /* Transacción cross-repo: centro + config + suscripción deben ser atómicos */
        global $wpdb;
        $wpdb->query('START TRANSACTION');

        $centroId = CapCentrosRepository::insertar([
            CapCentrosCols::USER_ID => $userId,
            CapCentrosCols::NOMBRE => $nombreCentro,
            CapCentrosCols::EMAIL => $email,
            CapCentrosCols::CREATED_AT => current_time('mysql'),
            CapCentrosCols::UPDATED_AT => current_time('mysql'),
        ]);

        if ($centroId === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear el centro asociado'
            ], 500);
        }

        $configId = CapConfiguracionRepository::insertar([
            CapConfiguracionCols::CENTRO_ID => $centroId,
            CapConfiguracionCols::CREATED_AT => current_time('mysql'),
            CapConfiguracionCols::UPDATED_AT => current_time('mysql'),
        ]);

        if ($configId === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear la configuración inicial'
            ], 500);
        }

        $stripeService = new StripeService();
        $trialHabilitado = $stripeService->esTrialHabilitado();

        /*
         * Fecha de fin de suscripción según configuración de trial:
         * - Trial habilitado: +14 días de acceso gratuito
         * - Trial deshabilitado: fecha actual (debe pagar para acceder)
         */
        $fechaFinSuscripcion = $trialHabilitado
            ? date('Y-m-d', strtotime('+14 days'))
            : current_time('mysql');

        $suscripcionId = CapSuscripcionesRepository::insertar([
            CapSuscripcionesCols::CENTRO_ID => $centroId,
            CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_ACTIVA,
            CapSuscripcionesCols::FECHA_INICIO => current_time('mysql'),
            CapSuscripcionesCols::FECHA_FIN => $fechaFinSuscripcion,
            CapSuscripcionesCols::CREATED_AT => current_time('mysql'),
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ]);

        if ($suscripcionId === false) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response([
                'error' => true,
                'message' => 'No se pudo crear la suscripción inicial'
            ], 500);
        }

        $wpdb->query('COMMIT');

        $asunto = 'Bienvenido a la plataforma CAP';

        /* Mensaje de bienvenida adaptado según si hay trial disponible */
        if ($trialHabilitado) {
            $mensaje = sprintf(
                "Hola %s,\n\nTu cuenta ha sido creada exitosamente.\n\nCentro: %s\nUsuario: %s\n\nTienes 14 días de prueba gratuita para explorar todas las funcionalidades.\n\n¡Gracias por registrarte!",
                $nombreUsuario,
                $nombreCentro,
                $nombreUsuario
            );
        } else {
            $mensaje = sprintf(
                "Hola %s,\n\nTu cuenta ha sido creada exitosamente.\n\nCentro: %s\nUsuario: %s\n\nPara acceder a todas las funcionalidades, suscríbete desde tu panel de control.\n\n¡Gracias por registrarte!",
                $nombreUsuario,
                $nombreCentro,
                $nombreUsuario
            );
        }

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
            'diasTrial' => $trialHabilitado ? 14 : 0,
            'trialHabilitado' => $trialHabilitado,
        ];

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
