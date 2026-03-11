# Plan Unificado: Sample Discovery + Legal + Contribuciones — Kamples

> **Version:** 4.0 | **Fecha:** 11/03/2026 | **Estado:** S1-S5, L1-L7, S-ARTISTA, S-RECORTE, S-ESCALA, S-UI completados. Pendientes: S6-S7, panel procesos, rediseno /musica/.
> **Archivos anteriores:** Este documento consolida `plan-legal-contribuciones.md` (v3.0) y `plan-samples-metadata.md` (v3.0). Los originales se mantienen como referencia historica.

---

## Resumen de Completados (compacto)

| Fase | Entregable | Commits/Agente |
|------|-----------|----------------|
| **S1** | BD: 6 tablas, 14 indices, 6 repos PHP, CancionesController 9 endpoints | AG-SMD |
| **S2** | Scraper core: HotSamples, SampleDetail, DataImpulse, PostgresPipeline, bandwidth tracker | AG-SMD |
| **S3** | Pipeline extraccion: yt-dlp -> librosa BPM -> recorte por compas -> waveform -> insercion BD | AG-SMD |
| **S4** | UI: CancionDetalle, ExplorarCanciones, TablaRelaciones, TarjetaRelacionSample, CadenaSamples | AG-SMD |
| **S5** | Expansion scraper: ArtistSpider, TrackSpider, BrowseYearSpider, metadata pipeline | AG-SMD |
| **S5.5** | Spotify ID: migracion v030, scraper, pipeline, API, embed frontend | AG-NAV C706 |
| **S-ARTISTA** | Pagina /artista/{slug}: endpoint ampliado, useArtistaDetalle, ArtistaDetalleIsland | AG-REC C708 |
| **S-RECORTE** | Recorte bilateral: migracion v031, cola bilateral, spotdl fallback, kamples_inserter, DevController | AG-REC C709 |
| **S-ESCALA** | Trigger PG counters, DO UPDATE relaciones, indices compuestos, re-scraping strategy | AG-NAV C704 |
| **S-UI/S-UI2** | Panel lateral discovery, origin marker, imagen heredada, URLs SEO, TarjetaCancionMini | AG-SDI/AG-UI C712 |
| **S-FIX** | Pipeline publicacion: creadorId, FK delete, WP Cron -> REST directo | AG-FIX C711 |
| **L1** | Seed users: SeedUsuarios + SeedConfig + DevController, distribucion Pareto | AG-SEC C802 |
| **L2** | Reportes legales: ReporteLegalController, BotonReporteLegal, ModalReporteLegal | AG-SEC C802 |
| **L3** | Contribuciones: ContribucionesController, ModalContribucion, BuscadorCanciones | AG-SEC C802 |
| **L5** | Descripciones fix, contribucion manual, BuscadorCanciones centralizado, UI contribuidor en tarjetas | AG-SEC C802 |
| **L6** | CRUD completo: PUT/DELETE propias, ediciones comunitarias, ModalEdicionRelacion, eliminacion samples, admin CRUD | AG-L6C |
| **L7** | Adjuncion manual: selector lado modal, timing upload, vincular/desvincular sample, edicion media, verificar admin | AG-ADJ |

---

## Contexto Clave (referencia rapida)

### Modelo de Datos
- **relaciones_sample** es la UNICA fuente de verdad para relaciones entre canciones
- Queries bidireccionales: WHERE cancion_fuente_id = X o WHERE cancion_destino_id = X
- Contadores cache via trigger PG: total_sampleada/total_samplea en canciones
- Dedup 4 capas: DupeFilter + scraping_log + UNIQUE constraints + upsert ON CONFLICT
- `sample_fuente_id`/`sample_destino_id` en relaciones vinculan samples extraidos a cada lado

### Legal / Safe Harbor
- Contenido atribuible a usuarios (seed + reales) via `contribuidor_id`
- Mecanismo takedown funcional: BotonReporteLegal desactiva sample inmediatamente
- Pagina /politica-dmca pendiente (L4)
- Repo debe hacerse privado antes de produccion

