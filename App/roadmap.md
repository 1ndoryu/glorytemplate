# Kamples — Roadmap Integral de Producto

> **Versión:** 3.0  
> **Última actualización:** 24/02/2026 (iteración v3.0 — compactación profunda)  
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
- **Sprint 5 SOLID:** 11 splits (A01-A12), 15 archivos nuevos, 11 <300 lín. GroqHttpClient, JsonRepairer, DetectorBpm/Tonalidad, FFmpegDetector, ProcesadorFFmpeg, DescargasStream/ZipController.
- **React SRP (R74-R82):** ~50 componentes refactorizados a patrón componente+hook dedicado. ~50 hooks nuevos. Todas las islands, modales, y componentes DAW separados en vista+lógica. AbortController cleanup generalizado.
- **Sentinel (R72-R73):** Code Sentinel mejorado (FPs eliminados: exec/json/controller/barras). 42 archivos Zustand migrados a selectores individuales (~90 llamadas). Detecciones: error-enmascarado, sanitizacion-faltante.
- **Hardcode SQL fix (R76):** 16 archivos, ~35 violaciones → Cols constants. key={index} fix (R77): 15 archivos → keys estables.
- **Sentinel Fixes (AG-FIX):** Corregidas 23 violaciones de Sentinel. Creados componentes `Input`, `Checkbox` y `Radio` en `components/ui` para reemplazar inputs nativos. Agregados bloques try-catch a promesas sin catch en `useMenuContextualPublicacion.tsx`.

### Mezclador DAW

- Aislado `/Mezclador/` (50+ archivos). Features: stretch/drag/snap/zoom/undo/redo/corte/ghost/drift/clip/detune/selección múltiple/20 pistas. SoundTouchJS pitch-independent. VentanaFlotante+ventanasStore. MinimapaDaw DOM+rAF. InputTempo FL-style. MonitorOnda canvas. MedidorPicos estéreo. PanelBrowserDaw.
- **Channel Rack + Patterns + Mixer** (AG-TWO): patronesStore, mixerStore, motor audio mixer nodes+step playback. 14 componentes (7 CR + 7 Mixer). ClipPatron en PistaTimeline.
- **Piano Roll** (AG-THRE): pianoRollStore+accionesNotas (~530 lín), 11 componentes (GridNotas canvas+DOM hybrid, TecladoPiano C0-B8, etc.), pianoRollAudioService. Pendiente: integración Channel Rack (sync steps↔notas).
- **SRP DAW (R81-R82):** 15 componentes DAW refactorizados a hook dedicado.

### Auditorías y correcciones

- **SQL (AG-SQL):** 58/58 hallazgos resueltos. Enums creados (Mensajes, Reportes, Publicaciones, Comentarios). Migración v021: 14 índices + 2 JSONB expression indexes.
- **Seguridad PHP (AG-SEC):** 86 archivos auditados, 23 hallazgos. Command injection, INTERVAL whitelist. Doc: `auditoria-seguridad-php.md`.
- **Profunda (AG-AUD):** 10 archivos deep audit, 39 hallazgos. Doc: `auditoria-profunda-10archivos.md`.
- **React Frontend (AG-RFE):** 60 archivos auditados, 42 hallazgos. Error masking, rollback, AbortController. Doc: `auditoria-react-frontend.md`.
- **Try-Catch (AG-TRY + R69):** 91 hallazgos detectados, ~73 corregidos. PHP 9 archivos, TS hooks 8, componentes/stores 7, islands 12. Patrón: snapshot→try{mutate+await}catch{rollback+toast}finally.
- **Sprint 5 (R71):** P0 4/4, P1 26/26, P2 16/18, P3 3/4 resueltos. N+1 cache, Zustand selectores, RETURNING fallback, 6→3 queries dashboard.

### Explorador y Desktop features (R84-R92)

- Panel moderación fix, Tooltip global, SeccionPublicar perfiles, 4 MDs documentación (algoritmo, moderación, monetización, análisis DAW).
- Explorador: filtrado client-side (useMemo, 0 API calls), subcarpetas, breadcrumbs, drag-drop HTML5, crear carpetas inline, modal "Mover a carpeta", `PUT /me/coleccionados/{id}/carpeta` (jsonb_set atómico).
- Desktop: proxy Vite, URL rewriting, auth instantáneo, tray icon fix, panel sync (syncStore+usePanelSincronizacion), sync real bidireccional (`sincronizarConServidor`), drag-to-DAW nativo, auto-sync al coleccionar, `sincronizarSampleIndividual`.
- Sync bidireccional completo: fileWatcherService (watch+debounce), uploadQueueService (FIFO+retries+hash dedup), move detection (grace period 5s), self-trigger guard, carpetas server → disco.

---

## Pendientes por Fase

### Fases 0-4 ✔ (completadas)

