# Plan Arquitectónico: Channel Rack + Patterns + Mixer

> **Versión:** 1.0  
> **Fecha:** 18/02/2026  
> **Contexto:** Evolución del Mezclador DAW existente para soportar un workflow completo tipo FL Studio  
> **Referencia visual:** Channel Rack + Mixer de FL Studio

---

## Índice

1. [Visión General y Modelo Mental](#1-visión-general)
2. [Modelo de Datos (Types)](#2-modelo-de-datos)
3. [Arquitectura de Stores](#3-stores)
4. [Motor de Audio — Nuevo Grafo](#4-motor-audio)
5. [Componentes y UI](#5-componentes)
6. [Flujo de Trabajo del Usuario](#6-flujo-usuario)
7. [Fases de Implementación](#7-fases)
8. [Decisiones de Diseño](#8-decisiones)

---

## 1. Visión General y Modelo Mental

### Cómo funciona FL Studio (simplificado)

```
┌─────────────────────────────────────────────────────────────┐
│                        FL STUDIO                            │
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Channel  │    │   Pattern    │    │    Playlist      │   │
│  │   Rack   │───►│   (clips)    │───►│   (timeline)     │   │
│  │          │    │              │    │                  │   │
│  │ Canales  │    │  Patrón 1    │    │  ████ Pat1 ████  │   │
│  │ con step │    │  Patrón 2    │    │       ████ Pat2  │   │
│  │ sequencer│    │  ...         │    │  ████████████    │   │
│  └────┬─────┘    └──────────────┘    └──────────────────┘   │
│       │                                                      │
│       │ routing (canal → insert #)                          │
│       ▼                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    MIXER                              │   │
│  │  Master │ Ins 1 │ Ins 2 │ Ins 3 │ ... │ Ins N       │   │
│  │  ┃ fader│ ┃     │ ┃     │ ┃     │     │ ┃           │   │
│  │  ┃ pan  │ ┃ pan │ ┃ pan │ ┃ pan │     │ ┃ pan       │   │
│  │  ┃ EQ   │ ┃ EQ  │ ┃ EQ │ ┃ EQ  │     │ ┃ EQ        │   │
│  │  ┃ FX   │ ┃ FX  │ ┃ FX │ ┃ FX  │     │ ┃ FX        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Nuestro modelo adaptado

```
MODO PAT: Reproduce el patrón seleccionado (loop)
MODO SONG: Reproduce la playlist/timeline completa (lineal)

Selector PAT ◄──────► SONG  (junto al botón Play, como en FL)

Channel Rack (edición de patrones)
  └── Canales = instrumentos/samples cargados
       └── Step Grid = secuenciador (16/32/64 pasos)
            └── Cada step = { activo, velocity, pan, pitch }

Pattern (unidad reutilizable)
  └── Contiene: canales + steps + longitud en pasos
  └── Se coloca como clip en la Playlist (timeline existente)

Playlist (ya existe como Timeline)
  └── Pistas con clips de Pattern (bloques que referencian un patrón)
  └── Un pattern puede aparecer múltiples veces (son referencias)

Mixer (consola de mezcla)
  └── Master + N Inserts (16-32)
  └── Cada Insert: fader, pan, mute/solo, EQ, 10 slots FX
  └── Routing: cada canal del Channel Rack apunta a un Insert
```

---

## 2. Modelo de Datos (Types)

### 2.1 Pattern y Channel Rack

```typescript
/* ============================================================
 * PATTERN SYSTEM — Step sequencer + patrones reutilizables
 * ============================================================ */

/* Un paso individual en el secuenciador */
interface Paso {
    activo: boolean;
    velocity: number;      /* 0.0 - 1.0 (default 0.78 como FL) */
    pan: number;           /* -1 a 1 (0 = centro) */
    pitch: number;         /* semitonos offset (-12 a +12) */
}

/* Un canal dentro del Channel Rack (un instrumento/sample) */
interface CanalRack {
    id: string;
    nombre: string;              /* "808 Kick", "HiHat", etc. */
    color: string;               /* hex para identificación visual */
    
    /* Audio source */
    sampleId: string | null;     /* ID del sample de Kamples (null = vacío) */
    audioBuffer: AudioBuffer | null;
    rutaAudio: string | null;    /* URL del audio */
    
    /* Controles pre-mixer */
    volumen: number;             /* 0.0 - 1.0 */
    pan: number;                 /* -1 a 1 */
    silenciado: boolean;
    solo: boolean;
    
    /* Routing al Mixer */
    mixerInsertId: number;       /* Número de insert del mixer (0 = Master, 1-32 = Inserts) */
    
    /* Step sequencer */
    pasos: Paso[];               /* Longitud = totalPasos del patrón */
    
    /* Metadatos */
    tipo: 'sample' | 'oneshot';  /* Para futuro: 'synth', 'midi' */
}

/* Un patrón completo (equivale a un Pattern en FL Studio) */
interface Patron {
    id: string;
    nombre: string;              /* "Pattern 1", "Drums Main", etc. */
    color: string;               /* Color del patrón en la playlist */
    
    /* Contenido */
    canales: CanalRack[];        /* Los canales/instrumentos de este patrón */
    
    /* Temporalidad */
    totalPasos: number;          /* 16, 32, 64 — resize handler */
    pasosVisibles: number;       /* Cuántos pasos se ven (scroll horizontal) */
    subdivisionPaso: number;     /* 1 = semicorchea (default FL), configurable */
    swing: number;               /* 0.0 - 1.0 — humanización global */
    loop: boolean;               /* Loop on/off */
    
    /* Timestamp */
    creadoEn: number;
    modificadoEn: number;
}

/* Referencia de un patrón colocado en la playlist (timeline) */
interface ClipPatron {
    id: string;
    patronId: string;            /* Referencia al Patron */
    pistaId: string;             /* En qué pista de la playlist */
    compasInicio: number;        /* Posición en compases */
    duracionCompases: number;    /* Auto-calculada desde el patrón */
    silenciado: boolean;
    color: string;               /* Heredado del patrón, override posible */
}
```

### 2.2 Mixer

```typescript
/* ============================================================
 * MIXER — Consola de mezcla con inserts, EQ, y FX
 * ============================================================ */

/* Un slot de efecto en un insert del mixer */
interface SlotEfecto {
    id: string;
    indice: number;              /* Posición 0-9 (10 slots como FL) */
    tipo: string | null;         /* Nombre/tipo del efecto (null = vacío) */
    activo: boolean;             /* Bypass on/off */
    parametros: Record<string, number>;  /* Params específicos del efecto */
    /* Nota: inicialmente sin efectos reales — estructura preparada */
}

/* Banda del ecualizador paramétrico */
interface BandaEQ {
    frecuencia: number;          /* Hz (20-20000) */
    ganancia: number;            /* dB (-18 a +18) */
    q: number;                   /* Factor Q (0.1 a 18) */
    tipo: 'lowshelf' | 'highshelf' | 'peaking' | 'lowpass' | 'highpass';
    activo: boolean;
}

/* Un canal/insert del mixer */
interface InsertMixer {
    id: number;                  /* 0 = Master, 1-32 = Inserts */
    nombre: string;              /* "Master", "Insert 1", custom name */
    color: string;               /* hex */
    
    /* Controles principales */
    volumen: number;             /* 0.0 - 1.25 (FL permite +12dB) */
    pan: number;                 /* -1 a 1 */
    silenciado: boolean;
    solo: boolean;
    
    /* EQ paramétrico (3 bandas básicas, expandible) */
    eq: BandaEQ[];
    eqActivo: boolean;
    
    /* Slots de efectos (10 como FL) */
    slots: SlotEfecto[];
    
    /* Routing — a qué insert envía su salida (default: Master) */
    enviarA: number;             /* ID del insert destino (0 = Master por default) */
    
    /* Metering (runtime, no persistido) */
    peakL: number;               /* 0.0 - 1.0 (medición en tiempo real) */
    peakR: number;               /* 0.0 - 1.0 */
    
    /* Envíos auxiliares (sends) — futuro */
    envios: { insertDestinoId: number; nivel: number; preFader: boolean }[];
}

/* Estado completo del mixer */
interface EstadoMixer {
    inserts: InsertMixer[];      /* [0]=Master, [1..N]=Inserts */
    insertSeleccionado: number;  /* Cuál está seleccionado para ver detalle/EQ/FX */
    visible: boolean;            /* Toggle mostrar/ocultar mixer */
    anchoInsert: number;         /* Ancho visual de cada strip */
}
```

### 2.3 Extensiones al modelo existente

```typescript
/* Extensión de PistaMezclador para soportar clips de patrón */
interface PistaMezclador {
    /* ...campos existentes... */
    id: string;
    nombre: string;
    volumen: number;
    silenciada: boolean;
    color: string;               /* NUEVO: color de la pista */
    icono: string | null;        /* NUEVO: icono de la pista (C297) */
    altura: 'normal' | 'compacta' | 'minimizada';   /* NUEVO: C297 */
    bloqueadaAltura: boolean;    /* NUEVO: C297 - lock to size */
    bloqueadaContenido: boolean; /* NUEVO: C297 - lock to content type */
    
    /* Contenido mixto: samples directos + clips de patrón */
    bloques: BloqueMezclador[];  /* Samples directos (legacy) */
    clipsPatron: ClipPatron[];   /* NUEVO: clips de patrón */
}

/* Estado global del proyecto DAW */
interface EstadoProyectoDAW {
    /* Modo de reproducción */
    modoReproduccion: 'pat' | 'song';
    
    /* Patrones */
    patrones: Patron[];
    patronActivo: string;        /* ID del patrón seleccionado */
    
    /* Mixer */
    mixer: EstadoMixer;
    
    /* Lo que ya existe */
    pistas: PistaMezclador[];
    bpmProyecto: number;
    /* ... */
}
```

---

## 3. Arquitectura de Stores

### Principio: Un store por dominio, slices para complejidad interna

```
stores/
├── mezcladorStore.ts              ← Orquestador existente (extender)
├── tiposMezcladorStore.ts         ← Tipos del store principal
│
├── patronesStore.ts               ← NUEVO: Gestión de patrones
│   ├── accionesPatrones.ts        ←   Slice: CRUD patrones
│   └── accionesCanales.ts         ←   Slice: canales del channel rack
│
├── channelRackStore.ts            ← NUEVO: UI del channel rack
│   └── (estado de vista: pasos visibles, scroll, filtro, graphEditor)
│
├── mixerStore.ts                  ← NUEVO: Estado del mixer
│   ├── accionesMixerInserts.ts    ←   Slice: CRUD inserts
│   └── accionesMixerEQ.ts         ←   Slice: EQ y efectos
│
├── ventanasStore.ts               ← Existente (agregar tipos ventana)
├── accionesBloques.ts             ← Existente
├── accionesCargaAudio.ts          ← Existente
├── accionesHistorial.ts           ← Extender para snapshots de patrones
└── accionesSeleccion.ts           ← Existente
```

### 3.1 patronesStore

```typescript
interface PatronesState {
    /* Data */
    patrones: Patron[];
    patronActivo: string | null;       /* ID del patrón editándose */
    
    /* Modo de reproducción global */
    modoReproduccion: 'pat' | 'song';
    
    /* CRUD Patrones */
    crearPatron: (nombre?: string) => string;     /* Retorna ID */
    eliminarPatron: (id: string) => void;
    renombrarPatron: (id: string, nombre: string) => void;
    duplicarPatron: (id: string) => string;
    setPatronActivo: (id: string) => void;
    
    /* Canales */
    agregarCanal: (patronId: string, sample?: SampleResumen) => void;
    eliminarCanal: (patronId: string, canalId: string) => void;
    moverCanal: (patronId: string, canalId: string, direccion: 'up' | 'down') => void;
    clonarCanal: (patronId: string, canalId: string) => void;
    actualizarCanal: (patronId: string, canalId: string, cambios: Partial<CanalRack>) => void;
    
    /* Steps */
    togglePaso: (patronId: string, canalId: string, pasoIndex: number) => void;
    setPaso: (patronId: string, canalId: string, pasoIndex: number, paso: Partial<Paso>) => void;
    setTotalPasos: (patronId: string, total: number) => void;
    limpiarPasos: (patronId: string, canalId: string) => void;
    
    /* Swing y config */
    setSwing: (patronId: string, swing: number) => void;
    toggleLoop: (patronId: string) => void;
    
    /* Modo */
    setModoReproduccion: (modo: 'pat' | 'song') => void;
    
    /* Queries */
    obtenerPatron: (id: string) => Patron | undefined;
    obtenerPatronActivo: () => Patron | undefined;
    obtenerDuracionPatronCompases: (id: string) => number;
}
```

### 3.2 mixerStore

```typescript
interface MixerState {
    inserts: InsertMixer[];         /* [0] = Master, [1..32] = Inserts */
    insertSeleccionado: number;
    visible: boolean;
    
    /* Inserts */
    setVolumenInsert: (id: number, vol: number) => void;
    setPanInsert: (id: number, pan: number) => void;
    toggleMuteInsert: (id: number) => void;
    toggleSoloInsert: (id: number) => void;
    setNombreInsert: (id: number, nombre: string) => void;
    setColorInsert: (id: number, color: string) => void;
    seleccionarInsert: (id: number) => void;
    
    /* EQ */
    setBandaEQ: (insertId: number, bandaIdx: number, cambios: Partial<BandaEQ>) => void;
    toggleEQ: (insertId: number) => void;
    
    /* FX Slots */
    setSlot: (insertId: number, slotIdx: number, tipo: string | null) => void;
    toggleSlot: (insertId: number, slotIdx: number) => void;
    
    /* Routing */
    setEnviarA: (insertId: number, destinoId: number) => void;
    
    /* Metering (llamado desde rAF) */
    actualizarPeaks: (insertId: number, peakL: number, peakR: number) => void;
    
    /* Toggle */
    toggleVisible: () => void;
}
```

---

## 4. Motor de Audio — Nuevo Grafo

### 4.1 Grafo actual vs. nuevo

```
=== GRAFO ACTUAL ===

BufferSourceNode → GainNode(bloque) → StereoPannerNode → GainNode(pista) → masterGain → destination

=== GRAFO NUEVO (con Mixer) ===

                     CHANNEL RACK                         MIXER
               ┌─────────────────────┐    ┌──────────────────────────────────┐
               │                     │    │                                  │
BufferSource ──┤ GainNode (canal)    ├───►│ GainNode (insert fader)          │
               │ StereoPanner (canal)│    │ StereoPannerNode (insert pan)    │
               └─────────────────────┘    │ BiquadFilterNode[] (EQ 3 bandas) │
                                          │ [FX chain futuro]                │
                                          │         │                        │
                                          │         ▼                        │
                                          │ AnalyserNode (peak meter)        │
                                          │         │                        │
                                          │         ▼  (routing enviarA)     │
                                          │  GainNode Master                 │
                                          │         │                        │
                                          │         ▼                        │
                                          │  AnalyserNode Master (monitor)   │
                                          │         │                        │
                                          │         ▼                        │
                                          │  AudioContext.destination         │
                                          └──────────────────────────────────┘
```

### 4.2 Implementación del routing

```typescript
/* motorAudioService.ts — Extensiones */

class MotorAudio {
    /* EXISTENTE */
    private contexto: AudioContext | null;
    private masterGain: GainNode | null;
    private gainsCanales: Map<string, GainNode>;   /* per-pista */
    
    /* NUEVO: Mixer nodes */
    private mixerInserts: Map<number, MixerInsertNodes>;
    private masterAnalyser: AnalyserNode | null;
    
    /* Nodos por insert del mixer */
    interface MixerInsertNodes {
        inputGain: GainNode;           /* Entrada sumadora */
        fader: GainNode;               /* Volumen post-EQ */
        panner: StereoPannerNode;      /* Pan del insert */
        eqBandas: BiquadFilterNode[];  /* EQ paramétrico (3 bandas) */
        analyser: AnalyserNode;        /* Para peak meters */
        /* Chain: input → EQ[0] → EQ[1] → EQ[2] → fader → panner → analyser → destino */
    }
    
    /* Crear cadena de nodos para un insert del mixer */
    crearInsertMixer(insertId: number): void {
        const ctx = this.obtenerContexto();
        
        const inputGain = ctx.createGain();
        const fader = ctx.createGain();
        const panner = ctx.createStereoPanner();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        
        /* EQ: 3 bandas paramétric */
        const eqBandas = [
            this.crearBandaEQ(ctx, 'lowshelf', 200, 0),
            this.crearBandaEQ(ctx, 'peaking', 1000, 0),
            this.crearBandaEQ(ctx, 'highshelf', 8000, 0),
        ];
        
        /* Chain: input → EQ0 → EQ1 → EQ2 → fader → panner → analyser */
        inputGain.connect(eqBandas[0]);
        eqBandas[0].connect(eqBandas[1]);
        eqBandas[1].connect(eqBandas[2]);
        eqBandas[2].connect(fader);
        fader.connect(panner);
        panner.connect(analyser);
        
        /* El destino final se conecta según routing (default → master) */
        if (insertId === 0) {
            /* Master → destination */
            analyser.connect(ctx.destination);
        } else {
            /* Insert → Master */
            analyser.connect(this.mixerInserts.get(0)!.inputGain);
        }
        
        this.mixerInserts.set(insertId, { inputGain, fader, panner, eqBandas, analyser });
    }
    
    /* Al programar audio de un canal, conectar al insert correspondiente */
    programarReproduccionCanal(
        buffer: AudioBuffer,
        canalId: string,
        mixerInsertId: number,
        cuando: number,
        /* ...demás params */
    ): void {
        /* En vez de conectar a gainsCanales[pistaId] → masterGain,
         * conectar a mixerInserts[mixerInsertId].inputGain */
        const insertNodes = this.mixerInserts.get(mixerInsertId);
        if (!insertNodes) return;
        
        const fuente = this.contexto!.createBufferSource();
        fuente.buffer = buffer;
        
        const gainBloque = this.contexto!.createGain();
        fuente.connect(gainBloque);
        gainBloque.connect(insertNodes.inputGain);  /* ← Aquí va al mixer */
        
        fuente.start(cuando);
    }
    
    /* Peak metering — llamar desde rAF */
    obtenerPeaks(insertId: number): { peakL: number; peakR: number } {
        const insert = this.mixerInserts.get(insertId);
        if (!insert) return { peakL: 0, peakR: 0 };
        
        const data = new Float32Array(insert.analyser.frequencyBinCount);
        insert.analyser.getFloatTimeDomainData(data);
        
        let max = 0;
        for (let i = 0; i < data.length; i++) {
            const abs = Math.abs(data[i]);
            if (abs > max) max = abs;
        }
        return { peakL: max, peakR: max }; /* Mono simple; stereo requiere split */
    }
}
```

### 4.3 Step sequencer — Playback

```typescript
/* Reproducir un patrón (modo PAT) */
function programarPatron(
    patron: Patron,
    bpm: number,
    compas: Compas,
    desdeSegundo: number
): void {
    const duracionPaso = (60 / bpm) / (patron.subdivisionPaso || 1);
    /* subdivisionPaso=1 → 1 paso = 1 beat... */
    /* En FL Studio: 1 paso = 1 semicorchea = 1/4 de beat */
    /* Así que: duracionPaso = (60 / bpm) / 4  para semicorcheas */
    const duracionPasoReal = (60 / bpm) / 4;  /* semicorchea */
    
    for (const canal of patron.canales) {
        if (canal.silenciado || !canal.audioBuffer) continue;
        
        /* Si hay solo activo, verificar */
        const haySolo = patron.canales.some(c => c.solo);
        if (haySolo && !canal.solo) continue;
        
        for (let i = 0; i < canal.pasos.length; i++) {
            const paso = canal.pasos[i];
            if (!paso.activo) continue;
            
            /* Calcular cuándo suena este paso */
            let cuando = desdeSegundo + (i * duracionPasoReal);
            
            /* Aplicar swing a pasos pares */
            if (patron.swing > 0 && i % 2 === 1) {
                cuando += duracionPasoReal * patron.swing * 0.5;
            }
            
            /* Despachar al motor audio con los params del paso */
            motorAudio.programarReproduccionCanal(
                canal.audioBuffer,
                canal.id,
                canal.mixerInsertId,
                cuando,
                0,                          /* offset */
                canal.audioBuffer.duration,  /* duración completa del sample */
                1,                          /* playbackRate base */
                paso.velocity * canal.volumen,
                false,                      /* invertido */
                0, 0,                       /* fades */
                paso.pitch,                 /* pitch per-step */
                'resample',                 /* modo tonalidad */
                canal.id,                   /* bloqueId para cache */
                paso.pan !== 0 ? paso.pan : canal.pan,
                'corto',                    /* declicking */
            );
        }
    }
}

/* Modo SONG: Reproducir la playlist */
/* Los ClipPatron en la playlist invocan programarPatron() */
/* con offset calculado según su compasInicio */
```

---

## 5. Componentes y UI

### 5.1 Jerarquía de componentes nuevos

```
Mezclador/
├── components/
│   ├── MezcladorPanel.tsx          ← MODIFICAR: agregar tabs/views
│   ├── ControlesMezclador.tsx      ← MODIFICAR: agregar PAT/SONG toggle
│   │
│   │   ╔═══════════════════════════════════════╗
│   │   ║         CHANNEL RACK (NUEVO)          ║
│   │   ╚═══════════════════════════════════════╝
│   ├── ChannelRack/
│   │   ├── ChannelRack.tsx             ← Contenedor principal (VentanaFlotante)
│   │   ├── CabeceraChannelRack.tsx     ← Dropdown filtro + Swing knob + Loop LED
│   │   ├── CanalStrip.tsx              ← Una fila: LED + Pan + Vol + Routing + Nombre + Selector
│   │   ├── StepGrid.tsx                ← Matriz de pasos (el sequencer visual)
│   │   ├── PasoBoton.tsx               ← Un botón individual del step grid
│   │   ├── GraphEditor.tsx             ← Panel overlay para velocity/pitch/pan por paso
│   │   ├── SelectorPatron.tsx          ← Dropdown para cambiar entre patrones
│   │   └── useChannelRack.ts           ← Hook: lógica de interacción del rack
│   │
│   │   ╔═══════════════════════════════════════╗
│   │   ║             MIXER (NUEVO)             ║
│   │   ╚═══════════════════════════════════════╝
│   ├── Mixer/
│   │   ├── MixerConsola.tsx            ← Contenedor principal (VentanaFlotante grande)
│   │   ├── InsertStrip.tsx             ← Una columna: fader + pan + mute/solo + slots
│   │   ├── FaderControl.tsx            ← Slider vertical (fader de volumen)
│   │   ├── PeakMeter.tsx              ← Barra vertical L/R con LEDs de peak
│   │   ├── EQVisualizer.tsx            ← Visualización de curva EQ
│   │   ├── SlotEfectoUI.tsx            ← Un slot de efecto (click para seleccionar)
│   │   ├── PanelDetalleInsert.tsx      ← Panel derecho: EQ detallado + info
│   │   └── useMixer.ts                ← Hook: metering rAF + interacción
│   │
│   │   ╔═══════════════════════════════════════╗
│   │   ║        MONITOR/METERING (NUEVO)       ║
│   │   ╚═══════════════════════════════════════╝
│   ├── Monitor/
│   │   ├── MonitorOnda.tsx             ← Waveform en tiempo real (oscilloscope) (C305)
│   │   ├── PeakMaster.tsx             ← Peak meter L/R del master (C306)
│   │   └── SongPosition.tsx            ← Display M:S:CS ↔ B:S:T (C304)
```

### 5.2 Layout del Channel Rack

```
┌───────────────────────────────────────────────────────────────────────┐
│  ◄ Pattern 1 ►   │   All ▼   │ Swing ◎   │ ● Loop                  │
├───────────────────────────────────────────────────────────────────────┤
│                   │                                                   │
│  ● M │ ◎ │ ◎ │1│ │ 808 Kick    │ ■■■■ ■■■■ ■■■■ ■■■■              │
│  ● M │ ◎ │ ◎ │2│ │ 808 Clap    │ □□□□ □□□□ □□□□ □□□□              │
│  ● M │ ◎ │ ◎ │3│ │ 808 HiHat   │ ■□■□ ■□■□ ■□■□ ■□■□              │
│  ● M │ ◎ │ ◎ │4│ │ 808 Snare   │ □□□□ ■□□□ □□□□ ■□□□              │
│  ● M │ ◎ │ ◎ │5│ │ FLEX Bass   │ ■□□□ □□□□ ■□□□ □□□□              │
│  ● M │ ◎ │ ◎ │-│ │ DL Broken   │ □□□□ □□□□ □□□□ □□□□              │
│                   │                                                   │
│                  +  (agregar canal)                                   │
├───────────────────────────────────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (resize handle steps)                    │
└───────────────────────────────────────────────────────────────────────┘

Leyenda:
● = LED mute/solo (click izq: mute, click der: solo)
M = indicador mute visual
◎ = Knob (pan, volumen)
│1│ = Routing al mixer insert # (NumberBox editable)
■ = Paso activo (encendido)
□ = Paso inactivo
Bloques de 4 pasos alternan color (gris/coloreado) para visualizar beats
```

### 5.3 Layout del Mixer

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Mixer — Insert 5                                                        ─ □ ✕     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐  ┌─────────────────┐│
│  │ Mst │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │  │   ► Slot 1  ●○  ││
│  │     │     │     │     │     │     │     │     │     │     │  │   ► Slot 2  ●○  ││
│  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │  │   ► Slot 3  ●○  ││
│  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │  │   ► Slot 4  ●○  ││
│  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │ ┃┃  │  │   ► Slot 5  ●○  ││
│  │ ── │ ── │ ── │ ── │ ── │ ── │ ── │ ── │ ── │ ── │  │   ► Slot 6  ●○  ││
│  │     │     │     │     │     │     │     │     │     │     │  │   ► Slot 7  ●○  ││
│  │ ◎pn │ ◎pn │ ◎pn │ ◎pn │ ◎pn │ ◎pn │ ◎pn │ ◎pn │ ◎pn │ ◎pn │  │   ► Slot 8  ●○  ││
│  │ M S │ M S │ M S │ M S │ M S │ M S │ M S │ M S │ M S │ M S │  │   ► Slot 9  ●○  ││
│  │ ●●  │ ○○  │ ○○  │ ○○  │ ○○  │ ○○  │ ○○  │ ○○  │ ○○  │ ○○  │  │   ► Slot 10 ●○  ││
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘  │                 ││
│                                                                    │   Equalizer    ││
│                                                                    │  ┌───────────┐ ││
│                                                                    │  │ ～～～～  │ ││
│                                                                    │  └───────────┘ ││
│                                                                    └─────────────────┘│
│  ┃ L   ┃ R                                                                           │
│  ┃▓▓▓▓▓┃▓▓▓▓▓  Peak Master                                                          │
└──────────────────────────────────────────────────────────────────────────────────────┘

Leyenda:
┃┃ = Fader vertical (volumen)
── = Label del insert
◎pn = Knob de pan
M S = Botones Mute / Solo
●● = LEDs de routing activo
► Slot N = Espacio para efecto (click = seleccionar tipo)
●○ = LED activo / bypass
```

---

## 6. Flujo de Trabajo del Usuario

### 6.1 Crear un beat desde cero

```
1. Abrir Channel Rack
2. "+" → agregar canal → arrastrar sample desde explorador o feed
3. Hacer click en los pasos del step grid para activarlos
4. Repetir para kick, snare, hihat, bass...
5. Pulsar Play (modo PAT) → suena el pattern en loop
6. Ajustar: swing, velocity por paso (graph editor), pan/vol por canal
7. Satisfecho → cambiar a modo SONG
8. El patrón aparece como clip disponible para colocar en la playlist
9. Arrastrar el patrón a una pista de la playlist
10. Crear más patrones (Pattern 2, 3...) para verse, bridge, etc.
11. Organizar clips en la playlist para la estructura de la canción
12. Abrir Mixer → ajustar niveles, EQ, etc.
13. Exportar
```

### 6.2 Routing de audio (de dónde a dónde)

```
Flujo de señal completo:

Sample/Audio File
    │
    ▼
CanalRack (vol + pan pre-mixer)
    │
    │ mixerInsertId (ej: 3)
    ▼
Mixer Insert 3
    │ EQ → FX Slots → Fader → Pan
    │
    │ enviarA (default: 0 = Master)
    ▼
Mixer Master
    │ EQ → FX → Fader → Pan → Analyser
    ▼
AudioContext.destination (speakers)
```

### 6.3 Modo PAT vs SONG

```
┌─────────────────────────────────────────────┐
│          ControlBar del DAW                  │
│  ◀ ▶ │ ►PLAY │ ■STOP │ ● PAT ◄► SONG      │
│       │       │       │   ▲                  │
│       │       │       │   └── Toggle switch  │
└─────────────────────────────────────────────┘

PAT mode:
- El botón Play reproduce el patrón activo en loop
- El Channel Rack muestra el patrón activo
- La timeline/playlist NO se reproduce
- Útil para editar/previsualizar un patrón aislado

SONG mode:
- El botón Play reproduce la playlist completa
- Los clips de patrón se renderizan secuencialmente
- También se reproducen los bloques de audio directo (legacy)
- Es el modo final para organizar la canción
```

---

## 7. Fases de Implementación

### FASE A — Fundamentos (Dificultad: ALTA)

> **Prioridad:** Modelo de datos + Store + Motor Audio refactorizado  
> **Estimación:** La más crítica — todo depende de esto

| # | Tarea | Detalles |
|---|-------|---------|
| A1 | Tipos nuevos | `Patron`, `CanalRack`, `Paso`, `ClipPatron`, `InsertMixer`, `BandaEQ`, `SlotEfecto` en `types/mezclador.ts` |
| A2 | `patronesStore.ts` | CRUD patrones + canales + steps + swing. Con snapshots para undo. |
| A3 | `mixerStore.ts` | Estado del mixer: inserts, EQ, FX slots, peaks, routing. |
| A4 | Motor Audio — mixer nodes | `crearInsertMixer()`, routing dinámico canal→insert→master. AnalyserNodes para peaks. |
| A5 | Motor Audio — step playback | `programarPatron()` para modo PAT (loop de semicorcheas). Swing support. |
| A6 | Refactor `programarReproduccion` | Bifurcar routing: legacy (pista→master) vs nuevo (canal→mixer insert) |
| A7 | Modo PAT/SONG en store | Toggle en `mezcladorStore`. Reproducir patrón o playlist según modo. |

### FASE B — Channel Rack UI (Dificultad: MEDIA-ALTA)

> **Prioridad:** Componentes visuales del channel rack

| # | Tarea | Detalles |
|---|-------|---------|
| B1 | `ChannelRack.tsx` | VentanaFlotante con layout: cabecera + canales + steps + footer |
| B2 | `CanalStrip.tsx` | LED mute/solo, KnobControl pan/vol, NumberBox routing, nombre canal, selector |
| B3 | `StepGrid.tsx` | Matriz de botones. Click=toggle, colores por beat (4 gris / 4 color). Responsive. |
| B4 | `PasoBoton.tsx` | Un paso: click=on/off, right-click=velocity popup, hover=highlight columna |
| B5 | `SelectorPatron.tsx` | Dropdown ◄ Pattern N ► con flechas, + crear nuevo, lista desplegable |
| B6 | `CabeceraChannelRack.tsx` | Filtro dropdown + Swing knob + Loop LED toggle |
| B7 | `GraphEditor.tsx` | Panel overlay con barras verticales (velocity/pitch/pan editables por paso) |
| B8 | CSS Channel Rack | `mezcladorChannelRack.css` — módulo dedicado |
| B9 | Drop de samples al rack | Drag desde explorador/feed → agregar como canal nuevo |
| B10 | Resize handle pasos | Arrastrar borde derecho para cambiar totalPasos (16→32→64) |

### FASE C — Mixer UI (Dificultad: MEDIA)

> **Prioridad:** Consola de mezcla visual

| # | Tarea | Detalles |
|---|-------|---------|
| C1 | `MixerConsola.tsx` | VentanaFlotante grande (ancho 80%+). Scroll horizontal para inserts. |
| C2 | `InsertStrip.tsx` | Columna: nombre, fader, pan, mute/solo, routing LEDs |
| C3 | `FaderControl.tsx` | Slider vertical (CSS custom, no native). Drag vertical fluido. Snap dB. |
| C4 | `PeakMeter.tsx` | Barras L/R animadas. Colores: verde→amarillo→rojo. Peak hold. |
| C5 | `EQVisualizer.tsx` | Canvas: curva de respuesta EQ. Click+drag en nodos para editar bandas. |
| C6 | `SlotEfectoUI.tsx` | Lista de 10 slots. Click = selector de tipo (futuro). LED activo/bypass. |
| C7 | `PanelDetalleInsert.tsx` | Panel derecho: EQ grande + slots + info del insert seleccionado |
| C8 | CSS Mixer | `mezcladorMixer.css` — módulo dedicado |
| C9 | Metering rAF | Loop requestAnimationFrame para actualizar peaks del AnalyserNode |

### FASE D — Integration & Polish (Dificultad: MEDIA)

| # | Tarea | Detalles |
|---|-------|---------|
| D1 | Clips de patrón en playlist | `ClipPatron` renderizado en `PistaTimeline`. Colores del patrón. Click = abrir channel rack. |
| D2 | Arrastrar patrón a playlist | Desde `SelectorPatron` → drag → colocar en pista |
| D3 | SONG playback con patrones | `programarBloques` expandido: iterar `clipsPatron` → llamar `programarPatron()` con offset |
| D4 | Monitor + Peak Master (C305, C306) | `MonitorOnda.tsx` (oscilloscope waveform) + `PeakMaster.tsx` (L/R global) |
| D5 | Song Position (C304) | Display M:S:CS ↔ B:S:T toggle click |
| D6 | Exportar con mixer | `renderizarOffline` debe crear OfflineAudioContext con grafo mixer completo |
| D7 | Persistencia proyecto | Serializar patrones + mixer config + playlist → JSON (localStorage inicialmente) |

### FASE E — Channel Rack avanzado (Dificultad: BAJA-MEDIA)

| # | Tarea | Detalles |
|---|-------|---------|
| E1 | Groups/Filters | Agrupar canales ("Drums", "Bass", "Synths"). Dropdown filter en cabecera. |
| E2 | Velocity colors | Steps más brillantes = velocity alta, más oscuros = baja |
| E3 | Copy/Paste pasos | Ctrl+C/V en rangos de pasos |
| E4 | Atajos de teclado | Ctrl+L=loop, Space=preview canal, 1-0=toggle pasos del canal seleccionado |
| E5 | Ghost notes | Mostrar notas de otros patrones como guía visual (canales fantasma) |

---

## 8. Decisiones de Diseño

### 8.1 ¿Por qué patterns en vez de solo clips de audio?

Los patterns son la unidad compositiva fundamental en un DAW como FL Studio. Permiten:
- Reutilizar la misma secuencia en múltiples puntos de la canción
- Editar un patrón → se actualiza en todos lados donde aparece
- Step sequencer intuitivo para beats (más fácil que colocar samples individuales)
- Separación clara entre composición (Channel Rack) y arreglo (Playlist)

### 8.2 Coexistencia de bloques de audio directo + clips de patrón

Mantener ambos. La playlist soporta:
1. `BloqueMezclador` — sample de audio directo (legacy, funcional hoy)
2. `ClipPatron` — referencia a un patrón del channel rack (nuevo)

Ambos coexisten en la misma pista. El motor de audio los reproduce según su tipo.

### 8.3 Mixer: cuántos inserts

**16 inserts + Master = 17 total** (como la imagen de FL Studio que mostraste). Suficiente para producción web. Extensible si se necesita.

### 8.4 Efectos: qué implementar primero

Los 10 slots FX por insert son **estructura preparada**. Inicialmente estarán vacíos/deshabilitados. Implementar gradualmente:
1. EQ paramétrico (3 bandas) — con Web Audio `BiquadFilterNode` (nativo, sin dependencias)
2. Compressor — con `DynamicsCompressorNode` (nativo)
3. Reverb — con `ConvolverNode` (requiere IR buffer)
4. Delay — implementar con `DelayNode` + feedback loop
5. Los demás: cuando haya demanda

### 8.5 Step Grid: unidad de tiempo

1 paso = 1 semicorchea (1/16 note). En 4/4 a 120 BPM:
- 1 beat = 4 pasos
- 1 compás = 16 pasos
- Duración de un paso = (60/120) / 4 = 0.125 segundos

Default: 16 pasos (1 compás). Resize handler para 32 (2 compases) o 64 (4 compases).

### 8.6 ¿VentanaFlotante o Panel integrado?

- **Channel Rack**: VentanaFlotante (como en FL Studio, se puede mover/minimizar/cerrar)
- **Mixer**: VentanaFlotante grande (ocupa más espacio, se puede solapar)
- **Ambos** usan el sistema existente de `ventanasStore` con tipos nuevos

Alternativamente, el Mixer podría ser un panel inferior fijo (como en algunos DAWs). Pero VentanaFlotante es más consistente con el diseño actual y flexible para el usuario.

### 8.7 Relación con tareas pendientes del roadmap

| Tarea roadmap | Relación con este plan |
|---|---|
| C297 (Menú contextual pista) | Pistas ahora soportan patterns → menú aplica a ambos tipos de contenido |
| C298 (Input tempo drag) | Aplica al BPM del DAW — afecta velocidad de pasos del channel rack |
| C304 (Song position) | Incluido en FASE D5 |
| C305 (Monitor onda) | Incluido en FASE D4 |
| C306 (Peak Master) | Incluido en FASE D4 |
| C307 (Browser panel) | Complementario — drag from browser to Channel Rack |
| C308 (Channel rack + patterns) | **ESTE PLAN** |

---

## Resumen de archivos nuevos a crear

```
Mezclador/
├── types/
│   └── mezclador.ts                    ← MODIFICAR (agregar ~100 lín de tipos)
├── stores/
│   ├── patronesStore.ts                ← NUEVO (~250 lín)
│   ├── accionesPatrones.ts             ← NUEVO (~150 lín)
│   ├── accionesCanales.ts              ← NUEVO (~120 lín)
│   ├── mixerStore.ts                   ← NUEVO (~200 lín)
│   └── tiposMezcladorStore.ts          ← MODIFICAR (agregar tipos)
├── services/
│   └── motorAudioService.ts            ← MODIFICAR (agregar mixer routing + step playback)
├── hooks/
│   ├── useChannelRack.ts               ← NUEVO (~100 lín)
│   ├── useMixer.ts                     ← NUEVO (~80 lín)
│   └── useMotorAudio.ts                ← MODIFICAR (modo PAT/SONG)
├── components/
│   ├── ChannelRack/
│   │   ├── ChannelRack.tsx             ← NUEVO (~200 lín)
│   │   ├── CabeceraChannelRack.tsx     ← NUEVO (~80 lín)
│   │   ├── CanalStrip.tsx              ← NUEVO (~150 lín)
│   │   ├── StepGrid.tsx                ← NUEVO (~120 lín)
│   │   ├── PasoBoton.tsx               ← NUEVO (~60 lín)
│   │   ├── GraphEditor.tsx             ← NUEVO (~150 lín)
│   │   └── SelectorPatron.tsx          ← NUEVO (~80 lín)
│   ├── Mixer/
│   │   ├── MixerConsola.tsx            ← NUEVO (~200 lín)
│   │   ├── InsertStrip.tsx             ← NUEVO (~150 lín)
│   │   ├── FaderControl.tsx            ← NUEVO (~100 lín)
│   │   ├── PeakMeter.tsx              ← NUEVO (~80 lín)
│   │   ├── EQVisualizer.tsx            ← NUEVO (~120 lín)
│   │   ├── SlotEfectoUI.tsx            ← NUEVO (~60 lín)
│   │   └── PanelDetalleInsert.tsx      ← NUEVO (~120 lín)
│   ├── Monitor/
│   │   ├── MonitorOnda.tsx             ← NUEVO (~80 lín)
│   │   ├── PeakMaster.tsx             ← NUEVO (~60 lín)
│   │   └── SongPosition.tsx            ← NUEVO (~50 lín)
│   └── ControlesMezclador.tsx          ← MODIFICAR (PAT/SONG toggle)
├── styles/
│   ├── mezcladorChannelRack.css        ← NUEVO (~300 lín)
│   ├── mezcladorMixer.css              ← NUEVO (~300 lín)
│   ├── mezcladorMonitor.css            ← NUEVO (~100 lín)
│   └── index.css                       ← MODIFICAR (agregar imports)
└── utils/
    └── compasUtils.ts                  ← MODIFICAR (agregar conversiones step↔tiempo)
```

**Total estimado: ~25 archivos nuevos + ~8 modificados, ~3500 líneas de código nuevo.**

---

## Notas finales

- **Sin VST/plugins reales** — los "efectos" son Web Audio API nativas (`BiquadFilterNode`, `DynamicsCompressorNode`, `ConvolverNode`, `DelayNode`). No hay LADSPA, VST, ni AU.
- **Sin MIDI** — solo samples one-shot triggers. No hay piano roll inicialmente; **ver `plan-piano-roll.md`** para el plan del Piano Roll (C310, post Channel Rack). No hay notas sostenidas continuas; el piano roll usa one-shot triggers con pitch por nota.
- **Persistencia** — inicialmente localStorage. Migrar a IndexedDB cuando los proyectos crezcan. Los AudioBuffers no se serializan; se guardan URLs/IDs y se recargan.
- **Performance** — El step grid con 6 canales × 64 pasos = 384 botones. Memoizar `PasoBoton`. No re-renderizar todo el grid por cada click.
