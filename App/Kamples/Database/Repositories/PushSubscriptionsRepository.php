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

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */
    /* Agregar metodos custom aqui (queries complejas, JOINs, CTEs, etc.) */
}
