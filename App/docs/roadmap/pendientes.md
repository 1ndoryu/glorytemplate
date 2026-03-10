# Kamples — Pendientes por Fase

> Tareas pendientes. Fases 0-7 completas (ver `completado.md`). Docs específicos en `App/docs/`.

---

## TO-DOs de fases anteriores

- [ ] **5.3** WebSocket local (canales chat/notif, typing, online, read receipts)
- [ ] **5.4** Optimización chat (virtualización, lazy load, caché local)
- htaccess deny direct access, servir via PHP con validación permisos
- Pipeline → wp_schedule_single_event() cuando volumen crezca
- WebP conversion, lazy loading, srcset para colors/
- Google OAuth cuando keys estén listas (1.4)
- Click tag → filtrar por categoría BPM (2.5)
- Edición nombre sample antes de publicar (2.6)
- Lookup dual slug/id_corto (2.7)
- Filtros toggle → backend (4.3)
- Metadata IA (instrumentos, sentimiento, artistas) en SampleDetalle (6.2)

---

## FASE 8 — Tiempo Real (WebSocket producción) — Prioridad BAJA

- [ ] **8.1** Servidor Bun WebSocket VPS
- [ ] **8.2** Auth JWT en WebSocket
- [ ] **8.3** Notificaciones push tiempo real
- [ ] **8.4** Sync reproductor entre tabs

---

## FASE 9 — Desktop (Tauri 2.0)