### Stack Scraper (Python)
- `kamples-scraper/`: spiders (hot_samples, sample_detail, artist, track, browse_year), PostgresPipeline, DataImpulse proxy
- `extractor/`: pipeline.py, audio_download.py (yt-dlp + spotdl), bpm_analyzer.py, sample_cutter.py, kamples_inserter.py
- Config: DOWNLOAD_DELAY=3, CONCURRENT_REQUESTS=1, ~20KB/pagina

### Lecciones Clave
- [Admin check React]: `useAuthStore(s => s.usuario?.rol === 'admin')` — selector especifico
- [apiCliente]: Existe `apiPut` pero NO `apiPatch`
- [BotonBase]: Siempre usar BotonBase variante="ghost" tamano="ninguno" para botones de icono
- [Dotenv PHP]: `$_ENV['KEY'] ?? getenv('KEY') ?? ''` — Dotenv::createImmutable() solo popula $_ENV
- [bilateral queries]: fuente_titulo/destino_titulo NO son compatibles directas con NormalizadorCancion. Transformar antes de normalizar
- [INTERVAL SQL]: Whitelist en repositorio para valores de intervalo, nunca interpolar
- [yt-dlp cookies]: App-Bound Encryption Chrome v114+. Usar cookies.txt exportado via extension
- [Tracking Scoping]: Sync DEBE estar scoped por userId

---

## PENDIENTES ACTIVOS

### L4 — Pagina /politica-dmca
- [ ] Pagina estatica en pages.php como `/legal/dmca`
- [ ] Contenido: politica copyright, procedimiento takedown, agente DMCA, contra-notificacion, reincidentes
- [ ] Enlace visible en footer
- **Prioridad:** Media (previo a produccion)

### L6.4c — Panel Admin Moderar Contribuciones (= C802a / L3.4 / tarea 807)
- [ ] Componente isla admin con tabla de contribuciones pendientes
- [ ] Acciones: aprobar, rechazar (con nota), editar directamente
- [ ] Integrar en tab existente de `/admin/panel/` moderacion
- **Prioridad:** Alta

### S-R6 — Navegacion Cruzada sample -> cancion -> sampleo
- [ ] En pagina de sample: "Extraido de: Artista - Cancion" con link funcional
- [ ] En pagina de cancion: "Samples extraidos de esta cancion" (query cancion_origen_id)
- [ ] En inicio (feed): badge "De WhoSampled" en samples auto-generados
- **Prioridad:** Media

### S-R8 — Descripcion auto-generada desde metadata
- [ ] Generar descripcion rica desde metadata relacion en kamples_inserter.py
- [ ] Parcialmente resuelto: IA ya sobrescribe con descripcion_corta_es post-publicacion
- **Prioridad:** Baja

### S6 — Audio Search + Contribucion Comunitaria (FUTURO)
- [ ] **S6.1** Chromaprint fingerprinting
- [ ] **S6.2** Endpoint busqueda por audio
- [ ] **S6.3** Embeddings pgvector para similaridad
- [ ] **S6.4-S6.6** UI contribucion avanzada, moderacion, sistema Cred
- **Prioridad:** Baja (requiere volumen de datos)

### S7 — Revision Humana y Calidad (FUTURO)
- [ ] **S7.1** Panel revision: escuchar sample, ajustar recorte
- [ ] **S7.2** Herramienta recorte interactivo (waveform + drag handles)
- [ ] **S7.3** Bulk review: cola pendientes con approve/reject rapido
- [ ] **S7.4** Metricas calidad: % aprobados sin editar, BPM accuracy
- **Prioridad:** Baja

---

## SPRINT ACTUAL — Tareas 806-813

### 806 — Modal publicacion ajustes (LO AJUSTA EL USUARIO)
- Selector de time y elemento se ve mal en modal publicacion cuando es adjuncion a cancion
- **Responsable:** Usuario

### 806.1 — ✅ Deteccion de duplicados al adjuntar/relacionar
- [x] Backend ya verifica duplicados (409 en relaciones_sample y contribuciones_pendientes)
- [x] Timings obligatorios en ModalContribucion: dos campos (timing fuente + timing destino), vacios por defecto, obligatorios para enviar
- [x] Backend acepta timing_fuente/timing_destino, almacena en cambios_propuestos JSONB
- [x] ContribucionesService::aprobar() extrae timings y los inserta en la relacion creada
- [x] useContribucion refactorizado: de 9 useState a 2 (form + estado)

