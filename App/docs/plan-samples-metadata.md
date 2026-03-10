# Plan: Adquisición de Samples y Metadata Musical — Kamples

> **Versión:** 1.4 | **Fecha:** 10/03/2026 | **Estado:** S1-S5 implementados  
> **Módulo:** Sample Discovery & Metadata Engine  
> **Dependencias:** PostgreSQL, pgvector, yt-dlp, librosa/essentia, Scrapy, DataImpulse proxy

---

## Misión

Preservar y democratizar la información sobre relaciones entre samples musicales. WhoSampled (adquirida por Spotify) concentra ~1.3M de canciones documentadas con relaciones sample-canción-timing. Spotify ha demostrado un patrón consistente de cerrar accesos (API pública deprecada, integraciones eliminadas). Esta información — contribuida por miles de personas durante 17+ años — corre riesgo real de desaparecer o quedar encerrada tras un paywall corporativo.

**Kamples asume la responsabilidad de:**

1. Preservar esta información como bien cultural abierto
2. Enriquecerla con samples descargables recortados por IA + revisión humana
3. Integrarla con un marketplace de samples (competencia Splice + WhoSampled fusionados)
4. Construir un sistema de contribución comunitaria para crecimiento orgánico

**Nota legal:** Este proyecto opera bajo principios de preservación cultural y fair use. No se redistribuyen canciones completas. Los samples extraídos son fragmentos cortos con propósito educativo/referencial. La metadata (quién sampleó a quién, en qué momento) es información factual no sujeta a copyright.

---

## Visión de Producto

Imaginar Splice y WhoSampled fusionados en un solo producto:

- **Splice:** Descarga samples, drag-to-DAW, suscripción, marketplace creadores
- **WhoSampled:** Relaciones entre canciones, "quién sampleó a quién", timings, cadenas de samples
- **Kamples:** Todo lo anterior + samples extraídos automáticamente + búsqueda por audio + contribución comunitaria

### Diferenciadores vs WhoSampled

| WhoSampled                 | Kamples                                             |
| -------------------------- | --------------------------------------------------- |
| Solo muestra relaciones    | Sample descargable del fragmento exacto             |
| Solo texto + YouTube embed | Waveform interactivo del sample                     |
| Búsqueda solo textual      | Búsqueda por audio (fingerprinting) + textual       |
| Web only                   | Desktop (Tauri) con drag-to-DAW                     |
| Sin marketplace            | Marketplace integrado (samples propios + extraídos) |
| Cerrado (Spotify)          | Contribución comunitaria abierta                    |

---

## Estrategia de Adquisición de Datos

### Prioridades (en orden)

1. **Hot Samples diarios** — Scraping de /hot-samples cada 24h (~20-50 entries/día)
2. **Artistas top por género** — Los más sampleados (hip-hop, electrónica, funk, soul, jazz)
3. **Cadenas de samples** — Seguir links "songs that sampled X" y "sampled in X"
4. **Expansión progresiva** — Browse por década, género, popularidad
5. **Contribución comunitaria** — Sistema propio (prioridad secundaria, no dependemos de esto)

### Meta realista

| Período  | Meta                       | Estrategia                                     |
| -------- | -------------------------- | ---------------------------------------------- |
| Mes 1-3  | ~5,000 relaciones          | Hot samples + top artistas hip-hop/electrónica |
| Mes 4-6  | ~15,000 relaciones         | Expansión por cadenas de samples               |
| Mes 7-12 | ~50,000-100,000 relaciones | Browse sistemático + contribución early users  |
| Año 2+   | 200,000+                   | Contribución comunitaria + scraping continuo   |

### Presupuesto de Ancho de Banda

**Proxy:** DataImpulse — 1 GB / $1 (residencial)  
**Presupuesto inicial:** $5 = 5 GB

**Cálculo de rendimiento:**

| Elemento                          | Tamaño estimado | Optimización          |
| --------------------------------- | --------------- | --------------------- |
| Página HTML WhoSampled (completa) | ~80-120 KB      | Solo HTML, sin assets |
| Página HTML (comprimida gzip)     | ~15-25 KB       | Accept-Encoding: gzip |
| Página de detalle sample          | ~20 KB (gzip)   | Solo lo necesario     |
| Página hot-samples                | ~15 KB (gzip)   | 1 request/día         |
| Página artista (lista tracks)     | ~20 KB (gzip)   | Cache, no repetir     |

**Con 5 GB y ~20 KB/página promedio (gzip):**

- ~250,000 páginas posibles
- Cada relación sample requiere ~2-3 páginas (lista + detalle + source)
- **~80,000-120,000 relaciones con $5** ✓

**Estrategias de ahorro de ancho de banda:**

- Headers `Accept-Encoding: gzip, deflate, br` obligatorios
- No descargar imágenes, JS, CSS — solo HTML
- Cache local de páginas ya visitadas (dedup por URL)
- Priorizar páginas con mayor densidad de información (listas > detalles individuales)
- Las descargas de audio (YouTube) NO pasan por proxy — van directo

---

## Modelo de Datos

### Principio fundamental: Sin discrepancias

Las relaciones son **bidireccionales por diseño**. Cuando se registra "Brooklyn Zoo samplea Exodus":

- La canción "Brooklyn Zoo" tiene en sus registros: "samplea Exodus en 0:04"
- La canción "Exodus" tiene en sus registros: "sampleada por Brooklyn Zoo desde 0:30"
- El sample extraído apunta a ambas canciones

**Regla:** Una sola tabla `relaciones_sample` es la fuente de verdad. Las vistas "qué samples usa esta canción" y "dónde se usa este sample" son **queries sobre la misma tabla**, no datos duplicados.

### Tablas nuevas

