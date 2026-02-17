# C184 — Mezclador (Mini DAW) — COMPLETADO

> **Versión:** 1.0  
> **Fecha:** 17/02/2026  
> **Estado:** COMPLETADO (R48)  
> **Competencia:** Splice "Create (Stacks)"  
> **Diferenciador clave:** Soporte para cualquier compás (no solo 4/4), adaptación automática de samples a timeline

---

## Visión General

Un mini DAW integrado en el panel lateral que permite arrastrar samples del feed, colocarlos en una línea de tiempo multi-pista, sincronizarlos por compás, y reproducirlos juntos. El resultado se puede descargar como mezcla (1 crédito) o publicar como un nuevo sample.

**Ventaja sobre Splice Stacks:** Splice solo soporta patrón 4/4 rígido. Kamples detecta el compás real del sample y permite colocar samples de diferentes duraciones en la timeline, adaptándolos automáticamente.

---

## Arquitectura de Aislamiento

### Principio: el Mezclador es una aplicación aislada

```
App/React/
├── components/
├── stores/
├── ...
└── (app principal — NO tocar internamente)

Mezclador/                    <-- CARPETA RAÍZ AISLADA (fuera de App/)
├── mezclador.md              <-- Este documento
├── components/
│   ├── MezcladorPanel.tsx     <-- Contenedor principal (~120 lín)
│   ├── Timeline.tsx           <-- Línea de tiempo con compases (~200 lín)
│   ├── PistaTimeline.tsx      <-- Una pista individual (~150 lín)
│   ├── BloqueSample.tsx       <-- Bloque visual de un sample en la timeline (~100 lín)
│   ├── ControlesMezclador.tsx <-- Play/Stop/BPM/Export (~80 lín)
│   ├── BarraCompases.tsx      <-- Regla de compases arriba (~60 lín)
│   └── CursorReproduccion.tsx <-- Línea vertical de reproducción (~40 lín)
├── hooks/
│   ├── useMezclador.ts        <-- Hook principal de lógica (~250 lín)
│   ├── useMotorAudio.ts       <-- Web Audio API scheduling (~200 lín)
│   ├── useTimeline.ts         <-- Lógica de drag, snap, resize (~180 lín)
│   └── useExportarMezcla.ts   <-- Renderizado offline + descarga (~120 lín)
├── stores/
│   └── mezcladorStore.ts      <-- Estado global del mezclador (~150 lín)
├── types/
│   └── mezclador.ts           <-- Tipos del mezclador (~80 lín)
├── services/
│   └── motorAudioService.ts   <-- Singleton AudioContext + buffers (~200 lín)
├── utils/
│   ├── compasUtils.ts         <-- Cálculos de compás, beats, snap (~100 lín)
│   └── audioBufferUtils.ts    <-- Decode, time-stretch, trim (~120 lín)
└── styles/
    └── mezclador.css          <-- Estilos aislados (~250 lín)
```

### Error boundary: aislamiento a prueba de fallos

```tsx
/* En LayoutPrincipal.tsx — el Mezclador se envuelve en ErrorBoundary */
<ErrorBoundary fallback={<MezcladorError />}>
  <MezcladorPanel />
</ErrorBoundary>
```

Si el Mezclador falla, el error queda atrapado y NO afecta al resto de la aplicación. Se muestra un mensaje "Error en el mezclador" con botón de reiniciar.

### Integración con la app principal (puntos de contacto mínimos)

Solo 4 puntos de contacto con la app principal:
1. **TopBar** → Botón que abre/cierra el mezclador (toggle `mezcladorStore.abierto`)
2. **PanelLateral** → El panel lateral ahora tiene un modo adicional: `'mezclador'`
3. **TarjetaSample** → Opción "Añadir al mezclador" en menú contextual (dispatch evento)
4. **ModalCrear** → Al publicar mezcla, usa el flujo existente de publicación

---

## Decisiones Técnicas

### Audio Engine: Web Audio API (AudioContext)

**Por qué HTML5 Audio no sirve:**
- No permite reproducir múltiples fuentes sincronizadas con precisión de sample
- No tiene scheduling preciso (solo `play()` que es asincrónico)
- No permite mezclar/renderizar offline

