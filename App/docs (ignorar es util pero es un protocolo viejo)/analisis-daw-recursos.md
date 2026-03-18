# Análisis de Recursos del DAW (Mezclador) — Kamples

> Última actualización: sesión AG-FIX  
> Fuentes: Mezclador/services/motorAudioService.ts, Mezclador/stores/, Mezclador/components/

---

## Resumen Ejecutivo

El mezclador DAW de Kamples es **100% client-side**. Todo el procesamiento de audio (síntesis, mezcla, efectos, pitch shifting, análisis) ocurre en la Web Audio API del navegador del usuario. El servidor **solo sirve archivos de audio estáticos** — no hay DSP ni renderizado server-side.

**Impacto en servidor: MÍNIMO.** La única carga es ancho de banda por descarga de samples.

---

## Arquitectura Actual

### Motor de Audio (`motorAudioService.ts` — 797 líneas)

```
AudioContext (singleton)
├── GainNode (master volume)
│   ├── AnalyserNode (master analyser, fftSize=2048)
│   └── ChannelSplitterNode (stereo split para MedidorPicos)
├── Pista 1
│   ├── GainNode (volume)
│   ├── StereoPannerNode (pan)
│   ├── [Insert Mixer: EQ 3-band + fader]
│   └── AudioBufferSourceNode (sample playback)
├── Pista 2...20
│   └── (misma cadena)
└── OfflineAudioContext (solo para decode/pitch, NO server)
```

### Qué Corre en el Cliente (Browser)

| Componente | Tecnología | Recurso |
|---|---|---|
| Reproducción de samples | `AudioBufferSourceNode` | RAM (AudioBuffers en memoria) |
| Pitch shifting | SoundTouchJS (WASM) | CPU cliente |
| Mezcla multi-pista | GainNode + StereoPannerNode | CPU cliente (mínimo) |
| EQ 3 bandas por insert | 3× `BiquadFilterNode` por insert | CPU cliente |
| Medidores de picos | `AnalyserNode` + `requestAnimationFrame` | CPU cliente (60fps) |
| Waveform rendering | Canvas 2D | GPU cliente |
| Piano Roll | Canvas + DOM híbrido | GPU/CPU cliente |
| Minimapa | DOM + `requestAnimationFrame` | CPU cliente |
| Step sequencer | DOM (button grid) | Mínimo |
| Undo/redo | Snapshots en memoria (sin AudioBuffers) | RAM cliente |

### Qué Corre en el Servidor

| Operación | Frecuencia | Carga |
|---|---|---|
| Servir archivo WAV/MP3 | Una vez por sample cargado | Ancho de banda (1-20MB/sample) |
| API explorador (listar samples) | Al abrir browser DAW | Query SQL ligera |
| HMAC token para streaming | Por descarga | CPU mínimo (hash) |

---

## Puntos de Contacto Servidor ↔ DAW

Solo 3 interacciones:

1. **Carga de sample:** `fetch(url)` → `AudioContext.decodeAudioData()` → `AudioBuffer` en RAM cliente
2. **Explorador de samples:** `apiExplorador` queries para navegar carpetas/samples
3. **Streaming seguro:** token HMAC firmado (30 min) para autorizar descarga

**No hay:**
- No hay procesamiento de audio en el servidor
- No hay renderizado/bounce server-side
- No hay OfflineAudioContext enviando resultados al backend
- No hay WebSocket para sync de audio en tiempo real
- No hay transcoding server-side para el DAW

---

## Consumo de Recursos del Cliente

### RAM

| Elemento | Tamaño estimado |
|---|---|
| AudioBuffer estéreo (10s, 44.1kHz, 32bit) | ~3.4 MB |
| 20 pistas cargadas | ~68 MB |
| Caché pitch shift (`Map<string, AudioBuffer>`) | Variable, puede duplicar |
| Snapshots undo/redo (MAX=30, sin buffers) | ~1-5 MB |
| **Total estimado máximo** | **~150-200 MB** |

### CPU

| Operación | Intensidad |
|---|---|
| Reproducción multi-pista (20 pistas) | Baja (Web Audio API hardware-accelerated) |
| Pitch shifting (SoundTouchJS) | **Alta** durante procesado, una vez por configuración |
| Canvas rendering (waveforms, piano roll, minimapa) | Media (60fps con rAF) |
| Step sequencer scheduling | Baja (lookahead timer pattern) |
| EQ processing (BiquadFilter ×3 ×17 inserts) | Media (hardware-accelerated pero suma) |

---

## Plan: Modo Offline para Desktop (Tauri)

### Qué Funciona Sin Conexión