```sql
/* ============================================================
   ARTISTAS MUSICALES
   Artistas/grupos referenciados en relaciones de samples.
   Separado de usuarios_ext (que son usuarios de Kamples).
   ============================================================ */
CREATE TABLE artistas_musicales (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(300) NOT NULL,
    slug            VARCHAR(350) UNIQUE NOT NULL,
    imagen_url      TEXT,
    whosampled_slug VARCHAR(350) UNIQUE,       -- '/Eddie-Harris/' para dedup
    musicbrainz_id  VARCHAR(36),               -- UUID de MusicBrainz (futuro)
    metadata        JSONB DEFAULT '{}',        -- { generos, pais, bio_corta }
    total_canciones INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artistas_slug ON artistas_musicales(slug);
CREATE INDEX idx_artistas_ws_slug ON artistas_musicales(whosampled_slug);


/* ============================================================
   CANCIONES
   Canciones referenciadas en relaciones de samples.
   NO son samples de Kamples — son canciones publicadas comercialmente.

   NOTA artistas: artista_id = artista principal (obligatorio).
   Featuring artists van en canciones_artistas con rol='featuring'.
   Ejemplo: "Jay-Z feat. The Notorious B.I.G."
     → artista_id = Jay-Z (principal)
     → canciones_artistas: (cancion, Notorious, 'featuring')
   ============================================================ */
CREATE TABLE canciones (
    id                SERIAL PRIMARY KEY,
    titulo            VARCHAR(500) NOT NULL,
    slug              VARCHAR(550) UNIQUE NOT NULL,
    artista_id        INT NOT NULL REFERENCES artistas_musicales(id),
    album             VARCHAR(500),
    sello             VARCHAR(200),
    anio              SMALLINT,
    duracion_segundos SMALLINT,
    genero            VARCHAR(100),
    youtube_id        VARCHAR(20),
    imagen_url        TEXT,
    whosampled_url    VARCHAR(500) UNIQUE,      -- ruta relativa normalizada para dedup
    bpm               SMALLINT,
    tonalidad         VARCHAR(5),
    metadata          JSONB DEFAULT '{}',       -- { discogs_id, album_url, extras }
    total_sampleada   INT DEFAULT 0,            -- cache: cuántas canciones la samplean
    total_samplea     INT DEFAULT 0,            -- cache: cuántas canciones samplea
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_canciones_artista ON canciones(artista_id);
CREATE INDEX idx_canciones_slug ON canciones(slug);
CREATE INDEX idx_canciones_ws ON canciones(whosampled_url);
CREATE INDEX idx_canciones_anio ON canciones(anio);
CREATE INDEX idx_canciones_youtube ON canciones(youtube_id);


/* ============================================================
   CANCIONES_ARTISTAS — Relación N:N
   Roles: 'principal', 'featuring', 'producer'
   El artista principal también va aquí para queries uniformes.
   ============================================================ */
CREATE TABLE canciones_artistas (
    cancion_id  INT NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
    artista_id  INT NOT NULL REFERENCES artistas_musicales(id) ON DELETE CASCADE,
    rol         VARCHAR(20) NOT NULL DEFAULT 'principal'
                CHECK (rol IN ('principal', 'featuring', 'producer')),
    PRIMARY KEY (cancion_id, artista_id, rol)
);

CREATE INDEX idx_ca_artista ON canciones_artistas(artista_id);


/* ============================================================
   RELACIONES DE SAMPLE (TABLA CENTRAL — FUENTE DE VERDAD)

   Una fila = una relación entre dos canciones.
   cancion_destino = la canción que USA el sample (ej: Brooklyn Zoo)
   cancion_fuente  = la canción de DONDE VIENE el sample (ej: Exodus)

   Para consultar "qué samples usa Brooklyn Zoo":
     WHERE cancion_destino_id = brooklyn_zoo_id
   Para consultar "quién sampleó Exodus":
     WHERE cancion_fuente_id = exodus_id

   NOTA timings: JSON arrays porque una canción puede samplear
   la misma fuente en múltiples puntos. WhoSampled usa
   data-timing-index para enumerar timings múltiples.
   ============================================================ */
CREATE TABLE relaciones_sample (
    id                  SERIAL PRIMARY KEY,
    cancion_destino_id  INT NOT NULL REFERENCES canciones(id),
    cancion_fuente_id   INT NOT NULL REFERENCES canciones(id),

    /* ID numérico de WhoSampled: /sample/1425265/ → 1425265
       Clave para dedup entre ejecuciones del scraper */
    whosampled_id       INT UNIQUE,

    /* Tipo de relación — incluye interpolation (WhoSampled lo distingue) */
    tipo_relacion       VARCHAR(20) NOT NULL DEFAULT 'sample'
                        CHECK (tipo_relacion IN (
                            'sample', 'cover', 'remix', 'interpolation'
                        )),

    /* Subtipo del elemento sampleado (solo aplica a tipo=sample/interpolation)
       Valores extraídos del header: "Direct Sample of Hook / Riff"
       NOTA: 'soundtrack' NO va aquí (es género, no tipo de elemento) */
    tipo_elemento       VARCHAR(50) DEFAULT 'multiple_elements'
                        CHECK (tipo_elemento IN (
                            'hook_riff', 'vocals_lyrics', 'drums',
                            'bass', 'keys_synth', 'sound_effect',
                            'multiple_elements', 'other'
                        )),

    /* Timings en segundos — arrays JSON porque puede haber múltiples
       Ej: [4, 30, 120] → sample aparece en los segundos 4, 30 y 120
       WhoSampled: data-timings="4" (uno) o data-timings="4,30,120" (varios) */
    timings_destino     JSONB DEFAULT '[]',    -- segundos en canción destino
    timings_fuente      JSONB DEFAULT '[]',    -- segundos en canción fuente
    aparece_en_todo     BOOLEAN DEFAULT FALSE,  -- "(and throughout)"

    /* Referencia al sample extraído en Kamples (NULL si no se extrae) */
    sample_id           INT REFERENCES samples(id) ON DELETE SET NULL,

    /* Votación comunitaria (1-5) — rating parseado del overlay */
    votos_total         INT DEFAULT 0,
    votos_promedio      DECIMAL(2,1) DEFAULT 0,

    /* Origen de la información */
    fuente              VARCHAR(20) DEFAULT 'scraping'
                        CHECK (fuente IN ('scraping', 'comunidad', 'musicbrainz', 'import')),
    contribuidor_id     INT REFERENCES usuarios_ext(id),
    verificada          BOOLEAN DEFAULT FALSE,

    /* Dedup: misma relación destino+fuente+tipo = imposible dos veces */
    UNIQUE (cancion_destino_id, cancion_fuente_id, tipo_relacion),

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rel_destino ON relaciones_sample(cancion_destino_id);
CREATE INDEX idx_rel_fuente ON relaciones_sample(cancion_fuente_id);
CREATE INDEX idx_rel_tipo ON relaciones_sample(tipo_relacion);
CREATE INDEX idx_rel_sample ON relaciones_sample(sample_id);
CREATE INDEX idx_rel_verificada ON relaciones_sample(verificada);
CREATE INDEX idx_rel_ws ON relaciones_sample(whosampled_id);


/* ============================================================
   CONTROL DE SCRAPING
   Tracking de URLs procesadas para evitar duplicados y
   controlar el progreso del scraping.
   NOTA: url se guarda como ruta relativa normalizada (decode + lowercase)
   Ejemplo: '/sample/1425265/ol-dirty-bastard-brooklyn-zoo-eddie-harris-exodus/'
   ============================================================ */
CREATE TABLE scraping_log (
    id              SERIAL PRIMARY KEY,
    url             VARCHAR(1000) UNIQUE NOT NULL,
    tipo_pagina     VARCHAR(30) NOT NULL
                    CHECK (tipo_pagina IN (
                        'hot_samples', 'hot_covers', 'hot_remixes',
                        'sample_detail', 'cover_detail', 'remix_detail',
                        'artist', 'track', 'track_samples', 'track_sampled',
                        'browse_year', 'browse_genre'
                    )),
    estado          VARCHAR(20) DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'procesado', 'error', 'skip')),
    intentos        SMALLINT DEFAULT 0,
    bytes_descargados INT DEFAULT 0,
    error_mensaje   TEXT,
    procesado_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraping_estado ON scraping_log(estado);
CREATE INDEX idx_scraping_tipo ON scraping_log(tipo_pagina);


/* ============================================================
   EXTRACCIÓN DE SAMPLES — COLA DE PROCESAMIENTO
   Registra samples pendientes de extracción de audio.
   ============================================================ */
CREATE TABLE cola_extraccion_samples (
    id                  SERIAL PRIMARY KEY,
    relacion_id         INT NOT NULL REFERENCES relaciones_sample(id),
    youtube_id          VARCHAR(20) NOT NULL,
    timing_inicio_seg   SMALLINT NOT NULL,

    /* Resultado del análisis de BPM/compás */
    bpm_detectado       SMALLINT,
    duracion_compas_seg DECIMAL(5,2),
    compas_inicio_seg   DECIMAL(5,2),
    compas_fin_seg      DECIMAL(5,2),

    /* Estado del pipeline */
    estado              VARCHAR(20) DEFAULT 'pendiente'
                        CHECK (estado IN (
                            'pendiente', 'descargando', 'analizando',
                            'recortando', 'completado', 'error',
                            'revision_humana'
                        )),
    sample_id           INT REFERENCES samples(id),
    error_mensaje       TEXT,
    intentos            SMALLINT DEFAULT 0,
    procesado_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cola_estado ON cola_extraccion_samples(estado);
CREATE INDEX idx_cola_relacion ON cola_extraccion_samples(relacion_id);
```

