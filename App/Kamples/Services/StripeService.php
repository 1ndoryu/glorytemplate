<?php

/**
 * StripeService — Integración con Stripe Billing + Connect.
 *
 * Gestiona: checkout sessions, webhooks, customer portal,
 * onboarding de creadores (Connect) y revenue share.
 *
 * Lee keys desde .env: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY,
 * STRIPE_WEBHOOK_SECRET, STRIPE_CONNECT_WEBHOOK_SECRET.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Helpers\JsonHelper;

class StripeService
{
    private const API_BASE = 'https://api.stripe.com/v1';
    private const MAX_REINTENTOS = 3;

    /* [183A-96+183A-99] Configuración de planes.
     * Free/Pro: 80/20 (20% comisión plataforma). Premium: 100/0 (sin comisión).
     * [2003A-5] max_samples: total acumulado de samples que puede subir/sincronizar el usuario.
     * Premium = misma lógica que Pro (20.000). */
    private const PLANES = [
        'pro' => [
            'precio_mensual'    => 5.00,
            'descargas_dia'     => 50,
            'subidas_mes'       => -1, /* ilimitadas */
            'max_samples'       => 20000,
            'transferencia_gb'  => 10,
            'revenue_share'     => 0.80,
        ],
        'premium' => [
            'precio_mensual'    => 19.99,
            'descargas_dia'     => -1, /* ilimitadas */
            'subidas_mes'       => -1,
            'max_samples'       => 20000,
            'transferencia_gb'  => 50,
            'revenue_share'     => 1.00,
        ],
        'free' => [
            'precio_mensual'    => 0,
            'descargas_dia'     => 5,
            'subidas_mes'       => -1, /* ilimitadas */
            'max_samples'       => 100,
            'transferencia_gb'  => 1,
            'revenue_share'     => 0.80,
            'prueba_gratuita'   => 30, /* días */
            'descargas_prueba'  => 20,
        ],
    ];

    /**
     * Obtiene la secret key de Stripe desde .env.
     * Busca GLORY_STRIPE_SECRET_KEY primero, luego STRIPE_SECRET_KEY como fallback.
     */
    private static function obtenerSecretKey(): ?string
    {
        $key = $_ENV['GLORY_STRIPE_SECRET_KEY'] ?? getenv('GLORY_STRIPE_SECRET_KEY')
            ?: $_ENV['STRIPE_SECRET_KEY'] ?? getenv('STRIPE_SECRET_KEY') ?: null;
        if (!$key) {
            KamplesLogger::warning('STRIPE_SECRET_KEY no configurada en .env');
        }
        return $key;
    }

    /**
     * Realiza una petición HTTP a la API de Stripe con reintentos y backoff exponencial.
     *
     * Reintenta automáticamente en errores transitorios (curl timeout/conexión, HTTP 5xx).
     * NO reintenta en errores de cliente (HTTP 4xx).
     * Backoff: 1s, 2s, 4s entre intentos.
     *
     * @param string $accountId ID de cuenta Connect (header Stripe-Account) — null para cuenta principal.
     */
    private static function request(string $method, string $endpoint, array $params = [], ?string $accountId = null): array
    {
        $secretKey = self::obtenerSecretKey();
        if (!$secretKey) {
            return ['error' => 'Stripe no configurado'];
        }

        $urlBase = self::API_BASE . $endpoint;

        $headers = [
            'Authorization: Bearer ' . $secretKey,
            'Content-Type: application/x-www-form-urlencoded',
        ];

        if ($accountId) {
            $headers[] = 'Stripe-Account: ' . $accountId;
        }

        $ultimoError = '';

        for ($intento = 1; $intento <= self::MAX_REINTENTOS; $intento++) {
            $ch = null;

            try {
                $ch = curl_init();

                if ($ch === false) {
                    KamplesLogger::error('Stripe API: curl_init() falló', ['endpoint' => $endpoint]);
                    return ['error' => 'Error interno: no se pudo inicializar cURL'];
                }

                $url = $urlBase;

                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

                if ($method === 'POST') {
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
                } elseif ($method === 'GET' && !empty($params)) {
                    $url .= '?' . http_build_query($params);
                }

                curl_setopt($ch, CURLOPT_URL, $url);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curlError = curl_error($ch);
                curl_close($ch);
                $ch = null;

                /* Error de red/curl — reintentar si quedan intentos */
                if ($response === false) {
                    $ultimoError = $curlError;
                    if ($intento < self::MAX_REINTENTOS) {
                        $espera = (int) pow(2, $intento - 1);
                        KamplesLogger::warning('Stripe API: error de red, reintentando', [
                            'endpoint'        => $endpoint,
                            'intento'         => $intento,
                            'maxIntentos'     => self::MAX_REINTENTOS,
                            'esperaSegundos'  => $espera,
                            'error'           => $curlError,
                        ]);
                        sleep($espera);
                        continue;
                    }
                    KamplesLogger::error('Stripe API: error de red tras agotar reintentos', [
                        'endpoint'  => $endpoint,
                        'intentos'  => self::MAX_REINTENTOS,
                        'error'     => $curlError,
                        'accountId' => $accountId,
                    ]);
                    return ['error' => 'Error de conexión con Stripe: ' . $curlError];
                }

                $data = JsonHelper::decodeOrDefault($response, []);

                /* HTTP 5xx — error transitorio del servidor, reintentar */
                if ($httpCode >= 500) {
                    $ultimoError = $data['error']['message'] ?? "HTTP {$httpCode}";
                    if ($intento < self::MAX_REINTENTOS) {
                        $espera = (int) pow(2, $intento - 1);
                        KamplesLogger::warning('Stripe API: respuesta 5xx, reintentando', [
                            'endpoint'        => $endpoint,
                            'httpCode'        => $httpCode,
                            'intento'         => $intento,
                            'maxIntentos'     => self::MAX_REINTENTOS,
                            'esperaSegundos'  => $espera,
                            'error'           => $ultimoError,
                        ]);
                        sleep($espera);
                        continue;
                    }
                    /* Agotados reintentos en 5xx — cae al log de error abajo */
                }

                /* HTTP 4xx — error del cliente, NO reintentar */
                if ($httpCode >= 400) {
                    $contexto = [
                        'endpoint' => $endpoint,
                        'httpCode' => $httpCode,
                        'error'    => $data['error']['message'] ?? 'desconocido',
                    ];
                    if ($accountId) {
                        $contexto['accountId'] = $accountId;
                    }
                    if ($intento > 1) {
                        $contexto['intentosUsados'] = $intento;
                    }
                    KamplesLogger::error('Stripe API error', $contexto);
                }

                return $data;
            } catch (\Throwable $e) {
                $ultimoError = $e->getMessage();
                if ($intento < self::MAX_REINTENTOS) {
                    $espera = (int) pow(2, $intento - 1);
                    KamplesLogger::warning('Stripe API: excepción transitoria, reintentando', [
                        'endpoint'        => $endpoint,
                        'intento'         => $intento,
                        'maxIntentos'     => self::MAX_REINTENTOS,
                        'esperaSegundos'  => $espera,
                        'error'           => $ultimoError,
                    ]);
                    sleep($espera);
                    continue;
                }
                KamplesLogger::error('Stripe API: excepción inesperada tras agotar reintentos', [
                    'endpoint'  => $endpoint,
                    'intentos'  => self::MAX_REINTENTOS,
                    'error'     => $e->getMessage(),
                    'accountId' => $accountId,
                ]);
                return ['error' => 'Error interno en petición a Stripe'];
            } finally {
                if ($ch instanceof \CurlHandle) {
                    curl_close($ch);
                }
            }
        }

        /* Fallback de seguridad — no debería llegar aquí */
        KamplesLogger::error('Stripe API: reintentos agotados sin respuesta', [
            'endpoint'    => $endpoint,
            'intentos'    => self::MAX_REINTENTOS,
            'ultimoError' => $ultimoError,
        ]);
        return ['error' => 'Error de conexión con Stripe tras ' . self::MAX_REINTENTOS . ' intentos'];
    }

    /**
     * Crea una sesión de Checkout para suscripción.
     */
    public static function crearCheckoutSession(int $userId, string $plan, string $urlExito, string $urlCancelar): array
    {
        $priceId = self::obtenerPriceId($plan);
        if (!$priceId) {
            return ['error' => "Plan '{$plan}' no tiene price_id configurado"];
        }

        /* Obtener o crear Stripe Customer */
        $customerId = self::obtenerOCrearCustomer($userId);
        if (!$customerId) {
            return ['error' => 'No se pudo crear/obtener el customer de Stripe'];
        }

        $params = [
            'mode'                => 'subscription',
            'customer'            => $customerId,
            'line_items[0][price]' => $priceId,
            'line_items[0][quantity]' => 1,
            'success_url'         => $urlExito . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'          => $urlCancelar,
            'metadata[user_id]'   => $userId,
            'metadata[plan]'      => $plan,
        ];

        return self::request('POST', '/checkout/sessions', $params);
    }

    /**
     * Crea una sesión de Checkout para compra individual de sample (one-time payment).
     * Usa modo 'payment' en vez de 'subscription'.
     *
     * @param int    $userId     ID del comprador
     * @param int    $sampleId   ID del sample a comprar
     * @param string $titulo     Título del sample (para mostrar en Stripe)
     * @param float  $precio     Precio en USD
     * @param int    $creadorId  ID del creador (metadata para webhook)
     * @param string $urlExito   URL de éxito post-pago
     * @param string $urlCancelar URL si cancela
     */
    public static function crearCheckoutSample(
        int $userId,
        int $sampleId,
        string $titulo,
        float $precio,
        int $creadorId,
        string $urlExito,
        string $urlCancelar
    ): array {
        $customerId = self::obtenerOCrearCustomer($userId);
        if (!$customerId) {
            return ['error' => 'No se pudo crear/obtener el customer de Stripe'];
        }

        /* Stripe espera el monto en centavos */
        $montoCentavos = (int) round($precio * 100);

        if ($montoCentavos < 50) {
            return ['error' => 'El precio mínimo es $0.50 USD'];
        }

        $params = [
            'mode'                            => 'payment',
            'customer'                        => $customerId,
            'line_items[0][price_data][currency]'    => 'usd',
            'line_items[0][price_data][unit_amount]' => $montoCentavos,
            'line_items[0][price_data][product_data][name]' => $titulo,
            'line_items[0][quantity]'          => 1,
            'success_url'                     => $urlExito . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'                      => $urlCancelar,
            'metadata[tipo]'                  => 'compra_sample',
            'metadata[user_id]'               => $userId,
            'metadata[sample_id]'             => $sampleId,
            'metadata[creador_id]'            => $creadorId,
            'metadata[precio]'                => $precio,
        ];

        return self::request('POST', '/checkout/sessions', $params);
    }

    /**
     * Crea un enlace al Customer Portal de Stripe.
     */
    public static function crearPortalSession(int $userId, string $urlRetorno): array
    {
        $customerId = self::obtenerCustomerId($userId);
        if (!$customerId) {
            return ['error' => 'Usuario sin customer de Stripe'];
        }

        return self::request('POST', '/billing_portal/sessions', [
            'customer'   => $customerId,
            'return_url' => $urlRetorno,
        ]);
    }

    /**
     * Crea una cuenta Connect para un creador (onboarding).
     */
    public static function crearCuentaConnect(int $userId, string $email): array
    {
        $cuenta = self::request('POST', '/accounts', [
            'type'                    => 'express',
            'email'                   => $email,
            'metadata[user_id]'       => $userId,
            'capabilities[transfers][requested]' => 'true',
        ]);

        if (isset($cuenta['id'])) {
            UsuariosExtRepository::guardarStripeConnectId($userId, $cuenta['id']);
        }

        return $cuenta;
    }

    /**
     * Genera el enlace de onboarding para Connect.
     */
    public static function crearEnlaceOnboarding(string $accountId, string $urlRetorno, string $urlRefresh): array
    {
        return self::request('POST', '/account_links', [
            'account'     => $accountId,
            'type'        => 'account_onboarding',
            'return_url'  => $urlRetorno,
            'refresh_url' => $urlRefresh,
        ]);
    }

    /**
     * Realiza una transferencia al creador (revenue share).
     */
    public static function transferirACreador(int $creadorId, int $monto, string $moneda = 'usd', string $descripcion = ''): array
    {
        $connectId = UsuariosExtRepository::obtenerStripeConnectIdPorUsuario($creadorId);

        if (!$connectId) {
            return ['error' => 'Creador sin cuenta Connect configurada'];
        }

        return self::request('POST', '/transfers', [
            'amount'      => $monto,
            'currency'    => $moneda,
            'destination' => $connectId,
            'description' => $descripcion,
        ]);
    }

    /**
     * Obtiene la cuenta Connect de un creador.
     */
    public static function obtenerCuentaConnect(string $accountId): array
    {
        return self::request('GET', '/accounts/' . $accountId);
    }

    /**
     * Genera un login_link al Stripe Express Dashboard para el creador.
     */
    public static function crearLoginLink(string $accountId): array
    {
        return self::request('POST', '/accounts/' . $accountId . '/login_links');
    }

    /**
     * Obtiene el balance de una cuenta Connect (disponible + pendiente).
     * Usa el header Stripe-Account para consultar la cuenta conectada.
     */
    public static function obtenerBalanceConnect(string $accountId): array
    {
        return self::request('GET', '/balance', [], $accountId);
    }

    /**
     * Obtiene la configuración del plan.
     */
    public static function obtenerConfigPlan(string $plan): array
    {
        return self::PLANES[$plan] ?? self::PLANES['free'];
    }

    /**
     * Calcula revenue share para compra individual de sample.
     * Retorna array con pagoCreador y comisionPlataforma basado en el plan del creador.
     * El creador recibe su revenue_share del precio; la plataforma el resto.
     */
    public static function calcularRevenueShareSample(float $precio, string $planCreador): array
    {
        $config = self::obtenerConfigPlan($planCreador);
        $share = $config['revenue_share'] ?? 0.70;

        return [
            'pagoCreador'        => round($precio * $share, 2),
            'comisionPlataforma' => round($precio * (1 - $share), 2),
        ];
    }

    /**
     * Verifica si un webhook es válido.
     * Comprueba firma HMAC y que el timestamp no exceda 5 minutos (replay attack).
     */
    public static function verificarWebhook(string $payload, string $signature): bool
    {
        $secret = $_ENV['GLORY_STRIPE_WEBHOOK_SECRET'] ?? getenv('GLORY_STRIPE_WEBHOOK_SECRET')
            ?: $_ENV['STRIPE_WEBHOOK_SECRET'] ?? getenv('STRIPE_WEBHOOK_SECRET') ?: null;
        if (!$secret) return false;

        $elementos = [];
        foreach (explode(',', $signature) as $parte) {
            $partes = explode('=', $parte, 2);
            if (count($partes) !== 2) continue;
            $elementos[$partes[0]] = $partes[1];
        }

        $timestamp = $elementos['t'] ?? '';
        $sig = $elementos['v1'] ?? '';

        if (empty($timestamp) || empty($sig)) {
            KamplesLogger::warning('Webhook Stripe: firma incompleta (falta t o v1)');
            return false;
        }

        /* Protección contra replay attack: rechazar webhooks con más de 5 minutos */
        $tolerancia = 300;
        if (abs(time() - (int) $timestamp) > $tolerancia) {
            KamplesLogger::warning('Webhook Stripe: timestamp fuera de tolerancia (posible replay)', [
                'timestamp' => $timestamp,
                'diferencia' => abs(time() - (int) $timestamp),
            ]);
            return false;
        }

        $expectedSig = \hash_hmac('sha256', "{$timestamp}.{$payload}", $secret);

        return \hash_equals($expectedSig, $sig);
    }

    /* Helpers privados */

    private static function obtenerPriceId(string $plan): ?string
    {
        $key = 'STRIPE_PRICE_' . strtoupper($plan);
        $keyGlory = 'GLORY_' . $key;
        return $_ENV[$keyGlory] ?? getenv($keyGlory)
            ?: $_ENV[$key] ?? getenv($key) ?: null;
    }

    private static function obtenerCustomerId(int $userId): ?string
    {
        return UsuariosExtRepository::obtenerStripeCustomerId($userId);
    }

    private static function obtenerOCrearCustomer(int $userId): ?string
    {
        $existing = self::obtenerCustomerId($userId);
        if ($existing) return $existing;

        $usuario = UsuariosExtRepository::obtenerDatosStripe($userId);

        if (!$usuario) return null;

        $customer = self::request('POST', '/customers', [
            'email'              => $usuario[UsuariosExtCols::EMAIL],
            'name'               => $usuario[UsuariosExtCols::NOMBRE_VISIBLE] ?? $usuario[UsuariosExtCols::USERNAME],
            'metadata[user_id]'  => $userId,
        ]);

        if (isset($customer['id'])) {
            UsuariosExtRepository::guardarStripeCustomerId($userId, $customer['id']);
            return $customer['id'];
        }

        return null;
    }
}
