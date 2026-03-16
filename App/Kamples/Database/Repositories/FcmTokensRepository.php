<?php

/**
 * FcmTokensRepository — Tokens FCM para notificaciones push Android.
 *
 * QL34: Almacena tokens Firebase Cloud Messaging por usuario.
 * Un usuario puede tener multiples tokens (multiples dispositivos).
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\FcmTokensCols;

class FcmTokensRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return FcmTokensCols::TABLA;
    }

    protected static function colId(): string
    {
        return FcmTokensCols::ID;
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /**
     * Registrar o actualizar un token FCM.
     * Upsert por token: si ya existe, actualiza usuario y marca activo.
     */
    public static function registrar(int $userId, string $token, string $plataforma = 'android'): void
    {
        $tabla = FcmTokensCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} ("
            . FcmTokensCols::USUARIO_ID . ", "
            . FcmTokensCols::TOKEN . ", "
            . FcmTokensCols::PLATAFORMA . ", "
            . FcmTokensCols::ACTIVO
            . ") VALUES (:userId, :token, :plataforma, true)"
            . " ON CONFLICT (" . FcmTokensCols::TOKEN . ")"
            . " DO UPDATE SET "
            . FcmTokensCols::USUARIO_ID . " = EXCLUDED." . FcmTokensCols::USUARIO_ID . ", "
            . FcmTokensCols::PLATAFORMA . " = EXCLUDED." . FcmTokensCols::PLATAFORMA . ", "
            . FcmTokensCols::ACTIVO . " = true, "
            . FcmTokensCols::UPDATED_AT . " = NOW()",
            [
                'userId'     => $userId,
                'token'      => $token,
                'plataforma' => $plataforma,
            ]
        );
    }

    /**
     * Eliminar un token FCM (logout o token invalido).
     */
    public static function eliminar(string $token): void
    {
        $tabla = FcmTokensCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . FcmTokensCols::TOKEN . " = :token",
            ['token' => $token]
        );
    }

    /**
     * Eliminar todos los tokens de un usuario (logout completo).
     */
    public static function eliminarTodos(int $userId): void
    {
        $tabla = FcmTokensCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . FcmTokensCols::USUARIO_ID . " = :userId",
            ['userId' => $userId]
        );
    }

    /**
     * Obtener tokens activos de un usuario.
     */
    public static function obtenerPorUsuario(int $userId): array
    {
        $tabla = FcmTokensCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE "
            . FcmTokensCols::USUARIO_ID . " = :userId AND "
            . FcmTokensCols::ACTIVO . " = true",
            ['userId' => $userId]
        );
    }

    /**
     * Marcar token como inactivo (expirado o rechazado por Firebase).
     */
    public static function marcarInactivo(string $token): void
    {
        $tabla = FcmTokensCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET "
            . FcmTokensCols::ACTIVO . " = false, "
            . FcmTokensCols::UPDATED_AT . " = NOW()"
            . " WHERE " . FcmTokensCols::TOKEN . " = :token",
            ['token' => $token]
        );
    }
}
