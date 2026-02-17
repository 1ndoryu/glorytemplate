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

use App\Kamples\Database\PostgresService;

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
    }

    /**
     * POST /auth/registro
     * Crea usuario en WordPress y en PostgreSQL.
     * Campos: username, email, password.
     */
    public static function registro(\WP_REST_Request $request): \WP_REST_Response
    {
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

        if (strlen($password) < 6) {
            return new \WP_REST_Response([
                'ok'    => false,
                'error' => 'La contraseña debe tener al menos 6 caracteres.',
            ], 400);
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
        $existing = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, bio, avatar_url, portada_url,
                    plan, verificado, total_seguidores, total_seguidos,
                    total_samples, total_descargas, rol, created_at
             FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpId]
        );

        if ($existing) {
            return self::normalizarUsuario($existing);
        }

        /* Crear registro nuevo */
        PostgresService::ejecutar(
            "INSERT INTO usuarios_ext (wp_user_id, username, email, nombre_visible, plan, rol, created_at)
             VALUES (:wpId, :username, :email, :nombre, 'free', 'user', NOW())",
            [
                'wpId'    => $wpId,
                'username' => $username,
                'email'    => $email,
                'nombre'   => $displayName,
            ]
        );

        $nuevo = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, bio, avatar_url, portada_url,
                    plan, verificado, total_seguidores, total_seguidos,
                    total_samples, total_descargas, rol, created_at
             FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpId]
        );

        return $nuevo ? self::normalizarUsuario($nuevo) : ['id' => 0, 'username' => $username];
    }

    /**
     * Convierte snake_case de PG a camelCase para el frontend.
     */
    private static function normalizarUsuario(array $row): array
    {
        return [
            'id'              => (int) $row['id'],
            'username'        => $row['username'],
            'nombreVisible'   => $row['nombre_visible'] ?? $row['username'],
            'bio'             => $row['bio'] ?? '',
            'avatarUrl'       => $row['avatar_url'] ?? null,
            'portadaUrl'      => $row['portada_url'] ?? null,
            'plan'            => $row['plan'] ?? 'free',
            'verificado'      => (bool) ($row['verificado'] ?? false),
            'totalSeguidores' => (int) ($row['total_seguidores'] ?? 0),
            'totalSeguidos'   => (int) ($row['total_seguidos'] ?? 0),
            'totalSamples'    => (int) ($row['total_samples'] ?? 0),
            'totalDescargas'  => (int) ($row['total_descargas'] ?? 0),
            'rol'             => $row['rol'] ?? 'user',
            'creadoEn'        => $row['created_at'] ?? null,
        ];
    }
}
