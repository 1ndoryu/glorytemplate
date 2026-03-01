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
- **F9 Desktop:** Tauri 2.0 MVP completo (tray+menu, 6 servicios TS, JWT backend, Vite proxy, auth, sync bidireccional, drag-to-DAW nativo, auto-sync). Build: exe+MSI+NSIS.
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

## SPRINT ACTUAL — Tareas 353-358 (Sync v2 + Cola IA + UI)

> **Estado:** COMPLETADO. Todas las tareas implementadas y commiteadas.

---

### C353 — Ocultar Explorador temporalmente
> **Complejidad:** Baja | **Estado:** ✅ COMPLETADO [AG-IA] | **Commit:** `3c2b570b`

### C354 — Fix subida duplicada de audio
> **Complejidad:** Media | **Estado:** ✅ RESUELTO [AG-IA] — Solucionado por Sync v2

**Resolución:** El nuevo tracking v2 (`syncTrackingService`) usa `sampleId_coleccionId` como clave. En `inicializarSyncBidireccional()` el callback `onArchivoNuevo` ahora verifica primero contra tracking v2 (busca por ruta y por nombre) antes de encolar upload. Si el sample ya está trackeado, se ignora.

### C355 — Sync v2: Backend + Desktop Services + Refactor
> **Complejidad:** Muy alta | **Estado:** ✅ COMPLETADO [AG-IA] | **Commit:** `2aaafa0b`

Archivos nuevos: SyncController.php, SyncRepository.php, syncTrackingService.ts (~338 lín), syncCollectionService.ts (~528 lín). Refactor: syncService.ts (v2+v1 fallback en todos los métodos). Migración automática v1→v2. Tipos actualizados en ambos global.d.ts.

### C356 — Sistema de Cola IA con detección de rate limit
> **Complejidad:** Alta | **Estado:** ✅ COMPLETADO [AG-IA] | **Commit:** `3c2b570b`

19 archivos, +2119 líneas. Schema+generados, ColaProcesamientoIaRepository, ProcesadorColaIA (cron 15min), GroqHttpClient reescrito, PipelineAudio/ServicioIA/ServicioModeracionIA con encolado 429, ColaIaController (5 endpoints), TabColaIaAdmin.tsx+hook+api+CSS.

### C357 — FileWatcher: Handlers de carpetas/colecciones
> **Complejidad:** Alta | **Estado:** ✅ COMPLETADO [AG-IA] | **Commit:** `d6c8b8d8`

fileWatcherService.ts: callbacks OnCarpetaNuevaFn/OnCarpetaRenombradaFn, detección rename (delete→create grace 3s), procesarEventoCarpeta(). syncService.ts: wiring callbacks carpeta, v2 check en onArchivoNuevo, sincronizarEstructuraCarpetas con collectionModule.

### C358 — SyncPanel: Tabs + Historial + Colecciones + Re-sync
> **Complejidad:** Media | **Estado:** ✅ COMPLETADO [AG-IA] | **Commit:** `d6c8b8d8`

syncService.ts: +3 funciones (obtenerHistorialSync, obtenerColeccionesSync, forzarResync). syncStore.ts: TabSync, EntradaHistorial, ColeccionSyncInfo types + state + actions. usePanelSincronizacion.ts: tabs, carga datos por tab, ejecutarSyncConProgreso compartido, forzarResyncAhora. PanelSincronizacion.tsx: 3 tabs (Estado/Historial/Colecciones), TabEstado con botón re-sync, TabHistorial con iconos por tipo + tiempo relativo, TabColecciones con info carpetas. sincronizacion.css: +180 líneas (tabs, historial, colecciones, estado vacío).

#### Problema
Groq free tier tiene cuotas. Si se alcanza el límite (HTTP 429), los samples se quedan en `procesando` eternamente. Los comentarios/publicaciones pierden moderación IA y se aprueban sin filtro (fallback actual).

#### Arquitectura: Cola de Procesamiento IA

