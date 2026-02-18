<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/PublicacionesSchema.php */

namespace App\Config\Schema\_generated;

final class PublicacionesCols
{
    const TABLA = 'publicaciones';

    const ID = 'id';
    const AUTOR_ID = 'autor_id';
    const TIPO = 'tipo';
    const CONTENIDO = 'contenido';
    const IMAGENES = 'imagenes';
    const SAMPLES_ADJUNTOS = 'samples_adjuntos';
    const TOTAL_LIKES = 'total_likes';
    const TOTAL_COMENTARIOS = 'total_comentarios';
    const TOTAL_REPOSTS = 'total_reposts';
    const CREATED_AT = 'created_at';
    const REPOST_ID = 'repost_id';
    const IMAGENES_METADATA = 'imagenes_metadata';
    const MODERACION_ESTADO = 'moderacion_estado';
    const MODERACION_DETALLE = 'moderacion_detalle';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'autor_id', 'tipo', 'contenido', 'imagenes', 'samples_adjuntos', 'total_likes', 'total_comentarios', 'total_reposts', 'created_at', 'repost_id', 'imagenes_metadata', 'moderacion_estado', 'moderacion_detalle'];
}
