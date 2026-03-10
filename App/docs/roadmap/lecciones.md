# Kamples — Lecciones Aprendidas (Gotchas)

> Reglas generales de desarrollo en `test.instructions.md`. Este archivo documenta gotchas específicos del proyecto Kamples.

---

## PHP / PostgreSQL / WordPress

- `apiGet` hace `json.data ?? json` → NUNCA `resp.data.data`. Tipear `RespuestaApi<T[]>`.
- PG TEXT[] requiere `'{val1,val2}'` + `pgArrayAPhp()`. PDO devuelve string `"{}"` — parsear.
- Backend snake_case, frontend camelCase — normalizadores obligatorios. IDs: `String()` en comparaciones.
- PageManager: `reactPage('padre/hijo')` NO auto-crea padre WP. `\filter_var`, `\session_id` en namespaces.
- PDO `ATTR_EMULATE_PREPARES=false`: excepción si params tiene keys sin placeholder. Prohibe reusar placeholder (`:uid` x2 → `:uid2`).
- Columnas PG: verificar nombres exactos (`creador_id` NO `usuario_id`). `(int) get_param('page')` → 0 si ausente → `max(1, ...)`.
- Colecciones imagen: `imagen_url` (canónica), `portada_url` (legacy). Todo write → `imagen_url`. Frontend: `imagenUrl`.
- PG credenciales: EXIGE `KAMPLES_PG_USER`/`KAMPLES_PG_PASSWORD` en .env. LogModeracion: solo 2 args. Cache Feed: transients → `invalidarCacheGlobal()`. Créditos = COUNT hoy vs límite + `creditos_bonus`.
- `wp_handle_upload()` solo wp-admin → require `includes/file.php` en REST.
- [Groq vision local]: Groq no puede resolver hosts locales como `glory.local` en `image_url`. Para uploads locales, resolver `wp-content/uploads` a ruta física y enviar la imagen como `data:image/...;base64,...`.
- [Moderación razón]: `determinarVeredicto()` debe poblar `razon` también en aprobados o errores parciales; si se deja vacía, los logs y el panel pierden trazabilidad.
- [Sentinel regexes PHP]: Los controllers Kamples usan `\register_rest_route($namespace, ...)` y `new \WP_REST_Response([`. El indexer esperaba namespace como string literal y `WP_REST_Response` sin `\` FQN → CERO endpoints indexados. Fix: regex soporta `$variable` como 1er arg y backslash opcional en WP_REST_Response. También: extension `.ts` en gloryAnalyzer para services, `payloadClaves` nivel 2 para sub-claves dentro de `data:{}`, pattern `apiGet<Tipo>()` para helpers Kamples.

---

## Repository / Schema System

- `contarConFiltros`/`listarConFiltros`: WHERE dinámico. JOINs en repo principal. `crearConConflict` para upserts.
- BaseRepository::estaConectado() wrappea PG. NormalizadorSample::sqlSelectSamples(?int $userId) para SELECTs con JOIN.
- Cols en `App\Config\Schema\_generated\`. Sentinel: param keys y SET clauses → Cols constants. SQL aliases strings OK.
- Union types TS de `ISamples['tipo']` → si se regenera, TS rompe. Interfaces manuales porque API normaliza a español.
- Regex `validarQueryContraSchema()`: NUNCA negative lookahead → usar `\b`.
- [repositoryGenerate.mjs]: `schema:generate` puede corromper repositorios. 5 bugs corregidos: (1) `colId()` forzaba `::ID` en tablas composite PK, (2) ORDER BY hardcodeados, (3) `use` custom eliminados, (4) código entre zona auto y CUSTOM destruido, (5) `.trim()` rompía indentación. Funciones `extraerUsesCustom`, `extraerColIdCustom`, `extraerCodigoEntreAutoYCustom` ahora preservan código manual.

---

## React / TypeScript

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
- [EnumsNaming]: Los enums generados usan `MODERACION_ESTADO_APROBADO` (prefijo con ESTADO_). El controller usaba `MODERACION_APROBADO` (sin ESTADO_) → PHP silencia constants no definidas como null → comparación siempre falla. Verificar SIEMPRE contra el archivo generado al usar enums.
- [BaseRepository]: `ejecutar()` + `insertar()` devuelven `int`/`?int`, NO PDOStatement. NUNCA llamar `->rowCount()` sobre el retorno. Usar directamente el int retornado.
- [ScrollInfinito]: Patrón recomendado: `sentinelRef` + `IntersectionObserver` en el hook (`rootMargin: '300px'`). `paginaRef = useRef(1)` para evitar stale closure en el observer. Reset en cambio de filtro: `paginaRef.current = 1; setHayMas(true)`. Backend retorna array vacío (length < PAGE_SIZE) para indicar no hay más.
- [Social]: URLs repost: `/publicaciones/${id}/repost`. Lightbox timer 220ms. EVENTO_ENTIDAD_ACTUALIZADA constante. Rollback: snapshot previo. SIEMPRE TarjetaPublicacion para posts. `utils/tiempo.ts` centralizado.
- [HTML]: NUNCA anidar `<a>` en `<a>` ni `<button>` en `<a>`. Patrón: div wrapper + enlace subzona + menú fuera del `<a>`.
- [GloryContext]: declaration merging `global.d.ts` SOLO campos nuevos opcionales. PROHIBIDO re-declarar existentes. devMode: `=== true`.
- [Clipboard adjuntos]: El pegado de imágenes/audios debe pasar por el mismo pipeline de adjuntos que input y drag-drop. Normalizar nombres de archivos del portapapeles evita blobs sin nombre que rompen validación o UX.
- [Nonce SPA post-login]: `window.GLORY_CONTEXT.nonce` se genera al renderizar la página PHP para el usuario guest. Tras login SPA, el nonce es obsoleto → las llamadas REST fallan silenciosamente (`ok: false`, feed devuelve `[]`). Fix: `window.location.href = '/'` fuerza full-reload para regenerar el nonce del usuario autenticado. Solo desktop (Tauri) puede mantener navegación SPA porque usa JWT Token en vez de nonce.
- [MenuContextual modo historial]: `MenuContextual` del sistema requiere coordenadas absolutas `{x, y}` del evento `e.clientX/Y`. Para multi-tarjeta (grid) usar estado compartido en el padre + un único `<MenuContextual>` renderizado fuera del grid. Patrón: `onAbrirMenu(e, item)` pasado a cada tarjeta. Si el menu necesita UI compleja (formulario ban), abrir un `<Modal>` secundario — no inline en el dropdown.

---

## CSS / UI

- `:has(.reproductorGlobal)` bottom dinámico. `pointer-events` NO animable → `::before` bridge.
- No select nativo → MenuContextual. SVG flex: `flex-shrink:0`. Colors DAW: loop→acento, mute→error, solo→advertencia.
- CSS vars rem/px → `--espacioX`/`--fuenteX`. VarSense mappings: bordeSubtle→bordeSutil, fondoSecundario→fondoElevado2, textoBase→textoPrimario, textoTenue→textoTerciario, textoAlto→blanco, verde→exito, rojo→error, radioCirculo→radioFull.
- [BotonBase]: `.botonBase.tamanoMd` (especificidad 2) sobreescribe 1 clase → Fix: `.contenedor .clase.botonBase` (3+). Usar `<MenuContextual>` en 3-puntos. Input header: override contextual sin props extra.
- [Skeleton]: `--colorBorde` no existe en variables.css → skeletons invisibles. Siempre verificar existencia de CSS vars antes de usar.
- [Favicon]: `wp_head()` puede inyectar su propio `<link rel="icon">`. Poner el `<link>` personalizado DESPUÉS de wp_head() para override.
- [z-index]: Portal dropdowns que aparecen sobre modales necesitan z-index mayor que --zModal. Solución: --zMenuPortal:1100.
- [Landing branding]: Para medidas exactas del home público usar variables específicas en `variables.css`; dejar `@font-face` solo en `landingPublica.css` evita cargar Junicode/Bricolage en el resto de la app.
- [Tarjetas overlay]: Si el texto debe vivir dentro de la portada, usar overlay absoluto sobre la imagen y revelar metadatos secundarios con `hover` y `focus-visible`; así se mantiene legibilidad y accesibilidad sin ensuciar la grilla.

---

## Mezclador / Channel Rack / Piano Roll

- Aislado `/Mezclador/` tsconfig propio. AudioContext singleton. `detune+playbackRate → rate * 2^(detune/1200)`. Stretch: `playbackRate = buffer.duration/(durCompases*durCompas)`.
- Undo: sin audioBuffers, MAX=30. Fin real: max bloques. BPM mid-playback: ratio newBpm/oldBpm.
- Selección múltiple: Set<string>, Ctrl+click, Shift+drag=duplicar. MinimapaDaw: DOM+rAF. SoundTouchJS 0.3.0.
- PPQ=96. Canvas grid + DOM notas. GhostNotas: culling viewport. VentanaFlotante: ventanasStore Map<id>.
- Pan: StereoPannerNode [-1,1]. Declicking micro-fades. masterAnalyser fftSize=2048. FFmpeg waveform: f32le ac1 ar8000 60 barras.

---

## Desktop Tauri 2.0

### General
- JWT dual: nonce WP (web) + Bearer JWT (desktop). JwtService AUTH_KEY HS256.
- `@crabnebula/tauri-plugin-drag` v2.1.0. `startDrag({item, icon})` — icon OBLIGATORIO. `onDragStart` (no onMouseDown).
- Build: solo `vite build`. Aliases replicados de Glory. cargo check ~5min primera vez.
- Proxy Vite `/wp-json`+`/wp-content` → glory.local. URL rewriting relativas en fetch interceptor.
- `window.location.href` → usar `navegar('/')`. Store: `"store": {}`. Updater: deshabilitar sin pubkey.
- Dynamic imports `@desktop/` rompen build web → exponer en `window.__KAMPLES_*__` desde entry desktop.
- `obtenerWpUserId()` intentar JWT si `get_current_user_id()==0` (endpoints públicos /feed).
- Tray: solo uno (conf o Rust builder). `inicializarAuthDesktop()` token+usuario ANTES de montar React.

### FileWatcher y Sync
- tauri-plugin-fs watch: `features = ["watch"]` en Cargo.toml. Sync: hash parcial 8KB+tamaño. MOVE=DELETE+CREATE (grace 5s). Self-trigger: `descargasEnCurso` Set. Carpetas server implícitas. Post-upload PUT carpeta prioridad local.
- [Sync v2]: Tracking key format `"{sampleId}_{coleccionId}"` (coleccionId=0 si null). Tauri Store type assertion: `{ get, set, save }` interfaz explícita (no ReturnType). syncService expone todo via `window.__KAMPLES_SYNC__` — nunca import directo desde web.
- [Tray→Panel]: `Emitter` trait necesario en import Rust para `app.emit()`. `TrayIconEvent::Click` requiere `MouseButton::Left` + `MouseButtonState::Up`. Listener frontend: `useSyncStore.getState().abrirPanel()` accede al store Zustand fuera de React.
- [fileWatcher carpetas]: RENAME directorio = DELETE+CREATE secuencial. Grace 3s con Map. Solo first-level dirs (sin extensión audio + hijos directos de carpetaBase). `procesarEventoCarpeta` antes de `procesarEvento` audio.
- [Delta vs reconciliación]: Delta sync es SOLO optimización, no fuente de verdad. Si el cursor ya pasó un evento (sample existía antes de activar sync, o descarga falló), el delta NUNCA lo reportará de nuevo. Siempre debe existir reconciliación periódica (bypass delta) que compare servidor vs tracking. `RECONCILIACION_DESCARGAS_MS=5min` en `syncWatcherSetup.ts`. `descargarSiNecesario()` es idempotente (retorna 'existente' si ya está).
- [Rename colecciones]: Al renombrar colección, `actualizarNombreColeccion` DEBE actualizar `rutaLocal` + `indiceRuta` de TODOS los archivos hijos y subcolecciones. Si no, watcher ve archivos en ruta nueva como "nuevos" → re-upload → duplicados.
- [Tracking vs disco]: El tracking es una *caché*, no fuente de verdad del disco. `descargarSiNecesario` DEBE verificar `exists()` en disco cuando tracking dice que el archivo existe. Si el archivo fue movido a duplicados, borrado externamente, etc., la entrada de tracking se limpia y se re-descarga. Sin esto, archivos perdidos NUNCA se reparan.
- [Move local→servidor]: `moverSampleEnServidor` (PUT /me/coleccionados/{id}/carpeta) solo actualiza metadata, NO `coleccion_samples`. Se requiere `agregarSampleAColeccion` (POST) para asociar realmente el sample a la colección. Sin esto, samples movidos localmente no aparecen en la web. `actualizarColeccionEnMovimiento` en el watcher lo hace, y `reconciliarRutasConColecciones` en sync completa lo corrige retroactivamente.
- [Filtro Todos subcolecciones]: El endpoint `GET /colecciones/{id}` acepta `?incluirSubcolecciones=1` para retornar samples del padre + hijos (D3 vista virtual). Sin el param, solo retorna samples directos del padre, haciendo que "Todos" no muestre samples de subcarpetas.

### Build y Entorno
- [Build WDAC]: OneDrive sincroniza `target/` → WDAC bloquea build-script-build.exe (os error 4551). Fix: `.cargo/config.toml` con `target-dir = "C:\\cargo-target\\kamples"` redirige fuera de OneDrive. Bundles en `C:\cargo-target\kamples\release\bundle\`.
- [VarSense mappings extra]: `--superficie`→`--fondoElevado2`, `--colorAlerta`→`--advertencia`, `--colorExito`→`--exito`, `--colorError`→`--error`, `--colorTextoSecundario`→`--textoSecundario`, `--colorSuperficieHover`→`--fondoElevado2`, `--borderRadiusSm`→`--radioSm`, `--fuenteBase`→`--fuenteMd`. `rgba(0,0,0,0.7)`→`var(--overlayOscuro)`, `rgba(0,0,0,0.4-0.55)`→`var(--overlaySuave)`.
- [Sentinel splits]: AdminController → AdminModeracionController (moderación routes delegadas via `AdminModeracionController::registrarRutas($namespace)` desde registrarRutas del padre). PipelineAudio helpers → PipelineAudioHelpers (construirNombreArchivo + actualizarSample). ColaProcesamientoIaCols::TODAS para `SELECT` explícito.

### Upload Queue
- [Upload fantasma]: Items persistidos en Tauri Store con archivos que ya no existen en disco se reintentan eternamente. `estaEnCarpetaSync()` solo verifica PATH, no existencia. Fix: `exists()` en restauración + `intentos=MAX` en file-not-found (sin reintentos inútiles).
- [Colección en upload]: C381 eliminó creación de colecciones en `subirArchivo` por race conditions. Pero `crearColeccionDesdeLocal` es idempotente (check local + Map in-flight + GET server + 409), así que es seguro llamarla. Sin ella, archivos subidos a carpetas sin colección quedan huérfanos.
- [Upload no debe crear colecciones]: El upload flow NO debe crear colecciones en el servidor — eso es responsabilidad del watcher de carpetas (`onCarpetaNueva`). Si el upload crea colecciones, hay race condition entre dos hilos que intentan crear la misma colección → duplicados, IDs incorrectos, 403 por propiedad de colección ajena. El upload solo debe agregar sample si tracking ya tiene la colección; si no, actualizar metadata y dejar que sync reconcilie.
- [Upload dedup pre-flight]: El tiempo entre `encolarArchivo` y `subirArchivo` (semáforo, backoff) permite que otro upload complete. Verificar tracking v2 + hash justo antes del POST, no solo al encolar. Persistir hash inmediatamente tras cada upload (no al fin de la cola).
- [Idempotency uploads]: Sin idempotency key server-side, retry de upload = duplicado. Patrón: `X-Idempotency-Key` header + check-before-insert en backend.
- [Cola persistente + guard]: Cuando un guard se añade en runtime (fix de watcher, filtro de ruta), los items YA persistidos en Tauri Store NO pasan por el guard de encolamiento — se restauran directamente en `inicializarUploadQueue`. Todo guard DEBE aplicarse también en la restauración del Store y en cualquier listener que recargue la cola (`reintentar-errores-upload`). Sin esto, items zombi se reintentan eternamente.
- [Pipeline imagen post-upload]: La imagen de portada se genera async en backend. Fetch inmediato retorna null. Retry con backoff (4s→12s→30s→60s) cubre la latencia del pipeline.
- [API endpoint samples GET]: La ruta es `/samples/{slug}` (string), NO `/samples/{id}` (numérico). `obtenerImagenSampleDesdeServidor` debe usar `resultado.slug`, no `resultado.sample_id`. La respuesta va envuelta en envelope `{ data: { imagenUrl, ... } }` — siempre desenvolver.

### MPA (Multi-Page Architecture)
- [Sync window standalone]: Multiwindow Tauri: `sync.html` + `sync.tsx` como entry point separado. `tauri.conf.json` define window `sync-panel` (frameless, always-on-top, skip-taskbar, hidden). Rust `mostrar_ventana_sync()` posiciona en esquina inferior derecha (`monitor.size() - ventana - margen - 48px taskbar`). VentanaSincPanel usa `data-tauri-drag-region` + `-webkit-app-region: drag` para barra superior. `getCurrentWindow().hide()` en vez de destruir. `onFocusChanged` re-abre panel store al mostrar. `principal.json` capabilities: `["main", "sync-panel"]`.
- [MPA Vite]: `rollupOptions.input` acepta múltiples HTML entries. Cada entry tiene su propio CSS bundle + JS chunk tree. Sync window importa `@/index.css` directamente para tener variables CSS.
- [Sync window bugs]: `window-state` plugin restaura visibilidad de sesiones previas → `with_denylist(&["sync-panel"])` excluye del state save/restore. No desactivar focus en config de ventana popup (si no, blur/focus deja de ser confiable). Cierre al click fuera implementado también en backend Rust con `on_window_event(WindowEvent::Focused(false)) -> hide()`. sync.tsx NO debe llamar `inicializarDesktop()` completo — solo `configurarApiDesktop()` + `inicializarSyncService()`. Root cause de estilos: `App/Assets/css/init.css` estaba vacío; para ventana sync cargar variables reales desde `App/React/styles/variables.css` + `botonBase.css` + `sincronizacion.css` en imports directos de sync.tsx. `sync.css` queda solo para estilos shell.
- [Sync minimal UI]: Ventana sync minimalista sin tabs ni header. Estructura: barra superior mínima solo con ícono `...` (derecha), cuerpo con lista de historial simple, footer fijo con estado + ícono de carpeta para abrir ruta local. Historial debe cargarse al abrir panel (no depender de tab activa). Acción abrir carpeta expuesta en `syncService` como `abrirCarpetaSync()` usando `@tauri-apps/plugin-shell`.
- [Sync minimal UI v2]: Menú `...` funcional (Sincronizar ahora, Elegir carpeta, Abrir carpeta, Pausar/Activar sync, Ocultar panel). Topbar incluye perfil a la izquierda (avatar + nombre). Filas de historial: miniatura si existe (`imagenUrl|miniaturaUrl|coverUrl`) o icono fallback, tiempo relativo, icono de estado al final. Normalización de mojibake (`ColecciÃ³n` → `Colección`) en render. Estado footer con icono `Inactivo` dedicado (`CircleDotDashed`) y texto capitalizado.
- [Sync perfil desktop]: `GLORY_CONTEXT.currentUser` puede venir vacío en ventana `sync` (no monta flujo auth completo). Solución: leer `auth_usuario` desde `auth.json` (Tauri Store) en `VentanaSincPanel` y usarlo como fuente principal de `nombre/avatar`, con fallback a `GLORY_CONTEXT`.
- [Config MPA window]: Ventana config como entry point MPA separado (`config.html`+`config.tsx`). **DEBE declararse en `tauri.conf.json` con `visible: false`** (pre-creada al inicio), NO crearse dinámicamente con `WebviewWindowBuilder`. En Windows, `WebviewWindowBuilder::build()` bloquea el main thread durante la inicialización de WebView2, causando deadlock que congela TODAS las ventanas. El comando Rust solo hace show/center/focus. Como la ventana no se destruye (solo hide), el hook `useConfiguracionSyncVentana` re-lee del Tauri Store al ganar foco (`onFocusChanged`) para mostrar datos frescos.
- [Inter-window Tauri events]: Comunicación entre ventanas (config→sync) via `emit('config-sync-actualizada')` + `listen()`. Stores Zustand NO se comparten entre MPA windows (contextos JS separados). La ventana receptora debe re-leer del Tauri Store file.
- [Config window import isolation]: La ventana config crasheaba porque `useConfiguracionSyncVentana` importaba de `syncState.ts` → `desktopService.ts` → `syncService.ts` (655 lín) → cadena completa de servicios sync. La evaluación de todo el árbol de módulos en un contexto nuevo sin globals inicializados causa freeze. Fix: `syncConstants.ts` (ZERO imports) con tipos + constantes. `syncState.ts` re-exporta para compatibilidad. Hook importa de `syncConstants` directamente. **Regla general MPA:** cada entry point debe importar SOLO lo que necesita; nunca tirar de un módulo "state" que depende de servicios pesados si solo necesitas tipos/constantes.
- [Auth nginx/PHP-FPM]: `$_SERVER['HTTP_AUTHORIZATION']` puede estar vacío si nginx no tiene `fastcgi_param HTTP_AUTHORIZATION $http_authorization;` en su config. `getallheaders()` en PHP-FPM lee de `$_SERVER['HTTP_*']` — si nginx no lo pasa, getallheaders tampoco lo tiene. Solución: header custom `X-Kamples-Auth` (nginx no filtra custom headers) + lectura de `HTTP_X_KAMPLES_AUTH` en PHP como fallback.
- [Sync auth doble vía]: Todos los fetch de sync deben enviar JWT por `Authorization` Y `X-Kamples-Auth`. Usar `obtenerHeadersSync()` de `syncGuards.ts` con token centralizado via `establecerTokenSync()` (setter pattern). Esto es independiente del interceptor global de window.fetch y funciona en cualquier contexto (main window, sync panel, config window).
- [Sync MPA soloLectura]: Ventanas secundarias MPA (sync panel) que solo muestran datos NO deben ejecutar la infraestructura de sync bidireccional (watcher, upload queue, polling). `inicializarSyncService({ soloLectura: true })` para read-only. Sin esto: race conditions en `persistir()`, watchers duplicados, uploads duplicados.
- [Sync __KAMPLES_CONFIG__ timing]: En entry points MPA, `window.__KAMPLES_CONFIG__` DEBE setearse ANTES de cualquier llamada a `configurarApiDesktop()` / `inicializarSyncService()`. `obtenerServidorUrl()` lee de `__KAMPLES_CONFIG__` — si no existe, fallback a `/wp-json` que contra `tauri://localhost` = 404.