**1. Nueva tabla PostgreSQL `cola_procesamiento_ia`:**
```sql
CREATE TABLE cola_procesamiento_ia (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('sample', 'comentario', 'publicacion')),
    entidad_id INTEGER NOT NULL,
    operacion VARCHAR(30) NOT NULL CHECK (operacion IN ('analisis_audio', 'moderacion_texto', 'moderacion_imagen')),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completado', 'error_reintento', 'error_final')),
    intentos INTEGER NOT NULL DEFAULT 0,
    max_intentos INTEGER NOT NULL DEFAULT 2,
    ultimo_error TEXT,
    proximo_intento TIMESTAMP,
    creado_at TIMESTAMP NOT NULL DEFAULT NOW(),
    procesado_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);
CREATE INDEX idx_cola_ia_estado ON cola_procesamiento_ia(estado, proximo_intento);
CREATE INDEX idx_cola_ia_tipo ON cola_procesamiento_ia(tipo, entidad_id);
```

**2. Flujo de retry:**
```
Subida sample → PipelineAudio intenta procesar
  → Si OK: sample.estado = 'activo', no encolar
  → Si 429: Encolar en cola_procesamiento_ia
    → intento 1 inmediato (ya falló)
    → intento 2 en +30 minutos (wp_schedule_single_event)
    → Si falla intento 2: estado = 'error_final', sample queda en 'procesando'
    → Cola se re-procesa cada hora via WP Cron
    → Cuando Groq responde → procesar → sample.estado = 'activo'
```

**3. Flujo moderación (comentarios/publicaciones):**
```
Nuevo comentario/publicación → ServicioModeracionIA intenta moderar
  → Si OK: publicar normalmente
  → Si 429: Encolar + marcar como 'pendiente de supervisión' (visible pero no publicado)
  → Cuando cola se procese y Groq responda → aprobar/rechazar
  → El contenido NO se muestra hasta que la IA responda
```

**4. GroqHttpClient — Propagación de 429:**
- Modificar `peticionCurl()` y `peticionCurlMultipart()` para retornar un resultado tipado en vez de `null` genérico.
- Nuevo tipo de retorno: `['ok' => false, 'esRateLimit' => true, 'retryAfter' => 23.7]`
- Los callers (`ServicioIA`, `ServicioModeracionIA`) detectan `esRateLimit` y deciden encolar.

**5. Procesador de cola (WP Cron):**
- Clase `ProcesadorColaIA` registrada como WP Cron hook cada 15 minutos.
- Selecciona items con `estado = 'pendiente' OR (estado = 'error_reintento' AND proximo_intento <= NOW())`.
- Procesa en orden FIFO con límite de 10 items/ejecución.
- Si encuentra 429 otra vez → incrementa `intentos`, programa `proximo_intento += 30min`.

**6. Panel Admin — Tab "Cola IA":**
- **Endpoint:** `GET /admin/cola-ia` → stats + lista de items.
- **Endpoint:** `POST /admin/cola-ia/{id}/reintentar` → fuerza reintento inmediato.
- **Endpoint:** `POST /admin/cola-ia/reintentar-todos` → reinicia todos los `error_final`.
- **Stats visibles:** Procesados hoy, en cola, en error, tasa éxito, último 429 detectado.
- **Componente React:** `TabColaIA.tsx` con tabla paginada de items en cola.

**Archivos nuevos:**
- `App/Config/Schema/ColaProcesamientoIASchema.php` → schema + generados
- `App/Kamples/Database/Repositories/ColaIARepository.php`
- `App/Kamples/Api/Controladores/ColaIAController.php` (o endpoints en AdminController)
- `App/Kamples/Services/ProcesadorColaIA.php`
- `App/React/components/admin/TabColaIA.tsx`
- `App/React/hooks/admin/useTabColaIA.ts`

