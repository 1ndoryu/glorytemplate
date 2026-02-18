<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ReportesDuplicadosSchema.php */

namespace App\Config\Schema\_generated;

final class ReportesDuplicadosCols
{
    const TABLA = 'reportes_duplicados';

    const ID = 'id';
    const SAMPLE_ORIGINAL_ID = 'sample_original_id';
    const SAMPLE_DUPLICADO_ID = 'sample_duplicado_id';
    const REPORTADOR_ID = 'reportador_id';
    const ESTADO = 'estado';
    const PRUEBAS_TEXTO = 'pruebas_texto';
    const RESUELTO_AT = 'resuelto_at';
    const CREATED_AT = 'created_at';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'sample_original_id', 'sample_duplicado_id', 'reportador_id', 'estado', 'pruebas_texto', 'resuelto_at', 'created_at'];
}
