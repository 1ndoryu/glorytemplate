<?php

namespace App\Services;

final class InternalAlertSignatureService
{
    public static function verify(string $body, array $headers): void
    {
        if (strlen($body) > 16384) {
            throw new \LengthException('Payload demasiado grande');
        }
        $secret = EnvService::get('GLORY_INTERNAL_ALERT_SECRET');
        if (strlen($secret) < 32) {
            throw new \RuntimeException('Gateway no configurado');
        }
        /* [267A-9] WP_REST_Request canonicaliza nombres a snake_case en
         * get_headers(); aceptar ambas formas evita rechazar firmas validas. */
        $timestamp = self::headerValue($headers, 'x-glory-timestamp');
        $nonce = self::headerValue($headers, 'x-glory-nonce');
        $signature = strtolower(self::headerValue($headers, 'x-glory-signature'));
        if (!ctype_digit($timestamp) || abs(time() - (int)$timestamp) > 300) {
            throw new \UnexpectedValueException('Timestamp inválido');
        }
        if (!preg_match('/^[A-Za-z0-9_-]{16,128}$/', $nonce) || !preg_match('/^[a-f0-9]{64}$/', $signature)) {
            throw new \UnexpectedValueException('Firma inválida');
        }
        $canonical = "POST\n/wp-json/glory/v1/internal/alerts\n{$timestamp}\n{$nonce}\n" . hash('sha256', $body);
        if (!hash_equals(hash_hmac('sha256', $canonical, $secret), $signature)) {
            throw new \UnexpectedValueException('Firma inválida');
        }
        self::claimNonce($nonce);
    }

    private static function headerValue(array $headers, string $name): string
    {
        $normalized = strtolower(str_replace('-', '_', $name));
        $value = $headers[$normalized] ?? $headers[strtolower($name)] ?? '';
        if (is_array($value)) {
            $value = $value[0] ?? '';
        }
        return is_scalar($value) ? (string)$value : '';
    }

    private static function claimNonce(string $nonce): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'glory_internal_alert_nonces';
        $wpdb->query("DELETE FROM {$table} WHERE expires_at < UTC_TIMESTAMP() LIMIT 100");
        $inserted = $wpdb->query($wpdb->prepare(
            "INSERT IGNORE INTO {$table} (nonce, expires_at, created_at) VALUES (%s, UTC_TIMESTAMP() + INTERVAL 10 MINUTE, UTC_TIMESTAMP())",
            $nonce
        ));
        if ($inserted !== 1) {
            throw new \UnexpectedValueException('Nonce repetido');
        }
    }
}
