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
- **Publicación UX:** Pegado desde portapapeles para imágenes y audios en SeccionPublicar y modales de creación. Ingesta de adjuntos unificada para input, drag-drop y paste. ModalPublicar legacy ahora reutiliza ContenidoCrear y se eliminó el hook/CSS duplicado.
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
- **C387** ✅ Historial sync panel converge a la portada actual del sample. `syncService.ts` ahora reconcilia `imagenUrl` contra el snapshot completo de `/me/sync/colecciones` aunque la entrada ya tuviera imagen persistida; `syncTrackingService.ts` fusiona historial cross-window sin perder la portada más nueva; `VentanaSincPanel.tsx` añade versión `_sv` controlada al `src` y además usa el mismo fallback determinista `colors/` del resto de la app cuando el backend sync todavía devuelve `imagen_url = null`; `PipelineAudioHelpers.php` deja de filtrar `imagen_url` fuera de la whitelist de actualización.

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

---

## Completado — Sprint E Fixes + Landing (E1-E8)

- **E10** ✅ FilaColecciones hover card: cada colección ahora usa overlay interno con el nombre dentro de la portada; avatar + nombre del autor aparecen solo en hover/focus para mantener la fila limpia sin perder contexto.
- **E9** ✅ Branding home público deslogueado: `landingPublica.css` carga Junicode/Bricolage desde `App/Assets/fonts`, título principal a 128px en rem, subtítulos a 16px en rem, ancho máximo 1280px, header sin fijado/fondo y buscador con radio full en wrapper+botón.
- **E1** ✅ Landing page rediseñada: hero con buscador (busca en /explorar/?q=), 9 feature blocks en grid 3x4 (SeccionCaracteristicas.tsx) con overlay hover, tabla comparativa vs 4 competidores (TablaComparativa.tsx). Lógica extraída a useLandingPublica.ts. Nav con LogoKamples. CSS responsivo (3→2→1 columnas).
- **E2** ✅ 6 fixes de log: NormalizadorSample +3 cols (publicado_at, created_at, total_comentarios), AdminRepo MODERACION_ESTADO_PENDIENTE, ReportesRepo +import ReportesEnums, ServicioIA max_tokens 1500→2500, ReproduccionesRepository void→bool con try-catch FK, BD +moderacion_razon TEXT.
- **E3** ✅ Logo movido de TopBar a Sidebar (LogoKamples tamano=22, click→home). Favicon `<link>` después de `wp_head()` para override.
- **E4** ✅ editarImagenPortada: preview 100% width, min-height 120px, max-height 240px, object-fit cover. Estado vacío drop-zone con borde punteado.
- **E5** ✅ selectorMenu z-index: nueva variable --zMenuPortal:1100 (entre --zMenu:100 y --zModal:1000). Aplicada a overlay+dropdown.
- **E6** ✅ feedTagsLista: SQL cambiado de UNNEST(s.tags) a jsonb_array_elements de metadata->'tags' + 'tags_es' + 'artista_vibes' (solo IA). +CARPETA_DEFAULT const, +TransaccionesEnums import+uso.
- **E6b** ✅ Skeleton invisible: `--colorBorde` no existía en variables.css. Reemplazado por `--bordeSutil`.
- **E7** ✅ Sync no community: mostrar_en_comunidad='false'. carpetasGenericas expandida con folders OS/cloud. Filtro regex drive letters.
- **E7b** ✅ Sentinel lineCounter.ts: bloque `.ts` agregado antes de `.php` para detectar servicios/stores/modelos TS con sus límites (400/300 líneas).
- **E8** ✅ Sentinel ruleLoader.ts: exclusiones expandidas (+desktop, +Mezclador, +temp, +.vscode-test).
- **Aprendizajes:**
  - [CSS vars]: Siempre verificar que una variable CSS existe en variables.css antes de usarla. `--colorBorde` era fantasma.
  - [Landing branding]: Las medidas exactas del home público conviene guardarlas en `variables.css` y consumirlas desde `landingPublica.css`; las `@font-face` pueden quedar locales al landing para no cargar Junicode/Bricolage fuera del home deslogueado.
  - [Sentinel]: La detección de tipo de archivo en lineCounter.ts retorna `null` para archivos sin handler → 0 diagnósticos. Cualquier nueva extensión necesita handler explícito.
  - [Landing]: InputBusqueda tiene debounce (filtrado real-time), Input wrapper es mejor para submit-on-action (landing search).
  - [Tags feed]: metadata JSONB con COALESCE + || (concat arrays) permite extraer múltiples keys IA sin UNNEST de tags manuales.
  - [Favicon WP]: wp_head() puede inyectar su propio favicon. Poner `<link rel="icon">` después de wp_head() lo sobreescribe.

