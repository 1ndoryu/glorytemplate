<?php

namespace App\Api;

use App\Services\GoogleAuthService;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class AuthApiController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        /* Obtener URL de redirección a Google */
        register_rest_route(self::API_NAMESPACE, '/auth/google/url', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [self::class, 'getGoogleAuthUrl'],
            'permission_callback' => '__return_true', // Público
        ]);

        /* Login con código de Google */
        register_rest_route(self::API_NAMESPACE, '/auth/google/login', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'loginWithGoogle'],
            'permission_callback' => '__return_true', // Público
            'args' => [
                'code' => [
                    'required' => true,
                    'validate_callback' => fn($param) => is_string($param),
                ],
            ],
        ]);

        /* Login con credenciales WP */
        register_rest_route(self::API_NAMESPACE, '/auth/login', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'loginWithCredentials'],
            'permission_callback' => '__return_true',
            'args' => [
                'username' => ['required' => true],
                'password' => ['required' => true],
            ],
        ]);

        /* Registro de nuevo usuario */
        register_rest_route(self::API_NAMESPACE, '/auth/register', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'registerRegularUser'],
            'permission_callback' => '__return_true',
            'args' => [
                'username' => ['required' => true],
                'email'    => ['required' => true, 'validate_callback' => 'is_email'],
                'password' => ['required' => true],
            ],
        ]);

        /* Logout */
        register_rest_route(self::API_NAMESPACE, '/auth/logout', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'logout'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);
    }

    public static function loginWithCredentials(WP_REST_Request $request): WP_REST_Response
    {
        $username = $request->get_param('username');
        $password = $request->get_param('password');

        $creds = [
            'user_login'    => $username,
            'user_password' => $password,
            'remember'      => true,
        ];

        /* Intentar login seguro con WP */
        $user = wp_signon($creds, is_ssl());

        if (is_wp_error($user)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Credenciales incorrectas.', // Mensaje genérico por seguridad
            ], 401);
        }

        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true);

        $nonce = wp_create_nonce('wp_rest');

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Login exitoso',
            'data' => [
                'userId' => $user->ID,
                'email' => $user->user_email,
                'name' => $user->display_name,
                'nonce' => $nonce,
            ],
        ], 200);
    }

    public static function registerRegularUser(WP_REST_Request $request): WP_REST_Response
    {
        $username = sanitize_user($request->get_param('username'));
        $email    = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');

        if (username_exists($username)) {
            return new WP_REST_Response(['success' => false, 'message' => 'El nombre de usuario ya está registrado.'], 400);
        }

        if (email_exists($email)) {
            return new WP_REST_Response(['success' => false, 'message' => 'El correo electrónico ya está registrado.'], 400);
        }

        /* Crear usuario */
        $userId = wp_create_user($username, $password, $email);

        if (is_wp_error($userId)) {
            return new WP_REST_Response(['success' => false, 'message' => $userId->get_error_message()], 500);
        }

        /* Auto-login tras registro exitoso */
        wp_set_current_user($userId);
        wp_set_auth_cookie($userId, true);
        $nonce = wp_create_nonce('wp_rest');
        $user  = get_user_by('id', $userId);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Registro exitoso',
            'data' => [
                'userId' => $userId,
                'email'  => $user->user_email,
                'name'   => $user->display_name,
                'nonce'  => $nonce,
            ],
        ], 201);
    }

    public static function getGoogleAuthUrl(): WP_REST_Response
    {
        try {
            $service = new GoogleAuthService();
            return new WP_REST_Response([
                'success' => true,
                'url' => $service->getAuthUrl(),
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Error generating URL: ' . $e->getMessage(),
            ], 500);
        }
    }

    public static function loginWithGoogle(WP_REST_Request $request): WP_REST_Response
    {
        $code = $request->get_param('code');

        try {
            $service = new GoogleAuthService();
            $userData = $service->getUserFromCode($code);

            if (!$userData || empty($userData['email'])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Fallo la autenticación con Google',
                ], 401);
            }

            $email = $userData['email'];
            $name = $userData['name'] ?? explode('@', $email)[0];

            /* Buscar usuario por email */
            $user = get_user_by('email', $email);

            if (!$user) {
                /* Crear usuario si no existe */
                $username = sanitize_user(explode('@', $email)[0]);

                /* Asegurar username unico */
                $originalUsername = $username;
                $counter = 1;
                while (username_exists($username)) {
                    $username = $originalUsername . $counter;
                    $counter++;
                }

                $randomPassword = wp_generate_password(16, true);
                $userId = wp_create_user($username, $randomPassword, $email);

                if (is_wp_error($userId)) {
                    throw new \Exception($userId->get_error_message());
                }

                /* Actualizar nombre */
                wp_update_user([
                    'ID' => $userId,
                    'display_name' => $name,
                    'first_name' => $name, // Simplificado, Google manda nombre completo
                ]);

                $user = get_user_by('id', $userId);
            }

            /* Loguear al usuario */
            wp_set_current_user($user->ID);
            wp_set_auth_cookie($user->ID, true);

            /* Obtener nonce para futuras peticiones */
            $nonce = wp_create_nonce('wp_rest');

            return new WP_REST_Response([
                'success' => true,
                'message' => 'Login exitoso',
                'data' => [
                    'userId' => $user->ID,
                    'email' => $user->user_email,
                    'name' => $user->display_name,
                    'nonce' => $nonce, // Importante para auth JS
                ],
            ], 200);
        } catch (\Exception $e) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    public static function logout(): WP_REST_Response
    {
        wp_logout();
        return new WP_REST_Response(['success' => true, 'message' => 'Logged out'], 200);
    }
}

AuthApiController::register();
