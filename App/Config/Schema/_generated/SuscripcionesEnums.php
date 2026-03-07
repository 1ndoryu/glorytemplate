<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/SuscripcionesSchema.php */

namespace App\Config\Schema\_generated;

final class SuscripcionesEnums
{
    /* Valores para columna "estado" */
    const ESTADO_ACTIVA = 'activa';
    const ESTADO_CANCELADA = 'cancelada';
    const ESTADO_VENCIDA = 'vencida';
    const ESTADO_PERIODO_PRUEBA = 'periodo_prueba';

    const TODOS_ESTADO = [self::ESTADO_ACTIVA, self::ESTADO_CANCELADA, self::ESTADO_VENCIDA, self::ESTADO_PERIODO_PRUEBA];
}