---

## Completado — Sprint Sync Bugs Desktop (C285-C289b)

- **C285** ✅ File lock os error 32 fix + 403 cleanup.
- **C286** ✅ userId scoping para tracking.
- **C287** ✅ TC1 merge guard, carpeta nueva skip, unpaired rename buffer.
- **C288** ✅ Journal recovery version sync + reconciliación periódica carpetas cada 15s.
- **C289** ✅ 6 bugs de sync corregidos (ver `App/docs/roadmap/c289-bugs-sync.md`):
  - Bug 1: Purga de 47 colecciones fantasma en tracking.
  - Bug 2: Actualización de rutaLocal+indiceRuta de archivos al renombrar colección (evita re-upload→duplicados).
  - Bug 3: Polling con soloEstructura=false para descargar samples del servidor.
  - Bug 4: Cache client-side 10s para obtenerColeccionesDelServidor (reduce 429).
  - Bug 5: Rate limits PHP aumentados (sync_colecciones 120/60s, sync_delta 200/60s).
  - Bug 6 (C289b): Reconciliación periódica de descargas cada 5 min — bypass del delta para reintento de samples pre-existentes o con descarga fallida.
  - Bug 7 (C289c): `descargarSiNecesario` verifica existencia en disco, no solo tracking. Limpia entradas fantasma + re-descarga si el archivo no existe realmente.
- **Aprendizajes:**
  - [Delta]: El delta sync es una *optimización*, no fuente de verdad. Siempre debe existir reconciliación periódica que compare servidor vs local independiente de eventos incrementales.
  - [Rename]: Al renombrar colección, hay que actualizar rutaLocal de TODOS los archivos hijos, no solo la colección. Si no, el watcher los ve como archivos nuevos.
  - [Cache]: Múltiples callers de un mismo endpoint sin coordinación → 429. Cache client con TTL corto (10s) es suficiente para polling sin perder freshness.
  - [Tracking vs disco]: El tracking es caché del estado del disco, no fuente de verdad. Cualquier decisión que omita operaciones críticas (descarga) basándose en tracking DEBE verificar disco con `exists()`.

---

## Completado — FASE 12 SEO Dinámico [AG-SEO]