### 807 — Panel admin moderacion contribuciones (= L6.4c)
- [ ] Isla admin: `AdminContribucionesIsland.tsx` en `/admin/panel/` tab moderacion
- [ ] Hook dedicado `useAdminContribuciones.ts` con paginacion y filtros por estado
- [ ] Tabla con columnas: ID, contribuidor, destino, fuente, tipo, estado, fecha
- [ ] Acciones por fila: aprobar (trigger moderar endpoint), rechazar con nota (CampoTexto modal)
- [ ] Expandir fila para ver detalles completos: timings, elemento, cancion nueva si aplica
- [ ] Endpoints ya existen: GET /admin/contribuciones + POST /admin/contribuciones/moderar
- **Complejidad:** Media. Backend listo, solo frontend.
- **Archivos nuevos:** AdminContribucionesIsland.tsx, useAdminContribuciones.ts, adminContribuciones.css
- **Dependencias:** Ninguna

### 808 — Panel de procesos de fondo (CRITICO — MAS IMPORTANTE)
> Pagina especial en admin para gestionar: scraping, extraccion audio, distribucion seed.

- [ ] **Backend: ProcesosFondoController.php**
  - POST `/admin/procesos/{nombre}/start` — Inicia proceso via REST al scraper/extractor Python
  - POST `/admin/procesos/{nombre}/stop` — Detiene proceso (signal PID o flag)
  - GET `/admin/procesos/{nombre}/status` — Estado actual: running/stopped/error, progreso, log reciente
  - Lock anti-doble-ejecucion: flag en BD (`procesos_fondo` tabla) con PID + timestamp
  - Limpieza: cron WP cada 5 min verifica si PID sigue vivo, limpia flags huerfanos
- [ ] **Backend: tabla `procesos_fondo`**
  - Columnas: id, nombre (unique), pid, estado (running/stopped/error), progreso_actual, progreso_total, ultimo_log, iniciado_at, terminado_at
  - Migracion necesaria
- [ ] **Backend: endpoints REST Python (scraper side)**
  - Cada proceso expone /status que retorna {running, processed, errors, queue_size}
  - El PHP controller hace proxy a estos endpoints
  - Alternativa: los procesos Python escriben status en BD directamente
- [ ] **Frontend: ProcesosAdminIsland.tsx**
  - Cards por proceso: Scraping, Extraccion, Distribucion Seed
  - Cada card: badge estado (running/stopped), barra progreso, boton start/stop
  - Polling cada 5s via useInterval cuando hay proceso running
  - Tail de log reciente (ultimas 20 lineas) con auto-scroll
  - Errores en rojo inline, sin acumular visualmente
- [ ] **Proceso 1 — Scraping:** ~2000 canciones/sampleos al dia
- [ ] **Proceso 2 — Extraccion audio:** ~2000/dia, yt-dlp + spotdl + recorte
- [ ] **Proceso 3 — Distribucion seed (tarea 809):** redistribuir entre usuarios ficticios
- [ ] Eliminar PanelDevCanciones actual (migrar funcionalidad a este panel)
- **Complejidad:** Alta. Requiere coordinacion PHP<>Python, tabla nueva, UI compleja.
- **Archivos nuevos:** ProcesosFondoController.php, ProcesosAdminIsland.tsx, useProcesosAdmin.ts, procesos.css, migracion BD
- **Dependencias:** Migracion BD

### 809 — Distribucion seed users de fondo
- [ ] Tercer proceso integrado en panel 808
- [ ] Logica: query relaciones con contribuidor_id = admin_id, redistribuir a seed users segun Pareto
- [ ] Batch: procesar N registros por ejecucion, trackear progreso
- [ ] Reutilizar SeedUsuarios service existente: solo falta automatizacion y batch endpoint
- **Complejidad:** Baja-Media (SeedUsuarios ya existe, es wiring).
- **Archivos modificados:** SeedUsuarios.php (agregar metodo batch), ProcesosFondoController (nuevo proceso)

