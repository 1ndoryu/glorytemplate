<?php

/**
 * AuthController — Endpoints de autenticación con credenciales.
 *
 * POST /auth/login    — Iniciar sesión con email/username + contraseña
 * POST /auth/registro — Crear cuenta nueva
 * POST /auth/logout   — Cerrar sesión
 *
 * Google OAuth se maneja en GoogleAuthController.
 * Delega la autenticación real a WordPress (wp_authenticate / wp_create_user).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Auth\JwtService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\KamplesLogger;
use App\Kamples\Services\ServicioEmailBienvenida;
use App\Helpers\UrlHelper;

class AuthController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/auth/login', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'login'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($namespace, '/auth/registro', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'registro'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($namespace, '/auth/logout', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'logout'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * POST /auth/login
     * Autentica con WordPress y establece las cookies de sesión.
     */
    public static function login(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            /* C164: Rate limiting — 5 intentos por 15 minutos por IP */
            $limitResp = RateLimiter::verificarIp('login', 5, 900);
            if ($limitResp) return $limitResp;

            /* get_json_params() falla cuando Content-Type llega modificado (nginx, WebView Android).
             * WordPress ya leyó php://input y lo almacenó en $request->body durante el routing.
             * Usar get_body() como fallback — evita releer el stream (ya consumido). */
            /* sentinel-disable-next-line request-json-directo — campos se extraen sanitizados individualmente abajo (sanitize_text_field) */
            $body = $request->get_json_params();
            /* sentinel-disable-next-line request-json-directo — empty() es guard, no pasa $body a capa de datos */
            if (empty($body)) {
                $rawBody = $request->get_body();
                if ($rawBody !== '' && $rawBody !== null) {
                    $decoded = json_decode($rawBody, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $body = $decoded;
                    }
                }
            }

            $login    = sanitize_text_field($body['email'] ?? '');
            $password = $body['password'] ?? '';

            if (empty($login) || empty($password)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Email/usuario y contraseña son requeridos.',
                ], 400);
            }

            /* WordPress acepta email o username en wp_authenticate */
            $user = wp_authenticate($login, $password);

            /* [183A-20] Fallback: si WP no reconoce el login y no es email, buscar por username en PG.
             * Escenario: el usuario cambió su username en el perfil (actualiza PG pero no WP user_login).
             * Se resuelve buscando el wp_user_id por username en PG y reintentando con el email de WP.
             * Gotcha: solo se intenta si el input no contiene '@' para no confundir con emails malformados. */
            if (is_wp_error($user) && strpos($login, '@') === false) {
                $wpUserIdFallback = UsuariosExtRepository::buscarWpUserIdPorUsername($login);
                if ($wpUserIdFallback) {
                    $wpDataFallback = get_userdata($wpUserIdFallback);
                    if ($wpDataFallback && !empty($wpDataFallback->user_email)) {
                        $user = wp_authenticate($wpDataFallback->user_email, $password);
                    }
                }
            }

            if (is_wp_error($user)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Credenciales incorrectas.',
                ], 401);
            }

            /* Establecer cookies de sesión WP */
            wp_set_current_user($user->ID);
            wp_set_auth_cookie($user->ID, true);

            /* Obtener o crear usuario extendido en PostgreSQL */
            $pgUser = self::obtenerOCrearUsuarioPg($user);

            /* Generar JWT para clientes desktop (Tauri) */
            $token = JwtService::generar($user->ID, $user->user_login);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'token'   => $token,
                    'usuario' => $pgUser,
                ],
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en AuthController::login', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * POST /auth/registro
     * Crea usuario en WordPress y en PostgreSQL.
     * Campos: username, email, password.
     */
    public static function registro(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            /* C164: Rate limiting — 3 registros por hora por IP */
            $limitResp = RateLimiter::verificarIp('registro', 3, 3600);
            if ($limitResp) return $limitResp;

            /* Mismo patrón que login: fallback a get_body() si get_json_params() falla */
            /* sentinel-disable-next-line request-json-directo — campos se extraen sanitizados individualmente abajo (sanitize_user, sanitize_email) */
            $body = $request->get_json_params();
            /* sentinel-disable-next-line request-json-directo — empty() es guard, no pasa $body a capa de datos */
            if (empty($body)) {
                $rawBody = $request->get_body();
                if ($rawBody !== '' && $rawBody !== null) {
                    $decoded = json_decode($rawBody, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $body = $decoded;
                    }
                }
                unset($decoded, $rawBody);
            }

            $username = sanitize_user($body['username'] ?? '');
            $email    = sanitize_email($body['email'] ?? '');
            $password = $body['password'] ?? '';

            /* Validaciones */
            if (empty($username) || empty($email) || empty($password)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Todos los campos son requeridos.',
                ], 400);
            }

            /* C164: Validar username con reglas centralizadas */
            $errorUsername = Validador::validarUsername($username);
            if ($errorUsername) {
                return new \WP_REST_Response(['ok' => false, 'error' => $errorUsername], 400);
            }

            /* C164: Validar password con limites */
            $errorPass = Validador::validarTextoRequerido($password, Validador::MIN_PASSWORD, Validador::MAX_PASSWORD, 'La contraseña');
            if ($errorPass) {
                return new \WP_REST_Response(['ok' => false, 'error' => $errorPass], 400);
            }

            if (!is_email($email)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'El email no es válido.',
                ], 400);
            }

            /* Verificar duplicados */
            if (username_exists($username)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Ese nombre de usuario ya está en uso.',
                ], 409);
            }

            if (email_exists($email)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Ese email ya está registrado.',
                ], 409);
            }

            /* Crear usuario en WordPress */
            $wpUserId = wp_create_user($username, $password, $email);

            if (is_wp_error($wpUserId)) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => $wpUserId->get_error_message(),
                ], 500);
            }

            /* Asignar rol subscriber */
            $wpUser = get_userdata($wpUserId);
            if ($wpUser) {
                $wpUser->set_role('subscriber');
            }

            /* Iniciar sesión automáticamente */
            wp_set_current_user($wpUserId);
            wp_set_auth_cookie($wpUserId, true);

            /* Crear usuario extendido en PostgreSQL */
            $pgUser = self::obtenerOCrearUsuarioPg($wpUser ?: (object)['ID' => $wpUserId]);

            /* Generar JWT para clientes desktop (Tauri) */
            $token = JwtService::generar($wpUserId, $username);

            /* [183A-84] Email de bienvenida — no bloquea el registro si falla */
            ServicioEmailBienvenida::enviar($email, $username);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'token'   => $token,
                    'usuario' => $pgUser,
                ],
            ], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en AuthController::registro', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * Obtiene o crea el registro de usuario extendido en PostgreSQL.
     * Público para reutilización en GoogleAuthController.
     */
    public static function obtenerOCrearUsuarioPg($wpUser): array
    {
        try {
            $wpId = is_object($wpUser) ? ($wpUser->ID ?? 0) : $wpUser;
            $wpData = get_userdata($wpId);

            if (!$wpData) {
                return ['id' => 0, 'username' => 'unknown'];
            }

            $username     = $wpData->user_login;
            $email        = $wpData->user_email;
            $displayName  = $wpData->display_name ?: $username;

            /* Verificar si ya existe en PG */
            $existing = UsuariosExtRepository::buscarPorWpId($wpId);

            if ($existing) {
                return self::normalizarUsuario($existing);
            }

            /* Crear registro nuevo — [193A-92] ya no se guarda Gravatar como avatar
             * por defecto. El frontend muestra iniciales cuando avatar_url es null. */
            /* [183A-69] Guardar IP de registro para detectar cuentas múltiples. */
            UsuariosExtRepository::crearDesdeWP([
                'wp_user_id'   => $wpId,
                'username'     => $username,
                'email'        => $email,
                'display_name' => $displayName,
                'avatar_url'   => null,
                'registro_ip'  => RateLimiter::obtenerIp(),
            ]);

            $nuevo = UsuariosExtRepository::buscarPorWpId($wpId);

            return $nuevo ? self::normalizarUsuario($nuevo) : ['id' => 0, 'username' => $username];
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en AuthController::obtenerOCrearUsuarioPg', [
                'error' => $e->getMessage(),
                'wpId'  => is_object($wpUser) ? ($wpUser->ID ?? 0) : $wpUser,
            ]);
            return ['id' => 0, 'username' => 'error'];
        }
    }

    /**
     * Convierte snake_case de PG a camelCase para el frontend.
     * [193A-92] Ya no hay fallback a Gravatar — el frontend muestra iniciales.
     */
    public static function normalizarUsuario(array $row): array
    {
        try {
        $avatarUrl = $row[UsuariosExtCols::AVATAR_URL] ?? null;

        return [
            'id'              => (int) $row[UsuariosExtCols::ID],
            'username'        => $row[UsuariosExtCols::USERNAME],
            'nombreVisible'   => $row[UsuariosExtCols::NOMBRE_VISIBLE] ?? $row[UsuariosExtCols::USERNAME],
            'bio'             => $row[UsuariosExtCols::BIO] ?? '',
            'avatarUrl'       => UrlHelper::normalizar($avatarUrl),
            'portadaUrl'      => UrlHelper::normalizar($row[UsuariosExtCols::PORTADA_URL] ?? null),
            'plan'            => $row[UsuariosExtCols::PLAN] ?? 'free',
            'verificado'      => (bool) ($row[UsuariosExtCols::VERIFICADO] ?? false),
            'totalSeguidores' => (int) ($row[UsuariosExtCols::TOTAL_SEGUIDORES] ?? 0),
            'totalSeguidos'   => (int) ($row[UsuariosExtCols::TOTAL_SEGUIDOS] ?? 0),
            'totalSamples'    => (int) ($row[UsuariosExtCols::TOTAL_SAMPLES] ?? 0),
            'totalDescargas'  => (int) ($row[UsuariosExtCols::TOTAL_DESCARGAS] ?? 0),
            'rol'             => $row[UsuariosExtCols::ROL] ?? 'user',
            'creadoEn'        => $row[UsuariosExtCols::CREATED_AT] ?? null,
            /* QK3+QK6: Incluir generos favoritos para que el cache desktop (Tauri Store)
             * tenga datos completos y no cause flash del modal de generos. */
            'generosPreferidos' => self::decodificarGenerosSeguro($row[UsuariosExtCols::GENEROS_FAVORITOS] ?? '[]'),
        ];
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en normalizarUsuario', ['error' => $e->getMessage()]);
            return ['id' => 0, 'username' => 'error'];
        }
    }

    /**
     * POST /auth/logout
     * Cierra la sesión de WordPress (destruye cookies) y retorna JSON.
     * QQ14: Permite logout sin navegar a wp-login.php.
     */
    public static function logout(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            \wp_logout();
            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en logout', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error al cerrar sesión'], 500);
        }
    }

    /**
     * Decodifica JSONB de generos favoritos a array PHP.
     * Retorna array vacío si el valor es nulo, inválido o no-array.
     */
    private static function decodificarGenerosSeguro($raw): array
    {
        if (is_array($raw)) return $raw;
        if (!is_string($raw) || $raw === '') return [];
        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) return [];
        return array_values($decoded);
    }
}
