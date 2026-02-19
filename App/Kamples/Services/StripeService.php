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

class StripeService
{
    private const API_BASE = 'https://api.stripe.com/v1';

    /* Configuración de planes — subidas ilimitadas en todos, varía transferencia y descargas */
    private const PLANES = [
        'pro' => [
            'precio_mensual'    => 5.00,
            'descargas_dia'     => 50,
            'subidas_mes'       => -1, /* ilimitadas */
            'transferencia_gb'  => 10,
            'revenue_share'     => 0.70,
        ],
        'premium' => [
            'precio_mensual'    => 19.99,
            'descargas_dia'     => -1, /* ilimitadas */
            'subidas_mes'       => -1,
            'transferencia_gb'  => 50,
            'revenue_share'     => 0.80,
        ],
        'free' => [
            'precio_mensual'    => 0,
            'descargas_dia'     => 5,
            'subidas_mes'       => -1, /* ilimitadas */
            'transferencia_gb'  => 1,
            'revenue_share'     => 0,
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
     * Realiza una petición HTTP a la API de Stripe.
     * @param string $accountId ID de cuenta Connect (header Stripe-Account) — null para cuenta principal.
     */
    private static function request(string $method, string $endpoint, array $params = [], ?string $accountId = null): array
    {
        $secretKey = self::obtenerSecretKey();
        if (!$secretKey) {
            return ['error' => 'Stripe no configurado'];
        }

        $url = self::API_BASE . $endpoint;

        $headers = [
            'Authorization: Bearer ' . $secretKey,
            'Content-Type: application/x-www-form-urlencoded',
        ];

        if ($accountId) {
            $headers[] = 'Stripe-Account: ' . $accountId;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

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

        /* Verificar error de red/curl antes de decodificar */
        if ($response === false) {
            KamplesLogger::error('Stripe API: error de red (curl)', [
                'endpoint' => $endpoint,
                'error' => $curlError,
                'accountId' => $accountId,
            ]);
            return ['error' => 'Error de conexión con Stripe: ' . $curlError];
        }

        $data = json_decode($response, true) ?? [];

        if ($httpCode >= 400) {
            $contexto = [
                'endpoint' => $endpoint,
                'httpCode' => $httpCode,
                'error'    => $data['error']['message'] ?? 'desconocido',
            ];
            if ($accountId) $contexto['accountId'] = $accountId;
            KamplesLogger::error('Stripe API error', $contexto);
        }

        return $data;
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
