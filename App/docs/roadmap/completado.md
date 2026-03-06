# Kamples — Completado

> Registro de todo el trabajo completado. Para tareas pendientes ver `pendientes.md`.

---

## Completado (ultra-compacto) — F0-F7+

- **F0-F7:** Schema 14 tablas, PostgresService, API REST, CSS system, colors/ dinámicos, FFmpeg, Login/Registro, Perfil, ModalConfiguracion, Auth, LandingPublica, Upload real (FormData+pipeline+IA), WaveformPlayer, ReproductorGlobal, AnalizadorAudio, ServicioIA, PipelineAudio, tags, deduplicación, DescubrirIsland, endpoints feed/notif/msg/dashboard, BotonFollow/Like, ModalPublicar, InicioIsland, ModalFiltros, infinite scroll+virtualización, LibreriaIsland, ColeccionesController CRUD, ChatFlotante multimedia, DashboardCreador, SPA navigation, SampleDetalle, ColeccionDetalle, ComunidadIsland, MensajesIsland, ChatIsland, NotificacionesIsland, Stripe Billing, PlanesIsland.
- **F9 Desktop:** Tauri 2.0 MVP completo (tray+menu, 6 servicios TS, JWT backend, Vite proxy, auth, sync bidireccional, drag-to-DAW nativo, auto-sync). Build: exe+MSI+NSIS. Sync optimizado 1000+ samples (semáforo paralelo, debounce store, Map O(1), config panel, papelera 30d, borrado bidireccional).
- **F13 parcial:** AdminController 6 endpoints, 3 tabs (Resumen+Usuarios+Moderación).
- **SOLID PHP:** KamplesController 1713→60 lín (12 sub-controllers). Repository Pattern: 27 controllers, ~340 queries → 18 repos. Schema System: 18 schemas + 36 generados + Enums 8 tablas.
- **React:** ~50 componentes + ~50 hooks. Sentinel: 48 reglas, 325+ violaciones corregidas. Mezclador DAW aislado (`/Mezclador/`, 50+ archivos, CR+Patterns+Mixer+Piano Roll). 5 auditorías (~275 hallazgos, ~95% resueltos).
- **Social/Explorador/Desktop:** Repost, TarjetaPublicacion unificada, PublicacionIsland, lightbox, ColeccionDetalle edición, Explorador (filtrado client-side, subcarpetas, breadcrumbs, drag-drop, carpetas, jsonb_set), keep-alive SPA (MAX_CACHE_PAGES=20, useIslaActiva, useValorCongelado), panel moderación.
- **Sprint UI/UX C343-C354:** Tags no-compress, badges clickable, filtros rediseño, librería keep-alive, botones volver, subcarpetas, explorador file-manager, admin chart, moderación, créditos ilimitados, Sentinel SQL/key fix, BotonBase neutralized, drag cuadricula, restaurar ubicación IA, botones eliminar sample admin.

---

## Completado — Auditorías Algoritmo

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

---

## Completado — Sprint Sync v2 + Cola IA + UI (C353-C358)

> Todas las tareas implementadas y commiteadas. Referencia de arquitectura en `referencia-sync.md`.

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

## Completado — Fixes Sync (C379-C386)

