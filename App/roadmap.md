# Kamples — Roadmap Integral de Producto

> **Versión:** 4.0  
> **Última actualización:** 26/02/2026 (iteración v4.0 — compactación + sprint UI/UX)  
> **Stack base:** Glory Framework (WordPress + React Islands + TypeScript)  
> **Competencia directa:** Splice

---

## Visión del Producto

Kamples es una plataforma de samples de audio con alma de red social, impulsada por un algoritmo de descubrimiento de nivel superior. Es un ecosistema donde productores descubren, comparten, colaboran y monetizan su contenido sonoro. Ultrarrápida, minimalista y adictiva.

**Diferenciadores clave frente a Splice:**

- Algoritmo de recomendación multi-señal (6 factores) vs. búsqueda básica
- Red social nativa (feed, follows, mensajes, publicaciones)
- Marketplace híbrido (suscripción + venta directa + revenue share)
- Análisis de audio con IA (Groq Whisper + LLM) para metadatos automáticos
- App desktop con integración DAW (drag-to-DAW, piano one-shot)
- Waveforms interactivos y reproductor avanzado

---

## Decisiones Arquitectónicas

- **PostgreSQL + pgvector** local (127.0.0.1:5432/kamples) — JSONB para metadata, embeddings para similitud
- **Almacenamiento WordPress** — WP uploads + attachment API. Pipeline: original(.wav) → optimizado(.mp3) → waveform(.json) → preview(.mp3). Seguridad via htaccess/permisos. Preparado para VPS.
- **WebSocket local** — Node/Bun local para desarrollo. Canales: mensajes, notificaciones, sync, feed. Preparar para VPS después.
- **IA multi-modelo** — Groq Whisper (`whisper-large-v3` → `whisper-large-v3-turbo`) para audio + Groq LLM (`openai/gpt-oss-120b` → `qwen/qwen3-32b` → `openai/gpt-oss-20b`) para JSON creativo. Reparación JSON: `moonshotai/kimi-k2-instruct-0905` → `qwen/qwen3-32b`.
- **Desktop:** Tauri 2.0 | **Móvil:** Capacitor | **Pagos:** Stripe Connect + Billing (keys live disponibles)

---

## Algoritmo de Descubrimiento (6 señales)

```
1. Similitud Audio (0.25) — pgvector coseno  |  4. Tendencias (0.15) — engagement velocity
2. Comportamiento (0.25) — likes, escucha    |  5. Grafo Social (0.10) — collaborative
3. Contexto (0.15) — BPM, key, género         |  6. Novedad (0.10) — boost logarítmico
```

---

## Páginas

| Ruta                 | Isla                     | Descripción                                        |
| -------------------- | ------------------------ | -------------------------------------------------- |
| `/`                  | `InicioIsland`           | Feed con filtros toggle + ordenamientos            |
| `/` (deslogueado)    | `LandingPublica`         | Landing page con nav flotante (sin sidebar/topbar) |
| `/sample/{slug}`     | `SampleDetalleIsland`    | Tarjeta grande + waveform + metadata + similares   |
| `/coleccion/{slug}`  | `ColeccionDetalleIsland` | Info colección + grid de samples                   |
| `/comunidad`         | `ComunidadIsland`        | Feed posts sociales con diseño diferenciado        |
| `/publicacion/{id}`  | `PublicacionIsland`      | Detalle de publicación individual + comentarios    |
| `/descubrir`         | `DescubrirIsland`        | Algoritmo personalizado                            |
| `/perfil/{username}` | `PerfilIsland`           | Perfil público                                     |
| `/libreria`          | `LibreriaIsland`         | Explorar colecciones, mis colecciones, subidos     |
| `/descargas`         | `DescargasIsland`        | Mis descargas + sugerencias "Más Ideas"            |
| `/favoritos`         | `FavoritosIsland`        | Mis favoritos + sugerencias "Más Ideas"            |
| `/mensajes`          | `MensajesIsland`         | Vista completa de conversaciones                   |
| `/planes`            | `PlanesIsland`           | Checkout Stripe                                    |
| `/reproductor`       | `ReproductorIsland`      | Player completo                                    |
| `/auth/login`        | `LoginIsland`            | Login                                              |
| `/auth/registro`     | `RegistroIsland`         | Registro                                           |
| `/admin/dashboard`   | `DashboardCreadorIsland` | Stats creador                                      |
| `/admin/panel`       | `AdminPanelIsland`       | Panel admin (KPIs, usuarios, moderación)           |
| `/explorador`        | `ExploradorIsland`       | Árbol carpetas + coleccionados backend             |

**Eliminadas:** `/perfil/editar` (ahora ModalConfiguracion), tabs de InicioIsland (reemplazadas por ordenamientos).  
**Chat flotante:** tipo Messenger en esquina inferior derecha, se abre desde modales de TopBar o /mensajes.

---

## Planes de Suscripción

|               | Free      | Pro ($5)  | Premium ($19.99) |
| ------------- | --------- | --------- | ---------------- |
| Descargas/día | 5         | 50        | Ilimitadas       |
| Calidad       | WAV       | WAV       | WAV              |
| Subida/mes    | Ilimitada | Ilimitada | Ilimitada        |
| Monetización  | 50/50     | 70/30     | 80/20            |

---

## Completado (resumen ultra-compacto)

### Por fases

- **F0-F4:** Schema BD 14 tablas, PostgresService, API REST, CSS system, colors/ dinámicos, FFmpeg, Login/Registro, PerfilIsland, ModalConfiguracion, AuthMiddleware, LandingPublica. Upload real (FormData+pipeline+IA), WaveformPlayer, ReproductorGlobal/Island, AnalizadorAudio, ServicioIA (Groq Whisper+LLM), PipelineAudio, ServicioImagenIA, tags, deduplicación. DescubrirIsland, endpoints feed/notif/msg/dashboard. BotonFollow/Like, ModalPublicar, InicioIsland (feed+tags±+ordenamientos), ModalFiltros, infinite scroll+virtualización.
- **F5 (parcial):** LibreriaIsland, ColeccionesController CRUD+sugerencias, ChatFlotante multimedia.
- **F6-F7:** DashboardCreadorIsland, SPA navigation, SampleDetalleIsland, ColeccionDetalleIsland, ComunidadIsland, ChatFlotante, ModalConfiguracion (portada). MensajesIsland, ChatIsland, NotificacionesIsland, Stripe Billing, PlanesIsland.
- **F9 Desktop:** Tauri 2.0 MVP completo (lib.rs tray+menu, 6 servicios TS, JWT backend, Vite proxy, auth instantáneo, sync panel, sync real bidireccional, drag-to-DAW nativo tauri-plugin-drag v2.1.0, auto-sync al coleccionar). Build: kamples-desktop.exe + MSI + NSIS.
- **F13 (parcial):** AdminController 6 endpoints, 3 tabs (Resumen+Usuarios+Moderación), panel moderación completo.

### Arquitectura y refactors

- **SOLID PHP:** KamplesController 1713→60 lín (12 sub-controllers + 2 helpers + 3 servicios + 1 config). 5 migraciones SQL.
- **Repository Pattern:** 27 controllers migrados, ~340 queries → 18 repos tipados. 0 PostgresService fuera de infraestructura.
- **Schema System:** 18 schemas + 36 generados (Cols+DTO) + schema.ts, CLI, SchemaRegistry. 29 PHP migrados (~270 accesos). Enums 8 tablas.
- **Sprint 5 SOLID:** 11 splits, 15 archivos nuevos, 11 <300 lín.
- **React SRP:** ~50 componentes + ~50 hooks nuevos. AbortController cleanup generalizado. 15 componentes DAW refactorizados.
- **Sentinel:** 48 reglas activas, 54 tests. 42 Zustand→selectores (~90 llamadas). 325+ violaciones corregidas (86+ archivos). Componentes Input/Checkbox/Radio/SelectorBase creados en ui/.
- **SQL fixes:** 16 archivos Cols constants, 15 archivos keys estables, 58/58 hallazgos SQL, Enums 4 tablas, 14 índices.

