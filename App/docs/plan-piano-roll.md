# Plan Arquitectónico: Piano Roll

> **Versión:** 1.0  
> **Fecha:** 18/02/2026  
> **Contexto:** Editor melódico/rítmico de notas para el Channel Rack del DAW  
> **Referencia visual:** Piano Roll de FL Studio  
> **Dependencia:** `plan-daw-channelrack-mixer.md` (AG-TWO, C308) — tipos `CanalRack`, `Patron`, `patronesStore`  
> **Conflictos:** Ninguno con AG-ONE (C297-C307) ni AG-TWO (Fase A actual)

---

## Índice

1. [Visión General](#1-visión-general)
2. [Relación con el Channel Rack (AG-TWO)](#2-relación-channel-rack)
3. [Modelo de Datos (Types)](#3-modelo-de-datos)
4. [Arquitectura de Stores](#4-stores)
5. [Motor de Audio — Reproducción de Notas](#5-motor-audio)
6. [Componentes y UI](#6-componentes)
7. [Herramientas de Edición](#7-herramientas)
8. [Fases de Implementación](#8-fases)
9. [Decisiones de Diseño](#9-decisiones)

---

## 1. Visión General

### Qué es el Piano Roll

El Piano Roll es el editor detallado de notas de un canal del Channel Rack. Mientras el Step Sequencer (grid de pasos) ofrece una interfaz simple de on/off por paso, el Piano Roll permite:

- **Colocar notas en cualquier pitch** (eje Y = notas musicales C0-B8)
- **Duración variable** por nota (no limitada a 1 paso)
- **Velocity, pan y pitch slide** editables por nota
- **Herramientas de dibujo** (pencil, select, slice, brush, paint)
- **Ghost notes** de otros canales como referencia visual
- **Panel de control inferior** (velocity bars, pitch, pan)
- **Snap configurable** independiente del step grid

### Modelo mental FL Studio

```
┌─────────────────────────────────────────────────────────────────────┐
│  Piano Roll — Canal: "DL Broken"                          ─ □ ✕   │
├─────────────────────────────────────────────────────────────────────┤
│  ✏ ✂ 🔲 🎨 ...  │  Snap: 1/4 ▼  │  Ghost ●  │  ◄ Pattern 1 ►   │
├─────┬───────────────────────────────────────────────────────────────┤
│     │  1         │  2         │  3         │  4         │          │
│ C6  │            │            │            │            │          │
│ B5  │            │            │            │            │          │
│ A5  │            │            │            │            │          │
│ G5  │            │            │            │            │          │
│ F5  │            │            │            │            │          │
│ E5  │            │            │            │            │          │
│ D5  │            │  ██████████████████████ │            │          │
│ C5  │            │            │            │            │          │
│ B4  │            │            │            │            │          │
│ A4  │ █████████████████       │            │            │          │
│ G4  │            │            │            │            │          │
│ ...  │            │            │            │            │          │
│ C4  │            │            │            │            │          │
├─────┴───────────────────────────────────────────────────────────────┤
│  Control ▸ Velocity                                                 │
│  ▓▓▓▓▓     ▓▓▓▓▓                                                   │
│  ▓▓▓▓▓     ▓▓▓▓▓                                                   │
│  ▓▓▓▓▓     ▓▓▓▓▓                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Cómo encaja en nuestro DAW

```
Channel Rack (AG-TWO, C308)
  └── Canal "808 Kick"    → Step Sequencer (pasos on/off)      [vista simple]
  └── Canal "DL Broken"   → Piano Roll (notas con pitch/dur)   [vista detallada]
  └── Canal "Bass Synth"  → Piano Roll (melodías complejas)    [vista detallada]

Un canal puede usar:
  A) Solo Step Sequencer (default para drums/oneshots)
  B) Piano Roll (para melodías, arreglos complejos)

Internamente AMBOS trabajan sobre el mismo dato: NotaPianoRoll[]
El Step Sequencer es un ALIAS visual: cada step activo = 1 nota en el pitch default del canal
```

---

## 2. Relación con el Channel Rack (AG-TWO)

### Modificaciones al modelo de AG-TWO

El plan de AG-TWO define `CanalRack` con un array `pasos: Paso[]`. Para soportar Piano Roll, necesitamos extender esto:

```typescript
/* ANTES (AG-TWO, solo step sequencer) */
interface CanalRack {
    pasos: Paso[];              /* Step grid: on/off + velocity */
}

/* DESPUÉS (con Piano Roll) */
interface CanalRack {
    /* Se mantiene para retrocompatibilidad del step sequencer */
    pasos: Paso[];

    /* NUEVO: Notas del piano roll (fuente de verdad) */
    notas: NotaPianoRoll[];

    /* NUEVO: Pitch base del canal (nota default para step sequencer) */
    pitchBase: number;          /* MIDI number, default 60 (C5) */

    /* NUEVO: Modo de edición preferido */
    modoEditor: 'steps' | 'pianoroll';
}
```

### Sincronización Steps ↔ Piano Roll

```
STEP SEQUENCER → PIANO ROLL:
  Cuando el usuario activa el paso N en el step grid:
    → Se crea una nota: { nota: canal.pitchBase, inicio: N, duracion: 1, velocity: paso.velocity }

PIANO ROLL → STEP SEQUENCER:
  Cuando hay notas en el piano roll y se visualiza el step grid:
    → Solo se muestran notas que coincidan con el pitchBase como "activas"
    → Notas en otros pitches se ignoran en la vista step (pero suenan)

REGLA: La fuente de verdad es SIEMPRE `notas: NotaPianoRoll[]`.
       El array `pasos[]` es un DERIVADO para la vista del step sequencer.
```

### Coordinación con AG-TWO

- AG-TWO implementa `CanalRack` con `pasos[]` en Fase A → **Sin conflicto** si se agrega `notas[]` y `pitchBase` antes de finalizar tipos
- Si AG-TWO ya entregó los tipos, simplemente se extienden (OCP)
- El Piano Roll NO modifica `patronesStore` ni `mixerStore` — solo agrega un store nuevo (`pianoRollStore`)
- El Piano Roll se abre DESDE un canal del Channel Rack (botón o doble-click en nombre)

---

## 3. Modelo de Datos (Types)

### 3.1 Nota del Piano Roll

```typescript
/* ============================================================
 * PIANO ROLL — Editor melódico/rítmico de notas
 * Ubicación: Mezclador/types/pianoRoll.ts
 * ============================================================ */

/*
 * Una nota individual en el piano roll.
 * Unidad temporal: "ticks" (subdivisiones del paso).
 * 1 paso = PPQ ticks (Pulses Per Quarter = resolución).
 * Default PPQ = 96 (igual que FL Studio).
 * Así: 1 semicorchea (1 step) = 24 ticks @ PPQ 96
 *      1 beat = 96 ticks
 *      1 compás (4/4) = 384 ticks
 */

/* Resolución interna del piano roll */
export const PPQ = 96; /* Pulses Per Quarter note (1 beat = 96 ticks) */

/* Constantes de la nota MIDI */
export const NOTA_MIN = 0;   /* C-1 (MIDI 0) */
export const NOTA_MAX = 127; /* G9 (MIDI 127) */
export const NOTA_DEFAULT = 60; /* C5 (Middle C) */

/* Una nota en el piano roll */
export interface NotaPianoRoll {
    id: string;                  /* UUID corto para identificar la nota */
    nota: number;                /* Número MIDI (0-127): C5=60, D5=62, etc. */
    inicio: number;              /* Posición en ticks desde el inicio del patrón */
    duracion: number;            /* Longitud en ticks (mínimo 1) */
    velocity: number;            /* 0.0 - 1.0 (default 0.78 como FL) */
    pan: number;                 /* -1 a 1 (0 = centro) */
    
    /* Automatización por nota (opcionales) */
    finePitch: number;           /* Cents: -100 a +100 (micro-tuning) */
    pitchSlide: number | null;   /* Nota MIDI destino para glide/portamento (null = sin slide) */
    
    /* Visual */
    color: number;               /* Índice de color 0-15 (paleta configurable) */
    seleccionada: boolean;       /* Estado de selección actual (runtime, no persistido) */
    silenciada: boolean;         /* Nota individual puede mutarse */
    
    /* Canal propietario (para cross-reference) */
    canalId: string;             /* ID del CanalRack al que pertenece */
}

/* Configuración de slide/portamento entre notas */
export interface ConfigSlide {
    habilitado: boolean;
    tiempo: number;              /* Duración del slide en ticks */
    curva: 'lineal' | 'exponencial' | 'logaritmica';
}
```

### 3.2 Estado del Editor Piano Roll

```typescript
/* Herramienta activa del piano roll */
export type HerramientaPianoRoll = 
    | 'dibujar'      /* Pencil — click para crear nota, drag para definir longitud */
    | 'seleccionar'  /* Select — marquee selection, mover, resize */
    | 'cortar'       /* Slice — click en nota para dividirla */
    | 'pintar'       /* Paint brush — mantener click y pintar notas en secuencia */
    | 'borrar'       /* Eraser — click en nota para eliminarla */
    | 'silenciar';   /* Mute — click en nota para togglear mute */

/* Snap del piano roll (independiente del snap del timeline) */
export type SnapPianoRoll = 
    | 'none'    /* Libre (resolución de 1 tick) */
    | '1/1'     /* Compás completo */
    | '1/2'     /* Media nota */
    | '1/4'     /* Negra (1 beat) */
    | '1/8'     /* Corchea */
    | '1/16'    /* Semicorchea (1 step standard) */
    | '1/32'    /* Fusa */
    | '1/64'    /* Semifusa */
    | '1/3'     /* Tresillo de negra */
    | '1/6'     /* Tresillo de corchea */
    | '1/12'    /* Tresillo de semicorchea */
    | '1/48';   /* Tresillo de fusa */

/* Fracciones de compás (4/4) para cada snap en ticks */
export const SNAP_TICKS: Record<SnapPianoRoll, number> = {
    'none': 1,
    '1/1':  PPQ * 4,      /* 384 */
    '1/2':  PPQ * 2,      /* 192 */
    '1/4':  PPQ,           /* 96 */
    '1/8':  PPQ / 2,       /* 48 */
    '1/16': PPQ / 4,       /* 24 */
    '1/32': PPQ / 8,       /* 12 */
    '1/64': PPQ / 16,      /* 6 */
    '1/3':  PPQ * 4 / 3,   /* 128 */
    '1/6':  PPQ * 2 / 3,   /* 64 */
    '1/12': PPQ / 3,       /* 32 */
    '1/48': PPQ / 12,      /* 8 */
};

/* Datos de control editables en el panel inferior */
export type TipoControl = 
    | 'velocity'     /* Barras de velocity por nota */
    | 'pan'          /* Pan por nota */
    | 'finePitch'    /* Micro-tuning cents */
    | 'pitchSlide';  /* Destino de pitch slide */

/* Estado de la vista del piano roll */
export interface VistaPianoRoll {
    /* Scroll y zoom independientes */
    scrollX: number;             /* Offset horizontal en px */
    scrollY: number;             /* Offset vertical en px */
    zoomX: number;               /* Zoom horizontal (1 = default, 2 = doble ancho) */
    zoomY: number;               /* Zoom vertical (1 = default) */
    
    /* Dimensiones calculadas */
    alturaNota: number;          /* Altura en px de cada fila de nota (default 14px como FL) */
    anchoPiano: number;          /* Ancho del teclado a la izquierda (default 56px) */
    alturaControl: number;       /* Altura del panel de control inferior (default 100px) */
    
    /* Rango visible */
    notaInferior: number;        /* Nota MIDI más baja visible */
    notaSuperior: number;        /* Nota MIDI más alta visible */
}

/* Paleta de colores para notas (16 colores como FL) */
export const PALETA_NOTAS: string[] = [
    '#fce94f', /* Amarillo claro (default) */
    '#fcaf3e', /* Naranja */
    '#e9b96e', /* Madera */
    '#8ae234', /* Verde lima */
    '#729fcf', /* Azul cielo */
    '#ad7fa8', /* Púrpura */
    '#ef2929', /* Rojo */
    '#888a85', /* Gris */
    '#c4a000', /* Amarillo oscuro */
    '#ce5c00', /* Naranja oscuro */
    '#4e9a06', /* Verde oscuro */
    '#204a87', /* Azul oscuro */
    '#5c3566', /* Púrpura oscuro */
    '#a40000', /* Rojo oscuro */
    '#2e3436', /* Casi negro */
    '#eeeeec', /* Blanco */
];
```

### 3.3 Utilidades de conversión Ticks ↔ Tiempo

```typescript
/* pianoRollUtils.ts — Conversiones entre ticks, segundos y compases */

/*
 * Ticks a segundos.
 * Formula: ticks * (60 / bpm) / PPQ
 */
export function ticksASegundos(ticks: number, bpm: number): number {
    return ticks * (60 / bpm) / PPQ;
}

/*
 * Segundos a ticks.
 * Formula: segundos * PPQ * bpm / 60
 */
export function segundosATicks(segundos: number, bpm: number): number {
    return Math.round(segundos * PPQ * bpm / 60);
}

/*
 * Ticks a compases (fracción).
 * 1 compás (4/4) = PPQ * 4 ticks = 384 ticks
 */
export function ticksACompases(ticks: number, numerador: number): number {
    return ticks / (PPQ * numerador);
}

/*
 * Compases a ticks.
 */
export function compasesATicks(compases: number, numerador: number): number {
    return Math.round(compases * PPQ * numerador);
}

/*
 * Número MIDI a nombre de nota.
 * 60 → "C5", 61 → "C#5", 62 → "D5", etc.
 */
const NOMBRES_NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiANombre(midi: number): string {
    const octava = Math.floor(midi / 12) - 1;
    const nota = NOMBRES_NOTAS[midi % 12];
    return `${nota}${octava}`;
}

/*
 * Nombre de nota a número MIDI.
 * "C5" → 60, "D#3" → 51
 */
export function nombreAMidi(nombre: string): number {
    const match = nombre.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) return NOTA_DEFAULT;
    const indice = NOMBRES_NOTAS.indexOf(match[1]);
    const octava = parseInt(match[2]);
    return (octava + 1) * 12 + indice;
}

/*
 * Aplicar snap a una posición en ticks.
 * Redondea al tick de snap más cercano.
 */
export function snapTick(tick: number, snap: SnapPianoRoll): number {
    const step = SNAP_TICKS[snap];
    if (step <= 1) return tick;
    return Math.round(tick / step) * step;
}

/*
 * Frecuencia en Hz de una nota MIDI.
 * Usa A4 = 440Hz como referencia (MIDI 69).
 * Formula: 440 * 2^((midi - 69) / 12)
 */
export function midiAFrecuencia(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/*
 * Calcular playbackRate para transponer un sample al pitch deseado.
 * pitchBase = pitch original del sample (MIDI number).
 * notaDestino = pitch al que queremos llevarlo.
 * Resultado: ratio de velocidad (1.0 = sin cambio).
 */
export function calcularRateParaPitch(pitchBase: number, notaDestino: number): number {
    const semitonos = notaDestino - pitchBase;
    return Math.pow(2, semitonos / 12);
}

/*
 * Verificar si una nota MIDI es tecla negra (sostenido/bemol).
 */
export function esTeclaNegra(midi: number): boolean {
    const n = midi % 12;
    return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
}
```

---

## 4. Arquitectura de Stores

### Principio: Store independiente del Piano Roll, no acoplar a patronesStore

```
stores/
├── patronesStore.ts                ← AG-TWO (no modificar directamente)
│   └── canales[].notas[]           ← Dato fuente — el piano roll LEE/ESCRIBE aquí
│
├── pianoRollStore.ts               ← NUEVO: Estado UI del editor
│   └── Estado de vista, herramienta, selección, clipboard
│
├── ventanasStore.ts                ← Existente: registrar ventana 'pianoRoll'
└── mezcladorStore.ts               ← Existente: modoReproduccion 'pat'|'song'
```

### 4.1 pianoRollStore

```typescript
/* pianoRollStore.ts — Estado del editor visual (UI-only, no datos de notas) */

import { create } from 'zustand';
import type { 
    HerramientaPianoRoll, 
    SnapPianoRoll, 
    TipoControl, 
    VistaPianoRoll, 
    NotaPianoRoll 
} from '../types/pianoRoll';

interface PianoRollState {
    /* Canal actualmente editándose */
    canalId: string | null;          /* ID del CanalRack cuyo piano roll está abierto */
    patronId: string | null;         /* Patrón al que pertenece el canal */
    abierto: boolean;                /* Visible o no */
    
    /* Herramienta y snap */
    herramienta: HerramientaPianoRoll;
    snap: SnapPianoRoll;
    duracionDefault: number;         /* Duración en ticks de nuevas notas (default PPQ = 1 beat) */
    
    /* Vista */
    vista: VistaPianoRoll;
    
    /* Panel de control inferior */
    controlActivo: TipoControl;
    controlAbierto: boolean;         /* Toggle panel inferior */
    
    /* Selección */
    notasSeleccionadas: Set<string>; /* IDs de notas seleccionadas */
    
    /* Clipboard */
    clipboard: NotaPianoRoll[] | null;
    
    /* Ghost notes */
    ghostHabilitado: boolean;        /* Mostrar notas de otros canales */
    ghostCanales: string[];          /* IDs de canales cuyos ghost notes se muestran */
    
    /* Preview audio */
    previewActivo: boolean;          /* Suena la nota al hacer click */
    
    /* ========== ACCIONES ========== */
    
    /* Lifecycle */
    abrir: (patronId: string, canalId: string) => void;
    cerrar: () => void;
    
    /* Herramientas */
    setHerramienta: (h: HerramientaPianoRoll) => void;
    setSnap: (s: SnapPianoRoll) => void;
    setDuracionDefault: (ticks: number) => void;
    
    /* Vista */
    setScrollX: (x: number) => void;
    setScrollY: (y: number) => void;
    setZoomX: (z: number) => void;
    setZoomY: (z: number) => void;
    centrarEnNota: (midi: number) => void;
    
    /* Control inferior */
    setControlActivo: (tipo: TipoControl) => void;
    toggleControlAbierto: () => void;
    
    /* Selección */
    seleccionarNota: (id: string, ctrl: boolean) => void;
    seleccionarRango: (ids: string[]) => void;
    seleccionarTodas: () => void;
    limpiarSeleccion: () => void;
    
    /* Clipboard */
    copiar: () => void;
    cortar: () => void;
    pegar: (posicionTicks: number) => void;
    
    /* Ghost */
    toggleGhost: () => void;
    setGhostCanales: (ids: string[]) => void;
    
    /* Preview */
    togglePreview: () => void;
}
```

### 4.2 Acciones que modifican datos (en patronesStore)

Las acciones que crean/mueven/eliminan notas van como extensiones del `patronesStore` de AG-TWO, porque las notas viven dentro de `CanalRack.notas[]`:

```typescript
/* Extensiones al patronesStore de AG-TWO */

/* Notas del Piano Roll */
crearNota: (patronId: string, canalId: string, nota: Omit<NotaPianoRoll, 'id' | 'seleccionada'>) => string;
eliminarNota: (patronId: string, canalId: string, notaId: string) => void;
eliminarNotasSeleccionadas: (patronId: string, canalId: string, ids: string[]) => void;
moverNota: (patronId: string, canalId: string, notaId: string, deltaTicks: number, deltaPitch: number) => void;
moverNotasBatch: (patronId: string, canalId: string, ids: string[], deltaTicks: number, deltaPitch: number) => void;
redimensionarNota: (patronId: string, canalId: string, notaId: string, nuevaDuracion: number) => void;
setVelocityNota: (patronId: string, canalId: string, notaId: string, velocity: number) => void;
setVelocityBatch: (patronId: string, canalId: string, ids: string[], velocity: number) => void;
dividirNota: (patronId: string, canalId: string, notaId: string, enTick: number) => void;
duplicarNotas: (patronId: string, canalId: string, ids: string[], offsetTicks: number) => void;
cuantizarNotas: (patronId: string, canalId: string, ids: string[], snap: SnapPianoRoll) => void;
transponerNotas: (patronId: string, canalId: string, ids: string[], semitonos: number) => void;

/* Sincronización step sequencer ↔ piano roll */
sincronizarStepsDesdeNotas: (patronId: string, canalId: string) => void;
sincronizarNotasDesdeSteps: (patronId: string, canalId: string) => void;
```

---

## 5. Motor de Audio — Reproducción de Notas

### 5.1 Diferencia con Step Sequencer

```
STEP SEQUENCER (AG-TWO, actual):
  ► Itera pasos[] linealmente
  ► Cada paso activo → 1 disparo del sample al pitch del canal
  ► playbackRate fijo por canal

PIANO ROLL:
  ► Itera notas[] del piano roll
  ► Cada nota puede tener pitch DIFERENTE
  ► playbackRate = calcularRateParaPitch(canal.pitchBase, nota.nota)
  ► Duración variable por nota
  ► Velocity y pan individuales por nota
```

### 5.2 Función de programación

```typescript
/* motorAudioService.ts — Agregar método para piano roll */

/*
 * Programar todas las notas de un canal usando datos del piano roll.
 * Se usa en vez de iterar pasos[] cuando el canal tiene modoEditor='pianoroll'
 * o cuando tiene notas[] con datos.
 */
function programarNotasPianoRoll(
    canal: CanalRack,
    bpm: number,
    compas: Compas,
    desdeSegundo: number,
    swing: number
): void {
    if (!canal.audioBuffer || canal.silenciado) return;

    const duracionTick = (60 / bpm) / PPQ;  /* Duración de 1 tick en segundos */

    for (const nota of canal.notas) {
        if (nota.silenciada) continue;

        /* Cuándo suena (conversión ticks → segundos) */
        const cuando = desdeSegundo + (nota.inicio * duracionTick);

        /* Duración en segundos */
        const duracionSegundos = nota.duracion * duracionTick;

        /* PlaybackRate para el pitch deseado */
        const rate = calcularRateParaPitch(canal.pitchBase, nota.nota);

        /* 
         * Duración real del audio: 
         * Si el sample es corto (oneshot), se reproduce completo hasta duracionSegundos
         * Si el sample es largo, se recorta a duracionSegundos
         */
        const durReal = Math.min(
            canal.audioBuffer.duration / Math.abs(rate),
            duracionSegundos
        );

        motorAudio.programarReproduccionCanal(
            canal.audioBuffer,
            canal.id,
            canal.mixerInsertId,
            cuando,
            0,                          /* offset inicio */
            durReal,                    /* duración */
            rate,                       /* playbackRate (pitch) */
            nota.velocity * canal.volumen,
            false,                      /* invertido */
            0, 0,                       /* fades (TO-DO: per-note fades) */
            0,                          /* detune en cents (nota ya define pitch via rate) */
            'resample',                 /* modo tonalidad */
            `${canal.id}:${nota.id}`,   /* bloqueId para cache */
            nota.pan !== 0 ? nota.pan : canal.pan,
            'corto',                    /* declicking */
        );
    }
}

/*
 * Extensión de programarPatron (AG-TWO):
 * Bifurcar según modoEditor del canal.
 */
function programarPatronExtendido(
    patron: Patron,
    bpm: number,
    compas: Compas,
    desdeSegundo: number
): void {
    for (const canal of patron.canales) {
        if (canal.silenciado || !canal.audioBuffer) continue;

        /* Solo activo si hay solos */
        const haySolo = patron.canales.some(c => c.solo);
        if (haySolo && !canal.solo) continue;

        if (canal.modoEditor === 'pianoroll' || canal.notas.length > 0) {
            /* Piano Roll: notas con pitch variable */
            programarNotasPianoRoll(canal, bpm, compas, desdeSegundo, patron.swing);
        } else {
            /* Step Sequencer: pasos on/off (implementación AG-TWO original) */
            programarStepSequencer(canal, bpm, compas, desdeSegundo, patron.swing);
        }
    }
}
```

### 5.3 Preview de notas (click para escuchar)

```typescript
/*
 * Al hacer click en el piano roll con preview activo,
 * reproducir un sample corto del canal al pitch clickeado.
 */
function previewNota(
    canal: CanalRack,
    notaMidi: number,
    velocity: number = 0.78
): void {
    if (!canal.audioBuffer) return;
    
    const rate = calcularRateParaPitch(canal.pitchBase, notaMidi);
    const ctx = motorAudio.obtenerContexto();
    
    const fuente = ctx.createBufferSource();
    fuente.buffer = canal.audioBuffer;
    fuente.playbackRate.value = rate;
    
    const gain = ctx.createGain();
    gain.gain.value = velocity * canal.volumen;
    
    fuente.connect(gain);
    gain.connect(ctx.destination); /* Preview directo, sin mixer */
    
    /* Reproducir solo 0.5s máximo para preview */
    const durPreview = Math.min(canal.audioBuffer.duration / Math.abs(rate), 0.5);
    fuente.start(0, 0, durPreview);
    
    /* Fade out suave al final */
    gain.gain.setTargetAtTime(0, ctx.currentTime + durPreview - 0.05, 0.02);
}
```

---

## 6. Componentes y UI

### 6.1 Jerarquía de componentes

```
Mezclador/
├── components/
│   ├── PianoRoll/
│   │   ├── PianoRoll.tsx               ← Contenedor principal (VentanaFlotante)
│   │   ├── CabeceraPianoRoll.tsx       ← Toolbar: herramientas + snap + ghost + patrón
│   │   ├── TecladoPiano.tsx            ← Teclado vertical a la izquierda (C0-B8)
│   │   ├── GridNotas.tsx               ← Canvas/SVG: grid + notas + interactividad
│   │   ├── NotaRect.tsx                ← Una nota individual (rect draggable + resize)
│   │   ├── ReglaTemporal.tsx           ← Regla superior (compases + beats)
│   │   ├── PanelControl.tsx            ← Panel inferior (velocity/pan/pitch bars)
│   │   ├── BarraVelocity.tsx           ← Una barra vertical en el panel de control
│   │   ├── GhostNotes.tsx              ← Overlay de notas fantasma de otros canales
│   │   ├── Marquee.tsx                 ← Rectángulo de selección drag
│   │   └── MinimapaPianoRoll.tsx       ← Vista miniatura general (opcional)
│   │
│   └── ChannelRack/                    ← AG-TWO (agregar botón "Piano Roll")
│       └── CanalStrip.tsx              ← MODIFICAR: botón para abrir Piano Roll
```

### 6.2 Layout detallado del Piano Roll

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Piano Roll — DL Broken (Pattern 1)                                              ─ □ ✕     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  TOOLBAR                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐│
│  │ ✏ Draw │ ↖ Select │ ✂ Slice │ 🔲 Paint │ ✕ Erase │ ♪ Mute ║ Snap: 1/4 ▼ ║ 👻 Ghost  ││
│  │                                                     ║ Dur: 1beat  ║ 🔊 Preview         ││
│  └──────────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                              │
│  MAIN AREA                                                                                   │
│  ┌────────┬─────────────────────────────────────────────────────────────────────────────────┐│
│  │        │  1    ·    ·    ·    │  2    ·    ·    ·    │  3    ·    ·    ·    │  4          ││
│  │ TECLADO│  REGLA TEMPORAL (compases + subdivisions)                                      ││
│  │ PIANO  ├─────────────────────────────────────────────────────────────────────────────────┤│
│  │        │                                                                                 ││
│  │   C6 ─ │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   B5   │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   A#5  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   A5   │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   G#5  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   G5   │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   F#5  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   F5   │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   E5   │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   D#5  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   D5 ─ │  · · · · · · ██████████████████████████████ · · · · · · · · · · · · · · · · ·  ││
│  │   C#5  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   C5 ─ │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   B4   │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   A#4  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   A4 ─ │  ██████████████████████ · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   G#4  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   G4   │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   ...  │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │   C4 ─ │  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·  ││
│  │        │                                                                                 ││
│  └────────┴─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                              │
│  PANEL DE CONTROL                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐│
│  │  Control ▸│ Velocity │ Pan │ Fine Pitch │ Slide │                                       ││
│  │  ┌────────┴──────────────────────────────────────────────────────────────────────────┐   ││
│  │  │  ▓▓▓▓▓                    ▓▓▓▓▓                                                 │   ││
│  │  │  ▓▓▓▓▓                    ▓▓▓▓▓                                                 │   ││
│  │  │  ▓▓▓▓▓                    ▓▓▓▓▓                                                 │   ││
│  │  └──────────────────────────────────────────────────────────────────────────────────┘   ││
│  └──────────────────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────────────┘

LEYENDA:
─ = Líneas de nota C (todas las C se resaltan para orientación)
██ = Nota activa (color del canal o color asignado a la nota)
 · = Celda vacía del grid
▓▓ = Barra de velocity (altura proporcional al valor)
Teclas negras en el piano tienen fondo más oscuro en su fila correspondiente
```

### 6.3 Teclado Piano (lateral)

```
┌────────┐
│        │ ← Tecla blanca (C6)
│   ██   │ ← Tecla negra (B5, más angosta y oscura)
│        │ ← Tecla blanca (A#5... wait)
│        │
│   ██   │
│        │
│        │
│   ██   │
│        │
│   ██   │
│        │
│   ██   │
│        │  ← C5 (se marca con label "C5")
│        │
│   ██   │
│  ...   │
│        │  ← C4
└────────┘

Interactividad:
- Click en tecla → preview del sample a ese pitch
- Hover → resaltar la fila correspondiente en el grid
- Las teclas C siempre llevan label visible
- Scroll vertical sincronizado con el grid de notas
- Color de tecla activa cuando hay notas en esa fila
```

### 6.4 Grid de Notas (GridNotas.tsx) — Decisión técnica

**Canvas vs. SVG vs. DOM:**

| | Canvas | SVG | DOM divs |
|---|---|---|---|
| Performance (100+ notas) | Excelente | Buena | Regular |
| Interactividad (click/drag) | Manual (hitbox) | Nativa | Nativa |
| Zoom/redraw | Re-render completo | Scale transform | CSS zoom |
| Complejidad | Alta | Media | Baja |

**Decisión: Canvas para el grid background + DOM divs para las notas.**

Razón:
- El grid de fondo (líneas, colores de teclas negras, líneas de compás) es estático → Canvas eficiente
- Las notas necesitan interactividad rica (click, drag, resize handles, hover, context menu) → DOM más fácil
- Las ghost notes son solo visual → Canvas
- Mismo approach que usa FL Studio (overlay de notas sobre grid renderizado)

```
<div class="pianoRollGrid" style="position: relative">
    <canvas class="pianoRollGridFondo" />           ← Grid background (lineas, colores)
    <canvas class="pianoRollGhostNotes" />           ← Ghost notes semitransparentes
    <div class="pianoRollNotasContenedor">           ← Contenedor de notas DOM
        <div class="pianoRollNota" style="left/top/width/height" />
        <div class="pianoRollNota" style="..." />
        ...
    </div>
    <div class="pianoRollMarquee" />                 ← Rectángulo de selección
    <div class="pianoRollCursor" />                  ← Línea de playback
</div>
```

---

## 7. Herramientas de Edición

### 7.1 Tabla de herramientas

| Herramienta | Icono | Click en vacío | Click en nota | Drag en vacío | Drag en nota |
|---|---|---|---|---|---|
| **Dibujar** | ✏ Pencil | Crear nota | Eliminar nota | Crear + definir duración | - |
| **Seleccionar** | ↖ Arrow | Deseleccionar todo | Toggle selección | Marquee selection | Mover nota(s) |
| **Cortar** | ✂ Scissors | - | Dividir nota en posición del click | - | - |
| **Pintar** | 🔲 Brush | Crear nota | - | Crear notas continuas al arrastrar | - |
| **Borrar** | ✕ Eraser | - | Eliminar nota | Eliminar notas al pasar | - |
| **Silenciar** | ♪ Mute | - | Toggle mute nota | Toggle mute al pasar | - |

### 7.2 Atajos de teclado

```
DIBUJO Y EDICIÓN:
P / 1         → Herramienta Dibujar (Pencil)
S / 2         → Herramienta Seleccionar
C / 3         → Herramienta Cortar (Cut)
B / 4         → Herramienta Pintar (Brush/Paint)
D / 5         → Herramienta Borrar (Delete/Eraser)
T / 6         → Herramienta Silenciar (mute Toggle)

SELECCIÓN:
Ctrl+A        → Seleccionar todas las notas
Ctrl+D        → Deseleccionar todo
Delete/Supr   → Eliminar notas seleccionadas
Ctrl+C        → Copiar selección
Ctrl+X        → Cortar selección
Ctrl+V        → Pegar (en posición del cursor)
Ctrl+Z        → Deshacer
Ctrl+Y        → Rehacer

TRANSPOSICIÓN:
↑ / ↓         → Mover notas seleccionadas ±1 semitono
Shift+↑/↓     → Mover notas seleccionadas ±1 octava (±12 semitonos)
Ctrl+↑/↓      → Aumentar/disminuir velocity (±0.05)

NAVEGACIÓN:
Scroll Wheel        → Scroll vertical (pitch)
Shift+Scroll        → Scroll horizontal (tiempo)
Ctrl+Scroll         → Zoom horizontal
Ctrl+Shift+Scroll   → Zoom vertical
Middle-click+drag   → Pan libre (mover vista)

REPRODUCCIÓN:
Space             → Play/Stop (hereda del DAW)
Ctrl+Space        → Play desde inicio del patrón
```

### 7.3 Interacciones del mouse en notas

```
NOTA SELECCIONADA — MODOS DE INTERACCIÓN:

┌─────────────────────────────────────┐
│ ◄►│        NOTA BODY          │◄►   │
│   │   (drag = mover)         │     │
│   │                          │     │
└───┴──────────────────────────┴─────┘
 ▲                               ▲
 │                               │
 Resize izquierdo               Resize derecho
 (cambiar inicio,               (cambiar duración,
  mantener fin)                  mantener inicio)

CURSOR ICONS:
- Cuerpo de nota → cursor: grab (move)
- Borde izquierdo (3px) → cursor: ew-resize
- Borde derecho (3px) → cursor: ew-resize
- Sobre grid vacío + herramienta draw → cursor: crosshair
- Sobre grid vacío + herramienta select → cursor: default

CLICK DERECHO (Context Menu):
- En nota → Copiar, Cortar, Eliminar, Color ▸, Velocity ▸, Seleccionar canal
- En vacío → Pegar aquí, Seleccionar todo, Zoom ▸
```

---

## 8. Fases de Implementación

### FASE PR-A — Tipos y Store (Dificultad: MEDIA) — Prerequisito: AG-TWO Fase A

> Se puede empezar en paralelo a AG-TWO si se crean los tipos en archivo aparte

| # | Tarea | Detalles | Archivos |
|---|-------|---------|----------|
| PR-A1 | Tipos Piano Roll | `NotaPianoRoll`, `HerramientaPianoRoll`, `SnapPianoRoll`, `VistaPianoRoll`, constantes | `types/pianoRoll.ts` (~120 lín) |
| PR-A2 | Utilidades Piano Roll | Conversiones ticks↔seg↔compases, MIDI↔nombre, snap, rate por pitch | `utils/pianoRollUtils.ts` (~100 lín) |
| PR-A3 | Store UI Piano Roll | `pianoRollStore.ts` — estado de vista, herramientas, selección, clipboard | `stores/pianoRollStore.ts` (~200 lín) |
| PR-A4 | Extender CanalRack | Agregar `notas[]`, `pitchBase`, `modoEditor` al tipo de AG-TWO | `types/mezclador.ts` (~10 lín) |
| PR-A5 | Acciones notas en patronesStore | CRUD notas, mover/resize/velocity batch, cuantizar, transponer | `stores/accionesNotas.ts` (~200 lín) |

### FASE PR-B — Grid y Edición básica (Dificultad: ALTA) — La más difícil

> El core del Piano Roll: grid renderizado, interactividad completa

| # | Tarea | Detalles | Archivos |
|---|-------|---------|----------|
| PR-B1 | `PianoRoll.tsx` contenedor | VentanaFlotante, layout principal (toolbar + teclado + grid + control) | `components/PianoRoll/PianoRoll.tsx` (~150 lín) |
| PR-B2 | `TecladoPiano.tsx` | Teclado vertical, click preview, hover highlight, labels C, scroll sync | `components/PianoRoll/TecladoPiano.tsx` (~120 lín) |
| PR-B3 | `GridNotas.tsx` canvas bg | Canvas: líneas horizontales (notas), verticales (beats), colores teclas negras | `components/PianoRoll/GridNotas.tsx` (~200 lín) |
| PR-B4 | `NotaRect.tsx` | Nota DOM: position absolute, drag mover, resize handles L/R, selección visual | `components/PianoRoll/NotaRect.tsx` (~150 lín) |
| PR-B5 | `ReglaTemporal.tsx` | Regla superior con números de compás + subdivisions, click = set cursor | `components/PianoRoll/ReglaTemporal.tsx` (~80 lín) |
| PR-B6 | `CabeceraPianoRoll.tsx` | Toolbar: botones herramientas, dropdown snap, ghost toggle, preview toggle | `components/PianoRoll/CabeceraPianoRoll.tsx` (~100 lín) |
| PR-B7 | Hook `usePianoRoll.ts` | Lógica de interacción: click→crear/mover/resize según herramienta, snap, drag | `hooks/usePianoRoll.ts` (~250 lín) |
| PR-B8 | Hook `usePianoRollGrid.ts` | Canvas rendering: dibujar grid, resize observer, zoom/scroll, rAF | `hooks/usePianoRollGrid.ts` (~150 lín) |
| PR-B9 | CSS Piano Roll | `pianoRoll.css` — grid, notas, teclado, toolbar, panel control, colores | `styles/pianoRoll.css` (~300 lín) |

### FASE PR-C — Panel de Control + Audio (Dificultad: MEDIA)

| # | Tarea | Detalles | Archivos |
|---|-------|---------|----------|
| PR-C1 | `PanelControl.tsx` | Panel inferior: tabs velocity/pan/pitch, barras editables por nota | `components/PianoRoll/PanelControl.tsx` (~120 lín) |
| PR-C2 | `BarraVelocity.tsx` | Barra vertical drag para editar velocity, coloreada por valor | `components/PianoRoll/BarraVelocity.tsx` (~60 lín) |
| PR-C3 | Motor audio: notas | `programarNotasPianoRoll()` en motorAudioService | `services/motorAudioService.ts` (mod ~80 lín) |
| PR-C4 | Preview nota click | Preview rápido al hacer click en teclado o colocar nota | `services/motorAudioService.ts` (mod ~30 lín) |
| PR-C5 | Marquee selection | `Marquee.tsx` — rect de selección drag, detecta notas en rango | `components/PianoRoll/Marquee.tsx` (~80 lín) |

### FASE PR-D — Features avanzados (Dificultad: MEDIA-BAJA)

| # | Tarea | Detalles | Archivos |
|---|-------|---------|----------|
| PR-D1 | Ghost Notes | Notas semitransparentes de otros canales del mismo patrón | `components/PianoRoll/GhostNotes.tsx` (~80 lín) |
| PR-D2 | Cuantizar UI | Botón/shortcut para alinear notas seleccionadas al snap activo | integrado en `usePianoRoll.ts` |
| PR-D3 | Copiar/Pegar/Cortar | Clipboard de notas con offset inteligente | integrado en `pianoRollStore.ts` |
| PR-D4 | Atajos de teclado | Mapa completo de shortcuts (ver sección 7.2) | `hooks/usePianoRollAtajos.ts` (~80 lín) |
| PR-D5 | Menú contextual | Click derecho: copiar, eliminar, color, velocity | integrado en `usePianoRoll.ts` |
| PR-D6 | Minimapa | Vista miniatura del piano roll completo | `components/PianoRoll/MinimapaPianoRoll.tsx` (~60 lín) |
| PR-D7 | Sync steps↔notas | Bidireccional: step toggle crea/elimina nota, nota en pitchBase muestra step | integrado en `accionesNotas.ts` |

### FASE PR-E — Polish y Features FL-style (Dificultad: BAJA)

| # | Tarea | Detalles | Archivos |
|---|-------|---------|----------|
| PR-E1 | Velocity colors | Notas más brillantes = velocity alta (opacity o hue shift) | CSS + `NotaRect.tsx` |
| PR-E2 | Pitch slide visual | Línea diagonal entre notas consecutivas con slide | `NotaRect.tsx` mod |
| PR-E3 | Auto-scroll playback | Grid hace scroll automático durante reproducción para seguir cursor | `usePianoRoll.ts` mod |
| PR-E4 | Historial undo | Snapshots de notas[] para undo/redo granular del piano roll | `accionesNotas.ts` + historial |
| PR-E5 | Scale highlighting | Resaltar notas de una escala (ej: C menor) en el grid | `usePianoRollGrid.ts` mod |
| PR-E6 | Note grouping | Agrupar notas (acordes) para mover juntas | `pianoRollStore.ts` mod |

---

## 9. Decisiones de Diseño

### 9.1 ¿Piano Roll por canal o por patrón?

**Por canal** (como FL Studio). Cada canal del Channel Rack tiene su propio piano roll. Razones:
- Un patrón puede tener 6 canales, cada uno con notas diferentes
- El teclado/piano y pitch están asociados al sample del canal
- Las ghost notes muestran notas de OTROS canales como referencia
- Se abre con doble-click en el nombre del canal en el Channel Rack

### 9.2 ¿Reemplazar o complementar el Step Sequencer?

**Complementar.** El Step Sequencer y el Piano Roll son dos vistas del mismo dato:
- Step Sequencer → vista simplificada (on/off por step, pitch fijo)
- Piano Roll → vista completa (pitch variable, duración libre, más control)
- Toggle entre vistas según `modoEditor` del canal
- Drums/oneshots → default Step Sequencer
- Melodías/bass → default Piano Roll

### 9.3 Resolución temporal: ticks vs. pasos

**Ticks (PPQ = 96).** El step sequencer usa "pasos" discretos, pero el piano roll necesita más resolución:
- 1 beat (negra) = 96 ticks = 4 steps
- 1 semicorchea = 24 ticks = 1 step
- 1 fusa = 12 ticks = 0.5 steps
- Tresillos: 32 ticks (no divisible en steps enteros)

Los pasos del step sequencer se mapean a ticks: `paso N → tick N * 24`.

### 9.4 ¿Cómo se maneja el pitch del sample?

En un sample-based DAW (no sintetizador), hacer "pitch" de una nota implica cambiar el `playbackRate`:

```
pitchBase del canal = pitch original del sample (ej: C5 = 60)
notaDestino = la nota en el piano roll (ej: A4 = 57)
semitonos = 57 - 60 = -3
playbackRate = 2^(-3/12) = 0.8409

El sample suena 3 semitonos más grave y un poco más lento.
```

Para **pitch-independent** (SoundTouchJS), se usaría `modoTonalidad: 'stretch'` del canal, igual que en los bloques de audio. Pero por defecto, **resample** es más eficiente y suena natural para one-shots.

### 9.5 VentanaFlotante para el Piano Roll

Usar el sistema existente de `ventanasStore` (implementado en R66 por AG-ONE):
- Se abre como `VentanaFlotante` draggable/minimizable
- Tamaño recomendado: 900×500 px (ancho para ver 4+ compases, alto para ~2 octavas)
- Minimizable a `BarraVentanasMinimizadas`
- Puede coexistir con Channel Rack y Mixer abiertos simultáneamente
- z-index auto-gestionado por `ventanasStore.enfocarVentana()`

### 9.6 Performance: cuántas notas son viables

- 6 canales × 64 pasos × ~4 octavas de variación = ~1500 notas teóricas máximo
- En práctica, un patrón típico tiene 20-100 notas
- DOM divs para notas: hasta 500 sin problemas (memoizar `NotaRect`)
- Canvas para grid background: redraw solo en zoom/scroll (no por nota)
- Control panel bars: solo las visibles en viewport (virtualización si >200)

### 9.7 Relación con tareas de otros agentes

| Agente | Tarea | Impacto en Piano Roll |
|---|---|---|
| AG-ONE | C304 Song Position | El piano roll MUESTRA la posición actual del cursor de reproducción |
| AG-ONE | C305 Monitor onda | Independiente, no afecta piano roll |
| AG-ONE | C307 Browser panel | Drag de sample desde browser → crea canal en Channel Rack → luego tiene piano roll |
| AG-TWO | C308 Channel Rack | **Dependencia directa.** Piano Roll se abre desde un CanalRack. Compartir `CanalRack.notas[]` |
| AG-TWO | Fase A tipos | Piano Roll extiende `CanalRack` con `notas[]`, `pitchBase`, `modoEditor` |
| AG-TWO | patronesStore | Piano Roll agrega acciones de notas como slice del store |

No hay conflictos directos. El piano roll es una **ventana nueva** que opera sobre datos de AG-TWO.

---

## Resumen de archivos nuevos a crear

```
Mezclador/
├── types/
│   ├── pianoRoll.ts                           ← NUEVO (~120 lín)
│   └── mezclador.ts                           ← MODIFICAR (+10 lín: notas[], pitchBase, modoEditor)
├── stores/
│   ├── pianoRollStore.ts                      ← NUEVO (~200 lín)
│   ├── accionesNotas.ts                       ← NUEVO (~200 lín)
│   └── patronesStore.ts                       ← MODIFICAR (integrar accionesNotas — propiedad de AG-TWO)
├── services/
│   └── motorAudioService.ts                   ← MODIFICAR (+110 lín: programarNotasPianoRoll + preview)
├── hooks/
│   ├── usePianoRoll.ts                        ← NUEVO (~250 lín)
│   ├── usePianoRollGrid.ts                    ← NUEVO (~150 lín)
│   └── usePianoRollAtajos.ts                  ← NUEVO (~80 lín)
├── components/
│   └── PianoRoll/
│       ├── PianoRoll.tsx                      ← NUEVO (~150 lín)
│       ├── CabeceraPianoRoll.tsx              ← NUEVO (~100 lín)
│       ├── TecladoPiano.tsx                   ← NUEVO (~120 lín)
│       ├── GridNotas.tsx                      ← NUEVO (~200 lín)
│       ├── NotaRect.tsx                       ← NUEVO (~150 lín)
│       ├── ReglaTemporal.tsx                  ← NUEVO (~80 lín)
│       ├── PanelControl.tsx                   ← NUEVO (~120 lín)
│       ├── BarraVelocity.tsx                  ← NUEVO (~60 lín)
│       ├── GhostNotes.tsx                     ← NUEVO (~80 lín)
│       ├── Marquee.tsx                        ← NUEVO (~80 lín)
│       └── MinimapaPianoRoll.tsx              ← NUEVO (~60 lín)
├── styles/
│   ├── pianoRoll.css                          ← NUEVO (~300 lín)
│   └── index.css                              ← MODIFICAR (agregar import)
└── utils/
    └── pianoRollUtils.ts                      ← NUEVO (~100 lín)
```

**Total estimado: ~15 archivos nuevos + ~4 modificados, ~2800 líneas de código nuevo.**

---

## Orden de implementación sugerido

```
1. PR-A (Tipos + Store)          ← Puede empezar ya, sin esperar AG-TWO
   └── pianoRoll.ts, pianoRollUtils.ts, pianoRollStore.ts

2. PR-B (Grid + Edición core)    ← Requiere PR-A completo + AG-TWO Fase A tipos
   └── PianoRoll.tsx, TecladoPiano, GridNotas, NotaRect, usePianoRoll

3. PR-C (Audio + Control)        ← Requiere AG-TWO Fase A motor audio
   └── PanelControl, BarraVelocity, programarNotasPianoRoll, preview

4. PR-D (Features avanzados)     ← Requiere PR-B+C funcionales
   └── Ghost Notes, Clipboard, Atajos, Menú contextual

5. PR-E (Polish)                 ← Cuando todo funcione
   └── Velocity colors, Slide visual, Scale highlighting
```

---

## Notas finales

- **No es un piano/synth** — es un editor de triggers de samples con pitch. Cada "nota" dispara el sample del canal a un pitch diferente (via playbackRate o SoundTouch stretch).
- **Compatible con drums y melodías** — para drums, el usuario usa el step sequencer (vista simple). Para bass/leads, abre el piano roll (vista completa). Mismo canal, mismos datos.
- **PPQ 96 es suficiente** — FL Studio usa PPQ 96 por defecto. Da resolución de fusas y tresillos sin overhead.
- **Sin cuantización automática** — las notas se crean en la posición del snap activo. El usuario puede cuantizar manualmente con un atajo.
- **Persistencia** — las notas viven en `CanalRack.notas[]` dentro del `Patron`, que se serializa a JSON (localStorage → IndexedDB futuro). Sin AudioBuffers en la serialización.
