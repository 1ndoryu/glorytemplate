/*
 * Tipos del Mezclador (Mini DAW)
 * Aislado de la app principal. Solo importa SampleResumen como dependencia.
 */

import type { SampleResumen } from '@app/types';

/* Compás musical — numerador/denominador (ej: 4/4, 3/4, 6/8) */
export interface Compas {
    numerador: number;
    denominador: number;
}

/* Un bloque de sample colocado en la timeline */
export interface BloqueMezclador {
    id: string;
    pistaId: string;
    sample: SampleResumen;
    audioBuffer: AudioBuffer | null;
    compasInicio: number;
    duracionCompases: number;
    volumen: number;
    playbackRate: number;
    silenciado: boolean;
    color: string;
    waveformPeaks: number[];
    /* C215: Configuración avanzada del bloque */
    invertido: boolean;
    fadeIn: number;
    fadeOut: number;
    recorteInicio: number;
    recorteFin: number | null;
    normalizado: boolean;
    /* C243+C244: Ancla inmutable para evitar drift y modo resize */
    duracionOriginalCompases: number;
    playbackRateOriginal: number;
    modoResize: 'stretch' | 'clip';
    /* C240: Desplazamiento de tonalidad en semitonos (-12 a +12) */
    detune: number;
    /*
     * C271: Modo de procesamiento tonal.
     * resample: pitch ligado a velocidad (vinilo, por defecto)
     * stretch: pitch independiente via SoundTouch DSP
     */
    modoTonalidad: 'resample' | 'stretch';
}

/* C215: Configuración parcial para actualizar un bloque */
export interface ConfigBloque {
    playbackRate?: number;
    volumen?: number;
    invertido?: boolean;
    fadeIn?: number;
    fadeOut?: number;
    recorteInicio?: number;
    recorteFin?: number | null;
    normalizado?: boolean;
    /* C244: Modo de resize */
    modoResize?: 'stretch' | 'clip';
    /* C240: Desplazamiento de tonalidad en semitonos */
    detune?: number;
    /* C271: Modo de procesamiento tonal */
    modoTonalidad?: 'resample' | 'stretch';
}

/* Una pista en la timeline */
export interface PistaMezclador {
    id: string;
    nombre: string;
    volumen: number;
    silenciada: boolean;
    bloques: BloqueMezclador[];
}

/* Estado completo del mezclador */
export interface EstadoMezclador {
    abierto: boolean;
    pistas: PistaMezclador[];
    bpmProyecto: number;
    compasProyecto: Compas;
    totalCompases: number;
    reproduciendo: boolean;
    tiempoActual: number;
    posicionCursor: number;
    duracionTotal: number;
    exportando: boolean;
    cargandoBuffers: Set<string>;
}

/* Opciones para exportar la mezcla */
export interface OpcionesExportacion {
    formato: 'wav';
    sampleRate: number;
    canales: number;
    duracionMaxima: number;
}

/* Resultado de inferir compás de un sample */
export interface InfoCompas {
    beats: number;
    compas: Compas;
    duracionCompases: number;
    playbackRate: number;
    confianza: number;
}

/* Evento para agregar sample al mezclador desde fuera */
export const EVENTO_AGREGAR_MEZCLADOR = 'kamples:agregar-mezclador';

/* C213: Evento para reprogramar audio en tiempo real */
export const EVENTO_REPROGRAMAR_AUDIO = 'kamples:reprogramar-audio';

/*
 * C216: Resoluciones de snap disponibles.
 * 'bar' = compás completo, 'beat' = 1 beat, '1/2' = medio beat, '1/4' = cuarto, '1/6' = sexto, 'off' = libre
 */
export type SnapResolucion = 'bar' | 'beat' | '1/2' | '1/4' | '1/6' | 'off';

/* C216: Fracciones de compás para cada resolución de snap */
export const SNAP_FRACCIONES: Record<SnapResolucion, number | null> = {
    bar: 1,
    beat: null,    /* calculado dinámicamente: 1 / compas.numerador */
    '1/2': null,   /* 1 / (numerador * 2) */
    '1/4': null,   /* 1 / (numerador * 4) */
    '1/6': null,   /* 1 / (numerador * 6) */
    off: null,
};

/* C217: Niveles de zoom predefinidos */
/* C229: Zoom — mínimo 100%, máximo 400%, incrementos de 5% */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
export const ZOOM_PASO = 0.05;

/* Constantes del mezclador */
export const CONSTANTES_MEZCLADOR = {
    BPM_DEFAULT: 120,
    COMPAS_DEFAULT: { numerador: 4, denominador: 4 } as Compas,
    COMPASES_DEFAULT: 4,
    COMPASES_MAX: 32,
    PISTAS_MAX: 16,
    DURACION_MAXIMA_SEGUNDOS: 300,
    ANCHO_PANEL_MIN: 400,
    ANCHO_PANEL_MAX: 800,
    SNAP_BEATS: true,
    LOOKAHEAD_MS: 100,
    SCHEDULE_INTERVAL_MS: 25,
    SAMPLE_RATE: 44100,
    CANALES: 2,
} as const;

/* Colores para bloques según tipo de sample */
export const COLORES_BLOQUE: Record<string, string> = {
    loop: 'var(--acento)',
    oneshot: 'var(--exito)',
    vocal: '#c084fc',
    fx: '#fb923c',
    default: 'var(--textoTerciario)',
};