### Integración con tabla `samples` existente

Los samples extraídos se insertan en la tabla `samples` existente como cualquier otro sample, con metadata extra en el campo JSONB:

```jsonc
// samples.metadata para un sample extraído de una canción
{
    "fuente": "extraccion_cancion",
    "relacion_id": 1425,
    "cancion_fuente_id": 892,
    "cancion_fuente": "Exodus",
    "artista_fuente": "Eddie Harris",
    "cancion_destino_id": 445,
    "cancion_destino": "Brooklyn Zoo",
    "artista_destino": "Ol' Dirty Bastard",
    "timing_fuente_seg": 30,
    "timing_destino_seg": 4,
    "tipo_elemento": "hook_riff",
    "bpm_detectado": 95,
    "compas_inicio_seg": 28.42,
    "compas_fin_seg": 53.47,
    "estado_recorte": "pendiente_revision",
    // Después de revisión humana:
    "estado_recorte": "verificado",
    "recorte_manual_inicio": 29.0,
    "recorte_manual_fin": 34.2,
    "revisado_por": 42,
    "revisado_at": "2026-04-15T10:30:00Z"
}
```

**Campos del sample extraído:**

- `creador_id` → cuenta sistema de Kamples (bot/sistema)
- `titulo` → "{Artista} - {Canción} [Sample: {tipo_elemento}]"
- `tags` → generados desde metadata: género, década, tipo elemento, artista
- `tipo` → 'oneshot' o 'loop' según análisis de BPM/repetición
- `estado` → 'en_supervision' (requiere revisión humana del recorte)
- `licencia_libre` → false (son fragmentos de canciones comerciales — fair use/educacional)
- `permitir_descarga` → true (fragmentos cortos con propósito referencial)

### Diagrama de relaciones

```
artistas_musicales ──1:N──> canciones
                    ──N:N──> canciones_productores

canciones ──1:N──> relaciones_sample (como destino)
          ──1:N──> relaciones_sample (como fuente)

relaciones_sample ──1:1──> samples (sample extraído, opcional)
                  ──1:1──> cola_extraccion_samples (pipeline)

samples.metadata.fuente = 'extraccion_cancion' → link a relaciones_sample
```

### Consistencia bidireccional — Cómo se evitan discrepancias

**Regla 1:** `relaciones_sample` es la ÚNICA fuente de verdad. No hay campos "lista de samples" en `canciones`.

```sql
-- "¿Qué samples usa Brooklyn Zoo?"
SELECT c_fuente.titulo, rs.timing_destino_seg, rs.timing_fuente_seg, rs.tipo_elemento
FROM relaciones_sample rs
JOIN canciones c_fuente ON rs.cancion_fuente_id = c_fuente.id
WHERE rs.cancion_destino_id = :brooklyn_zoo_id;

-- "¿Quién ha sampleado Exodus?"
SELECT c_dest.titulo, rs.timing_destino_seg, rs.timing_fuente_seg, rs.tipo_elemento
FROM relaciones_sample rs
JOIN canciones c_dest ON rs.cancion_destino_id = c_dest.id
WHERE rs.cancion_fuente_id = :exodus_id;
```

**Regla 2:** Los contadores `total_sampleada` y `total_samplea` en `canciones` son caches denormalizados que se actualizan via trigger o al insertar relación. Si hay duda, se recalculan con `COUNT(*)`.

**Regla 3:** `relaciones_sample.sample_id` y `cola_extraccion_samples.sample_id` apuntan al mismo sample en la tabla `samples`. Si se elimina el sample, se pone NULL (ON DELETE SET NULL).

---

## Pipeline de Extracción de Audio

### Flujo completo

```
1. DESCARGA DE AUDIO
   yt-dlp descarga audio de YouTube (bestaudio, opus/m4a)
   → Conversión a WAV temporal (ffmpeg)
   → NO pasa por proxy (YouTube directo)

2. ANÁLISIS DE BPM Y COMPÁS
   librosa o essentia detecta:
   → BPM global de la canción
   → Beat positions (array de timestamps de cada beat)
   → Duración de 1 compás = (60 / BPM) × 4  (asumiendo 4/4)

3. CÁLCULO DEL RECORTE INTELIGENTE
   Dado: timing_fuente = 30 seg (de WhoSampled)
   → Encontrar el beat más cercano al segundo 30
   → Retroceder 1 compás (margen de seguridad)
   → Avanzar 8 compases desde el inicio real del sample

   Ejemplo con BPM=95:
   - 1 compás = (60/95) × 4 = 2.526 seg
   - Beat más cercano a 30s = 29.68s
   - Inicio recorte = 29.68 - 2.526 = 27.15s (1 compás antes)
   - Fin recorte = 27.15 + (2.526 × 8) = 47.36s (8 compases)
   - Duración total = ~20 segundos

4. RECORTE Y PROCESAMIENTO
   → ffmpeg corta WAV en el rango calculado
   → Fade in/out de 50ms para evitar clicks
   → Normalización de volumen (opcional)
   → Se genera waveform y preview como cualquier sample Kamples

5. INSERCIÓN EN KAMPLES
   → Se crea entrada en tabla `samples` con metadata enriched
   → Se actualiza `relaciones_sample.sample_id`
   → Estado inicial: 'en_supervision' (pendiente revisión humana)
   → Se encola para análisis IA (tags, instrumentos, etc.)

6. REVISIÓN HUMANA (posterior)
   → Moderador o usuario trusted escucha el recorte
   → Ajusta inicio/fin si necesario
   → Confirma o rechaza el sample
   → Estado pasa a 'activo' o se recorta de nuevo
```

