<?php

/**
 * PushSubscriptionsRepository — Suscripciones Web Push (VAPID).
 *
 * Gestiona endpoints de push notification por usuario.
 * Self-hosted, sin dependencia de Firebase/FCM.
 *
 * QK86: Infraestructura de notificaciones push para Android/web/desktop.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\PushSubscriptionsCols;

class PushSubscriptionsRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return PushSubscriptionsCols::TABLA;
    }

    protected static function colId(): string
    {
        return PushSubscriptionsCols::ID;
    }

    /* === METODOS CUSTOM === */

    /**
     * Registrar o actualizar una suscripcion push.
     * Upsert por endpoint: si el endpoint ya existe, actualiza las keys y marca activa.
     */
    public static function registrar(int $userId, string $endpoint, string $p256dh, string $auth, string $plataforma = 'web'): void
    {
        $tabla = PushSubscriptionsCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} ("
            . PushSubscriptionsCols::USUARIO_ID . ", "
            . PushSubscriptionsCols::ENDPOINT . ", "
            . PushSubscriptionsCols::P256DH . ", "
            . PushSubscriptionsCols::AUTH . ", "
            . PushSubscriptionsCols::PLATAFORMA . ", "
            . PushSubscriptionsCols::ACTIVA
            . ") VALUES (:userId, :endpoint, :p256dh, :auth, :plataforma, true)"
            . " ON CONFLICT (" . PushSubscriptionsCols::ENDPOINT . ")"
            . " DO UPDATE SET "
            . PushSubscriptionsCols::P256DH . " = EXCLUDED." . PushSubscriptionsCols::P256DH . ", "
            . PushSubscriptionsCols::AUTH . " = EXCLUDED." . PushSubscriptionsCols::AUTH . ", "
            . PushSubscriptionsCols::USUARIO_ID . " = EXCLUDED." . PushSubscriptionsCols::USUARIO_ID . ", "
            . PushSubscriptionsCols::PLATAFORMA . " = EXCLUDED." . PushSubscriptionsCols::PLATAFORMA . ", "
            . PushSubscriptionsCols::ACTIVA . " = true, "
            . PushSubscriptionsCols::UPDATED_AT . " = NOW()",
            [
                'userId'     => $userId,
                'endpoint'   => $endpoint,
                'p256dh'     => $p256dh,
                'auth'       => $auth,
                'plataforma' => $plataforma,
            ]
        );
    }

    /**
     * Desregistrar una suscripcion por endpoint.
     * Elimina fisicamente (no soft-delete) para cumplir GDPR.
     */
    public static function desregistrar(string $endpoint): void
    {
        $tabla = PushSubscriptionsCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . PushSubscriptionsCols::ENDPOINT . " = :endpoint",
            ['endpoint' => $endpoint]
        );
    }

    /**
     * Desregistrar todas las suscripciones de un usuario.
     */
    public static function desregistrarTodas(int $userId): void
    {
        $tabla = PushSubscriptionsCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . PushSubscriptionsCols::USUARIO_ID . " = :userId",
            ['userId' => $userId]
        );
    }

    /**
     * Obtener todas las suscripciones activas de un usuario.
     * Un usuario puede tener multiples dispositivos (multi-device push).
     */
    public static function obtenerPorUsuario(int $userId): array
    {
        $tabla = PushSubscriptionsCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE "
            . PushSubscriptionsCols::USUARIO_ID . " = :userId AND "
            . PushSubscriptionsCols::ACTIVA . " = true",
            ['userId' => $userId]
        );
    }

    /**
     * Marcar una suscripcion como inactiva (endpoint expirado o rechazado).
     * Llamado cuando el push server retorna 410 Gone o 404.
     */
    public static function marcarInactiva(string $endpoint): void
    {
        $tabla = PushSubscriptionsCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET "
            . PushSubscriptionsCols::ACTIVA . " = false, "
            . PushSubscriptionsCols::UPDATED_AT . " = NOW()"
            . " WHERE " . PushSubscriptionsCols::ENDPOINT . " = :endpoint",
            ['endpoint' => $endpoint]
        );
    }

    /**
     * Limpiar suscripciones inactivas mas antiguas que N dias.
     * Para cron de limpieza periodica.
     *
     * @param int $diasInactividad Solo eliminar si updated_at > N dias
     */
    public static function limpiarInactivas(int $diasInactividad = 30): int
    {
        $tabla = PushSubscriptionsCols::TABLA;
        /* Whitelist de intervalos para prevenir inyeccion SQL */
        $intervaloValido = in_array($diasInactividad, [7, 14, 30, 60, 90], true)
            ? "{$diasInactividad} days"
            : '30 days';

        $resultado = static::consultarUno(
            "WITH eliminadas AS ("
            . " DELETE FROM {$tabla} WHERE "
            . PushSubscriptionsCols::ACTIVA . " = false AND "
            . PushSubscriptionsCols::UPDATED_AT . " < NOW() - INTERVAL '{$intervaloValido}'"
            . " RETURNING 1"
            . ") SELECT COUNT(*) as total FROM eliminadas",
            []
        );

        return (int) ($resultado['total'] ?? 0);
    }
}