**Archivos modificados:**
- `App/Kamples/Api/GroqHttpClient.php` — retorno tipado con detección 429
- `App/Kamples/Api/PipelineAudio.php` — encolar si 429
- `App/Kamples/Api/ServicioIA.php` — propagar resultado tipado
- `App/Kamples/Api/ServicioModeracionIA.php` — encolar si 429
- `App/Kamples/Api/Controladores/AdminController.php` — registrar nuevas rutas
- `App/React/islands/admin/AdminPanelIsland.tsx` — nuevo tab

---

### Auditoría Sync v2 — Hallazgos y Correcciones
> **Estado:** ✅ PARCIAL [AG-IA] | **Commit:** `129de63f`
> Se auditaron los 12 archivos del sistema Sync v2. 13 hallazgos identificados, 7 corregidos.

**Corregidos (commit `129de63f`):**
1. **BUG — descargasEnCurso no aplicado en v2:** syncCollectionService descargaba sin marcar en `descargasEnCurso`, causando que el watcher re-subiera archivos recién descargados. → Creado `syncGuards.ts` con `marcarDescargaEnCurso()` centralizado, aplicado en syncCollectionService + syncService.
2. **BUG — Polling ejecutaba sync completo cada 60s:** `sincronizarEstructuraCarpetas()` llamaba `sincronizarColecciones()` sin restricción, descargando todos los samples cada minuto. → Añadido parámetro `soloEstructura=true` que solo crea carpetas sin descargar.
3. **BUG — manejarMoveLocal no actualiza tracking v2:** Solo actualizaba `indiceArchivos` (v1), dejando tracking v2 desincronizado. → Ahora actualiza `registrarArchivo()` + `registrarAccion('movido')` en tracking v2. También arreglado `actualizarRutaYCarpeta()`.
4. **PERF — Lookups O(n) en tracking:** `buscarArchivoPorRuta()` y `buscarArchivoPorNombre()` iteraban todos los archivos. → Índices secundarios `indiceRuta: Map` y `indiceNombre: Map` con O(1) lookup.
5. **PERF — persistir() en cada operación:** 100 descargas = 100 escrituras a disco. → Batch mode con `iniciarLote()/finalizarLote()` que acumula cambios y persiste una vez.
6. **ARCH — obtenerBaseUrl duplicado 3x:** Misma función en syncService, syncCollectionService y uploadQueueService. → Centralizado en `syncGuards.ts` como `obtenerBaseUrlSync()`.
7. **ARCH — descargasEnCurso/GRACIA_DESCARGA_MS duplicado:** Set + timeout en syncService. → Centralizado en `syncGuards.ts`.

**Pendientes resueltos (commit a14f09e0):**
- ✅ **ARCH — syncService.ts 1273 → 448 líneas:** Split en 4 módulos: syncState (tipos+estado), syncDownloadV1 (legacy), syncWatcherSetup (watcher+ops), syncService (facade). Commit `4e51b73c`.
- ✅ **ARCH — Código v1 muerto:** V1 aislado en syncDownloadV1.ts. Paths v1 en otros módulos son fallback defensivo, se mantienen.
- ✅ **PERF — sinColeccion.includes() O(1):** Set sombra (`sinColeccionSet`) para lookups O(1). Array interno mantenido para serialización al store.
- ✅ **FEATURE — Cola offline:** offlineQueueService extendido con: tipo `mover_carpeta`, deduplicación por `claveDuplicacion`, max intentos, store cacheado. syncWatcherSetup encola moves cuando offline.
- ✅ **FEATURE — Detección disco lleno:** Comando Rust `obtener_espacio_disponible` (fs2 crate). syncCollectionService verifica espacio antes de descargas masivas (500MB margen).
- ✅ **FEATURE — Lock de sync concurrente:** syncGuards expone lock con Promise sharing (callers duplicados reciben misma Promise). sincronizarConServidor usa adquirirLockSync/liberarLockSync.

