<?php

/**
 * StripeWebhookHandler
 *
 * Implementacion concreta del handler de webhooks de Stripe para el Dashboard.
 * Actualiza la suscripcion del usuario segun los eventos recibidos.
 *
 * @package App\Api
 */

namespace App\Api;

use Glory\Services\Stripe\AbstractStripeWebhookHandler;
use Glory\Core\GloryLogger;
use App\Services\SuscripcionService;

class StripeWebhookHandler extends AbstractStripeWebhookHandler
{
    /**
     * Meta key para guardar el ID de suscripcion de Stripe
     */
    private const META_STRIPE_SUBSCRIPTION = 'glory_stripe_subscription_id';
    private const META_STRIPE_CUSTOMER = 'glory_stripe_customer_id';

    /**
     * Suscripcion creada - activar premium
     */
    protected function onSubscriptionCreated(array $subscription, array $fullEvent): void
    {
        $customerId = $subscription['customer'] ?? '';
        $subscriptionId = $subscription['id'] ?? '';
        $status = $subscription['status'] ?? '';

        GloryLogger::info("=== Dashboard: Nueva Suscripcion ===");
        GloryLogger::info("Customer: {$customerId}, Subscription: {$subscriptionId}, Status: {$status}");

        $userId = $this->findUserByStripeCustomer($customerId);

        if (!$userId) {
            /* Intentar por email */
            $email = $this->getCustomerEmail($customerId);
            if ($email) {
                $user = get_user_by('email', $email);
                if ($user) {
                    $userId = $user->ID;
                    /* Guardar customer ID para futuras busquedas */
                    update_user_meta($userId, self::META_STRIPE_CUSTOMER, $customerId);
                }
            }
        }

        if (!$userId) {
            GloryLogger::warning("Dashboard Webhook: Usuario no encontrado para customer {$customerId}");
            return;
        }

        /* Guardar subscription ID */
        update_user_meta($userId, self::META_STRIPE_SUBSCRIPTION, $subscriptionId);

        /* Calcular duracion */
        $periodEnd = $subscription['current_period_end'] ?? 0;
        $diasDuracion = $periodEnd ? $this->calculateDays(time(), $periodEnd) : 30;

        $suscripcionService = new SuscripcionService($userId);

        /* Estado segun Stripe */
        if ($status === 'trialing') {
            $trialEnd = $subscription['trial_end'] ?? 0;
            $diasTrial = $trialEnd ? $this->calculateDays(time(), $trialEnd) : 14;

            GloryLogger::info("Activando trial de {$diasTrial} dias para usuario {$userId}");
            $suscripcionService->activarTrial();
        } else {
            GloryLogger::info("Activando premium de {$diasDuracion} dias para usuario {$userId}");
            $suscripcionService->activarPremium($diasDuracion);
        }
    }

    /**
     * Suscripcion actualizada
     */
    protected function onSubscriptionUpdated(array $subscription, array $fullEvent): void
    {
        $subscriptionId = $subscription['id'] ?? '';
        $status = $subscription['status'] ?? '';

        $userId = $this->findUserByStripeSubscription($subscriptionId);

        if (!$userId) {
            GloryLogger::warning("Dashboard Webhook: Usuario no encontrado para sub {$subscriptionId}");
            return;
        }

        $suscripcionService = new SuscripcionService($userId);
        $periodEnd = $subscription['current_period_end'] ?? 0;
        $diasDuracion = $periodEnd ? $this->calculateDays(time(), $periodEnd) : 30;

        switch ($status) {
            case 'active':
                GloryLogger::info("Suscripcion activa para usuario {$userId}");
                $suscripcionService->activarPremium($diasDuracion);
                break;

            case 'past_due':
            case 'unpaid':
                GloryLogger::warning("Suscripcion con pago pendiente: usuario {$userId}");
                /* Mantener activo pero marcado */
                break;

            case 'canceled':
            case 'incomplete_expired':
                GloryLogger::info("Suscripcion cancelada: usuario {$userId}");
                $suscripcionService->cancelar();
                break;
        }
    }

    /**
     * Suscripcion eliminada/cancelada
     */
    protected function onSubscriptionDeleted(array $subscription, array $fullEvent): void
    {
        $subscriptionId = $subscription['id'] ?? '';

        $userId = $this->findUserByStripeSubscription($subscriptionId);

        if ($userId) {
            GloryLogger::info("Cancelando suscripcion para usuario {$userId}");
            $suscripcionService = new SuscripcionService($userId);
            $suscripcionService->cancelar();
        }
    }

    /**
     * Checkout completado - guardar customer ID
     */
    protected function onCheckoutCompleted(array $session, array $fullEvent): void
    {
        $customerId = $session['customer'] ?? '';
        $customerEmail = $session['customer_email'] ?? $session['customer_details']['email'] ?? '';
        $mode = $session['mode'] ?? '';

        if ($mode !== 'subscription') {
            return;
        }

        if (empty($customerEmail)) {
            $customerEmail = $this->getCustomerEmail($customerId);
        }

        if (empty($customerEmail)) {
            return;
        }

        $user = get_user_by('email', $customerEmail);
        if ($user) {
            update_user_meta($user->ID, self::META_STRIPE_CUSTOMER, $customerId);
            GloryLogger::info("Checkout completado: guardado customer {$customerId} para usuario {$user->ID}");
        }
    }

    /**
     * Factura pagada - renovacion
     */
    protected function onInvoicePaid(array $invoice, array $fullEvent): void
    {
        $subscriptionId = $invoice['subscription'] ?? '';

        if (empty($subscriptionId)) {
            return;
        }

        $userId = $this->findUserByStripeSubscription($subscriptionId);

        if ($userId) {
            GloryLogger::info("Renovacion exitosa para usuario {$userId}");
            $suscripcionService = new SuscripcionService($userId);
            $suscripcionService->activarPremium(30);
        }
    }

    /**
     * Pago fallido
     */
    protected function onPaymentFailed(array $invoice, array $fullEvent): void
    {
        $subscriptionId = $invoice['subscription'] ?? '';

        if (empty($subscriptionId)) {
            return;
        }

        $userId = $this->findUserByStripeSubscription($subscriptionId);

        if ($userId) {
            GloryLogger::warning("Pago fallido para usuario {$userId}");
            /* No cancelamos inmediatamente, Stripe reintentara */
        }
    }

    /**
     * Busca usuario por Stripe Customer ID
     */
    private function findUserByStripeCustomer(string $customerId): ?int
    {
        if (empty($customerId)) {
            return null;
        }

        $users = get_users([
            'meta_key' => self::META_STRIPE_CUSTOMER,
            'meta_value' => $customerId,
            'number' => 1,
        ]);

        return $users[0]->ID ?? null;
    }

    /**
     * Busca usuario por Stripe Subscription ID
     */
    private function findUserByStripeSubscription(string $subscriptionId): ?int
    {
        if (empty($subscriptionId)) {
            return null;
        }

        $users = get_users([
            'meta_key' => self::META_STRIPE_SUBSCRIPTION,
            'meta_value' => $subscriptionId,
            'number' => 1,
        ]);

        return $users[0]->ID ?? null;
    }
}
