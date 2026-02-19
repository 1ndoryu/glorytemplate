<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CapSuscripcionesSchema.php */

namespace App\Config\Schema\_generated;

final class CapSuscripcionesCols
{
    const TABLA = 'cap_suscripciones';

    const ID = 'id';
    const CENTRO_ID = 'centro_id';
    const STRIPE_CUSTOMER_ID = 'stripe_customer_id';
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    const ESTADO = 'estado';
    const FECHA_INICIO = 'fecha_inicio';
    const FECHA_FIN = 'fecha_fin';
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'centro_id', 'stripe_customer_id', 'stripe_subscription_id', 'estado', 'fecha_inicio', 'fecha_fin', 'created_at', 'updated_at'];
}