**Arquitectura del motor:**
```
AudioContext (singleton)
├── GainNode (master volume)
│   ├── GainNode (pista 1 volume)
│   │   └── AudioBufferSourceNode (sample A, scheduled)
│   │   └── AudioBufferSourceNode (sample B, scheduled)
│   ├── GainNode (pista 2 volume)
│   │   └── AudioBufferSourceNode (sample C, scheduled)
│   └── ...
└── OfflineAudioContext (para exportar/renderizar mezcla)
```

**Scheduling preciso:** Usar `AudioBufferSourceNode.start(when, offset, duration)` con `audioContext.currentTime` como referencia. Lookahead scheduling (agenda próximos 100ms de notas por adelantado) para evitar glitches.

### Compás y BPM

**Detección automática de compás:**
- Por defecto asumir 4/4 (el más común en producción musical)
- Calcular duración en beats: `beats = (duracion * bpm) / 60`
- Si `beats` es cercano a un múltiplo de 3 → sugerir 3/4 o 6/8
- Permitir override manual del compás por pista
- Snap a grid de beats

**Adaptación de samples:**
- Un sample de 1 compás (4 beats a 120BPM = 2s) ocupa 1 bloque en la timeline
- Un sample de 4 compases (8s a 120BPM) ocupa 4 bloques
- Si el BPM del sample difiere del BPM del proyecto → time-stretch con `playbackRate`
- `playbackRate = bpmProyecto / bpmSample` (ej: proyecto 140BPM, sample 120BPM → rate 1.167)

### Timeline

**Estructura:**
```
┌─────────────────────────────────────────────────────┐
│  1    │    2    │    3    │    4    │  + (add bar) │ ← BarraCompases
├───────┼─────────┼─────────┼─────────┼──────────────┤
│ ▓▓▓▓▓ │         │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│              │ ← Pista 1
├───────┼─────────┼─────────┼─────────┼──────────────┤
│       │ ▓▓▓▓▓▓▓▓│         │         │              │ ← Pista 2
├───────┼─────────┼─────────┼─────────┼──────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│         │              │ ← Pista 3
├───────┼─────────┼─────────┼─────────┼──────────────┤
│  + Añadir pista                                     │
└─────────────────────────────────────────────────────┘
│← CursorReproduccion (línea vertical, draggeable)
```

- Default: 4 compases, expandible
- Cada bloque de sample muestra: mini waveform + título (texto pequeño)
- Drag & drop desde fuera (feed) o dentro (reposicionar)
- Snap a beats (cuadrícula)
- Pistas ilimitadas (con scroll vertical)
- Máximo 5 minutos de duración total

### Exportación / Descarga

**Proceso:**
1. Crear `OfflineAudioContext` con duración total de la mezcla
2. Programar todos los `AudioBufferSourceNode` con sus tiempos y rates
3. `offlineCtx.startRendering()` → `AudioBuffer` resultado
4. Convertir `AudioBuffer` → WAV (PCM 16-bit, 44.1kHz)
5. Si descarga: descargar WAV directo (consume 1 crédito via API)
6. Si publicar: subir WAV al servidor → pipeline IA normal (modal crear)

**Límite:** 5 minutos máximo (5 * 60 * 44100 * 2 channels * 2 bytes = ~52.9 MB WAV)

### Panel Lateral Redimensionable (184.2)

**Implementación:** Handle de resize con CSS `cursor: col-resize`
- Elemento invisible de 6px en el borde izquierdo del panel
- `mousedown` → `mousemove` → calcular nuevo ancho
- Guardado en CSS custom property: `--anchoPanelLateral`
- Min: 280px, Max: 600px
- Persistencia en localStorage
- Para el mezclador, el ancho mínimo recomendado es 400px

---

## Subtareas Detalladas

### 184.1 — Botón en TopBar
- Añadir icono `<Sliders>` (o `<Music2>`) en `topbarAcciones` después de "Crear"
- Solo visible cuando `autenticado`
- Click → toggle `mezcladorStore.abierto`
- Resaltar botón cuando mezclador está abierto (como notificaciones activas)

### 184.2 — Panel lateral redimensionable
- Crear componente `ResizeHandle` (barra vertical 6px invisible en borde)
- `onMouseDown` inicia escucha global `mousemove`/`mouseup`
- Actualizar `--anchoPanelLateral` en tiempo real
- Persistir ancho en `localStorage('kamples:anchoPanelLateral')`
- Aplicar a TODOS los modos del panel (detalle, comentarios, sugerencias, mezclador)

