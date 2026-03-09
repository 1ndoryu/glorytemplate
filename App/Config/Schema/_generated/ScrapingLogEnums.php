<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ScrapingLogSchema.php */

namespace App\Config\Schema\_generated;

final class ScrapingLogEnums
{
    /* Valores para columna "tipo_pagina" */
    const TIPO_PAGINA_HOT_SAMPLES = 'hot_samples';
    const TIPO_PAGINA_HOT_COVERS = 'hot_covers';
    const TIPO_PAGINA_HOT_REMIXES = 'hot_remixes';
    const TIPO_PAGINA_SAMPLE_DETAIL = 'sample_detail';
    const TIPO_PAGINA_COVER_DETAIL = 'cover_detail';
    const TIPO_PAGINA_REMIX_DETAIL = 'remix_detail';
    const TIPO_PAGINA_ARTIST = 'artist';
    const TIPO_PAGINA_TRACK = 'track';
    const TIPO_PAGINA_TRACK_SAMPLES = 'track_samples';
    const TIPO_PAGINA_TRACK_SAMPLED = 'track_sampled';
    const TIPO_PAGINA_BROWSE_YEAR = 'browse_year';
    const TIPO_PAGINA_BROWSE_GENRE = 'browse_genre';

    const TODOS_TIPO_PAGINA = [self::TIPO_PAGINA_HOT_SAMPLES, self::TIPO_PAGINA_HOT_COVERS, self::TIPO_PAGINA_HOT_REMIXES, self::TIPO_PAGINA_SAMPLE_DETAIL, self::TIPO_PAGINA_COVER_DETAIL, self::TIPO_PAGINA_REMIX_DETAIL, self::TIPO_PAGINA_ARTIST, self::TIPO_PAGINA_TRACK, self::TIPO_PAGINA_TRACK_SAMPLES, self::TIPO_PAGINA_TRACK_SAMPLED, self::TIPO_PAGINA_BROWSE_YEAR, self::TIPO_PAGINA_BROWSE_GENRE];

    /* Valores para columna "estado" */
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_PROCESADO = 'procesado';
    const ESTADO_ERROR = 'error';
    const ESTADO_SKIP = 'skip';

    const TODOS_ESTADO = [self::ESTADO_PENDIENTE, self::ESTADO_PROCESADO, self::ESTADO_ERROR, self::ESTADO_SKIP];
}