**Lecciones aprendidas:**
- [syncGuards]: Archivo zero-imports para evitar circular deps (syncService ↔ syncCollectionService ambos necesitan descargasEnCurso).
- [tracking]: `registrarArchivo()` funciona como upsert — si la clave existe, actualiza entry + reindexar.
- [polling]: El polling de 60s SOLO debe crear estructura de carpetas, nunca descargar samples automáticamente.
- [indices]: Map secondary indexes deben reconstruirse después de `cargarDatos()` y `migrarDesdeV1()`.
- [sinColeccionSet]: Patrón shadow Set — mantener array para serialización + Set para O(1) lookup. Reconstruir en reconstruirIndices().
- [offlineQueue]: Deduplicación por claveDuplicacion evita encolar N moves para el mismo sample. Solo el último destino importa.
- [lock]: Patrón Promise sharing — adquirirLockSync retorna promesa existente si hay sync en curso. Evita trabajo duplicado y IO concurrente.
- [disco]: fs2 crate da espacio disponible cross-platform. El guard es fail-open (si no puede verificar, permite descarga).

---

### C355+C357 — Sync v2: Sincronización basada en Colecciones
> **Complejidad:** Muy alta | **Dependencias:** C353 (explorador oculto) | **Estado:** Arquitectura definida

#### Cambio fundamental
**Antes:** Carpetas locales = metadata IA (`carpeta_primaria`/`carpeta_secundaria`). La IA decide dónde va el sample.
**Después:** Carpetas locales = colecciones del usuario. El usuario decide dónde va el sample.

#### Estructura de carpetas local
```
carpetaSync/
├── Mi Colección Hip-Hop/         ← colección ID 45 del server
│   ├── sample1.wav
│   ├── sample2.wav
│   └── Favorites/                ← subcarpeta libre, samples siguen perteneciendo a colección 45
│       └── sample3.wav
├── Beats Dark/                   ← colección ID 78
│   └── sample4.wav
└── Sin colección/                ← samples descargados/coleccionados sin colección asignada
    ├── sample5.wav
    └── sample6.wav
```

#### Nuevo modelo de tracking (Tauri Store)
```typescript
/* Reemplaza el flat array ArchivoLocal[] actual */
interface BaseSyncLocal {
    /* Mapeo sampleId → info de tracking. Clave: "{sampleId}_{coleccionId}" */
    archivos: Record<string, ArchivoTracking>;
    /* Mapeo colección server → carpeta local */
    colecciones: Record<number, ColeccionLocal>;
    /* Samples descargados sin colección */
    sinColeccion: Set<number>;
    /* Historial de acciones para el tab historial */
    historial: AccionHistorial[];
}

interface ArchivoTracking {
    sampleId: number;
    coleccionId: number | null;     /* null = "Sin colección" */
    rutaLocal: string;              /* ruta relativa desde carpetaSync */
    nombreLocal: string;            /* nombre actual del archivo (puede diferir del server) */
    nombreServidor: string;         /* nombre original del server */
    descargadoEn: number;
    tamano: number;
    syncDeshabilitado: boolean;     /* true = borrado localmente, no re-descargar */
}

interface ColeccionLocal {
    id: number;
    nombre: string;                 /* nombre de la colección en server */
    carpetaLocal: string;           /* nombre de la carpeta en disco */
    creadaLocalmente: boolean;      /* true si fue creada como carpeta local primero */
}

interface AccionHistorial {
    tipo: 'descarga' | 'subida' | 'movido' | 'renombrado' | 'creado' | 'eliminado_local';
    descripcion: string;
    sampleId?: number;
    coleccionId?: number;
    timestamp: number;
}
```

#### Nuevo endpoint backend
```
GET /me/sync/colecciones
```
Retorna colecciones del usuario con sus samples para sync:
```json
{
    "colecciones": [
        {
            "id": 45,
            "nombre": "Mi Colección Hip-Hop",
            "samples": [
                { "id": 101, "titulo": "Dark Beat", "formato": "wav" },
                { "id": 102, "titulo": "Trap Melody", "formato": "wav" }
            ]
        }
    ],
    "sinColeccion": [
        { "id": 200, "titulo": "Random Loop", "formato": "wav" }
    ]
}
```
**Nota:** `sinColeccion` = samples descargados (tienen registro en `descargas`) que NO están en ninguna colección (`coleccion_samples`).

