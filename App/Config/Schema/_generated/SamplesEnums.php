<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/SamplesSchema.php */

namespace App\Config\Schema\_generated;

final class SamplesEnums
{
    /* Valores para columna "estado" */
    const ESTADO_PROCESANDO = 'procesando';
    const ESTADO_ACTIVO = 'activo';
    const ESTADO_INACTIVO = 'inactivo';
    const ESTADO_ELIMINADO = 'eliminado';
    const ESTADO_EN_SUPERVISION = 'en_supervision';

    const TODOS_ESTADO = [self::ESTADO_PROCESANDO, self::ESTADO_ACTIVO, self::ESTADO_INACTIVO, self::ESTADO_ELIMINADO, self::ESTADO_EN_SUPERVISION];

    /* Valores para columna "tipo" */
    const TIPO_LOOP = 'loop';
    const TIPO_ONESHOT = 'oneshot';

    const TODOS_TIPO = [self::TIPO_LOOP, self::TIPO_ONESHOT];
}
