<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/DuplicadosPendientesSchema.php */

namespace App\Config\Schema\_generated;

final class DuplicadosPendientesEnums
{
    /* Valores para columna "tipo" */
    const TIPO_CROSS_USUARIO = 'cross_usuario';
    const TIPO_MISMO_USUARIO = 'mismo_usuario';
    const TIPO_BACKFILL = 'backfill';

    const TODOS_TIPO = [self::TIPO_CROSS_USUARIO, self::TIPO_MISMO_USUARIO, self::TIPO_BACKFILL];

    /* Valores para columna "estado" */
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_APROBADO = 'aprobado';
    const ESTADO_RECHAZADO = 'rechazado';
    const ESTADO_FUSIONADO = 'fusionado';

    const TODOS_ESTADO = [self::ESTADO_PENDIENTE, self::ESTADO_APROBADO, self::ESTADO_RECHAZADO, self::ESTADO_FUSIONADO];
}
