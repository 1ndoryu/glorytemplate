<?php

/**
 * FcmController — Endpoints REST para tokens Firebase Cloud Messaging.
 *
 * Permite registrar y eliminar tokens FCM para notificaciones push Android.
 * QL34: FCM para Android nativo (app cerrada).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Database\Repositories\FcmTokensRepository;
use App\Kamples\KamplesLogger;

class FcmController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/fcm/registrar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'registrar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/fcm/eliminar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'eliminar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * POST /fcm/registrar — Registrar token FCM del dispositivo.
     * Body: { token: string, plataforma?: string }
     */
    public static function registrar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $token = sanitize_text_field($request->get_param('token') ?? '');
            $plataforma = sanitize_text_field($request->get_param('plataforma') ?? 'android');

            if ($token === '') {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Token requerido'], 400);
            }

            /* Validar plataforma contra whitelist */
            $plataformasValidas = ['android', 'web', 'ios'];
            if (!in_array($plataforma, $plataformasValidas, true)) {
                $plataforma = 'android';
            }

            /* [183A-43] Obtener usuario PG actual. obtenerActual() no existe en UsuarioHelper;
             * el método correcto es obtenerPorWpId() que lee el WP user_id del JWT/nonce. */
            $usuario = UsuarioHelper::obtenerPorWpId();
            if (!$usuario) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Usuario no encontrado'], 404);
            }

            FcmTokensRepository::registrar((int) $usuario['id'], $token, $plataforma);

            return new \WP_REST_Response(['ok' => true]);
        } catch (\Throwable $e) {
            KamplesLogger::error('FcmController::registrar error', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /fcm/eliminar — Eliminar token FCM (logout).
     * Body: { token: string }
     */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $token = sanitize_text_field($request->get_param('token') ?? '');

            if ($token === '') {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Token requerido'], 400);
            }

            FcmTokensRepository::eliminar($token);

            return new \WP_REST_Response(['ok' => true]);
        } catch (\Throwable $e) {
            KamplesLogger::error('FcmController::eliminar error', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }
}
