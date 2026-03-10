<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ScrapingLogSchema.php */

namespace App\Config\Schema\_generated;

final class ScrapingLogCols
{
    const TABLA = 'scraping_log';

    const ID = 'id';
    const URL = 'url';
    const TIPO_PAGINA = 'tipo_pagina';
    const ESTADO = 'estado';
    const INTENTOS = 'intentos';
    const BYTES_DESCARGADOS = 'bytes_descargados';
    const ERROR_MENSAJE = 'error_mensaje';
    const RE_SCRAPEABLE = 're_scrapeable';
    const PROXIMO_RESCRAPE = 'proximo_rescrape';
    const VECES_RESCRAPEADO = 'veces_rescrapeado';
    const PROCESADO_AT = 'procesado_at';
    const CREATED_AT = 'created_at';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'url', 'tipo_pagina', 'estado', 'intentos', 'bytes_descargados', 'error_mensaje', 're_scrapeable', 'proximo_rescrape', 'veces_rescrapeado', 'procesado_at', 'created_at'];
}
