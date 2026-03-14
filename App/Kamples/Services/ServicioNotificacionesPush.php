<?php

/**
 * ServicioNotificacionesPush — Envío de notificaciones push via Web Push API (VAPID).
 *
 * Self-hosted, sin dependencia de Firebase/FCM.
 * Usa la librería minishlink/web-push para enviar pushes cifrados
 * a todos los navegadores/WebViews que soporten Push API.
 *
 * Claves VAPID se almacenan en env vars:
 * - KAMPLES_VAPID_PUBLIC_KEY  (base64url, se comparte con el frontend)
 * - KAMPLES_VAPID_PRIVATE_KEY (base64url, secreto del servidor)
 * - KAMPLES_VAPID_SUBJECT     (mailto: o URL del sitio)
 *
 * QK86: Infraestructura de notificaciones push para Android/web/desktop.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\PushSubscriptionsRepository;
use App\Kamples\KamplesLogger;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class ServicioNotificacionesPush
{
    private static ?WebPush $webPush = null;

    /**
     * Obtener la clave publica VAPID para el frontend.
     * El frontend la necesita para registrar el Service Worker.
     */
    public static function obtenerClavePublica(): ?string
    {
        $clave = $_ENV['KAMPLES_VAPID_PUBLIC_KEY'] ?? getenv('KAMPLES_VAPID_PUBLIC_KEY') ?: '';
        return $clave !== '' ? $clave : null;
    }

    /**
     * Enviar push notification a todos los dispositivos de un usuario.
     *
     * @param int    $userId  ID PG del usuario destinatario
     * @param string $titulo  Titulo de la notificacion (ej: "Nuevo like")
     * @param string $mensaje Cuerpo de la notificacion
     * @param array  $datos   Datos extra para el click handler (enlace, tipo, etc.)
     */
    public static function enviarAUsuario(int $userId, string $titulo, string $mensaje, array $datos = []): void
    {
        $suscripciones = PushSubscriptionsRepository::obtenerPorUsuario($userId);
        if (empty($suscripciones)) {
            return;
        }

        $webPush = self::obtenerInstancia();
        if ($webPush === null) {
            return;
        }

        $payload = json_encode([
            'title'   => $titulo,
            'body'    => $mensaje,
            'icon'    => '/wp-content/themes/glorytemplate/App/Assets/images/icon-192.png',
            'badge'   => '/wp-content/themes/glorytemplate/App/Assets/images/badge-72.png',
            'data'    => $datos,
            'tag'     => $datos['tipo'] ?? 'general',
        ], JSON_UNESCAPED_UNICODE);

        if ($payload === false) {
            KamplesLogger::error('[Push] json_encode falló para notificación', [
                'userId' => $userId,
                'titulo' => $titulo,
            ]);
            return;
        }

        foreach ($suscripciones as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub['endpoint'],
                    'publicKey' => $sub['p256dh'],
                    'authToken' => $sub['auth'],
                ]);

                $webPush->queueNotification($subscription, $payload);
            } catch (\Throwable $e) {
                KamplesLogger::warning('[Push] Error preparando suscripción', [
                    'endpoint' => substr($sub['endpoint'], 0, 80),
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        /* Enviar en batch y procesar resultados */
        try {
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();

                if ($report->isSuccess()) {
                    continue;
                }

                /* 410 Gone o 404 Not Found = endpoint expirado, desactivar */
                $statusCode = $report->getResponse()?->getStatusCode();
                if ($statusCode === 410 || $statusCode === 404) {
                    PushSubscriptionsRepository::marcarInactiva($endpoint);
                    KamplesLogger::info('[Push] Endpoint expirado, desactivado', [
                        'endpoint' => substr($endpoint, 0, 80),
                        'status'   => $statusCode,
                    ]);
                } else {
                    KamplesLogger::warning('[Push] Fallo de envío', [
                        'endpoint' => substr($endpoint, 0, 80),
                        'status'   => $statusCode,
                        'reason'   => $report->getReason(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('[Push] Error en flush de notificaciones', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
            ]);
        }
    }

    /**
     * Enviar push a multiples usuarios (batch).
     * Usado para notificaciones masivas (nuevos features, mantenimiento, etc.)
     */
    public static function enviarAMultiples(array $userIds, string $titulo, string $mensaje, array $datos = []): void
    {
        foreach ($userIds as $userId) {
            self::enviarAUsuario((int) $userId, $titulo, $mensaje, $datos);
        }
    }

    /**
     * Verificar si el sistema de push esta configurado.
     * Usado por el frontend para saber si mostrar el UI de suscripción.
     */
    public static function estaConfigurado(): bool
    {
        $publicKey = $_ENV['KAMPLES_VAPID_PUBLIC_KEY'] ?? getenv('KAMPLES_VAPID_PUBLIC_KEY') ?: '';
        $privateKey = $_ENV['KAMPLES_VAPID_PRIVATE_KEY'] ?? getenv('KAMPLES_VAPID_PRIVATE_KEY') ?: '';
        return $publicKey !== '' && $privateKey !== '';
    }

    /**
     * Lazily obtener/crear la instancia de WebPush.
     * Retorna null si las claves VAPID no estan configuradas (graceful degradation).
     */
    private static function obtenerInstancia(): ?WebPush
    {
        if (self::$webPush !== null) {
            return self::$webPush;
        }

        $publicKey  = $_ENV['KAMPLES_VAPID_PUBLIC_KEY'] ?? getenv('KAMPLES_VAPID_PUBLIC_KEY') ?: '';
        $privateKey = $_ENV['KAMPLES_VAPID_PRIVATE_KEY'] ?? getenv('KAMPLES_VAPID_PRIVATE_KEY') ?: '';
        $subject    = $_ENV['KAMPLES_VAPID_SUBJECT'] ?? getenv('KAMPLES_VAPID_SUBJECT') ?: 'https://kamples.com';

        if ($publicKey === '' || $privateKey === '') {
            KamplesLogger::debug('[Push] VAPID keys no configuradas — push deshabilitado');
            return null;
        }

        try {
            self::$webPush = new WebPush([
                'VAPID' => [
                    'subject'    => $subject,
                    'publicKey'  => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ]);
            /* Timeout de 5s para no bloquear la respuesta del request */
            self::$webPush->setDefaultOptions(['timeout' => 5]);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Push] Error inicializando WebPush', [
                'error' => $e->getMessage(),
            ]);
            self::$webPush = null;
        }

        return self::$webPush;
    }
}