- **12.1** ✅ SEO dinámico para páginas React Islands: RuntimeSeoData (store request-scoped), DynamicSeoResolver (hook framework `wp` prioridad 5), SeoKamples (resolvers para /sample/, /perfil/, /coleccion/).
- **12.2** ✅ JSON-LD completo: MusicRecording con AudioObject+InteractionCounter+Offer, Person con FollowAction, MusicPlaylist, BreadcrumbList dinámico, FAQPage para home+planes.
- **12.10** ✅ Sitemap XML: 3 providers WordPress nativos (samples activos, perfiles con samples, colecciones públicas). Paginación 2000/página.
- **SEO defaults**: Títulos y descriptions optimizados para home, descubrir, comunidad, planes, registro. Meta robots noindex para librería, favoritos, descargas, mensajes, auth/login, panel admin.
- **Meta tags**: Open Graph (og:type dinámico music.song/profile/music.playlist, og:audio para previews, og:image cascada), Twitter Cards (player card para audio), canonical dinámico, meta robots, meta keywords.
- **Archivos creados**: `Glory/src/Seo/RuntimeSeoData.php`, `Glory/src/Seo/DynamicSeoResolver.php`, `App/Kamples/Services/SeoKamples.php`, `App/Kamples/Services/SeoSitemapProvider.php`, `App/Config/seo.php`, `App/docs/plan-seo.md`.
- **Archivos modificados**: MetaTagRenderer, OpenGraphRenderer, JsonLdRenderer, SeoFrontendRenderer, SamplesRepository, UsuariosExtRepository, ColeccionesRepository, BaseRepository.
- **Aprendizajes:**
  - [SEO-WP]: wp_head() se ejecuta ANTES de renderReactIsland(). El callable de pages.php no puede inyectar SEO dinámico. Solución: hook en acción `wp` (antes de wp_head) con RuntimeSeoData estático.
  - [SEO-DIP]: Glory framework no debe depender de App. DynamicSeoResolver acepta callables registrados; SeoKamples (App) registra resolvers. Limpia separación framework/app.
  - [SEO-canonical]: Al remover `rel_canonical` del core WP, printCanonical DEBE tener fallback a get_permalink() para páginas sin canonical explícito.
  - [SEO-WP-Sitemaps]: WP_Sitemaps_Provider::get_url_list() y get_max_num_pages() no tienen type hints en stubs. Overrides DEBEN omitir type hints para compatibilidad PHP.
  - [SEO-consultarValor]: BaseRepository no tenía método para scalar queries (COUNT/SUM). Añadido consultarValor() que retorna primera columna de primera fila.

---

## Completado — FASE S: Sample Discovery & Metadata Engine (C601) [AG-SMD]

> Plan completo: `App/docs/plan-samples-metadata.md` (v1.1)
> Proyecto scraper: `kamples-scraper/` (Python/Scrapy)
> Misión: Preservar relaciones de samples musicales (WhoSampled) como bien cultural abierto.

### S1 — Infraestructura BD
- **S1.1** ✅ 6 Schemas PHP: ArtistasMusicalesSchema, CancionesSchema, CancionesArtistasSchema (composite PK), RelacionesSampleSchema (uniqueCompuestos), ScrapingLogSchema, ColaExtraccionSamplesSchema.
- **S1.2** ✅ Generator ejecutado: 6 Cols, 6 DTO, 5 Enums nuevos, schema.ts actualizado.
- **S1.4** ✅ 6 Repositorios PHP con métodos custom: upsert ON CONFLICT, JOINs multi-tabla, fulltext search (tsquery), estadísticas agrupadas, batch queries.

### S2 — Scraper Core
- **S2.1-S2.2** ✅ Proyecto Python (requirements, scrapy.cfg, .env). DataImpulse middleware (proxy residencial $1/GB, bandwidth tracking, budget cutoff 80%/100%).
- **S2.3-S2.4** ✅ HotSamplesSpider (3 fuentes: hot-samples/covers/remixes, 5 pages, delegates SampleDetailSpider). SampleDetailSpider (parsing con selectores verificados contra HTML real).
- **S2.5** ✅ PostgresPipeline: upsert flow artista→canción→cancion_artista→relación (ON CONFLICT en cada paso).
- **S2.6-S2.7** ✅ Bandwidth tracking, scripts cron (run_daily.sh, run_extraction.sh, stats.py).
- **S2.8** ✅ Tests: 30+ unit tests (test_parsers.py) con fixture HTML real. Cobertura: normalizar_url, whosampled_id, timings, duración ISO, tipo_relacion, rating, slugs, subsecciones, extracción canción/productores/featuring/YouTube IDs.

### S3 — Pipeline Extracción Audio
- **S3.1** ✅ audio_download.py: yt-dlp wrapper (WAV, 300s timeout, cache, sin proxy).
- **S3.2** ✅ bpm_analyzer.py: librosa onset_strength + beat_track, dataclass AnalisisBpm, time signature estimation (autocorrelation 3/4 vs 4/4).
- **S3.3** ✅ sample_cutter.py: recorte alineado a compás (-1 margen + 8 compases, max 30s, fallback baja confianza), ffmpeg fade 50ms.
- **S3.4** ✅ kamples_inserter.py: INSERT samples con metadata JSONB enriquecida, vinculación relación→sample, actualización cola, auto-tags/slug.
- **S3.5** ✅ pipeline.py: orquestador completo (cola→descargar→analizar→recortar→insertar), --limit arg, estado por paso.

