# Plan: Adquisicion de Samples y Metadata Musical -- Kamples

> **Version:** 3.0 | **Fecha:** 10/03/2026 | **Estado:** S1-S5 implementados, S5.5 (spotify_id) en commit, S-RECORTE diseñado, S6-S7 pendientes
> **Modulo:** Sample Discovery & Metadata Engine
> **Dependencias:** PostgreSQL, pgvector, yt-dlp, librosa/essentia, Scrapy, DataImpulse proxy, spotdl (Spotify)

---

## Mision

Preservar y democratizar la informacion sobre relaciones entre samples musicales. WhoSampled (adquirida por Spotify) concentra ~1.3M de canciones documentadas. Esta informacion -- contribuida por miles de personas durante 17+ anios -- corre riesgo real de desaparecer o quedar encerrada.

**Kamples = Splice + WhoSampled fusionados:** Relaciones descargables, samples recortados por IA, busqueda por audio, contribucion comunitaria, desktop drag-to-DAW.

**Meta:** ~100K relaciones en 1 anio via scraping + contribucion early users.

---

## Modelo de Datos -- Fuente de Verdad

### Principio fundamental: Bidireccional por diseno

`relaciones_sample` es la **UNICA** fuente de verdad. Las vistas "que samples usa" y "donde se usa" son **queries sobre la misma tabla**, no datos duplicados.

```sql
-- "Que samples usa Brooklyn Zoo?"
SELECT ... FROM relaciones_sample rs
JOIN canciones c_fuente ON rs.cancion_fuente_id = c_fuente.id
WHERE rs.cancion_destino_id = :brooklyn_zoo_id;

-- "Quien ha sampleado Exodus?"
SELECT ... FROM relaciones_sample rs
JOIN canciones c_dest ON rs.cancion_destino_id = c_dest.id
WHERE rs.cancion_fuente_id = :exodus_id;
```

### Tablas (6 tablas + 14 indices, migracion v027)

| Tabla | Proposito | Dedup |
|-------|-----------|-------|
| `artistas_musicales` | Artistas/grupos referenciados | `whosampled_slug` UNIQUE |
| `canciones` | Canciones comerciales | `whosampled_url` UNIQUE |
| `canciones_artistas` | N:N roles (principal/featuring/producer) | PK compuesta |
| `relaciones_sample` | Relacion central destino-fuente | `UNIQUE(dest, fuente, tipo)` + `whosampled_id` UNIQUE |
| `scraping_log` | URLs procesadas para dedup | `url` UNIQUE |
| `cola_extraccion_samples` | Cola pipeline audio | FK relacion_id |

### Reglas de consistencia

1. **Sin duplicacion de datos:** Contadores `total_sampleada`/`total_samplea` en `canciones` son caches denormalizados, recalculables con `COUNT(*)`.
2. **Dedup 4 capas:** Scrapy DupeFilter (sesion) -> scraping_log (persistente) -> UNIQUE constraints BD -> upsert ON CONFLICT.
3. **Samples extraidos** apuntan a `relaciones_sample.sample_id` FK (ON DELETE SET NULL).
4. **Roles artista** unificados en `canciones_artistas` con campo `rol` (CHECK: principal/featuring/producer).
5. **Cuando llega nueva data** (ej: "cancion CIEN samplea ONE"), se inserta una fila en `relaciones_sample`. Al consultar cancion ONE, la query bidireccional ya la incluye automaticamente -- sin actualizar ONE.

### Diagrama de relaciones

```
artistas_musicales --1:N--> canciones
                    --N:N--> canciones_artistas

canciones --1:N--> relaciones_sample (como destino)
          --1:N--> relaciones_sample (como fuente)

relaciones_sample --1:1--> samples (sample extraido, opcional)
                  --1:1--> cola_extraccion_samples (pipeline)
```

---

## Completado -- S1 a S5 (resumen compacto)