### Mezclador DAW

- Aislado `/Mezclador/` (50+ archivos). Features completas: stretch/drag/snap/zoom/undo/redo/corte/ghost/drift/clip/detune/selección múltiple/20 pistas. SoundTouchJS. VentanaFlotante.
- **Channel Rack + Patterns + Mixer + Piano Roll:** patronesStore, mixerStore, pianoRollStore, motor audio. 25+ componentes. Pendiente: integración CR↔Piano Roll.

### Auditorías

- **SQL/Seguridad/Profunda/React/Try-Catch:** 5 auditorías completadas, ~275 hallazgos totales, ~95% resueltos. Docs en `App/docs/`.
- **Sprint 5:** P0 4/4, P1 26/26, P2 16/18, P3 3/4.

### Social, Explorador y Desktop (R84-R93+AG-FIX+AG-COL)

- Repost completo (crear/eliminar/embebido/samples), TarjetaPublicacion unificada, PublicacionIsland, lightbox, actualización post en tiempo real, ModalEditar.
- ColeccionDetalleIsland edición, ModalColeccion modo edición, endpoint POST imagen colección, fix nested `<a>`.
- Explorador: filtrado client-side (useMemo), subcarpetas, breadcrumbs, drag-drop, crear carpetas, "Mover a carpeta", jsonb_set atómico.
- Desktop Tauri 2.0: proxy Vite, URL rewriting, auth JWT, sync bidireccional, drag-to-DAW nativo, fileWatcher, uploadQueue.
- Keep-alive SPA: MAX_CACHE_PAGES=20, useIslaActiva, useValorCongelado, tabsTopBarStore.tabsPorIsla.
- Panel moderación, Tooltip global, SeccionPublicar perfiles, 4 MDs documentación.

---

## Pendientes por Fase

### Fases 0-4 ✔ (completadas)

**TO-DOs de fases completadas:**

- [x] ChatFlotante + multimedia (imágenes, audio, samples)
- [ ] **5.3** WebSocket local (canales chat/notif, typing, online, read receipts)
- [ ] **5.4** Optimización chat (virtualización, lazy load, caché local)

### Fases 6-7 ✔ (completadas)

**TO-DOs de fases completadas:**

- htaccess deny direct access, servir via PHP con validación de permisos
- Pipeline → wp_schedule_single_event() cuando volumen crezca
- WebP conversion, lazy loading, srcset para colors/
- Google OAuth cuando keys estén listas (1.4)
- Click tag → filtrar por categoría BPM (2.5)
- Edición nombre sample antes de publicar (2.6)
- Lookup dual slug/id_corto (2.7)
- Filtros toggle → backend (4.3)
- Metadata IA (instrumentos, sentimiento, artistas) en SampleDetalle (6.2)

### FASE 8 — Tiempo Real (WebSocket producción)

> Prioridad: BAJA — se usa WS local mientras tanto

- [ ] **8.1** Servidor Bun WebSocket para producción (VPS)
- [ ] **8.2** Auth JWT en WebSocket
- [ ] **8.3** Notificaciones push en tiempo real
- [ ] **8.4** Sync reproductor entre tabs

### FASE 9 — Desktop (Tauri 2.0)

> Estado: **MVP completado.** Proyecto desktop compila y genera instaladores (MSI + NSIS). JWT backend implementado.

**Requisitos del usuario (C335):**

- [x] **9.1** Setup Tauri 2.0 — monorepo, reutilizar componentes React existentes (desktop/, Vite 1420, aliases compartidos)
- [x] **9.2** Carpeta local sincronizable — syncService.ts (Tauri dialog + store, índice persistente)
- [x] **9.3** Drag-to-DAW / Drag-to-Desktop — audioLocalService.ts (tauri-plugin-drag v2.1.0 instalado, startDrag nativo, auto-coleccionar+sync en drag)
- [x] **9.4** Modo offline — offlineQueueService.ts (FIFO queue, auto-sync on reconnect, 409=success)
- [x] **9.5** Reproducción local inteligente — audioLocalService.ts (resolverUrlAudio: local→convertFileSrc, remoto→fetch)
- [x] **9.6** Auto-descripción por ruta — syncService.ts (extraerMetadataDeRuta: 3 carpetas padre + nombre archivo)
- [x] **9.7** Nombres de archivo — syncService.ts (nombreOriginal + nombreServidor)
- [x] **9.8** Auth JWT — JwtService.php (HS256 30d), AuthMiddleware (Bearer + nonce dual), AuthController (retorna token en login/registro), authDesktopService.ts (Tauri store), apiDesktopAdapter.ts (fetch interceptor)
- [x] **9.9** Tray icon + auto-update — lib.rs (tray menu: mostrar/ocultar/salir), tauri-plugin-updater configurado
- [ ] **9.10** Optimización extrema — ventanas múltiples futuras, plugins, DAW propio al 100% (pendiente: code splitting, lazy islands)
- [x] **9.11** Testing local — dev server con hot reload sobre app Tauri (Vite 1420 + tauri dev)

**Artefactos generados:**
- `desktop/src-tauri/target/release/kamples-desktop.exe`
- `desktop/src-tauri/target/release/bundle/msi/Kamples_0.1.0_x64_en-US.msi`
- `desktop/src-tauri/target/release/bundle/nsis/Kamples_0.1.0_x64-setup.exe`

