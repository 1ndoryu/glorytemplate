# Kamples — Roadmap Integral de Producto

> **Versión:** 2.0  
> **Última actualización:** 19/02/2026 (iteración v2.9 — compactación)  
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

## Completado (resumen compacto)

**Fase 0:** Schema BD 14 tablas, PostgresService.php, API REST, CSS system, colors/ dinámicos, FFmpeg cross-platform, VS Build Tools 2026.
**Fase 1:** Login/Registro, PerfilIsland, ModalConfiguracion, AuthMiddleware, LandingPublica, auto-creación usuarios_ext.
**Fase 2:** Upload real (FormData+pipeline+IA), WaveformPlayer, ReproductorGlobal/Island, GeneradorIdCorto, AnalizadorAudio (BPM/key), ServicioIA (Groq Whisper+LLM), PipelineAudio (FFmpeg), ServicioImagenIA (Groq visión), tags normalization, deduplicación audio.
**Fase 3 (parcial):** DescubrirIsland, endpoints feed/notificaciones/mensajes/dashboard.
**Fase 4:** BotonFollow/Like, ModalPublicar, InicioIsland (feed+tags±+ordenamientos), ModalFiltros, infinite scroll+virtualización.
**Fase 5 (parcial):** LibreriaIsland, ColeccionesController CRUD+sugerencias, ChatFlotante+multimedia.
**Fase 6:** DashboardCreadorIsland, SPA navigation, SampleDetalleIsland, ColeccionDetalleIsland, ComunidadIsland, ChatFlotante, ModalConfiguracion (portada editable).
**Fase 7 (parcial):** MensajesIsland, ChatIsland, NotificacionesIsland, Stripe Billing, PlanesIsland funcional.
**Arquitectura:** KamplesController 1713→60 lín (12 sub-controladores + 2 helpers + 3 servicios + 1 config). FeedSamples centralizado (~470 lín). ModalSugerenciasLike. KamplesLogger. Pipeline async. 5 migraciones SQL.
**UI/UX (C1-C63):** TopBar, Sidebar, tags ±, waveform real, avatar normalización, colecciones grid, SPA routing, menú contextual, infinite scroll, portada editable, eliminar samples/colecciones.
**IA/Logs:** JSON repair 5 estrategias, imagen metadata Groq (Llama 4), audio IA Groq Whisper+LLM, pipeline async con KamplesLogger.

### Registros de cambios (compacto)

