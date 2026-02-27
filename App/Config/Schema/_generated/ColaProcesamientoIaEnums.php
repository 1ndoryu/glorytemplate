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

    /* Valores para columna "operacion" */
    const OPERACION_ANALISIS_AUDIO = 'analisis_audio';
    const OPERACION_MODERACION_TEXTO = 'moderacion_texto';
    const OPERACION_MODERACION_IMAGEN = 'moderacion_imagen';
    const OPERACION_MODERACION_COMPLETA = 'moderacion_completa';

    /* Valores para columna "estado" */
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_PROCESANDO = 'procesando';
    const ESTADO_COMPLETADO = 'completado';
    const ESTADO_ERROR_REINTENTO = 'error_reintento';
    const ESTADO_ERROR_FINAL = 'error_final';
}
