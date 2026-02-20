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

    /* Estados de suscripción en la API de Stripe — nunca hardcodear strings */
    private const STRIPE_STATUS_ACTIVE = 'active';
    private const STRIPE_STATUS_PAST_DUE = 'past_due';
    private const STRIPE_STATUS_CANCELED = 'canceled';
    private const STRIPE_STATUS_UNPAID = 'unpaid';

    /* Timeout en segundos para llamadas a la API de Stripe, evita colgar el proceso PHP */
    private const STRIPE_TIMEOUT_SEGUNDOS = 30;
    private const STRIPE_MAX_REINTENTOS = 2;

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
     * Crea una sesión de checkout para nueva suscripción.
     * Incluye idempotency key para evitar cobros duplicados por reintentos del browser.
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

        /* Validar que las URLs pertenezcan al dominio propio — prevenir open redirect */
        $urlExito = $this->validarUrlRedireccion($urlExito);
        $urlCancelado = $this->validarUrlRedireccion($urlCancelado);

        try {
            $stripeClass = '\\Stripe\\Stripe';
            $checkoutSessionClass = '\\Stripe\\Checkout\\Session';
            if (!class_exists($stripeClass) || !class_exists($checkoutSessionClass)) {
                return ['error' => 'Stripe SDK no está disponible en el servidor'];
            }

            $stripeClass::setApiKey($this->secretKey);
            $this->configurarTimeoutStripe($stripeClass);

            /*
             * Idempotency key: ventana de 5 minutos por centro.
             * Si el usuario hace doble clic o recarga, Stripe devuelve la misma sesión.
             */
            $ventanaMinutos = floor(time() / 300);
            $idempotencyKey = hash('sha256', "cap_checkout_{$centroId}_{$email}_{$ventanaMinutos}");

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
            ], ['idempotency_key' => $idempotencyKey]);

            return [
                'id' => $session->id,
                'url' => $session->url,
            ];
        } catch (\Exception $e) {
            error_log('[CAP Stripe] Error creando checkout: ' . $e->getMessage());
            return ['error' => 'Error al crear sesión de pago'];
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

        /* Validar que la URL de retorno pertenezca al dominio propio */
        $urlRetorno = $this->validarUrlRedireccion($urlRetorno);

        /* Validar formato del customer ID contra path traversal */
        if (!preg_match('/^cus_[a-zA-Z0-9]+$/', $stripeCustomerId)) {
            error_log('[CAP Stripe] Customer ID con formato inválido: ' . substr($stripeCustomerId, 0, 20));
            return null;
        }

        try {
            $stripeClass = '\\Stripe\\Stripe';
            $billingPortalSessionClass = '\\Stripe\\BillingPortal\\Session';
            if (!class_exists($stripeClass) || !class_exists($billingPortalSessionClass)) {
                return null;
            }

            $stripeClass::setApiKey($this->secretKey);
            $this->configurarTimeoutStripe($stripeClass);

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
     * Usa la AUTH_KEY de WordPress como clave.
     * Formato: base64( IV_16_bytes . ciphertext_base64 ) — sin separador para evitar
     * bug si el IV aleatorio contiene los bytes '::' (0x3A3A).
     */
    private function encriptar(string $valor): string
    {
        if (empty($valor)) return '';

        $key = $this->obtenerClaveEncriptacion();
        $iv = openssl_random_pseudo_bytes(16, $cryptoStrong);

        if (!$cryptoStrong) {
            error_log('[CAP Stripe] ADVERTENCIA: openssl_random_pseudo_bytes no generó IV criptográficamente seguro');
        }

        $encrypted = openssl_encrypt($valor, 'AES-256-CBC', $key, 0, $iv);

        if ($encrypted === false) {
            error_log('[CAP Stripe] ERROR: openssl_encrypt falló. Posible problema con la clave de encriptación.');
            return '';
        }

        /* IV (16 bytes) concatenado directamente con ciphertext base64 — sin separador */
        return base64_encode($iv . $encrypted);
    }

    /**
     * Desencripta un valor almacenado.
     * Soporta formato nuevo (IV . ciphertext) y viejo (IV :: ciphertext) para
     * compatibilidad con valores encriptados antes del fix del separador.
     */
    private function desencriptar(string $valor): string
    {
        if (empty($valor)) return '';

        $key = $this->obtenerClaveEncriptacion();
        $data = base64_decode($valor, true);

        if ($data === false || strlen($data) < 17) {
            error_log('[CAP Stripe] ERROR: datos encriptados corruptos o demasiado cortos');
            return '';
        }

        /*
         * Detectar formato: en el formato viejo, bytes 16-17 son '::' (0x3A3A).
         * En el nuevo, byte 16 es un carácter base64 (nunca ':').
         */
        if (strlen($data) > 17 && substr($data, 16, 2) === '::') {
            /* Formato viejo: IV(16) + '::' + ciphertext_base64 */
            $iv = substr($data, 0, 16);
            $encrypted = substr($data, 18);
        } else {
            /* Formato nuevo: IV(16) + ciphertext_base64 — sin separador */
            $iv = substr($data, 0, 16);
            $encrypted = substr($data, 16);
        }

        $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);

        if ($decrypted === false) {
            error_log('[CAP Stripe] ERROR: desencriptación falló — posible clave incorrecta o datos corruptos');
            return '';
        }

        return $decrypted;
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
     * Valida que una URL de redirección pertenezca al dominio del sitio.
     * Previene open redirect — un atacante podría redirigir a sitios maliciosos
     * usando la confianza del dominio legítimo.
     */
    private function validarUrlRedireccion(string $url): string
    {
        $fallback = home_url('/cap-dashboard/');

        if (empty($url)) {
            return $fallback;
        }

        /* wp_validate_redirect retorna el fallback si la URL no pertenece al dominio */
        return wp_validate_redirect($url, $fallback);
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

            /*
             * El SDK de Stripe permite configurar timeout via CurlClient.
             * Si la clase existe, establecer timeout explícito.
             */
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
