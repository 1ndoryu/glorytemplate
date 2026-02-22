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
    /* C287: Balance estéreo (-1 izquierda, 0 centro, 1 derecha) */
    pan: number;
    /* C287: Declicking — micro-fade automático al inicio/fin para evitar clicks digitales */
    modoDeclic: 'none' | 'corto' | 'medio' | 'largo';
    /* C287: Invertir polaridad (flip fase) — TO-DO: requiere procesamiento de buffer */
    invertirPolaridad: boolean;
    /* C287: Intercambiar canales L/R — TO-DO: requiere procesamiento de buffer */
    intercambiarEstereo: boolean;
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
    /* C287: Balance estéreo */
    pan?: number;
    /* C287: Declicking automático */
    modoDeclic?: 'none' | 'corto' | 'medio' | 'largo';
    /* C287: Invertir polaridad */
    invertirPolaridad?: boolean;
    /* C287: Intercambiar estéreo */
    intercambiarEstereo?: boolean;
}

/* PATTERN SYSTEM — Step sequencer + patrones reutilizables */

/* Un paso individual en el secuenciador */
export interface Paso {
    activo: boolean;
    velocity: number;      /* 0.0 - 1.0 (default 0.78 como FL) */
    pan: number;           /* -1 a 1 (0 = centro) */
    pitch: number;         /* semitonos offset (-12 a +12) */
}

/* Un canal dentro del Channel Rack (un instrumento/sample) */
export interface CanalRack {
    id: string;
    nombre: string;
    color: string;
    sampleId: string | null;
    audioBuffer: AudioBuffer | null;
    rutaAudio: string | null;
    volumen: number;
    pan: number;
    silenciado: boolean;
    solo: boolean;
    mixerInsertId: number;
    pasos: Paso[];
    tipo: 'sample' | 'oneshot';
}

/* Un patrón completo (equivale a un Pattern en FL Studio) */
export interface Patron {
    id: string;
    nombre: string;
    color: string;
    canales: CanalRack[];
    totalPasos: number;
    pasosVisibles: number;
    subdivisionPaso: number;
    swing: number;
    loop: boolean;
    creadoEn: number;
    modificadoEn: number;
}

/* Referencia de un patrón colocado en la playlist (timeline) */
export interface ClipPatron {
    id: string;
    patronId: string;
    pistaId: string;
    compasInicio: number;
    duracionCompases: number;
    silenciado: boolean;
    color: string;
}

/* MIXER — Consola de mezcla con inserts, EQ, y FX */

/* Un slot de efecto en un insert del mixer */
export interface SlotEfecto {
    id: string;
    indice: number;
    tipo: string | null;
    nombre: string;
    activo: boolean;
    parametros: Record<string, number>;
}

/* Banda del ecualizador paramétrico */
export interface BandaEQ {
    frecuencia: number;
    ganancia: number;
    q: number;
    tipo: 'lowshelf' | 'highshelf' | 'peaking' | 'lowpass' | 'highpass';
    activo: boolean;
}

/* Un canal/insert del mixer */
export interface InsertMixer {
    id: number;
    nombre: string;
    color: string;
    volumen: number;
    pan: number;
    silenciado: boolean;
    solo: boolean;
    eq: BandaEQ[];
    eqActivo: boolean;
    slots: SlotEfecto[];
    enviarA: number;
    peakL: number;
    peakR: number;
    envios: { insertDestinoId: number; nivel: number; preFader: boolean }[];
}

/* Estado completo del mixer */
export interface EstadoMixer {
    inserts: InsertMixer[];
    insertSeleccionado: number;
    visible: boolean;
    anchoInsert: number;
}

/* Nodos Web Audio de un insert del mixer */
export interface MixerInsertNodes {
    inputGain: GainNode;
    fader: GainNode;
    panner: StereoPannerNode;
    eqBandas: BiquadFilterNode[];
    analyser: AnalyserNode;
}

