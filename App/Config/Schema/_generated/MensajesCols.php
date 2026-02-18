<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/MensajesSchema.php */

namespace App\Config\Schema\_generated;

final class MensajesCols
{
    const TABLA = 'mensajes';

    const ID = 'id';
    const CONVERSACION_ID = 'conversacion_id';
    const AUTOR_ID = 'autor_id';
    const CONTENIDO = 'contenido';
    const LEIDO = 'leido';
    const CREATED_AT = 'created_at';
    const TIPO = 'tipo';
    const MEDIA_URL = 'media_url';
    const MEDIA_METADATA = 'media_metadata';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'conversacion_id', 'autor_id', 'contenido', 'leido', 'created_at', 'tipo', 'media_url', 'media_metadata'];
}