### Sync Service Gotchas
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

### Watcher / Filesystem
- [Rename race condition]: `moverArchivoASinColeccion()` hace `rename()` interno que genera CREATE en watcher. Solución: `marcarDescargaEnCurso(nuevaRuta)` ANTES del rename. El grace period de 10s (GRACIA_DESCARGA_MS) cubre el procesamiento async del watcher.
- [v1/v2 index fallback]: `manejarMoveLocal` debe buscar en tracking v2 como fallback si v1 index no tiene el archivo. Descartar silenciosamente por fallo de lookup v1 pierde moves legítimos en archivos migrados o con v1 desincronizado.
- [Drag region MPA]: En ventanas frameless con botones custom, **NUNCA** usar `data-tauri-drag-region` en el div padre que contiene botones. El atributo HTML sobreescribe CSS `app-region: no-drag` en hijos. Usar solo CSS `app-region: drag` en header + `no-drag` en contenedor de botones.
- [Explorer /select Windows]: `std::process::Command::new("explorer").arg(formato_select_ruta)` falla con rutas con espacios porque Rust wrappea en comillas automáticamente. `explorer.exe` no parsea `/select,"ruta con espacios"`. Fix: usar `CommandExt::raw_arg()` (stable desde Rust 1.62).
- [Colección dedup 3 capas]: Watcher emite create + modify para una carpeta nueva → dos callbacks `onCarpetaNueva`. Fix: debounce `carpetasRecientes` Map (5s). Capa 2: tracking check pre-POST. Capa 3: backend check-before-insert case-insensitive. TO-DO: UNIQUE constraint DB.
- [Watcher moves]: En Tauri FS watcher, un move/rename puede llegar como `modify.kind='name'` (sin `remove+create`). Si no se maneja explícitamente, se pierden uploads y creación de colección al mover archivos/carpetas.
- [Watcher scope OneDrive/Windows]: En Windows con OneDrive o SMB el driver del FS puede emitir eventos para rutas FUERA de la carpeta vigilada. `procesarEvento` DEBE hacer `if (!relativa) continue` para descartar eventos con ruta relativa vacía. `manejarArchivoNuevo` DEBE usar `startsWith(base + '/')` (con barra) y hacer early return si `relativa` es `''`. Sin estos guards, archivos de toda la carpeta Documentos/OneDrive aparecen en la cola de subida.
- [Windows crear carpeta]: Windows Explorer crea carpetas con nombre temporal ("Nueva carpeta") y luego emite rename. El watcher FS detecta CREATE inmediatamente. Si se crea la colección en el servidor sin delay, se envía con nombre incorrecto. Solución: delay 3s en `procesarEventoCarpeta` antes de llamar `onCarpetaNueva`. Si rename llega en esa ventana, cancelar el timer e ignorar el nombre temporal. El rename handler se encarga de crear/renombrar correctamente.
- [Watcher papelera]: `.papelera/` está DENTRO de la carpeta sync → el watcher la observa recursivamente. Todo rename a `.papelera/` genera CREATE visible para callbacks → re-upload fantasma. Excluir SIEMPRE carpetas internas del watcher con `CARPETAS_EXCLUIDAS`.
- [Papelera guard]: `moverAPapelera()` NO usaba `marcarDescargaEnCurso()` como sí lo hace `moverArchivoASinColeccion()`. Toda operación que genera rename dentro de la carpeta sync DEBE usar el guard.
- [Watcher dedup]: Bloquear create por coincidencia de nombre es inseguro (mismo nombre ≠ mismo contenido). El watcher debe deduplicar por ruta/evento; contenido se deduplica por hash en uploadQueue.
- [Dedup timestamp]: El prefijo `${Date.now()}_` de la papelera rompe comparaciones por nombre. Normalizar con `nombre.replace(/^\d{13,}_/, '')` antes de dedup.
- [OneDrive readFile]: `readFile` de Tauri falla con ruta truncada en archivos cloud-only de OneDrive. Pre-check con `exists()` + mensaje descriptivo.
- [OneDrive watcher path]: `watch()` puede emitir rutas equivalentes con formato distinto (`\\` vs `/`, casing). Cualquier dedup por ruta en cola DEBE usar clave normalizada canónica.

