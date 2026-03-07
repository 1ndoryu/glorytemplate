<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/TransaccionesSchema.php */

namespace App\Config\Schema\_generated;

final class TransaccionesEnums
{
    /* Valores para columna "tipo" */
    const TIPO_SUSCRIPCION = 'suscripcion';
    const TIPO_COMPRA_SAMPLE = 'compra_sample';
    const TIPO_PAYOUT = 'payout';

    const TODOS_TIPO = [self::TIPO_SUSCRIPCION, self::TIPO_COMPRA_SAMPLE, self::TIPO_PAYOUT];

    /* Valores para columna "estado" */
    const ESTADO_COMPLETADA = 'completada';
    const ESTADO_COMPLETED = 'completed';
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_FALLIDA = 'fallida';
    const ESTADO_REEMBOLSADA = 'reembolsada';

    const TODOS_ESTADO = [self::ESTADO_COMPLETADA, self::ESTADO_COMPLETED, self::ESTADO_PENDIENTE, self::ESTADO_FALLIDA, self::ESTADO_REEMBOLSADA];
}
