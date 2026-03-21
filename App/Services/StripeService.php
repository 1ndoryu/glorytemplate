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

class StripeService
{
    private const OPTION_TEST_PUBLISHABLE = 'cap_stripe_test_publishable';
    private const OPTION_TEST_SECRET = 'cap_stripe_test_secret';
    private const OPTION_LIVE_PUBLISHABLE = 'cap_stripe_live_publishable';
    private const OPTION_LIVE_SECRET = 'cap_stripe_live_secret';
    private const OPTION_WEBHOOK_SECRET = 'cap_stripe_webhook_secret';
    private const OPTION_MODO_TEST = 'cap_stripe_test_mode';
    private const OPTION_PRICE_ID = 'cap_stripe_price_id';
    /* Controla si nuevos registros obtienen 14 días gratuitos o deben pagar inmediatamente */
    private const OPTION_TRIAL_HABILITADO = 'cap_stripe_trial_enabled';

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
            'trialHabilitado' => $this->esTrialHabilitado(),
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

        /* Guardar opción de trial gratuito (deshabilitado por defecto) */
        if (isset($datos['trialHabilitado'])) {
            update_option(self::OPTION_TRIAL_HABILITADO, (bool) $datos['trialHabilitado'] ? '1' : '0');
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
             * Idempotency key: ventana de 5 minutos por centro + priceId.
             * Si el usuario hace doble clic o recarga, Stripe devuelve la misma sesión.
             * El priceId se incluye para que un cambio de precio dentro de la ventana
             * genere una key distinta y Stripe no rechace con "same key, different params".
             */
            $ventanaMinutos = floor(time() / 300);
            $idempotencyKey = hash('sha256', "cap_checkout_{$centroId}_{$email}_{$this->priceId}_{$ventanaMinutos}");

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
     * Delega al StripeWebhookHandler que contiene toda la lógica de procesamiento de eventos.
     */
    public function procesarWebhook(string $payload, string $sigHeader): array
    {
        $handler = new StripeWebhookHandler($this->secretKey, $this->webhookSecret);
        return $handler->procesarWebhook($payload, $sigHeader);
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

    /**
     * Indica si el período de prueba gratuito está habilitado para nuevos registros.
     * Deshabilitado por defecto — los nuevos usuarios deben suscribirse para acceder.
     */
    public function esTrialHabilitado(): bool
    {
        return get_option(self::OPTION_TRIAL_HABILITADO, '0') === '1';
    }
}
