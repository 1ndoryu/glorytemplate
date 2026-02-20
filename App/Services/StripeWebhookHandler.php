<?php

/**
 * Manejador de webhooks de Stripe
 * 
 * Separado de StripeService para cumplir SRP.
 * StripeService gestiona configuración, checkout y portal.
 * Este handler procesa exclusivamente eventos recibidos por webhook.
 * 
 * @package Glory\App\Services
 */

namespace Glory\App\Services;

use App\Config\Schema\_generated\CapSuscripcionesCols;
use App\Config\Schema\_generated\CapSuscripcionesEnums;

class StripeWebhookHandler
{
    /* Estados de suscripción en la API de Stripe — nunca hardcodear strings */
    private const STRIPE_STATUS_ACTIVE = 'active';
    private const STRIPE_STATUS_PAST_DUE = 'past_due';
    private const STRIPE_STATUS_CANCELED = 'canceled';
    private const STRIPE_STATUS_UNPAID = 'unpaid';

    /* Timeout en segundos para llamadas a la API de Stripe */
    private const STRIPE_TIMEOUT_SEGUNDOS = 30;
    private const STRIPE_MAX_REINTENTOS = 2;

    private string $secretKey;
    private string $webhookSecret;

    public function __construct(string $secretKey, string $webhookSecret)
    {
        $this->secretKey = $secretKey;
        $this->webhookSecret = $webhookSecret;
    }

    /**
     * Procesa un evento de webhook de Stripe.
     * Incluye protección anti-replay: eventos ya procesados se ignoran.
     */
    public function procesarWebhook(string $payload, string $sigHeader): array
    {
        if (empty($this->webhookSecret)) {
            return ['error' => 'Webhook secret no configurado', 'status' => 400];
        }

        try {
            $stripeClass = '\\Stripe\\Stripe';
            $webhookClass = '\\Stripe\\Webhook';
            if (!class_exists($stripeClass) || !class_exists($webhookClass)) {
                return ['error' => 'Stripe SDK no está disponible en el servidor', 'status' => 500];
            }

            $stripeClass::setApiKey($this->secretKey);
            $this->configurarTimeoutStripe($stripeClass);

            /* constructEvent valida firma + timestamp (tolerancia de 300s por defecto) */
            $event = $webhookClass::constructEvent(
                $payload,
                $sigHeader,
                $this->webhookSecret
            );

            /* Protección anti-replay: si este evento ya fue procesado, ignorar */
            $transientKey = 'cap_stripe_evt_' . $event->id;
            if (get_transient($transientKey)) {
                return ['exito' => true, 'tipo' => $event->type, 'nota' => 'Evento ya procesado (replay ignorado)'];
            }

            switch ($event->type) {
                case 'checkout.session.completed':
                    $this->procesarCheckoutCompletado($event->data->object);
                    break;

                case 'invoice.payment_succeeded':
                    $this->procesarPagoExitoso($event->data->object);
                    break;

                case 'invoice.payment_failed':
                    $this->procesarPagoFallido($event->data->object);
                    break;

                case 'customer.subscription.updated':
                    $this->procesarSuscripcionActualizada($event->data->object);
                    break;

                case 'customer.subscription.deleted':
                    $this->procesarSuscripcionCancelada($event->data->object);
                    break;

                default:
                    error_log('[CAP Stripe] Evento no manejado: ' . $event->type);
            }

            /* Marcar evento como procesado — TTL 24h para prevenir replays */
            set_transient($transientKey, true, DAY_IN_SECONDS);

            return ['exito' => true, 'tipo' => $event->type];
        } catch (\Exception $e) {
            if (stripos($e->getMessage(), 'signature') !== false) {
                error_log('[CAP Stripe] Error de firma webhook: ' . $e->getMessage());
                return ['error' => 'Firma inválida', 'status' => 400];
            }

            error_log('[CAP Stripe] Error procesando webhook: ' . $e->getMessage());
            return ['error' => 'Error al procesar evento', 'status' => 500];
        }
    }

    /**
     * Procesa checkout completado - Activa la suscripción.
     * Usa transacción para atomicidad del SELECT+INSERT/UPDATE.
     * Verifica que el centro existe antes de crear la suscripción.
     */
    private function procesarCheckoutCompletado(object $session): bool
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $centroId = $session->metadata->centro_id ?? null;
        if (!$centroId) {
            error_log('[CAP Stripe] Checkout sin centro_id en metadata');
            return false;
        }

        $centroId = (int) $centroId;

