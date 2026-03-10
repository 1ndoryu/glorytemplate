# Plan: Adquisicion de Samples y Metadata Musical -- Kamples

> **Version:** 2.0 | **Fecha:** 10/03/2026 | **Estado:** S1-S5 implementados, S6-S7 pendientes
> **Modulo:** Sample Discovery & Metadata Engine
> **Dependencias:** PostgreSQL, pgvector, yt-dlp, librosa/essentia, Scrapy, DataImpulse proxy

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
