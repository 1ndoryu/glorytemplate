<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/PushSubscriptionsSchema.php */

namespace App\Config\Schema\_generated;

final class PushSubscriptionsCols
{
    const TABLA = 'push_subscriptions';

    const ID = 'id';
    const USUARIO_ID = 'usuario_id';
    const ENDPOINT = 'endpoint';
    const P256DH = 'p256dh';
    const AUTH = 'auth';
    const PLATAFORMA = 'plataforma';
    const ACTIVA = 'activa';
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'usuario_id', 'endpoint', 'p256dh', 'auth', 'plataforma', 'activa', 'created_at', 'updated_at'];
}
