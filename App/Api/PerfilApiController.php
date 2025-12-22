<?php

namespace App\Api;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class PerfilApiController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        register_rest_route(self::API_NAMESPACE, '/perfil', [
            'methods' => WP_REST_Server::CREATABLE, // POST
            'callback' => [self::class, 'updateProfile'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);
    }

    public static function updateProfile(WP_REST_Request $request): WP_REST_Response
    {
        $user_id = get_current_user_id();
        $params = $request->get_json_params();

        // 1. Actualizar datos básicos
        if (isset($params['nombre'])) {
            $nombre = sanitize_text_field($params['nombre']);
            if (!empty($nombre)) {
                wp_update_user([
                    'ID' => $user_id,
                    'display_name' => $nombre,
                    'first_name' => $nombre // Simplificación
                ]);
            }
        }

        if (isset($params['descripcion'])) {
            update_user_meta($user_id, 'description', sanitize_textarea_field($params['descripcion']));
        }

        // 2. Actualizar contraseña
        if (!empty($params['passwordNueva'])) {
            if (empty($params['passwordActual'])) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Se requiere la contraseña actual para establecer una nueva.'
                ], 400);
            }

            $user = get_user_by('id', $user_id);
            if ($user && isset($user->user_pass) && wp_check_password($params['passwordActual'], $user->user_pass, $user_id)) {
                wp_set_password($params['passwordNueva'], $user_id);
                // Renovar cookie de sesión porque wp_set_password la invalida
                $creds = [
                    'user_login'    => $user->user_login,
                    'user_password' => $params['passwordNueva'],
                    'remember'      => true,
                ];
                wp_signon($creds, is_ssl());
            } else {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta.'
                ], 403);
            }
        }

        // 3. Actualizar Avatar
        $avatar_url = null;
        if (!empty($params['avatar'])) {
            $avatar_data = $params['avatar'];

            // Si empieza con http, es una URL existente, no hacer nada (o actualizar meta si queremos forzar)
            // Si empieza con data:image, es base64
            if (preg_match('/^data:image\/(\w+);base64,/', $avatar_data, $type)) {
                $data = substr($avatar_data, strpos($avatar_data, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, gif

                if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
                    return new WP_REST_Response(['success' => false, 'message' => 'Formato de imagen no válido'], 400);
                }

                $data = base64_decode($data);

                if ($data === false) {
                    return new WP_REST_Response(['success' => false, 'message' => 'Error al decodificar imagen'], 400);
                }

                $upload_dir = wp_upload_dir();
                $glory_avatars_dir = $upload_dir['basedir'] . '/glory-avatars';

                if (!file_exists($glory_avatars_dir)) {
                    wp_mkdir_p($glory_avatars_dir);
                }

                // Limpieza de avatares viejos del usuario (opcional, buena práctica)
                // ...

                $filename = 'avatar_' . $user_id . '_' . time() . '.' . $type;
                $file_path = $glory_avatars_dir . '/' . $filename;

                if (file_put_contents($file_path, $data)) {
                    $avatar_url = $upload_dir['baseurl'] . '/glory-avatars/' . $filename;
                    update_user_meta($user_id, 'glory_avatar_url', $avatar_url);
                }
            }
        }

        // Recuperar avatar actual si no se actualizó ahora
        if (!$avatar_url) {
            $avatar_url = get_user_meta($user_id, 'glory_avatar_url', true);
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Perfil actualizado correctamente',
            'data' => [
                'userId' => $user_id,
                'name' => get_the_author_meta('display_name', $user_id),
                'description' => get_the_author_meta('description', $user_id),
                'avatarUrl' => $avatar_url
            ]
        ], 200);
    }
}

PerfilApiController::register();
