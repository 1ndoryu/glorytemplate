# Kamples — Roadmap Integral de Producto

> **Versión:** 4.1 | **Última actualización:** 26/02/2026 | **Stack:** Glory Framework (WP + React Islands + TS) | **Competencia:** Splice

## Visión

Plataforma de samples con alma de red social. Algoritmo de descubrimiento multi-señal (6 factores), marketplace híbrido (suscripción + venta directa + revenue share), análisis IA (Groq Whisper + LLM), app desktop Tauri 2.0 con drag-to-DAW, waveforms interactivos.

## Arquitectura

- **BD:** PostgreSQL + pgvector (JSONB metadata, embeddings 128d HNSW coseno) | **Storage:** WP uploads (WAV→MP3→waveform→preview) | **WS:** Node/Bun local (→VPS) | **IA:** Groq Whisper (large-v3-turbo) + LLM (qwen3-32b) | **Desktop:** Tauri 2.0 | **Móvil:** Capacitor | **Pagos:** Stripe Connect+Billing (keys live)
- **Algoritmo:** Similitud Audio (0.28, pgvector) | Comportamiento (0.27) | Contexto (0.15) | Tendencias (0.12) | Grafo Social (0.10) | Novedad (0.08) + penalizaciones progresivas + serendipia + saturación popularidad

## Páginas

| Ruta | Isla | Descripción |
|---|---|---|
| `/` | `InicioIsland` | Feed + filtros toggle + ordenamientos |
| `/` (deslogueado) | `LandingPublica` | Landing nav flotante (sin sidebar/topbar) |
| `/sample/{slug}` | `SampleDetalleIsland` | Tarjeta + waveform + metadata + similares |
| `/coleccion/{slug}` | `ColeccionDetalleIsland` | Info colección + grid samples |
| `/comunidad` | `ComunidadIsland` | Feed posts sociales |
| `/publicacion/{id}` | `PublicacionIsland` | Detalle publicación + comentarios |
| `/descubrir` | `DescubrirIsland` | Algoritmo personalizado |
| `/perfil/{username}` | `PerfilIsland` | Perfil público |
| `/libreria` | `LibreriaIsland` | Colecciones + subidos |
| `/descargas` | `DescargasIsland` | Mis descargas + sugerencias |
| `/favoritos` | `FavoritosIsland` | Mis favoritos + sugerencias |
| `/mensajes` | `MensajesIsland` | Conversaciones completas |
| `/planes` | `PlanesIsland` | Checkout Stripe |
| `/reproductor` | `ReproductorIsland` | Player completo |
| `/auth/login` | `LoginIsland` | Login |
| `/auth/registro` | `RegistroIsland` | Registro |
| `/admin/dashboard` | `DashboardCreadorIsland` | Stats creador |
| `/admin/panel` | `AdminPanelIsland` | Panel admin (KPIs, usuarios, moderación) |
| `/explorador` | `ExploradorIsland` | Árbol carpetas + coleccionados backend |

**Eliminadas:** `/perfil/editar` (→ModalConfiguracion), tabs InicioIsland (→ordenamientos). Chat flotante tipo Messenger.

## Planes de Suscripción

| | Free | Pro ($5) | Premium ($19.99) |
|---|---|---|---|
| Descargas/día | 5 | 50 | Ilimitadas |
| Calidad | WAV | WAV | WAV |
| Subida/mes | Ilimitada | Ilimitada | Ilimitada |
| Monetización | 50/50 | 70/30 | 80/20 |

---

## Completado (ultra-compacto)

- **F0-F7:** Schema 14 tablas, PostgresService, API REST, CSS system, colors/ dinámicos, FFmpeg, Login/Registro, Perfil, ModalConfiguracion, Auth, LandingPublica, Upload real (FormData+pipeline+IA), WaveformPlayer, ReproductorGlobal, AnalizadorAudio, ServicioIA, PipelineAudio, tags, deduplicación, DescubrirIsland, endpoints feed/notif/msg/dashboard, BotonFollow/Like, ModalPublicar, InicioIsland, ModalFiltros, infinite scroll+virtualización, LibreriaIsland, ColeccionesController CRUD, ChatFlotante multimedia, DashboardCreador, SPA navigation, SampleDetalle, ColeccionDetalle, ComunidadIsland, MensajesIsland, ChatIsland, NotificacionesIsland, Stripe Billing, PlanesIsland.
- **F9 Desktop:** Tauri 2.0 MVP completo (tray+menu, 6 servicios TS, JWT backend, Vite proxy, auth, sync bidireccional, drag-to-DAW nativo, auto-sync). Build: exe+MSI+NSIS. Sync optimizado 1000+ samples (semáforo paralelo, debounce store, Map O(1), config panel, papelera 30d, borrado bidireccional).
- **F13 parcial:** AdminController 6 endpoints, 3 tabs (Resumen+Usuarios+Moderación).
- **SOLID PHP:** KamplesController 1713→60 lín (12 sub-controllers). Repository Pattern: 27 controllers, ~340 queries → 18 repos. Schema System: 18 schemas + 36 generados + Enums 8 tablas.
- **React:** ~50 componentes + ~50 hooks. Sentinel: 48 reglas, 325+ violaciones corregidas. Mezclador DAW aislado (`/Mezclador/`, 50+ archivos, CR+Patterns+Mixer+Piano Roll). 5 auditorías (~275 hallazgos, ~95% resueltos).
- **Social/Explorador/Desktop:** Repost, TarjetaPublicacion unificada, PublicacionIsland, lightbox, ColeccionDetalle edición, Explorador (filtrado client-side, subcarpetas, breadcrumbs, drag-drop, carpetas, jsonb_set), keep-alive SPA (MAX_CACHE_PAGES=20, useIslaActiva, useValorCongelado), panel moderación.
- **Sprint UI/UX C343-C354:** Tags no-compress, badges clickable, filtros rediseño, librería keep-alive, botones volver, subcarpetas, explorador file-manager, admin chart, moderación, créditos ilimitados, Sentinel SQL/key fix, BotonBase neutralized, drag cuadricula, restaurar ubicación IA, botones eliminar sample admin.

---

## Pendientes por Fase

### TO-DOs de fases completadas

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

### FASE 8 — Tiempo Real (WebSocket producción) — Prioridad BAJA

- [ ] **8.1** Servidor Bun WebSocket VPS
- [ ] **8.2** Auth JWT en WebSocket
- [ ] **8.3** Notificaciones push tiempo real
- [ ] **8.4** Sync reproductor entre tabs

### FASE 9 — Desktop (Tauri 2.0) — MVP completado

