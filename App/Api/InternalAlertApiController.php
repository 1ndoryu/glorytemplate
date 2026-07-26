<?php

namespace App\Api;

use App\Repository\WhatsApp\WhatsAppOutboundRepository;
use App\Services\InternalAlertSignatureService;

final class InternalAlertApiController
{
    public static function register(): void
    {
        add_action('rest_api_init', static function (): void {
            register_rest_route('glory/v1', '/internal/alerts', [
                'methods' => 'POST',
                'callback' => [self::class, 'receive'],
                'permission_callback' => '__return_true',
            ]);
        });
    }

    public static function receive(\WP_REST_Request $request): \WP_REST_Response
    {
        $body = $request->get_body();
        try {
            InternalAlertSignatureService::verify($body, $request->get_headers());
            $payload = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
            self::validatePayload($payload, (string)$request->get_header('X-Glory-Idempotency-Key'));
            $label = sanitize_text_field((string)$payload['visitorLabel']);
            $preview = sanitize_textarea_field((string)$payload['preview']);
            $url = esc_url_raw((string)$payload['panelUrl']);
            $message = "💬 Nuevo mensaje de {$label}\n{$preview}\n{$url}";
            WhatsAppOutboundRepository::enqueue(
                (string)$payload['idempotencyKey'],
                (string)$payload['event'],
                $payload,
                $message
            );
            return new \WP_REST_Response(['accepted' => true], 202);
        } catch (\LengthException $error) {
            return new \WP_REST_Response(['error' => 'payload_too_large'], 413);
        } catch (\UnexpectedValueException $error) {
            return new \WP_REST_Response(['error' => 'unauthorized'], 401);
        } catch (\JsonException|\InvalidArgumentException $error) {
            return new \WP_REST_Response(['error' => 'invalid_payload'], 400);
        } catch (\Throwable $error) {
            error_log('[InternalAlertApi] Gateway no disponible: ' . $error->getMessage());
            return new \WP_REST_Response(['error' => 'gateway_unavailable'], 503);
        }
    }

    private static function validatePayload($payload, string $headerKey): void
    {
        if (!is_array($payload) || ($payload['event'] ?? '') !== 'chat.client_message') {
            throw new \InvalidArgumentException('Evento inválido');
        }
        $key = (string)($payload['idempotencyKey'] ?? '');
        if ($key === '' || strlen($key) > 191 || !hash_equals($key, $headerKey)) {
            throw new \InvalidArgumentException('Idempotencia inválida');
        }
        foreach (['messageId', 'sessionId'] as $field) {
            if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', (string)($payload[$field] ?? ''))) {
                throw new \InvalidArgumentException('UUID inválido');
            }
        }
        $label = (string)($payload['visitorLabel'] ?? '');
        $preview = (string)($payload['preview'] ?? '');
        if ($label === '' || mb_strlen($label) > 120 || mb_strlen($preview) > 500) {
            throw new \InvalidArgumentException('Contenido inválido');
        }
        $url = wp_parse_url((string)($payload['panelUrl'] ?? ''));
        if (($url['scheme'] ?? '') !== 'https' || strtolower((string)($url['host'] ?? '')) !== 'nakomi.studio') {
            throw new \InvalidArgumentException('URL inválida');
        }
    }
}

InternalAlertApiController::register();