### Lógica de recorte por compás — pseudocódigo

```python
def calcular_recorte(timing_fuente_seg, bpm, beats):
    """
    timing_fuente_seg: segundo donde WhoSampled indica que empieza el sample
    bpm: BPM detectado de la canción fuente
    beats: array de timestamps de cada beat detectado por librosa
    """
    duracion_compas = (60.0 / bpm) * 4  # asumimos 4/4

    # Encontrar el beat más cercano al timing indicado
    beat_cercano = min(beats, key=lambda b: abs(b - timing_fuente_seg))

    # Buscar el inicio del compás que contiene ese beat
    # (el downbeat más cercano hacia atrás)
    idx_beat = beats.index(beat_cercano)
    idx_downbeat = idx_beat - (idx_beat % 4)  # primer beat del compás
    inicio_compas = beats[idx_downbeat]

    # Retroceder 1 compás completo (margen de seguridad)
    if idx_downbeat >= 4:
        inicio_recorte = beats[idx_downbeat - 4]
    else:
        inicio_recorte = max(0, inicio_compas - duracion_compas)

    # Avanzar 8 compases desde el inicio
    fin_recorte = inicio_recorte + (duracion_compas * 8)

    return {
        'inicio': inicio_recorte,
        'fin': fin_recorte,
        'duracion': fin_recorte - inicio_recorte,
        'bpm': bpm,
        'duracion_compas': duracion_compas,
        'beat_referencia': beat_cercano,
        'estado': 'pendiente_revision'
    }
```

### Casos especiales

| Caso                           | Solución                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| BPM no detectado con confianza | Recorte simple: timing - 5s a timing + 25s. Marcar para revisión |
| Canción no en 4/4 (3/4, 6/8)   | Librosa detecta time signature. Ajustar fórmula compás           |
| YouTube video no disponible    | Marcar en cola como 'error', skip, intentar más tarde            |
| Sample aparece "throughout"    | Recortar desde el primer timing indicado, 8 compases             |
| Duración resultante > 30s      | Limitar a 30s máximo (fair use)                                  |
| Duración resultante < 3s       | Extender a 2 compases extra                                      |

---

## Arquitectura del Scraper

### Stack tecnológico

| Componente     | Tecnología                                  | Justificación                                                                                                            |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Scraper        | **Python + Scrapy**                         | Framework industrial para scraping, middleware de proxy integrado, pipelines de datos, respeto a robots.txt configurable |
| Proxy          | **DataImpulse** (residencial)               | $1/GB, rotación automática, headers realistas                                                                            |
| Parser         | **BeautifulSoup4** (dentro de Scrapy)       | Parsing robusto del HTML de WhoSampled                                                                                   |
| Audio download | **yt-dlp**                                  | Descarga audio YouTube, no requiere proxy                                                                                |
| Audio análisis | **librosa** + **ffmpeg**                    | BPM detection, beat tracking, recorte                                                                                    |
| BD             | **PostgreSQL** (existente)                  | Misma instancia que Kamples                                                                                              |
| Dedup          | **scraping_log** tabla + UNIQUE constraints | Zero duplicados garantizado                                                                                              |

### Estructura del scraper

```
kamples-scraper/
├── scrapy.cfg
├── requirements.txt          # scrapy, beautifulsoup4, psycopg2, yt-dlp, librosa
├── kamples_scraper/
│   ├── settings.py           # config Scrapy + proxy DataImpulse
│   ├── middlewares.py         # rotación proxy, headers, rate limit
│   ├── items.py              # ArtistaItem, CancionItem, RelacionItem
│   ├── pipelines.py          # PostgresPipeline — inserta en BD con dedup
│   ├── spiders/
│   │   ├── hot_samples.py    # Spider diario: /hot-samples
│   │   ├── sample_detail.py  # Spider de detalle: /sample/{id}/...
│   │   ├── artist.py         # Spider de artista: /{Artista}/
│   │   └── track.py          # Spider de track: /{Artista}/{Track}/
│   └── utils/
│       ├── dedup.py           # Verificación contra scraping_log
│       ├── bandwidth.py       # Tracking de consumo de GB
│       └── parsers.py         # Funciones de parsing específicas de WhoSampled
├── extractor/
│   ├── pipeline.py            # Orquestador: descarga → análisis → recorte → insert
│   ├── audio_download.py      # Wrapper yt-dlp
│   ├── bpm_analyzer.py        # librosa BPM + beat tracking
│   ├── sample_cutter.py       # Lógica de recorte por compás
│   └── kamples_inserter.py    # Inserta sample en BD Kamples
└── scripts/
    ├── run_daily.sh           # Cron: hot-samples diario
    ├── run_extraction.sh      # Cron: procesar cola de extracción
    └── stats.py               # Estadísticas de progreso
```

### Configuración DataImpulse en Scrapy

```python
# settings.py — configuración optimizada para ahorro de ancho de banda
DOWNLOADER_MIDDLEWARES = {
    'kamples_scraper.middlewares.DataImpulseProxyMiddleware': 350,
    'kamples_scraper.middlewares.BandwidthTracker': 400,
}

# Rate limiting — ser respetuoso, no levantar alertas
DOWNLOAD_DELAY = 3              # 3 segundos entre requests
RANDOMIZE_DOWNLOAD_DELAY = True # randomizar ±50%
CONCURRENT_REQUESTS = 1         # 1 request a la vez
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0

# Ahorro de ancho de banda
DEFAULT_REQUEST_HEADERS = {
    'Accept': 'text/html',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
}
# No descargar assets
MEDIA_ALLOW_REDIRECTS = False

# Dedup
DUPEFILTER_CLASS = 'scrapy.dupefilters.RFPDupeFilter'

# Retry config
RETRY_TIMES = 2
RETRY_HTTP_CODES = [429, 500, 502, 503, 520]
```

### Dedup: nunca procesar la misma URL dos veces

```python
# Antes de cada request:
# 1. Scrapy built-in DupeFilter (por sesión)
# 2. Verificación contra scraping_log en BD (persistente entre ejecuciones)
# 3. UNIQUE constraint en scraping_log.url (último recurso)
# 4. UNIQUE constraint en relaciones_sample (cancion_destino, cancion_fuente, tipo)
```

### Spider hot_samples — ejemplo de flujo

