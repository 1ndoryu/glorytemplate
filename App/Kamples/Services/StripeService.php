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

use App\Kamples\Database\PostgresService;
use App\Kamples\KamplesLogger;

class StripeService
{
    private const API_BASE = 'https://api.stripe.com/v1';

    /* IDs de precios de Stripe (configurar en .env o aquí) */
    private const PLANES = [
        'pro' => [
            'precio_mensual' => 9.99,
            'descargas_dia'  => 50,
            'subidas_mes'    => 100,
            'revenue_share'  => 0.70,
        ],
        'premium' => [
            'precio_mensual' => 19.99,
            'descargas_dia'  => -1, /* ilimitadas */
            'subidas_mes'    => -1,
            'revenue_share'  => 0.80,
        ],
        'free' => [
            'precio_mensual' => 0,
            'descargas_dia'  => 5,
            'subidas_mes'    => 10,
            'revenue_share'  => 0,
        ],
    ];

    /**
     * Obtiene la secret key de Stripe desde .env.
     */
    private static function obtenerSecretKey(): ?string
    {
        $key = $_ENV['STRIPE_SECRET_KEY'] ?? getenv('STRIPE_SECRET_KEY') ?: null;
        if (!$key) {
            KamplesLogger::warning('STRIPE_SECRET_KEY no configurada en .env');
        }
        return $key;
    }

    /**
     * Realiza una petición HTTP a la API de Stripe.
     */
    private static function request(string $method, string $endpoint, array $params = []): array
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
        curl_close($ch);

        $data = json_decode($response, true) ?? [];

        if ($httpCode >= 400) {
            KamplesLogger::error('Stripe API error', [
                'endpoint' => $endpoint,
                'httpCode' => $httpCode,
                'error'    => $data['error']['message'] ?? 'desconocido',
            ]);
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
            PostgresService::ejecutar(
                "UPDATE usuarios_ext SET stripe_connect_id = :connectId WHERE id = :userId",
                ['connectId' => $cuenta['id'], 'userId' => $userId]
            );
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
        $connectId = PostgresService::consultarUno(
            "SELECT stripe_connect_id FROM usuarios_ext WHERE id = :id",
            ['id' => $creadorId]
        );

        if (!$connectId || empty($connectId['stripe_connect_id'])) {
            return ['error' => 'Creador sin cuenta Connect configurada'];
        }

        return self::request('POST', '/transfers', [
            'amount'      => $monto,
            'currency'    => $moneda,
            'destination' => $connectId['stripe_connect_id'],
            'description' => $descripcion,
        ]);
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
     */
    public static function verificarWebhook(string $payload, string $signature): bool
    {
        $secret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? getenv('STRIPE_WEBHOOK_SECRET') ?: null;
        if (!$secret) return false;

        $elementos = [];
        foreach (explode(',', $signature) as $parte) {
            [$clave, $valor] = explode('=', $parte, 2);
            $elementos[$clave] = $valor;
        }

        $timestamp = $elementos['t'] ?? '';
        $sig = $elementos['v1'] ?? '';

        $expectedSig = hash_hmac('sha256', "{$timestamp}.{$payload}", $secret);

        return hash_equals($expectedSig, $sig);
    }

    /* Helpers privados */

    private static function obtenerPriceId(string $plan): ?string
    {
        $key = 'STRIPE_PRICE_' . strtoupper($plan);
        return $_ENV[$key] ?? getenv($key) ?: null;
    }

    private static function obtenerCustomerId(int $userId): ?string
    {
        $row = PostgresService::consultarUno(
            "SELECT stripe_customer_id FROM usuarios_ext WHERE id = :id",
            ['id' => $userId]
        );
        return $row['stripe_customer_id'] ?? null;
    }

    private static function obtenerOCrearCustomer(int $userId): ?string
    {
        $existing = self::obtenerCustomerId($userId);
        if ($existing) return $existing;

        $usuario = PostgresService::consultarUno(
            "SELECT email, nombre_visible, username FROM usuarios_ext WHERE id = :id",
            ['id' => $userId]
        );

        if (!$usuario) return null;

        $customer = self::request('POST', '/customers', [
            'email'              => $usuario['email'],
            'name'               => $usuario['nombre_visible'] ?? $usuario['username'],
            'metadata[user_id]'  => $userId,
        ]);

        if (isset($customer['id'])) {
            PostgresService::ejecutar(
                "UPDATE usuarios_ext SET stripe_customer_id = :customerId WHERE id = :id",
                ['customerId' => $customer['id'], 'id' => $userId]
            );
            return $customer['id'];
        }

        return null;
    }
}
