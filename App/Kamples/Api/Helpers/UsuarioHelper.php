<?php

/**
 * UsuarioHelper — Operaciones comunes de usuario reutilizables.
 *
 * Evita duplicar el patrón "obtener usuario PG por wpUserId"
 * en cada controlador.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Helpers;

use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Config\Schema\_generated\UsuariosExtCols;

class UsuarioHelper
{
    /**
     * Obtiene el ID interno de Postgres a partir del wp_user_id actual.
     * Retorna null si no se encuentra.
     */
    public static function obtenerIdPg(): ?int
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        if (!$wpUserId) return null;

        return UsuariosExtRepository::obtenerIdPorWpId($wpUserId);
    }

    /**
     * Obtiene el registro completo de usuarios_ext por wp_user_id.
     */
    public static function obtenerPorWpId(?int $wpUserId = null): ?array
    {
        $wpUserId = $wpUserId ?? AuthMiddleware::obtenerWpUserId();
        return UsuariosExtRepository::buscarPorWpId((int) $wpUserId);
    }

    /**
     * Obtiene el registro de usuarios_ext por ID interno de PG.
     */
    public static function obtenerPorId(int $id): ?array
    {
        return UsuariosExtRepository::buscarPorId($id);
    }

    /**
     * Respuesta estándar de error cuando no se encuentra usuario.
     */
    public static function respuestaNoEncontrado(): \WP_REST_Response
    {
        return new \WP_REST_Response(['code' => 'usuario_no_encontrado'], 404);
    }

    /**
     * Verifica si el usuario WP actual tiene rol de administrador.
     */
    public static function esAdmin(): bool
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        if (!$wpUserId) return false;

        $usuario = get_userdata($wpUserId);
        if (!$usuario) return false;

        return in_array('administrator', $usuario->roles, true);
    }

    /**
     * C193: Obtiene la URL del avatar con fallback a WP Gravatar.
     * Si el registro en usuarios_ext tiene avatar_url, lo devuelve.
     * Si no, genera la URL de Gravatar via get_avatar_url() con el wp_user_id.
     *
     * @param string|null $avatarUrl   valor de avatar_url en la BD
     * @param int|null    $wpUserId    valor de wp_user_id para fallback
     * @return string|null
     */
    public static function resolverAvatarUrl(?string $avatarUrl, ?int $wpUserId = null): ?string
    {
        if ($avatarUrl && trim($avatarUrl) !== '') {
            return $avatarUrl;
        }

        if ($wpUserId && $wpUserId > 0) {
            $url = get_avatar_url($wpUserId, ['size' => 256]);
            return $url ? (string) $url : null;
        }

        return null;
    }
}
