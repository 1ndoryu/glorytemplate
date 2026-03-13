<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ReportesSchema.php */

namespace App\Config\Schema\_generated;

final class ReportesEnums
{
    /* Valores para columna "tipo" */
    const TIPO_USUARIO = 'usuario';
    const TIPO_PUBLICACION = 'publicacion';
    const TIPO_COMENTARIO = 'comentario';
    const TIPO_SAMPLE = 'sample';
    const TIPO_ERROR_PLATAFORMA = 'error_plataforma';
    const TIPO_SOLICITUD_WHATSAPP = 'solicitud_whatsapp';
    const TIPO_LEGAL = 'legal';

    const TODOS_TIPO = [self::TIPO_USUARIO, self::TIPO_PUBLICACION, self::TIPO_COMENTARIO, self::TIPO_SAMPLE, self::TIPO_ERROR_PLATAFORMA, self::TIPO_SOLICITUD_WHATSAPP, self::TIPO_LEGAL];

    /* Valores para columna "estado" */
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_RESUELTO = 'resuelto';
    const ESTADO_DESCARTADO = 'descartado';

    const TODOS_ESTADO = [self::ESTADO_PENDIENTE, self::ESTADO_RESUELTO, self::ESTADO_DESCARTADO];
}
