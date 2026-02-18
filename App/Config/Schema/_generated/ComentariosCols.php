<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ComentariosSchema.php */

namespace App\Config\Schema\_generated;

final class ComentariosCols
{
    const TABLA = 'comentarios';

    const ID = 'id';
    const AUTOR_ID = 'autor_id';
    const TIPO = 'tipo';
    const TARGET_ID = 'target_id';
    const CONTENIDO = 'contenido';
    const CREATED_AT = 'created_at';
    const TIPO_CONTENIDO = 'tipo_contenido';
    const MEDIA_URL = 'media_url';
    const MEDIA_METADATA = 'media_metadata';
    const MODERACION_ESTADO = 'moderacion_estado';
    const MODERACION_DETALLE = 'moderacion_detalle';
    const PARENT_ID = 'parent_id';
    const TOTAL_RESPUESTAS = 'total_respuestas';
    const TOTAL_LIKES = 'total_likes';
    const UPDATED_AT = 'updated_at';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'autor_id', 'tipo', 'target_id', 'contenido', 'created_at', 'tipo_contenido', 'media_url', 'media_metadata', 'moderacion_estado', 'moderacion_detalle', 'parent_id', 'total_respuestas', 'total_likes', 'updated_at'];
}
