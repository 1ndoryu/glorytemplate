<?php

/**
 * PerfilController — Endpoints de perfil de usuario.
 *
 * GET  /perfil/{username}  — Perfil público
 * GET  /me                 — Usuario autenticado actual
 * PUT  /me                 — Actualizar perfil
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;

class PerfilController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/perfil/(?P<username>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerPerfil'],
            'permission_callback' => '__return_true',
            'args'                => [
                'username' => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_user'],
            ],
        ]);

        register_rest_route($namespace, '/me', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'usuarioActual'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/me', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'actualizarPerfil'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * GET /perfil/{username} — Perfil público.
     */
    public static function obtenerPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $username = $request->get_param('username');

        $perfil = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, bio, avatar_url, portada_url,
                    plan, verificado, total_seguidores, total_seguidos,
                    total_samples, total_descargas, created_at
             FROM usuarios_ext WHERE username = :username",
            ['username' => $username]
        );

        if ($perfil === null) {
            return new \WP_REST_Response(['code' => 'perfil_no_encontrado', 'message' => 'El usuario no existe.'], 404);
        }

        return new \WP_REST_Response(['data' => $perfil], 200);
    }

    /**
     * GET /me — Usuario autenticado actual con auto-creación.
     */
    public static function usuarioActual(): \WP_REST_Response
    {
        $wpUser = AuthMiddleware::obtenerUsuarioActual();
        if (!$wpUser) {
            return new \WP_REST_Response(['code' => 'no_auth', 'message' => 'No autenticado'], 401);
        }

        $ext = PostgresService::consultarUno(
            "SELECT * FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUser['wp_user_id']]
        );

        /* Auto-crear registro si no existe en Postgres */
        if (!$ext) {
            $id = PostgresService::insertar(
                "INSERT INTO usuarios_ext (wp_user_id, username, nombre_visible, email, avatar_url)
                 VALUES (:wpId, :username, :nombre, :email, :avatar)
                 RETURNING id",
                [
                    'wpId'     => $wpUser['wp_user_id'],
                    'username' => $wpUser['username'],
                    'nombre'   => $wpUser['display_name'],
                    'email'    => $wpUser['email'],
                    'avatar'   => $wpUser['avatar_url'],
                ]
            );

            $ext = PostgresService::consultarUno(
                "SELECT * FROM usuarios_ext WHERE id = :id",
                ['id' => $id]
            );
        }

        return new \WP_REST_Response(['data' => array_merge($wpUser, $ext ?? [])], 200);
    }

    /**
     * PUT /me — Actualizar perfil.
     */
    public static function actualizarPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $body = $request->get_json_params();

        $campos = [];
        $params = ['wpId' => $wpUserId];

        /* Acepta nombreVisible o nombreDisplay (compatibilidad) */
        $nombre = $body['nombreVisible'] ?? $body['nombreDisplay'] ?? null;
        if ($nombre !== null) {
            $campos[] = 'nombre_visible = :nombre';
            $params['nombre'] = sanitize_text_field($nombre);
        }
        if (isset($body['username'])) {
            $campos[] = 'username = :username';
            $params['username'] = sanitize_user($body['username']);
        }
        if (isset($body['bio'])) {
            $campos[] = 'bio = :bio';
            $params['bio'] = sanitize_textarea_field($body['bio']);
        }
        if (isset($body['portadaUrl'])) {
            $campos[] = 'portada_url = :portada';
            $params['portada'] = esc_url_raw($body['portadaUrl']);
        }
        if (isset($body['avatarUrl'])) {
            $campos[] = 'avatar_url = :avatar';
            $params['avatar'] = esc_url_raw($body['avatarUrl']);
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No hay datos para actualizar'], 400);
        }

        $setSQL = implode(', ', $campos);
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET {$setSQL}, updated_at = NOW() WHERE wp_user_id = :wpId",
            $params
        );

        return new \WP_REST_Response(['ok' => true, 'message' => 'Perfil actualizado'], 200);
    }
}