### 810 — ✅ Quitar "Vincular sample existente" de TablaRelaciones
- [x] Eliminado item vincular-sample del menu 3 puntos en TablaRelaciones
- [x] Eliminado onVincularSample de CancionDetalleIsland, useMenuCancionDetalle
- [x] La funcionalidad ya existe dentro de sampleos (RelacionDetalleIsland)

### 811 — ✅ DevAcciones dentro de menu contextual (admin-only)
- [x] Movido "Generar recorte" al MenuContextual via useMenuRelacionDetalle
- [x] Solo visible para admin (opciones.esAdmin)
- [x] Eliminado div relacionDetalleDevAcciones de RelacionDetalleIsland

### 812 — Rediseno pagina /musica/ (REQUIERE PLANIFICACION DETALLADA)
> Convertir ExplorarCancionesIsland en una pagina tipo feed con ordenamiento inteligente.

- [ ] **Layout:** Sin tabs internas (tabs van en nav como el resto de paginas)
- [ ] **FeedTags bar:** botones tipo feedTags: "Inteligente", "Mas sampleados", "Hot" (mas likeados semana)
- [ ] **Card cancion:** Formato similar a listaDeSamples
  - Titulo arriba, artista + anio abajo
  - Numero de sampleos donde iria la wave
  - Boton like, menu 3 puntos
- [ ] **Algoritmo "Inteligente":** Usar algoritmo existente adaptado a metadata de canciones
  - Variedad: no repetir artista consecutivo
  - Mezclar: canciones con muchos sampleos + descubrimientos (pocos sampleos pero recientes)
  - Sencillo: no requiere ML, heuristicas basadas en totalSampleada + anio + genero
- [ ] **Backend: endpoint /canciones/feed**
  - Acepta `orden`: inteligente | top_sampleados | hot
  - `inteligente`: query random ponderado por totalSampleada + freshness + diversidad genero
  - `top_sampleados`: ORDER BY total_sampleada DESC
  - `hot`: JOIN con likes recientes (7 dias), ORDER BY count DESC
  - Paginacion cursor-based para scroll infinito
- [ ] **Frontend:**
  - Eliminar PanelDevCanciones, tabs internas, input busqueda
  - Nuevo componente TarjetaCancionFeed (no es Grid, es lista vertical como samples)
  - Scroll infinito con max visible para rendimiento
  - Busqueda: funciona desde nav global (filtra por nombre + tags)
- **Complejidad:** Alta. Requiere nuevo endpoint, componente de tarjeta, algoritmo.
- **Archivos nuevos:** TarjetaCancionFeed.tsx, useFeedCanciones.ts, feedCanciones.css
- **Archivos modificados:** ExplorarCancionesIsland.tsx (reescritura), useExplorarCanciones.ts (reescritura), CancionesController.php (nuevo endpoint)

### 813 — ✅ Mostrar contribuidor en sampleos
- [x] RelacionDetalleIsland: badge "Contribuido por {username}" en la cabecera
- [x] Backend: LEFT JOIN usuarios_ext en porRelacionId(), NormalizadorCancion::relacionCompleta() retorna contribuidorId + contribuidorUsername
- [x] Tipo RelacionDetalleCompleta actualizado con contribuidorId/contribuidorUsername

---

## Lecciones Acumuladas (ambos planes)

- [Schema Generator] jsonb/bigint deben estar en mapa de tipos. ?mixed fatal en PHP 8.
- [FK Cascades] sample_id ON DELETE SET NULL en relaciones. Cola necesita cleanup manual (desvincularSampleId).
- [Contribuciones] Wikipedia-like: tipo_contribucion = nueva/edicion/eliminacion. Tabla separada hasta aprobacion.
- [Seed] Independiente del pipeline. Batch corre despues y redistribuye. Pareto para organicidad.
- [Manual = Automatico] Todo lo que el pipeline genera debe poder hacerse manualmente via UI.
- [bilateral queries] Transformar fuente_titulo/destino_titulo antes de normalizar.
- [WhoSampled HTML] Selectores en codigo. data-timings = segundos enteros. Related sections: NUNCA parsear por indice.