- [ ] **9.10** Optimización extrema — ventanas múltiples, plugins, code splitting, lazy islands
- **TO-DOs:** CORS servidor para desktop (Origin: tauri://localhost), login desktop UI cross-origin, code splitting (chunk 649KB → manualChunks Vite)

---

## FASE 10 — Móvil (Capacitor)

- [ ] UI móvil, push notifications, background playback, offline cache

---

## FASE 11 — Algoritmo v2

> Estado actual: 6 señales, embeddings 128d, perfil con decay temporal y cache transient, sub-factores bounded [0,1], dislike como señal negativa, penalización progresiva y pasiva, diversidad, serendipia, tendencias sin sesgo. Auditorías S1-S4 completadas — ver `completado.md` y `App/docs/algoritmo.md`.

### Tareas pendientes

- [ ] **11.1** Contexto DAW — datos mezclador en señales (afinidad cruzada)
- [ ] **11.2** Embeddings mejorados — espectrograma mel (Essentia/librosa) reemplazando tags hasheados (106 slots CRC32)
- [ ] **11.4** Collaborative filtering — "usuarios similares descargaron X" (requiere ~100+ usuarios)
- [ ] **11.5** A/B testing framework — cohortes, métricas (CTR, descarga/impresión), dashboard

> Completados: 11.3 (decay temporal ✅, vector separado cubierto por 11.2), 11.6 (diversidad feed ✅), 11.7 (dislike S3 ✅, botón UI "no me interesa" pendiente de UX).
> Deps: 11.2 requiere pipeline Python/WASM. 11.4 requiere volumen mínimo. 11.5 independiente.

---

## FASE 12 — SEO/Performance/Hardening

> Glory tiene MetaTagRenderer+OpenGraphRenderer+JsonLdRenderer+SeoMetabox. RateLimiter en 5 endpoints. Sin CSP, sin tests, sin code splitting.
> **SEO dinámico completado:** RuntimeSeoData, DynamicSeoResolver, SeoKamples (sample/perfil/coleccion), OpenGraph + Twitter Cards + JSON-LD (MusicRecording/Person/MusicPlaylist), Sitemap XML custom (3 providers), SEO defaults para todas las páginas estáticas, canonical dinamico, meta robots noindex para páginas privadas. Ver `App/docs/plan-seo.md`.

- [x] **12.1** SEO dinámico islands — meta tags samples/perfiles/colecciones, OG images ✅ [AG-SEO]
- [x] **12.2** JSON-LD — MusicRecording, Person, MusicPlaylist, BreadcrumbList, FAQPage ✅ [AG-SEO]
- [ ] **12.3** Code splitting — React.lazy+Suspense para Mezclador/PianoRoll
- [ ] **12.4** Compresión — Brotli/Gzip, cache headers agresivos
- [ ] **12.5** CSP — nonces, restrict script/style/connect/media/frame-src
- [ ] **12.6** Security hardening — HSTS, X-Frame-Options, Referrer-Policy
- [ ] **12.7** Tests unitarios — PHPUnit repos/servicios, Vitest hooks React
- [ ] **12.8** Tests E2E — Playwright flujos críticos
- [ ] **12.9** Performance monitoring — Core Web Vitals, Lighthouse CI, budget <200KB
- [ ] **12.10** Sitemap XML dinámico — registrado ✅ [AG-SEO], validar en producción con Google Search Console
- [ ] **12.11** Páginas programáticas SEO — /explorar/genero/{genre}/, /explorar/bpm/{range}/ (ver plan-seo.md Fase 4)
- [ ] **12.12** robots.txt + crawl budget — optimizar para indexación eficiente
- [ ] **12.13** SSR/content injection para crawlers — renderizar contenido SEO para bots (plan-seo.md Fase 5)

---

## FASE 13 — Panel Admin (parcial)

320. Tab Reportes: ReportesController::listar()/resolver(), tabla `reportes`
321. Tab Monetización: ingresos Stripe por período, top creadores, desglose por plan

> ✅ C523 [AG-MOD]: Fix nonce SPA post-login — `useAuth.ts` fuerza `window.location.href='/'` en web (no desktop) para regenerar `GLORY_CONTEXT.nonce` autenticado.  
> ✅ C524 [AG-MOD]: Rediseño panel moderación historial IA — grid 3 cols auto-fill, acordeón JSON `<details>`, `MenuContextual` sistema UI (coords getBoundingClientRect), Modal ban con `SelectorBase`+`Input`, notificaciones rechazo, endpoint ban+rechazar-todas, `autor_id` en historial query.

---

## Sprint — Revisión + UI pendiente

344. tarjetaMeta clickable + filtro vista actual: Metas de TarjetaSample (BPM, key, tipo, género) clickables para filtrar la vista actual (no global).

346. Fix librería recarga constante: LibreriaIsland se recarga cada vez. Debería usar keep-alive (verificar useIslaActiva/useValorCongelado, guards `activa`). Patrón ref: useSampleDetalle con freeze.

347. Botones volver consistentes: Unificar estilo botón volver en todas las páginas. Crear clase compartida `botonVolver` que no dependa de contexto CSS.

348. Subcarpetas alinear derecha: `justify-content: flex-end` en contenedor subcarpetas.
    - Archivos: `explorador.css`

349. **[CRÍTICA] Rediseño explorador tipo file manager:** Funcionar como Google Drive/Windows Explorer.
    - Archivos: `ExploradorIsland.tsx`, `useExploradorIsland.ts`, `useExploradorPagina.ts`, `ArbolCarpetas.tsx`, `explorador.css` + nuevos
    - **Concepto:** Raíz muestra carpetas + samples sueltos. Click carpeta → entra. Subcarpetas arriba + samples abajo. Navegación por click (no sidebar). ArbolCarpetas colapsable/oculto. Eliminar "carpeta Todas". Breadcrumbs funcionales.
    - **Componentes:** `TarjetaCarpeta.tsx`, `VistaExplorador.tsx`, `BarraHerramientasExplorador.tsx`, `useNavegacionCarpetas.ts`
    - **Estado:** carpetaActual (null=raíz), historial[], vista (grid/lista). Filtrado client-side useMemo.

350. Rediseño gráfica admin "Actividad últimos 14 días": Barras CSS-only o canvas. Tooltips hover, eje X fechas cortas, responsive.
    - Archivos: `TabResumenAdmin.tsx`, `useAdminPanel.ts`, CSS admin

351. [EN CURSO — AG-GRQ] Moderación: (a) Log sin razón — verificar campo `razon` en servicio. (b) Posts con audio quedan en revisión — manejar audio adjunto. (c) Imágenes no salen en panel moderación. **Estado:** subpunto (a) corregido con fallback de razón y envío Groq de imágenes locales vía data URL; pendientes audio y panel.
    - Archivos: `ServicioModeracionIA.php`, `AnalizadoresModeracion.php`, `LogModeracion.php`, `TabResumenAdmin.tsx`

352. Créditos sin límite visible: Mostrar solo "Créditos: 5" (no "5/5"). Al límite: "Créditos: 0".
    - Archivos: `useTopBar.ts`

---

## Sprint D — UI/UX + Sync + Branding

D1. **Sync server→local bidireccional:** Samples publicados desde web se sincronizan localmente automáticamente si sync activo (o al abrir). En laptop nueva, descargar samples existentes.
    - Archivos: `syncService.ts`, `syncTrackingService.ts`, `SyncController.php`, desktop services
    - Requiere: endpoint delta/diff, descarga batch, reconciliación estado

> D2-D9 completados [AG-SPD]: Logo, admin tabs nav, sistema estilos refactor, filtros toggles, ModalAcciones centralizado, image edit modal, skeleton loading system, audit sentinel. Ver `completado.md`.

---

## Sprint E — Fixes + Landing

> Completado — AG-SPE / AG-LND. Landing page, log fixes, logo sidebar, editarImagenPortada, selectorMenu z-index, feedTagsLista IA tags, skeleton bordeSutil, sync comunidad, sentinel TS, branding Junicode/Bricolage, hover card filaColecciones. Ver `completado.md`.

---

## Glory Sentinel v3 — Nuevas detecciones

> Completado — AG-SEN. Eliminación IA completa, 8 reglas PHP nuevas, 5 reglas TS + 3 enhancements, 221 tests passing, undefined-class-constant con phpConstantIndexer, fix falsos positivos 43→~10, VSIX 450KB. Ver `completado.md` y `.agent/code-sentinel/PLAN_V3_DETECCIONES_Y_DEPRECACION_IA.md`.

---

## Pendientes sueltos

359. Componente centralizado estados vacios/carga (coherencia visual).
360. Al eliminar sample propio, restar crédito.

---

## Sprint F — Fixes UX + Sync + UI

> Completado — AG-FIX. Duplicados cross-carpeta (hashARutas 1:N), ocultar ruta subida, modal editar imagen clickeable, sync thumbnail, menú contextual fix getBoundingClientRect, explorador limpieza, rename carpeta→colección, botón comentar fix evento, similares WP transient 15min, skeleton auth layout, coleccionados creador owner-aware, borrado optimista publicaciones, iconos desktop, config CampoTexto desnudo. Ver `completado.md`.

---

## Auditoría sistema subidas — Plan (C367)

- [ ] **367a** Cancelación por mala conexión: Verificar reintentos (MAX_REINTENTOS=3, backoff exponencial) + timeout AbortController 120s.
- [ ] **367b** Integridad al mover archivos: Verificar hash pre/post `moverArchivoASinColeccion`. Si hash difiere, revertir.
- [ ] **367c** Pipeline IA resilience: Auditar `ProcesadorColaIA` — qué pasa si Groq caído 24h, sample borrado entre encolado y procesamiento, respuesta IA malformada.
- [ ] **367d** Upload queue edge cases: Archivos >100MB (timeout?), 0 bytes, corruptos (header WAV inválido), nombres con unicode especial.
- [ ] **367f** Constraint UNIQUE: Agregar `UNIQUE (usuario_id, LOWER(nombre))` a tabla colecciones para dedup atómico.

> 367e completado [AG-DDP]: server-side dedup endpoint `POST /samples/check-duplicate` + pre-check en uploadQueueService.

---

## Sprint G — Testing Batch Bugfixes

> Completado — AG-FIX. Excluir carpeta duplicados de watcher, detección colecciones huérfanas, auto-posts tipo+moderacion, selector X absoluto, audio cleanup, stats Cola IA TS alineado, cuota Groq headers, CSS Cola IA, rechazo masivo moderación, auth modal cierra, feed diversidad ROW_NUMBER, ComentariosEnums MODERACION_ESTADO_, Groq vision instruct suffix, BadgeModeracion autor. Ver `completado.md`.

---

## Bugfixes C270-C289

> Todos completados. Ver `completado.md` para detalle completo.

- **C270-C273:** Parser ComentariosRepository, rechazarTodosPendientes PDO fix, enum constants moderacion, scroll infinito comunidad IntersectionObserver.
- **C274-C276:** FK cascade colecciones manual, auth sync 403 multi-capa (4 capas: PHP 4 sources + custom header + sync headers explícitos + diagnósticos).
- **C277-C280:** Plan sync WAL+delta+integridad+errores+atómico+observabilidad, hardening 20 archivos (+1237/-847).
- **C281-C285:** Fix 500 SamplesEnums TODOS_ESTADO + Tauri journal permissions, PHP runtime enums schema regen, sprint seguridad SEC-C1/C2/A3/M2/M4, CLI `npx glory php:check`, file lock OS error 32 backoff.
- **C286-C289:** Tracking scoped por userId (contaminación cross-usuario), 3 bugs TC1-merge+carpeta-repetida+subcarpeta-Windows rename, TC1 journal recovery + reconciliación periódica carpetas, 5 bugs sync (fantasmas+paths rename+server-local+caché+rate limit).

### Lecciones clave C270-C289
- [Auth nginx]: nginx+PHP-FPM puede no pasar `HTTP_AUTHORIZATION`. Headers custom (`X-Kamples-Auth`) siempre se pasan. Doble vía = auth robusta.
- [Tracking Scoping]: El tracking sync DEBE estar scoped por userId. Sin esto, cambiar cuenta contamina con colecciones ajenas → 403 cascada.
- [TC1 Merge]: Limpiar datos in-memory NO es suficiente si el Store persiste datos viejos. Escribir al Store inmediatamente + actualizar `versionLocalConocida`.
- [Watcher+OneDrive]: notify-rs NO emite rename events fiables en Windows+OneDrive. Usar reconciliación periódica (escanear disco cada 15s) — no confiar en eventos para renames.
- [Journal recovery]: Tras recovery, leer Store para sincronizar `versionLocalConocida`. Sin esto, TC1 merge siempre se dispara.
- [file lock]: Windows mantiene lock durante copy/write. Esperar con backoff corto (300ms-5s) antes de leer.
- [Schema]: `writeFile` vs `writeTextFile` son permisos separados en Tauri 2.0.
- [INTERVAL SQL]: Usar whitelist en repositorio para valores de intervalo, nunca interpolar directo. Ver regla SEC-C1.

---

## FASE S — Sample Discovery & Metadata Engine (C601)

> Plan completo en `App/docs/plan-samples-metadata.md`  
> Misión: Preservar relaciones de samples musicales (WhoSampled en riesgo por adquisición Spotify). Scraping diario hot-samples + extracción de audio por compás + integración con catálogo Kamples.  
> Meta: 100K relaciones en 1 año. Diferenciador: Splice + WhoSampled fusionados.

### S1 — Infraestructura BD
- [x] **S1.1** Schemas PHP: ArtistasMusicales, Canciones, CancionesArtistas, RelacionesSample, ScrapingLog, ColaExtraccionSamples ✅
- [x] **S1.2** Generator: Cols, DTO, Enums, schema.ts generados ✅
- [x] **S1.3** Migraciones (tablas + índices) — ejecutadas via psql (v027_sample_discovery.sql: 6 tablas + 14 índices) ✅
- [x] **S1.4** Repositorios PHP con métodos custom (6 repos: ArtistasMusicales, Canciones, CancionesArtistas, RelacionesSample, ScrapingLog, ColaExtraccionSamples) ✅
- [x] **S1.5** API endpoints REST: CancionesController con 7 endpoints (listar, buscar, top, detalle cancion, detalle artista, top artistas, estadisticas) ✅ [AG-SMD]

### S2 — Scraper Core (Python/Scrapy + DataImpulse)
- [x] **S2.1** Proyecto Python: requirements.txt, scrapy.cfg, .env, .gitignore ✅
- [x] **S2.2** DataImpulse middleware (proxy + bandwidth tracking + budget cutoff) ✅
- [x] **S2.3** HotSamplesSpider (hot-samples + hot-covers + hot-remixes, 5 pages max) ✅
- [x] **S2.4** SampleDetailSpider (parsing completo con selectores verificados) ✅
- [x] **S2.5** PostgresPipeline (upsert artista→canción→cancion_artista→relación) ✅
- [x] **S2.6** Bandwidth tracking + presupuesto ✅
- [x] **S2.7** Scripts cron: run_daily.sh, run_extraction.sh, stats.py ✅
- [x] **S2.8** Tests con fixture HTML real (test_parsers.py, 30+ tests) ✅

### S3 — Pipeline Extracción Audio
- [x] **S3.1** audio_download.py (yt-dlp wrapper, WAV, cache, 300s timeout) ✅
- [x] **S3.2** bpm_analyzer.py (librosa beat tracking, time signature, confianza) ✅
- [x] **S3.3** sample_cutter.py (recorte alineado a compás: -1 + 8 compases, ffmpeg fade) ✅
- [x] **S3.4** kamples_inserter.py (inserción en BD, tags auto, vinculación relación, ruta_waveform) ✅
- [x] **S3.5** pipeline.py (orquestador: cola→descargar→analizar→recortar→waveform→insertar) ✅
- [x] **S3.6** waveform_generator.py (librosa → 120 peaks normalizados → JSON compatible con ProcesadorFFmpeg.php) ✅ [AG-SMD]
- [x] **S3.7** Cron batch: run_daily.sh + run_extraction.sh (lock file) + cron_runner.py cross-platform (Windows Task Scheduler + Linux cron) ✅ [AG-SMD]

### S4 — UI React Islands
- [x] **S4.1** CancionDetalleIsland + useCancionDetalle (detalle canción, portada, artistas, YouTube embed, relaciones) ✅ [AG-SMD]
- [x] **S4.2** TarjetaRelacionSample component (tarjeta reutilizable origen/destino, badges tipo/elemento) ✅ [AG-SMD]
- [x] **S4.3** ExplorarCancionesIsland + useExplorarCanciones (tabs recientes/top/buscar, grid, estadísticas) ✅ [AG-SMD]
- [x] **S4.4** SeccionSampleDiscovery + useRelacionDiscovery (integración en SampleDetalleIsland, enlace canción fuente/destino) ✅ [AG-SMD]
- [x] **S4.5** CadenaSamples widget (visualización cadena A→B→C, endpoint recursive, integrado en CancionDetalle) ✅ [AG-SMD]
- [x] **S4.6** Búsqueda textual (TopBar enlace "Buscar canciones", URL param q, placeholder dinámico) ✅ [AG-SMD]

### S5 — Expansión Scraper
- [x] **S5.1** ArtistSpider (artist.py: scrapea /most-sampled-artists/, sigue a tracks, delega detalles a SampleDetailSpider) ✅ [AG-SMD]
- [x] **S5.2** TrackSpider — /samples/ (track.py: listas paginadas de samples de un track, delega a SampleDetailSpider) ✅ [AG-SMD]
- [x] **S5.3** TrackSpider — /sampled/ (track.py: listas paginadas de canciones que samplearon un track) ✅ [AG-SMD]
- [x] **S5.4** BrowseYearSpider (browse_year.py: cobertura sistemática por año/década, categorías samples/covered/remixed) ✅ [AG-SMD]
- [x] **S5.5** Covers/remixes parsing ya cubierto por SampleDetailSpider._seguir_related() desde S2 ✅ [AG-SMD]
- [x] **S5.6** Productores N:N ya cubierto por PostgresPipeline (canciones_artistas rol='producer') desde S2 ✅ [AG-SMD]

### S5-UI — Página Música
- [x] **S5-UI.1** Ruta `/musica` registrada en pages.php (reutiliza ExplorarCancionesIsland) ✅ [AG-SMD]
- [x] **S5-UI.2** Sidebar: ítem "Música" con icono Music agregado a la navegación principal ✅ [AG-SMD]
- [x] **S5-UI.3** Ruta antigua `/explorar/canciones` reemplazada por `/musica` ✅ [AG-SMD]

### S5-FIX — Scraper metadata pipeline
- [x] **S5-FIX.1** TrackMetadataItem: nuevo item con genre/tags/youtube_id extraídos de track overview ✅ [AG-SCR]
- [x] **S5-FIX.2** `extraer_metadata_track_overview()` parser con selectores `span[itemprop="genre"]`, `span[itemprop="keywords"]`, `.track-embed .embed-placeholder` ✅ [AG-SCR]
- [x] **S5-FIX.3** Pipeline: `_upsert_cancion` persiste youtube_id+genero en INSERT/ON CONFLICT ✅ [AG-SCR]
- [x] **S5-FIX.4** Pipeline: handler TrackMetadataItem actualiza cancion existente con genre/youtube_id/tags(JSONB metadata) ✅ [AG-SCR]
- [x] **S5-FIX.5** Pipeline: featuring artists insertados como rol "featuring" en canciones_artistas ✅ [AG-SCR]
- [x] **S5-FIX.6** Filtro tags: omite "WhoSampled #N" automáticamente (PATRON_WHOSAMPLED_NUM) ✅ [AG-SCR]

### S6 — Audio Search + Contribución Comunitaria
- [ ] **S6.1-S6.6** Chromaprint fingerprinting, búsqueda por audio, UI contribución, moderación, sistema Cred

### S5.5 — Spotify ID support — ✅ COMPLETADO C706
- [x] **S5.5.1** Migración v030: columna `spotify_id` en `canciones` ✅ [AG-NAV]
- [x] **S5.5.2** Schema + Cols + DTO actualizados para spotify_id ✅ [AG-NAV]
- [x] **S5.5.3** Scraper: `_extraer_spotify_id_de_embed()` en parsers.py (ambos lados + overview) ✅ [AG-NAV]
- [x] **S5.5.4** Pipeline: spotify_id en INSERT/UPDATE de canciones + TrackMetadataItem ✅ [AG-NAV]
- [x] **S5.5.5** API: NormalizadorCancion expone spotifyId, fuente_spotifyId, destino_spotifyId ✅ [AG-NAV]
- [x] **S5.5.6** Frontend: embed Spotify como fallback en LadoCancionRelacion + RelacionDetalleIsland ✅ [AG-NAV]

### S-ARTISTA — Página de artista (/artista/{slug}) — ✅ COMPLETADO C708
- [x] **S-A1** Ampliar endpoint GET /artistas/{slug}: sampleadoPor, sampleaA, estadísticas genus ✅ [AG-REC]
- [x] **S-A2** relacionesDeCancionesFuente(), relacionesDeCancionesDestino() en RelacionesSampleRepository + generosPorArtista en CancionesRepository ✅ [AG-REC]
- [x] **S-A3** Hook useArtistaDetalle.ts ✅ [AG-REC]
- [x] **S-A4** ArtistaDetalleIsland.tsx + artistaDetalle.css (tabs: canciones/sampleado por/samplea a) ✅ [AG-REC]
- [x] **S-A5** Ruta /artista/:slug en pages.php + registro en appIslands.tsx ✅ [AG-REC]

### S-RECORTE — Generación automática de samples desde sampleos — ✅ COMPLETADO C709
- [x] **S-R1** Migración v031: campo `lado`/`spotify_id` en cola, `sample_fuente_id`/`sample_destino_id` en relaciones, `cancion_origen_id` en samples ✅ [AG-REC]
- [x] **S-R2** encolarBilateral() en ColaExtraccionSamplesRepository ✅ [AG-REC]
- [x] **S-R3** audio_download.py: soporte spotdl como fallback Spotify ✅ [AG-REC]
- [x] **S-R4** kamples_inserter.py + pipeline.py: bilateral, MP3 320kbps, cancion_origen_id ✅ [AG-REC]
- [x] **S-R5** DevController: POST /dev/recorte/generar + botón en RelacionDetalleIsland ✅ [AG-REC]
- [ ] **S-R6** Navegación cruzada: sample→canción→sampleo en UI (pendiente)
- [x] **S-R7** Auto-enqueue en PostgresPipeline Scrapy post-inserción relación ✅ [AG-REC]
- [ ] **S-R8** Descripción auto-generada desde metadata (pendiente)

### S-FIX-2 — Pipeline publicacion: creadorId + FK delete + WP Cron ✅ [AG-FIX] C711-C218

Commits: `79f586db`, `fc3db49f`, `b575fb68`, `55b9fd8b`

- [x] **S-FIX2.1** Fix FK violation al borrar sample: `SamplesRepository::eliminarConCascada()` llama `ColaExtraccionSamplesRepository::desvincularSampleId()` antes de DELETE ✅
- [x] **S-FIX2.2** Fix creadorId=0 en PublicadorExtraccion: `resolverCreadorId()` usa `contribuidor_id` de relacion (JOIN en `extraidos()`), fallback a `KAMPLES_SISTEMA_USUARIO_ID` en .env (default usuario 7 admin) ✅
- [x] **S-FIX2.3** Fix WP Cron race condition: reemplazado WP Cron por endpoint REST directo `POST /dev/extraccion/publicar-auto`. Python notifica tras terminar extraccion. Autenticacion via `X-Kamples-Secret`. ✅
- [x] **S-FIX2.4** Refactor `publicarExtracciones()` en DevController: desestructuración explícita de return para Sentinel ✅
- [x] **S-FIX2.5** KAMPLES_SITE_URL + KAMPLES_CRON_SECRET añadidas a kamples-scraper/.env ✅
- [x] **S-FIX2.6** Cola 5,6 (relacion 182) reseteadas a estado `extraido` y publicadas — pipeline end-to-end verificado ✅
- [x] **S-FIX2.7** Fix 401 en publicar-auto: `getenv()` → `$_ENV ?? getenv()` en `verificarSecretCron()` y `resolverCreadorId()`. Dotenv::createImmutable() popula solo `$_ENV`, no `putenv()`. ✅

> TO-DO: DevController supera 300 lineas (539). Separar en DevRecorteController + DevPublicacionController. Marcar como tarea pendiente de sprint.
> Lecciones: [WP Cron] No depender de tráfico para cron en dev — usar endpoint REST directo con secret. [creadorId] Resolver desde contribuidor_id de la relación (JOIN en extraidos()), no hardcodear. [FK delete] SIEMPRE desreferenciar FKs en tablas secundarias antes de DELETE en tabla fuente. [Dotenv] Dotenv::createImmutable() popula SOLO $_ENV. NUNCA usar getenv() sin fallback $_ENV. Patron correcto: `$_ENV['KEY'] ?? getenv('KEY') ?? ''`.

### S-FIX — Bugfixes artista + cola + logging — ✅ COMPLETADO C710 [AG-REC]
- [x] **S-FIX.1** DISTINCT ON (c.id) en cancionesDeArtista() para eliminar duplicados por roles múltiples ✅
- [x] **S-FIX.2** Mapeo bilateral→unilateral en detalleArtista(): _relacionBilateralAUnilateral() convierte fuente_*/destino_* a cancion_titulo/artista_nombre para NormalizadorCancion ✅
- [x] **S-FIX.3** modoCola flag en _spiderParaTipo(): DEPTH_LIMIT=0 + CLOSESPIDER_PAGECOUNT=1 al procesar cola ✅
- [x] **S-FIX.4** Logs detallados pipeline: timing por paso (6 pasos), tamaños archivos, BPM/beats, ruta salida ✅
> Lecciones: bilateral queries (fuente_titulo/destino_titulo) NO son compatibles directas con NormalizadorCancion::relacion() que espera cancion_titulo. Siempre transformar antes de normalizar. Scrapy DEPTH_LIMIT=0 previene follow links.

### S-ESCALA — Escalabilidad relacional (C703) — ✅ COMPLETADO C704
- [x] **S-E.1** Trigger PostgreSQL: `total_sampleada`/`total_samplea` auto-update en INSERT/DELETE de `relaciones_sample` ✅ [AG-NAV]
- [x] **S-E.2** Pipeline cambiar `ON CONFLICT DO NOTHING` → `DO UPDATE` para timings/votos en relaciones re-encontradas ✅ [AG-NAV]
- [x] **S-E.3** Índices compuestos: `(dest_id, tipo_relacion)`, `(fuente_id, tipo_relacion)`, `(verificada, created_at DESC)` ✅ [AG-NAV]
- [x] **S-E.4** Re-scraping strategy: `proximo_rescrape` en scraping_log, rescraping automático para tracks/artists ✅ [AG-NAV]
> Implementado en migración v029. Detalle en `completado.md` → C704.

### S-UI — Mejoras UI/SEO Sample Discovery — ✅ [AG-SDI]

- [x] **S-UI.1** Relaciones completas en sample detail: `relacionPorSampleId()` enriquecido con `samplesDe/sampleadaEn` de ambas canciones + `ladoExtraccion` ✅
- [x] **S-UI.2** Indicador visual fuente/destino: `SeccionSampleDiscovery` muestra "Extraído de {canción}" con conector + todas las relaciones adicionales ✅
- [x] **S-UI.3** Imagen portada desde canción: `PublicadorExtraccion::publicarItem()` hereda `imagen_url` de la canción origen al sample ✅
- [x] **S-UI.4** URLs SEO correctas: `construirUrlSampleo()` callers corregidos — `TablaRelaciones` y `TarjetaRelacionSample` pasan datos en posiciones correctas, con soporte both-sides via `RelacionSample.destinoTitulo/fuenteTitulo/destinoArtista/fuenteArtista` ✅
- [x] **S-UI.5** SEO title en RelacionDetalleIsland: h1 descriptivo `"{destino} samplea a {fuente}"` + `document.title` dinámico ✅

> Lecciones:
> - [URL SEO]: `construirUrlSampleo()` necesita 5 params (destArtista, destTitulo, fuenteArtista, fuenteTitulo). Callers con datos de un solo lado deben usar `urlSampleo()` helper que posiciona según `direccion`.
> - [Tipo RelacionSample]: Agregar campos opcionales del otro lado (`destinoTitulo`, `fuenteArtista`, etc.) permite URLs completas sin cambiar las queries PHP.
> - [imagen portada]: `CancionesRepository::buscarConArtista()` retorna `imagen_url` — usar para heredar a samples generados.
> - [ladoExtraccion]: Comparar `sample_fuente_id === sampleId` en PHP para determinar lado, enviar al frontend como `ladoExtraccion`.

### S-UI2 — Panel lateral Discovery + Origin marker ✅ [AG-UI] C712

- [x] **S-UI2.1** Panel lateral discovery: `TarjetaCancionMini` (nuevo componente) muestra canción fuente/destino en PanelDetalleSample cuando el sample tiene relación — título + artista + portada + etiqueta ✅
- [x] **S-UI2.2** discoveryIndicadorOrigen eliminado: reemplazado por marcador `●` en la fila de origen dentro de `TablaRelaciones` (clase `tablaRelacionesFilaOrigen` + border-left acento) ✅
- [x] **S-UI2.3** Retroactive imagen_url: 4 samples existentes (148-151) sin imagen actualizados via UPDATE FROM canciones WHERE cancion_origen_id IS NOT NULL AND imagen_url IS NULL ✅

> Lecciones S-UI2:
> - [Panel hooks]: `useRelacionDiscovery` acepta `sampleId?: number | null` — se puede llamar en PanelDetalleSample pasando `sample.id` directamente sin hook adicional.
> - [CSS vars]: `--superficieElevada` y `--bordeInteractivo` NO existen. Usar `--fondoElevado1/2/3` y `--bordeActivo` respectivamente.
> - [Retroactive data]: Samples generados antes de S-UI.3 tienen `imagen_url = NULL`. Fix: `UPDATE samples SET imagen_url = c.imagen_url FROM canciones c WHERE s.cancion_origen_id = c.id AND s.imagen_url IS NULL`.
> - [TablaRelaciones origin marker]: `marcarOrigen={esFuente}` en fuente, `marcarOrigen={!esFuente}` en destino. Marca solo `idx === 0` (primera fila = canción origen directa).
