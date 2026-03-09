<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/DuplicadosPendientesSchema.php */

namespace App\Config\Schema\_generated;

final class DuplicadosPendientesCols
{
    const TABLA = 'duplicados_pendientes';

    const ID = 'id';
    const SAMPLE_ORIGINAL_ID = 'sample_original_id';
    const SAMPLE_DUPLICADO_ID = 'sample_duplicado_id';
    const TIPO = 'tipo';
    const ESTADO = 'estado';
    const RESUELTO_POR = 'resuelto_por';
    const RESUELTO_AT = 'resuelto_at';
    const NOTAS = 'notas';
    const CREATED_AT = 'created_at';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'sample_original_id', 'sample_duplicado_id', 'tipo', 'estado', 'resuelto_por', 'resuelto_at', 'notas', 'created_at'];
}