- **C379** Fix sync: imagen_url + coleccion_samples + guard carpeta. SyncController.php incluye `imagen_url` en normalización. `agregarSampleAColeccion` (POST /colecciones/{id}/samples) creada en syncCollectionService. uploadQueueService: resolver coleccionId real desde tracking → agregar a coleccion_samples post-upload + crear colección si no existe. Guard pre-upload descarta items fuera de carpeta sync configurada. `offlineQueueService`: tipo `agregar_sample_coleccion` agregado.
- **C380** Guard carpeta sync 3 capas. Items residuales persistidos en Tauri Store de antes de C378 se reintentaban indefinidamente. Fix: `estaEnCarpetaSync()` centralizada (normaliza separadores+casing). Guard aplicado en: (1) `encolarArchivo` — rechaza al encolar, (2) `inicializarUploadQueue` — purga items viejos del Store, (3) listener `reintentar-errores-upload` — purga al recargar, (4) `subirArchivo` — última línea de defensa.
- **C381** Debounce carpeta + upload-coleccion + imagenes. (a) fileWatcherService: delay 3s antes de notificar carpeta nueva — Windows crea "Nueva carpeta" y renombra; si rename llega antes del timeout, se cancela creación con nombre temporal. (b) uploadQueueService: eliminada rama que creaba colecciones durante upload (race condition con folder handler → duplicados + 403). Si tracking no tiene la colección, solo metadata y se reconcilia en sync. (c) syncService: `rehidratarImagenesPendientes()` ahora corre después de cada `sincronizarColecciones`, convergiendo imágenes async del pipeline.
- **C382** Fix 5 bugs sync. (1) Historial reaparece: race condition multi-ventana MPA → `limpiarHistorialSamples()` emite evento Tauri. (2) Duplicados servidor: `rutasEnVuelo` Set. (3) Rename carpeta: encola a offline queue en error. (4) Imágenes nunca aparecen: `__KAMPLES_CONFIG__` + `persistir()` read-merge-write. (5) Falsos duplicados: hash eviction + eliminar `buscarArchivoPorNombre`.
- **C384** Fix uploads fantasma + move sin colección. (1) `exists()` en restauración store. (2) `crearColeccionDesdeLocal` idempotente cuando coleccionIdResuelta null. `manejarMoveLocal` asegura colección destino.
- **C384b** Fix ciclo infinito reintentos. Retornar `true` (completado) cuando archivo no existe. Listener solo resetea `intentos < MAX_REINTENTOS`. Filter al cargar store.
- **C385** Escaneo local en "Sincronizar ahora". `escanearCarpetaYEncolar()` scan readDir 2 niveles, skip carpetas sistema. Se invoca en startup + listener Tauri `escanear-subidas-local`.

---

## Completado — Sprint Bugs Sync Desktop (C362-C386)

- **C362** ✅ Imagenes samples no se actualizan en sync panel. Fix: `obtenerImagenSampleDesdeServidor` corregido (slug, envelope). `rehidratarImagenesPendientes()` batch fetch al iniciar.
- **C363** ✅ Ventana configuracion no se minimiza ni cierra. Fix: permisos Tauri 2 explícitos (`core:window:allow-minimize`, etc.) en `principal.json`.
- **C364** ✅ Click historial sync ubicación incorrecta. Fix: `raw_arg()` en Rust para `explorer /select,`.
- **C365** ✅ Samples se duplican al sincronizar. Fix 3 capas: verificación tracking+hash pre-POST, hash persistido inmediato, re-verificación pre-upload.
- **C366** ✅ Colecciones/carpetas se duplican al crear/recargar. Fix 3 capas: debounce watcher 5s, tracking check, backend check-before-insert.
- **C368** ✅ Ciclo Upload→Papelera→Re-Upload→Duplicado (7 tareas). Excluir `.papelera/` watcher, guard descarga, pre-check exists, normalización nombre dedup, idempotency key, consistencia historial, carpetas excluidas.
- **C369** ✅ Hardening post-C368. Guard `rutasEncolando` síncrono, `hashesEnVuelo`, historial copias shallow, polling imagenUrl, MPA `recargarHistorialDesdeStore`, migración idempotencyKey, rename guard `marcarMovimientoInterno`.
- **C370** ✅ Hotfix OneDrive duplicado + not found + papelera. Dedup normalizada `/`+lowercase, rutas normalizadas en store, idempotencyKey determinística por hash.
- **C371** ✅ Hotfix portada no visible en Sync Panel. Resolver URLs relativas contra servidor.
- **C372** ✅ Hotfix portada tardía pipeline. `rehidratarImagenesPendientesSync()` con throttle 60s, compatibilidad `imagenUrl|imagen_url`.
- **C373** ✅ Root cause portada no visible: backend devolvía ruta filesystem. `NormalizadorSample::normalizar` usa `rutaAUrl()`.
- **C374** ✅ Solución anti-duplicado + anti-papelera accidental. Sync endpoint incluye estados visibles (`activo`, `procesando`, `en_supervision`), propio creador en sinColeccion, ventana de gracia 15 min.
- **C375** ✅ Watcher robusto: bloqueo por ruta real, no por nombre. Eliminar `buscarArchivoPorNombre`. Dedup solo hash+tracking.
- **C376** ✅ Retry anti-429 en crear colección + portada sync + eliminar panel embebido. Backoff exponencial, Retry-After, dedup en vuelo, TopBar sin PanelSincronizacion.
- **C377** ✅ Move local a carpeta nueva. TopBar bridge `window.__KAMPLES_SYNC__`, evento `modify.kind='name'`, fallback encola upload + crear colección.
- **C378** ✅ Bug crítico: watcher subía audios de Documentos. Guard `if (!relativa) continue` + `startsWith(base + '/')`.
- **C383** ✅ Fix imágenes sync + carpetas bidireccional + Explorar propias + eliminar tab Subidos. `soloLectura: true` sync panel, `__KAMPLES_CONFIG__` timing, rehidratación 15s, `explorarPublicas` con propias+boost, tab Subidos eliminada.
- **C384 (full-stack subcolecciones)** ✅ Migración `v022_subcolecciones.sql`, schema regenerado, ColeccionesRepository con tags subquery, CRUD parentId, SyncRepository parent_id, desktop services actualizados, FiltroSubcolecciones.tsx nuevo.
- **C385 (barraControl colecciones)** ✅ Tags agregación SQL, response anidada, apiColecciones reescritura, useLibreriaIsland filtrado/orden/aplanamiento, LibreriaIsland barraControl+tags+grid, TarjetaColeccion esSubcoleccion.
- **C386** ✅ Fix repositoryGenerate.mjs corrompía 18 repos. 5 bugs corregidos: colId(), ORDER BY, uses custom, código entre zonas, trim(). 18 repos restaurados.

