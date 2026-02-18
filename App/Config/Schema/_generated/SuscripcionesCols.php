<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/SuscripcionesSchema.php */

namespace App\Config\Schema\_generated;

final class SuscripcionesCols
{
    const TABLA = 'suscripciones';

    const ID = 'id';
    const USUARIO_ID = 'usuario_id';
    const PLAN = 'plan';
    const ESTADO = 'estado';
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    const INICIO_AT = 'inicio_at';
    const FIN_AT = 'fin_at';
    const CREATED_AT = 'created_at';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'usuario_id', 'plan', 'estado', 'stripe_subscription_id', 'inicio_at', 'fin_at', 'created_at'];
}