### Sync de datos
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
- [Sync MPA persistir race]: `persistir()` en syncTrackingService sobreescribe TODO el Store con datos en memoria. Si la ventana main tiene historial stale y sync-panel acaba de limpiar el Store, el próximo `persistir()` de main restaura el historial borrado. Fix: read-merge-write — leer Store antes de escribir y preservar campos que otra ventana pudo actualizar (especialmente `imagenUrl` en historialSamples). Emitir evento Tauri `limpiar-historial-samples` para que TODAS las ventanas limpien su copia in-memory.
- [Sync hashesConocidos eviction]: `hashesConocidos` (Set write-only) nunca evictaba hashes de samples borrados del servidor. Resultado: si el usuario borra un sample y lo re-sube, el hash sigue en el Set → falso duplicado → silenciosamente descartado. Fix: al verificar hash, comprobar si existe en tracking v2; si no → evictar del Set y permitir re-encolamiento. `forzarResync()` debe llamar `limpiarHashesConocidos()`.
- [Sync dedup cross-folder]: `hashesConocidos` (Set) solo previene re-encolamiento del mismo archivo. Para detectar que dos archivos en carpetas distintas tienen el mismo contenido, usar Map<hash, ruta> (`hashARuta`). Al encolar, si hash ya existe en Map, comparar rutas: si difieren → es duplicado cross-folder → descartar.
- [Sync thumbnails stale]: syncCollectionService `fetchImagen` sin cache-busting headers → navegador reutiliza imagen cacheada incluso cuando pipeline backend actualiza la portada. Fix: `?t={timestamp}` en URL + `Cache-Control: no-cache` en request.

