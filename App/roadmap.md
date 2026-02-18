# Kamples — Roadmap Integral de Producto

> **Versión:** 2.0  
> **Última actualización:** 17/02/2026 (iteración v2.7)  
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
- **Almacenamiento WordPress** — Usar WP uploads + attachment API para audio. Pipeline: original(.wav) → optimizado(.mp3) → waveform(.json) → preview(.mp3). Seguridad via htaccess/permisos. Preparado para migrar a VPS luego.
- **WebSocket local** — Servidor WebSocket Node/Bun local para desarrollo. Canales: mensajes, notificaciones, sync, feed. Preparar para activar en VPS después.
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

| Ruta                 | Isla                     | Descripción                                         |
| -------------------- | ------------------------ | --------------------------------------------------- |
| `/`                  | `InicioIsland`           | Feed con filtros toggle + ordenamientos             |
| `/` (deslogueado)    | `LandingPublica`         | Landing page con nav flotante (sin sidebar/topbar)  |
| `/sample/{slug}`     | `SampleDetalleIsland`    | Tarjeta grande + waveform + metadata + similares    |
| `/coleccion/{slug}`  | `ColeccionDetalleIsland` | Info colección + grid de samples (NUEVA)            |
| `/comunidad`         | `ComunidadIsland`        | Feed posts sociales con diseño diferenciado (NUEVA) |
| `/descubrir`         | `DescubrirIsland`        | Algoritmo personalizado                             |
| `/perfil/{username}` | `PerfilIsland`           | Perfil público                                      |
| `/libreria`          | `LibreriaIsland`         | Explorar colecciones, mis colecciones, subidos        |
| `/descargas`          | `DescargasIsland`        | Mis descargas + sugerencias "Más Ideas" (C140)        |
| `/favoritos`          | `FavoritosIsland`        | Mis favoritos + sugerencias "Más Ideas" (C140)        |
| `/mensajes`          | `MensajesIsland`         | Vista completa de conversaciones                    |
| `/planes`            | `PlanesIsland`           | Checkout Stripe                                     |
| `/reproductor`       | `ReproductorIsland`      | Player completo                                     |
| `/auth/login`        | `LoginIsland`            | Login                                               |
| `/auth/registro`     | `RegistroIsland`         | Registro                                            |
| `/admin/dashboard`   | `DashboardCreadorIsland` | Stats creador                                       |\n| `/admin/panel`       | `AdminPanelIsland`       | Panel admin (KPIs, usuarios, moderación)            |

**Eliminadas:** `/perfil/editar` (ahora ModalConfiguracion), tabs de InicioIsland (reemplazadas por ordenamientos).  
**Chat flotante:** tipo Messenger en esquina inferior derecha, se abre desde modales de TopBar o /mensajes.

---

## Planes de Suscripción

|               | Free      | Pro ($5)    | Premium ($19.99) |
| ------------- | --------- | ----------- | ---------------- |
| Descargas/día | 5         | 50          | Ilimitadas       |
| Calidad       | WAV       | WAV         | WAV              |
| Subida/mes    | Ilimitada | Ilimitada   | Ilimitada        |
| Monetización  | 50/50     | 70/30       | 80/20            |

---

## Completado (resumen compacto)

