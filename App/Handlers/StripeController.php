<?php

/**
 * StripeController
 *
 * Endpoints REST para integración con Stripe:
 * - POST /glory/v1/stripe/checkout   → Crear sesión de Checkout
 * - POST /glory/v1/stripe/portal     → Crear sesión del portal de facturación
 * - POST /glory/v1/stripe/webhook    → Recibir webhooks de Stripe
 *
 * @package App\Handlers
 */

namespace App\Handlers;

use Glory\Services\Stripe\StripeConfig;
use Glory\Services\Stripe\StripeCheckoutService;
use Glory\Services\Stripe\StripeApiClient;
use Glory\Core\GloryLogger;
use WP_REST_Request;
use WP_REST_Response;

class StripeController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        /* Crear sesión de checkout (requiere autenticación) */
        register_rest_route(self::API_NAMESPACE, '/stripe/checkout', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crearSesionCheckout'],
            'permission_callback' => [self::class, 'verificarAutenticacion'],
            'args'                => [
                'planId' => [
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'modo' => [
                    'required'          => false,
                    'type'              => 'string',
                    'default'           => 'payment',
                    'enum'              => ['payment', 'subscription'],
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        /* Portal de facturación (requiere autenticación) */
        register_rest_route(self::API_NAMESPACE, '/stripe/portal', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crearSesionPortal'],
            'permission_callback' => [self::class, 'verificarAutenticacion'],
        ]);

        /* Webhook de Stripe (público, verificado por firma) */
        register_rest_route(self::API_NAMESPACE, '/stripe/webhook', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'manejarWebhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Verifica que el usuario esté autenticado
     */
    public static function verificarAutenticacion(): bool
    {
        return is_user_logged_in();
    }

    /**
     * POST /stripe/checkout
     * Crea una sesión de Stripe Checkout y devuelve la URL de redirección.
     */
    public static function crearSesionCheckout(WP_REST_Request $request): WP_REST_Response
    {
        if (!StripeConfig::isConfigured()) {
            return new WP_REST_Response(['error' => 'Stripe no configurado'], 503);
        }

        $planId = $request->get_param('planId');
        $modo = $request->get_param('modo') ?: 'payment';
        $usuario = wp_get_current_user();

        /*
         * Buscar el priceId de Stripe asociado al plan.
         * Los planes deben tener un priceId configurado en wp_options
         * con la clave: glory_stripe_price_{planId}
         * Esto permite configurar los precios desde el panel de WP sin tocar código.
         */
        $priceId = get_option("glory_stripe_price_{$planId}", '');

        if (empty($priceId)) {
            GloryLogger::warning("Stripe: Plan '{$planId}' sin priceId configurado");
            return new WP_REST_Response([
                'error' => 'Plan sin precio configurado en Stripe',
            ], 400);
        }

        $siteUrl = home_url();
        $checkout = new StripeCheckoutService();

        $opciones = [
            'priceId'    => $priceId,
            'successUrl' => "{$siteUrl}/panel/?checkout=success&session_id={CHECKOUT_SESSION_ID}",
            'cancelUrl'  => "{$siteUrl}/panel/?checkout=cancelled",
            'customerEmail' => $usuario->user_email,
            'metadata'   => [
                'plan_id'  => $planId,
                'user_id'  => (string) $usuario->ID,
                'username' => $usuario->user_login,
            ],
        ];

        if ($modo === 'subscription') {
            $resultado = $checkout->createSubscriptionSession($opciones);
        } else {
            $resultado = $checkout->createPaymentSession($opciones);
        }

        if ($resultado['success']) {
            return new WP_REST_Response([
                'url'       => $resultado['url'],
                'sessionId' => $resultado['sessionId'],
            ], 200);
        }

        GloryLogger::error('Stripe Checkout Error: ' . ($resultado['error'] ?? 'Unknown'));
        return new WP_REST_Response(['error' => 'Error al crear sesión'], 500);
    }

    /**
     * POST /stripe/portal
     * Crea una sesión del portal de facturación para gestionar suscripciones.
     */
    public static function crearSesionPortal(WP_REST_Request $request): WP_REST_Response
    {
        if (!StripeConfig::isConfigured()) {
            return new WP_REST_Response(['error' => 'Stripe no configurado'], 503);
        }

        $usuario = wp_get_current_user();
        $customerId = get_user_meta($usuario->ID, 'stripe_customer_id', true);

        if (empty($customerId)) {
            return new WP_REST_Response(['error' => 'No hay cuenta de facturación'], 404);
        }

        $client = new StripeApiClient();
        $resultado = $client->post('/billing_portal/sessions', [
            'customer'   => $customerId,
            'return_url' => home_url('/panel/'),
        ]);

        if ($resultado['success'] && !empty($resultado['data']['url'])) {
            return new WP_REST_Response(['url' => $resultado['data']['url']], 200);
        }

        return new WP_REST_Response(['error' => 'Error al crear portal'], 500);
    }

    /**
     * POST /stripe/webhook
     * Recibe y procesa webhooks de Stripe.
     */
    public static function manejarWebhook(WP_REST_Request $request): WP_REST_Response
    {
        $handler = new WebhookHandler();
        return $handler->handle($request);
    }
}
