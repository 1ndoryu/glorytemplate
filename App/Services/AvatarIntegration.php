<?php

namespace App\Services;

class AvatarIntegration
{
    public static function init(): void
    {
        add_filter('get_avatar_url', [self::class, 'filterAvatarUrl'], 10, 3);
        add_filter('get_avatar', [self::class, 'filterAvatarHtml'], 10, 5);
    }

    /**
     * Filtra la URL del avatar para usar la personalizada si existe
     */
    public static function filterAvatarUrl($url, $id_or_email, $args)
    {
        $user_id = self::getUserIdFromIdOrEmail($id_or_email);

        if ($user_id) {
            $custom_avatar = get_user_meta($user_id, 'glory_avatar_url', true);
            if ($custom_avatar) {
                return $custom_avatar;
            }
        }

        return $url;
    }

    /**
     * Filtra el HTML completo del avatar
     */
    public static function filterAvatarHtml($avatar, $id_or_email, $size, $default, $alt, $args = [])
    {
        $user_id = self::getUserIdFromIdOrEmail($id_or_email);

        if ($user_id) {
            $custom_url = get_user_meta($user_id, 'glory_avatar_url', true);
            if ($custom_url) {
                // Generar HTML personalizado
                $class = isset($args['class']) ? $args['class'] : 'avatar avatar-' . $size . ' photo';
                return sprintf(
                    "<img alt='%s' src='%s' class='%s' height='%d' width='%d' loading='lazy' decoding='async' />",
                    esc_attr($alt),
                    esc_url($custom_url),
                    esc_attr($class),
                    (int) $size,
                    (int) $size
                );
            }
        }

        return $avatar;
    }

    /**
     * Helper para obtener ID de usuario
     */
    private static function getUserIdFromIdOrEmail($id_or_email)
    {
        $user_id = 0;

        if (is_numeric($id_or_email)) {
            $user_id = (int) $id_or_email;
        } elseif (is_string($id_or_email) && is_email($id_or_email)) {
            $user = get_user_by('email', $id_or_email);
            if ($user) {
                $user_id = $user->ID;
            }
        } elseif ($id_or_email instanceof \WP_User) {
            $user_id = $id_or_email->ID;
        } elseif ($id_or_email instanceof \WP_Post) {
            $user_id = $id_or_email->post_author;
        } elseif ($id_or_email instanceof \WP_Comment) {
            $user_id = $id_or_email->user_id;
        }

        return $user_id;
    }
}

// Inicializar la integración automáticamente
AvatarIntegration::init();