```python
class HotSamplesSpider(scrapy.Spider):
    """
    Ejecutar diariamente.
    Scrapea /hot-samples (5 páginas) + /hot-covers (5 páginas) + /hot-remixes (5 páginas).
    Cada entry tiene link a detalle de relación (/sample/, /cover/, /remix/).
    """
    name = 'hot_samples'
    start_urls = [
        'https://www.whosampled.com/hot-samples/',
        'https://www.whosampled.com/hot-covers/',
        'https://www.whosampled.com/hot-remixes/',
    ]

    def parse(self, response):
        # Cada entry en hot-samples/covers/remixes:
        # <li class="listEntry sampleEntry chartsEntry">
        #   <a href="/sample/1425265/...">  (imagen)
        #   <span class="sampleLink"><a href="/sample/1425265/...">  (texto)
        for entry in response.css('li.listEntry'):
            link = entry.css('span.sampleLink a::attr(href)').get()
            if link:
                url_completa = response.urljoin(link)
                if not self.ya_procesada(url_completa):
                    yield scrapy.Request(url_completa, callback=self.parse_detail)

        # Paginación (máx 5 páginas por lista)
        next_page = response.css('.next a::attr(href)').get()
        if next_page:
            yield scrapy.Request(response.urljoin(next_page), callback=self.parse)

    def parse_detail(self, response):
        # Extraer toda la info del HTML (ver sección Parsing abajo)
        ...
```

### Parsing del HTML de WhoSampled — Selectores verificados contra HTML real

**Página de detalle** (`/sample/{id}/...`, `/cover/{id}/...`, `/remix/{id}/...`):

```python
# === CANCIÓN DESTINO (la que USA el sample) ===
# Contenedor: primer .sampleEntryBox (o #sampleWrap_dest)
dest_nombre    = response.css('#sampleWrap_dest .trackName span[itemprop="name"]::text').get()
dest_artista   = response.css('#sampleWrap_dest .sampleTrackArtists a::text').get()
dest_art_slug  = response.css('#sampleWrap_dest .sampleTrackArtists a::attr(href)').get()  # '/Ol%27-Dirty-Bastard/'
dest_album     = response.css('#sampleWrap_dest .release-name a::text').get()
dest_sello     = response.css('#sampleWrap_dest span[itemprop="recordLabel"]::text').get()
dest_anio      = response.css('#sampleWrap_dest span[itemprop="datePublished"]::text').get()
dest_duracion  = response.css('#sampleWrap_dest meta[itemprop="duration"]::attr(content)').get()  # "PT0H3M38S"
dest_imagen    = response.css('#sampleWrap_dest meta[itemprop="image"]::attr(content)').get()
dest_track_url = response.css('#sampleWrap_dest .trackName::attr(href)').get()  # '/Ol%27-Dirty-Bastard/Brooklyn-Zoo/'

# YouTube ID — en el embed del lado destino
dest_youtube   = response.css('.embed-dest .embed-placeholder::attr(data-id)').get()  # '81VrSMrS5F8'

# Timings — PUEDE haber múltiples (data-timing-index="0", "1", etc.)
# El <strong> tiene data-timings="4" (o "4,30,120" para múltiples)
dest_timings_raw = response.css('#sample-dest-timing::attr(data-timings)').get()  # "4"
dest_throughout  = '(and throughout)' in response.css('.sample-timings')[0].get()

# Productores — pueden ser múltiples spans itemprop="producer"
# CUIDADO: los productores están dentro del .sampleEntryBox correspondiente
dest_box = response.css('.sampleEntryBox')[0]
dest_productores = dest_box.css('span[itemprop="producer"] span[itemprop="name"]::text').getall()
dest_prod_slugs  = dest_box.css('span[itemprop="producer"] a::attr(href)').getall()

# === CANCIÓN FUENTE (de DONDE VIENE el sample) ===
fuente_nombre    = response.css('#sampleWrap_source .trackName span[itemprop="name"]::text').get()
fuente_artista   = response.css('#sampleWrap_source .sampleTrackArtists a::text').get()
fuente_art_slug  = response.css('#sampleWrap_source .sampleTrackArtists a::attr(href)').get()
fuente_album     = response.css('#sampleWrap_source .release-name a::text').get()
fuente_sello     = response.css('#sampleWrap_source span[itemprop="recordLabel"]::text').get()
fuente_anio      = response.css('#sampleWrap_source span[itemprop="datePublished"]::text').get()
fuente_duracion  = response.css('#sampleWrap_source meta[itemprop="duration"]::attr(content)').get()
fuente_imagen    = response.css('#sampleWrap_source meta[itemprop="image"]::attr(content)').get()
fuente_track_url = response.css('#sampleWrap_source .trackName::attr(href)').get()
fuente_youtube   = response.css('.embed-source .embed-placeholder::attr(data-id)').get()  # '-RX2WPN3oYI'
fuente_timings   = response.css('#sample-source-timing::attr(data-timings)').get()

fuente_box = response.css('.sampleEntryBox')[1]
fuente_productores = fuente_box.css('span[itemprop="producer"] span[itemprop="name"]::text').getall()
fuente_prod_slugs  = fuente_box.css('span[itemprop="producer"] a::attr(href)').getall()

# === TIPO DE RELACIÓN + TIPO DE ELEMENTO ===
# Header: "Direct Sample of Hook / Riff"
section_title = response.css('.section-header-title::text').get('')
# Parsear: "Direct Sample of Hook / Riff" → tipo='sample', elemento='hook_riff'
# "Interpolation of Vocals / Lyrics" → tipo='interpolation', elemento='vocals_lyrics'
# "Cover" → tipo='cover', elemento=null

# === WhoSampled ID — extraer del URL ===
# /sample/1425265/Ol%27-Dirty-Bastard-Brooklyn-Zoo-Eddie-Harris-Exodus/
ws_id = int(response.url.split('/')[4])  # 1425265

# === RATING — del overlay width ===
# <span class="ratingOverlay" style="width: 125px">
# 5 estrellas = 5 botones × 25px = 125px → rating = width / 25
overlay_width = response.css('.ratingOverlay::attr(style)').re_first(r'width:\s*(\d+)px')
votos_text = response.css('.ratingCount::text').get('')  # "50 Votes"

# === RELATED SONGS — parsear por texto del header, NO por índice ===
# IMPORTANTE: El número y orden de subsections varía por página.
# Puede haber 2-6 subsections con estos patrones de header:
#   "Other songs sampled in {dest}"        → más samples de la canción destino
#   "Songs that sampled {dest}"            → quién sampleó la canción destino
#   "{fuente} is a cover of"               → la fuente es cover de algo
#   "Covers of {dest}"                     → covers de la canción destino
#   "Remixes of {dest}"                    → remixes de la canción destino
for subsection in response.css('.subsection'):
    header_text = subsection.css('.section-header-title').get('')
    rows = subsection.css('tr')

    for row in rows:
        related_link = row.css('.tdata__td2 a::attr(href)').get()
        related_name = row.css('.tdata__td2 a::text').get()
        related_artist = row.css('.tdata__td3 a::text').get()
        related_year = row.css('.tdata__td3::text').getall()  # el año está en un td sin link
        related_badge = row.css('.tdata__badge::text').get()   # "Vocals / Lyrics", "Multiple Elements"

        # NOTA: related_badge aquí es tipo_elemento, NO género
        # Pero en covers/remixes el badge es género: "Hip-Hop / Rap / R&B", "Jazz / Blues"
```

