<?php

/**
 * AuthController — Endpoints de autenticación.
 *
 * POST /auth/login    — Iniciar sesión con email/username + contraseña
 * POST /auth/registro — Crear cuenta nueva
 *
 * Delega la autenticación real a WordPress (wp_authenticate / wp_create_user).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\KamplesLogger;

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

            $body     = $request->get_json_params();
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

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $pgUser,
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

            $body     = $request->get_json_params();
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

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $pgUser,
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
     * Reutiliza la lógica de PerfilController::usuarioActual, pero simplificada.
     */
    private static function obtenerOCrearUsuarioPg($wpUser): array
    {
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

        /* Crear registro nuevo — C193: incluir avatar_url de WP */
        $avatarWp = get_avatar_url($wpId, ['size' => 256]) ?: null;
        UsuariosExtRepository::crearDesdeWP([
            'wpId'    => $wpId,
            'username' => $username,
            'email'    => $email,
            'nombre'   => $displayName,
            'avatar'   => $avatarWp,
        ]);

        $nuevo = UsuariosExtRepository::buscarPorWpId($wpId);

        return $nuevo ? self::normalizarUsuario($nuevo) : ['id' => 0, 'username' => $username];
    }

    /**
     * Convierte snake_case de PG a camelCase para el frontend.
     * C193: fallback a WP Gravatar si avatar_url es null.
     */
    private static function normalizarUsuario(array $row): array
    {
        $avatarUrl = $row[UsuariosExtCols::AVATAR_URL] ?? null;
        if (!$avatarUrl && !empty($row[UsuariosExtCols::WP_USER_ID])) {
            $avatarUrl = get_avatar_url((int) $row[UsuariosExtCols::WP_USER_ID], ['size' => 256]) ?: null;
        }

        return [
            'id'              => (int) $row[UsuariosExtCols::ID],
            'username'        => $row[UsuariosExtCols::USERNAME],
            'nombreVisible'   => $row[UsuariosExtCols::NOMBRE_VISIBLE] ?? $row[UsuariosExtCols::USERNAME],
            'bio'             => $row[UsuariosExtCols::BIO] ?? '',
            'avatarUrl'       => $avatarUrl,
            'portadaUrl'      => $row[UsuariosExtCols::PORTADA_URL] ?? null,
            'plan'            => $row[UsuariosExtCols::PLAN] ?? 'free',
            'verificado'      => (bool) ($row[UsuariosExtCols::VERIFICADO] ?? false),
            'totalSeguidores' => (int) ($row[UsuariosExtCols::TOTAL_SEGUIDORES] ?? 0),
            'totalSeguidos'   => (int) ($row[UsuariosExtCols::TOTAL_SEGUIDOS] ?? 0),
            'totalSamples'    => (int) ($row[UsuariosExtCols::TOTAL_SAMPLES] ?? 0),
            'totalDescargas'  => (int) ($row[UsuariosExtCols::TOTAL_DESCARGAS] ?? 0),
            'rol'             => $row[UsuariosExtCols::ROL] ?? 'user',
            'creadoEn'        => $row[UsuariosExtCols::CREATED_AT] ?? null,
        ];
    }
}
