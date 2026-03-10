<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ContribucionesPendientesSchema.php */

namespace App\Config\Schema\_generated;

final class ContribucionesPendientesEnums
{
    /* Valores para columna "cancion_nueva_lado" */
    const CANCION_NUEVA_LADO_DESTINO = 'destino';
    const CANCION_NUEVA_LADO_FUENTE = 'fuente';

    const TODOS_CANCION_NUEVA_LADO = [self::CANCION_NUEVA_LADO_DESTINO, self::CANCION_NUEVA_LADO_FUENTE];

    /* Valores para columna "tipo_relacion" */
    const TIPO_RELACION_SAMPLE = 'sample';
    const TIPO_RELACION_COVER = 'cover';
    const TIPO_RELACION_REMIX = 'remix';
    const TIPO_RELACION_INTERPOLATION = 'interpolation';

    const TODOS_TIPO_RELACION = [self::TIPO_RELACION_SAMPLE, self::TIPO_RELACION_COVER, self::TIPO_RELACION_REMIX, self::TIPO_RELACION_INTERPOLATION];

    /* Valores para columna "tipo_elemento" */
    const TIPO_ELEMENTO_HOOK_RIFF = 'hook_riff';
    const TIPO_ELEMENTO_VOCALS_LYRICS = 'vocals_lyrics';
    const TIPO_ELEMENTO_DRUMS = 'drums';
    const TIPO_ELEMENTO_BASS = 'bass';
    const TIPO_ELEMENTO_KEYS_SYNTH = 'keys_synth';
    const TIPO_ELEMENTO_SOUND_EFFECT = 'sound_effect';
    const TIPO_ELEMENTO_MULTIPLE_ELEMENTS = 'multiple_elements';
    const TIPO_ELEMENTO_OTHER = 'other';

    const TODOS_TIPO_ELEMENTO = [self::TIPO_ELEMENTO_HOOK_RIFF, self::TIPO_ELEMENTO_VOCALS_LYRICS, self::TIPO_ELEMENTO_DRUMS, self::TIPO_ELEMENTO_BASS, self::TIPO_ELEMENTO_KEYS_SYNTH, self::TIPO_ELEMENTO_SOUND_EFFECT, self::TIPO_ELEMENTO_MULTIPLE_ELEMENTS, self::TIPO_ELEMENTO_OTHER];

    /* Valores para columna "estado" */
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_APROBADA = 'aprobada';
    const ESTADO_RECHAZADA = 'rechazada';

    const TODOS_ESTADO = [self::ESTADO_PENDIENTE, self::ESTADO_APROBADA, self::ESTADO_RECHAZADA];
}