| Funcionalidad | Offline viable | Notas |
|---|---|---|
| Reproducir samples descargados | **Sí** | AudioBuffer desde archivos locales |
| Mezclador completo | **Sí** | Todo es Web Audio API local |
| Piano Roll | **Sí** | DOM + Canvas, sin API calls |
| Channel Rack | **Sí** | State en stores locales |
| Mixer | **Sí** | Nodos de audio locales |
| Explorador (samples locales) | **Sí** | Leer filesystem vía Tauri API |
| Subir samples | **No** | Requiere API backend |
| Explorador (samples servidor) | **No** | Requiere API |
| Registro de reproducciones | **Diferido** | Queue local → sync al reconectar |

### Implementación Sugerida para Offline

```
1. ALMACENAMIENTO LOCAL
   - Carpeta elegida por usuario (C335 requisito)
   - SQLite local para índice de samples descargados (metadata, ruta, hash)
   - Tauri fs API para leer/escribir archivos

2. SYNC INTELIGENTE
   - Al conectar: comparar índice local vs servidor (hash + fecha)
   - Descargar solo samples nuevos/modificados
   - Sync configurable: auto / manual / wifi-only
   - Queue de operaciones offline (reproducciones, likes) → replay al reconectar

3. REPRODUCCIÓN LOCAL
   - Si sample existe en carpeta local → reproducir directamente (sin fetch)
   - Registrar reproducción en queue offline
   - Al reconectar: POST batch de reproducciones al servidor

4. DETECCIÓN DE CONECTIVIDAD
   - navigator.onLine + heartbeat al API
   - UI indicator: online/offline/syncing
   - Graceful degradation: features que requieren API se deshabilitan con tooltip
```

---

## Plan: Repositorio Separado para DAW

### Estructura Propuesta

```
kamples-daw/                    (repo separado)
├── src/
│   ├── components/             (copiados de Mezclador/components/)
│   ├── hooks/                  (copiados de Mezclador/hooks/)
│   ├── services/
│   │   ├── motorAudioService.ts
│   │   ├── pianoRollAudioService.ts
│   │   ├── pitchShiftService.ts
│   │   └── offlineStorageService.ts  (nuevo — SQLite/IndexedDB)
│   ├── stores/                 (copiados de Mezclador/stores/)
│   ├── styles/                 (copiados de Mezclador/styles/)
│   ├── types/                  (copiados de Mezclador/types/)
│   └── utils/                  (copiados de Mezclador/utils/)
├── src-tauri/                  (Tauri backend — Rust)
│   ├── src/
│   │   ├── main.rs
│   │   ├── sync.rs             (sync filesystem ↔ servidor)
│   │   ├── audio.rs            (drag-to-DAW via OS clipboard/DnD)
│   │   └── offline.rs          (SQLite index, queue)
│   └── tauri.conf.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Consideraciones de Extracción

- **Sin impacto en monorepo actual:** el DAW puede vivir en repo separado sin romper nada. Mezclador/ no tiene dependencias fuertes al resto de la app (solo importa stores compartidos como `reproductorStore` y services como `apiExplorador`).
- **Interfaces compartidas:** definir contratos (interfaces TS) para los services que el DAW necesita del servidor. En standalone, implementar con Tauri + local storage. En web, mantener la implementación actual con fetch.
- **Audio drag nativo:** Tauri 2.0 soporta drag-and-drop nativo con `startDrag()` API — permite arrastrar samples a DAWs externos (Ableton, FL Studio, etc.).

---

## Optimizaciones Futuras (Server-Side)

| Optimización | Beneficio | Complejidad |
|---|---|---|
| CDN para audio (CloudFront/R2) | Reduce carga servidor, cache global | Media |
| Waveform pre-generado (ya existe) | Evita re-cálculo | Ya implementado |
| Preview MP3 en lugar de WAV para browse | 10x menos ancho de banda | Baja |
| AudioWorklet para DSP custom | Procesado en hilo dedicado | Alta |
| SharedArrayBuffer para workers | Multi-threading real | Alta (requiere COOP/COEP headers) |
| WebGPU para FFT masivo | Ultra rendimiento DSP | Muy alta (experimental) |

---

## Gotchas

- **SoundTouchJS:** procesado pesado bloquea main thread. Considerar mover a AudioWorklet o Worker en futuro.
- **Caché de AudioBuffer:** sin límite actual (Map sin eviction). Con muchos samples puede consumir >500MB RAM. Implementar LRU cache.
- **OfflineAudioContext:** usado solo client-side para decode y pitch. No envía datos al servidor.
- **masterAnalyser + stereo split:** reutilizados. `crearInsertMixer(0)` reutiliza si ya existe.
- **20 pistas máximo:** límite práctico actual. Cada pista = GainNode + PannerNode + InsertMixer (3 BiquadFilters + GainNode + AnalyserNode).
- **BPM sync:** `playbackRate = nuevoTempo / tempoOriginal`. Cambio mid-playback afecta todas las pistas proporcionalmente.
