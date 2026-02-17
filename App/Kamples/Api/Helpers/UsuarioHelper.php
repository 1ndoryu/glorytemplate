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

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;

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

        $row = PostgresService::consultarUno(
            "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );

        return $row ? (int) $row['id'] : null;
    }

    /**
     * Obtiene el registro completo de usuarios_ext por wp_user_id.
     */
    public static function obtenerPorWpId(?int $wpUserId = null): ?array
    {
        $wpUserId = $wpUserId ?? AuthMiddleware::obtenerWpUserId();
        return PostgresService::consultarUno(
            "SELECT * FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );
    }

    /**
     * Obtiene el registro de usuarios_ext por ID interno de PG.
     */
    public static function obtenerPorId(int $id): ?array
    {
        return PostgresService::consultarUno(
            "SELECT * FROM usuarios_ext WHERE id = :id",
            ['id' => $id]
        );
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
}
