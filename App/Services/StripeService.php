<?php

/**
 * Servicio de integración con Stripe
 * Gestiona suscripciones, webhooks y configuración de API keys
 * 
 * Las API keys se almacenan encriptadas en la base de datos de WordPress
 * y solo pueden ser configuradas por usuarios administrator.
 * 
 * @package Glory\App\Services
 */

namespace Glory\App\Services;

use App\Config\Schema\_generated\CapSuscripcionesCols;
use App\Config\Schema\_generated\CapSuscripcionesEnums;

class StripeService
{
    private const OPTION_TEST_PUBLISHABLE = 'cap_stripe_test_publishable';
    private const OPTION_TEST_SECRET = 'cap_stripe_test_secret';
    private const OPTION_LIVE_PUBLISHABLE = 'cap_stripe_live_publishable';
    private const OPTION_LIVE_SECRET = 'cap_stripe_live_secret';
    private const OPTION_WEBHOOK_SECRET = 'cap_stripe_webhook_secret';
    private const OPTION_MODO_TEST = 'cap_stripe_test_mode';
    private const OPTION_PRICE_ID = 'cap_stripe_price_id';

    private string $secretKey;
    private string $publishableKey;
    private string $webhookSecret;
    private string $priceId;
    private bool $modoTest;

    public function __construct()
    {
        $this->modoTest = $this->obtenerModoTest();
        $this->secretKey = $this->obtenerSecretKey();
        $this->publishableKey = $this->obtenerPublishableKey();
        $this->webhookSecret = $this->desencriptar(get_option(self::OPTION_WEBHOOK_SECRET, ''));
        $this->priceId = get_option(self::OPTION_PRICE_ID, '');
    }

    /**
     * Verifica si Stripe está configurado correctamente
     */
    public function estaConfigurado(): bool
    {
        return !empty($this->secretKey) && !empty($this->publishableKey);
    }

    /**
     * Obtiene el estado de configuración para mostrar en el frontend
     */
    public function obtenerEstadoConfiguracion(): array
    {
        $testPublishable = $this->desencriptar(get_option(self::OPTION_TEST_PUBLISHABLE, ''));
        $testSecret = $this->desencriptar(get_option(self::OPTION_TEST_SECRET, ''));
        $livePublishable = $this->desencriptar(get_option(self::OPTION_LIVE_PUBLISHABLE, ''));
        $liveSecret = $this->desencriptar(get_option(self::OPTION_LIVE_SECRET, ''));

        return [
            'configurado' => $this->estaConfigurado(),
            'modoTest' => $this->modoTest,
            'priceId' => $this->priceId,
            /* Mostramos solo si están configuradas, no las keys completas por seguridad */
            'testKeysConfiguradas' => !empty($testPublishable) && !empty($testSecret),
            'liveKeysConfiguradas' => !empty($livePublishable) && !empty($liveSecret),
            'webhookConfigurado' => !empty($this->webhookSecret),
            /* Para el frontend, la publishable key sí se puede exponer */
            'publishableKey' => $this->publishableKey,
            'webhookUrl' => rest_url('cap/v1/stripe-webhook'),
        ];
    }

    /**
     * Guarda la configuración de Stripe (solo admin)
     */
    public function guardarConfiguracion(array $datos): array
    {
        $errores = [];

        /* Validar y guardar Test Publishable Key */
        if (isset($datos['testPublishableKey'])) {
            $key = sanitize_text_field($datos['testPublishableKey']);
            if (!empty($key) && strpos($key, 'pk_test_') !== 0) {
                $errores[] = 'La clave pública de test debe comenzar con pk_test_';
            } else {
                update_option(self::OPTION_TEST_PUBLISHABLE, $this->encriptar($key));
            }
        }

        /* Validar y guardar Test Secret Key */
        if (isset($datos['testSecretKey'])) {
            $key = sanitize_text_field($datos['testSecretKey']);
            if (!empty($key) && strpos($key, 'sk_test_') !== 0) {
                $errores[] = 'La clave secreta de test debe comenzar con sk_test_';
            } else {
                update_option(self::OPTION_TEST_SECRET, $this->encriptar($key));
            }
        }

        /* Validar y guardar Live Publishable Key */
        if (isset($datos['livePublishableKey'])) {
            $key = sanitize_text_field($datos['livePublishableKey']);
            if (!empty($key) && strpos($key, 'pk_live_') !== 0) {
                $errores[] = 'La clave pública de producción debe comenzar con pk_live_';
            } else {
                update_option(self::OPTION_LIVE_PUBLISHABLE, $this->encriptar($key));
            }
        }

        /* Validar y guardar Live Secret Key */
        if (isset($datos['liveSecretKey'])) {
            $key = sanitize_text_field($datos['liveSecretKey']);
            if (!empty($key) && strpos($key, 'sk_live_') !== 0) {
                $errores[] = 'La clave secreta de producción debe comenzar con sk_live_';
            } else {
                update_option(self::OPTION_LIVE_SECRET, $this->encriptar($key));
            }
        }

        /* Guardar Webhook Secret */
        if (isset($datos['webhookSecret'])) {
            $key = sanitize_text_field($datos['webhookSecret']);
            if (!empty($key) && strpos($key, 'whsec_') !== 0) {
                $errores[] = 'El secreto de webhook debe comenzar con whsec_';
            } else {
                update_option(self::OPTION_WEBHOOK_SECRET, $this->encriptar($key));
            }
        }

        /* Guardar Price ID */
        if (isset($datos['priceId'])) {
            $priceId = sanitize_text_field($datos['priceId']);
            if (!empty($priceId) && strpos($priceId, 'price_') !== 0) {
                $errores[] = 'El ID de precio debe comenzar con price_';
            } else {
                update_option(self::OPTION_PRICE_ID, $priceId);
            }
        }

        /* Guardar modo (test/live) */
        if (isset($datos['modoTest'])) {
            update_option(self::OPTION_MODO_TEST, (bool) $datos['modoTest'] ? '1' : '0');
        }

        if (!empty($errores)) {
            return ['exito' => false, 'errores' => $errores];
        }

        return ['exito' => true, 'estado' => $this->obtenerEstadoConfiguracion()];
    }

