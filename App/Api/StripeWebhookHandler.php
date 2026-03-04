<?php

namespace App\Api;

use Glory\Services\Stripe\AbstractStripeWebhookHandler;
use Glory\Core\GloryLogger;
use App\Services\NotificacionService;
use Glory\Services\EventBus;

/**
 * Handler de webhooks de Stripe para Cresta Campers.
 *
 * Extiende AbstractStripeWebhookHandler del framework Glory.
 * Registra su propio endpoint: POST /glory/v1/stripe/webhook
 *
 * Eventos manejados:
 * - checkout.session.completed → Confirmar reserva + enviar emails
 * - payment_intent.payment_failed → Notificar fallo
 */
class StripeWebhookHandler extends AbstractStripeWebhookHandler
{
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        $handler = new self();

        register_rest_route('glory/v1', '/stripe/webhook', [
            'methods'             => 'POST',
            'callback'            => [$handler, 'handle'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Manejador: checkout.session.completed
     *
     * Stripe confirma que el pago fue exitoso.
     * 1. Buscar reserva por session_id en metadata
     * 2. Actualizar estado a "confirmada"
     * 3. Guardar payment_intent ID
     * 4. Enviar emails de confirmación
     */
    protected function onCheckoutCompleted(array $session, array $fullEvent): void
    {
        $reservaId = $session['metadata']['reserva_id'] ?? null;

        if (!$reservaId) {
            // Intentar buscar por session_id en metas
            $reservaId = self::buscarReservaPorSessionId($session['id'] ?? '');
        }

        if (!$reservaId) {
            GloryLogger::error('Stripe Webhook: checkout.session.completed sin reserva_id. Session: ' . ($session['id'] ?? 'unknown'));
            return;
        }

        $reservaId = (int) $reservaId;
        $estadoActual = get_post_meta($reservaId, '_reserva_estado', true);

        // Evitar doble procesamiento
        if ($estadoActual === 'confirmada') {
            GloryLogger::info("Stripe Webhook: Reserva #{$reservaId} ya está confirmada. Ignorando duplicado.");
            return;
        }

        // Actualizar estado
        update_post_meta($reservaId, '_reserva_estado', 'confirmada');

        // Guardar payment intent si está disponible
        $paymentIntent = $session['payment_intent'] ?? '';
        if ($paymentIntent) {
            update_post_meta($reservaId, '_reserva_stripe_payment_intent', $paymentIntent);
        }

        GloryLogger::info("Stripe Webhook: Reserva #{$reservaId} confirmada. Payment Intent: {$paymentIntent}");

        // Enviar emails
        try {
            NotificacionService::confirmarReservaCliente($reservaId);
            NotificacionService::notificarAdminNuevaReserva($reservaId);
        } catch (\Throwable $e) {
            GloryLogger::error("Error enviando emails para reserva #{$reservaId}: " . $e->getMessage());
        }

        // Emitir evento para invalidar cache de disponibilidad
        if (class_exists(EventBus::class)) {
            EventBus::emit('disponibilidad', [
                'vehiculo_id' => get_post_meta($reservaId, '_reserva_vehiculo_id', true),
                'reserva_id'  => $reservaId,
                'accion'      => 'confirmada',
            ]);
        }
    }

    /**
     * Manejador: payment_intent.succeeded
     *
     * Backup de confirmación si checkout.session.completed no llegó.
     */
    protected function onPaymentSucceeded(array $paymentIntent, array $fullEvent): void
    {
        $reservaId = $paymentIntent['metadata']['reserva_id'] ?? null;

        if (!$reservaId) {
            return;
        }

        $estadoActual = get_post_meta((int) $reservaId, '_reserva_estado', true);

        if ($estadoActual === 'pendiente') {
            GloryLogger::info("Stripe Webhook: payment_intent.succeeded como backup para reserva #{$reservaId}");
            update_post_meta((int) $reservaId, '_reserva_estado', 'confirmada');
            update_post_meta((int) $reservaId, '_reserva_stripe_payment_intent', $paymentIntent['id'] ?? '');

            try {
                NotificacionService::confirmarReservaCliente((int) $reservaId);
                NotificacionService::notificarAdminNuevaReserva((int) $reservaId);
            } catch (\Throwable $e) {
                GloryLogger::error("Error enviando emails (backup) para reserva #{$reservaId}: " . $e->getMessage());
            }
        }
    }

    /**
     * Manejador: payment_intent.payment_failed
     *
     * Registra el fallo. La reserva quedará en "pendiente" y el cron la cancelará.
     */
    protected function onPaymentIntentFailed(array $paymentIntent, array $fullEvent): void
    {
        $reservaId = $paymentIntent['metadata']['reserva_id'] ?? null;

        if ($reservaId) {
            GloryLogger::warning("Stripe Webhook: Pago fallido para reserva #{$reservaId}");
            update_post_meta((int) $reservaId, '_reserva_estado', 'fallida');
        }
    }

    /**
     * Busca una reserva por su session_id de Stripe.
     */
    private static function buscarReservaPorSessionId(string $sessionId): ?int
    {
        if (empty($sessionId)) {
            return null;
        }

        $query = new \WP_Query([
            'post_type'      => 'reserva',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'meta_query'     => [
                [
                    'key'   => '_reserva_stripe_session_id',
                    'value' => $sessionId,
                ],
            ],
        ]);

        if ($query->have_posts()) {
            return $query->posts[0]->ID;
        }

        return null;
    }
}
