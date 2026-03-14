<?php

/**
 * NotificadorWebSocket — Bridge PHP → Bun WS Server.
 *
 * Envía eventos al servidor WebSocket para push en tiempo real.
 * Fire-and-forget con timeout corto: si el WS server no responde,
 * se loguea y el cliente cae a polling fallback automáticamente.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\KamplesLogger;

class NotificadorWebSocket
{
    private static ?string $url = null;
    private static ?string $secret = null;

    /**
     * Genera un ticket HMAC para autenticación WebSocket.
     * Formato: "userId.expiry.hmacSignature"
     * Válido por $ttl segundos (default 120).
     */
    public static function generarTicket(int $userId, int $ttl = 120): ?string
    {
        $ticketSecret = self::obtenerTicketSecret();
        if (!$ticketSecret) {
            return null;
        }

        $expiry = time() + $ttl;
        $mensaje = "{$userId}.{$expiry}";
        $firma = hash_hmac('sha256', $mensaje, $ticketSecret);

        return "{$userId}.{$expiry}.{$firma}";
    }

    /**
     * Notifica un evento al servidor WebSocket.
     * Fire-and-forget: no bloquea el response de WordPress.
     *
     * @param string $tipo           Tipo de evento (mensaje_nuevo, notificacion, etc.)
     * @param int[]  $destinatarios  IDs de usuarios destino
     * @param array  $datos          Payload del evento
     */
    public static function notificar(string $tipo, array $destinatarios, array $datos): void
    {
        $url = self::obtenerUrl();
        $secret = self::obtenerSecret();

        if (!$url || !$secret) {
            return;
        }

        $payload = json_encode([
            'secret'        => $secret,
            'tipo'          => $tipo,
            'destinatarios' => $destinatarios,
            'datos'         => $datos,
        ]);

        if ($payload === false) {
            KamplesLogger::error('[WS Notificador] json_encode falló', ['tipo' => $tipo]);
            return;
        }

        try {
            $ch = curl_init($url);
            if ($ch === false) {
                KamplesLogger::error('[WS Notificador] curl_init falló');
                return;
            }

            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 2,
                CURLOPT_CONNECTTIMEOUT => 1,
                CURLOPT_NOSIGNAL       => true,
            ]);

            $resultado = curl_exec($ch);
            $error = curl_error($ch);
            curl_close($ch);

            if ($resultado === false) {
                KamplesLogger::warning('[WS Notificador] Curl error (WS server caído?)', [
                    'error' => $error,
                    'tipo'  => $tipo,
                ]);
            }
        } catch (\Throwable $e) {
            KamplesLogger::warning('[WS Notificador] Error enviando notificación', [
                'error' => $e->getMessage(),
                'tipo'  => $tipo,
            ]);
        }
    }

    private static function obtenerUrl(): ?string
    {
        if (self::$url === null) {
            $url = $_ENV['KAMPLES_WS_NOTIFY_URL'] ?? getenv('KAMPLES_WS_NOTIFY_URL') ?: '';
            self::$url = $url ?: null;
        }
        return self::$url;
    }

    private static function obtenerSecret(): ?string
    {
        if (self::$secret === null) {
            $secret = $_ENV['KAMPLES_WS_INTERNAL_SECRET'] ?? getenv('KAMPLES_WS_INTERNAL_SECRET') ?: '';
            self::$secret = $secret ?: null;
        }
        return self::$secret;
    }

    private static function obtenerTicketSecret(): ?string
    {
        $secret = $_ENV['KAMPLES_WS_TICKET_SECRET'] ?? getenv('KAMPLES_WS_TICKET_SECRET') ?: '';
        return $secret ?: null;
    }
}