### 184.3 — Mezclador core
- Store Zustand (`mezcladorStore.ts`): pistas[], bpmProyecto, compasProyecto, totalCompases, abierto, reproduciendo
- Motor audio (`motorAudioService.ts`): singleton AudioContext, cache de AudioBuffers, scheduling
- Drag samples del feed: `CustomEvent('kamples:agregar-mezclador', { sample })` desde TarjetaSample

### 184.4 — Detección de compás + adaptación
- `compasUtils.ts`: inferir compás desde BPM + duración
- Fórmula: `beats = (duracion * bpm) / 60` → redondear y determinar compás
- Time-stretch via `playbackRate` en AudioBufferSourceNode
- UI: selector de compás en ControlesMezclador (4/4, 3/4, 6/8)

### 184.5 — Compases dinámicos
- Default 4 compases, botón "+" para añadir más
- Adaptación automática: si sample tiene 4 compases, ocupa 4 bloques
- Scroll horizontal si excede ancho visible

### 184.6 — Multi-pista + cursor
- Botón "+" debajo de la última pista para añadir
- `CursorReproduccion`: `position: absolute`, `left` calculado desde tiempo actual
- Clickeable para seek (reposicionar cursor)

### 184.7 — Visualización samples
- Mini waveform dentro de cada bloque (peaks reducidos, 50 peaks por compás)
- Título arriba con `font-size: 10px`, truncado con ellipsis
- Color de fondo del bloque basado en tipo de sample (loop, oneshot, etc.)

### 184.8 — Descarga de mezcla
- `OfflineAudioContext.startRendering()` → WAV
- POST a endpoint nuevo: `/samples/mezcla` → consume 1 crédito (DescargasController)
- Limitar a 5 minutos total

### 184.9 — Publicación de mezcla
- Renderizar WAV offline → crear `File` object
- Abrir `ModalCrear` con el archivo WAV pre-cargado
- Flag `esMezcla: true` en metadata para que la IA sepa que es una mezcla
- Pipeline IA analiza normalmente (pero se envía MP3 optimizado, ver 184.10)

### 184.10 — Optimización IA
- **En PipelineAudio.php paso 4** (antes de enviar a Groq):
  1. Verificar si existe el MP3 optimizado → usarlo en vez del WAV original
  2. Si no existe, generar MP3 temporal de los primeros 20s: `ffmpeg -t 20 -codec:a libmp3lame -b:a 128k`
  3. Enviar MP3 recortado a Groq Whisper (ahorro: ~90% tokens para audios largos)
  4. Añadir nota en prompt: `"[NOTA: Audio recortado a 20s para análisis]"` cuando aplique
  5. Eliminar MP3 temporal después del análisis

---

## Orden de Implementación

1. Tipos + Store (mezclador.ts, mezcladorStore.ts)
2. Motor audio (motorAudioService.ts, useMotorAudio.ts)
3. Utils (compasUtils.ts, audioBufferUtils.ts)
4. Componentes UI (Timeline, Pista, Bloque, Controles, Barra, Cursor)
5. Panel lateral resize (ResizeHandle + CSS)
6. Integración TopBar (botón) + PanelLateral (modo mezclador)
7. Drag & drop desde feed (TarjetaSample → mezclador)
8. Exportación offline (useExportarMezcla.ts)
9. Backend descarga mezcla (endpoint + créditos)
10. Publicación (integrar con ModalCrear)
11. Optimización IA (PipelineAudio.php)
12. ErrorBoundary + tests manuales

---

## Lecciones/Gotchas Anticipadas

- [Web Audio]: `AudioContext` requiere interacción del usuario para iniciar (autoplay policy). Crear lazy al primer click.
- [Web Audio]: `AudioBufferSourceNode` es one-shot — crear nuevo nodo para cada reproducción.
- [Offline]: `OfflineAudioContext` NO es reutilizable — crear uno nuevo para cada exportación.
- [Time-stretch]: `playbackRate` cambia pitch — para time-stretch sin cambio de pitch se necesitaría Phase Vocoder (complejo). Decisión: usar `playbackRate` simple (aceptable para ±20% de variación BPM).
- [WAV]: Encoding PCM 16-bit manualmente desde Float32Array del AudioBuffer.
- [Memoria]: Cachear AudioBuffers decodificados, no redecodificar cada vez.
- [Panel]: Resize del panel debe funcionar con `requestAnimationFrame` para smooth 60fps.
