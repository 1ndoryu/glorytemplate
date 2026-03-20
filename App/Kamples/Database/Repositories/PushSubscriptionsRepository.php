<?php

/**
 * PushSubscriptionsRepository — Acceso a datos para tabla 'push_subscriptions'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\PushSubscriptionsCols;
use App\Config\Schema\_generated\PushSubscriptionsDTO;

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

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = PushSubscriptionsCols::TABLA;
        $col = PushSubscriptionsCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . static::colId() . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = PushSubscriptionsCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . PushSubscriptionsCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* [193A-71] La regeneracion del schema truncó el repositorio push y perdió
     * los métodos operativos; se restauran aquí para que el alta/envío VAPID
     * siga usando endpoint + p256dh + auth sin romper suscripciones activas. */

    /**
     * Registrar o actualizar una suscripcion push.
     * Upsert por endpoint para conservar el dispositivo y reactivar si vuelve.
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
                'userId' => $userId,
                'endpoint' => $endpoint,
                'p256dh' => $p256dh,
                'auth' => $auth,
                'plataforma' => $plataforma,
            ]
        );
    }

    /**
     * Desregistrar una suscripcion por endpoint.
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
     * Marcar una suscripcion como inactiva si el endpoint expiró.
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
     * Limpiar suscripciones inactivas antiguas.
     */
    public static function limpiarInactivas(int $diasInactividad = 30): int
    {
        $tabla = PushSubscriptionsCols::TABLA;
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
