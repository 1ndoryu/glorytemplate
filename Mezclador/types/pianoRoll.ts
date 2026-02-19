/*
 * Tipos del Piano Roll — Editor melódico/rítmico de notas.
 * C310: Piano Roll tipo FL Studio para el DAW.
 * Cada nota dispara el sample del canal a un pitch via playbackRate.
 */

/* Resolución interna: Pulses Per Quarter note (1 beat = 96 ticks) */
export const PPQ = 96;

/* Constantes de nota MIDI */
export const NOTA_MIN = 0;
export const NOTA_MAX = 127;
export const NOTA_DEFAULT = 60; /* C5 — Middle C */

/* Una nota individual en el piano roll */
export interface NotaPianoRoll {
    id: string;
    nota: number;                /* MIDI number (0-127): C5=60, D5=62, etc. */
    inicio: number;              /* Posición en ticks desde inicio del patrón */
    duracion: number;            /* Longitud en ticks (mínimo 1) */
    velocity: number;            /* 0.0 - 1.0 (default 0.78 como FL) */
    pan: number;                 /* -1 a 1 (0 = centro) */
    finePitch: number;           /* Cents: -100 a +100 (micro-tuning) */
    color: number;               /* Índice de color 0-15 (paleta configurable) */
    silenciada: boolean;         /* Nota individual puede mutarse */
    canalId: string;             /* ID del CanalRack propietario */
}

/* Herramienta activa del piano roll */
export type HerramientaPianoRoll =
    | 'dibujar'
    | 'seleccionar'
    | 'cortar'
    | 'pintar'
    | 'borrar'
    | 'silenciar';

/* Snap del piano roll (independiente del snap del timeline) */
export type SnapPianoRoll =
    | 'none'
    | '1/1'
    | '1/2'
    | '1/4'
    | '1/8'
    | '1/16'
    | '1/32'
    | '1/3'
    | '1/6'
    | '1/12';

/* Ticks por snap en base PPQ 96, compás 4/4 */
export const SNAP_TICKS: Record<SnapPianoRoll, number> = {
    'none': 1,
    '1/1': PPQ * 4,
    '1/2': PPQ * 2,
    '1/4': PPQ,
    '1/8': PPQ / 2,
    '1/16': PPQ / 4,
    '1/32': PPQ / 8,
    '1/3': Math.round(PPQ * 4 / 3),
    '1/6': Math.round(PPQ * 2 / 3),
    '1/12': Math.round(PPQ / 3),
};

/* Tipo de dato editable en el panel de control inferior */
export type TipoControl =
    | 'velocity'
    | 'pan'
    | 'finePitch';

/* Estado visual del piano roll */
export interface VistaPianoRoll {
    scrollX: number;
    scrollY: number;
    zoomX: number;
    zoomY: number;
    alturaNota: number;       /* px por fila de nota (default 14) */
    anchoPiano: number;       /* ancho del teclado izquierdo (default 56) */
    alturaControl: number;    /* altura panel inferior (default 100) */
}

/* Defaults de la vista */
export const VISTA_DEFAULT: VistaPianoRoll = {
    scrollX: 0,
    scrollY: 60 * 14, /* Centrado aprox en C5 (MIDI 60) */
    zoomX: 1,
    zoomY: 1,
    alturaNota: 14,
    anchoPiano: 56,
    alturaControl: 100,
};

/* Paleta de 16 colores para notas (inspirado en FL Studio) */
export const PALETA_NOTAS: string[] = [
    '#fce94f',
    '#fcaf3e',
    '#e9b96e',
    '#8ae234',
    '#729fcf',
    '#ad7fa8',
    '#ef2929',
    '#888a85',
    '#c4a000',
    '#ce5c00',
    '#4e9a06',
    '#204a87',
    '#5c3566',
    '#a40000',
    '#2e3436',
    '#eeeeec',
];

/* Constantes del piano roll */
export const CONSTANTES_PIANO_ROLL = {
    VELOCITY_DEFAULT: 0.78,
    ZOOM_X_MIN: 0.25,
    ZOOM_X_MAX: 6,
    ZOOM_Y_MIN: 0.5,
    ZOOM_Y_MAX: 3,
    TOTAL_NOTAS: 128,           /* C-1 a G9 */
    OCTAVAS: 11,
    DURACION_DEFAULT_TICKS: PPQ, /* 1 beat por defecto */
    HANDLE_RESIZE_PX: 5,        /* ancho handle de resize en px */
    ANCHO_MINIMO_NOTA_PX: 4,    /* ancho mínimo visual */
} as const;

/* Nombres de notas musicales */
export const NOMBRES_NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