- [ ] **9.10** Optimización extrema — ventanas múltiples, plugins, code splitting, lazy islands
- **TO-DOs:** CORS servidor para desktop (Origin: tauri://localhost), login desktop UI cross-origin, code splitting (chunk 649KB → manualChunks Vite)

### FASE 10 — Móvil (Capacitor)

- [ ] UI móvil, push notifications, background playback, offline cache

### FASE 11 — Algoritmo v2

> Estado: 6 señales con embeddings 128d. Perfil usuario = promedio ponderado con **decay temporal** y **cache transient**. Sub-factores bounded [0,1]. Dislike como señal negativa. Escala musical en contexto. CTE 2 niveles. Batching + GC en cron. **S3:** Penalización progresiva reproducciones, penalización pasiva, saturación popularidad, serendipia, tendencias sin sesgo edad, pesos rebalanceados (contenido > técnico). Sin A/B testing ni collaborative filtering.

#### Auditoría AG-ALG (17 fixes implementados)
> P0 (4): sub-pesos contexto rebalanceados (6 factores, suman 1.0), tendencias/comportamiento bounded [0,1], perfil vectorial cacheado.
> P1 (8): CTE 2 niveles, cache todas las páginas, pgvector check cacheado, invalidarCache SQL LIKE, procesarTemporales filtrado SQL, generarTodos batch 200, GC forzarRecalculoGlobal.
> P2 (5): decay temporal perfil (EXP -d/30), dislike penalty comportamiento (-0.15), feedNuevoUsuario mejorado, escala_match en contexto, samplesSimilares config weights.
> P4 (2): docblock + invalidarCache consistencia.
> Detalle completo: `App/docs/algoritmo.md` (sección Changelog de Auditoría).

#### Sesión AG-ALG S2: Comunidad + Búsqueda + Tags (5 fixes)
> - **Tag normalization (BUG CRÍTICO):** Tags se almacenaban con casing mixto pero embeddings y SQL comparaban lowercase. Fix: normalización forzada en upload+edición + LOWER() en SQL.
> - **algoritmoPesos expandido:** 3 nuevas secciones (comunidad, búsqueda, tags) en config centralizada.
> - **Feed comunidad con scoring:** filtro 'todos' ahora usa frescura(0.40) + engagement velocity(0.35) + boost social(0.15) + diversidad ROW_NUMBER. CTE 2 niveles.
> - **Búsqueda con ranking:** ts_rank reemplaza ORDER BY cronológico. 3 factores: full-text, tag match, título boost.
> - **PublicacionesEnums:** Constantes MODERACION_* (faltaban, causaban error de compilación).

#### Sesión AG-ALG S3: Filosofía del algoritmo (8 cambios)
> - **Pesos rebalanceados:** similitud 0.28, comportamiento 0.27, tendencias 0.12, novedad 0.08. Contenido/comportamiento suben, recencia baja.
> - **Contexto tech vs contenido:** Afinidad temática (genero+creador=0.75) domina sobre datos técnicos (BPM+key+escala+tipo=0.25).
> - **Penalización reproducciones progresiva:** Decaimiento hiperbólico 1/(1+count*0.15). Reemplaza binaria (umbral 3→0.3).
> - **Penalización pasiva (NEW):** Play sin acción positiva = dislike implícito (factor 0.85, min 2 plays).
> - **Saturación popularidad (NEW):** Samples sobreusados bajan logarítmicamente (umbral 50 descargas, piso 0.30).
> - **Serendipia (NEW):** Inyección post-query de descubrimiento cada 6 posiciones (pgvector distancia 0.3-1.0).
> - **Tendencias sin sesgo edad:** Normalización por máximos absolutos de ventana en vez de horas_desde_publicación.
> - **samples_similares:** Tags/género dominan (0.55), técnico reducido (0.10).

#### Sesión AG-ALG S4: Calidad reproducciones + saturación dinámica + tracking (6 cambios)
> - **Clasificación calidad reproducciones:** Cada play clasificada como ignorada (<1s, peso 0), rápida (browsing, peso 0.30) o significativa (umbral adaptativo, peso 1.0). Umbrales: corto <=20s→50%, medio 20-60s→30%/min10s, largo >60s→15%/min10s.
> - **Penalización reproducciones con SUM(peso):** Ya no cuenta plays (COUNT), pondera por calidad (SUM CASE). 3 plays rápidas pesan 0.9, no 3.0.
> - **Penalización pasiva solo significativas:** Plays rápidas no activan dislike implícito. Solo escuchas reales cuentan para el umbral.
> - **Saturación popularidad dinámica:** PERCENTILE_CONT(0.75/0.95) reemplaza valores fijos. Cache WP transient 1hr. Se adapta al crecimiento de la plataforma.
> - **Frontend tracking duración real:** 4 hooks + utilidad centralizada (`trackingReproduccion.ts`). Envían `duracionEscuchada` y `completada` en pause, ended, track-change, cleanup. Ya no registran en play-start con datos vacíos.
> - **Verificación intervalo_activo_min:** Confirmado funcional. `ultima_actividad = NOW()` en cada incrementarContador(). PlanificadorAlgoritmo compara contra 600s.

- [ ] **11.1** Contexto DAW — datos mezclador en señales (afinidad cruzada)
- [ ] **11.2** Embeddings mejorados — espectrograma mel (Essentia/librosa) reemplazando tags hasheados (106 slots CRC32)
- [x] **11.3** ~~User embeddings dedicados — vector separado, decay temporal~~ **PARCIAL:** Decay temporal implementado (EXP(-dias/30)) en interacciones para perfil. Vector separado pendiente.
- [ ] **11.4** Collaborative filtering — "usuarios similares descargaron X" (requiere ~100+ usuarios)
- [ ] **11.5** A/B testing framework — cohortes, métricas (CTR, descarga/impresión), dashboard
- [x] **11.6** ~~Diversidad mejorada~~ **PARCIAL:** feedNuevoUsuario con diversidad creador + boost verificado + decay exponencial. Feed principal ya tenía diversidad (ROW_NUMBER PARTITION).
- [x] **11.7** ~~Feedback signals — "no me interesa", señal negativa explícita~~ **COMPLETADO S3:** Dislike penaliza en Comportamiento (max -0.15). Penalización pasiva: play sin acción = dislike implícito (0.85). Falta solo botón UI "no me interesa" (diferente de dislike).
- **Deps:** 11.2 requiere pipeline Python/WASM (128d→256d+). 11.4 requiere volumen mínimo. 11.5 independiente.

**Aprendizajes S3:**
- [Tendencias]: La normalización por `horas_desde_publicación` creaba sesgo anti-antigüedad. Corregido a normalizadores absolutos.
- [Contexto]: El split 75/25 (contenido/técnico) en sub-pesos es más efectivo que separar en 2 señales — mantiene la señal unificada configurable.
- [Serendipia]: pgvector BETWEEN en distancia coseno funciona nativo. Fallback random con filtro de engagement es suficiente.
- [Penalizaciones]: Multiplicativas (post-score) > aditivas para penalties que modifican el scoring sin romper la suma=1.0.
- [samples_similares]: El path pgvector ya es correcto (tags dominan 106/128 dims). Solo el fallback necesitaba rebalanceo.

**Aprendizajes S4:**
- [Tracking]: Backend debounce 30s (buscarRecientePorUsuario) funciona bien para el patrón "registrar al finalizar". No hace falta registro al iniciar play.
- [Clasificación]: Umbrales adaptativos por duración del sample evitan tratar un sample de 5s igual que uno de 2min. CASE en SQL con subconsulta a s.duracion.
- [Saturación]: PERCENTILE_CONT es nativo PostgreSQL, no requiere extensiones. Cache en WP transient evita recalcular en cada query.
- [Frontend]: La utilidad centralizada `trackingReproduccion.ts` simplifica los 4 hooks — una función, un umbral mínimo, best-effort.
- [Actividad]: `intervalo_activo_min` funciona correctamente via `ultima_actividad = NOW()` en incrementarContador(). No requiere cambios.

### FASE 12 — SEO/Performance/Hardening

> Glory tiene MetaTagRenderer+OpenGraphRenderer+JsonLdRenderer+SeoMetabox. RateLimiter en 5 endpoints. Sin CSP, sin tests, sin code splitting.

- [ ] **12.1** SEO dinámico islands — meta tags samples/perfiles/colecciones, OG images
- [ ] **12.2** JSON-LD — Product, Person, MusicRecording, BreadcrumbList
- [ ] **12.3** Code splitting — React.lazy+Suspense para Mezclador/PianoRoll
- [ ] **12.4** Compresión — Brotli/Gzip, cache headers agresivos
- [ ] **12.5** CSP — nonces, restrict script/style/connect/media/frame-src
- [ ] **12.6** Security hardening — HSTS, X-Frame-Options, Referrer-Policy
- [ ] **12.7** Tests unitarios — PHPUnit repos/servicios, Vitest hooks React
- [ ] **12.8** Tests E2E — Playwright flujos críticos
- [ ] **12.9** Performance monitoring — Core Web Vitals, Lighthouse CI, budget <200KB

### FASE 13 — Panel Admin (parcial)

320. Tab Reportes: ReportesController::listar()/resolver(), tabla `reportes`
321. Tab Monetización: ingresos Stripe por período, top creadores, desglose por plan

### Sprint Tareas Completadas pero pendiente de revisión por el usuario.

343. Tags feed no-compress: feedTagsLista scroll horizontal sin comprimir. (COMPROBADO; FUNCIONA ✅)

344. tarjetaMeta clickable + filtro vista actual: Metas de TarjetaSample (BPM, key, tipo, género) clickables para filtrar la vista actual (no global). 

345. Rediseño filtroPrecio + borrar filtrosTitulo: Eliminar `<h3 filtrosTitulo>`. filtroPrecioSeccion con borde+padding. filtroPrecioBoton borde visible + efecto activo tipo segmented control. (COMPROBADO; FUNCIONA ✅)

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

351. Moderación: (a) Log sin razón — verificar campo `razon` en servicio. (b) Posts con audio quedan en revisión — manejar audio adjunto. (c) Imágenes no salen en panel moderación.
    - Archivos: `ServicioModeracionIA.php`, `AnalizadoresModeracion.php`, `LogModeracion.php`, `TabResumenAdmin.tsx`

352. Créditos sin límite visible: Mostrar solo "Créditos: 5" (no "5/5"). Al límite: "Créditos: 0".
    - Archivos: `useTopBar.ts`

## Completado — Sprint Sync v2 + Cola IA + UI (C353-C358)

> Todas las tareas implementadas y commiteadas. Detalle de arquitectura, escenarios y edge cases en secciones de referencia abajo.

- **C353** Ocultar Explorador temporalmente.
- **C354** Fix subida duplicada — tracking v2 verifica por ruta y nombre antes de encolar upload.
- **C355** Sync v2 Backend + Desktop — SyncController.php, SyncRepository.php, syncTrackingService.ts (~338 lin), syncCollectionService.ts (~528 lin). Migracion v1-v2 automatica. Tipos actualizados en ambos global.d.ts.
- **C356** Cola IA — tabla `cola_procesamiento_ia` (sample/comentario/publicacion, 2 reintentos +30min), ProcesadorColaIA (cron 15min, 10 items FIFO), GroqHttpClient retorno tipado 429, PipelineAudio/ServicioModeracionIA encolado, 5 endpoints admin, TabColaIaAdmin.tsx.
- **C357** FileWatcher carpetas — callbacks OnCarpetaNuevaFn/OnCarpetaRenombradaFn, deteccion rename (delete-create grace 3s), `procesarEventoCarpeta()`.
- **C358** SyncPanel tabs + historial per-sample + colecciones + re-sync + boton forzar.
- **Auditoria Sync v2** 13 hallazgos corregidos: descargasEnCurso v2, polling soloEstructura, manejarMoveLocal tracking v2, indices Map O(1), batch mode lote, centralizacion syncGuards, sinColeccionSet, cola offline, deteccion disco lleno, lock sync concurrente.
- **Samples raiz -> Sin coleccion** Mover a `Sin coleccion/` automatico al subir. syncTrackingService: `totalSinColeccion()`.
- **Sentinel + VarSense** 62 errores CSS + 27 violaciones Sentinel corregidos (15 archivos CSS, splits PanelSincronizacion/AdminController/PipelineAudio).
- **Tray Icon -> SincPanel** Left-click tray abre sync. Menu "Sincronizacion". Evento `abrir-panel-sync`.
- **Deep Fix Sync** 5 bugs criticos: encoding mojibake (41 instancias), estado congelado 'sincronizando', sync manual con auto-sync pausado, feedback uploads, polling race + rename loop.
- **Sync Optimizacion 1000+** Semaforo concurrencia, persistencia debounce, Map O(1) indices, config panel UI, papelera 30d, borrado bidireccional rate-limited. 17 archivos, +2135 lin.
- **Config Window MPA** `config.html`+`config.tsx` entry point independiente, VentanaConfigSync.tsx frameless, useConfiguracionSyncVentana.ts standalone, pre-creada en tauri.conf.json (evita deadlock WebviewWindowBuilder en Windows), onFocusChanged recarga config.

---

### Arquitectura de Referencia — Sync v2 Colecciones (implementada)

**Modelo:** Carpetas locales = colecciones del usuario (no categorias IA). `carpetaSync/{coleccion}/sample.wav` + `Sin coleccion/`.
**Tracking (Tauri Store):** `archivos: Record<"{sampleId}_{coleccionId}", ArchivoTracking>`, `colecciones: Record<number, ColeccionLocal>`, `sinColeccion: Set<number>`, `historial: AccionHistorial[]`.
**Endpoint:** `GET /me/sync/colecciones` -> colecciones con samples + sinColeccion.

**Local -> Servidor:** Mover sample entre carpetas (POST+DELETE coleccion) | Renombrar carpeta (PUT nombre) | Crear carpeta (POST coleccion) | Renombrar sample (nada, nombre local libre) | Borrar sample (`syncDeshabilitado=true`) | Borrar carpeta (marcar todos deshabilitados).

**Servidor -> Local:** Sample agregado (descargar a carpeta) | Coleccion renombrada (renombrar carpeta local con guard watcher) | Sample/coleccion eliminado (nada, local permanece como "huerfano").

**Edge cases activos:** Conflicto nombres carpeta (sufijo ` (2)`), disco lleno (guard fail-open), offline-online (offlineQueue), sample en 2+ colecciones (copia), subcarpetas (coleccion padre), caracteres especiales (sanitize filesystem).

### Cola IA — Referencia (implementada)

Tabla `cola_procesamiento_ia`: tipo (sample/comentario/publicacion), operacion (analisis_audio/moderacion_texto/moderacion_imagen), estado (pendiente-procesando-completado-error_reintento-error_final), max 2 intentos, +30min retry. Cron 15min FIFO 10 items. GroqHttpClient detecta 429 -> caller encola. Panel admin: stats + reintentar individual/masivo.

---

### Pendientes

359. Componente centralizado estados vacios/carga (coherencia visual).
360. Al eliminar sample propio, restar credito.
361. (vacia)

---

## SPRINT ACTUAL — Bugs Sync Desktop

362. ✅ [AG-SYN] **Imagenes samples no se actualizan en sync panel:** Fix real (2do intento): `obtenerImagenSampleDesdeServidor` tenía DOS bugs: (1) usaba `sampleId` numérico pero la ruta GET `/samples/{slug}` espera string slug → siempre 404, (2) no desenvolvía el envelope `{ data: { imagenUrl } }` → siempre null. Ahora recibe `slug`, usa `encodeURIComponent(slug)`, y lee `json.data.imagenUrl`. Retry con backoff se mantiene (4s→12s→30s→60s). **Además:** `rehidratarImagenesPendientes()` en syncService.ts recorre entradas del historial sin imagen al iniciar, hace batch fetch `GET /samples?creador=username` y actualiza todas de golpe. Esto cubre samples ya sincronizados antes del fix.

363. ✅ [AG-SYN] **Ventana configuracion no se minimiza ni cierra:** Fix real (2do intento): `core:default` en Tauri 2 NO incluye permisos de mutación de ventana. `getCurrentWindow().minimize()` y `.hide()` fallaban silenciosamente por falta de permisos. Agregados a `principal.json`: `core:window:allow-minimize`, `allow-hide`, `allow-show`, `allow-set-focus`, `allow-center`, `allow-close`. Los catch vacíos ahora logean con `console.error` para diagnóstico.

364. ✅ [AG-SYN] **Click en historial sync abre ubicacion incorrecta:** Fix: `seleccionar_archivo` en lib.rs usaba `.arg()` que wrappea en comillas rutas con espacios, rompiendo `explorer /select,`. Cambiado a `.raw_arg()` (via `CommandExt` on Windows). Ahora abre la ubicación correcta del sample.

365. ✅ [AG-SYN] **Samples se duplican en el servidor al sincronizar:** Fix 3 capas: (1) En `subirArchivo`, verificación de última línea contra tracking v2 + hash antes del POST. (2) Hash se persiste inmediatamente tras upload exitoso (no al fin de cola). (3) Re-verificación hash pre-upload por si upload paralelo lo añadió.

366. ✅ [AG-SYN] **Colecciones/carpetas se duplican al crear y al recargar:** Fix 3 capas: (1) `fileWatcherService.ts`: debounce `carpetasRecientes` (5s) para ignorar evento create+modify sobre misma carpeta. (2) `syncCollectionService.ts`: `crearColeccionDesdeLocal` verifica tracking local antes de POST. (3) Backend `ColeccionesRepository.php`: check-before-insert por nombre (case-insensitive) por usuario.

367. **Planificar revision detallada del sistema de subidas — PLAN:**  
    > **Alcance:** Auditar uploadQueueService, syncService, PipelineAudio para resiliencia y edge cases.
    - [ ] **367a** Cancelación por mala conexión: Verificar que reintentos (MAX_REINTENTOS=3, backoff exponencial) cubren desconexión mid-upload. Añadir timeout al fetch POST (AbortController con 120s) + test manual desconectando wifi.
    - [ ] **367b** Integridad al mover archivos: Verificar hash pre/post `moverArchivoASinColeccion` para detectar corrupción durante rename. Si hash difiere, revertir.
    - [ ] **367c** Pipeline IA resilience: Auditar `ProcesadorColaIA` — qué pasa si Groq está caído 24h, si el sample se borra entre encolado y procesamiento, si la respuesta IA es malformada.
    - [ ] **367d** Upload queue edge cases: Qué pasa con archivos >100MB (timeout?), archivos de 0 bytes (debería rechazar), archivos corruptos (header WAV inválido), nombres con emojis/unicode especial.
    - [ ] **367e** Server-side dedup: Considerar endpoint `POST /samples/check-duplicate` (hash parcial) consultado antes del upload. Alternativa: backend retorna `already_exists` con `sample_id` existente si hash coincide. TO-DO para implementar.
    - [ ] **367f** Constraint UNIQUE: Agregar `UNIQUE (usuario_id, LOWER(nombre))` a tabla colecciones para dedup atómico (actual: check-then-insert con race window mínima).

368. ✅ [AG-SYN] **REVISIÓN PROFUNDA — Ciclo Upload→Papelera→Re-Upload→Duplicado (7 tareas)**
    > **Plan detallado en:** `App/docs/plan-sync-optimizacion.md` (Fase 2)
    > **Implementado:** 2026-03-03 — todas las capas de defensa.
    - [x] **P1** Excluir `.papelera/` del watcher (`fileWatcherService.ts` — `CARPETAS_EXCLUIDAS_TOTAL` Set)
    - [x] **P2** Guard `marcarDescargaEnCurso()` en `papeleraService.moverAPapelera()` antes del rename
    - [x] **P3** Pre-check `exists()` antes de `readFile` en `subirArchivo()` + rechazo rutas `.papelera/` en `encolarArchivo()`
    - [x] **P4** Normalización nombre (strip `^\d{13,}_`) para dedup — `normalizarNombreArchivo.ts` + aplicado en `encolarArchivo` y `onArchivoNuevo`
    - [x] **P5** Idempotency key: header `X-Idempotency-Key` (cliente) + transient check en `SamplesUploadController` (servidor)
    - [x] **P6** Consistencia historial: `moverAPapelera()` actualiza estado sample a `en_papelera`
    - [x] **P7** Auditar carpetas excluidas del watcher (`CARPETAS_SOLO_DELETE` para `Sin colección` — CREATEs ignorados, DELETEs pasan)

369. ✅ [AG-SYN] **Hardening post-C368 — duplicado real + refresh imagen cross-window + guards de renames internos**
    - [x] Race condition `encolarArchivo()` (create+modify concurrentes): guard síncrono `rutasEncolando` antes de cualquier `await`
    - [x] Upload paralelo mismo contenido: guard `hashesEnVuelo` en `subirArchivo()`
    - [x] Historial per-sample no refrescaba imagen: `obtenerHistorialSamples()` ahora retorna copias (`map(e => ({ ...e }))`)
    - [x] Polling panel sync ahora detecta `imagenUrl` y cambios en toda la lista (no solo el primer item)
    - [x] MPA sync-panel/main: `recargarHistorialDesdeStore()` expuesto en `window.__KAMPLES_SYNC__` con throttle interno 5s
    - [x] Migración store upload pre-C368: regenerar `idempotencyKey` faltante al restaurar cola
    - [x] Rename interno seguro: `marcarMovimientoInterno()` + filtro en `manejarBorradoLocal()` para evitar soft-delete accidental por DELETE de ruta origen

370. ✅ [AG-SYN] **Hotfix OneDrive duplicado + not found + papelera incidental**
    - [x] `uploadQueueService`: dedup por ruta ahora usa clave normalizada (`/` + lowercase) para evitar doble encolado por variantes `C:\...` vs `C:/...`
    - [x] `uploadQueueService`: `item.rutaArchivo` se normaliza al restaurar cola para consistencia de lookups O(1)
    - [x] `uploadQueueService`: `idempotencyKey` determinística por hash (o fallback por ruta+nombre) para que dos requests del mismo archivo colisionen en backend en vez de publicar doble

371. ✅ [AG-SYN] **Hotfix portada no visible en Sync Panel (desktop/MPA)**
    - [x] `VentanaSincPanel`: resolver URLs de portada relativas (`/wp-content/...`) a absolutas del servidor usando `__KAMPLES_CONFIG__.serverUrl`/`GLORY_CONTEXT.apiUrl`
    - [x] Mantener compatibilidad con URLs absolutas (`https://...`) y protocol-relative (`//...`)
    - [x] Fallback seguro: si no hay origen resoluble, conservar URL original para entorno dev con proxy

---

## Notas Compactas

- **Storage:** WP uploads local+VPS. **IA:** Groq 100%. **Stripe:** keys live .env. **WS:** Local→Bun VPS. **FFmpeg:** winget v8.0.1 .env.
- **Chat:** Flotante Messenger + /mensajes (texto/imágenes/audio/samples). **Filtros:** Toggle. Orden: Inteligente/Recientes/Top Semanal/Mensual.
- **ModalCrear:** Sin BPM/Key/Tipo manuales (IA). **Naming:** `kamples_{tipo}_{genero}_{usuario}_{idCorto}.wav`. **Dedup:** Hash perceptual diferido.
- **Precios sincronizados en:** StripeService, PlanesIsland, LandingPublica, roadmap.

---

## Lecciones Aprendidas (gotchas — reglas generales en test.instructions.md)

### PHP / PostgreSQL / WordPress
- `apiGet` hace `json.data ?? json` → NUNCA `resp.data.data`. Tipear `RespuestaApi<T[]>`.
- PG TEXT[] requiere `'{val1,val2}'` + `pgArrayAPhp()`. PDO devuelve string `"{}"` — parsear.
- Backend snake_case, frontend camelCase — normalizadores obligatorios. IDs: `String()` en comparaciones.
- PageManager: `reactPage('padre/hijo')` NO auto-crea padre WP. `\filter_var`, `\session_id` en namespaces.
- PDO `ATTR_EMULATE_PREPARES=false`: excepción si params tiene keys sin placeholder. Prohibe reusar placeholder (`:uid` x2 → `:uid2`).
- Columnas PG: verificar nombres exactos (`creador_id` NO `usuario_id`). `(int) get_param('page')` → 0 si ausente → `max(1, ...)`.
- Colecciones imagen: `imagen_url` (canónica), `portada_url` (legacy). Todo write → `imagen_url`. Frontend: `imagenUrl`.
- PG credenciales: EXIGE `KAMPLES_PG_USER`/`KAMPLES_PG_PASSWORD` en .env. LogModeracion: solo 2 args. Cache Feed: transients → `invalidarCacheGlobal()`. Créditos = COUNT hoy vs límite + `creditos_bonus`.
- `wp_handle_upload()` solo wp-admin → require `includes/file.php` en REST.

### Repository / Schema System
- `contarConFiltros`/`listarConFiltros`: WHERE dinámico. JOINs en repo principal. `crearConConflict` para upserts.
- BaseRepository::estaConectado() wrappea PG. NormalizadorSample::sqlSelectSamples(?int $userId) para SELECTs con JOIN.
- Cols en `App\Config\Schema\_generated\`. Sentinel: param keys y SET clauses → Cols constants. SQL aliases strings OK.
- Union types TS de `ISamples['tipo']` → si se regenera, TS rompe. Interfaces manuales porque API normaliza a español.
- Regex `validarQueryContraSchema()`: NUNCA negative lookahead → usar `\b`.

### React / TypeScript
- React Compiler: no `Date.now()` en render/useMemo, no refs `.current` en render. PageRenderer: render-time state update.
- `npm run type-check` tras refactors. CampoTexto onChange: `as unknown as`. useTabsIsla(islaId, tabs, activaInicial).
- copiarAlPortapapeles fallback execCommand http. `getState().abrir()` fuera de React. CustomEvent para refrescar feeds.
- MAPA_RUTAS en LayoutPrincipal.tsx actualizar al añadir sidebar. crearModalStore: consumirArchivo() retorna+limpia File.
- Badge variantes: neutro|acento|exito|error|advertencia|info|premium. Hooks JSX → `.tsx`.
- Sentinel hooks excluidos de `usestate-excesivo` por nombre. Cleanup: `return () =>`, AbortController, `activo = false`.
- [Explorador]: Filtrado client-side useMemo <500 items. `metadata.carpeta_secundaria` en API. `jsonb_set()` atómico. PipelineAudio `ia_carpeta_*` inmutables. `<img draggable={false}>` para drag cuadricula.
- [Tags]: Normalizar SIEMPRE a lowercase antes de almacenar. `normalizarTags()` en NormalizadorSample. `sqlTagsEnriquecidos()` aplica LOWER() como defensa en profundidad. 2 puntos de entrada: SamplesUploadController + SamplesModificacionController.
- [Comunidad]: Feed 'todos' usa scoring CTE 2 niveles (listarFeedPuntuado). 'populares'/'siguiendo'/autor siguen con ORDER BY simple. Config en algoritmoPesos['comunidad'].
- [Búsqueda]: ts_rank con plainto_tsquery('spanish', ...) para stemming. ILIKE se mantiene en WHERE para filtrado, ts_rank se usa solo para ORDER BY. PDO EMULATE_PREPARES=false exige nombres únicos (:busquedaRank, :busquedaTituloRank, :busquedaTagLike).
- [PublicacionesEnums]: Schema no tenía check constraint para moderacion_estado → enums no se autogeneraban. Fix: agregar check en schema + constantes manuales en Enums.
- [Social]: URLs repost: `/publicaciones/${id}/repost`. Lightbox timer 220ms. EVENTO_ENTIDAD_ACTUALIZADA constante. Rollback: snapshot previo. SIEMPRE TarjetaPublicacion para posts. `utils/tiempo.ts` centralizado.
- [HTML]: NUNCA anidar `<a>` en `<a>` ni `<button>` en `<a>`. Patrón: div wrapper + enlace subzona + menú fuera del `<a>`.
- [GloryContext]: declaration merging `global.d.ts` SOLO campos nuevos opcionales. PROHIBIDO re-declarar existentes. devMode: `=== true`.

### CSS / UI
- `:has(.reproductorGlobal)` bottom dinámico. `pointer-events` NO animable → `::before` bridge.
- No select nativo → MenuContextual. SVG flex: `flex-shrink:0`. Colors DAW: loop→acento, mute→error, solo→advertencia.
- CSS vars rem/px → `--espacioX`/`--fuenteX`. VarSense mappings: bordeSubtle→bordeSutil, fondoSecundario→fondoElevado2, textoBase→textoPrimario, textoTenue→textoTerciario, textoAlto→blanco, verde→exito, rojo→error, radioCirculo→radioFull.
- [BotonBase]: `.botonBase.tamanoMd` (especificidad 2) sobreescribe 1 clase → Fix: `.contenedor .clase.botonBase` (3+). Usar `<MenuContextual>` en 3-puntos. Input header: override contextual sin props extra.

### Mezclador / Channel Rack / Piano Roll
- Aislado `/Mezclador/` tsconfig propio. AudioContext singleton. `detune+playbackRate → rate * 2^(detune/1200)`. Stretch: `playbackRate = buffer.duration/(durCompases*durCompas)`.
- Undo: sin audioBuffers, MAX=30. Fin real: max bloques. BPM mid-playback: ratio newBpm/oldBpm.
- Selección múltiple: Set<string>, Ctrl+click, Shift+drag=duplicar. MinimapaDaw: DOM+rAF. SoundTouchJS 0.3.0.
- PPQ=96. Canvas grid + DOM notas. GhostNotas: culling viewport. VentanaFlotante: ventanasStore Map<id>.
- Pan: StereoPannerNode [-1,1]. Declicking micro-fades. masterAnalyser fftSize=2048. FFmpeg waveform: f32le ac1 ar8000 60 barras.

### Desktop Tauri 2.0
- JWT dual: nonce WP (web) + Bearer JWT (desktop). JwtService AUTH_KEY HS256.
- `@crabnebula/tauri-plugin-drag` v2.1.0. `startDrag({item, icon})` — icon OBLIGATORIO. `onDragStart` (no onMouseDown).
- Build: solo `vite build`. Aliases replicados de Glory. cargo check ~5min primera vez.
- Proxy Vite `/wp-json`+`/wp-content` → glory.local. URL rewriting relativas en fetch interceptor.
- `window.location.href` → usar `navegar('/')`. Store: `"store": {}`. Updater: deshabilitar sin pubkey.
- Dynamic imports `@desktop/` rompen build web → exponer en `window.__KAMPLES_*__` desde entry desktop.
- `obtenerWpUserId()` intentar JWT si `get_current_user_id()==0` (endpoints públicos /feed).
- Tray: solo uno (conf o Rust builder). `inicializarAuthDesktop()` token+usuario ANTES de montar React.
- tauri-plugin-fs watch: `features = ["watch"]` en Cargo.toml. Sync: hash parcial 8KB+tamaño. MOVE=DELETE+CREATE (grace 5s). Self-trigger: `descargasEnCurso` Set. Carpetas server implícitas. Post-upload PUT carpeta prioridad local.
- [Sync v2]: Tracking key format `"{sampleId}_{coleccionId}"` (coleccionId=0 si null). Tauri Store type assertion: `{ get, set, save }` interfaz explícita (no ReturnType). syncService expone todo via `window.__KAMPLES_SYNC__` — nunca import directo desde web.
- [Tray→Panel]: `Emitter` trait necesario en import Rust para `app.emit()`. `TrayIconEvent::Click` requiere `MouseButton::Left` + `MouseButtonState::Up`. Listener frontend: `useSyncStore.getState().abrirPanel()` accede al store Zustand fuera de React.
- [VarSense mappings extra]: `--superficie`→`--fondoElevado2`, `--colorAlerta`→`--advertencia`, `--colorExito`→`--exito`, `--colorError`→`--error`, `--colorTextoSecundario`→`--textoSecundario`, `--colorSuperficieHover`→`--fondoElevado2`, `--borderRadiusSm`→`--radioSm`, `--fuenteBase`→`--fuenteMd`. `rgba(0,0,0,0.7)`→`var(--overlayOscuro)`, `rgba(0,0,0,0.4-0.55)`→`var(--overlaySuave)`.
- [Sentinel splits]: AdminController → AdminModeracionController (moderación routes delegadas via `AdminModeracionController::registrarRutas($namespace)` desde registrarRutas del padre). PipelineAudio helpers → PipelineAudioHelpers (construirNombreArchivo + actualizarSample). ColaProcesamientoIaCols::TODAS para `SELECT` explícito.
- [fileWatcher carpetas]: RENAME directorio = DELETE+CREATE secuencial. Grace 3s con Map. Solo first-level dirs (sin extensión audio + hijos directos de carpetaBase). `procesarEventoCarpeta` antes de `procesarEvento` audio.
- [Build WDAC]: OneDrive sincroniza `target/` → WDAC bloquea build-script-build.exe (os error 4551). Fix: `.cargo/config.toml` con `target-dir = "C:\\cargo-target\\kamples"` redirige fuera de OneDrive. Bundles en `C:\cargo-target\kamples\release\bundle\`.
- [Sync window standalone]: Multiwindow Tauri: `sync.html` + `sync.tsx` como entry point separado. `tauri.conf.json` define window `sync-panel` (frameless, always-on-top, skip-taskbar, hidden). Rust `mostrar_ventana_sync()` posiciona en esquina inferior derecha (`monitor.size() - ventana - margen - 48px taskbar`). VentanaSincPanel usa `data-tauri-drag-region` + `-webkit-app-region: drag` para barra superior. `getCurrentWindow().hide()` en vez de destruir. `onFocusChanged` re-abre panel store al mostrar. `principal.json` capabilities: `["main", "sync-panel"]`.
- [MPA Vite]: `rollupOptions.input` acepta múltiples HTML entries. Cada entry tiene su propio CSS bundle + JS chunk tree. Sync window importa `@/index.css` directamente para tener variables CSS.
- [Sync window bugs]: `window-state` plugin restaura visibilidad de sesiones previas → `with_denylist(&["sync-panel"])` excluye del state save/restore. No desactivar focus en config de ventana popup (si no, blur/focus deja de ser confiable). Cierre al click fuera implementado también en backend Rust con `on_window_event(WindowEvent::Focused(false)) -> hide()`. sync.tsx NO debe llamar `inicializarDesktop()` completo — solo `configurarApiDesktop()` + `inicializarSyncService()`. Root cause de estilos: `App/Assets/css/init.css` estaba vacío; para ventana sync cargar variables reales desde `App/React/styles/variables.css` + `botonBase.css` + `sincronizacion.css` en imports directos de sync.tsx. `sync.css` queda solo para estilos shell.
- [Sync minimal UI]: Ventana sync minimalista sin tabs ni header. Estructura: barra superior mínima solo con ícono `...` (derecha), cuerpo con lista de historial simple, footer fijo con estado + ícono de carpeta para abrir ruta local. Historial debe cargarse al abrir panel (no depender de tab activa). Acción abrir carpeta expuesta en `syncService` como `abrirCarpetaSync()` usando `@tauri-apps/plugin-shell`.
- [Sync minimal UI v2]: Menú `...` funcional (Sincronizar ahora, Elegir carpeta, Abrir carpeta, Pausar/Activar sync, Ocultar panel). Topbar incluye perfil a la izquierda (avatar + nombre). Filas de historial: miniatura si existe (`imagenUrl|miniaturaUrl|coverUrl`) o icono fallback, tiempo relativo, icono de estado al final. Normalización de mojibake (`ColecciÃ³n` → `Colección`) en render. Estado footer con icono `Inactivo` dedicado (`CircleDotDashed`) y texto capitalizado.
- [Sync perfil desktop]: `GLORY_CONTEXT.currentUser` puede venir vacío en ventana `sync` (no monta flujo auth completo). Solución: leer `auth_usuario` desde `auth.json` (Tauri Store) en `VentanaSincPanel` y usarlo como fuente principal de `nombre/avatar`, con fallback a `GLORY_CONTEXT`.
- [Sync encoding]: Archivos con doble encoding (UTF-8→Win1252→UTF-8) producen mojibake en runtime: `ó`→`Ã³`, `á`→`Ã¡`. Constantes legacy DEBEN usar escapes Unicode explícitos (`\u00c3\u00b3`) después de corregir encoding del source, si no la detección de carpetas legacy falla. `replaceAll` requiere ES2021+ — usar `split().join()` si target es ES2020.
- [Sync state]: `ejecutarSyncConProgreso` sin try-catch interno = spinner infinito si sync lanza. `sincronizarAhora` debe pasar `{ forzar: true }` para que funcione con auto-sync pausado. `historial` en deps de useEffect que modifica historial = intervalo recreado infinitamente → usar `useRef`.
- [Sync uploads]: `uploadQueueService.onProgresoUpload()` existe pero nadie lo consume = 0 feedback visual al arrastrar archivos. Conectar en el hook del panel con `useEffect`.
- [Sync uploads historial]: Feedback en vivo NO reemplaza persistencia. Toda subida local debe registrar `trackingModule.registrarAccion({ tipo: 'subida' })` (vía `registrarSubidaLocal`) o el panel queda vacío al reabrirse aunque el upload haya ocurrido.
- [Sync window uploads]: `sync.tsx` DEBE exponer `window.__KAMPLES_UPLOAD__` igual que `main.tsx`. Sin él, `usePanelSincronizacion` obtiene `null` al llamar `obtenerUpload()` → callback de progreso nunca se registra → 0 feedback visual de subidas. Además, escribir historial persistente en CADA etapa del upload (encolado → subiendo → subido/error) porque si la subida falla (ej: entorno local sin servidor de uploads), `registrarSubidaLocal` nunca se ejecuta y el panel muestra vacío.
- [Sync window auth]: `sync.tsx` DEBE llamar `inicializarAuthDesktop()` ANTES de `configurarApiDesktop()`. Sin esto, `obtenerToken()` retorna null (el token vive en memoria y nadie lo cargó del Tauri Store), `configurarApiDesktop` no llama `inyectarAuthHeader` → TODOS los fetch van sin Authorization → 401. Root cause: la ventana sync es un entry point separado que NO ejecuta `inicializarDesktop()` completo.
- [Sync carpetas sistema]: La carpeta "Sin colección" es local-only, no una colección del usuario. El watcher de carpetas debe excluirla (y variantes legacy/sin-tilde) de `crearColeccionDesdeLocal` y `renombrarColeccionEnServidor`. Set de nombres normalizados a lowercase como blacklist.
- [Sync historial reintentos]: Escribir "subiendo" en historial persistente solo en primer intento (`intentos === 0`). Los reintentos usan el footer en tiempo real via `emitirProgreso`. Sin este guard, 3 reintentos = 3 entradas "Subiendo" idénticas que inundan el panel.
- [Sync migración v1→v2]: Después de migrar de v1 a v2, BORRAR la key `sync_indice` del Tauri Store (`store.set('sync_indice', null)` + `store.save()`). Si no, el check `totalArchivos() === 0 && indiceArchivos.length > 0` se cumple de nuevo en cada reinicio y migra repetidamente, generando entradas duplicadas en historial.
- [Sync historial per-sample]: Modelo `EntradaHistorialSample` con upsert dual-index: `indiceSampleHistorial` (Map<sampleId, index>) + `indiceNombreSampleHistorial` (Map<nombreLower, index>). Pre-upload usa nombreArchivo como key (sampleId=0). Post-upload actualiza con sampleId real. `obtenerImagenSampleDesdeServidor()` async post-upload para imagen de portada. MAX_HISTORIAL_SAMPLES=100. El legacy `AccionHistorial[]` se preserva para `SincPanelTabs`.
- [Sync click-to-navigate]: `invoke('abrir_carpeta', { ruta })` desde Tauri. `VentanaSincPanel` envuelve cada fila de historial en div clickable que abre la ubicación del archivo en el explorador del sistema.
- [Sync seleccionar archivo]: Para resaltar el archivo en el explorador (no solo abrir la carpeta), usar `explorer /select,"ruta"` en Windows y `open -R "ruta"` en macOS. Comando Rust `seleccionar_archivo` registrado en invoke_handler. Reemplaza `abrir_carpeta` en el historial per-sample.
- [Sync ventana transparent]: Para bordes redondeados visibles en ventana frameless, `transparent: true` en tauri.conf.json + `background: transparent` en html/body/root + box-shadow en el contenedor React. Sin `transparent:true`, los píxeles de esquina son siempre opacos aunque el CSS diga `border-radius`.
- [Sync toggle tray]: El `onFocusChanged(false)` del frontend ocultaba la ventana ANTES de que el Rust toggle verificara `is_visible()`, rompiendo el toggle. Fix: mover el hide al backend Rust con `std::thread::sleep(220ms)` + verificar `is_focused()` antes de ocultar. El handler frontend solo cierra el menú y sincroniza el store.
- [Sync menu click-outside]: `useRef` en el div wrapper del botón (BotonBase no tiene forwardRef) + `useRef` en el contenedor del menú. `useEffect` con `document.addEventListener('mousedown')` activo solo cuando `menuAbierto=true`. Verificar contains() de ambos refs antes de cerrar.
- [Sync parallelism]: Clase `Semaforo` (semaforo.ts) para limitar concurrencia en uploads/downloads. Patrón: `await semaforo.adquirir()` → trabajo → `semaforo.liberar()` en finally. `cambiarLimite()` permite ajuste dinámico sin recrear instancia.
- [Sync debounce store]: `persistirConDebounce` (persistenciaDebounce.ts) wrappea escrituras Tauri Store con timer. Clave única por store key. `flushTodo()` en `beforeunload` para no perder datos. Clave de colección Map = `storeFile:storeKey`.
- [Sync config avanzada]: `SyncConfigAvanzada` separada de config básica (carpeta, toggle). Permite añadir campos sin migración. Defaults defensivos en `cargarConfigAvanzada()`. Panel UI en overlay modal (ConfiguracionSync.tsx).
- [Sync papelera]: Movimiento físico a `.papelera/` dentro de raíz sync. Persistencia en `papelera.json` Tauri Store separado. `purgarExpirados()` debe ejecutarse al inicializar. Duración configurable via `SyncConfigAvanzada.papeleraDuracionDias`.
- [Sync borrado bidireccional]: Rate-limiting obligatorio en borrado local→servidor. Sin él, drag 1000 archivos a Trash = 1000 DELETEs instantáneos. Mapa `contadorBorradosCiclo` con reset por timer (5min). Soft-delete via `?soft=true` en endpoint DELETE permite al servidor mover a papelera en vez de eliminar permanentemente.
- [Sync indices Map]: `indiceArchivosPorRuta` y `indiceArchivosPorNombre` (Map) en syncState. Reconstruirse después de `cargarDatos()`, migración, y cada `registrarArchivo()`/`eliminarArchivo()`. Lookup O(1) reemplaza `Object.values().find()` O(n) en watcher hot path.
- [Config MPA window]: Ventana config como entry point MPA separado (`config.html`+`config.tsx`). **DEBE declararse en `tauri.conf.json` con `visible: false`** (pre-creada al inicio), NO crearse dinámicamente con `WebviewWindowBuilder`. En Windows, `WebviewWindowBuilder::build()` bloquea el main thread durante la inicialización de WebView2, causando deadlock que congela TODAS las ventanas. El comando Rust solo hace show/center/focus. Como la ventana no se destruye (solo hide), el hook `useConfiguracionSyncVentana` re-lee del Tauri Store al ganar foco (`onFocusChanged`) para mostrar datos frescos.
- [Inter-window Tauri events]: Comunicación entre ventanas (config→sync) via `emit('config-sync-actualizada')` + `listen()`. Stores Zustand NO se comparten entre MPA windows (contextos JS separados). La ventana receptora debe re-leer del Tauri Store file.
- [Config window import isolation]: La ventana config crasheaba porque `useConfiguracionSyncVentana` importaba de `syncState.ts` → `desktopService.ts` → `syncService.ts` (655 lín) → cadena completa de servicios sync. La evaluación de todo el árbol de módulos en un contexto nuevo sin globals inicializados causa freeze. Fix: `syncConstants.ts` (ZERO imports) con tipos + constantes. `syncState.ts` re-exporta para compatibilidad. Hook importa de `syncConstants` directamente. **Regla general MPA:** cada entry point debe importar SOLO lo que necesita; nunca tirar de un módulo "state" que depende de servicios pesados si solo necesitas tipos/constantes.
- [Rename race condition]: `moverArchivoASinColeccion()` hace `rename()` interno que genera CREATE en watcher. Solución: `marcarDescargaEnCurso(nuevaRuta)` ANTES del rename. El grace period de 10s (GRACIA_DESCARGA_MS) cubre el procesamiento async del watcher.
- [v1/v2 index fallback]: `manejarMoveLocal` debe buscar en tracking v2 como fallback si v1 index no tiene el archivo. Descartar silenciosamente por fallo de lookup v1 pierde moves legítimos en archivos migrados o con v1 desincronizado.
- [Drag region MPA]: En ventanas frameless con botones custom, **NUNCA** usar `data-tauri-drag-region` en el div padre que contiene botones. El atributo HTML sobreescribe CSS `app-region: no-drag` en hijos. Usar solo CSS `app-region: drag` en header + `no-drag` en contenedor de botones.
- [Explorer /select Windows]: `std::process::Command::new("explorer").arg(formato_select_ruta)` falla con rutas con espacios porque Rust wrappea en comillas automáticamente. `explorer.exe` no parsea `/select,"ruta con espacios"`. Fix: usar `CommandExt::raw_arg()` (stable desde Rust 1.62).
- [Colección dedup 3 capas]: Watcher emite create + modify para una carpeta nueva → dos callbacks `onCarpetaNueva`. Fix: debounce `carpetasRecientes` Map (5s). Capa 2: tracking check pre-POST. Capa 3: backend check-before-insert case-insensitive. TO-DO: UNIQUE constraint DB.
- [Upload dedup pre-flight]: El tiempo entre `encolarArchivo` y `subirArchivo` (semáforo, backoff) permite que otro upload complete. Verificar tracking v2 + hash justo antes del POST, no solo al encolar. Persistir hash inmediatamente tras cada upload (no al fin de la cola).
- [Pipeline imagen post-upload]: La imagen de portada se genera async en backend. Fetch inmediato retorna null. Retry con backoff (4s→12s→30s→60s) cubre la latencia del pipeline.
- [API endpoint samples GET]: La ruta es `/samples/{slug}` (string), NO `/samples/{id}` (numérico). `obtenerImagenSampleDesdeServidor` debe usar `resultado.slug`, no `resultado.sample_id`. La respuesta va envuelta en envelope `{ data: { imagenUrl, ... } }` — siempre desenvolver.
- [Tauri 2 core:default permisos]: `core:default` incluye `core:window:default` que es SOLO lectura (isMinimized, isVisible, size, etc.). Mutaciones como `minimize()`, `hide()`, `show()`, `setFocus()`, `center()`, `close()` requieren permisos explícitos: `core:window:allow-minimize`, etc. Sin ellos, las llamadas JS fallan silenciosamente — los catch vacíos ocultan el error.
- [Rehidratación historial]: Corregir solo el fetch de imagen post-upload no arregla entradas YA persistidas con `imagenUrl: null`. Al iniciar sync, `rehidratarImagenesPendientes()` hace batch GET `/samples?creador=username&per_page=100`, construye mapa sampleId→imagenUrl y actualiza todas las entradas sin imagen. Una request, N actualizaciones. El endpoint de listado envuelve en doble envelope: `{ data: { data: [...], pagination } }`.
- [Watcher papelera]: `.papelera/` está DENTRO de la carpeta sync → el watcher la observa recursivamente. Todo rename a `.papelera/` genera CREATE visible para callbacks → re-upload fantasma. Excluir SIEMPRE carpetas internas del watcher con `CARPETAS_EXCLUIDAS`.
- [Papelera guard]: `moverAPapelera()` NO usaba `marcarDescargaEnCurso()` como sí lo hace `moverArchivoASinColeccion()`. Toda operación que genera rename dentro de la carpeta sync DEBE usar el guard.
- [OneDrive readFile]: `readFile` de Tauri falla con ruta truncada en archivos cloud-only de OneDrive. Pre-check con `exists()` + mensaje descriptivo.
- [OneDrive watcher path]: `watch()` puede emitir rutas equivalentes con formato distinto (`\\` vs `/`, casing). Cualquier dedup por ruta en cola DEBE usar clave normalizada canónica.
- [Sync portada desktop]: `imagenUrl` puede venir relativa (`/wp-content/...`). En ventana Tauri/MPA debe resolverse contra el origen del servidor; si no, `<img>` apunta al origen local de la app y no carga.
- [Dedup timestamp]: El prefijo `${Date.now()}_` de la papelera rompe comparaciones por nombre. Normalizar con `nombre.replace(/^\d{13,}_/, '')` antes de dedup.
- [Idempotency uploads]: Sin idempotency key server-side, retry de upload = duplicado. Patrón: `X-Idempotency-Key` header + check-before-insert en backend.

### Sentinel / Análisis Estático
- `sentinel-disable-file` en docblock, `sentinel-disable-next-line` línea inmediatamente anterior.
- PS WriteAllLines corrompe template literals. CTEs excluidas de `repository-sin-whitelist`. BaseRepository excluido globalmente.
- `usestate-excesivo`: 3 × numComponentes. Hooks: 300 lín máx. Brace counting bug: `} catch (e) {`. Tests: `npx mocha --grep`.

### Terminología y Patrones
- **"Coleccionar" (+):** = descargar. Crédito. Tabla `descargas`. Desktop: sync. Campo: `yaColeccionado` (o `esMio`).
- **"Guardar en colección" (Bookmark):** Tabla `coleccion_samples`. NO crédito. Campo: `yaGuardadoEnColeccion`.
- Ambos + `yaComentado` + `esMio` en sqlSelectSamples() subqueries. Repos deben aceptar `?int $userId`.
- Cache Transients: invalidarCacheGlobal() SQL LIKE. TTL 5min. WP-CLI no disponible LocalWP.
- Keep-alive: 4 causas (MAX_CACHE=5, tabActiva global, rutaActual hooks, useTabsIsla reset). Fix: MAX=20, useIslaActiva, useValorCongelado, tabsPorIsla.