**Página hot-samples** (`/hot-samples/`, `/hot-covers/`, `/hot-remixes/`):

```python
# Cada entry es un <li class="listEntry sampleEntry chartsEntry">
for entry in response.css('li.listEntry'):
    # Posición en el chart
    position = entry.css('.chartCount::text').get()              # "1", "2", etc.

    # Link al detalle (en el <a> de la imagen Y en sampleLink)
    detail_url = entry.css('span.sampleLink a::attr(href)').get()  # "/sample/1425265/..."

    # Textos (no siempre parseables sin ir al detalle)
    dest_track = entry.css('.destTrackName::text').get()         # "Ol' Dirty Bastard's Brooklyn Zoo"
    source_track = entry.css('.sourceTrackName::text').get()     # " Eddie Harris's Exodus"
    sample_type = entry.css('.sampleType::text').get()           # "sample of " / "cover of " / "remix of "
```

---

## Búsqueda: Textual + Audio Fingerprinting

### Búsqueda textual (Fase 1 — inmediata)

Buscar por nombre de canción, artista, álbum, año, género:

```sql
-- Búsqueda fulltext en canciones
SELECT c.*, a.nombre as artista
FROM canciones c
JOIN artistas_musicales a ON c.artista_id = a.id
WHERE to_tsvector('simple', c.titulo || ' ' || a.nombre || ' ' || COALESCE(c.album, ''))
   @@ plainto_tsquery('simple', :query)
ORDER BY (c.total_sampleada + c.total_samplea) DESC
LIMIT 20;
```

### Búsqueda por audio fingerprinting (Fase 2 — posterior)

**Concepto:** El usuario sube un fragmento de audio → el sistema identifica qué canción es y muestra sus relaciones de samples.

**Stack:** Chromaprint (AcoustID) o Dejavu para fingerprinting local.

```
1. Usuario sube fragmento de audio (5-30 seg)
2. Se genera fingerprint (Chromaprint → hash)
3. Se busca en BD de fingerprints de canciones indexadas
4. Si match → mostrar relaciones de esa canción
5. Si no match → buscar en AcoustID API (base pública)
6. Si match en AcoustID → buscar si tenemos esa canción en nuestras relaciones
```

**Integración con pgvector existente:**

- Los embeddings de audio ya existen en `samples.embedding` (128d)
- Para canciones: generar embedding del fragmento sampleado y guardarlo
- Búsqueda por similaridad coseno con pgvector HNSW
- Esto permite "buscar samples similares a este fragmento de canción"

---

## Sistema de Contribución Comunitaria (Prioridad secundaria)

> No dependemos de esto para el data inicial, pero es crítico para el crecimiento a largo plazo.

### Flujo de contribución

```
1. Usuario autenticado va a una canción → "Agregar sample"
2. Selecciona: canción fuente (autocompletado de BD) o crea nueva
3. Indica: tipo de relación (sample/cover/remix), tipo de elemento
4. Indica: timings aproximados (destino + fuente)
5. Submit → estado 'pendiente' → cola de moderación
6. Moderador verifica → marca 'verificada' → activa
7. Contribuidor gana "Cred" (reputación, como WhoSampled)
```

### Gamificación

| Acción                               | Cred |
| ------------------------------------ | ---- |
| Contribución aprobada                | +10  |
| Contribución rechazada               | -2   |
| Verificar timing preciso             | +5   |
| Revisar recorte de sample            | +3   |
| Primer contribuidor de artista nuevo | +20  |

---

## Fases de Implementación

### FASE S1 — Infraestructura de datos (BD + Schema)

- [x] **S1.1** Crear schemas PHP: `ArtistasMusicalesSchema`, `CancionesSchema`, `RelacionesSampleSchema`, `CancionesArtistasSchema`, `ScrapingLogSchema`, `ColaExtraccionSchema` ✅
- [x] **S1.2** Generar enums con Schema Generator existente ✅
- [x] **S1.3** Ejecutar migraciones (crear tablas + índices) ✅
- [x] **S1.4** Crear repositorios PHP: `ArtistasMusicalesRepository`, `CancionesRepository`, `RelacionesSampleRepository` + 3 más ✅
- [x] **S1.5** API endpoints REST: CancionesController 7+2 endpoints (listar, buscar, top, detalle cancion+artista, estadisticas, relacion-por-sample, cadena) ✅

### FASE S2 — Scraper core (Python + Scrapy)

- [x] **S2.1** Setup proyecto Python: `kamples-scraper/`, requirements, scrapy.cfg ✅
- [x] **S2.2** Configurar middleware DataImpulse (proxy residencial, rotación, headers) ✅
- [x] **S2.3** Spider `hot_samples`: parsear /hot-samples, seguir links a detalles ✅
- [x] **S2.4** Spider `sample_detail`: extraer canción destino, fuente, timings, tipo, productores, related ✅
- [x] **S2.5** Pipeline PostgreSQL: insertar artistas, canciones, relaciones con dedup completo ✅
- [x] **S2.6** Tracking de bandwidth: log de bytes consumidos, alertas al 80% del presupuesto ✅
- [x] **S2.7** Script `run_daily.sh` para cron diario de hot-samples ✅
- [x] **S2.8** Tests locales con HTML guardado (sin gastar proxy) ✅

### FASE S3 — Pipeline de extracción de audio

- [x] **S3.1** Módulo `audio_download.py`: wrapper yt-dlp, descarga audio → WAV temporal ✅
- [x] **S3.2** Módulo `bpm_analyzer.py`: librosa beat tracking + BPM + time signature ✅
- [x] **S3.3** Módulo `sample_cutter.py`: lógica de recorte por compás (1 antes + 8 compases) ✅
- [x] **S3.4** Módulo `kamples_inserter.py`: crear sample en BD Kamples con metadata enriched ✅
- [x] **S3.5** Orquestador `pipeline.py`: procesar cola_extraccion_samples ✅
- [x] **S3.6** waveform_generator.py (librosa → 120 peaks → JSON compatible PHP) ✅
- [x] **S3.7** Cron batch: scripts sh (lock file) + cron_runner.py cross-platform ✅

### FASE S4 — UI en Kamples (React Islands)

