<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ComentariosSchema.php */

namespace App\Config\Schema\_generated;

final class ComentariosEnums
{
    /* Valores para columna "tipo" */
    const TIPO_SAMPLE = 'sample';
    const TIPO_PUBLICACION = 'publicacion';

    /* Valores para columna "tipo_contenido" — agregados manualmente, pendiente agregar CHECK al schema */
    const TIPO_CONTENIDO_TEXTO = 'texto';
    const TIPO_CONTENIDO_IMAGEN = 'imagen';
    const TIPO_CONTENIDO_AUDIO = 'audio';

    /* Valores para columna "moderacion_estado" */
    const MODERACION_APROBADO = 'aprobado';
    const MODERACION_RECHAZADO = 'rechazado';
}
