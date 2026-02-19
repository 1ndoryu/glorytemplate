<?php

/**
 * Endpoints REST API para operaciones de Stripe CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Services\StripeService;

class CapStripeEndpoints
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
                error_log('[CAP REST Stripe] Error en ' . $metodo . ': ' . $error->getMessage());
                return new \WP_REST_Response(['error' => 'Error interno del servidor'], 500);
            }
        };
    }

    public function verificarPermisos(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        return in_array('cap_admin', $user->roles, true) || in_array('administrator', $user->roles, true);
    }

    public function verificarPermisosAdmin(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        return in_array('administrator', $user->roles, true);
    }

    public function obtenerConfigStripe(\WP_REST_Request $request): \WP_REST_Response
    {
        $stripeService = new StripeService();
        return new \WP_REST_Response($stripeService->obtenerEstadoConfiguracion());
    }

    public function guardarConfigStripe(\WP_REST_Request $request): \WP_REST_Response
    {
        $datos = $request->get_json_params();
        $stripeService = new StripeService();
        $resultado = $stripeService->guardarConfiguracion($datos);

        $statusCode = $resultado['exito'] ? 200 : 400;
        return new \WP_REST_Response($resultado, $statusCode);
    }

    public function crearStripeCheckout(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        $datos = $request->get_json_params();
        $user = wp_get_current_user();

        $urlExito = $datos['urlExito'] ?? home_url('/cap-dashboard/?pago=exitoso');
        $urlCancelado = $datos['urlCancelado'] ?? home_url('/cap-dashboard/?pago=cancelado');

        $stripeService = new StripeService();

        if (!$stripeService->estaConfigurado()) {
            return new \WP_REST_Response([
                'error' => 'Stripe no está configurado. Contacta con el administrador.'
            ], 503);
        }

        $resultado = $stripeService->crearCheckoutSession(
            $centroId,
            $user->user_email,
            $urlExito,
            $urlCancelado
        );

        if (isset($resultado['error'])) {
            return new \WP_REST_Response(['error' => $resultado['error']], 400);
        }

        return new \WP_REST_Response($resultado);
    }

    public function obtenerStripePortal(\WP_REST_Request $request): \WP_REST_Response
    {
        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        if (!$centroId) {
            return new \WP_REST_Response(['error' => 'Centro no encontrado'], 404);
        }

        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_suscripciones';
        $suscripcion = $wpdb->get_row($wpdb->prepare(
            "SELECT stripe_customer_id FROM {$tabla} WHERE centro_id = %d AND stripe_customer_id IS NOT NULL ORDER BY id DESC LIMIT 1",
            $centroId
        ), 'ARRAY_A');

        if (!$suscripcion || empty($suscripcion['stripe_customer_id'])) {
            return new \WP_REST_Response([
                'error' => 'No tienes una suscripción activa con Stripe'
            ], 404);
        }

        $datos = $request->get_json_params();
        $urlRetorno = $datos['urlRetorno'] ?? home_url('/cap-dashboard/');

        $stripeService = new StripeService();
        $url = $stripeService->getPortalUrl($suscripcion['stripe_customer_id'], $urlRetorno);

        if (!$url) {
            return new \WP_REST_Response(['error' => 'Error al generar enlace del portal'], 500);
        }

        return new \WP_REST_Response(['url' => $url]);
    }

    public function procesarStripeWebhook(\WP_REST_Request $request): \WP_REST_Response
    {
        $payload = $request->get_body();
        $sigHeader = $request->get_header('Stripe-Signature');

        if (empty($sigHeader)) {
            return new \WP_REST_Response(['error' => 'Falta header de firma'], 400);
        }

        $stripeService = new StripeService();
        $resultado = $stripeService->procesarWebhook($payload, $sigHeader);

        $statusCode = $resultado['status'] ?? ($resultado['exito'] ? 200 : 400);
        unset($resultado['status']);

        return new \WP_REST_Response($resultado, $statusCode);
    }
}