- ✅ [AG-FIX] Fix repost (3 bugs): post vacío + DELETE no funcionaba + sin toast. `listarFeed` ahora LEFT JOIN con original; `eliminarRepost`+`recalcularReposts` en repo; DELETE route registrado; `ComunidadIsland` muestra bloque embebido del original con indicador "X reposteó"; toast de éxito/error en `manejarRepost`.
- [Repost]: crearRepost inserta fila vacía con repost_id. El feed LEFT JOINea `publicaciones AS orig` + `usuarios_ext AS u_orig` para traer contenido original. Frontend usa `post.repostOriginal` para renderizar el bloque embebido. Si repostOriginal es null, se comporta como post normal.
- [DELETE route WP]: Para soportar múltiples métodos en el mismo path, pasar array de arrays a `register_rest_route`: `[['methods'=>'POST',...], ['methods'=>'DELETE',...]]`.

### TAREAS EN CURSO
- ✅ [AG-FIX] Corregir violaciones de Sentinel reportadas en `.sentinel-report.md` (promise-sin-catch, html-nativo-en-vez-de-componente).
- ✅ [AG-FIX] Centralizar render de posts en PerfilIsland: `TarjetaPublicacion` reemplaza inline render; `utils/tiempo.ts` centraliza `formatearTiempoRelativo` (eliminado duplicado de ComunidadIsland y TarjetaPublicacion); `usePerfilIsland` añade `manejarRepost`; CSS `.tarjetaPubRepostIndicador/.tarjetaPubRepostOriginal` añadido. Posts de /perfil/ ahora idénticos a /comunidad/ (fechas relativas, repost embebido, badge moderación, samples adjuntos).
- ✅ [AG-FIX] ComunidadIsland migrada a TarjetaPublicacion (unificación visual). comunidad.css reducido de ~530 a 86 líneas.
- ✅ [AG-FIX] Samples en reposts: fix frontend (TarjetaPublicacion), backend (SQL orig_samples_adjuntos + controlador), tipo TS (RepostOriginal.samplesAdjuntos).
- ✅ [AG-FIX] Endpoint `obtener` enriquecido: nuevo método `obtenerConAutorCompleto` en repo con LEFT JOINs; mismo nivel de datos que `listarFeed` (totalReposts, creadoAt, liked, reaccion, moderacionEstado, samplesAdjuntos, repostOriginal con samples).
- ✅ [AG-FIX] Página detalle publicación `/publicacion/{id}/`: PublicacionIsland + usePublicacionDetalle + CSS + ruta PHP + registro isla + MAPA_RUTAS + fecha clickeable en TarjetaPublicacion. Fix crítico: SPA callable props no se serializan → el hook extrae ID de `rutaActual` (URL), misma patrón que useSampleDetalle.
- ✅ [AG-COL] TarjetaColeccion: refactor a MenuContextual (elimina dropdown artesanal), limpieza CSS. ColeccionDetalleIsland + useColeccionDetalle: editar colección desde 3-puntos. ModalColeccion: modo edición sin header, widget imagen con preview. LibreriaIsland: editar colecciones propias desde tab Explorar. Endpoint POST /colecciones/{id}/imagen implementado en ColeccionesCrudController.
- ✅ [AG-COL] Fix nested `<a>` en TarjetaPublicacion: wrapper autor cambiado de EnlaceNavegacion a div, nombre con su propio enlace independiente (tarjetaPubNombreEnlace).

**Aprendizaje clave [SPA + callable props]:** `PageDefinition::getReactPageRoutes()` omite los props de rutas con callbacks PHP porque no son serializables a JSON. El cliente SPA resuelve la ruta por prefijo y pasa `props: {}` vacío. **Solución:** el hook siempre debe extraer su parámetro dinámico de `rutaActual` (useNavigationStore), usando la prop PHP solo como fallback. Ver `useSampleDetalle` como referencia del patrón.

### FASE 5 — Chat Flotante (parcial)

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

**Resueltos (C322-C342):** Menú contextual publicaciones (useMenuContextualPublicacion reutilizable), Tooltip global, explorador subcarpetas+file manager+drag-to-DAW nativo+sync bidireccional, panel moderación completo, 4 MDs documentación, SeccionPublicar perfiles, fases 9/11/12 planificadas, desktop Tauri 2.0 MVP+runtime fixes+auth+sync+drag+tray+auto-sync.

**Resueltos (sesión AG-FIX post-342):** Like embebido sample en comunidad, crearAcciones visible, botones adjuntar en barra editarAcciones, quitar modalCabecera en editar publicacion, click imagen para reemplazar en ModalEditar, updated_at SQL fix, repost con API real (URL corregida + optimismo + rollback), actualización post en tiempo real tras edición (EVENTO_ENTIDAD_ACTUALIZADA listener), lightbox imagen (click=abrir, doble-click=like).
---

## Notas y Decisiones

