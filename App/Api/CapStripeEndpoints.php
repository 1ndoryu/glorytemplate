<?php

/**
 * Endpoints REST API para operaciones de Stripe CAP.
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Services\CapService;
use Glory\App\Services\StripeService;
use Glory\App\Database\Repositories\CapSuscripcionesRepository;
use Glory\App\Api\Traits\ConCallbackSeguro;

class CapStripeEndpoints
{
    use ConCallbackSeguro;

    public function obtenerConfigStripe(\WP_REST_Request $request): \WP_REST_Response
    {
        $stripeService = new StripeService();
        return new \WP_REST_Response($stripeService->obtenerEstadoConfiguracion());
    }

    public function guardarConfigStripe(\WP_REST_Request $request): \WP_REST_Response
    {
        $raw = $request->get_json_params();
        /* Filtrar solo los campos esperados por StripeService */
        $camposPermitidos = ['testPublishableKey', 'testSecretKey', 'livePublishableKey', 'liveSecretKey', 'webhookSecret', 'priceId', 'modoTest'];
        $datos = array_intersect_key($raw, array_flip($camposPermitidos));
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

        /* Los URLs se validan contra open redirect dentro de StripeService */
        $urlExito = isset($datos['urlExito']) ? sanitize_text_field($datos['urlExito']) : home_url('/cap-dashboard/?pago=exitoso');
        $urlCancelado = isset($datos['urlCancelado']) ? sanitize_text_field($datos['urlCancelado']) : home_url('/cap-dashboard/?pago=cancelado');

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

        $customerId = CapSuscripcionesRepository::buscarCustomerIdPorCentro($centroId);

        if (!$customerId) {
            return new \WP_REST_Response([
                'error' => 'No tienes una suscripción activa con Stripe'
            ], 404);
        }

        $datos = $request->get_json_params();
        /* La URL se valida contra open redirect dentro de StripeService */
        $urlRetorno = isset($datos['urlRetorno']) ? sanitize_text_field($datos['urlRetorno']) : home_url('/cap-dashboard/');

        $stripeService = new StripeService();
        $url = $stripeService->getPortalUrl($customerId, $urlRetorno);

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
