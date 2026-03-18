<?php

namespace App\Kamples\Api\Controladores;

use App\Kamples\KamplesLogger;

class GoogleAuthMobileController
{
    private const TTL_ESTADO = 600;
    private const CLAVE_TRANSIENT_PREFIJO = 'kamples_google_mobile_';

    /* [173A-8] Completa el callback OAuth móvil para Capacitor.
     * Guardamos el resultado en transient para polling y además redirigimos al deep link nativo.
     * Gotcha: el navegador externo y el WebView no comparten cookies, por eso la app consume JWT. */
    public static function mobileCallback(\WP_REST_Request $request): \WP_REST_Response
    {
        $requestId = null;

        try {
            $stateDecodificado = self::decodificarState((string) ($request->get_param('state') ?? ''));
            if ($stateDecodificado === null) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => 'State inválido en callback OAuth móvil.',
                ], 400);
            }

            $requestId = $stateDecodificado['requestId'];
            $error = sanitize_text_field((string) ($request->get_param('error') ?? ''));
            if ($error !== '') {
                $mensaje = sanitize_text_field((string) ($request->get_param('error_description') ?? $error));
                self::guardarEstado($requestId, [
                    'estado' => 'error',
                    'error' => $mensaje,
                ]);
                self::redirigirDeepLink(null, $mensaje);
                return new \WP_REST_Response(['ok' => false, 'error' => $mensaje], 400);
            }

            $code = sanitize_text_field((string) ($request->get_param('code') ?? ''));
            if ($code === '') {
                self::guardarEstado($requestId, [
                    'estado' => 'error',
                    'error' => 'Google no devolvió un authorization code.',
                ]);
                self::redirigirDeepLink(null, 'Google no devolvió un authorization code.');
                return new \WP_REST_Response(['ok' => false, 'error' => 'Google no devolvió un authorization code.'], 400);
            }

            $idToken = GoogleAuthController::intercambiarCodigoGooglePorIdToken(
                $code,
                $stateDecodificado['codeVerifier'],
                self::obtenerRedirectUri()
            );

            if ($idToken === null) {
                self::guardarEstado($requestId, [
                    'estado' => 'error',
                    'error' => 'No se pudo intercambiar el código OAuth con Google.',
                ]);
                self::redirigirDeepLink(null, 'No se pudo intercambiar el código OAuth con Google.');
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo intercambiar el código OAuth con Google.'], 502);
            }

            $googleData = GoogleAuthController::verificarTokenGoogle($idToken);
            if ($googleData === null) {
                self::guardarEstado($requestId, [
                    'estado' => 'error',
                    'error' => 'El token devuelto por Google no es válido.',
                ]);
                self::redirigirDeepLink(null, 'El token devuelto por Google no es válido.');
                return new \WP_REST_Response(['ok' => false, 'error' => 'El token devuelto por Google no es válido.'], 401);
            }

            $respuesta = GoogleAuthController::procesarUsuarioGoogle($googleData);
            $datos = $respuesta->get_data();
            $status = $respuesta->get_status();

            if ($status >= 400 || !is_array($datos) || empty($datos['ok']) || !isset($datos['data']) || !is_array($datos['data'])) {
                $mensaje = is_array($datos) ? (string) ($datos['error'] ?? $datos['message'] ?? 'Error autenticando al usuario móvil.') : 'Error autenticando al usuario móvil.';
                self::guardarEstado($requestId, [
                    'estado' => 'error',
                    'error' => $mensaje,
                ]);
                self::redirigirDeepLink(null, $mensaje);
                return new \WP_REST_Response(['ok' => false, 'error' => $mensaje], max(400, $status));
            }

            $payload = [
                'token' => (string) ($datos['data']['token'] ?? ''),
                'usuario' => $datos['data']['usuario'] ?? null,
            ];

            if ($payload['token'] === '' || !is_array($payload['usuario'])) {
                self::guardarEstado($requestId, [
                    'estado' => 'error',
                    'error' => 'El callback móvil no recibió token o usuario válidos.',
                ]);
                self::redirigirDeepLink(null, 'El callback móvil no recibió token o usuario válidos.');
                return new \WP_REST_Response(['ok' => false, 'error' => 'El callback móvil no recibió token o usuario válidos.'], 500);
            }

            self::guardarEstado($requestId, [
                'estado' => 'completado',
                'data' => $payload,
            ]);

            self::redirigirDeepLink($payload, null);
            return new \WP_REST_Response(['ok' => true, 'data' => $payload]);
        } catch (\Throwable $e) {
            KamplesLogger::error('GoogleAuthMobileController: fallo en callback OAuth móvil', [
                'message' => $e->getMessage(),
            ]);

            if (is_string($requestId) && $requestId !== '') {
                self::guardarEstado($requestId, [
                    'estado' => 'error',
                    'error' => 'Fallo procesando el callback móvil de Google.',
                ]);

                self::redirigirDeepLink(null, 'Fallo procesando el callback móvil de Google.');
            }

            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'Fallo procesando el callback móvil de Google.',
            ], 500);
        }
    }

    public static function obtenerEstadoMobile(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $requestId = sanitize_text_field((string) ($request->get_param('request_id') ?? ''));
            if ($requestId === '') {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => 'request_id requerido.',
                ], 400);
            }

            $estado = get_transient(self::claveTransient($requestId));
            if (!is_array($estado)) {
                return new \WP_REST_Response([
                    'ok' => true,
                    'estado' => 'pendiente',
                    'data' => null,
                    'error' => null,
                ]);
            }

            return new \WP_REST_Response([
                'ok' => true,
                'estado' => (string) ($estado['estado'] ?? 'pendiente'),
                'data' => $estado['data'] ?? null,
                'error' => $estado['error'] ?? null,
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('GoogleAuthMobileController: fallo consultando estado OAuth móvil', [
                'message' => $e->getMessage(),
            ]);

            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'No se pudo consultar el estado del login móvil.',
            ], 500);
        }
    }

    private static function decodificarState(string $state): ?array
    {
        if ($state === '') {
            KamplesLogger::warning('GoogleAuthMobileController: callback sin state');
            return null;
        }

        $json = self::base64urlDecode($state);
        if ($json === null) {
            KamplesLogger::warning('GoogleAuthMobileController: state base64url inválido');
            return null;
        }

        $data = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            KamplesLogger::warning('GoogleAuthMobileController: state JSON inválido', [
                'jsonError' => json_last_error_msg(),
            ]);
            return null;
        }

        $codeVerifier = isset($data['codeVerifier']) && is_string($data['codeVerifier'])
            ? trim($data['codeVerifier'])
            : '';
        $requestId = isset($data['requestId']) && is_string($data['requestId'])
            ? sanitize_text_field($data['requestId'])
            : '';

        if ($codeVerifier === '' || $requestId === '') {
            KamplesLogger::warning('GoogleAuthMobileController: state incompleto', [
                'keys' => array_keys($data),
            ]);
            return null;
        }

        return [
            'codeVerifier' => $codeVerifier,
            'requestId' => $requestId,
        ];
    }

    private static function guardarEstado(string $requestId, array $estado): void
    {
        set_transient(self::claveTransient($requestId), $estado, self::TTL_ESTADO);
    }

    private static function claveTransient(string $requestId): string
    {
        return self::CLAVE_TRANSIENT_PREFIJO . $requestId;
    }

    private static function obtenerRedirectUri(): string
    {
        return rest_url('kamples/v1/auth/google/mobile-callback');
    }

    private static function obtenerEsquemaDeepLink(): string
    {
        $scheme = $_ENV['KAMPLES_MOBILE_DEEP_LINK_SCHEME'] ?? getenv('KAMPLES_MOBILE_DEEP_LINK_SCHEME') ?: 'com.kamples.mobile';
        return preg_replace('/[^a-zA-Z0-9.+-]/', '', $scheme) ?: 'com.kamples.mobile';
    }

    private static function redirigirDeepLink(?array $payload, ?string $error): void
    {
        $scheme = self::obtenerEsquemaDeepLink();
        if ($scheme === '') {
            throw new \RuntimeException('No se pudo resolver el esquema del deep link móvil.');
        }

        $query = [];

        if ($payload !== null) {
            $jsonPayload = wp_json_encode($payload, JSON_UNESCAPED_SLASHES);
            $query['payload'] = self::base64urlEncode($jsonPayload ?: '{}');
        }

        if ($error !== null && $error !== '') {
            $query['error'] = rawurlencode($error);
        }

        $deeplink = sprintf('%s://auth', $scheme);
        if (!empty($query)) {
            $pairs = [];
            foreach ($query as $key => $value) {
                $pairs[] = $key . '=' . $value;
            }
            $deeplink .= '?' . implode('&', $pairs);
        }

        $deeplinkSeguro = wp_validate_redirect($deeplink, $deeplink);
        if (!is_string($deeplinkSeguro) || $deeplinkSeguro === '') {
            throw new \RuntimeException('El deep link móvil no pasó la validación de redirección.');
        }

        $deeplinkJs = wp_json_encode($deeplinkSeguro, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (!is_string($deeplinkJs) || $deeplinkJs === '') {
            throw new \RuntimeException('No se pudo serializar el deep link móvil.');
        }

        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Content-Type: text/html; charset=' . get_option('blog_charset'));
        status_header(200);

        echo '<!doctype html>';
        echo '<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
        echo '<title>Kamples</title>';
        echo '<style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#101010;color:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}a{color:#ffb703}main{max-width:420px}</style>';
        echo '</head><body><main>';
        echo '<h1>Volviendo a Kamples...</h1>';
        echo '<p>Si la app no se abre sola, toca el enlace de abajo.</p>';
        echo '<p><a href="' . esc_attr($deeplinkSeguro) . '">Abrir Kamples</a></p>';
        echo '<script>window.location.replace(' . $deeplinkJs . ');</script>';
        echo '</main></body></html>';
        exit;
    }

    private static function base64urlDecode(string $value): ?string
    {
        $base64 = strtr($value, '-_', '+/');
        $padding = strlen($base64) % 4;
        if ($padding > 0) {
            $base64 .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode($base64, true);
        return $decoded === false ? null : $decoded;
    }

    private static function base64urlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}