**Fase 0:** Schema BD 14 tablas, PostgresService.php, API REST, CSS system, colors/ dinámicos, FFmpeg cross-platform (ruta .env para PHP/Apache), VS Build Tools 2026 instalado.
**Fase 1:** Login/Registro, PerfilIsland, ModalConfiguracion (PUT /me), AuthMiddleware, LandingPublica, auto-creación usuarios_ext.
**Fase 2:** Upload real (FormData+pipeline+IA), WaveformPlayer, ReproductorGlobal/Island, GeneradorIdCorto, AnalizadorAudio (BPM/key), ServicioIA (Groq Whisper+LLM), PipelineAudio (FFmpeg), ServicioImagenIA (Groq visión), tags normalization, deduplicación audio.
**Fase 3 (parcial):** DescubrirIsland, endpoints feed/notificaciones/mensajes/dashboard.
**Fase 4:** BotonFollow/Like, ModalPublicar, InicioIsland (feed+tags±+ordenamientos), ModalFiltros, infinite scroll+virtualización.
**Fase 5:** LibreriaIsland, ColeccionesController CRUD+sugerencias+relevantes, ModalSeleccionColeccion (ranking relevancia).
**Fase 6:** DashboardCreadorIsland, SPA navigation (prefix matching), SampleDetalleIsland (hero+waveform+like API), ColeccionDetalleIsland (tabs Samples/Más Ideas), ComunidadIsland, ChatFlotante, ModalConfiguracion (portada editable).
**Fase 7 (parcial):** MensajesIsland, ChatIsland, NotificacionesIsland, Stripe Billing (PagosController checkout/portal/webhook), PlanesIsland funcional.

**Arquitectura:** KamplesController 1713→60 lín (12 sub-controladores + 2 helpers + 3 servicios + 1 config). FeedSamples centralizado (~470 lín). ModalSugerenciasLike post-like. KamplesLogger. Pipeline async (shutdown hook). 5 migraciones SQL ejecutadas.
**UI/UX (C1-C63):** TopBar (búsqueda, crear, notif, mensajes, plan badge), Sidebar, tags ± agrupados, waveform real, middle-click, avatar normalización, colecciones grid, SPA routing, menú contextual, infinite scroll+virtualización, portada editable, eliminar samples/colecciones.
**IA/Logs:** JSON repair 5 estrategias (control chars + Groq), imagen metadata Groq (Llama 4), audio IA Groq Whisper+LLM, pipeline async con KamplesLogger.

### Registros de cambios (compacto)

**R1-R10:** wsService, ShowcaseIsland, useArchivosDragDrop, BienvenidaIsland, SOLID refactor (12 controladores), FeedSamples centralizado, delete samples/colecciones, JSON repair+Stripe, Groq audio migration, pgvector+embeddings+algoritmo.
**R11-R20:** Gemini Flash, Groq fallback, logs canales, JSON repair kimi/qwen, roadmap compactado, bugfixes C58-C65, contadores ocultos, Sidebar config, TopBar UX, batch C66-C76 (toasts, waveform, ModalPublicar, ComunidadIsland API, descargas WAV, reproducciones, diversidad, docs, TarjetaMeta).
**R21-R30:** Normalización diseño, cssVarsValidator, light/dark mode, selector tema, SampleDetalle XL+fino, SeccionPublicar inline+panel lateral+sqlSelectSamples, créditos+ZIP+tags+búsqueda+SelectFiltro, compactación roadmap.
**R31-R40:** C125+C135+C124, C137-C145 (reacciones completas, CSS rebuild, créditos fix, descargas propias), C149+C148+C127+C128, C150-C158, C160-C165, C133 keep-alive+C129 paginación comentarios, C126 modal edición+C164 seguridad, C85 centralización componentes, C130 comentarios multimedia.
**R41-R44:** C131/C132 moderación+bans, C140 descargas/favoritos separados, C171+C175+cleanup, C176+C173+C174 (clipboard fallback, badge moderación, tabs fix).
**R45:** C172 compactar roadmap + C177 remover créditos descargas + C178 sistema verificación samples (migración v015, controller PUT admin, normalizer, BadgeCheck tarjeta+detalle, menú contextual verificar, evento actualización, boost algoritmo 1.15x).
**R46:** C169+C170+C180+C181+C182+C183: búsqueda colecciones (ILIKE backend+filtrosStore frontend+placeholder dinámico), editor metadata fix (descripción real+chips IA), FilaColecciones horizontal (max 8, scroll invisible), algoritmo colecciones CTE (tags 0.60+frescura 0.20+volumen 0.20+follow 1.3x), Bookmark guardar contextual, fix reproducciones completada.
**R47:** C179 Panel de Administración (FASE 13): AdminController.php (6 endpoints admin-only), apiAdmin.ts (tipos completos), useAdminPanel.ts (hook lógica), AdminPanelIsland (tabs Resumen+Usuarios+Moderación), TabResumenAdmin (KPIs+gráfica actividad), TabUsuariosAdmin (tabla+búsqueda+filtro+acciones), TabModeracionAdmin (aprobar/rechazar+reportes), adminPanel.css, Sidebar admin condicional, pages.php+MAPA_RUTAS.
**R48:** C184 Mezclador DAW aislado en /Mezclador/ (18 archivos): types+stores(Zustand)+services(motorAudio singleton)+hooks+components. Integración panelLateral+TopBar+TarjetaSample draggable. Config vite.config.ts+tsconfig.json propio.
**R49-R51:** Avatares fix (UsuarioHelper centralizado), AdminPanel CSS+vacío, créditos/suscripción/precios/audio-comentarios, Mezclador DAW completo (stretch/drag/snap/zoom/undo/redo/corte/ghost/drift/clip/detune/selección múltiple/20 pistas/Shift+drag/ModalConfigDaw/resize).
**R52:** Explorador page (/explorador) con árbol carpetas+coleccionados backend, sidebar librería, metadata carpetas IA, nombre archivo reestructurado.
**R53:** Cache SWR mensajes (TTL 2min), seguridad audio (.htaccess+HMAC), toggle comunidad, publicar mezcla, mezcladorStore SOLID (931→150 lín, 5 módulos), plan VPS coolify-manager, pitch-independent stretch SoundTouchJS.
**R54-R58:** Schema System completo — 18 declaraciones+36 generados (Cols+DTO)+schema.ts, CLI, SchemaRegistry enforcement, 29 archivos PHP migrados a Cols constants (~270 accesos), union types TS derivados, runtime fixes, parser nivel-0, documentación completa.
**R59:** Schema System Enums — `generarEnums()` en CLI: genera `{Tabla}Enums.php` y constantes TS desde arrays `check` de cada schema. 8 tablas con enums (Samples, Likes, UsuariosExt, Suscripciones, Transacciones, Publicaciones, Comentarios, ReportesDuplicados). `LikesEnums::TIPO_SAMPLE`, `SamplesEnums::ESTADO_ACTIVO`, etc. Elimina strings literales de valores enum en controladores y servicios.