    /**
     * Crea una sesión de checkout para nueva suscripción
     */
    public function crearCheckoutSession(
        int $centroId,
        string $email,
        string $urlExito,
        string $urlCancelado
    ): ?array {
        if (!$this->estaConfigurado()) {
            return ['error' => 'Stripe no está configurado'];
        }

        if (empty($this->priceId)) {
            return ['error' => 'No hay un precio configurado para la suscripción'];
        }

        try {
            $stripeClass = '\\Stripe\\Stripe';
            $checkoutSessionClass = '\\Stripe\\Checkout\\Session';
            if (!class_exists($stripeClass) || !class_exists($checkoutSessionClass)) {
                return ['error' => 'Stripe SDK no está disponible en el servidor'];
            }

            /* Inicializar Stripe SDK */
            $stripeClass::setApiKey($this->secretKey);

            $session = $checkoutSessionClass::create([
                'payment_method_types' => ['card'],
                'mode' => 'subscription',
                'customer_email' => $email,
                'line_items' => [[
                    'price' => $this->priceId,
                    'quantity' => 1,
                ]],
                'success_url' => $urlExito . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $urlCancelado,
                'metadata' => [
                    'centro_id' => $centroId,
                ],
                'subscription_data' => [
                    'metadata' => [
                        'centro_id' => $centroId,
                    ],
                ],
            ]);

            return [
                'id' => $session->id,
                'url' => $session->url,
            ];
        } catch (\Exception $e) {
            error_log('[CAP Stripe] Error creando checkout: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Genera URL del portal de cliente para gestionar suscripción
     */
    public function getPortalUrl(string $stripeCustomerId, string $urlRetorno): ?string
    {
        if (!$this->estaConfigurado()) {
            return null;
        }

        try {
            $stripeClass = '\\Stripe\\Stripe';
            $billingPortalSessionClass = '\\Stripe\\BillingPortal\\Session';
            if (!class_exists($stripeClass) || !class_exists($billingPortalSessionClass)) {
                return null;
            }

            $stripeClass::setApiKey($this->secretKey);

            $session = $billingPortalSessionClass::create([
                'customer' => $stripeCustomerId,
                'return_url' => $urlRetorno,
            ]);

            return $session->url;
        } catch (\Exception $e) {
            error_log('[CAP Stripe] Error creando portal session: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Procesa un evento de webhook de Stripe
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

            $event = $webhookClass::constructEvent(
                $payload,
                $sigHeader,
                $this->webhookSecret
            );

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

            return ['exito' => true, 'tipo' => $event->type];
        } catch (\Exception $e) {
            if (stripos($e->getMessage(), 'signature') !== false) {
                error_log('[CAP Stripe] Error de firma webhook: ' . $e->getMessage());
                return ['error' => 'Firma inválida', 'status' => 400];
            }

            error_log('[CAP Stripe] Error procesando webhook: ' . $e->getMessage());
            return ['error' => $e->getMessage(), 'status' => 500];
        }
    }

    /**
     * Procesa checkout completado - Activa la suscripción
     */
    private function procesarCheckoutCompletado(object $session): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $centroId = $session->metadata->centro_id ?? null;
        if (!$centroId) {
            error_log('[CAP Stripe] Checkout sin centro_id en metadata');
            return;
        }

        /* Verificar si ya existe una suscripción para este centro */
        $existente = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$tabla} WHERE centro_id = %d",
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
            $wpdb->update($tabla, $datos, [CapSuscripcionesCols::ID => $existente]);
        } else {
            $datos[CapSuscripcionesCols::CENTRO_ID] = $centroId;
            $datos[CapSuscripcionesCols::CREATED_AT] = current_time('mysql');
            $wpdb->insert($tabla, $datos);
        }

        error_log("[CAP Stripe] Suscripción activada para centro {$centroId}");
    }

    /**
     * Procesa pago exitoso de factura - Renueva suscripción
     */
    private function procesarPagoExitoso(object $invoice): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $subscriptionId = $invoice->subscription;
        if (!$subscriptionId) return;

        $wpdb->update($tabla, [
            CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_ACTIVA,
            CapSuscripcionesCols::FECHA_FIN => date('Y-m-d H:i:s', strtotime('+1 month')),
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ], [CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $subscriptionId]);

        error_log("[CAP Stripe] Pago exitoso para suscripción {$subscriptionId}");
    }

