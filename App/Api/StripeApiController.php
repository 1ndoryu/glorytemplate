<?php

/**
 * Stripe API Controller
 *
 * Maneja endpoints relacionados con pagos y suscripciones de Stripe.
 *
 * Endpoints:
 * - POST /wp-json/glory/v1/stripe/checkout -> Crear sesion de checkout
 * - POST /wp-json/glory/v1/stripe/webhook  -> Procesar webhooks
 * - POST /wp-json/glory/v1/stripe/portal   -> Crear portal de facturacion
 *
 * @package App\Api
 */

namespace App\Api;

use App\Services\SuscripcionService;
use Glory\Services\Stripe\StripeConfig;
use Glory\Services\Stripe\StripeCheckoutService;
use Glory\Services\Stripe\StripeApiClient;

class StripeApiController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        /* Checkout */
        register_rest_route(self::API_NAMESPACE, '/stripe/checkout', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'createCheckoutSession'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'plan' => [
                    'required' => true,
                    'validate_callback' => fn($param) => in_array($param, ['monthly', 'yearly']),
                ],
            ],
        ]);

        /* Webhook - No requiere auth, usa firma */
        register_rest_route(self::API_NAMESPACE, '/stripe/webhook', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'handleStripeWebhook'],
            'permission_callback' => '__return_true',
        ]);

        /* Portal de facturacion */
        register_rest_route(self::API_NAMESPACE, '/stripe/portal', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'createBillingPortal'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);
    }

    public static function requireAuthentication(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Obtiene ID de precio de Stripe segun el plan
     */
    private static function getStripePriceId(string $plan): string
    {
        $prices = [
            'monthly' => defined('GLORY_STRIPE_PRICE_MONTHLY')
                ? GLORY_STRIPE_PRICE_MONTHLY
                : get_option('glory_stripe_price_monthly', ''),
            'yearly' => defined('GLORY_STRIPE_PRICE_YEARLY')
                ? GLORY_STRIPE_PRICE_YEARLY
                : get_option('glory_stripe_price_yearly', ''),
        ];

        return $prices[$plan] ?? '';
    }

    /**
     * Crea una sesion de checkout de Stripe
     */
    public static function createCheckoutSession(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $plan = $request->get_param('plan');

        if (!StripeConfig::isConfigured()) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Stripe no esta configurado',
                'code' => 'stripe_not_configured',
            ], 500);
        }

        $priceId = self::getStripePriceId($plan);
        if (empty($priceId)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Plan no valido',
                'code' => 'invalid_plan',
            ], 400);
        }

        try {
            $user = wp_get_current_user();
            $checkoutService = new StripeCheckoutService();

            $suscripcionService = new SuscripcionService($userId);
            $suscripcion = $suscripcionService->getSuscripcion();
            $trialDays = empty($suscripcion['trialUsado']) ? 14 : 0;

            $baseUrl = home_url('/');
            $result = $checkoutService->createSubscriptionSession([
                'priceId' => $priceId,
                'successUrl' => $baseUrl . '?checkout=success&session_id={CHECKOUT_SESSION_ID}',
                'cancelUrl' => $baseUrl . '?checkout=cancelled',
                'customerEmail' => $user->user_email,
                'trialDays' => $trialDays,
                'metadata' => [
                    'user_id' => $userId,
                    'plan' => $plan,
                    'wp_user_email' => $user->user_email,
                ],
                'allowPromotionCodes' => true,
            ]);

            if (!$result['success']) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => $result['error'] ?? 'Error al crear sesion de pago',
                    'code' => 'checkout_error',
                ], 500);
            }

            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'sessionId' => $result['sessionId'],
                    'url' => $result['url'],
                ],
            ], 200);
        } catch (\Exception $e) {
            error_log('[StripeAPI] Checkout error: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error interno al procesar pago',
                'code' => 'internal_error',
            ], 500);
        }
    }

    /**
     * Maneja webhooks de Stripe
     */
    public static function handleStripeWebhook(\WP_REST_Request $request): \WP_REST_Response
    {
        $handler = new StripeWebhookHandler();
        return $handler->handle($request);
    }

    /**
     * Crea una sesion del portal de facturacion de Stripe
     */
    public static function createBillingPortal(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        $customerId = get_user_meta($userId, 'glory_stripe_customer_id', true);

        if (empty($customerId)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'No tienes una suscripcion activa',
                'code' => 'no_subscription',
            ], 400);
        }

        try {
            $client = new StripeApiClient();
            $result = $client->createBillingPortalSession(
                $customerId,
                home_url('/')
            );

            if (!$result['success']) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => $result['error'] ?? 'Error al crear portal',
                    'code' => 'portal_error',
                ], 500);
            }

            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'url' => $result['data']['url'],
                ],
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error interno',
                'code' => 'internal_error',
            ], 500);
        }
    }
}

StripeApiController::register();