1. **Almacenamiento:** WordPress uploads para local y VPS. Sin Nginx por ahora, servir con PHP.
2. **IA:** Cadena 100% Groq. Audio Whisper (`whisper-large-v3` → turbo), metadata JSON con LLM Groq, imágenes Groq.
3. **Stripe:** Keys live en .env (PRECAUCIÓN — usar test keys para desarrollo).
4. **Google OAuth:** Keys vacías, integración lista para activar.
5. **WebSocket:** Servidor local primero, migrar a Bun en VPS después.
6. **FFmpeg:** Instalado via winget (v8.0.1). PHP/Apache usa `FFMPEG_PATH`/`FFPROBE_PATH` en `.env`.
7. **VS Build Tools 2026:** v18, cl.exe 19.50.35724 x64 + CMake 4.1.2. Necesario para pgvector.
8. **Chat:** Flotante tipo Messenger + /mensajes vista completa. Soporta: texto, imágenes, audio, samples.
9. **Filtros:** Toggle on/off. Ordenamientos: Inteligente, Recientes, Top Semanal, Top Mensual (dropdown plano).
10. **BPM:** Crudo en BD + normalizado (muy lento/lento/normal/rápido/muy rápido).
11. **ModalCrear:** Sin BPM/Key/Tipo manuales — IA autogenera. Waveform + reproducción + iconos condiciones.
12. **Colors/:** Lectura dinámica del directorio, no hardcodeado.
13. **Naming IA:** `kamples_{tipo}_{genero}_{usuario}_{idCorto}.wav`. IDs cortos alfanuméricos, urls soportan ID o slug.
14. **Explorar eliminado:** Búsqueda/descubrimiento desde InicioIsland. Página `/explorar` removida.
15. **Deduplicación:** Hash perceptual (primeros+últimos 4s) diferido. Mismo usuario permitido, entre usuarios → supervisión. Tabla `reportes_duplicados`.
16. **JSON bilingüe:** tags/tags_es, emocion/emocion_es, descripcion/descripcion_es. NO impacta algoritmo ni embeddings (solo usan EN). Costo: ~200 tokens/req + ~40% más JSONB. Decisión: mantener.

---

## Comentarios del usuario (resueltos — C1-C342)

Todos los comentarios C1-C342 han sido resueltos. Áreas cubiertas: FFmpeg, IA Groq, pipeline audio, moderación, pgvector, algoritmo, UI completa (TopBar/Sidebar/feeds/colecciones/SPA/chat/planes/admin), JSON repair, Stripe, reproductor, waveforms, reacciones, búsqueda, filtros, créditos, naming IA, deduplicación, verificación samples, Mezclador DAW completo (Channel Rack+Patterns+Mixer+Piano Roll), Schema System+Enums, Repository Pattern, 5 auditorías (SQL/seguridad/profunda/react/try-catch), React SRP (50+ componentes), Sentinel, desktop Tauri 2.0 (auth+sync+drag+explorador file-manager), documentación (4 MDs). Pendientes activos: C320 (Tab Reportes), C321 (Tab Monetización).

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

- [apiSocial repost]: URLs correctas: `/publicaciones/${id}/repost` (POST=repostear, DELETE=quitarRepost). Antes estaban como `/repost/${id}` (incorrectas).
- [Lightbox single/double click]: Patrón timer 220ms en `useRef<ReturnType<typeof setTimeout>>`: click inicia timer → si doble-click llega antes limpia timer y ejecuta like. `e.stopPropagation()` en `<img>` del lightbox para evitar cerrar al clickear la imagen.
- [EVENTO_ENTIDAD_ACTUALIZADA]: Exportado como constante desde ModalEditar.tsx (`'kamples:entidad-actualizada'`). Para actualizar un post individual sin recargar el feed: escuchar el evento, llamar `obtenerPublicacion(id)` y `setPublicaciones(prev => prev.map(...))`.
- [Repost optimista con rollback]: Capturar estado antes (`const snapshot = publicaciones`), mutar estado optimistamente, llamar API, si `!resp.ok` → `setPublicaciones(snapshot)`.
- [TarjetaPublicacion unificada]: Si dos vistas deben verse idénticas, DEBEN usar el MISMO componente. Nunca dos CSS separados para el mismo elemento visual. Extras de isla (botón seguir, comentarios) → props `avatarExtra` + `children`. `tarjetaPublicacion.css` es la única fuente de verdad; `comunidad.css` solo contiene layout de isla.
- [EnlaceNavegacion + menú]: NUNCA anidar `<button>` dentro de `<a>` — HTML inválido; `stopPropagation` no es suficiente, el navegador igualmente activa el enlace. Patrón correcto: outer `<div className="tarjeta" style="position:relative">` → `<EnlaceNavegacion>` cubre portada+info con `overflow:hidden; border-radius` → `<div className="menuContenedor">` absolutamente posicionado FUERA del `<a>`. Cerrar menú con `useEffect` + `document.addEventListener('mousedown', ...)` (no `onBlur`).
- [ColeccionDetalle editar]: Propietario detectado con `String(coleccion.usuarioId) === String(usuario.id)`. `itemsMenuColeccion` (useMemo con deps) genera el item "Editar" condicionalmente. `manejarGuardarEdicion` actualiza `coleccion` local tras editar sin refetch. `ModalColeccion` con prop `coleccion` entra en modo edición.

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