### Estructura de archivos creados
```
App/Config/Schema/
  ArtistasMusicalesSchema.php, CancionesSchema.php, CancionesArtistasSchema.php,
  RelacionesSampleSchema.php, ScrapingLogSchema.php, ColaExtraccionSamplesSchema.php
App/Kamples/Database/Repositories/
  ArtistasMusicalesRepository.php, CancionesRepository.php, CancionesArtistasRepository.php,
  RelacionesSampleRepository.php, ScrapingLogRepository.php, ColaExtraccionSamplesRepository.php
kamples-scraper/
  scrapy.cfg, requirements.txt, .env.example, .gitignore
  kamples_scraper/ (settings, items, middlewares, pipelines, utils/, spiders/)
  extractor/ (audio_download, bpm_analyzer, sample_cutter, kamples_inserter, pipeline)
  tests/ (test_parsers.py, fixtures/sample_detail_page.html)
  scripts/ (run_daily.sh, run_extraction.sh, stats.py)
```

### Aprendizajes
- [Schema-CompositePK]: CancionesArtistas no tiene columna `id` — composite PK (cancion_id, artista_id, rol). El `colId()` del repo debe retornar una columna del composite.
- [WS-Selectors]: Nunca parsear subsecciones por índice — el número y orden varía por canción. Usar texto del header (`identificar_subseccion`).
- [WS-URL]: whosampled_url es el deduplificador principal para canciones. whosampled_id (numérico de la URL) para relaciones.
- [Rating]: Rating overlay width/25 = promedio (ej: 125px = 5.0). Los votos están en `.ratingCount`.
- [Timings]: Atributo `data-timings` en `<strong>`, no en `<span>`. Pueden ser comma-separated para múltiples apariciones.
- [YouTube]: ID en `.embed-placeholder::attr(data-id)`. Separados en `.embed-dest` y `.embed-source`.
- [Librosa]: `beat_track` puede tener baja confianza. Fallback a timing_inicio + duración fija cuando confianza < 0.3.
- [yt-dlp]: No necesita proxy (YouTube no bloquea). Formato WAV para análisis, timeout 300s.

### Pendientes S inmediatos
- S1.3: Ejecutar migraciones (CREATE TABLE) — manual o vía Glory CLI
- S1.5: API endpoints REST para consultar relaciones desde React
- S3.6: Waveform generation para UI
- S3.7: Cron batch de extracción

---

## Social — Likes + Comentarios para Canciones/Relaciones + UI Mejoras [AG-RDI]

> Commit: `5f1f3223` — 27 archivos, +609/-232

### Resumen
- **Migration v028:** CHECK constraints `likes.tipo` + `comentarios.tipo` extendidos con 'cancion'/'relacion'. Columnas `total_likes`/`total_comentarios` en `canciones` y `relaciones_sample`.
- **Schema + Generated:** 4 schemas source + 4 _generated (Cols/Enums) actualizados.
- **Backend PHP:** LikesRepository (3 nuevos métodos: obtenerReaccionUsuario, recalcularTotalCancion, recalcularTotalRelacion), SocialController extendido, ComentariosController+EscrituraController TIPOS_VALIDOS, ComentariosRepository mapaTablas, CancionesController detalleRelacion enriquecido (4 arrays relaciones + liked status), NormalizadorCancion totalLikes/totalComentarios.
- **Frontend:** RelacionDetalleIsland reescritura completa (BotonLike, ListaComentarios, 4 secciones TablaRelaciones, portada 1:1, meta/timing en div propio, votos removidos). LadoCancionRelacion extraído SRP. useComentarios/useBotonLike tipos ampliados. apiSocial TipoLikeable/TipoComentable.
- **SEO URLs:** `construirUrlSampleo()` + `slugificar()` en cancion.ts, pages.php retrocompat, TablaRelaciones/TarjetaRelacionSample actualizados.
- **CSS:** relacionDetalle.css con portadaVacia, ladoExtra, secciones, toggle comentarios.
- **Pendiente:** Ejecutar migration v028 en producción.