**R1-R20:** wsService, ShowcaseIsland, useArchivosDragDrop, SOLID refactor (12 controladores), FeedSamples centralizado, delete samples/colecciones, JSON repair+Stripe, Groq audio migration, pgvector+embeddings+algoritmo, Gemini Flash, Groq fallback, logs canales, bugfixes C58-C76, TopBar/Sidebar UX, toasts, ModalPublicar, descargas WAV, reproducciones, diversidad, TarjetaMeta.
**R21-R30:** Normalización diseño, cssVarsValidator, light/dark mode, selector tema, SampleDetalle XL, SeccionPublicar inline+panel lateral, créditos+ZIP+tags+búsqueda+SelectFiltro.
**R31-R44:** Reacciones completas, CSS rebuild, créditos fix, descargas propias, keep-alive tabs, paginación comentarios, modal edición, seguridad, centralización componentes, comentarios multimedia, moderación+bans, descargas/favoritos separados, clipboard fallback, badge moderación.
**R45-R47:** Verificación samples (migración v015, BadgeCheck, boost 1.15x), búsqueda colecciones (ILIKE+filtrosStore), editor metadata fix, FilaColecciones horizontal, algoritmo colecciones CTE, Bookmark contextual, Panel Admin FASE 13 (AdminController 6 endpoints, 3 tabs).
**R48-R53:** Mezclador DAW aislado /Mezclador/ (18→50+ archivos), stretch/drag/snap/zoom/undo/redo/corte/ghost/drift/clip/detune/selección múltiple/20 pistas, ModalConfigDaw/resize. Explorador page, avatares fix, AdminPanel CSS, cache SWR, seguridad audio (.htaccess+HMAC), mezcladorStore SOLID (931→150 lín), VPS plan, SoundTouchJS pitch-independent stretch.
**R54-R59:** Schema System completo — 18 schemas+36 generados (Cols+DTO)+schema.ts, CLI, SchemaRegistry enforcement, 29 PHP migrados (~270 accesos), union types TS, Enums generados (8 tablas).
**R60:** Sprint 5 SOLID — 11 splits (A01-A12), 15 archivos nuevos, 11 reducidos <300 lín. GroqHttpClient compartido, JsonRepairer, DetectorBpm/Tonalidad, FFmpegDetector, ProcesadorFFmpeg, DescargasStream/ZipController. O15: 424 llamadas `\` prefix (21 archivos).
**R61-R64:** Repository Pattern completo — 27 controllers migrados, ~340 queries → 18 repos tipados. Tier 3 Services + Api + Helpers: 0 PostgresService fuera de infraestructura. Auditoría hardcode completa (repos + 14 archivos servicios/controladores). Fix regex `validarQueryContraSchema()` (`\b` word boundary). Enums residuales: AdminRepository TODO.
**R65-R66 [AG-ONE]:** C284-C296 Mezclador DAW — fix clip mode, MinimapaDaw (viewport drag/zoom/click-to-jump), ModalConfigBloque reescrito (VentanaFlotante 700px profesional), VentanaFlotante.tsx+ventanasStore.ts, KnobControl SVG, reset doble-click, zoom freeze. Explorador: COALESCE, IA null→"General", z-index, vista cuadrícula. Feed: filtro free/premium client-side.
**R67 [AG-ONE] C274+C288-C311:** createPortal fix, CSS 6 módulos, menú contextual pista (9 acciones+rename+color), InputTempo FL-style, MinimapaDaw rewrite (DOM+rAF), sticky controls, SongPosition (M:S:CS / B:S:T), MonitorOnda canvas, MedidorPicos estéreo, PanelBrowserDaw, on/off header modal, useConfigBloque SRP.
**R68 [AG-DAW] C312-C327:** Color indicador→fondo controls (color-mix 15%), RELLENO*COMPASES 36→4, masterAnalyser+stereoSplit reutilizado, minimap rAF sync, BPM sync playbackRate proporcional, height+max-height+overflow tracks, ventanaVista ref fix parpadeo, CSS vars Channel Rack+Mixer, PAT/SONG iconos, Channel Rack compacto, cuadrícula explorador (useSamplePreview+overlay+context menu), browserDawSampleItem flex fix.
**[AG-TWO] C308:** Channel Rack + Patterns + Mixer completo — patronesStore, mixerStore, motor audio mixer nodes+step playback, 7 componentes Channel Rack (PasoBoton/StepGrid/CanalStrip/SelectorPatron/CabeceraChannelRack/GraphEditor/ChannelRack), 7 componentes Mixer (FaderControl/PeakMeter/InsertStrip/EQVisualizer/SlotEfectoUI/PanelDetalleInsert/MixerConsola+useMixer), ClipPatron en PistaTimeline. 25 archivos, 0 errores.
**[AG-THRE] C310:** Piano Roll completo — pianoRollStore+accionesNotas (~530lín CRUD+undo/redo), 11 componentes (GridNotas canvas+DOM hybrid, NotaRect, TecladoPiano C0-B8, ReglaTemporal, CabeceraPianoRoll, PanelControl velocity/pan/pitch, BarraVelocity, GhostNotas, MenuContextualPR, MinimapaPianoRoll), pianoRollAudioService, atajos teclado, marquee selection. Pendiente: integración con Channel Rack AG-TWO (sync steps↔notas).
**[AG-SQL] Auditoría SQL:** Escaneo completo 168 PHP + 22 migraciones. 58 hallazgos (19 CRITICAL, 25 MEDIUM, 14 LOW). Documento completo: `App/docs/auditoria-sql.md`. Plan de optimización BD: 12 índices nuevos, triggers counter-cache, JSONB expression indexes, fix discrepancia oneshot/one shot, particionamiento futuro.
**[AG-SQL] Corrección SQL completa (58/58):** Todos los hallazgos resueltos. Enums creados (MensajesEnums, ReportesEnums) y extendidos (PublicacionesEnums, ComentariosEnums). AssetMeta centralizado (24 reemplazos en 5 archivos Glory). SeoMetabox usa MetaTagRenderer. StripeConfig con constantes OPT*_. PostSyncHandler::META*CLAVE*_ públicas + usadas en DefaultContentSynchronizer y DefaultContentRepository. $wpdb->prepare() en Form/Newsletter/CachePurger. @unlink/@opcache_reset eliminados. Bug 'one shot'→'oneshot' corregido. Migración v021: 14 indices + 2 JSONB expression indexes.
**[AG-SEC] Auditoría Seguridad PHP:** 86 archivos Kamples auditados (seguridad+calidad). 23 hallazgos (3 P0, 7 P1, 8 P2, 5 P3). P0-1: command injection DeduplicadorAudio (exec sin escapeshellarg). P0-2/P0-3: INTERVAL interpolation sin whitelist en TransaccionesRepo/ReproduccionesRepo/ComentariosRepo. Documento: `App/docs/auditoria-seguridad-php.md`.
**[AG-AUD] Auditoría Profunda 10 archivos:** Deep audit de DeduplicadorAudio, 3 repos (Transacciones/Reproducciones/Comentarios), 3 controllers (Notificaciones/Dashboard/Experimentos), PostgresService, ServicioNotificaciones, StripeService. 39 hallazgos nuevos/extendidos (4 P0, 11 P1, 12 P2, 12 P3). Documento: `App/docs/auditoria-profunda-10archivos.md`.
**[AG-RFE] Auditoría React Frontend:** 23 services + 17 hooks + 20 stores auditados. 42 hallazgos (6 P0, 12 P1, 14 P2, 10 P3). P0: error masking en 9 funciones (ok:true en catch). P1: likes sin rollback (3 hooks), fallos silenciosos sin feedback, stale closures. P2: sin AbortController (2 hooks), rendimiento reproductorStore. Documento: `App/docs/auditoria-react-frontend.md`.

**[AG-TRY] Auditoría Try-Catch:** Escaneo completo 168 PHP en App/Kamples/ + Glory/src/. 91 hallazgos (32 CRITICAL, 45 MEDIUM, 14 LOW) en 33 archivos. 14 hallazgos nuevos vs auditoría parcial previa (77→91). Archivos protegidos documentados (PostgresService, KamplesLogger, VerificarPgvector, StripeWebhookVerifier). Documento: `App/docs/auditoria-try-catch.md`.
**R69 [AG-SEC] Corrección Try-Catch completa (~73/73):** Todos los hallazgos resueltos. PHP: 9 archivos (ProcesadorFFmpeg 4 métodos, DetectorBpm/Tonalidad try-catch-finally+cleanup, DeduplicadorAudio 2 fix, PipelineAudio exec+@unlink, ComentariosInteraccionController 3 métodos, StripeService try-finally+SSL, GroqHttpClient 2 curl, FFmpegDetector shell_exec). TS hooks: 8 archivos (useAdminPanel 5, useFiltroIds 3, useHistorialIds, useDescargas, useDescargasPagina 2, useFavoritosPagina 2, useExploradorPagina, useMenuContextualSample). TS componentes/stores: 7 archivos (BotonLike 3, BotonFollow, ChatFlotante 3, TopBar, LandingPublica, FilaColecciones, sugerenciasLikeStore). Services: motorAudioService, tema.ts. Islands: 12 archivos (SamplesIsland, DescubrirIsland, LibreriaIsland, PerfilIsland, SampleDetalleIsland 4, ComunidadIsland, NotificacionesIsland 3, ColeccionDetalleIsland, DashboardCreadorIsland 3, ChatIsland 3, MensajesIsland). Patrón: snapshot→try{mutate+await}catch{rollback+toast}finally{setCargando(false)}.

---

## Pendientes por Fase

### Fases 0-4 ✔ (completadas)

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

- [ ] Setup monorepo, auth OAuth, sync librería, drag-to-DAW, piano virtual, offline, tray icon

### FASE 10 — Móvil (Capacitor)

- [ ] UI móvil, push notifications, background playback, offline cache

### FASE 11 — Algoritmo v2

- [ ] Contexto DAW, collaborative filtering, user embeddings, A/B testing, spectrograma mel

### FASE 12 — SEO/Performance/Hardening

- [ ] Meta/OG/JSON-LD, code splitting, brotli, rate limiting, CSP, tests

### FASE 13 — Panel de Administración ✔ (parcial)

> Implementado R47: AdminController.php (6 endpoints), 3 tabs funcionales (Resumen+Usuarios+Moderación).

**Pendiente:**

- Tab Reportes: ReportesController::listar()/resolver(), tabla `reportes`
- Tab Monetización: ingresos Stripe por período, top creadores, desglose por plan
- Menú contextual publicaciones (eliminar/reportar/copiar/ver post/editar (los admin puede editar cualquier post y los usuarios sus propos post))

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

## Comentarios del usuario (resueltos — compacto)

**C1-C183:** FFmpeg, IA Groq, pipeline audio, moderación, pgvector, algoritmo, UI completa (TopBar/Sidebar/feeds/colecciones/SPA/chat/planes/admin), JSON repair, Stripe, reproductor, waveforms, reacciones, búsqueda, filtros, créditos, naming IA, deduplicación, verificación samples. SeccionPublicar refactor, modal edición, menú 3 puntos, similares+comentarios expandidos, paginación infinita, multimedia, automod IA, bans, keep-alive tabs, tags metadata IA, búsqueda colecciones, algoritmo colecciones CTE, Bookmark contextual.
**C184-C327:** Mezclador DAW completo (R48-R68), avatares fix, AdminPanel, Explorador page, metadata carpetas IA, cache SWR, seguridad audio, toggle comunidad, publicar mezcla, mezcladorStore SOLID, VPS plan, SoundTouchJS, Schema System+Enums, SOLID Sprint 5, Repository Pattern, auditoría hardcode, VentanaFlotante, MinimapaDaw, KnobControl, Channel Rack+Patterns+Mixer (AG-TWO), Piano Roll (AG-THRE), cuadrícula explorador, BPM sync, CSS vars DAW.

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

### CSS / UI

- `:has(.reproductorGlobal)` bottom dinámico. `pointer-events` NO animable → `::before` bridge.
- No select nativo → dropdown con MenuContextual. Emocion: splitear, filtrar >30 chars.
- Gráficas CSS: barras agrupadas > apiladas. Colores lejanos en espectro.
- SVG icons en flex: `flex-shrink:0`. z-index: header imagen z:0, contenido scrollable z:1.
- Colors DAW mapeados: loop→`--acento`, mute→`--error`, solo→`--advertencia`, steps→`--fondoBoton`.

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
- coolify-manager: env per-project, `Get-SiteEnvVars`, setup-kamples.ps1, deploy-theme.ps1.