---

## Completado — Sprint UI/Sync/Backend (C1-C9+C8.1)

- **C1** ✅ Skip "Nueva carpeta" temp names (NOMBRES_CARPETA_TEMPORAL) + delay 60s en fileWatcher antes de notificar carpeta nueva.
- **C2** ✅ Bordes izquierda eliminados de toasts/notificaciones (6 reglas CSS). Enter auto-acepta toast de confirmación.
- **C3** ✅ Auto-move subcarpetas creadas dentro de "Sin coleccion" a raíz (syncWatcherSetup onSubcarpetaNueva).
- **C4** ✅ Tags backend: endpoint `GET /tags/aggregates` con SQL UNNEST + jsonb_array_elements_text. Frontend useFeedFiltros debounce 400ms server-side. Elimina iteración client-side.
- **C5** ✅ Paginación 12 per page (SamplesController + apiSamples + useAlgoritmo).
- **C6** ✅ Dedup cross-folder en uploadQueueService: Map hash→ruta, detecta duplicados aunque estén en carpetas distintas.
- **C7** ✅ Thumbnails sync panel: cache-busting `?t=` + no-cache header en syncCollectionService. Rehidratación throttle 5s.
- **C8** ✅ Modals sin header (titulo prop eliminada de 7 modales). border-top editarAcciones eliminada. textarea auto-resize (field-sizing:content). Tipos reducidos a 2 en FormularioEditarSample.
- **C8.1** ✅ Inspector: useEffect + obtenerSample(slug) para cargar Sample completo (rutaOriginal, rutaOptimizada, estado, formato, tamano).
- **C9** ✅ Sistema de 2 tipos (loop/oneshot): SamplesSchema CHECK, SamplesEnums (4 constantes eliminadas), SamplesModificacionController, PipelineAudio, ProcesadorColaIA, GeneradorEmbeddings (map reducido), PasoMetadata, BienvenidaIsland, schema.ts.
- **Aprendizajes:**
  - [Tags]: SQL LATERAL + jsonb_array_elements_text es la forma correcta de agregar tags JSONB. UNNEST para arrays nativos.
  - [Inspector]: SampleResumen no tiene campos técnicos — siempre fetch full Sample si se necesitan.
  - [Tipos]: Cambiar enum system-wide requiere tocar ~15 archivos (schema, generated, controllers, pipeline, IA, embeddings, frontend). TO-DO: ALTER TABLE + regenerar schema.ts.
  - [field-sizing]: CSS `field-sizing: content` auto-resize textarea nativo, sin JS.

