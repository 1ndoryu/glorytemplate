<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/TransaccionesSchema.php */

namespace App\Config\Schema\_generated;

final class TransaccionesCols
{
    const TABLA = 'transacciones';

    const ID = 'id';
    const COMPRADOR_ID = 'comprador_id';
    const CREADOR_ID = 'creador_id';
    const SAMPLE_ID = 'sample_id';
    const TIPO = 'tipo';
    const MONTO = 'monto';
    const MONEDA = 'moneda';
    const ESTADO = 'estado';
    const STRIPE_PAYMENT_ID = 'stripe_payment_id';
    const CREATED_AT = 'created_at';
    const PAGO_CREADOR = 'pago_creador';
    const COMISION_PLATAFORMA = 'comision_plataforma';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'comprador_id', 'creador_id', 'sample_id', 'tipo', 'monto', 'moneda', 'estado', 'stripe_payment_id', 'created_at', 'pago_creador', 'comision_plataforma'];
}