| Fase | Entregable | Highlights |
|------|-----------|------------|
| **S1** | BD + schemas + repos + API | 6 tablas, 14 indices, 6 repos PHP, CancionesController 9 endpoints |
| **S2** | Scraper core Python/Scrapy | HotSamplesSpider, SampleDetailSpider, DataImpulse middleware, PostgresPipeline upsert, bandwidth tracker |
| **S3** | Pipeline extraccion audio | yt-dlp -> librosa BPM -> recorte por compas -> waveform -> insercion BD. cron_runner.py cross-platform |
| **S4** | UI React Islands | CancionDetalleIsland, ExplorarCancionesIsland, TablaRelaciones, TarjetaRelacionSample, CadenaSamples, busqueda textual |
| **S5** | Expansion scraper | ArtistSpider, TrackSpider (samples + sampled), BrowseYearSpider, metadata pipeline (genre/youtube_id/tags) |

**S5-UI:** Ruta `/musica` registrada, sidebar item, antigua `/explorar/canciones` reemplazada.
**S5-FIX:** TrackMetadataItem, genre/youtube_id/tags persistencia, featuring artists `rol='featuring'`, filtro tags WhoSampled.

---

## FASE S-RECORTE: Generacion Automatica de Samples desde Sampleos

> **Estado:** Diseñado | **Prioridad:** Alta (siguiente fase activa)
> **Objetivo:** A partir de una relacion (sampleo), generar 2 samples de audio automaticos: uno del lado fuente (sampleada) y otro del lado destino (que samplea), publicarlos como samples reales en la plataforma con metadata enriquecida.

### Vision: Los 3 tipos de contenido se nutren mutuamente

```
SAMPLE ←→ SAMPLEO ←→ CANCION
  ↕           ↕           ↕
coleccion   relacion    artista
descargar   timings     genero
drag-to-DAW votos       album
  ↕           ↕           ↕
  └───────────┴───────────┘
    Kamples = Splice + WhoSampled
```

- **sample**: Audio descargable, coleccionable, drag-to-DAW. Los que aparecen en inicio.
- **sampleo**: Relacion entre canciones (scraping WhoSampled). Documenta DONDE se uso un sample.
- **cancion**: Metadata musical (artista, album, genero, youtube_id/spotify_id).

Un sampleo genera 2 samples (fuente + destino). Un sample auto-generado sabe de que cancion viene y de que sampleo se extrajo. Una cancion puede tener N samples extraidos de sus sampleos.

### Arquitectura actual vs. lo que falta

**Ya existe (pipeline Python listo):**
- `cola_extraccion_samples` — cola con `relacion_id`, `youtube_id`, `timing_inicio_seg`
- `extractor/pipeline.py` — orquestador: descargar (yt-dlp) → BPM (librosa) → recorte (ffmpeg) → insertar
- `extractor/sample_cutter.py` — recorte alineado a compas (1 compas margen, 8 compases recorte, fade in/out)
- `extractor/kamples_inserter.py` — INSERT en `samples` (creador_id=0, estado=`en_supervision`) + vincular `relaciones_sample.sample_id`

**Gaps a resolver:**

| # | Gap | Solucion |
|---|-----|----------|
| G1 | Cola solo maneja 1 lado (1 youtube_id + 1 timing) | Ampliar para generar 2 entradas por relacion: lado fuente + lado destino |
| G2 | No hay forma de lanzar desde UI (boton dev) | Endpoint `POST /dev/recorte/generar` que encole una relacion |
| G3 | `relaciones_sample.sample_id` es 1 FK → solo 1 sample | Agregar `sample_fuente_id` y `sample_destino_id` (o tabla pivot) |
| G4 | Canciones con Spotify pero sin YouTube | Usar `spotdl` como alternativa a yt-dlp para descargar desde Spotify |
| G5 | Metadata enriquecida en sample (de donde viene) | Ya parcialmente resuelto en `kamples_inserter.py` (metadata JSONB). Formalizar con FK |
| G6 | No hay proceso automatico en produccion | Cron/worker que encole relaciones sin samples y ejecute pipeline |
| G7 | `cola_extraccion_samples` necesita campo `lado` | Saber si es recorte del lado fuente o destino |

