<?php

/**
 * WebhookHandler
 *
 * Implementación concreta de AbstractStripeWebhookHandler.
 * Maneja los eventos de Stripe relevantes para el negocio:
 * - checkout.session.completed: Asocia Stripe customer_id al usuario WP
 * - customer.subscription.created/updated/deleted: Actualiza estado de suscripción
 * - invoice.paid/payment_failed: Registra pagos y errores
 *
 * Los datos se almacenan como user_meta en WordPress.
 *
 * @package App\Handlers
 */

namespace App\Handlers;

use Glory\Services\Stripe\AbstractStripeWebhookHandler;
use Glory\Core\GloryLogger;

class WebhookHandler extends AbstractStripeWebhookHandler
{
    /**
     * Checkout completado: asociar customer_id y registrar compra
     */
    protected function onCheckoutCompleted(array $session, array $fullEvent): void
    {
        $userId = $session['metadata']['user_id'] ?? null;
        $planId = $session['metadata']['plan_id'] ?? null;
        $customerId = $session['customer'] ?? null;

        if (!$userId || !$planId) {
            GloryLogger::warning('Webhook checkout: metadata incompleta');
            return;
        }

        /* Guardar customer_id de Stripe en el perfil del usuario */
        if ($customerId) {
            update_user_meta((int) $userId, 'stripe_customer_id', $customerId);
        }

        /* Registrar el plan adquirido */
        $planesActivos = get_user_meta((int) $userId, 'planes_activos', true) ?: [];
        $planesActivos[$planId] = [
            'estado'    => 'activo',
            'fecha'     => current_time('mysql'),
            'sessionId' => $session['id'] ?? '',
        ];
        update_user_meta((int) $userId, 'planes_activos', $planesActivos);

        GloryLogger::info("Checkout completado: user={$userId}, plan={$planId}");
    }

    /**
     * Suscripción creada
     */
    protected function onSubscriptionCreated(array $subscription, array $fullEvent): void
    {
        $this->actualizarSuscripcion($subscription, 'creada');
    }

    /**
     * Suscripción actualizada (cambio de plan, renovación, etc.)
     */
    protected function onSubscriptionUpdated(array $subscription, array $fullEvent): void
    {
        $this->actualizarSuscripcion($subscription, 'actualizada');
    }

    /**
     * Suscripción cancelada
     */
    protected function onSubscriptionDeleted(array $subscription, array $fullEvent): void
    {
        $customerId = $subscription['customer'] ?? '';
        $userId = $this->buscarUsuarioPorCustomer($customerId);

        if ($userId) {
            $subscriptionId = $subscription['id'] ?? '';
            update_user_meta($userId, 'stripe_subscription_status', 'cancelled');
            GloryLogger::info("Suscripción cancelada: user={$userId}, sub={$subscriptionId}");
        }
    }

    /**
     * Factura pagada exitosamente
     */
    protected function onInvoicePaid(array $invoice, array $fullEvent): void
    {
        $customerId = $invoice['customer'] ?? '';
        $userId = $this->buscarUsuarioPorCustomer($customerId);

        if ($userId) {
            $monto = ($invoice['amount_paid'] ?? 0) / 100;
            $moneda = strtoupper($invoice['currency'] ?? 'USD');
            GloryLogger::info("Pago recibido: user={$userId}, {$monto} {$moneda}");
        }
    }

    /**
     * Pago fallido
     */
    protected function onPaymentFailed(array $invoice, array $fullEvent): void
    {
        $customerId = $invoice['customer'] ?? '';
        $userId = $this->buscarUsuarioPorCustomer($customerId);

        if ($userId) {
            update_user_meta($userId, 'stripe_payment_failed', current_time('mysql'));
            GloryLogger::warning("Pago fallido: user={$userId}");
        }
    }

    /* ------- Utilidades internas ------- */

    /**
     * Actualiza el estado de suscripción del usuario
     */
    private function actualizarSuscripcion(array $subscription, string $accion): void
    {
        $customerId = $subscription['customer'] ?? '';
        $userId = $this->buscarUsuarioPorCustomer($customerId);

        if (!$userId) {
            GloryLogger::warning("Webhook sub {$accion}: usuario no encontrado para customer={$customerId}");
            return;
        }

        $estado = $subscription['status'] ?? 'unknown';
        update_user_meta($userId, 'stripe_subscription_id', $subscription['id'] ?? '');
        update_user_meta($userId, 'stripe_subscription_status', $estado);

        if (!empty($subscription['current_period_end'])) {
            update_user_meta($userId, 'stripe_period_end', $subscription['current_period_end']);
        }

        GloryLogger::info("Suscripción {$accion}: user={$userId}, status={$estado}");
    }

    /**
     * Busca un usuario de WP por su customer_id de Stripe
     */
    private function buscarUsuarioPorCustomer(string $customerId): ?int
    {
        if (empty($customerId)) return null;

        $users = get_users([
            'meta_key'   => 'stripe_customer_id',
            'meta_value' => $customerId,
            'number'     => 1,
            'fields'     => 'ID',
        ]);

        return !empty($users) ? (int) $users[0] : null;
    }
}
