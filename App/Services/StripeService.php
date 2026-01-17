<?php

/**
 * Servicio de integración con Stripe
 * Gestiona suscripciones y webhooks de pago
 * 
 * @package Glory\App\Services
 */

namespace Glory\App\Services;

class StripeService
{
    private string $secretKey;
    private string $webhookSecret;
    private bool $modoTest;

    public function __construct()
    {
        $this->modoTest = defined('CAP_STRIPE_TEST_MODE') ? CAP_STRIPE_TEST_MODE : true;
        $this->secretKey = $this->modoTest
            ? (defined('CAP_STRIPE_TEST_SECRET') ? CAP_STRIPE_TEST_SECRET : '')
            : (defined('CAP_STRIPE_LIVE_SECRET') ? CAP_STRIPE_LIVE_SECRET : '');
        $this->webhookSecret = defined('CAP_STRIPE_WEBHOOK_SECRET') ? CAP_STRIPE_WEBHOOK_SECRET : '';
    }

    /**
     * Verifica si Stripe está configurado correctamente
     */
    public function estaConfigurado(): bool
    {
        return !empty($this->secretKey);
    }

    /**
     * Crea una sesión de checkout para nueva suscripción
     * 
     * @param int $centroId ID del centro
     * @param string $email Email del usuario
     * @param string $urlExito URL de redirección tras pago exitoso
     * @param string $urlCancelado URL de redirección si cancela
     * @return array|null Datos de la sesión o null si falla
     */
    public function crearCheckoutSession(
        int $centroId,
        string $email,
        string $urlExito,
        string $urlCancelado
    ): ?array {
        if (!$this->estaConfigurado()) {
            return null;
        }

        /* 
         * TO-DO: Implementar llamada real a Stripe API
         * Requiere: composer require stripe/stripe-php
         * 
         * \Stripe\Stripe::setApiKey($this->secretKey);
         * $session = \Stripe\Checkout\Session::create([...]);
         */

        return [
            'id' => 'cs_test_placeholder',
            'url' => '#',
        ];
    }

    /**
     * Genera URL del portal de cliente para gestionar suscripción
     */
    public function getPortalUrl(string $stripeCustomerId, string $urlRetorno): ?string
    {
        if (!$this->estaConfigurado()) {
            return null;
        }

        /* 
         * TO-DO: Implementar llamada real a Stripe API
         * 
         * \Stripe\Stripe::setApiKey($this->secretKey);
         * $session = \Stripe\BillingPortal\Session::create([...]);
         * return $session->url;
         */

        return '#';
    }

    /**
     * Procesa un evento de webhook de Stripe
     * 
     * @param string $payload Cuerpo del request
     * @param string $sigHeader Header de firma de Stripe
     * @return array Resultado del procesamiento
     */
    public function procesarWebhook(string $payload, string $sigHeader): array
    {
        if (empty($this->webhookSecret)) {
            return ['error' => 'Webhook secret no configurado'];
        }

        /* 
         * TO-DO: Implementar verificación y procesamiento
         * 
         * $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $this->webhookSecret);
         * 
         * switch ($event->type) {
         *     case 'checkout.session.completed':
         *         $this->activarSuscripcion($event->data->object);
         *         break;
         *     case 'invoice.payment_failed':
         *         $this->marcarPagoFallido($event->data->object);
         *         break;
         *     case 'customer.subscription.deleted':
         *         $this->cancelarSuscripcion($event->data->object);
         *         break;
         * }
         */

        return ['exito' => true];
    }

    /**
     * Activa la suscripción de un centro
     */
    private function activarSuscripcion(object $session): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_suscripciones';

        $centroId = $session->metadata->centro_id ?? null;
        if (!$centroId) {
            return;
        }

        $wpdb->insert($tabla, [
            'centro_id' => $centroId,
            'stripe_customer_id' => $session->customer,
            'stripe_subscription_id' => $session->subscription,
            'estado' => 'activa',
            'created_at' => current_time('mysql'),
        ]);
    }
}
