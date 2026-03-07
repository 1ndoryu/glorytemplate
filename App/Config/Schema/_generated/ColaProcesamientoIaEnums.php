<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ColaProcesamientoIaSchema.php */

namespace App\Config\Schema\_generated;

final class ColaProcesamientoIaEnums
{
    /* Valores para columna "tipo" */
    const TIPO_SAMPLE = 'sample';
    const TIPO_COMENTARIO = 'comentario';
    const TIPO_PUBLICACION = 'publicacion';

    const TODOS_TIPO = [self::TIPO_SAMPLE, self::TIPO_COMENTARIO, self::TIPO_PUBLICACION];

    /* Valores para columna "operacion" */
    const OPERACION_ANALISIS_AUDIO = 'analisis_audio';
    const OPERACION_MODERACION_TEXTO = 'moderacion_texto';
    const OPERACION_MODERACION_IMAGEN = 'moderacion_imagen';
    const OPERACION_MODERACION_COMPLETA = 'moderacion_completa';

    const TODOS_OPERACION = [self::OPERACION_ANALISIS_AUDIO, self::OPERACION_MODERACION_TEXTO, self::OPERACION_MODERACION_IMAGEN, self::OPERACION_MODERACION_COMPLETA];

    /* Valores para columna "estado" */
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_PROCESANDO = 'procesando';
    const ESTADO_COMPLETADO = 'completado';
    const ESTADO_ERROR_REINTENTO = 'error_reintento';
    const ESTADO_ERROR_FINAL = 'error_final';

    const TODOS_ESTADO = [self::ESTADO_PENDIENTE, self::ESTADO_PROCESANDO, self::ESTADO_COMPLETADO, self::ESTADO_ERROR_REINTENTO, self::ESTADO_ERROR_FINAL];
}