    /**
     * Procesa pago fallido - Marca suscripción con gracia
     */
    private function procesarPagoFallido(object $invoice): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $subscriptionId = $invoice->subscription;
        if (!$subscriptionId) return;

        /* Dar 3 días de gracia */
        $wpdb->update($tabla, [
            CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_PAGO_FALLIDO,
            CapSuscripcionesCols::FECHA_FIN => date('Y-m-d H:i:s', strtotime('+3 days')),
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ], [CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $subscriptionId]);

        error_log("[CAP Stripe] Pago fallido para suscripción {$subscriptionId}");
    }

    /**
     * Procesa actualización de suscripción
     */
    private function procesarSuscripcionActualizada(object $subscription): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $estado = CapSuscripcionesEnums::ESTADO_ACTIVA;
        if ($subscription->status === 'past_due') {
            $estado = CapSuscripcionesEnums::ESTADO_PAGO_FALLIDO;
        } elseif ($subscription->status === 'canceled' || $subscription->status === 'unpaid') {
            $estado = CapSuscripcionesEnums::ESTADO_EXPIRADA;
        }

        $wpdb->update($tabla, [
            CapSuscripcionesCols::ESTADO => $estado,
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ], [CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $subscription->id]);

        error_log("[CAP Stripe] Suscripción {$subscription->id} actualizada a estado: {$estado}");
    }

    /**
     * Procesa cancelación de suscripción
     */
    private function procesarSuscripcionCancelada(object $subscription): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapSuscripcionesCols::TABLA;

        $wpdb->update($tabla, [
            CapSuscripcionesCols::ESTADO => CapSuscripcionesEnums::ESTADO_CANCELADA,
            CapSuscripcionesCols::UPDATED_AT => current_time('mysql'),
        ], [CapSuscripcionesCols::STRIPE_SUBSCRIPTION_ID => $subscription->id]);

        error_log("[CAP Stripe] Suscripción {$subscription->id} cancelada");
    }

    /**
     * Obtiene la secret key según el modo activo
     */
    private function obtenerSecretKey(): string
    {
        $option = $this->modoTest ? self::OPTION_TEST_SECRET : self::OPTION_LIVE_SECRET;
        return $this->desencriptar(get_option($option, ''));
    }

    /**
     * Obtiene la publishable key según el modo activo
     */
    private function obtenerPublishableKey(): string
    {
        $option = $this->modoTest ? self::OPTION_TEST_PUBLISHABLE : self::OPTION_LIVE_PUBLISHABLE;
        return $this->desencriptar(get_option($option, ''));
    }

    /**
     * Obtiene el modo (test o live)
     */
    private function obtenerModoTest(): bool
    {
        return get_option(self::OPTION_MODO_TEST, '1') === '1';
    }

    /**
     * Encripta un valor para almacenarlo de forma segura
     * Usa la AUTH_KEY de WordPress como clave
     */
    private function encriptar(string $valor): string
    {
        if (empty($valor)) return '';

        $key = $this->obtenerClaveEncriptacion();
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($valor, 'AES-256-CBC', $key, 0, $iv);

        return base64_encode($iv . '::' . $encrypted);
    }

    /**
     * Desencripta un valor almacenado
     */
    private function desencriptar(string $valor): string
    {
        if (empty($valor)) return '';

        $key = $this->obtenerClaveEncriptacion();
        $data = base64_decode($valor);

        if (strpos($data, '::') === false) {
            return ''; /* Formato inválido */
        }

        list($iv, $encrypted) = explode('::', $data, 2);
        $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);

        return $decrypted !== false ? $decrypted : '';
    }

    /**
     * Obtiene la clave de encriptación basada en AUTH_KEY de WP
     */
    private function obtenerClaveEncriptacion(): string
    {
        if (!defined('AUTH_KEY') || AUTH_KEY === '') {
            throw new \RuntimeException('AUTH_KEY no está definida. No se puede encriptar configuración de Stripe.');
        }

        $key = AUTH_KEY;
        return hash('sha256', $key, true);
    }

    /**
     * Getters públicos para uso en otros servicios
     */
    public function getPublishableKey(): string
    {
        return $this->publishableKey;
    }

    public function esModoTest(): bool
    {
        return $this->modoTest;
    }
}