- [x] **S4.1** Página `/cancion/{slug}`: CancionDetalleIsland + useCancionDetalle (portada, artistas, YouTube embed, relaciones sampling) ✅
- [x] **S4.2** Componente `TarjetaRelacionSample`: tarjeta reutilizable relación origen/destino con badges tipo/elemento ✅
- [x] **S4.3** Página `/explorar/canciones`: ExplorarCancionesIsland + useExplorarCanciones (tabs recientes/top/buscar, grid, estadísticas) ✅
- [x] **S4.4** Integración en `SampleDetalleIsland`: SeccionSampleDiscovery + useRelacionDiscovery (enlace canción fuente/destino) ✅
- [x] **S4.5** Widget `CadenaSamples`: visualización cadena A→B→C (endpoint recursivo, integrado en CancionDetalle) ✅
- [x] **S4.6** Búsqueda textual: TopBar enlace "Buscar canciones", URL param q preload, placeholder dinámico ✅

### FASE S5 — Expansión del scraper

- [x] **S5.1** Spider `artist`: scrapear top artistas por género (más sampleados) ✅
- [x] **S5.2** Spider `track_samples`: "all samples in {track}" (paginado) ✅
- [x] **S5.3** Spider `track_sampled`: "all songs that sampled {track}" (paginado) ✅
- [x] **S5.4** Spider `browse_year`: browse por década/año para cobertura amplia ✅
- [x] **S5.5** Covers y remixes: parsear secciones adicionales del HTML de detalle ✅
- [x] **S5.6** Productores: tabla N:N con artistas_musicales ✅

### FASE S6 — Búsqueda por audio y contribución

- [ ] **S6.1** Chromaprint fingerprinting: generar fingerprints de canciones indexadas
- [ ] **S6.2** Endpoint de búsqueda por audio: upload fragmento → match → relaciones
- [ ] **S6.3** Embeddings de fragmentos de sample (pgvector) para similaridad
- [ ] **S6.4** UI de contribución: formulario "agregar sample" en página de canción
- [ ] **S6.5** Cola de moderación de contribuciones
- [ ] **S6.6** Sistema de "Cred" (reputación contribuidores)

### FASE S7 — Revisión humana y calidad

- [ ] **S7.1** Panel de revisión: escuchar sample extraído, ajustar recorte
- [ ] **S7.2** Herramienta de recorte interactivo (waveform + drag handles)
- [ ] **S7.3** Bulk review: cola de samples pendientes con approve/reject rápido
- [ ] **S7.4** Métricas de calidad: % de recortes aprobados sin editar, BPM accuracy

---

## Cronograma sugerido

| Período     | Fase  | Entregable                                                       |
| ----------- | ----- | ---------------------------------------------------------------- |
| Semana 1-2  | S1    | BD lista, repos PHP, endpoints básicos                           |
| Semana 3-4  | S2    | Scraper funcionando en local, primeros 500 registros             |
| Semana 5-6  | S3    | Pipeline de extracción de audio, primeros 100 samples recortados |
| Semana 7-10 | S4    | UI de canciones y relaciones visible en Kamples                  |
| Mes 3-6     | S5    | Expansión scraper, 15,000+ relaciones                            |
| Mes 6-12    | S6-S7 | Audio search, contribución, revisión humana                      |

---

## Riesgos y Mitigaciones

| Riesgo                            | Impacto                     | Mitigación                                                                         |
| --------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| WhoSampled cambia HTML/estructura | Scraper se rompe            | Parsers modulares, tests con HTML guardado, alertas en errores                     |
| Rate limiting / ban IP            | Scraping se detiene         | Rate limit conservador (3s delay), proxy residencial rotativo, user-agent realista |
| YouTube video no disponible       | No se puede extraer audio   | Marcar como pendiente, reintentar periódicamente, fuentes alternativas             |
| BPM detectado incorrecto          | Recorte desalineado         | Flag para revisión humana, múltiples algoritmos (librosa + essentia)               |
| WhoSampled cierra completamente   | Fuente de datos muere       | Velocidad: priorizar data más valiosa primero + contribución propia                |
| Cambio de TOS DataImpulse         | Sin proxy                   | Alternativas: ScraperAPI, BrightData, proxy propio en VPS                          |
| Recortes de baja calidad          | Mala experiencia de usuario | Todo sample inicia en `en_supervision`, requiere aprobación                        |

---

## Lecciones y Gotchas (se actualizará durante implementación)

- [WhoSampled HTML]: Estructura analizada del HTML de detalle y hot-samples — selectores documentados en sección "Parsing"
- [Timing format]: WhoSampled usa formato "M:SS", pero el `data-timings` del `<strong>` es el valor en SEGUNDOS ENTEROS (ej: `data-timings="4"` = 4 segundos). Convertir el texto visible "0:04" para display, pero usar `data-timings` como fuente de verdad
- [Timings múltiples]: `data-timing-index="0"` sugiere que puede haber múltiples timings por relación. Almacenar como JSONB array `[4, 30, 120]`
- [Duración ISO]: `<meta content="PT0H6M36S" itemprop="duration">` → parsear con regex `PT(\d+)H(\d+)M(\d+)S`
- [Related sections]: Las secciones "Related Songs" varían en cantidad (2-6 subsections). NUNCA parsear por índice (`[0]`, `[1]`). Siempre parsear por texto del `<h3>` header. Patrones: "Other songs sampled in", "Songs that sampled", "is a cover of", "Covers of", "Remixes of"
- [YouTube IDs]: Están en `data-id` de `.embed-placeholder`, separados por clase: `.embed-dest` (canción destino) y `.embed-source` (canción fuente)
- [WhoSampled ID]: La URL `/sample/1425265/...` contiene el ID numérico único. Extraer con `url.split('/')[4]`. Crucial para dedup entre ejecuciones
- [Hot-samples selectores]: NO hay `.trackName` sueltos en hot-samples. Los links están en `li.listEntry > span.sampleLink > a[href]`. La clase `.destTrackName` y `.sourceTrackName` dan el texto
- [Hot-covers/remixes]: `/hot-covers/` y `/hot-remixes/` existen con la misma estructura que `/hot-samples/`. Las 3 listas se deben scrapear diariamente
- [Paginación hot]: Máximo 5 páginas por lista. 20 entries por página = 100 per tipo = 300 entries/día máx
- [feat. artistas]: "Jay-Z feat. The Notorious B.I.G." — el HTML muestra múltiples `<a>` dentro de `.sampleTrackArtists`. Primer `<a>` = artista principal, siguientes = featuring
- [Productores scope]: Los productores están dentro de cada `.sampleEntryBox` (dest o source), no accesibles con selectores globales. Hay que seleccionar el box primero
- [Badge vs tipo_elemento]: En related songs, `.tdata__badge` contiene cosas distintas: para samples es tipo_elemento ("Vocals / Lyrics", "Multiple Elements"), pero para covers/remixes es género ("Hip-Hop / Rap / R&B", "Jazz / Blues")
- [Rating overlay]: `style="width: 125px"` / (5 estrellas × 25px) = rating 5.0. Fórmula: `rating = width_px / 25`
- [Interpolation]: WhoSampled distingue "Direct Sample" de "Interpolation". Son tipo_relacion distintos
- [URL normalization]: Decodificar `%27` → `'`, lowercase, strip trailing slash antes de guardar en scraping_log. Sin esto hay duplicados
- [Compás vs beat]: 1 compás = 4 beats en 4/4. La detección de time signature es crucial para recortes precisos
- [Proxy budget]: Con gzip, ~20KB/página. $5 = ~250K páginas = suficiente para >80K relaciones
- [Audio no proxy]: Las descargas de YouTube van directo, no consumen presupuesto de proxy
- [canciones_productores eliminada]: Reemplazada por `canciones_artistas` con `rol='producer'`. Tabla unificada para principal + featuring + producer