#### Tabla de escenarios — Acciones locales → Servidor

| # | Acción local | Detección | Acción en servidor | Notas |
|---|---|---|---|---|
| 1 | Mover sample entre carpetas | fileWatcher (MOVE) | `POST /colecciones/{newId}/samples/{sampleId}` + `DELETE /colecciones/{oldId}/samples/{sampleId}` | Mapear carpeta → coleccionId via tracking |
| 2 | Renombrar carpeta | fileWatcher (RENAME dir) | `PUT /colecciones/{id}` con nuevo nombre | Solo carpetas mapeadas a colecciones |
| 3 | Crear carpeta nueva | fileWatcher (CREATE dir) | `POST /colecciones` con nombre de carpeta | Solo en raíz de sync, no subcarpetas |
| 4 | Mover sample a carpeta nueva | Combo: crear colección + mover | Crear colección + agregar sample | |
| 5 | Renombrar sample | fileWatcher (RENAME file) | **Nada en servidor** — nombre local es libre | Actualizar tracking local |
| 6 | Borrar sample | fileWatcher (REMOVE file) | **Nada en servidor** — marcar `syncDeshabilitado` | No re-descarga en próxima sync |
| 7 | Borrar carpeta completa | fileWatcher (REMOVE dir) | **Nada en servidor** — marcar all samples `syncDeshabilitado` | Colección permanece en server |
| 8 | Copiar sample en otra carpeta | fileWatcher (CREATE file) | `POST /colecciones/{id}/samples/{sampleId}` (agregar a colección) | No subir de nuevo, reconocer por hash/nombre |
| 9 | Forzar re-sync | Botón UI | Limpiar `syncDeshabilitado` en todo | Re-descarga todo lo que falta |

#### Tabla de escenarios — Servidor → Local

| # | Evento servidor | Detección | Acción local | Notas |
|---|---|---|---|---|
| 10 | Sample eliminado del server | Polling: sample no aparece en respuesta | **Nada** — archivo local permanece | Marcar como "huérfano" en tracking (informativo) |
| 11 | Colección eliminada en server | Polling: colección desaparece | **Nada** — carpeta local permanece | Marcar como "huérfana" |
| 12 | Colección renombrada en server | Polling: nombre cambió | Renombrar carpeta local | Con guard para no triggear watcher |
| 13 | Sample agregado a colección webui | Polling: sample nuevo en respuesta | Descargar a carpeta correspondiente | Normal sync flow |
| 14 | Sample agregado a nueva colección | Polling: nueva colección con samples | Crear carpeta + descargar | Normal sync flow |

#### Escenarios adicionales anticipados (edge cases)

| # | Escenario | Comportamiento |
|---|---|---|
| 15 | **Conflicto de nombres de carpeta** — dos colecciones con mismo nombre | Agregar sufijo ` (2)` a la carpeta local. Tracking mapea ambas correctamente. |
| 16 | **Disco lleno durante sync** | Detectar error de escritura. Pausar sync. Notificar en SyncPanel. Reanudar cuando haya espacio. |
| 17 | **Red interrumpida mid-sync** | Guardar progreso parcial. Reanudar desde el último sample descargado exitosamente. |
| 18 | **Carpeta de sync eliminada/movida externamente** | Detectar al iniciar. Pedir al usuario re-seleccionar carpeta. No perder tracking (se puede reconstruir). |
| 19 | **Múltiples instancias de la app** | Lock file en carpeta sync para evitar sync concurrentes. |
| 20 | **Sample aparece en 2+ colecciones** | Descargar una vez, crear hardlink/copia en cada carpeta. Tracking: múltiples entradas con mismo sampleId, diferente coleccionId. |
| 21 | **Subcarpeta dentro de colección** | Permitido. Samples en subcarpetas pertenecen a la colección padre. fileWatcher sube/trackea pero con coleccionId del padre. |
| 22 | **Caracteres especiales en nombre de colección** | Sanitizar para filesystem (reemplazar `/\:*?"<>|` con `-`). Mantener nombre real en tracking. |
| 23 | **Offline → Online** | Al reconectar, ejecutar sync completa. Acciones locales pendientes se encolan en offlineQueueService y se sincronizan al reconectar. |
| 24 | **Sample sin audio (solo metadata)** | Skip en sync. Solo sincronizar samples con `ruta_original` válida. |