---

### S-R1: Migracion BD — Ampliar cola y relaciones [CRITICO]

```sql
-- v031_recorte_bilateral.sql

-- 1. Agregar campo 'lado' a cola_extraccion_samples
ALTER TABLE cola_extraccion_samples
    ADD COLUMN IF NOT EXISTS lado VARCHAR(10) DEFAULT 'fuente'
    CHECK (lado IN ('fuente', 'destino'));
COMMENT ON COLUMN cola_extraccion_samples.lado IS 'Lado de la relacion: fuente (sampleada) o destino (que samplea)';

-- 2. Permitir spotify_id como fuente de audio (alternativa a youtube_id)
ALTER TABLE cola_extraccion_samples
    ALTER COLUMN youtube_id DROP NOT NULL;
ALTER TABLE cola_extraccion_samples
    ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(30);
COMMENT ON COLUMN cola_extraccion_samples.spotify_id IS 'ID de Spotify cuando no hay YouTube disponible';

-- 3. Reemplazar sample_id singular por bilateral en relaciones_sample
ALTER TABLE relaciones_sample
    ADD COLUMN IF NOT EXISTS sample_fuente_id INT REFERENCES samples(id) ON DELETE SET NULL;
ALTER TABLE relaciones_sample
    ADD COLUMN IF NOT EXISTS sample_destino_id INT REFERENCES samples(id) ON DELETE SET NULL;
COMMENT ON COLUMN relaciones_sample.sample_fuente_id IS 'Sample extraido del lado fuente (cancion sampleada)';
COMMENT ON COLUMN relaciones_sample.sample_destino_id IS 'Sample extraido del lado destino (cancion que samplea)';

-- 4. Migrar datos existentes de sample_id → sample_fuente_id
UPDATE relaciones_sample SET sample_fuente_id = sample_id WHERE sample_id IS NOT NULL;

-- 5. Agregar FK de sample a cancion de origen (para navegacion directa sample→cancion)
ALTER TABLE samples
    ADD COLUMN IF NOT EXISTS cancion_origen_id INT REFERENCES canciones(id) ON DELETE SET NULL;
COMMENT ON COLUMN samples.cancion_origen_id IS 'Cancion de la que se extrajo este sample (NULL si es upload de usuario)';

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_relaciones_sample_fuente_id ON relaciones_sample(sample_fuente_id) WHERE sample_fuente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_relaciones_sample_destino_id ON relaciones_sample(sample_destino_id) WHERE sample_destino_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_samples_cancion_origen ON samples(cancion_origen_id) WHERE cancion_origen_id IS NOT NULL;

-- 7. CHECK constraint: cola debe tener youtube_id O spotify_id
ALTER TABLE cola_extraccion_samples
    ADD CONSTRAINT chk_cola_tiene_fuente_audio
    CHECK (youtube_id IS NOT NULL OR spotify_id IS NOT NULL);
```

**Nota sobre `sample_id` legacy:** No se elimina inmediatamente para no romper codigo existente. Se deprecia en favor de `sample_fuente_id`/`sample_destino_id`. Eliminar en migracion futura cuando todo el codigo use los nuevos campos.

---

### S-R2: Encolado bilateral — 2 samples por relacion

Al encolar una relacion para extraccion, se generan **2 entradas** en `cola_extraccion_samples`:

```python
def encolar_relacion(relacion_id: int) -> list[int]:
    """
    Crear 2 entradas en cola: lado fuente + lado destino.
    Cada una con el youtube_id/spotify_id y timing correspondiente.
    """
    # Obtener relacion con sus canciones
    relacion = obtener_relacion_con_canciones(relacion_id)

    entradas = []

    # Lado fuente (cancion sampleada)
    if relacion['fuente_youtube_id'] or relacion['fuente_spotify_id']:
        timings_fuente = relacion['timings_fuente'] or [0]
        entradas.append({
            'relacion_id': relacion_id,
            'youtube_id': relacion['fuente_youtube_id'],
            'spotify_id': relacion['fuente_spotify_id'],
            'timing_inicio_seg': timings_fuente[0],  # Primer timing
            'lado': 'fuente',
        })

    # Lado destino (cancion que samplea)
    if relacion['destino_youtube_id'] or relacion['destino_spotify_id']:
        timings_destino = relacion['timings_destino'] or [0]
        entradas.append({
            'relacion_id': relacion_id,
            'youtube_id': relacion['destino_youtube_id'],
            'spotify_id': relacion['destino_spotify_id'],
            'timing_inicio_seg': timings_destino[0],
            'lado': 'destino',
        })

    # INSERT en cola (con dedup: no re-encolar si ya existe para mismo relacion+lado)
    # UNIQUE(relacion_id, lado) previene duplicados
    return ids_creados
```

**Dedup:** Agregar `UNIQUE(relacion_id, lado)` a `cola_extraccion_samples` para que una relacion no se encole dos veces para el mismo lado.

---

### S-R3: Pipeline ampliado — Soporte Spotify + bilateral

**Descarga de audio — prioridad de fuentes:**

```
1. youtube_id disponible → yt-dlp (actual, funciona)
2. youtube_id NO disponible, spotify_id disponible → spotdl
3. Ninguno disponible → estado='error', mensaje='Sin fuente de audio'
```