---

## Pendientes por Fase

### Fases 0-4 ✔ (completadas)

**Fase 0:** PDO singleton+pgvector+uploads+FFmpeg cross-platform+colors dinámicos.
**Fase 1:** Login/Registro+PerfilIsland+ModalConfiguracion+AuthMiddleware+LandingPublica+auto-sync.
**Fase 2:** Upload real+análisis audio (BPM/key)+IA (Groq Whisper+LLM)+naming+dedup+tags.
**Fase 3:** Algoritmo 6 señales (pgvector coseno+comportamiento+tendencias+novedad+grafo social)+cache transients.
**Fase 4:** ModalFiltros+InicioIsland (ordenamientos+infinite scroll+virtualización)+filtrosStore.

### FASE 5 — Chat Flotante (parcial)

- [x] ChatFlotante + multimedia (imágenes, audio, samples)
- [ ] **5.3** WebSocket local (canales chat/notif, typing, online, read receipts)
- [ ] **5.4** Optimización chat (virtualización, lazy load, caché local)

### Fase 6-7 ✔ (completadas)

**Fase 6:** SPA fluida+SampleDetalleIsland+ColeccionDetalleIsland+ComunidadIsland+LandingPublica.
**Fase 7:** Stripe Billing+Connect+premium+límites por plan.

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
- Tab Reportes: ReportesController::listar()/resolver(), tabla `reportes` (tipo, target_id, reportador_id, razon, estado)
- Tab Monetización: ingresos Stripe por período, top creadores, desglose por plan
- Menú contextual publicaciones (eliminar/reportar/copiar/ver post)

---

## Notas y Decisiones

