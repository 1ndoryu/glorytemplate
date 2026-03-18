<?php

/**
 * GoogleAuthController — Login/registro con Google Identity Services.
 *
 * POST /auth/google — Recibe ID token de GSI, verifica server-side,
 *                      crea o encuentra usuario en WP y PostgreSQL.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Api\Helpers\RateLimiter;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Auth\JwtService;
use App\Kamples\KamplesLogger;

class GoogleAuthController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/auth/google', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'loginConGoogle'],
            'permission_callback' => '__return_true',
        ]);

        /* Flujo OAuth 2.0 PKCE para la app desktop nativa.
         * Recibe el authorization code capturado en el browser del sistema
         * y lo intercambia por tokens server-side (el client_secret nunca sale del servidor). */
        register_rest_route($namespace, '/auth/google/desktop', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'loginConGoogleDesktop'],
            'permission_callback' => '__return_true',
        ]);

        /* QL100b: Flujo OAuth para Android APK — callback server-side.
         * Google redirige aquí con ?code=XXX, el servidor intercambia por tokens,
         * genera JWT y redirige al deep link kamples://auth?token=JWT. */
        register_rest_route($namespace, '/auth/google/mobile-callback', [
            'methods'             => 'GET',
            'callback'            => [GoogleAuthMobileController::class, 'mobileCallback'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($namespace, '/auth/google/mobile-status', [
            'methods'             => 'GET',
            'callback'            => [GoogleAuthMobileController::class, 'obtenerEstadoMobile'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * POST /auth/google
     * Autentica/registra con Google OAuth via ID token de Google Identity Services.
     * Verifica el token server-side con la API de Google, luego crea o encuentra
     * el usuario en WordPress y PostgreSQL.
     */
    public static function loginConGoogle(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            /* Rate limiting — 10 intentos por 15 minutos por IP */
            $limitResp = RateLimiter::verificarIp('google_auth', 10, 900);
            if ($limitResp) return $limitResp;

            $body       = $request->get_json_params();
            $credential = $body['credential'] ?? '';

            if (empty($credential) || !is_string($credential)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Token de Google requerido.',
                ], 400);
            }

            /* Verificar el ID token con Google */
            $googleData = self::verificarTokenGoogle($credential);

            if (!$googleData) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Token de Google inválido o expirado.',
                ], 401);
            }

            return self::procesarUsuarioGoogle($googleData);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en GoogleAuthController::loginConGoogle', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code'    => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * POST /auth/google/desktop
     * Flujo OAuth 2.0 Authorization Code + PKCE para la app de escritorio.
     * El code_verifier nunca sale del servidor — el client_secret tampoco.
     * Intercambia el authorization code con Google para obtener el id_token,
     * luego reutiliza la misma lógica de verificación/registro que el flujo web.
     */
    public static function loginConGoogleDesktop(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            /* Rate limiting — 10 intentos por 15 minutos por IP */
            $limitResp = RateLimiter::verificarIp('google_desktop_auth', 10, 900);
            if ($limitResp) return $limitResp;

            $body         = $request->get_json_params();
            $code         = $body['code'] ?? '';
            $codeVerifier = $body['code_verifier'] ?? '';
            $redirectUri  = $body['redirect_uri'] ?? '';

            if (empty($code) || !is_string($code)
                || empty($codeVerifier) || !is_string($codeVerifier)
                || empty($redirectUri) || !is_string($redirectUri)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Parámetros incompletos para el intercambio OAuth.',
                ], 400);
            }

            /* Seguridad: el redirect_uri DEBE ser un localhost del mismo proceso.
             * Rechazamos cualquier URI que no apunte a 127.0.0.1 con un puerto dinámico
             * para prevenir open-redirect + auth-code interception. */
            if (!preg_match('#^http://127\.0\.0\.1:\d{1,5}/callback$#', $redirectUri)) {
                KamplesLogger::warning('Desktop OAuth: redirect_uri inválido', ['uri' => $redirectUri]);
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'redirect_uri inválido.',
                ], 400);
            }

            /* Intercambiar authorization code por id_token (server-side, con client_secret) */
            $idToken = self::intercambiarCodigoGooglePorIdToken($code, $codeVerifier, $redirectUri);

            if (!$idToken) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Error al intercambiar el código de autorización con Google.',
                ], 401);
            }

            /* Verificar el id_token (misma validación que el flujo web) */
            $googleData = self::verificarTokenGoogle($idToken);

            if (!$googleData) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Token de Google inválido tras el intercambio.',
                ], 401);
            }

            return self::procesarUsuarioGoogle($googleData);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en GoogleAuthController::loginConGoogleDesktop', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code'    => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * GET /auth/google/mobile-callback
     * QL100b: Callback server-side para OAuth de Android APK.
     * Google redirige aquí con ?code=XXX&state=XXX. El servidor intercambia el código,
     * autentica al usuario y redirige a kamples://auth?token=JWT para que el deep link
     * devuelva el control a la app.
     *
     * state contiene el PKCE code_verifier codificado en base64url (generado por la app).
     */
    /**
     * Intercambia un authorization code OAuth 2.0 por los tokens de Google.
     * Requiere el code_verifier PKCE y el redirect_uri originales.
     * El client_secret se obtiene del servidor (nunca sale al cliente).
     * Retorna el id_token si el intercambio es exitoso, null en caso de error.
     */
    public static function intercambiarCodigoGooglePorIdToken(
        string $code,
        string $codeVerifier,
        string $redirectUri
    ): ?string {
        $clientId     = $_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID') ?: '';
        $clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? getenv('GOOGLE_CLIENT_SECRET') ?: '';

        if (empty($clientId) || empty($clientSecret)) {
            KamplesLogger::error('GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados');
            return null;
        }

        $response = wp_remote_post('https://oauth2.googleapis.com/token', [
            'timeout'   => 15,
            'sslverify' => true,
            'body'      => [
                'code'          => $code,
                'client_id'     => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri'  => $redirectUri,
                'grant_type'    => 'authorization_code',
                'code_verifier' => $codeVerifier,
            ],
        ]);

        if (is_wp_error($response)) {
            KamplesLogger::error('Error intercambiando código con Google', [
                'error' => $response->get_error_message(),
            ]);
            return null;
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        if ($statusCode !== 200) {
            KamplesLogger::warning('Google token exchange falló', ['status' => $statusCode]);
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            KamplesLogger::error('Respuesta inválida de Google token exchange');
            return null;
        }

        if (empty($data['id_token']) || !is_string($data['id_token'])) {
            KamplesLogger::warning('Google token exchange no incluyó id_token', [
                'keys' => array_keys($data),
            ]);
            return null;
        }

        return $data['id_token'];
    }

    /**
     * Procesa el usuario autenticado con Google: crea cuenta si no existe,
     * inicia sesión WordPress, sincroniza con PostgreSQL y emite JWT.
     * Reutilizado tanto por el flujo web (GSI) como por el flujo desktop (PKCE).
     */
    public static function procesarUsuarioGoogle(array $googleData): \WP_REST_Response
    {
        $email        = $googleData['email'];
        $nombre       = $googleData['name'] ?? '';
        $avatarGoogle = $googleData['picture'] ?? '';

        /* Buscar usuario WP existente por email */
        $wpUser = get_user_by('email', $email);

        if ($wpUser) {
            /* Usuario existente — iniciar sesión */
            wp_set_current_user($wpUser->ID);
            wp_set_auth_cookie($wpUser->ID, true);
        } else {
            /* Nuevo usuario — crear en WordPress */
            $username = self::generarUsernameDesdeGoogle($email, $nombre);
            $password = wp_generate_password(32, true, true);

            $wpUserId = wp_create_user($username, $password, $email);

            if (is_wp_error($wpUserId)) {
                KamplesLogger::error('Error creando usuario WP desde Google', [
                    'email' => $email,
                    'error' => $wpUserId->get_error_message(),
                ]);
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Error al crear la cuenta.',
                ], 500);
            }

            $wpUser = get_userdata($wpUserId);
            if ($wpUser) {
                $wpUser->set_role('subscriber');
                if ($nombre) {
                    wp_update_user([
                        'ID'           => $wpUserId,
                        'display_name' => sanitize_text_field($nombre),
                    ]);
                }
            }

            wp_set_current_user($wpUserId);
            wp_set_auth_cookie($wpUserId, true);
        }

        /* Obtener o crear usuario extendido en PostgreSQL */
        $pgUser = AuthController::obtenerOCrearUsuarioPg($wpUser);

        /* Si el usuario PG no tiene avatar pero Google sí provee uno, actualizar */
        if ($avatarGoogle && empty($pgUser['avatarUrl'])) {
            $sanitizedAvatar = esc_url_raw($avatarGoogle);
            if ($sanitizedAvatar) {
                UsuariosExtRepository::actualizarAvatar((int) $wpUser->ID, $sanitizedAvatar);
                $pgUser['avatarUrl'] = $sanitizedAvatar;
            }
        }

        /* Generar JWT para clientes desktop */
        $token = JwtService::generar($wpUser->ID, $wpUser->user_login);

        return new \WP_REST_Response([
            'ok'   => true,
            'data' => [
                'token'   => $token,
                'usuario' => $pgUser,
            ],
        ]);
    }

    /**
     * Verifica un ID token de Google Identity Services con la API de Google.
     * Retorna los claims del token si es válido, null si no.
     */
    public static function verificarTokenGoogle(string $credential): ?array
    {
        $clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID') ?: '';
        if (empty($clientId)) {
            KamplesLogger::error('GOOGLE_CLIENT_ID no configurado en .env');
            return null;
        }

        $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);

        $response = wp_remote_get($url, [
            'timeout'   => 10,
            'sslverify' => true,
        ]);

        if (is_wp_error($response)) {
            KamplesLogger::error('Error verificando token Google', [
                'error' => $response->get_error_message(),
            ]);
            return null;
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        if ($statusCode !== 200) {
            KamplesLogger::warning('Token Google rechazado por API', ['status' => $statusCode]);
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            KamplesLogger::error('Respuesta inválida de Google tokeninfo');
            return null;
        }

        /* Validar audience (aud) — debe coincidir con nuestro Client ID */
        if (($data['aud'] ?? '') !== $clientId) {
            KamplesLogger::warning('Google token aud no coincide', [
                'expected' => $clientId,
                'received' => $data['aud'] ?? 'N/A',
            ]);
            return null;
        }

        /* Validar issuer (iss) */
        $validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        if (!in_array($data['iss'] ?? '', $validIssuers, true)) {
            KamplesLogger::warning('Google token iss inválido', ['iss' => $data['iss'] ?? 'N/A']);
            return null;
        }

        /* Verificar que el email está verificado */
        if (($data['email_verified'] ?? '') !== 'true') {
            KamplesLogger::warning('Google email no verificado', ['email' => $data['email'] ?? 'N/A']);
            return null;
        }

        /* Verificar que no haya expirado */
        $exp = (int) ($data['exp'] ?? 0);
        if ($exp > 0 && $exp < time()) {
            KamplesLogger::warning('Google token expirado');
            return null;
        }

        return [
            'sub'     => $data['sub'] ?? '',
            'email'   => $data['email'] ?? '',
            'name'    => $data['name'] ?? '',
            'picture' => $data['picture'] ?? '',
        ];
    }

    /**
     * Genera un username único a partir del email o nombre de Google.
     * Sanitiza y evita colisiones con usernames existentes.
     */
    private static function generarUsernameDesdeGoogle(string $email, string $nombre): string
    {
        $base = explode('@', $email)[0];
        $base = sanitize_user($base, true);
        $base = preg_replace('/[^a-z0-9_]/', '', strtolower($base));

        if (strlen($base) < 3) {
            $base = preg_replace('/[^a-z0-9_]/', '', strtolower($nombre));
        }

        if (strlen($base) < 3) {
            $base = 'user';
        }

        $base = substr($base, 0, 20);
        $username = $base;
        $counter  = 1;

        while (username_exists($username)) {
            $username = $base . $counter;
            $counter++;
        }

        return $username;
    }
}