### Tags / Filtrado
- [Tags backend SQL]: Para agregar tags de arrays JSONB (`metadata->'genero'`), usar `LATERAL jsonb_array_elements_text()`. Para arrays nativos TEXT[] (`s.tags`), usar `UNNEST()`. Ambos requieren GROUP BY + COUNT. Debounce 400ms en frontend evita rafagas de requests.
- [Tags faceted search]: Si tags se computan client-side sobre samples cargados, solo reflejan las páginas actuales (no el dataset completo). Para >1000 samples, siempre usar endpoint backend con los mismos filtros WHERE que la consulta principal.
- [Inspector SampleResumen]: ModalInspectorSample recibía `SampleResumen` (sin campos técnicos: rutaOriginal, rutaOptimizada, formato, tamano). Fetch `obtenerSample(slug)` obligatorio para mostrar datos completos. Usar `sampleCompleto ?? sample` para graceful degradation.
- [CSS field-sizing]: `field-sizing: content` es CSS nativo para auto-resize de textareas sin JS. Funciona en Chrome 123+, no necesita `ResizeObserver` ni `scrollHeight` hacks.
- [Modal headers]: Si el modal no tiene acción en el header (solo un X de cerrar), quitar el header completo. Los usuarios cierran con Escape/overlay click. Simplifica código y UI.
- [Enum system-wide change]: Reducir tipos de sample de 6 a 2 requirió tocar ~15 archivos: schema PHP, enums generados, 2 controllers, 2 pipelines, embeddings, upload form, bienvenida, schema.ts. Siempre hacer un audit completo con grep antes de asumir que un cambio de enum es trivial.
- [Sync buscarArchivoPorNombre peligro]: El fallback `buscarArchivoPorNombre` en uploadQueue matcheaba CUALQUIER archivo con el mismo nombre en CUALQUIER colección. Si dos colecciones tienen `kick.wav`, la segunda subida se detecta como duplicado del primero. Fix: eliminar fallback de nombre; dedup solo por hash+tracking. Nombre no es identidad.
- [Sync rename offline]: `renombrarColeccionEnServidor` retornaba `false` si estaba offline sin encolar. El callback en syncWatcherSetup hacía `.catch()` fire-and-forget → rename perdido silenciosamente. Fix: encolar en offlineQueue con `tipo: 'renombrar_coleccion'` + `claveDuplicacion` para dedup. El callback debe usar await y solo actualizar tracking local si el server rename falla.
- [Sync imagenUrl Tauri origin]: URLs relativas (`/wp-content/...`) en `imagenUrl` se resuelven contra `tauri://localhost` en ventana Tauri → 404. `sync.tsx` DEBE setear `window.__KAMPLES_CONFIG__` con `serverUrl` derivado de `GLORY_CONTEXT.apiUrl` para que `obtenerOrigenServidorSync()` pueda resolver URLs absolutas.
- [Sync rutasEnVuelo null hash]: Cuando `calcularHashParcial` retorna null (OneDrive cloud-only, FS error), las capas de dedup por hash (2+3) se bypasean completamente. Sin guard por ruta, el mismo archivo puede subirse N veces en paralelo. Fix: `rutasEnVuelo` Set (path-based) en `subirArchivo()` — add antes del POST, delete en finally.
- [Sync portada desktop]: `imagenUrl` puede venir relativa (`/wp-content/...`). En ventana Tauri/MPA debe resolverse contra el origen del servidor; si no, `<img>` apunta al origen local de la app y no carga.
- [Sync portada tardía]: Si la imagen se genera después de los retries post-upload, queda `null` indefinidamente. Requiere rehidratación periódica con throttle + parse defensivo `imagenUrl|imagen_url`.
- [Sync portada reemplazada]: Rehidratar solo entradas con `imagenUrl=null` no alcanza. Si el historial ya tenía una URL vieja, la portada editada nunca converge. La reconciliación debe comparar `sampleId -> imagenUrl` contra el snapshot remoto y el render desktop debe invalidar caché del `src` con una versión acotada porque algunos flujos reutilizan la misma ruta pública.
- [Sync portada fallback]: El endpoint `/me/sync/colecciones` puede devolver samples válidos con `imagen_url = null`. El panel sync no debe caer a icono vacío si el resto de la app usa `obtenerImagenColor(sampleId)` como fallback visual. Alinear el render entre surfaces evita falsos "no hay imagen" aunque la portada propia aún no exista.
- [Sync contract]: Un endpoint de sync no puede ocultar estados transitorios (`procesando`) si el cliente usa snapshot para purgar locales. Debe exponer estados visibles para consistencia eventual.
- [Sync purge safety]: Antes de mover a papelera por "ausente en servidor", aplicar ventana de gracia para evitar falsos positivos por latencia pipeline/cache.
- [Sync upload→coleccion]: `moverSampleEnServidorPublico` (PUT /me/coleccionados/{id}/carpeta) solo actualiza `samples.metadata.carpeta_primaria` — NO inserta en `coleccion_samples`. Para que un sample aparezca dentro de una colección en sync/web, se DEBE hacer POST `/colecciones/{colId}/samples` (`ColeccionesCrudController::agregarSample`). Sin ambas llamadas, el sample queda en `sinColeccion` en el siguiente sync.

