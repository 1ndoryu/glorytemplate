<?php

/**
 * WsController — Endpoint para tickets WebSocket.
 *
 * Genera un ticket HMAC de corta duración para autenticar
 * la conexión WebSocket desde el cliente (web o desktop).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Services\NotificadorWebSocket;

class WsController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/ws/ticket', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'generarTicket'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * GET /kamples/v1/ws/ticket
     * Retorna un ticket HMAC para conectar al servidor WebSocket.
     * Válido por 120 segundos.
     */
    public static function generarTicket(): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            /* [193A-99] Rate limiting — 60 tickets/hora por usuario para evitar spam de conexiones */
            $limitResp = RateLimiter::verificarUsuario($userId, 'ws_ticket', 60, 3600);
            if ($limitResp) return $limitResp;

            $ticket = NotificadorWebSocket::generarTicket($userId);
            if (!$ticket) {
                return new \WP_REST_Response([
                    'code'    => 'ws_no_configurado',
                    'message' => 'WebSocket no configurado en este servidor',
                ], 503);
            }

            $wsUrl = $_ENV['KAMPLES_WS_PUBLIC_URL'] ?? getenv('KAMPLES_WS_PUBLIC_URL') ?: '';

            return new \WP_REST_Response([
                'ticket' => $ticket,
                'url'    => $wsUrl ?: null,
                'ttl'    => 120,
            ], 200);
        } catch (\Throwable $e) {
            return new \WP_REST_Response([
                'code'    => 'error_interno',
                'message' => 'Error generando ticket WebSocket',
            ], 500);
        }
    }
}