1. **Almacenamiento:** WordPress uploads para local y VPS. Sin Nginx por ahora, servir con PHP.
2. **IA:** Cadena principal 100% Groq. Audio con Whisper (`whisper-large-v3` → `whisper-large-v3-turbo`) y metadata JSON con LLM Groq. Groq también para imágenes.
3. **Stripe:** Keys live en .env (PRECAUCIÓN — usar test keys para desarrollo, mover live a producción).
4. **Google OAuth:** Keys vacías, preparar integración lista para activar.
5. **WebSocket:** Implementar servidor local primero, migrar a Bun en VPS después.
6. **FFmpeg:** Instalado via winget (v8.0.1). PHP/Apache no hereda PATH del usuario → usar `FFMPEG_PATH`/`FFPROBE_PATH` en `.env`.
7. **VS Build Tools 2026:** Instalado (v18). cl.exe 19.50.35724 x64 + CMake 4.1.2. Ruta: `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools`. Necesario para compilar pgvector.
8. **Chat:** Flotante tipo Messenger + /mensajes como vista completa. Soporta: texto, imágenes, audio, samples compartidos.
9. **Filtros:** Toggle on/off simples, no selects complejos. Ordenamientos: Inteligente, Recientes, Top Semanal, Top Mensual (dropdown plano, sin sub-menús).
10. **BPM:** Mantener número crudo en BD + campo normalizado (muy lento/lento/normal/rápido/muy rápido).
11. **ModalCrear:** SIN campos manuales de BPM/Key/Tipo — la IA los genera automáticamente. Mostrar waveform + reproducción. Iconos de condiciones (descarga sí/no, etc.).
12. **Colors/:** Lectura dinámica del directorio, no hardcodeado. Optimización de imágenes.
13. **Naming IA:** Al subir audio, la IA genera nombre estandarizado: `kamples_{tipo}_{genero}_{usuario}_{idCorto}.wav`. IDs únicos cortos alfanuméricos para cada sample, URLs soportan lookup por ID o slug.
14. **Explorar eliminado:** La búsqueda y descubrimiento se hace desde InicioIsland (feed principal). Página `/explorar` removida.
15. **Deduplicación audio:** Hash perceptual ligero (primeros+últimos 4s) diferido en background. Duplicados del mismo usuario permitidos, entre usuarios distintos → supervisión. Sistema de reportes con disputa y pruebas. Tabla `reportes_duplicados` planificada.
16. **Análisis C117 — JSON bilingüe vs Algoritmo:** El JSON bilingüe (tags/tags_es, emocion/emocion_es, descripcion/descripcion_es) **NO impacta** el rendimiento del algoritmo ni los embeddings. Los embeddings 128d solo usan: BPM, key, escala, tipo, duración, premium, y `tags` (inglés). Las 6 señales del MotorRecomendacion operan sobre datos estructurales + tags EN. Los campos `_es` son puramente de display para UI hispanohablante. Costo extra: ~200 tokens/request en Groq (~$0.01/1000 samples) + ~40% más storage en metadata JSONB. **Decisión: mantener bilingüe** — el ahorro de eliminarlos es marginal vs. la complejidad de implementar traducción lazy después.

## Comentarios del usuario (resueltos — compacto)

**C1-C120:** FFmpeg, IA Groq, pipeline audio, moderación, pgvector, algoritmo, UI completa (TopBar/Sidebar/feeds/colecciones/SPA/chat/planes/admin), JSON repair, Stripe, reproductor, waveforms, reacciones, búsqueda, filtros, créditos, naming IA, deduplicación, verificación samples.
**C121-C183:** SeccionPublicar refactor, modal edición unificado, menú 3 puntos, similares+comentarios expandidos, paginación infinita, multimedia, automod IA, bans+moderación, keep-alive tabs, tags metadata IA, Panel Admin FASE 13, búsqueda colecciones, algoritmo colecciones CTE, Bookmark contextual.
**C184-C283:** Mezclador DAW completo (R48-R53), avatares fix, AdminPanel CSS, Explorador page+carpetas+coleccionados, metadata carpetas IA, nombre archivo reestructurado, guards max(1,page), logs moderación, cache SWR, seguridad audio, toggle comunidad, publicar mezcla, mezcladorStore SOLID, VPS plan, pitch-independent stretch SoundTouchJS.