**spotdl** (https://github.com/spotDL/spotify-downloader): Descarga audio de Spotify a MP3/WAV. Funciona con el track ID:
```bash
spotdl download "https://open.spotify.com/track/{SPOTIFY_ID}" --output "{output_dir}" --format wav
```

**Modificacion a `audio_download.py`:**

```python
def descargar_audio(youtube_id: str | None, spotify_id: str | None, output_dir: str) -> str | None:
    """Descargar audio priorizando YouTube, fallback a Spotify."""
    if youtube_id:
        return _descargar_youtube(youtube_id, output_dir)
    elif spotify_id:
        return _descargar_spotify(spotify_id, output_dir)
    return None

def _descargar_spotify(spotify_id: str, output_dir: str) -> str | None:
    """Descargar audio desde Spotify via spotdl."""
    # validar formato spotify_id
    # spotdl download https://open.spotify.com/track/{id} --output dir --format wav
    # retornar path al WAV
```

**Consideraciones Spotify:**
- spotdl internamente busca el audio en YouTube Music matcheando metadata. Es mas lento (~10-15s vs 5s yt-dlp).
- Calidad: depende del match. Para recortes de 8 compases es suficiente.
- Si spotdl no encuentra match: estado='error' con mensaje claro.
- Rate limiting: spotdl usa la API de Spotify + YouTube. Respetar delays.
- **Alternativa sin descarga (embed only):** Si no se puede descargar, al menos mostrar embed de Spotify en la UI como preview. El sample no se genera pero la relacion sigue siendo util como informacion.

---

### S-R4: Insercion bilateral — 2 samples vinculados

**Cambio en `kamples_inserter.py`:**

```python
def insertar_sample(relacion_id, recorte, wav_path, metadata_cancion, lado, waveform_path=None):
    """
    Insertar sample y vincular al lado correcto de la relacion.
    lado: 'fuente' o 'destino'
    """
    # ... INSERT en samples (igual que ahora)
    # ... pero vincular cancion_origen_id

    # Vincular al campo correcto
    if lado == 'fuente':
        cur.execute("UPDATE relaciones_sample SET sample_fuente_id = %s WHERE id = %s", (sample_id, relacion_id))
    else:
        cur.execute("UPDATE relaciones_sample SET sample_destino_id = %s WHERE id = %s", (sample_id, relacion_id))

    # Vincular sample con cancion de origen
    cancion_id = metadata_cancion.get('cancion_fuente_id' if lado == 'fuente' else 'cancion_destino_id')
    if cancion_id:
        cur.execute("UPDATE samples SET cancion_origen_id = %s WHERE id = %s", (cancion_id, sample_id))
```

**Titulo del sample segun lado:**
- Lado fuente: `"Artista - Titulo [Sample: tipo_elemento]"` (ya existe)
- Lado destino: `"Artista - Titulo [Samples: tipo_elemento from Artista_fuente]"`

**Tags enriquecidos:**
```python
tags_base = [tipo_elemento, artista, "extracted", "whosampled"]
if lado == 'fuente':
    tags_base.append("original")    # El sonido original que fue sampleado
if lado == 'destino':
    tags_base.append("interpolation")  # Como suena el sample en la cancion nueva
```

---

### S-R5: Boton Dev — "Generar samples desde sampleo" [TESTING]

**Endpoint:** `POST /dev/recorte/generar`

```
Request:  { relacion_id: 189 }
Response: { ok: true, encolados: 2, entradas: [{id: 1, lado: 'fuente', youtube_id: 'XJXoVGmxsA0'}, {id: 2, lado: 'destino', spotify_id: '7ahe...'}] }
```

**Flujo desde UI:**
1. En pagina de sampleo (RelacionDetalleIsland), boton dev "Generar Samples"
2. POST a `/dev/recorte/generar` con el `relacion_id`
3. Backend encola 2 entradas (S-R2)
4. Responde con los IDs encolados
5. Segundo boton: "Procesar cola de recortes" → lanza `pipeline.py --limit 2`
6. Feedback visual: estado de procesamiento

**Alternativa:** Un solo boton que encole Y lance el pipeline (sincrono para testing). Para produccion seran procesos separados.

**UI PanelDevCanciones:**
```tsx
// Nuevo boton en el panel dev de la vista de sampleo
<BotonBase onClick={() => generarSamplesDesdeRelacion(relacionId)}>
    Generar Samples desde Sampleo
</BotonBase>
```

---

### S-R6: Relacion sample ↔ cancion (navegacion cruzada)

**Nuevo campo `samples.cancion_origen_id`** permite:
- En pagina de sample: mostrar "Extraido de: Artista - Cancion" con link
- En pagina de cancion: mostrar "Samples extraidos de esta cancion" (query por `cancion_origen_id`)
- En inicio (feed): badge "De WhoSampled" en samples auto-generados
- **NO se duplica informacion**: la metadata de la cancion se consulta via JOIN, no se copia al sample

**Consultas habilitadas:**
```sql
-- Samples extraidos de una cancion
SELECT s.* FROM samples s WHERE s.cancion_origen_id = :cancion_id;

-- Cancion de origen de un sample
SELECT c.* FROM canciones c
JOIN samples s ON s.cancion_origen_id = c.id
WHERE s.id = :sample_id;

-- Sampleo que genero un sample
SELECT rs.* FROM relaciones_sample rs
WHERE rs.sample_fuente_id = :sample_id OR rs.sample_destino_id = :sample_id;
```

---

### S-R7: Produccion — Procesos paralelos

En produccion, 2 workers independientes corren en intervalos:

```
WORKER 1: SCRAPING (ya existe)
┌─────────────────────────────────────────┐
│ Cron cada 4 horas                       │
│ 1. hot_samples → nuevas URLs            │
│ 2. Procesar cola scraping_log           │
│    (track, sample_detail, artist)       │
│ 3. Al completar un sample_detail:       │
│    → Encolar 2 entradas en              │
│      cola_extraccion_samples            │
│      (una fuente + una destino)         │
│    → Solo si ambas canciones tienen     │
│      youtube_id o spotify_id            │
└─────────────────────────────────────────┘

WORKER 2: EXTRACCION (pipeline.py)
┌─────────────────────────────────────────┐
│ Cron cada 30 minutos                    │
│ 1. Leer cola_extraccion_samples         │
│    (pendientes, intentos < 3)           │
│ 2. Por cada entrada:                    │
│    descargar → BPM → recortar → insert  │
│ 3. Limit: 20 por ejecucion             │
│ 4. Resultado: sample publicado          │
│    (estado: en_supervision)             │
└─────────────────────────────────────────┘
```

**Encolado automatico post-scraping:** Modificar `pipelines.py` (PostgresPipeline) para que al completar un INSERT/UPDATE de `relaciones_sample` que tenga timings, **encole automaticamente** en `cola_extraccion_samples` (si no existe ya para esa relacion+lado).

---

### S-R8: Descripcion auto-generada (metadata → texto)

Cada sample auto-generado tendra una descripcion que se construye desde la metadata:

```
"Sample extraido de '{fuente_titulo}' de {fuente_artista} ({fuente_anio}).
Usado en '{destino_titulo}' de {destino_artista} ({destino_anio}).
Tipo de sample: {tipo_elemento}. BPM: {bpm}. Duracion: {duracion}s.
Documentado en WhoSampled con {votos_total} votos."
```

Esto se genera en `kamples_inserter.py` y se guarda en `samples.descripcion`.

---

### Orden de implementacion (por dificultad, mayor primero)

| Paso | Tarea | Complejidad | Dependencia |
|------|-------|-------------|-------------|
| 1 | S-R1: Migracion BD (bilateral + spotify + cancion_origen) | Media | - |
| 2 | S-R3: `audio_download.py` soporte Spotify (spotdl) | Alta | S-R1 |
| 3 | S-R2: Funcion encolar bilateral en pipeline.py | Media | S-R1 |
| 4 | S-R4: Insercion bilateral en kamples_inserter.py | Media | S-R1, S-R2 |
| 5 | S-R5: Boton dev + endpoint PHP | Baja | S-R2 |
| 6 | S-R6: UI navegacion sample→cancion→sampleo | Baja | S-R4 |
| 7 | S-R7: Encolado automatico post-scraping | Baja | S-R2 |
| 8 | S-R8: Descripcion auto-generada | Trivial | S-R4 |

---

### Preguntas abiertas / Decisiones pendientes

1. **spotdl calidad:** spotdl puede encontrar matches incorrectos (otra version de la cancion). Aceptamos ese riesgo para testing? En revision humana (S7) se puede corregir.
2. **Donde almacenar WAVs recortados:** Actualmente en `wp-content/uploads/kamples/`. Agregar subdirectorio `extraidos/` para separar uploads de usuarios vs. auto-generados?
3. **Limite de tamaño:** Los WAV de 8 compases ~ 1-5MB. Con 100K relaciones = 200K samples = ~500GB. Considerar MP3/OGG para auto-generados? O WAV solo para "aprobados"?
4. **Estado inicial:** `en_supervision` (actual) vs. `activo` directo para testing. En produccion sera `en_supervision` hasta revision humana.
5. **Preview vs full:** Generar solo preview (~15s) o sample completo? Preview = mas rapido y ligero.

---

## Pendientes -- FASE S6: Audio Search + Contribucion Comunitaria

- [ ] **S6.1** Chromaprint fingerprinting: generar fingerprints de canciones indexadas
- [ ] **S6.2** Endpoint busqueda por audio: upload fragmento -> match -> relaciones
- [ ] **S6.3** Embeddings de fragmentos de sample (pgvector) para similaridad
- [ ] **S6.4** UI contribucion: formulario "agregar sample" en pagina de cancion
- [ ] **S6.5** Cola de moderacion de contribuciones
- [ ] **S6.6** Sistema de "Cred" (reputacion contribuidores)

### Gamificacion propuesta

| Accion | Cred |
|--------|------|
| Contribucion aprobada | +10 |
| Contribucion rechazada | -2 |
| Verificar timing preciso | +5 |
| Revisar recorte de sample | +3 |
| Primer contribuidor de artista nuevo | +20 |

---

## Pendientes -- FASE S7: Revision Humana y Calidad

- [ ] **S7.1** Panel de revision: escuchar sample extraido, ajustar recorte
- [ ] **S7.2** Herramienta de recorte interactivo (waveform + drag handles)
- [ ] **S7.3** Bulk review: cola de samples pendientes con approve/reject rapido
- [ ] **S7.4** Metricas de calidad: % de recortes aprobados sin editar, BPM accuracy

---

## Riesgos y Mitigaciones

| Riesgo | Mitigacion |
|--------|-----------|
| WhoSampled cambia HTML | Parsers modulares, tests fixture HTML, alertas error |
| Rate limiting / ban IP | 3s delay, proxy residencial rotativo, user-agent realista |
| YouTube no disponible | Marcar pendiente, reintentar, fuentes alternativas |
| BPM incorrecto | Flag revision humana, multiples algoritmos |
| WhoSampled cierra | Priorizar data valiosa primero + contribucion propia |
| Recortes baja calidad | Inician en `en_supervision`, requieren aprobacion |

---

## Stack de Referencia (scraper Python)

```
kamples-scraper/
  kamples_scraper/spiders/      # hot_samples, sample_detail, artist, track, browse_year
  kamples_scraper/pipelines.py  # PostgresPipeline upsert artista->cancion->relacion
  kamples_scraper/middlewares.py # DataImpulse proxy, bandwidth tracker
  extractor/                    # audio_download, bpm_analyzer, sample_cutter, kamples_inserter, pipeline
  scripts/                      # run_daily.sh, run_extraction.sh, stats.py, cron_runner.py
```

**Config clave:** `DOWNLOAD_DELAY=3`, `CONCURRENT_REQUESTS=1`, gzip obligatorio, ~20KB/pagina, $5 = ~250K paginas.

---

## Lecciones y Gotchas

### Scraper / Parsing
- [WhoSampled HTML]: Selectores en codigo. `data-timings` = segundos enteros. Multiples timings posibles.
- [Related sections]: NUNCA parsear por indice. Usar texto del header.
- [feat. artistas]: Multiples `<a>` en `.sampleTrackArtists`. Primer = principal, siguientes = featuring.
- [Badge vs tipo_elemento]: En samples es tipo_elemento, en covers/remixes es genero.
- [URL normalization]: Decodificar, lowercase, strip trailing slash antes de guardar en scraping_log.
- [canciones_productores eliminada]: Reemplazada por `canciones_artistas` con `rol='producer'`.
- [imagen_url]: Prefijar `https://www.whosampled.com` si empieza con `/`. ON CONFLICT: `COALESCE(EXCLUDED, existing)`.

### API / Backend
- [snake_case vs camelCase]: NormalizadorCancion helper para transformar filas BD a formato frontend.
- [json_decode timings]: Verificar `json_last_error()`, no usar `?? []` directo.
- [SQL alias cross-file]: Si Repository devuelve alias `artista_nombre` pero Normalizador lee `nombre`, llega null silenciosamente.
- [proc_open array]: Para binarios externos, usar array sin shell intermediario.

### UI / SPA
- [Navigation store]: Import `useNavigationStore` desde `@/core/router`.
- [SPA props + rutas dinamicas]: Props evaluados en servidor se pasan como 3er arg a `inicializar()`.
- [Route params]: Router SPA soporta patrones de params (`:id/:slug?`) en `registrarRutaDinamica()`. Extraccion automatica en `extraerParamsDeUrl()`.
- [PageRenderer keep-alive + misma isla]: Navegacion misma isla usa `propsActuales` del store (live) para isla activa. Las ocultas mantienen props cacheados.
- [BotonBase props]: `variante` acepta 'primario'|'secundario'|'ghost'|'peligro'. `tamano` sin tilde.
- [CampoTexto wrapper]: Envuelve input en div. CSS con `.miClase input`. `variante="desnudo"` quita estilos.

---

## Plan de Escalabilidad Relacional (C703) — ✅ Implementado C704

### Respuesta a la pregunta central: "Cuando llega data nueva, se actualiza la cancion vieja?"

**SI, automaticamente.** La arquitectura bidireccional garantiza esto:
- Se inserta `cancion_CIEN samplea cancion_ONE` en `relaciones_sample`
- Al consultar cancion ONE con `WHERE cancion_fuente_id = one_id`, la nueva relacion aparece inmediatamente
- No se necesita "actualizar" cancion ONE — la query bidireccional sobre la tabla unica de relaciones ya la incluye

### Problemas detectados para escala (auditoria 10/03/2026)

**1. Contadores cache nunca se actualizan (critico)**
- `canciones.total_sampleada` y `canciones.total_samplea` estan a 0 siempre
- No hay triggers ni batch jobs
- **Solucion:** Trigger PostgreSQL en `relaciones_sample` que incremente/decremente los contadores en `canciones` al INSERT/DELETE
- **Alternativa:** Batch job nocturno `UPDATE canciones SET total_sampleada = (SELECT COUNT(*) ...)` para cada cancion con relaciones

**2. Relaciones re-encontradas no se actualizan**
- Pipeline usa `ON CONFLICT (whosampled_id) DO NOTHING` para relaciones
- Si WhoSampled actualiza timings/votos de una relacion existente, nuestra BD nunca se entera
- **Solucion:** Cambiar a `DO UPDATE SET timings_destino = EXCLUDED.timings_destino, timings_fuente = EXCLUDED.timings_fuente, votos_total = EXCLUDED.votos_total, votos_promedio = EXCLUDED.votos_promedio, updated_at = NOW() WHERE relaciones_sample.updated_at < EXCLUDED.updated_at` (solo actualizar si data mas reciente)

**3. Indices compuestos faltantes**
- Queries bidireccionales con filtro por tipo_relacion hacen table scan a escala
- **Indices necesarios:**
  - `(cancion_destino_id, tipo_relacion)` — "samples que USA esta cancion por tipo"
  - `(cancion_fuente_id, tipo_relacion)` — "canciones que la SAMPLEAN por tipo"
  - `(verificada, created_at DESC)` — listados de relaciones verificadas recientes

**4. Re-scraping strategy**
- Actualmente scraping_log.estado='procesado' excluye URLs permanentemente
- Para data que evoluciona (ratings cambian, nuevas relaciones en paginas de track):
  - Marcar URLs como `re_scrapeable` con `proximo_rescrape` timestamp
  - Rescraping mensual de paginas de tracks populares (> N relaciones)
  - Hot-samples diario no necesita rescraping (siempre nuevas URLs)

### Escalabilidad arquitectonica (ya resuelta)

| Aspecto | Estado | Mecanismo |
|---------|--------|-----------|
| Bidireccionalidad | OK | Query unica sobre `relaciones_sample`, no datos duplicados |
| Dedup canciones | OK | `whosampled_url` UNIQUE + upsert ON CONFLICT |
| Dedup relaciones | OK | `UNIQUE(dest, fuente, tipo)` + `whosampled_id` UNIQUE |
| Dedup scraping | OK | 4 capas (DupeFilter + scraping_log + UNIQUE + upsert) |
| Complementacion de data | OK | COALESCE en upserts: solo llena huecos, no pisa datos validos |
| Nuevas relaciones automaticas | OK | INSERT en tabla central -> queries bidireccionales lo captan |