### Tauri Permisos
- [Tauri 2 core:default permisos]: `core:default` incluye `core:window:default` que es SOLO lectura (isMinimized, isVisible, size, etc.). Mutaciones como `minimize()`, `hide()`, `show()`, `setFocus()`, `center()`, `close()` requieren permisos explícitos: `core:window:allow-minimize`, etc. Sin ellos, las llamadas JS fallan silenciosamente — los catch vacíos ocultan el error.

### Rehidratación
- [Rehidratación historial]: Corregir solo el fetch de imagen post-upload no arregla entradas YA persistidas con `imagenUrl: null`. Al iniciar sync, `rehidratarImagenesPendientes()` hace batch GET `/samples?creador=username&per_page=100`, construye mapa sampleId→imagenUrl y actualiza todas las entradas sin imagen. Una request, N actualizaciones. El endpoint de listado envuelve en doble envelope: `{ data: { data: [...], pagination } }`.
- [Explorar propias]: `ColeccionesRepository::explorarPublicas()` usa `WHERE (publica OR usuario_id = :owner)` + `propio_boost = 100.0` en ORDER BY para colecciones propias primero. Rama sin $userId no muestra privadas (correcto: anon solo ve públicas).

---

## Sentinel / Análisis Estático

- `sentinel-disable-file` en docblock, `sentinel-disable-next-line` línea inmediatamente anterior.
- PS WriteAllLines corrompe template literals. CTEs excluidas de `repository-sin-whitelist`. BaseRepository excluido globalmente.
- `usestate-excesivo`: 3 × numComponentes. Hooks: 300 lín máx. Brace counting bug: `} catch (e) {`. Tests: `npx mocha --grep`.
- [lock-sin-finally]: La regla debe detectar LLAMADAS (`::advisoryLock(` o `->advisoryLock(`) no definiciones ni comentarios. Regex: `/(->|::)advisory[Ll]ock\s*\(/`.
- [query-doble-verificacion]: La regex extrae el último `\w+` de la línea — cuando el SQL usa `ColName::CONST`, captura el nombre de la clase (ej. `'likescols'`). Fix: excluir palabras que terminan en `cols|enums|dto|schema` y la palabra `tabla`.
- [hardcoded-sql-column]: JSONB path `metadata->'tags'` detectado como columna hardcoded. Fix: excluir si precedido por `->'` o `->>'`. También excluir claves PDO `$params['col']` (contexto `\[['"]?$`).
- [undefined-class-constant]: Si la clase está en el índice pero no tiene la constante → es error real. LikesCols y AlgoritmoEstadoCols no tienen `ID` — tablas con PK compuesta o `usuario_id` como PK.
- [schema generator]: `buscarPorUsuario` y `buscarActivos` usaban `::ID` en ORDER BY. Para tablas sin columna `id`, debe usarse `static::colId()` que retorna dinámicamente la PK correcta.
- [JsonHelper]: Clase `App\Helpers\JsonHelper` centraliza `json_decode` + `json_last_error`. Usar `::decode()` para null en error, `::decodeOrDefault($default)` para fallback. Siempre añadir `use App\Helpers\JsonHelper;` — NO usar FQN inline (`\App\Helpers\JsonHelper::`).
- [interval-sin-whitelist]: VENTANA_WHITELIST=40 insuficiente si in_array está >40 líneas antes. Ampliada a 60. `@codeSentinel-ignore INTERVAL` NO es el formato correcto — usar `// sentinel-disable-next-line interval-sin-whitelist`.
- [hardcoded-enum-value]: `private const ESTADO_ACTIVO = 'activo'` son definiciones de constante, no hardcoded values. Fix en regla: saltar líneas con `const [A-Z_][A-Z0-9_]+ =` (UPPER_CASE).
- [retorno-ignorado-repo]: Framework Glory usa métodos orquestación void. Excluir archivos en `/Glory/` pasando rutaArchivo opcional a verificarRetornoIgnoradoRepo().
- [tieneSentinelDisable]: Requiere `sentinel-disable-next-line <reglaId>` en línea INMEDIATAMENTE anterior. NUNCA dentro de JSDoc multilínea — línea i-1 es `*/`, no el texto del comentario.
- [promise-sin-catch]: Ventana de 6 líneas es muy estricta para cadenas .then() multilinea. Ampliada a 20.
- [html-nativo-en-vez-de-componente]: `<input type="file">` es excepción válida — se usa con ref para file picker. Excluir junto con `type="hidden"`.
- [hardcoded-sql-column JSONB fix]: match.index apunta al `'` de apertura. Los 2 chars antes son `->`. Fix: `substring(match.index-2, match.index) === '->'`. Error previo: checked `->('|")$` pero precede3 no contiene la comilla de apertura — es el texto ANTES de ella.