---

### C703  Bug SPA misma isla + route params + escalabilidad relacional [AG-NAV]

**Bug diagnosticado:** Navegacion SPA entre paginas de la misma isla (ej: /sampleo/169 -> /sampleo/168) no actualizaba props porque:
1. PageRenderer keep-alive solo actualizaba cache cuando `islaActual` cambiaba (distinta isla), no cuando props cambiaban para la misma isla
2. Router SPA no extraia params nombrados de la URL  todo iba como `slug` generico
3. PHP `resolverRutaDinamica` rechazaba URLs multi-segmento (ej: `/sampleo/168/seo-slug/`) con 404

**Fixes:**
- **PageRenderer.tsx:** Isla activa usa `propsActuales` del store (live), no del cache. Islas ocultas (keep-alive) mantienen props cacheados.
- **navigationStore.ts:** Nueva funcion `extraerParamsDeUrl()` que parsea patrones como `:id/:slug?` y extrae params nombrados de la URL.
- **PageDefinition.php:** `registrarRutaDinamica()` ahora acepta patron de params (2do argumento, default `:slug`). `getReactPageRoutes()` incluye `params` en el mapa enviado al cliente.
- **PageTemplateInterceptor.php:** `resolverRutaDinamica()` y `forzarResolucionDinamica()` ahora permiten multi-segmento para rutas que lo declaran.
- **pages.php:** Rutas actualizadas con patrones: `sampleo(`:id/:slug?`), perfil(`:username`), publicacion(`:publicacionId`), coleccion(`:coleccionId`)`.

**Compactacion:** `plan-samples-metadata.md` reducido de ~1010 a ~200 lineas (S1-S5 compactados, S6-S7 y lecciones preservados).

**Escalabilidad plan:** Auditoria detecta 4 problemas para escala: contadores a 0 (sin triggers), relaciones re-encontradas ignoradas (DO NOTHING), indices compuestos faltantes, sin re-scraping strategy. Plan documentado en plan-samples-metadata.md seccion "Plan de Escalabilidad Relacional".

> Archivos: Glory/{PageRenderer.tsx, navigationStore.ts, glory.ts, PageDefinition.php, PageManager.php, PageTemplateInterceptor.php}, App/{pages.php, plan-samples-metadata.md, pendientes.md, completado.md}

---

### C704 — S-ESCALA: Escalabilidad Relacional implementada [AG-NAV]

**Migración v029:** Trigger + índices + columnas rescraping ejecutados en PostgreSQL.

**S-E.1 Trigger contadores:** Función `trg_actualizar_contadores_relacion()` en PostgreSQL auto-incrementa `total_sampleada`/`total_samplea` en `canciones` al INSERT/DELETE en `relaciones_sample` (solo tipo `sample`). Batch update inicial recalculó contadores existentes desde cero.

**S-E.2 DO UPDATE pipeline:** Pipeline Python (`pipelines.py`) cambió de `ON CONFLICT DO NOTHING` a `DO UPDATE SET timings_destino, timings_fuente, votos_total, votos_promedio, tipo_elemento, aparece_en_todo, updated_at`. Usa `xmax = 0` para distinguir insert vs update en logs. PHP `RelacionesSampleRepository::insertarOActualizar()` también actualizado (antes era `insertarSiNoExiste` con DO NOTHING).

**S-E.3 Índices compuestos:** 3 nuevos índices: `idx_rel_destino_tipo (cancion_destino_id, tipo_relacion)`, `idx_rel_fuente_tipo (cancion_fuente_id, tipo_relacion)`, `idx_rel_verificada_reciente (verificada, created_at DESC) WHERE verificada = TRUE`.

**S-E.4 Re-scraping:** 3 columnas nuevas en `scraping_log` (`re_scrapeable`, `proximo_rescrape`, `veces_rescrapeado`). URLs de tipo track/artist se marcan automáticamente para revisita con intervalo creciente (30d * N). `dedup.py::url_ya_procesada()` ahora permite revisita de URLs vencidas. `ScrapingLogRepository` con métodos `pendientesRescrape()`, `marcarRescrapeada()`, `marcarReScrapeable()`. Schema/Cols/DTO actualizados.