        /* Verificar que el centro existe antes de crear suscripción (previene metadata manipulada) */
        $tablaCentros = $wpdb->prefix . 'cap_centros';
        $centroExiste = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$tablaCentros} WHERE id = %d",
            $centroId
        ));
        if (!$centroExiste) {
            error_log("[CAP Stripe] ERROR: Checkout con centro_id inexistente: {$centroId}");
            return false;
        }

        try {
            /* Transacción: el SELECT + INSERT/UPDATE deben ser atómicos contra webhooks concurrentes */
            $wpdb->query('START TRANSACTION');

            $existente = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$tabla} WHERE centro_id = %d FOR UPDATE",
                $centroId
            ));

            $datos = [
                CapSuscripcionesCols::STRIPE_CUSTOMER_ID => $session->customer,
                CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $session->subscription,
                CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_ACTIVA,
                CapSuscripcionesCols::FECHA_INICIO => current_time('mysql'),
                CapSuscripcionesCols::FECHA_FIN => date('Y-m-d H:i:s', strtotime('+1 month')),
                CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
            ];

            if ($existente) {
                $resultado = $wpdb->update($tabla, $datos, [CapSuscripcionesCols::ID => $existente]);
                if ($resultado === false) {
                    $wpdb->query('ROLLBACK');
                    error_log("[CAP Stripe] ERROR: Fallo al actualizar suscripción para centro {$centroId}. DB error: {$wpdb->last_error}");
                    return false;
                }
            } else {
                $datos[CapSuscripcionesCols::CENTRO_ID] = $centroId;
                $datos[CapSuscripcionesCols::CREATED_AT] = current_time('mysql');
                $resultado = $wpdb->insert($tabla, $datos);
                if ($resultado === false) {
                    $wpdb->query('ROLLBACK');
                    error_log("[CAP Stripe] ERROR: Fallo al insertar suscripción para centro {$centroId}. DB error: {$wpdb->last_error}");
                    return false;
                }
            }

            $wpdb->query('COMMIT');
            error_log("[CAP Stripe] Suscripción activada para centro {$centroId}");
            return true;
        } catch (\Throwable $e) {
            $wpdb->query('ROLLBACK');
            error_log("[CAP Stripe] ERROR: Excepción en checkout completado para centro {$centroId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Procesa pago exitoso de factura - Renueva suscripción
     */
    private function procesarPagoExitoso(object $invoice): bool
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $subscriptionId = $invoice->subscription;
        if (!$subscriptionId) {
            error_log('[CAP Stripe] Pago exitoso recibido sin subscription ID');
            return false;
        }

        $resultado = $wpdb->update($tabla, [
            CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_ACTIVA,
            CapSuscripcionesCols::FECHA_FIN => date('Y-m-d H:i:s', strtotime('+1 month')),
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ], [CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $subscriptionId]);

        if ($resultado === false) {
            error_log("[CAP Stripe] ERROR: Fallo al renovar suscripción {$subscriptionId}. DB error: {$wpdb->last_error}");
            return false;
        }

        error_log("[CAP Stripe] Pago exitoso para suscripción {$subscriptionId}");
        return true;
    }

    /**
     * Procesa pago fallido - Marca suscripción con gracia
     */
    private function procesarPagoFallido(object $invoice): bool
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $subscriptionId = $invoice->subscription;
        if (!$subscriptionId) {
            error_log('[CAP Stripe] Pago fallido recibido sin subscription ID');
            return false;
        }

        /* Dar 3 días de gracia */
        $resultado = $wpdb->update($tabla, [
            CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_PAGO_FALLIDO,
            CapSuscripcionesCols::FECHA_FIN => date('Y-m-d H:i:s', strtotime('+3 days')),
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ], [CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $subscriptionId]);

        if ($resultado === false) {
            error_log("[CAP Stripe] ERROR: Fallo al marcar pago fallido para suscripción {$subscriptionId}. DB error: {$wpdb->last_error}");
            return false;
        }

        error_log("[CAP Stripe] Pago fallido para suscripción {$subscriptionId}");
        return true;
    }

    /**
     * Procesa actualización de suscripción
     */
    private function procesarSuscripcionActualizada(object $subscription): bool
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $estado = CapSuscripcionesEnums::ESTADO_ACTIVA;
        if ($subscription->status === self::STRIPE_STATUS_PAST_DUE) {
            $estado = CapSuscripcionesEnums::ESTADO_PAGO_FALLIDO;
        } elseif ($subscription->status === self::STRIPE_STATUS_CANCELED || $subscription->status === self::STRIPE_STATUS_UNPAID) {
            $estado = CapSuscripcionesEnums::ESTADO_EXPIRADA;
        }

        $resultado = $wpdb->update($tabla, [
            CapSuscripcionesCols::ESTADO => $estado,
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ], [CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $subscription->id]);

        if ($resultado === false) {
            error_log("[CAP Stripe] ERROR: Fallo al actualizar suscripción {$subscription->id}. DB error: {$wpdb->last_error}");
            return false;
        }

        error_log("[CAP Stripe] Suscripción {$subscription->id} actualizada a estado: {$estado}");
        return true;
    }

    /**
     * Procesa cancelación de suscripción
     */
    private function procesarSuscripcionCancelada(object $subscription): bool
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $resultado = $wpdb->update($tabla, [
            CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_CANCELADA,
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ], [CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $subscription->id]);

        if ($resultado === false) {
            error_log("[CAP Stripe] ERROR: Fallo al cancelar suscripción {$subscription->id}. DB error: {$wpdb->last_error}");
            return false;
        }

        error_log("[CAP Stripe] Suscripción {$subscription->id} cancelada");
        return true;
    }

    /**
     * Configura timeout y reintentos para el SDK de Stripe.
     * Sin timeout explícito, un request puede colgar PHP indefinidamente.
     */
    private function configurarTimeoutStripe(string $stripeClass): void
    {
        try {
            if (method_exists($stripeClass, 'setMaxNetworkRetries')) {
                $stripeClass::setMaxNetworkRetries(self::STRIPE_MAX_REINTENTOS);
            }

            $curlClientClass = '\\Stripe\\HttpClient\\CurlClient';
            if (class_exists($curlClientClass)) {
                $apiRequestorClass = '\\Stripe\\ApiRequestor';
                if (class_exists($apiRequestorClass) && method_exists($apiRequestorClass, 'setHttpClient')) {
                    $httpClient = new $curlClientClass([
                        CURLOPT_TIMEOUT => self::STRIPE_TIMEOUT_SEGUNDOS,
                        CURLOPT_SSL_VERIFYPEER => true,
                        CURLOPT_SSL_VERIFYHOST => 2,
                    ]);
                    $apiRequestorClass::setHttpClient($httpClient);
                }
            }
        } catch (\Throwable $e) {
            /* No bloquear si la configuración de timeout falla */
            error_log('[CAP Stripe] Advertencia: no se pudo configurar timeout: ' . $e->getMessage());
        }
    }
}