---

## Completado — Sprint D UI/UX + Branding (D3-D9)

- **D3** ✅ LogoKamples.tsx (SVG inline, props: tamano/color/className). TopBar logo con click home. favicon.svg actualizado. header.php `<link rel="icon">`. Desktop: favicon.svg copiado a icons/, resource registrado en tauri.conf.json. TO-DO: regenerar PNGs con `cargo tauri icon`.
- **D4** ✅ Admin tabs migradas a TopBar via useTabsIsla (keep-alive). AdminPanelIsland registra 4 tabs (Resumen/Usuarios/Moderacion/Cola IA). Eliminado adminPanelTabs interno + CSS.
- **D5** ✅ SelectorMenu.tsx (portal + getBoundingClientRect). EstadoVacio.tsx. BotonBase variante `ninguno`. CampoTexto con soporte `borderBottom`. 4 tabs admin refactorizadas (selects nativos → SelectorMenu, adminVacio → EstadoVacio). adminPanelTitulo eliminado.
- **D5b** ✅ Auditoría cola IA: 3 bugs críticos (marcarError 4→3 args, listarItems sin $tipo, polling frontend ausente). Doc en `App/docs/auditoria-cola-ia.md`.
- **D6** ✅ FiltroToggleDef con campo `descripcion`. 4 toggles con descripción debajo. Padding aumentado a `espacioMd espacioLg`.
- **D7** ✅ ModalAcciones.tsx centralizado. CSS `.modalAcciones > .botonBase { flex: 1 }`. Migrados: ModalFiltros, ModalEditar, ModalColeccion.
- **D8** ✅ MetadataChips eliminado. SelectorBase→SelectorMenu en FormularioEditarSample. PHP endpoint `POST /samples/{id}/imagen` (finfo MIME validation, 5MB limit, ownership check). subirImagenSample en apiSamples.ts. Preview 80x80 en modal con cambiar/limpiar.
- **D9** ✅ Sistema skeleton loading: 6 componentes (Skeleton, SkeletonFeed, SkeletonPerfil, SkeletonTarjetaSample, SkeletonTarjetaColeccion, SkeletonTarjetaPublicacion). skeleton.css con @keyframes skeletonPulso. 16 islands migradas de texto "Cargando..." a skeletons. Fix preexistente: ModalFiltros variante="ninguno" → variante="ghost" tamano="ninguno".
- **Aprendizajes:**
  - [RefObject]: `RefObject<HTMLInputElement>` (sin `| null`) para compatibilidad con React 18 `LegacyRef`. El `useRef<T | null>(null)` en el hook está bien.
  - [SelectorMenu]: Portal con getBoundingClientRect + scroll listener para reposicionar. click-outside para cerrar.
  - [useTabsIsla]: Patrón reutilizable para registrar tabs de islands en TopBar con keep-alive. El store usa Map por islaId.
  - [Image upload]: FormData con key `imagen`, MIME validation con finfo_file(), move_uploaded_file() a wp_upload_dir.
  - [CSS modular]: ModalAcciones como componente CSS compartido evita duplicar estilos de acciones en cada modal.
  - [Skeleton]: Componentes skeleton por tipo de tarjeta (sample grid 40px|1fr|auto, colección flex col, publicación article layout). SkeletonFeed repite SkeletonTarjetaSample × cantidad. Animación pulso con opacity 0.45↔0.25 en 1.5s.
  - [Cola IA]: `marcarError()` maneja reintentos internamente (buscarPorId+intentos). El caller no debe pasar intentos, solo minutosEspera. listarItems necesita `$tipo` para filtrar por tipo procesamiento.
  - [Sentinel D2]: Regla `limite-lineas` funciona con 400 efectivas para services (path `/services/` o name `service`). ConstructorSenales y MotorRecomendacion son los únicos que exceden. lineCounter.ts excluye comentarios y blanks.