#### Módulos Tauri a crear/modificar

**Nuevos:**
- `desktop/src/services/syncTrackingService.ts` — CRUD del Tauri Store tipado (reemplaza flat array)
- `desktop/src/services/syncCollectionService.ts` — Lógica de mapeo colecciones ↔ carpetas
- `desktop/src/services/syncHistorialService.ts` — Registro de acciones para historial UI

**Modificados:**
- `desktop/src/services/syncService.ts` — Refactorizar `sincronizarConServidor()` para usar colecciones. Split en submódulos.
- `desktop/src/services/fileWatcherService.ts` — Nuevos handlers para RENAME dir, CREATE dir, detectar colección padre.
- `desktop/src/services/uploadQueueService.ts` — Al subir, vincular a colección si está en carpeta mapeada.

**Backend nuevo:**
- `App/Kamples/Api/Controladores/SyncController.php` — `GET /me/sync/colecciones` + endpoints auxiliares
- `App/Kamples/Database/Repositories/SyncRepository.php` — Queries optimizadas para sync (colecciones + samples + descargas sin colección en una query)

---

### C358 — SyncPanel: Modal + Stats persistentes + Historial
> **Complejidad:** Media | **Dependencias:** C355 (tracking service) | **Estado:** Arquitectura definida

#### Cambios UI
1. **Modal centrado** en vez de dropdown. Sin header. Tamaño ~600x500px. Cierre con click fuera o X.
2. **Stats persistentes**: `usePanelSincronizacion` debe leer espacio usado y total archivos del tracking service (Tauri Store), no calcularlo en memoria.
3. **Tab historial**: Nuevo tab con lista cronológica de acciones (descarga, subida, movido, renombrado, etc.) desde `syncHistorialService`.

#### Tabs del modal:
- **Sync** (actual): carpeta, toggle, botón sincronizar, progreso, botón forzar re-sync.
- **Historial**: lista de acciones con timestamp, tipo icono, y descripción. Scroll virtual si >100 items.

#### Archivos:
- `App/React/components/desktop/PanelSincronizacion.tsx` — convertir a modal
- `App/React/hooks/desktop/usePanelSincronizacion.ts` — leer stats desde tracking service
- `App/React/styles/desktop/panelSincronizacion.css` — estilos modal

---

### Orden de implementación detallado

```
Fase A — Inmediato (sin dependencias):
  C353: Ocultar explorador (5 min)
  C356: Cola IA (2-3 sesiones)
    A1. Schema + generados cola_procesamiento_ia
    A2. ColaIARepository + ProcesadorColaIA
    A3. GroqHttpClient retorno tipado + detección 429
    A4. PipelineAudio + ServicioModeracionIA → encolar si 429
    A5. WP Cron hook para procesar cola
    A6. Endpoints admin
    A7. TabColaIA React

Fase B — Sync v2 foundation (1-2 sesiones):
  C355: Sync basado en colecciones
    B1. SyncController backend + SyncRepository
    B2. syncTrackingService (Tauri Store tipado)
    B3. syncCollectionService (mapeo colecciones ↔ carpetas)
    B4. Refactorizar sincronizarConServidor()
    B5. Migración: convertir índice plano actual al nuevo formato

Fase C — Sync v2 bidireccional (1-2 sesiones):
  C357: Edge cases sync
    C1. fileWatcherService: nuevos handlers (rename dir, create dir, copy detection)
    C2. syncService: handlers de acciones locales → API calls
    C3. Escenarios servidor → local (polling mejorado)
    C4. Botón forzar re-sync
    C5. offlineQueueService: colas de acciones pendientes

Fase D — UI polish (1 sesión):
  C354: Fix duplicados (ya resuelto si Sync v2 está)
  C358: SyncPanel modal + historial
    D1. syncHistorialService + persistencia
    D2. PanelSincronizacion → modal + tabs
    D3. Stats persistentes
```