---

# Comentarios pendientes

273. Explorador no funciona bien (pendiente de aclarar por usuario).
281.4-281.7 Ordenamiento IA de carpetas (pro/premium), presets, instrucciones.
284. Modo clip falla intermitentemente con loops comprimidos + chop.
286. Auditoría seguridad Sprint 4 completada — ver solid-seguridad-optimizacion.md.
287. Auditoría Mezclador DAW Sprint 4 completada — ver solid-seguridad-optimizacion.md.

---


## Lecciones Aprendidas (compactas)

**API/Backend:**
- `apiGet` hace `json.data ?? json` → NUNCA `resp.data.data` (double-unwrap). Tipear `RespuestaApi<T[]>`.
- PG TEXT[] requiere `'{val1,val2}'`, usar `pgArrayAPhp()`. PDO devuelve string `"{}"` — parsear.
- Backend snake_case, frontend camelCase — normalizadores obligatorios. IDs: `String()` en comparaciones.
- Validar longitud ANTES de sanitizar. `esc_url_raw()` DB, `esc_url()` HTML.
- Rate limit login/registro por IP. PDO INTERVAL: concatenar, no bind.
- `\filter_var`, `\session_id` en namespaces PHP requieren `\`.
- PageManager: `reactPage('padre/hijo')` NO auto-creaba padre WP → lookup fallaba.
- PDO ATTR_EMULATE_PREPARES=false: exception si params tiene keys sin placeholder. Usar `array_diff_key`.
- AdminController: `AuthMiddleware::requerirAdmin()` como permission_callback. Subqueries SELECT para contar relaciones.
- Columnas PG: verificar nombres exactos con psql (baneado_hasta, autor_id). Aliases SQL deben coincidir.
- `wp_handle_upload()` solo en wp-admin — require `includes/file.php` en REST API.
- Créditos = cupo diario (COUNT hoy vs límite). Bonus: columna `creditos_bonus` sumada al límite.
- Precios sincronizados en: StripeService (backend), PlanesIsland, LandingPublica, roadmap.
- Backend `actualizarUsuario` ya soportaba `plan` — verificar existencia antes de crear.

**React/TypeScript:**
- NUNCA hooks después de early return. React Compiler: no `Date.now()` render/useMemo, no refs `.current` render.
- PageRenderer fix: render-time state update (no useEffect→setState). `setPaginasCache(prev => ...)` funcional.
- Tras refactors: `npm run type-check`. CampoTexto onChange: cast `as unknown as`.
- Spread `...archivos` colisiona con `resetear` — listar props explícitamente.
- useTabsIsla(islaId, tabs, activaInicial) — re-registra tabs en keep-alive.
- copiarAlPortapapeles fallback execCommand para http://. `usePlanesModalStore.getState().abrir()` fuera de React.
- CustomEvent + listener para refrescar feeds. Ref pattern para evitar stale closures en `[]` deps.
- Sidebar: `itemsFinales: SidebarItemDef[]` tipar explícitamente. Badge variantes: neutro|acento|exito|error|advertencia|info|premium.
- MAPA_RUTAS en LayoutPrincipal.tsx actualizar al añadir sidebar items.

**CSS/UI:**
- `:has(.reproductorGlobal)` bottom dinámico. `pointer-events` NO animable — usar `::before` bridge.
- No select nativo — dropdown con MenuContextual. Metadata emocion: splitear, filtrar >30 chars.
- Gráficas CSS: barras agrupadas > apiladas. Colores lejanos en espectro. Eje referencia obligatorio.

**Mezclador DAW:**
- Aislado en `/Mezclador/` con tsconfig propio (baseUrl → Glory/assets/react). ErrorBoundary requiere import React.
- Web Audio: AudioContext singleton, GainNode/pista, OfflineAudioContext export. `playbackRate` para time-stretch simple.
- `detune` + `playbackRate` → `computedRate = rate * 2^(detune/1200)`. Compensación se cancela algebraicamente — NO compensar.
- `fuente.start(when, offset, duration)`: duration es buffer-time, multiplicar por playbackRate para wall-clock.
- Drag-to-mixer: dataTransfer + CustomEvent fallback. Drag timeline: document.addEventListener + cleanup. Refs en closures.
- inferirCompas: usar `duracionSample/playbackRate`, no duración cruda.
- Stretch = cambiar duracionCompases. `playbackRate = buffer.duration / (durCompases * durCompas)`. Clamped [0.25,4.0].
- Drift resize: `duracionOriginalCompases` + `playbackRateOriginal` inmutables. Recalcular desde originales.
- Clip mode: playbackRate fijo, ajustar recorteFin. durMax = `(buffer.duration/playbackRate)/durCompas`.
- Undo/redo: SnapshotMezclador {pistas, totalCompases} sin audioBuffers. Truncar historial forward. MAX=30.
- snapConResolucion() central. calcularLineasCuadricula() visual. Zoom wrapper escala width%.
- Fin real audio: max(compasInicio+duracionCompases) de todos los bloques, no totalCompases.
- Botones bloque: stopPropagation onClick + verificar closest('.mezcladorBloqueBotones') onMouseDown.
- Modal contextual: guard !modalConfigAbierto + overlay stopPropagation. Viewport: Math.max(8, Math.min(pos, viewportSize-panelSize-8)).
- Corte: dividir waveformPeaks proporcionalmente. Preview: snapConResolucion → % dentro del bloque.
- Selección múltiple: Set<string>, Ctrl+click toggle, batch move con delta uniforme (preserva offsets).
- Shift+drag: duplicar ANTES de iniciar drag. Colisión duplicar: Math.max fines como alternativa.
- Modo resize global vs individual: mover de entidad a store cuando aplica a todos.
- BPM mid-playback: convertir a compases (invariante) antes de cambiar, reconvertir con BPM nuevo.
- Ghost preview: posicionDragFantasma → MezcladorPanel → Timeline → PistaTimeline como props.
- panelLateralStore.expandido: resetear false en cerrar(). PipelineAudio IA: FFmpeg -t 20 ~10x más pequeño.
- Audio local: File.arrayBuffer() + decodeAudioData. Pseudo-SampleResumen con id negativo.
- Mover controles entre componentes: verificar imports en AMBOS (origen+destino).
- Toggles herramienta (corte, resize): barra visible, no escondidos en modales.
- FFmpeg waveform: `-f f32le -ac 1 -ar 8000` + unpack('g*') + picos por chunks. 60 barras suficiente.

- [Mezclador]: SoundTouchJS 0.3.0 para pitch-independent stretch. Cache por `${bloqueId}:${semitonos}:${playbackRate}`. Invalidar cache al cambiar modo/detune.
- [Mezclador]: `modoTonalidad` per-block (resample|stretch). Default resample. motorAudioService bifurca en programarReproduccion y renderizarOffline.
- [Store]: crearModalStore.abrir(archivo?, esMezcla?) — backward compatible. consumirArchivo() retorna y limpia File pre-cargado.
- [Cache]: mensajesStore con SWR pattern — `conversacionesCargadas` bool + `ultimaCargaConversaciones` timestamp + `necesitaRefrescar()` TTL 2min.
- [Seguridad]: .htaccess bloquea WAV+MP3 optimizado. HMAC streaming en DescargasController.php. API ya no expone rutaOriginal/rutaOptimizada.
- [Schema]: Cols constants en `App\Config\Schema\_generated\`. Patrón: `$row[XxxCols::COLUMNA]` en vez de `$row['columna']`. SQL aliases (reaccion_usuario, total de COUNT, etc.) se dejan como strings o class constants. Datos WP (display_name, etc.) no se migran.
- [Schema-Enums]: `{Tabla}Enums.php` generado desde arrays `check` del schema. `SamplesEnums::ESTADO_ACTIVO`, `LikesEnums::TIPO_SAMPLE`, `LikesEnums::REACCION_ENCANTA`, `UsuariosExtEnums::PLAN_FREE`, etc. Eliminar strings hardcodeados en filtrops SQL y parámetros PDO. Regenerar al añadir valor CHECK en schema.
- [Schema-TS]: Union types (`TipoSample`, `EstadoSample`, etc.) ahora derivados de `ISamples['tipo']` del schema generado. Si se añade un valor CHECK en la DB y se regenera, TS rompe donde no se maneja. Interfaces manuales (Sample, Usuario) se mantienen porque la API normaliza a español (`creadoAt`, no `createdAt`). Cols + interfaces re-exportados desde `@app/types`.
- [VPS]: Plan completo en App/docs/plan-vps-kamples.md. Stack: WP+MariaDB+PostgreSQL(pgvector). Dockerfile custom con pdo_pgsql+FFmpeg+Node. KAMPLES_PG_HOST='postgres' en Docker (no 127.0.0.1). Build=Vite (no esbuild). Schema System archivos commiteados — NO regenerar en VPS. WP_DEBUG=FALSE obligatorio (SchemaRegistry). Excluir v001_local_sin_pgvector y v001_schema_inicial en deploy. themeName='glorytemplate'.
- [coolify-manager]: Variables de entorno per-project en settings.json field `env`. `Get-SiteEnvVars` expande `${VAR}` desde host. `New-CoolifyWordPressStack -Template kamples` selecciona template YAML alterno. setup-kamples.ps1 ejecuta: PG health→migraciones→env sync→composer→npm build→FFmpeg verify→Apache restart. deploy-theme.ps1 detecta `template=kamples` y ejecuta composer+build post-deploy automáticamente.

**Patrones generales:**
- NormalizadorSample: alias SQL para columnas homónimas. extraerTagsMetadata() combina campos IA.
- BarraAccionesPost: shape mínimo + callbacks opcionales. EnlaceCreador: avatar+nombre+nav.
- calcularSugerencias(): SQL genérico reutilizable. FeedSamples dual: precargado + infinite scroll.
- Búsqueda cross-entity: ILIKE por endpoint, no endpoint unificado.
- Descripciones contienen hashtags — limpiar con `replace(/#\w+/g, '')`.
- Algoritmo colecciones CTE: user_tags LIMIT 15 + coleccion_tags. sqlTagsEnriquecidos public.
- Modal contextual: `{ x: clientX, y: clientY }` al store + Math.min viewport.
- verificado_boost: multiplicador 1.15 post-penalización en algoritmoPesos.
- [PDO]: ATTR_EMULATE_PREPARES=false prohibe reusar placeholder (`:uid` x2). Usar `:uid` + `:uid2`.
- [SQL]: tabla samples usa `creador_id`, NO `usuario_id`. Siempre verificar nombres de columna con psql.
- [Offset]: `(int) $request->get_param('page')` devuelve 0 si no se envía → offset -20 → PG error. Siempre usar `max(1, (int) ...)`.
- [Logs]: ServicioBan, ServicioAntiSpam y ComentariosController deben usar `LogModeracion as KamplesLogger`, no KamplesLogger ni LogIA.
- [PG credenciales]: PostgresService ahora EXIGE KAMPLES_PG_USER y KAMPLES_PG_PASSWORD en .env (sin defaults). psql: `"C:\Program Files\PostgreSQL\18\bin\psql.exe"`.
- [Mezclador-Audit]: `iniciar()` en motorAudioService debe verificar `state !== 'closed'` — si no, retorna contexto cerrado irrecuperable.
- [Mezclador-Audit]: `setSilenciarPista` ahora recibe `volumenReal` como 3er param — des-silenciar restaura el volumen configurado de la pista.
- [Mezclador-Audit]: Buffers invertidos se recrean en cada schedule — cachear como pitchShift. `limpiarProyecto` y `destruir()` deben llamar `limpiarCache()`.
- [Mezclador-Audit]: `inferirCompas` y `aplicarPitchShift` pueden dividir por 0 — guard bpm>0 y rate>0.
- [Mezclador-Audit]: `setTiempoActual` en rAF causa 60fps re-renders — throttle o usar ref selectivo para cursor.