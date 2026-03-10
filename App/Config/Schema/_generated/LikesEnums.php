<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/LikesSchema.php */

namespace App\Config\Schema\_generated;

final class LikesEnums
{
    /* Valores para columna "tipo" */
    const TIPO_SAMPLE = 'sample';
    const TIPO_PUBLICACION = 'publicacion';
    const TIPO_COMENTARIO = 'comentario';
    const TIPO_CANCION = 'cancion';
    const TIPO_RELACION = 'relacion';

    const TODOS_TIPO = [self::TIPO_SAMPLE, self::TIPO_PUBLICACION, self::TIPO_COMENTARIO, self::TIPO_CANCION, self::TIPO_RELACION];

    /* Valores para columna "reaccion" */
    const REACCION_LIKE = 'like';
    const REACCION_DISLIKE = 'dislike';
    const REACCION_ENCANTA = 'encanta';

    const TODOS_REACCION = [self::REACCION_LIKE, self::REACCION_DISLIKE, self::REACCION_ENCANTA];
}
