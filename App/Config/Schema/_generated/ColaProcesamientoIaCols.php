<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ColaProcesamientoIaSchema.php */

namespace App\Config\Schema\_generated;

final class ColaProcesamientoIaCols
{
    const TABLA = 'cola_procesamiento_ia';

    const ID = 'id';
    const TIPO = 'tipo';
    const ENTIDAD_ID = 'entidad_id';
    const OPERACION = 'operacion';
    const ESTADO = 'estado';
    const INTENTOS = 'intentos';
    const MAX_INTENTOS = 'max_intentos';
    const ULTIMO_ERROR = 'ultimo_error';
    const PROXIMO_INTENTO = 'proximo_intento';
    const METADATA = 'metadata';
    const PROCESADO_AT = 'procesado_at';
    const CREATED_AT = 'created_at';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'tipo', 'entidad_id', 'operacion', 'estado', 'intentos', 'max_intentos', 'ultimo_error', 'proximo_intento', 'metadata', 'procesado_at', 'created_at'];
}