**TO-DOs técnicos:**
- CORS: configurar servidor (kamples.local/kamples.app) para aceptar requests desde desktop (Origin: tauri://localhost)
- Login desktop UI: verificar que LoginIsland funciona cross-origin con el JWT flow
- Code splitting: chunk de 649KB necesita `manualChunks` en Vite config

### FASE 10 — Móvil (Capacitor)

- [ ] UI móvil, push notifications, background playback, offline cache

### FASE 11 — Algoritmo v2

> Estado actual: 6 señales con embeddings 128d (pgvector HNSW coseno). Perfil usuario = promedio ponderado de interacciones. Sin A/B testing ni collaborative filtering.

**Subfases planificadas:**

- [ ] **11.1** Contexto DAW — incorporar datos de uso del mezclador en señales de recomendación (qué samples usa juntos → afinidad cruzada). Nuevo sub-factor en señal de comportamiento.
- [ ] **11.2** Embeddings mejorados — espectrograma mel (Essentia/librosa vía Python worker o WASM) reemplazando tags hasheados en posiciones [22-127]. Sube calidad de similitud de contenido de "metadata similares" a "audio realmente similar".
- [ ] **11.3** User embeddings dedicados — vector separado por usuario (no solo promedio de samples interactuados). Actualización incremental con decay temporal. Permite modelar gustos que evolucionan.
- [ ] **11.4** Collaborative filtering — señal adicional "usuarios similares a ti descargaron X". Matrix factorization ligera o item-based CF. Complementa las 6 señales existentes como señal 7.
- [ ] **11.5** A/B testing framework — ExperimentosController ya existe parcialmente. Completar: asignación de cohortes, tracking de métricas (CTR, descarga/impresión, tiempo escucha), dashboard de resultados. Poder probar pesos alternativos del algoritmo.
- [ ] **11.6** Diversidad mejorada — penalización por creador repetido más granular, boost por géneros sub-representados en historial del usuario, serendipity score.
- [ ] **11.7** Feedback signals — "no me interesa" / "ver menos así", señal negativa explícita para afinar perfil.

**Dependencias técnicas:**
- 11.2 requiere pipeline Python/WASM para generar espectrogramas mel → migración embeddings (128d → 256d+)
- 11.4 requiere volumen mínimo de usuarios (~100+) para que CF sea útil
- 11.5 se puede empezar independiente (infraestructura A/B)

### FASE 12 — SEO/Performance/Hardening

> Estado actual: Glory ya tiene MetaTagRenderer + OpenGraphRenderer + JsonLdRenderer + SeoMetabox. RateLimiter implementado (5 endpoints). Sin CSP, sin tests, sin code splitting.

**Subfases planificadas:**

- [ ] **12.1** SEO dinámico para islands — meta tags para samples (`/sample/{slug}`), perfiles (`/perfil/{username}`), colecciones. OG images dinámicas. Canonical URLs correctas.
- [ ] **12.2** JSON-LD estructurado — Product schema para samples, Person para creadores, MusicRecording para audio, BreadcrumbList para navegación. Verificar con Rich Results Test.
- [ ] **12.3** Code splitting — lazy loading de islands pesadas (Mezclador, PianoRoll). Dynamic import con React.lazy + Suspense. Reducir bundle inicial.
- [ ] **12.4** Compresión — configurar Brotli/Gzip a nivel servidor (Nginx/Apache). Precomprimir assets estáticos. Cache headers agresivos para waveform JSON y audio.
- [ ] **12.5** CSP (Content-Security-Policy) — header restrictivo: script-src self + nonces, style-src self, connect-src api + stripe + groq, media-src blob + self, frame-src stripe. Eliminar inline scripts/styles.
- [ ] **12.6** Security hardening — validación de headers CORS más estricta, HSTS, X-Frame-Options, Referrer-Policy. Auditoría de endpoints públicos.
- [ ] **12.7** Tests unitarios — PHPUnit para repositorios y servicios críticos (StripeService, MotorRecomendacion, ModeracionIA). Vitest para hooks React (useMenuContextual*, useTarjetaSample).
- [ ] **12.8** Tests E2E — Playwright para flujos críticos: login → upload → descarga → revenue share. Checkout Stripe en modo test.
- [ ] **12.9** Performance monitoring — Core Web Vitals (LCP, FID, CLS). Lighthouse CI en pipeline. Budget de bundle (<200KB inicial).

### FASE 13 — Panel de Administración ✔ (parcial)

> Implementado R47: AdminController.php (6 endpoints), 3 tabs funcionales (Resumen+Usuarios+Moderación).

# **Pendiente y comentarios del usuario:**

320. Tab Reportes: ReportesController::listar()/resolver(), tabla `reportes`
321. - Tab Monetización: ingresos Stripe por período, top creadores, desglose por plan

**Resueltos (C1-C342+AG-FIX+AG-COL):** Todos los comentarios anteriores resueltos. Incluye: repost completo, TarjetaPublicacion unificada, PublicacionIsland, ColeccionDetalle edición, like embebido, lightbox, explorador/desktop/Sentinel fixes, 4 MDs, etc.

---

## Sprint UI/UX — C343-C354 (26/02/2026)

### COMPLETADAS EN ESTE SPRINT

- ✅ [AG-EXP] C343-C352: Tags no-compress, badges clickable, filtros rediseño, librería keep-alive, botones volver, subcarpetas, explorador file-manager completo, admin chart, moderación, créditos ilimitados.
- ✅ [AG-EXP] C353: Fix Sentinel SQL/key, explorador carpetas 100% width, neutralizar BotonBase, drag cuadricula, botón restaurar ubicación IA.
- ✅ [AG-EXP] C354: Botones eliminar sample (actual + todos) en menú avatar del TopBar, solo admin+devMode. Backend: `DELETE /admin/samples/todos`. Frontend: `useEliminarSamples.ts` + toast confirmación + cierre reproductor.

### TAREAS PENDIENTES

343. Tags feed no-compress: feedTagsLista debe tener scroll horizontal sin comprimir tags. Max 32 tags más comunes. Los tags NO se comprimen cuando la ventana se reduce, sino que se arrastran horizontalmente sin scrollbar visible.
    - Archivos: `FiltroTags.tsx`, `feedSamples.css`
    - Detalle: `feedTagsLista` → `overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none`. Tags individuales → `flex-shrink: 0; white-space: nowrap`.

344. tarjetaMeta clickable + filtro vista actual: Las metas de TarjetaSample (BPM, key, tipo, género) deben ser clickables para filtrar la vista actual (no el feed global). Hover: texto se pone blanco.
    - Archivos: `TarjetaSample.tsx`, `MetasSample.tsx` (nuevo?), `tarjetaSample.css`, hooks de filtrado
    - Detalle: Cada metaItem es clickable → aplica filtro en la vista/isla donde está (si estoy en Favoritos, filtra favoritos; si en Inicio, filtra inicio). Hover: `color: var(--blanco)`. Integrar con useFeedFiltros o crear callback genérico `onFiltrarMeta(tipo, valor)`.

345. Rediseño filtroPrecio + borrar filtrosTitulo: Rediseñar filtroPrecioOpciones con bordes y efectos activos visibles. filtroPrecioSeccion dentro de borde con padding. Eliminar `filtrosTitulo` ("Filtros" h3).
    - Archivos: `ModalFiltros.tsx`, `modalFiltros.css`
    - Detalle: Quitar `<h3 className="filtrosTitulo">`. `filtroPrecioSeccion` → `border: 1px solid var(--bordeSutil); padding: var(--espacioMd); border-radius: var(--radioMd)`. `filtroPrecioBoton` → borde visible + efecto activo claro (no solo background). Diseño minimalista tipo segmented control.

346. Fix librería recarga constante: La página de librería (LibreriaIsland) se recarga cada vez que se entra. Debería usar keep-alive y no refetchar.
    - Archivos: `useLibreriaIsland.ts`, `LibreriaIsland.tsx`
    - Detalle: Investigar si el hook usa useIslaActiva/useValorCongelado correctamente. Verificar que el effect de carga tiene guards de `activa` y no re-triggerea al navegar de vuelta. Patrón de referencia: useSampleDetalle con freeze.

347. Botones volver consistentes: `botonBase varianteGhost tamanoMd coleccionVolver` inconsistente entre páginas (descarga vs explorador). Unificar el estilo del botón volver en todas las páginas.
    - Archivos: `coleccionDetalle.css`, `explorador.css`, `DescargasIsland.tsx`, `ExploradorIsland.tsx`, `ColeccionDetalleIsland.tsx`
    - Detalle: Crear clase compartida (ej: `botonVolver` en componentes/ui o clases globales) que no dependa del contexto CSS de colección. Verificar especificidad de `.botonBase.varianteGhost` no sobreescriba estilos needed.

348. Subcarpetas alinear derecha: Los botones de `exploradorSubcarpetas` deben estar alineados a la derecha, no centrados.
    - Archivos: `explorador.css` (`.exploradorSubcarpetasArea` o `.exploradorSubcarpetas`)
    - Detalle: `justify-content: flex-end` en el contenedor de subcarpetas.

349. **[CRÍTICA] Rediseño completo explorador tipo file manager:** El explorador actual NO emula un explorador real. Debe funcionar como Google Drive / Windows Explorer.
    - Archivos: `ExploradorIsland.tsx`, `useExploradorIsland.ts`, `useExploradorPagina.ts`, `ArbolCarpetas.tsx`, `explorador.css` + nuevos componentes
    - **Concepto core:**
      - Al entrar al explorador: vista "raíz" muestra carpetas + samples sin carpeta (como "Escritorio" con archivos sueltos y carpetas juntos).
      - Click en carpeta → entra a esa carpeta. Dentro: subcarpetas arriba + samples del nivel abajo (exactamente como explorador real).
      - Navegación por click en carpeta en la lista principal, NO desde sidebar.
      - ArbolCarpetas (sidebar) → colapsable, oculto por defecto. Se activa opcionalmente como referencia rápida.
      - Eliminar concepto "carpeta Todas" — no tiene sentido en un explorador real.
      - Breadcrumbs funcionales para navegar hacia atrás.
    - **Componentes a crear/refactorizar:**
      - `TarjetaCarpeta.tsx` — tarjeta visual de carpeta (icono folder + nombre + count items)
      - `VistaExplorador.tsx` — layout principal (carpetas arriba en grid, samples abajo en lista)
      - `BarraHerramientasExplorador.tsx` — breadcrumbs + vista toggle (grid/lista) + buscar + crear carpeta
      - `useNavegacionCarpetas.ts` — hook con stack de navegación, carpetaActual, entrar/salir
    - **Estado:** carpetaActual (null = raíz), historial[], vista (grid/lista)
    - **Datos:** Filtrado client-side con useMemo (ya existe patrón), no API calls por carpeta

350. Rediseño gráfica admin "Actividad últimos 14 días": Reemplazar vista actual por gráfica de barras rediseñada con diseño limpio, tooltips, labels claros.
    - Archivos: `TabResumenAdmin.tsx`, `useAdminPanel.ts`, CSS admin
    - Detalle: Gráfica de barras CSS-only (div con heights proporcionales) o canvas simple. Colores del theme. Tooltips en hover mostrando valor exacto. Eje X con fechas cortas. Eje Y implícito (escala automática). Responsive.

351. Moderación: manejo de posts con audio + imágenes en panel:
    - **Log sin razón:** El log `ModeracionIA: Veredicto` no muestra la razón. Verificar que el servicio pasa el campo `razon` correctamente.
    - **Posts con audio quedan en revisión:** El flujo de moderación no maneja posts que tienen audio adjunto. Si un post tiene audio, debe procesarse (ej: aprobar texto+imagen, audio pasa sin revisión de contenido IA por ahora, pero el post no debe quedarse "en revisión" indefinidamente).
    - **Imágenes no salen en panel moderación:** Los posts aprobados o en moderación no muestran sus imágenes adjuntas en la vista de moderación del admin panel.
    - Archivos: `ServicioModeracionIA.php`, `AnalizadoresModeracion.php`, `LogModeracion.php`, `TabResumenAdmin.tsx` o componente de moderación.

352. Créditos sin mostrar límite: En el menú contextual de usuario, en vez de "Créditos: 5/5", mostrar solo "Créditos: 5". Cuando llegue al límite, "Créditos: 0". No es necesario mostrar el tope.
    - Archivos: `useTopBar.ts` (formato de `etiquetaCreditos`)
    - Detalle: Cambiar formato de `${usados}/${limite}` a solo `${disponibles}`.

353. ✅ [AG-EXP] Fix Sentinel + mejoras explorador:
    - **Sentinel fixes:** `PublicacionesRepository.php` param key `'razon'` → `PublicacionesCols::MODERACION_RAZON`; `TabModeracionAdmin.tsx` `key={i}` → `key={url}`.
    - **explorador.css:** `.exploradorCarpetas` ahora tiene `width: 100%` para que el borde llegue hasta abajo.
    - **TarjetaCarpeta BotonBase override:** Especificidad `.exploradorCarpetasGrilla .tarjetaCarpeta.botonBase` neutraliza height/padding/justify sin `!important`.
    - **Grid view drag fix:** `<img draggable={false}>` en TarjetaSampleCuadricula evita que el browser robe el drag nativo de la imagen. Agregado handle visual semi-transparente (GripVertical) en hover superior derecho.
    - **Botón restaurar ubicación IA:** PipelineAudio ahora escribe `ia_carpeta_primaria`/`ia_carpeta_secundaria` inmutables. Botón RotateCcw en BarraHerramientasExplorador llama `restaurarTodosAOriginal()`. Lógica en `useRestaurarUbicacion.ts` (hook extraído de useExploradorPagina para cumplir límite 300 líneas).

---

## Notas y Decisiones (compactadas)

- **Almacenamiento:** WP uploads local+VPS. **IA:** Groq 100% (Whisper+LLM). **Stripe:** keys live en .env.
- **WebSocket:** Local primero → Bun VPS después. **FFmpeg:** winget v8.0.1, paths en .env.
- **Chat:** Flotante Messenger + /mensajes. Soporta texto/imágenes/audio/samples.
- **Filtros:** Toggle on/off. Ordenamientos: Inteligente/Recientes/Top Semanal/Top Mensual.
- **ModalCrear:** Sin BPM/Key/Tipo manuales (IA autogenera). **Colors/:** dinámico.
- **Naming IA:** `kamples_{tipo}_{genero}_{usuario}_{idCorto}.wav`. IDs cortos, urls ID o slug.
- **Deduplicación:** Hash perceptual diferido. Mismo usuario OK, entre usuarios → supervisión.
- **JSON bilingüe:** tags/emocion/descripcion en EN+ES. No impacta algoritmo.

---

## Lecciones Aprendidas (solo gotchas proyecto — reglas generales en test.instructions.md)

### PHP / PostgreSQL / WordPress

- `apiGet` hace `json.data ?? json` → NUNCA `resp.data.data`. Tipear `RespuestaApi<T[]>`.
- PG TEXT[] requiere `'{val1,val2}'` + `pgArrayAPhp()`. PDO devuelve string `"{}"` — parsear.
- Backend snake_case, frontend camelCase — normalizadores obligatorios. IDs: `String()` en comparaciones.
- `\filter_var`, `\session_id` en namespaces PHP requieren `\`.
- PageManager: `reactPage('padre/hijo')` NO auto-creaba padre WP.
- PDO `ATTR_EMULATE_PREPARES=false`: excepción si params tiene keys sin placeholder (`array_diff_key`). Prohibe reusar placeholder (`:uid` x2 → `:uid2`).
- Columnas PG: verificar nombres exactos (tabla samples usa `creador_id` NO `usuario_id`).
- `(int) $request->get_param('page')` devuelve 0 si ausente → siempre `max(1, ...)`.
- [Colecciones imagen]: tabla `colecciones` tiene DOS columnas imagen: `imagen_url` (canónica, leída por normalizarColeccion) y `portada_url` (legacy/alias). Todo write (uploady PUT) DEBE apuntar a `imagen_url`. El body camelCase del frontend es `imagenUrl`, NO `portadaUrl`.
- PG credenciales: PostgresService EXIGE `KAMPLES_PG_USER` y `KAMPLES_PG_PASSWORD` en .env (sin defaults).
- LogModeracion: solo 2 args (mensaje, contexto). ServicioBan/AntiSpam/Comentarios usan como alias.
- Cache Feed: transients guardan filas crudas. Al cambiar estado → `invalidarCacheGlobal()`.
- Créditos = cupo diario (COUNT hoy vs límite). Bonus: columna `creditos_bonus`.
- Precios sincronizados en: StripeService, PlanesIsland, LandingPublica, roadmap.
- `wp_handle_upload()` solo en wp-admin — require `includes/file.php` en REST API.

### Repository / Schema System

- `contarConFiltros`/`listarConFiltros` aceptan WHERE dinámico + params.
- JOINs en repo de entidad principal. `crearConConflict` para upserts ON CONFLICT.
- BaseRepository::estaConectado() wrappea PG — controllers NO importar PG directamente.
- NormalizadorSample::sqlSelectSamples(?int $userId) para SELECTs con JOIN.
- Cols en `App\Config\Schema\_generated\`. Patrón: `$row[XxxCols::COLUMNA]`. SQL aliases se dejan como strings.
- Sentinel hardcoded-sql-column: detecta param keys (`'columna' =>`) y SET clauses (`'col = :col'`). Fix: `XxxCols::COL => $val` y `XxxCols::COL . ' = :' . XxxCols::COL`. Si param key difiere de column name (ej `'tamano'` vs `tamano_bytes`), renombrar placeholder+key al Cols constant.
- Union types TS derivados de `ISamples['tipo']`. Si se regenera, TS rompe donde no se maneja.
- Interfaces manuales (Sample, Usuario) porque la API normaliza a español.
- Regex `validarQueryContraSchema()`: NUNCA negative lookahead → usar `\b` word boundary.

### React / TypeScript

- React Compiler: no `Date.now()` en render/useMemo, no refs `.current` en render.
- PageRenderer: render-time state update (no useEffect→setState). `setPaginasCache(prev => ...)`.
- `npm run type-check` tras refactors. CampoTexto onChange: cast `as unknown as`.
- useTabsIsla(islaId, tabs, activaInicial) — re-registra tabs en keep-alive.
- copiarAlPortapapeles fallback execCommand para http://. `getState().abrir()` fuera de React.
- CustomEvent + listener para refrescar feeds.
- MAPA_RUTAS en LayoutPrincipal.tsx actualizar al añadir sidebar items.
- crearModalStore.abrir(archivo?, esMezcla?) backward compatible. consumirArchivo() retorna y limpia File.
- Badge variantes: neutro|acento|exito|error|advertencia|info|premium.
- [SRP]: Hooks que exportan JSX (menú items con iconos) requieren extensión `.tsx`. Ejemplo: useComentarioItem.tsx.
- [Sentinel]: Hooks excluidos de `usestate-excesivo` por nombre (`/^use[A-Z]/`). Cleanup patterns reconocidos: `return () =>`, AbortController, `activo = false`, `cancelled = true`, `cancelado = true`.
- [Explorador]: Backend filtraba subcarpetas comparando `primaria/sub` contra `carpeta_primaria` (solo nivel 1). Formato con `/` requiere split+filtro dual. Para listas <500 items, filtrado client-side con useMemo es superior a API calls por carpeta (navegación instantánea vs recarga).
- [Explorador/Sync]: `metadata.carpeta_secundaria` ya viene en la respuesta API normalizada. Sync debe leerla para colocar archivos en subcarpetas. `jsonb_set()` es atómico para mover samples sin sobreescribir otros campos metadata.
- [Explorador/IA restore]: PipelineAudio escribe `ia_carpeta_primaria` e `ia_carpeta_secundaria` como campos inmutables en metadata JSONB. `moverACarpeta` solo toca `carpeta_primaria`/`carpeta_secundaria`, dejando los `ia_*` intactos. Para samples procesados antes de C353, los campos `ia_*` no existen — el botón restaurar queda inactivo para esos samples. Un SQL de backfill opcional: `UPDATE samples SET metadata = jsonb_set(jsonb_set(metadata, '{ia_carpeta_primaria}', metadata->'carpeta_primaria'), '{ia_carpeta_secundaria}', metadata->'carpeta_secundaria') WHERE metadata->>'ia_carpeta_primaria' IS NULL`.
- [Explorador/Drag cuadricula]: Los `<img>` nativos son draggable por defecto. Si un `<img>` está dentro de un `<div draggable>`, el browser inicia drag de la imagen en vez del div padre. Fix: `<img draggable={false}>` en el hijo.

- [apiSocial repost]: URLs correctas: `/publicaciones/${id}/repost` (POST=repostear, DELETE=quitarRepost). Antes estaban como `/repost/${id}` (incorrectas).
- [Lightbox single/double click]: Patrón timer 220ms en `useRef<ReturnType<typeof setTimeout>>`: click inicia timer → si doble-click llega antes limpia timer y ejecuta like. `e.stopPropagation()` en `<img>` del lightbox para evitar cerrar al clickear la imagen.
- [EVENTO_ENTIDAD_ACTUALIZADA]: Exportado como constante desde ModalEditar.tsx (`'kamples:entidad-actualizada'`). Para actualizar un post individual sin recargar el feed: escuchar el evento, llamar `obtenerPublicacion(id)` y `setPublicaciones(prev => prev.map(...))`.
- [Repost optimista con rollback]: Capturar estado antes (`const snapshot = publicaciones`), mutar estado optimistamente, llamar API, si `!resp.ok` → `setPublicaciones(snapshot)`.
- [TarjetaPublicacion unificada]: Si dos vistas deben verse idénticas, DEBEN usar el MISMO componente. Nunca dos CSS separados para el mismo elemento visual. Extras de isla (botón seguir, comentarios) → props `avatarExtra` + `children`. `tarjetaPublicacion.css` es la única fuente de verdad; `comunidad.css` solo contiene layout de isla.
- [EnlaceNavegacion + menú]: NUNCA anidar `<button>` dentro de `<a>` — HTML inválido; `stopPropagation` no es suficiente, el navegador igualmente activa el enlace. Patrón correcto: outer `<div className="tarjeta" style="position:relative">` → `<EnlaceNavegacion>` cubre portada+info con `overflow:hidden; border-radius` → `<div className="menuContenedor">` absolutamente posicionado FUERA del `<a>`. Cerrar menú con `useEffect` + `document.addEventListener('mousedown', ...)` (no `onBlur`).
- [ColeccionDetalle editar]: Propietario detectado con `String(coleccion.usuarioId) === String(usuario.id)`. `itemsMenuColeccion` (useMemo con deps) genera el item "Editar" condicionalmente. `manejarGuardarEdicion` actualiza `coleccion` local tras editar sin refetch. `ModalColeccion` con prop `coleccion` entra en modo edición.
- [GloryContext declaration merging]: `Glory/assets/react/tsconfig.json` incluye `App/React/` en su `include[]` — ambos proyectos compilan juntos vía `npm run type-check`. Para extender `GloryContext` (base en glory.ts del framework), usar declaration merging en `App/React/global.d.ts` añadiendo SOLO campos nuevos opcionales. PROHIBIDO re-declarar `userId` (cambia tipo `number` → `number | null`, rompe glory.ts). PROHIBIDO re-declarar `GLORY_CONTEXT` en Window (clash entre `GloryContext` y `Partial<GloryContext>`). Acceso seguro sin conflicto: `(window as unknown as Record<string, Partial<GloryContext> | undefined>).GLORY_CONTEXT?.devMode`.
- [devMode en GLORY_CONTEXT]: PHP lee `AssetManager::isGlobalDevMode() || (defined('WP_DEBUG') && WP_DEBUG)` en `config.php` → expuesto en `glory_react_context` filter bajo key `devMode`. En React: `const devModeActivo = (window as unknown as Record<string, Partial<GloryContext> | undefined>).GLORY_CONTEXT?.devMode === true`. Comparar con `=== true` (no truthy) — el valor puede ser undefined si PHP no lo inyecta.

### CSS / UI

- `:has(.reproductorGlobal)` bottom dinámico. `pointer-events` NO animable → `::before` bridge.
- No select nativo → dropdown con MenuContextual. Emocion: splitear, filtrar >30 chars.
- Gráficas CSS: barras agrupadas > apiladas. Colores lejanos en espectro.
- SVG icons en flex: `flex-shrink:0`. z-index: header imagen z:0, contenido scrollable z:1.
- Colors DAW mapeados: loop→`--acento`, mute→`--error`, solo→`--advertencia`, steps→`--fondoBoton`.
- CSS vars: Múltiples variaciones rem/px pueden mapearse a vars `--espacioX` y `--fuenteX` calculando proporciones. No dejar `rem` o `px` hardcodeado en paneles de UI complejos.
- [BotonBase conflictos]: Al envolver elementos existentes con BotonBase, `.botonBase.tamanoMd` (especificidad 2) sobreescribe reglas de 1 clase. Fix: usar `.contenedor .claseEspecifica.botonBase` (3 clases) en el CSS hijo. Patrón recurrente: feedTagBoton, tooltipReaccionBtn, menuContextualItem, botonLike → siempre añadir override de alta especificidad en el CSS del componente padre.
- [Input header]: Para variantes de InputBusqueda en contextos sin borde (topbar), usar override contextual `.topbarBusqueda .inputBusqueda { border:none; padding-top:0; padding-bottom:0; }` en lugar de prop extra al componente.

### Mezclador DAW

- Aislado `/Mezclador/` con tsconfig propio. ErrorBoundary requiere import React.
- AudioContext singleton, GainNode/pista. `iniciar()` verificar `state !== 'closed'`.
- `detune + playbackRate → computedRate = rate * 2^(detune/1200)`. NO compensar (se cancela).
- `fuente.start(when, offset, duration)`: duration es buffer-time × playbackRate = wall-clock.
- Stretch: `playbackRate = buffer.duration / (durCompases * durCompas)`. Clamped [0.25,4.0].
- Drift resize: `duracionOriginalCompases` + `playbackRateOriginal` inmutables. Recalcular desde originales.
- Clip mode: playbackRate fijo, ajustar recorteFin. durMax = `(buffer.duration/playbackRate)/durCompas`.
- Undo/redo: SnapshotMezclador sin audioBuffers. Truncar forward. MAX=30.
- Fin real audio: max(compasInicio+duracionCompases) todos los bloques, no totalCompases.
- BPM mid-playback: ratio = newBpm/oldBpm, aplica a playbackRate Y playbackRateOriginal.
- Selección múltiple: Set<string>, Ctrl+click, batch move delta. Shift+drag: duplicar ANTES de drag.
- MinimapaDaw: DOM+rAF (no setState en mousemove). React sync solo en mouseup. pending.scrollFrac.
- SoundTouchJS 0.3.0 pitch-independent. Cache `${bloqueId}:${semitonos}:${playbackRate}`.
- `modoTonalidad` per-block (resample|stretch). motorAudioService bifurca reproducción/offline.
- `obtenerTotalExtendido()` = max(totalCompases, ceil(ultimoFin)+4). Zoom: step=max(0.05, zoom\*0.1).
- VentanaFlotante: drag titlebar, clamping, z-index auto. ventanasStore: Map<id>, enfocar sube z.
- Pan: StereoPannerNode entre GainNode y destination [-1,1].
- Declicking: micro-fades lineares inicio/fin (5/10/20ms).
- masterAnalyser (fftSize=2048) + stereo ChannelSplitter. crearInsertMixer(0) reutiliza si existe.
- FFmpeg waveform: `-f f32le -ac 1 -ar 8000` + unpack('g\*') + picos por chunks. 60 barras.
- Buffers invertidos: cachear como pitchShift. `limpiarProyecto`/`destruir()` → `limpiarCache()`.
- Color fondo controls: `color-mix(in srgb, var(--colorPista) 15%, var(--fondoElevado1))`.

### Channel Rack / Mixer / Piano Roll

- patronesStore CRUD canales anidados. Paso: velocity+pan+pitch. Swing pasos impares.
- 17 inserts. Cadena: inputGain→EQ[3 BiquadFilter]→fader→panner→analyser→master. Peaks threshold >0.01.
- modoReproduccion 'pat'|'song'. PAT loops al final. pista.clipsPatron coexiste con bloques.
- PPQ=96. 1 beat=60px\*zoomX. Canvas grid + DOM notas (híbrido).
- accionesNotas: `Map<"patronId:canalId", NotaPianoRoll[]>`. pianoRollAudioService consume motorAudio.
- GhostNotas: keys con mismo `patronId:` prefix. Culling viewport obligatorio.
- Hooks en `hooks/` usan `../`, componentes en `components/PianoRoll/` usan `../../`.

### Patrones Proyecto

- NormalizadorSample: alias SQL columnas homónimas. extraerTagsMetadata() combina campos IA.
- calcularSugerencias() SQL genérico. FeedSamples dual: precargado + infinite scroll.
- Búsqueda: ILIKE por endpoint. Hashtags: `replace(/#\w+/g, '')`.
- Algoritmo colecciones CTE: user_tags LIMIT 15. verificado_boost: 1.15 post-penalización.
- IA prompt: "OBLIGATORIO, NUNCA null" + fallback PHP !empty().
- Filtros Feed: esPremium client-side (filtrosStore + useMemo).
- Cache SWR: `necesitaRefrescar()` TTL 2min.
- Seguridad audio: .htaccess bloquea WAV+MP3. HMAC streaming. API no expone rutas.
- VPS: Docker pdo_pgsql+FFmpeg+Node. Schema archivos commiteados — NO regenerar en VPS.

### Desktop Tauri 2.0

- [JWT]: AuthMiddleware soporta dual: nonce WP (web) + Bearer JWT (desktop). JwtService usa AUTH_KEY de wp-config como secret HS256.
- [Tauri]: `@tauri-apps/api/dnd` NO existe en Tauri 2 — usar `@crabnebula/tauri-plugin-drag` o alternativa. startDrag({item: [path]}).
- [Build]: `tsc` falla con código compartido (Mezclador sin @types/react en su tsconfig) — build script usa solo `vite build` (esbuild transpila sin type-check).
- [Auth Desktop]: apiDesktopAdapter intercepta fetch global (guarda fetchOriginal), inyecta Bearer JWT, cambia credentials 'same-origin' → 'omit'.
- [Aliases]: desktop/vite.config.ts replica exactamente los aliases de Glory/assets/react/vite.config.ts (@, @app, @mezclador) + @desktop propio.
- [Capacitor]: No hay imports de Capacitor en código fuente (solo en configs). stubs no necesarios.
- [Rust]: cargo check demora ~5min primera vez por compilar 300+ crates. Build release con iconos requiere WiX (MSI) y NSIS (exe).
- [CSP]: tauri.conf.json CSP debe incluir `asset: http://asset.localhost` para servir archivos locales, y `connect-src` con dominios del servidor.
- coolify-manager: env per-project, `Get-SiteEnvVars`, setup-kamples.ps1, deploy-theme.ps1.
- [Proxy Vite]: En dev, `--disable-web-security` de WebView2 rompe Tauri IPC (Store plugin "missing Origin header"). Solucion correcta: Vite proxy para `/wp-json` y `/wp-content` → glory.local. Mismo origen, sin CORS, CSP solo `'self'`.
- [URL Rewriting]: Backend retorna URLs absolutas (`http://glory.local/wp-content/...`). Se reescriben a relativas en el fetch interceptor (tanto en requests como en responses JSON). Asi `<img src>`, `<audio src>` y `new Audio()` cargan via proxy.
- [Login Desktop]: `window.location.href = '/'` recarga el WebView → pierde estado SPA. Usar `navegar('/')` del navigationStore. Siempre `await guardarToken()` antes de navegar.
- [Tauri Store]: Plugin store NO acepta config en plugins.store de tauri.conf.json (`invalid type: map, expected unit`). Dejar `"store": {}` o sin entry.
- [Updater]: Si publicKey esta vacia, el plugin updater crashea al iniciar. Deshabilitar en lib.rs hasta tener pubkey real.
- [Build Web]: Imports dinámicos de `@desktop/...` en código compartido (App/React/) rompen el build web (alias solo existe en desktop/vite.config.ts). Usar `import(/* @vite-ignore */ variable)` con path construido dinámicamente para que Rollup no lo resuelva.
- [Auth Lento]: `inicializarAuthDesktop()` debe leer TANTO token COMO usuario del Tauri Store y setear authStore ANTES de montar React. Sin esto hay flash de "no autenticado" (~300ms-1s roundtrip a /me). También inyectar `isLoggedIn: true` en GLORY_CONTEXT.
- [Likes Desktop]: En endpoints públicos (permission_callback __return_true) como /feed, `requerirAuth()` nunca se llama → JWT no se procesa → `get_current_user_id() = 0` → likes no marcados. Fix: `obtenerWpUserId()` intenta JWT si userId=0.
- [Auth Endpoints Publicos]: `obtenerWpUserId()` debe intentar JWT si `get_current_user_id()==0`. Sin esto, endpoints publicos como `/feed` no procesan JWT → likes no aparecen marcados en desktop.
- [Tray Icon]: Tauri crea auto-tray si `trayIcon` existe en tauri.conf.json. Si tambien se crea `TrayIconBuilder` en lib.rs → 2 iconos en bandeja. Solución: solo uno de los dos. Si necesitas menú contextual, usar solo Rust builder con `app.default_window_icon().cloned()`.
- [Sync UI]: syncStore.ts en `App/React/stores/` (puro Zustand, sin deps Tauri) accesible desde ambos builds. Hook usa `window.__KAMPLES_SYNC__` (inyectado por `desktop/main.tsx` via imports estáticos) en vez de dynamic imports. Dynamic imports con alias computados (`'@desktop' + '/...'`) fallan en Vite dev porque el browser resuelve el string como URL literal sin pasar por el alias resolver de Vite. Patrón correcto: exponer en window desde el entry point desktop, leer desde hooks compartidos. Componente desktop-only gated por `window.__KAMPLES_DESKTOP__` en TopBar.
- [BotonBase]: Variantes disponibles: 'primario' | 'secundario' | 'ghost' | 'peligro'. NO existe 'outline'.
- [Drag Nativo]: `@crabnebula/tauri-plugin-drag` v2.1.0 = Rust crate `tauri-plugin-drag = "2.1.0"`. Capability: `drag:default` + `drag:allow-start-drag`. Plugin: `.plugin(tauri_plugin_drag::init())`. JS: `startDrag({ item: [path], icon: '/ruta/icono.png' })` — `icon` es OBLIGATORIO, sin el la llamada Rust falla por `image` faltante. Usar `resolveResource()` para resolver icono bundled + fallback PNG temp. Browser drag events (onDragStart) NO lanzan drag nativo de archivos — son sistemas separados. La estrategia correcta: en `onDragStart`, si desktop+local → `e.preventDefault()` (cancela drag browser) + `startDrag()` (Tauri toma el mouse). NO usar `onMouseDown` para drag — conflicta con clicks (play/pause). `onDragStart` solo dispara cuando hay movimiento real (gesto de arrastre), no en clicks.
- [Drag Icon Bundle]: `tauri.conf.json` → `bundle.resources: ["icons/32x32.png"]` para que `resolveResource('icons/32x32.png')` funcione en runtime. Las icons del bundle NO son resources automáticamente — solo se usan para generar el icono del app.
- [Sync Individual]: `sincronizarSampleIndividual(sampleId, primaria?, secundaria?)` descarga 1 sample a carpetaLocal sin hacer sync completa. Útil para auto-sync al coleccionar. Verifica si está en índice primero para evitar re-descargas.
- [Window Globals Desktop]: `__KAMPLES_DRAG__.iniciarDragNativo(id, url, nombre)` y `__KAMPLES_SYNC__.sincronizarSampleIndividual(id, primaria, secundaria)` expuestos para hooks compartidos en App/React. Patrón: exponer en main.tsx, leer desde hooks vía funciones helper (no dynamic imports que fallan en Vite dev).
- [tauri-plugin-fs watch]: El feature `watch` NO está incluido por defecto. Sin `features = ["watch"]` en Cargo.toml el command handler Rust no se registra → error "Command watch not found" en runtime aunque el JS y JS package estén instalados. Fix: `tauri-plugin-fs = { version = "2", features = ["watch"] }`. Primera recompilación ~2-3min.
- [Sync bidireccional]: Estado `no_sincronizar` almacenado solo en Tauri Store (ArchivoLocal.syncDeshabilitado), no en BD. El "explorador web" del usuario es el webview dentro de Tauri, no la web real, por lo que badges de SyncBadge + useEstadoSync son correctos. Hash parcial (primeros+últimos 8KB + tamaño) suficiente para dedup de audio sin leer 50MB completos.
- [Watcher MOVE]: OS filesystem watchers (incluyendo Tauri `watch()`) emiten MOVE como 2 eventos separados: DELETE + CREATE. No hay evento atómico de rename/move. Solución: `eliminacionesPendientes` Map con grace period (5s) — si CREATE con mismo filename llega dentro de la ventana, se trata como MOVE y se cancela el DELETE.
- [Self-trigger guard]: Al escribir archivos programáticamente en carpeta observada (sync downloads, renames), el watcher los detecta como eventos de usuario. Patrón: `descargasEnCurso` Set<string> con timeout de limpieza (10s). El callback `onArchivoNuevo` verifica el Set antes de procesar.
- [Carpetas server implícitas]: Backend NO tiene endpoint explícito "crear carpeta". Las carpetas se crean implícitamente al mover un sample a una carpeta nueva via `PUT /me/coleccionados/{id}/carpeta`. Carpetas locales vacías no se pueden sincronizar al server — solo se sincronizan cuando contienen samples.
- [Post-upload carpeta]: Después de upload exitoso, SIEMPRE llamar `PUT /me/coleccionados/{id}/carpeta` para asignar la carpeta basada en la estructura local. El PipelineAudio del server asigna carpeta por IA, pero la del usuario local tiene prioridad.

### Sentinel / Análisis Estático

- `sentinel-disable-file limite-lineas` (en docblock del archivo) suprime el límite de líneas cuando extraer crearía 12+ forwarding stubs — más daño que beneficio. Diferente a `sentinel-disable-next-line`.
- `sentinel-disable-next-line reglaNombre` DEBE estar en la línea INMEDIATAMENTE anterior a la flagged. El analizador solo lee la línea previa — un bloque sentinel más arriba NO funciona. Para `SELECT *` dentro de un `consultarUno("SELECT *..."), el sentinel va DENTRO de los args, en la línea antes del string: `static::consultarUno(/_ sentinel-disable-next-line ... _/ "SELECT \*...`)
- PowerShell WriteAllLines corrompe template literals: backtick es carácter de escape en PS. Si usas WriteAllLines para reemplazar líneas con template literals JS/TS, siempre arreglar con replace_string_in_file después.
- CTEs SQL (alias lowercase sin underscore, ej: `c`, `ranked`, `user_tags`) quedan excluídos del check `repository-sin-whitelist` — no son tablas reales.
- BaseRepository.php queda excluido globalmente de `repository-sin-whitelist` — todos sus SELECT \* son intencionales (métodos genéricos por PK).
- `usestate-excesivo`: el umbral es `3 × numComponentes` en el archivo. Un archivo con 2 componentes puede tener hasta 6 useState sin alarma.
- limit hooks en lineCounter: 300 líneas (no 200). Si un hook se acerca a 300, evaluar split en sub-hooks de dominio (ej: useFeedFiltros, useFeedArrastre extraídos de useFeedSamples).
- [Sentinel Fix R93]: Corrección masiva de 325 violaciones (86+ archivos). Bulk: `<button>`→BotonBase, `<textarea>`→CampoTexto, `<select>`→SelectorBase, `<input>`→CampoTexto. Creado SelectorBase.tsx. Split: ExploradorIsland (574→210+hooks+subcomponents), useTarjetaSample (478→206+useAudioPlayback+utils), useExploradorPagina (371→248+useLikeExplorador+exploradorPaginaUtils), explorador.css (788→455+exploradorDragModal.css). `sentinel-disable-next-line` para inputs nativos: file, checkbox, range, inline-edit. GloryLink en auth pages. `any-type-explicito` via Window global.d.ts. Script generó daños colaterales: import paths rotos (`'/BotonBase'`→`'./BotonBase'` en 16 archivos), 11 flechas corruptas `= />`, type attrs borrados (number/email) — todo reparado. Build limpio (0 errores TS en App/React).
- [Sentinel brace counting bug]: `} catch (e) {` rompe el conteo de llaves cuando `}` del try se decrementa antes de `{` del catch → bloque se considera cerrado inmediatamente. Fix: solo contar `}` despues de `inicioBloque = true`. Afecta `fallo-sin-feedback` y `update-optimista-sin-rollback`.
- [Sentinel tests]: Para tests unitarios de reglas, reimplementar la funcion de deteccion en el archivo de test (patron de phpAnalyzer.test.ts). `npx mocha --grep "nombre suite"` ejecuta tests sin descargar VS Code. `npm test` intenta descargar VS Code completo (runner de integracion).

### Terminologia (Coleccionar vs Guardar en coleccion)

- **"Coleccionar" (boton +):** Equivale a descargar. Consume credito. Registra en tabla `descargas`. En desktop con app: sincroniza archivo a carpeta local. Sin app: descarga directa. Campo backend: `yaColeccionado`. Tambien true si `esMio` (sample propio del usuario).
- **"Guardar en coleccion" (boton Bookmark):** Agrega el sample a una coleccion/playlist del usuario. Tabla: `coleccion_samples` vinculada a `colecciones`. NO consume credito ni descarga archivo. Campo backend: `yaGuardadoEnColeccion`.
- Ambos estados + `yaComentado` + `esMio` se pre-cargan en `NormalizadorSample::sqlSelectSamples()` con subqueries correlacionadas (mismo patron que `liked`/`reaccion`). Eliminado patron N+1 previo (caches module-level + 3 API calls por tarjeta).
- [Repo userId propagation]: Todos los repos que llaman `sqlSelectSamples()` deben aceptar `?int $userId = null` y pasarlo. Repos fijos en esta sesion: SamplesRepository (buscarSimilares, buscarPorScoring, sugerenciasPorContexto), ColeccionSamplesRepository (samplesDeColeccion), ReproduccionesRepository (historialUsuario). MotorRecomendacion::feedPersonalizado usa CTE propia (no llama sqlSelectSamples) — sus subqueries se agregan directamente al SQL. Al agregar un nuevo flag, hay que agregarlo en AMBOS lugares.
- [Cache Transients]: WP-CLI no disponible en PATH del sistema (LocalWP). Para limpiar manualmente: modificar/publicar cualquier sample → triggerea invalidarCacheGlobal(). O esperar 5min (TTL). invalidarCacheGlobal() usa SQL LIKE `_transient_kamples_feed_%` — borrado completo.
- [BotonBase conflictos especificidad]: `.botonBase.varianteGhost` (2 clases) sobreescribe color de estados activos (1 clase). Fix: `.tarjetaAcciones .botonBase.tarjetaAccionBtn.tarjetaAccionLiked` (4 clases) gana por especificidad.
- [DRY render posts]: PerfilIsland tenía inline render de posts sin TarjetaPublicacion → faltaban repostOriginal, samples, badge moderación. Regla: SIEMPRE usar TarjetaPublicacion para renderizar posts. Islands que necesiten extras (lightbox, CardPerfil) pueden wrappearla pero no replicar lógica interna.
- [utils/tiempo.ts]: `formatearTiempoRelativo` centralizado. Antes duplicado en TarjetaPublicacion y ComunidadIsland. Toda fecha de post debe pasar por este util.
- [TarjetaPublicacion lightbox]: El lightbox está integrado DENTRO del componente (position: fixed funciona aunque esté dentro de un article). Imágenes usan BotonBase con click (220ms delay → lightbox) y doble-click (llama onLike). Patrón timer igual al de ComunidadIsland.
- [VarSense variables inexistentes]: --bordeSubtle→--bordeSutil, --fondoSecundario→--fondoElevado2, --textoBase→--textoPrimario, --textoTenue→--textoTerciario, --textoAlto→--blanco (tooltip), --verde→--exito, --rojo→--error, --sombraMd→--sombraElevada, --radioCirculo→--radioFull, --radioXs→--radioSm. Añadidas --espacio2xs:2px y --espacio3xs:3px a variables.css.
- [EnlaceNavegacion + anidado]: `<a>` NO puede ser descendiente de `<a>` (HTML invalido + warning React). Cuando un bloque de autor (nombre + meta + fecha) necesita dos enlaces independientes (perfil y publicacion), el wrapper DEBE ser `<div>`, no `<EnlaceNavegacion>`. El nombre recibe su propio `<EnlaceNavegacion className="tarjetaPubNombreEnlace">` y el meta queda como `<span>` con el enlace de fecha dentro. CSS hover debe apuntar a `.tarjetaPubNombreEnlace:hover .tarjetaPubNombre` (no al div contenedor). Ver TarjetaPublicacion cabecera como patron de referencia.
- [ColeccionesController imagen]: El endpoint `POST /colecciones/{id}/imagen` estaba faltando. Implementado en `ColeccionesCrudController::subirImagen`: `get_file_params()`, MIME whitelist, 5MB limit, `wp_handle_upload()`, actualiza `portada_url` en BD, retorna `{ imagenUrl }` (camelCase porque el TS espera `{ imagenUrl: string }`). `wp_handle_upload()` requiere `require_once ABSPATH . 'wp-admin/includes/file.php'` (ya en roadmap general).
- [MenuContextual artesanal]: TarjetaColeccion tenia dropdown propio con BotonBase como items (causaba centrado por `.botonBase { justify-content:center }`). Fix: usar `<MenuContextual>` directamente. Props: `abierto`, `x/y` (capturados del evento del boton), `items` (useMemo), `onCerrar`, `alinearDerecha`. Patron de referencia para cualquier componente con menu 3-puntos.
- [Sentinel Sprint 5]: 5 nuevas reglas implementadas. Repo: `1ndoryu/glory-sentinel`. `componente-artesanal` detecta outside-click handlers manuales (document.addEventListener mousedown/click en useEffect) y overlays/backdrops artesanales — archivos ui excluidos. `fallo-sin-feedback` busca catch con console.error sin toast/mostrarError. `update-optimista-sin-rollback` detecta set() Zustand antes de await sin set() en catch. `fetch-sin-timeout` detecta fetch() sin signal/AbortController (excluye wrappers HTTP). `non-null-assertion-excesivo` reporta archivos con 5+ `!` en TS/TSX. Pendientes del plan: multi-tabla-sin-transaccion (PHP), race-condition-create-get (IA), srp-violado (IA).

### Keep-alive SPA (islas que no deben re-fetchar)

- [Keep-alive causas raíz]: Cuatro causas provocaban re-fetch al revisitar páginas: (1) MAX_CACHE_PAGES=5 eviccionaba islas al visitar >5 páginas diferentes. (2) `tabActiva` es global en tabsTopBarStore — otra isla cambiando tabs provocaba re-fetch en data-loading effects de islas ocultas. (3) Hooks como useSampleDetalle/usePerfilIsland derivaban params de `rutaActual` — al navegar a otra página, rutaActual cambiaba → slug/username se hacía null → re-fetch innecesario. (4) useTabsIsla siempre reseteaba a tab inicial (activaInicial) perdiendo selección del usuario.
- [useIslaActiva(islaId)]: Hook simple: `useNavigationStore(s => s.islaActual === islaId)`. Retorna boolean.
- [useValorCongelado(valor, congelar)]: Retorna último valor "descongelado" vía useRef. Cuando congelar=true, ignora actualizaciones. Clave para que hooks de islas ocultas no reaccionen a cambios de stores globales (rutaActual, tabActiva, busqueda).
- [Patrón freeze en hooks de islas]: ```const activa = useIslaActiva('MiIsland'); const rutaActual = useValorCongelado(rutaActualRaw, !activa);```. El valor queda congelado en su último estado cuando la isla era activa. Al volver a activarse, se "descongela" y refleja el valor actual.
- [tabsTopBarStore.tabsPorIsla]: Memoria de última tab seleccionada por isla (Record<string, string>). `setTabs(tabs, activaInicial, islaId)` restaura tab guardada si existe. `guardarTabIsla(islaId, tabId)` persiste cambios de tab del usuario. Resultado: al volver a una isla, se restaura la tab que el usuario tenía antes.
- [MAX_CACHE_PAGES]: Aumentado de 5 a 20. Con ~18 islas únicas, 5 era insuficiente. 20 garantiza que ninguna isla se desmonte por evicción en uso normal. Componentes ocultos (display:none) no impactan layout/paint.
- [Hooks parcheados]: useSampleDetalle (slug congelado), usePerfilIsland (rutaActual+tabActiva congelados), usePublicacionDetalle (rutaActual congelado), useColeccionDetalle (rutaActual+tabActiva congelados, ID ahora derivado de rutaActual del store con useMemo en vez de window.location.pathname), useLibreriaIsland (tabActiva+busqueda congelados), FavoritosIsland+DescargasIsland (tabActiva congelada).
- [Hooks que NO necesitaron fix]: useFeedSamples (Inicio — cargarPagina no depende de rutaActual), useComunidadIsland (depende de filtro local), useDescubrirIsland ([] empty deps), useFavoritosPagina ([] empty deps), useDashboardCreador (tabActiva local, no global), useNotificacionesIsland ([] empty deps), useMensajesIsland (TTL con necesitaRefrescar).