---

## SEO / Glory Renderers

- [wp_head timing]: wp_head() se ejecuta ANTES del callable de páginas (renderReactIsland). Para SEO dinámico, hay que hookear en acción `wp` (prioridad > 1 ya que resolverRutaDinamica es prioridad 1). RuntimeSeoData es el puente.
- [canonical obligatorio]: Al remover `rel_canonical` del core WP con `remove_action('wp_head', 'rel_canonical')`, MetaTagRenderer::printCanonical DEBE siempre emitir un canonical — fallback a get_permalink() si no hay override.
- [WP_Sitemaps_Provider signatures]: Los métodos abstractos (`get_url_list`, `get_max_num_pages`) no tienen type hints en los stubs. Overrides con type hints causan incompatibilidad. Omitir type hints y castear internamente.
- [JSON-LD escaping]: Usar `JSON_UNESCAPED_SLASHES` en json_encode para URLs limpias en scripts JSON-LD. `JSON_UNESCAPED_UNICODE` para caracteres españoles.
- [og:audio Twitter Cards]: Cuando hay og:audio disponible, usar `twitter:card = player` en vez de `summary_large_image`. Permite embedding de audio en Twitter.
- [RuntimeSeoData vs update_post_meta]: No usar update_post_meta para SEO dinámico porque todas las rutas /sample/* comparten el mismo WP post ID — sobreescribiría para todos. RuntimeSeoData (static, request-scoped) es la solución correcta.
- [BaseRepository consultarValor]: Método nuevo para queries escalares (COUNT, SUM, MAX). Retorna `reset($fila)` de consultarUno. Necesario para contarParaSitemap.

---

## Terminología y Patrones

- **"Coleccionar" (+):** = descargar. Crédito. Tabla `descargas`. Desktop: sync. Campo: `yaColeccionado` (o `esMio`).
- **"Guardar en colección" (Bookmark):** Tabla `coleccion_samples`. NO crédito. Campo: `yaGuardadoEnColeccion`.
- Ambos + `yaComentado` + `esMio` en sqlSelectSamples() subqueries. Repos deben aceptar `?int $userId`.
- Cache Transients: invalidarCacheGlobal() SQL LIKE. TTL 5min. WP-CLI no disponible LocalWP.
- Keep-alive: 4 causas (MAX_CACHE=5, tabActiva global, rutaActual hooks, useTabsIsla reset). Fix: MAX=20, useIslaActiva, useValorCongelado, tabsPorIsla.