/* Una pista en la timeline */
export interface PistaMezclador {
    id: string;
    nombre: string;
    volumen: number;
    silenciada: boolean;
    bloques: BloqueMezclador[];
    clipsPatron: ClipPatron[];
    color: string;
    icono: string | null;
    altura: 'normal' | 'compacta' | 'minimizada';
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
/* C285: Zoom dinámico controlado por minimapa. ZOOM_MAX se calcula en runtime. */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 200;
export const ZOOM_PASO = 0.05;

/* C285: Límites de compases visibles para el minimapa */
export const COMPASES_VISIBLES_MAX = 30;
export const COMPASES_VISIBLES_MIN = 0.5;
/* C313: Relleno reducido — el DAW inicia con 8 compases (4 default + 4 padding) */
export const RELLENO_COMPASES = 4;

/*
 * C287: Duración en segundos del declicking según modo.
 * Son micro-fades imperceptibles para evitar clicks digitales.
 */
export const DECLIC_DURACIONES: Record<string, number> = {
    none: 0,
    corto: 0.003,
    medio: 0.01,
    largo: 0.03,
};

/* Constantes del mezclador */
export const CONSTANTES_MEZCLADOR = {
    BPM_DEFAULT: 120,
    COMPAS_DEFAULT: { numerador: 4, denominador: 4 } as Compas,
    COMPASES_DEFAULT: 4,
    COMPASES_MAX: 999,
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

/* Constantes del Channel Rack */
export const CONSTANTES_CHANNEL_RACK = {
    PASOS_DEFAULT: 16,
    PASOS_MIN: 4,
    PASOS_MAX: 64,
    CANALES_MAX: 32,
    VELOCITY_DEFAULT: 0.78,
    SWING_DEFAULT: 0,
    SUBDIVISION_DEFAULT: 1,
} as const;

/* Constantes del Mixer */
export const CONSTANTES_MIXER = {
    TOTAL_INSERTS: 16,
    SLOTS_FX: 10,
    EQ_BANDAS: 3,
    VOLUMEN_MAX: 1.25,
    ANCHO_INSERT_DEFAULT: 64,
} as const;

/* Colores por defecto para patrones nuevos */
export const COLORES_PATRON: string[] = [
    '#6c63ff', '#ff6b6b', '#51cf66', '#ffd43b',
    '#339af0', '#f06595', '#20c997', '#ff922b',
    '#845ef7', '#e64980', '#12b886', '#fab005',
    '#4c6ef5', '#d6336c', '#099268', '#e67700',
];

/* Crear un paso vacío con valores por defecto */
export const crearPasoVacio = (): Paso => ({
    activo: false,
    velocity: CONSTANTES_CHANNEL_RACK.VELOCITY_DEFAULT,
    pan: 0,
    pitch: 0,
});

/* Crear un InsertMixer con valores por defecto */
export const crearInsertDefault = (id: number): InsertMixer => ({
    id,
    nombre: id === 0 ? 'Master' : `Insert ${id}`,
    color: id === 0 ? '#6c63ff' : '#555',
    volumen: 0.8,
    pan: 0,
    silenciado: false,
    solo: false,
    eq: [
        { frecuencia: 200, ganancia: 0, q: 1, tipo: 'lowshelf', activo: true },
        { frecuencia: 1000, ganancia: 0, q: 1, tipo: 'peaking', activo: true },
        { frecuencia: 8000, ganancia: 0, q: 1, tipo: 'highshelf', activo: true },
    ],
    eqActivo: true,
    slots: Array.from({ length: CONSTANTES_MIXER.SLOTS_FX }, (_, i) => ({
        id: `slot-${id}-${i}`,
        indice: i,
        tipo: null,
        nombre: '',
        activo: true,
        parametros: {},
    })),
    enviarA: id === 0 ? -1 : 0,
    peakL: 0,
    peakR: 0,
    envios: [],
});