### Samples en raíz de sync → Sin colección
> **Estado:** ✅ COMPLETADO [AG-IA] | **Commit:** `50750a65`

Cuando el usuario coloca samples en la carpeta raíz (fuera de cualquier colección), al subirlos se mueven automáticamente a `Sin colección/`. syncTrackingService: `totalSinColeccion()`. syncService: `moverArchivoASinColeccion()` (mkdir+rename+tracking+historial). uploadQueueService: else branch cuando `carpetas.length === 0`. PanelSincronizacion: entrada virtual id=0 con icono FolderOpen e itálica. IconoHistorial: alineado con TipoAccionHistorial completo (`eliminado_local`, `renombrado`, `creado`, `subida`, `movido`).

---

359. que todos los estados vacíos, de carga, etc como div className="coleccionVacia", sean un componente y este centralizado para que haya coherencia visual entre todos los estados vacíos. 

360. Cuando un usuario elimina su sample que subio, debe restarse un credito.

361. 

---

### Sentinel + VarSense — Fix completo
> **Estado:** ✅ COMPLETADO [AG-SNC] | **Commit:** `66067b87`

**VarSense (62/62 errores corregidos):** 15 archivos CSS — sincronizacion, colaIaAdmin, publicacionDetalle, panelLateral, tarjetaPublicacion, comunidad, tooltip, planes, adminPanel, bienvenida, cardPerfil, tarjetaColeccion, sidebar, selectFiltro, modalColeccion. Mappings principales: `--superficie`→`--fondoElevado2`, `--borde`→`--bordeSutil`, `--textoTenue`→`--textoTerciario`, `--colorTexto`→`--textoPrimario`, `--espaciado*`→`--espacio*`, hardcoded colors→variables.

**Sentinel (27/27 violaciones resueltas):**
- Info 21/21: Barras decorativas eliminadas en syncTrackingService.ts(9), syncCollectionService.ts(9), syncGuards.ts(3).
- Warning 4/4: PanelSincronizacion.tsx split (438→115 lín + SincPanelTabs.tsx 270 lín), AdminController.php split (457→300 lín + AdminModeracionController.php 190 lín), PipelineAudio.php split (463→350 lín + PipelineAudioHelpers.php 115 lín), SamplesModificacionController try-catch.
- Hint 2/2: ColaProcesamientoIaRepository `SELECT *` → columnas explícitas con `ColaProcesamientoIaCols::TODAS`.

### Tray Icon → SincPanel
> **Estado:** ✅ COMPLETADO [AG-SNC] | **Commit:** `66067b87`

- Rust (lib.rs): Left-click en tray icon emite `abrir-panel-sync` + show/focus ventana. Menú tray: +item "Sincronización" con mismo comportamiento.
- Frontend (main.tsx): Listener `@tauri-apps/api/event` abre panel via `useSyncStore.getState().abrirPanel()`.
- En web: modal centrado (componente Modal existente, sin header).

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
- [Sync window bugs]: `window-state` plugin restaura visibilidad de sesiones previas → `with_denylist(&["sync-panel"])` excluye del state save/restore. `focus: false` en tauri.conf.json previene auto-foco al crear. `onFocusChanged` + fallback polling `isFocused()` con `ventana.hide()` en blur cierra al click fuera incluso en frameless/always-on-top. sync.tsx NO debe llamar `inicializarDesktop()` completo — solo `configurarApiDesktop()` + `inicializarSyncService()`. Para evitar ventana sin estilos, usar `sync.css` dedicado importado por `sync.tsx` y link directo en `sync.html`.

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