> Archivos: v029_escalabilidad_relacional.sql, pipelines.py, dedup.py, track.py, artist.py, RelacionesSampleRepository.php, ScrapingLogRepository.php, ScrapingLogSchema.php, ScrapingLogCols.php, ScrapingLogDTO.php

---

### Corrección Varsense + CSS Linter [AG-FIX]

- **Archivos actualizados:** `modalEdicionRelacion.css`, `modalReporteLegal.css`, `modalContribucion.css`, `buscadorCanciones.css`, `artistaDetalle.css`, `landingCaracteristicas.css`, `modalVincularSample.css`, `tarjetaRelacionSample.css`, `botonReporteLegal.css`.
- **Acciones:** Todas las variables erróneas identificadas en `.varsense-report.md` (como `--espaciado-md`, `--superficie2`, `--textoXl`, etc.) se mapearon a sus equivalentes del design system (`--espacioMd`, `--fondoElevado2`, `--fuenteXl`...). Valores hardcodeados como font-sizes en `rem` y margins (`-11px`, `-120px`) refactorizados a variables CSS (a menudo apoyados con `calc()`). Solucionados linter warnings sobre `gap: 2px` a su equivalente validado `--espacio2xs`. No se crearon nuevas variables, ajustándose estrictamente a las existentes.
- **Aprendizaje:** Mantener nomenclature siempre validada de variables ya existentes del root. En font-size usar siempre sistema `--fuenteX` disponible y en espaciado negativo aprovechar `calc()` + variables, en lugar de magic numbers que escalan mal.

---

## Completado — Pipeline Audio: SoundCloud GO + WP Cron (C901-C903)

- **C901** ✅ Fix WP Cron publicación: hook `kamples_publicar_extracciones` tenía `add_action` pero nunca se programaba con `wp_schedule_event`. Refactorizado en `registrarCronPublicadorExtraccion()` con guard `if (!wp_next_scheduled(...))`. Commit `14c1d520`.

- **C902** ✅ SoundCloud GO auth + filtro policy: `_soundcloud_oauth_token` module-level + `_soundcloud_request_headers()` añade `Authorization: OAuth <token>`. Policy filter descarta `policy=SNIP` (GO-only, solo 30s preview) cuando no hay token. Regex exclusión ampliada: `reloop`, `relooped`, `edit`. Commit `cacf805e`.

- **C903** ✅ Fix token dinámico + search_limit duplicado: `_soundcloud_request_headers()` hace `os.getenv()` en cada llamada (no en módulo). Eliminado `search_limit = 10 if _soundcloud_oauth_token else 5` duplicado (usaba var de módulo, evaluada antes de `load_dotenv()`). Ahora `tiene_oauth` se detecta ANTES de construir la search URL. Token añadido a `kamples-scraper/.env` (no commiteado — secreto). Commit `319c9e3e`.

- **C904** ✅ Fix relevancia SC: `_score_relevancia_soundcloud()` requiere `title_score > 0` cuando el titulo tiene tokens significativos. Previene descargar otra cancion del mismo artista (ej: "Matrix" → "Salt Peanuts" de Dizzy Gillespie). Commit `deb4d24f`.

- **C905** ✅ Pipeline robusto — 9 features: (1) `ResultadoDescarga` dataclass con metadata de fuente en JSONB. (2) `groq_validator.py` validacion IA pre-descarga via Groq LLM. (3) `SoundCloudAuthError` deteccion 401/403 → pausa pipeline. (4) `rate_limiter.py` intervalo start-to-start + limite diario persistido. (5) `auto_encolar_pendientes()` busca relaciones sin samples. (6) `desvincularSampleId()` resetea cola para re-extraccion. (7) `origen='extraccion'` + `descarga_metodo/fuente_url/titulo` en metadata sample. (8) Modo `--continuo` retry 30 min. (9) CLI args `--intervalo --limite-diario --espera-vacio`. Commit `4ca293ab`.