### Lecciones S4 — UI React Islands (C604)

- [Navigation store]: Import correcto es `import { useNavigationStore } from '@/core/router'` — NO `@app/stores/navigationStore`
- [UI components]: Lint exige `<BotonBase>` sobre `<button>` y `<CampoTexto>` sobre `<input>`. Imports desde `@app/components/ui/`
- [Badge variantes]: Solo válidas: neutro|acento|exito|error|advertencia|info|premium. NO existe "ghost"
- [BotonBase ghost+ninguno]: Para botones con estilo custom (navegación, links), usar `variante="ghost" tamano="ninguno"` para evitar padding/height forzado. `className` se concatena
- [CampoTexto wrapper]: CampoTexto envuelve el input en `<div className="contenedorCampoTexto {className}">`. Para CSS, apuntar al input con `.miClaseWrapper input` en vez de clase directa en el input. `variante="desnudo"` quita clases del input
- [useCancionDetalle irACancion]: La función `irACancion` del hook no se necesita en el island porque TarjetaRelacionSample maneja su propia navegación internamente
- [RelacionSample integración]: La relación Sample → Canción pasa por `relaciones_sample.sample_id` FK. Se necesita un hook separado (useRelacionDiscovery) porque el sample no tiene cancionId directo
- [Cadena traversal PHP]: Implementar como método recursivo en el repositorio con depth limit (10) y set de visitados para evitar ciclos
- [Rutas dinámicas]: Para slugs como `/cancion/{slug}` usar `PageManager::registrarRutaDinamica('cancion/{slug}', 'CancionDetalleIsland')` además de `reactPage()`
- [TopBar placeholder]: Agregar `islaActual` al return de useTopBar para dinamizar el placeholder del buscador según la isla activa

### Lecciones S5 — Normalización API (10/03/2026)

- [snake_case vs camelCase]: CancionesController devolvía filas BD crudas (snake_case). Frontend espera camelCase. Fix: `NormalizadorCancion` helper extraído a `App/Kamples/Api/Helpers/NormalizadorCancion.php` (patrón `NormalizadorSample`). Usar en todo endpoint que retorne canciones/artistas/relaciones.
- [estadísticasPorTipo alias]: SQL usa `AS tipo` pero frontend esperaba `tipoRelacion`. Fix en `NormalizadorCancion::estadisticaTipo()`.
- [tagsAgregados if abierto]: `SamplesController::tagsAgregados` tenía `if (!empty($genero)) {` sin cerrar — faltaba `$params['genero'] = $genero;` y `}`. Causaba PHP Parse error sintaxis inesperada en catch.
- [json_decode timings]: No usar `?? []` como fallback directo. Verificar `json_last_error()` primero. Ver `NormalizadorCancion::decodeTimings()` como patrón correcto.

### Lecciones Sesión 6 — SPA routing y dev tools (10/03/2026)

- [SPA props + rutas dinámicas]: Bug en `initializeSPA` (hydration.tsx): al buscar `/cancion/slug/` en el routes map, fallaba el merge de props del servidor porque el mapa solo tiene `/cancion/` (rutas callable no se serializan). Fix: pasar `propsEvaluados` como 3er argumento a `inicializar()` en navigationStore, que usa `buscarRutaEnMapa` (soporta prefijo) y los mergea. Afecta a cualquier ruta dinámica `/padre/slug`.
- [DevController WP_DEBUG guard]: El controller NO se registra en producción. Usar `if (!defined('WP_DEBUG') || !WP_DEBUG) return;` al inicio de `registrarRutas`. Nunca comentarlo ni sacarlo.
- [proc_open array vs string]: Para llamar binarios externos sin inyección, usar `proc_open(array $cmdArray, ...)` en lugar de string con operadores shell. El OS pasa los args directamente al proceso sin shell intermediario. Mantenemos el proceso vivo sin llamar `proc_close()` para background real.
- [CancionesRepository::purgarModulo]: TRUNCATE con CASCADE pertenece al repositorio, no al controller (SOLID). El cascade resuelve FKs; listar tablas de dependencias es documentación, no necesidad técnica.
- [BotonBase props]: `variante` acepta 'primario'|'secundario'|'ghost'|'peligro'. NO existe 'destructivo'. La prop se llama `tamano` (sin tilde en n), no `tamanio`. No existe prop `icono` — poner íconos dentro de `children`.
- [imagen_url siempre null]: WhoSampled devuelve URLs relativas en `meta[itemprop='image']` (`/static/images/...`). El scraper las descartaba por no empezar con `http`. Fix: prefijar `https://www.whosampled.com` si empieza con `/`.
- [ON CONFLICT DO UPDATE imagen]: El upsert de canciones solo actualizaba `titulo`. Registros existentes con `imagen_url=NULL` nunca se actualizaban al re-scrapear. Fix: agregar `imagen_url = COALESCE(EXCLUDED.imagen_url, canciones.imagen_url)` para que re-scraping rellene huecos sin pisar datos válidos.
- [buscarRecientes sin artista]: `CancionesRepository::buscarRecientes` usaba `CancionesCols::TODAS` sin JOIN. La respuesta lista siempre tenía `artistaNombre/artistaSlug = null`. Fix: LEFT JOIN artistas_musicales como hacen `masSampleadas` y `buscarTexto`.
- [SQL alias cross-file bug]: Si un Repository devuelve alias `artista_nombre` pero NormalizadorCancion lee `nombre`, los datos llegan null silenciosamente — sin error. Sentinel no detecta esto (requiere análisis de flujo inter-archivo). Auditar aliases manualmente al crear nuevos repos.
- [imágenes: URLs externas son frágiles]: Nunca almacenar URLs CDN externas como dato final. WhoSampled sirve `/static/images/...` (rutas relativas). Arquitectura correcta: `ImageDescargaPipeline` (prioridad 200) descarga a `wp-content/uploads/kamples/portadas/` y reemplaza la URL en el item ANTES de `PostgresPipeline`. Dedup por SHA256 de URL externa. Config vía `IMAGES_STORE_PATH` + `IMAGES_BASE_URL` en .env.
