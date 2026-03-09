<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ColaExtraccionSamplesSchema.php */

namespace App\Config\Schema\_generated;

final class ColaExtraccionSamplesEnums
{
    /* Valores para columna "estado" */
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_DESCARGANDO = 'descargando';
    const ESTADO_ANALIZANDO = 'analizando';
    const ESTADO_RECORTANDO = 'recortando';
    const ESTADO_COMPLETADO = 'completado';
    const ESTADO_ERROR = 'error';
    const ESTADO_REVISION_HUMANA = 'revision_humana';

    const TODOS_ESTADO = [self::ESTADO_PENDIENTE, self::ESTADO_DESCARGANDO, self::ESTADO_ANALIZANDO, self::ESTADO_RECORTANDO, self::ESTADO_COMPLETADO, self::ESTADO_ERROR, self::ESTADO_REVISION_HUMANA];
}
