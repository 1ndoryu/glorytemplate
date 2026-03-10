<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ComentariosSchema.php */

namespace App\Config\Schema\_generated;

final class ComentariosEnums
{
    /* Valores para columna "tipo" */
    const TIPO_SAMPLE = 'sample';
    const TIPO_PUBLICACION = 'publicacion';
    const TIPO_CANCION = 'cancion';
    const TIPO_RELACION = 'relacion';

    const TODOS_TIPO = [self::TIPO_SAMPLE, self::TIPO_PUBLICACION, self::TIPO_CANCION, self::TIPO_RELACION];

    /* Valores para columna "tipo_contenido" */
    const TIPO_CONTENIDO_TEXTO = 'texto';
    const TIPO_CONTENIDO_IMAGEN = 'imagen';
    const TIPO_CONTENIDO_AUDIO = 'audio';

    const TODOS_TIPO_CONTENIDO = [self::TIPO_CONTENIDO_TEXTO, self::TIPO_CONTENIDO_IMAGEN, self::TIPO_CONTENIDO_AUDIO];

    /* Valores para columna "moderacion_estado" */
    const MODERACION_ESTADO_PENDIENTE = 'pendiente';
    const MODERACION_ESTADO_REVISION = 'revision';
    const MODERACION_ESTADO_APROBADO = 'aprobado';
    const MODERACION_ESTADO_RECHAZADO = 'rechazado';

    const TODOS_MODERACION_ESTADO = [self::MODERACION_ESTADO_PENDIENTE, self::MODERACION_ESTADO_REVISION, self::MODERACION_ESTADO_APROBADO, self::MODERACION_ESTADO_RECHAZADO];
}
