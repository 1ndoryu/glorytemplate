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
**R48:** C184 Mezclador (Mini DAW): Sistema aislado en /Mezclador/ (18 archivos). Arquitectura: types, stores (Zustand), services (motorAudio singleton), hooks (useMotorAudio, useTimeline, useExportarMezcla, useMezclador), components (MezcladorPanel, Timeline, PistaTimeline, BloqueSample, BarraCompases, CursorReproduccion, ControlesMezclador, ErrorBoundary). Integración: panelLateralStore (+mezclador mode), PanelLateral (resize handle), TopBar (botón Music2), TarjetaSample (draggable). Config: vite.config.ts (@mezclador alias + fs.allow), tsconfig.json (Mezclador propio + Glory paths). Backend: PipelineAudio.php (MP3 temporal 20s para IA Groq).
**R43:** C171 licenciaLibre auto-derivada de permitirDescarga (4 archivos simplificados, ~134 lín eliminadas) + C175 descargas/favoritos rediseño ColeccionDetalle-style + CSS descargasFavoritos.css eliminado.
**R44:** C176 copiarAlPortapapeles fallback execCommand (clipboard.ts, 4 consumidores), C173 BadgeModeracion siempre visible + admin aprobar posts (ComunidadIsland), C174 useTabsIsla hook keep-alive tabs fix (8 islas migradas) + PageRenderer updater funcional (fix pantalla negra).
**R41:** C131/C132 moderación IA comentarios + bans: ServicioAntiSpam.php (heurístico pre-IA: URLs, caps, spam patterns, duplicados), ServicioBan.php (violaciones progresivas: 3→24h, 5→7d, 8→30d, notificaciones automáticas). ServicioModeracionIA.moderarComentario() (Guard texto + Vision imagen, tolerante con toxicidad/insultos, solo rechaza spam/pornografía/ilegal, contexto musical para álbumes). v014 migración (moderacion_estado/detalle en comentarios, violaciones/ban en usuarios_ext, tabla reportes genérica). ComentariosController integra anti-spam sincrónico + moderación IA async (shutdown hook) + filtrado rechazados en listar(). AuthMiddleware.verificarBanActivo() helper centralizado. TipoNotificacion += 'moderacion'. C167: PageRenderer refactorizado (patrón render-time state update, elimina cascading renders y pantalla negra). Type-check 23→0 errores (imports muertos en 6 archivos, IndicadorDescargas campos LimitesDescarga). C168: fix \n literal en ComentariosController.

---

## Pendientes por Fase

### FASE 0 — Infraestructura y Base

> Prioridad: ALTA — desbloquea algoritmo, uploads, y IA

- [x] **0.1a** Conexión PHP → PostgreSQL — PDO singleton, health endpoint, schema 14 tablas
- [x] **0.1b** pgvector compilado e instalado (master branch PG18, HNSW, CREATE EXTENSION vector)
    - v009_embeddings_pgvector.sql ejecutada, GeneradorEmbeddings.php (128d), VerificarPgvector.php
- [x] **0.2** Almacenamiento audio en WP — upload+MIME validation+ID corto+slug
    - TO-DO: htaccess deny direct access, servir via PHP con validación de permisos
- [x] **0.3** Pipeline audio — FFmpeg cross-platform (.env>PATH>winget), BPM/key+IA+waveform+MP3+preview+renombrado
    - TO-DO: mover a wp_schedule_single_event() cuando el volumen crezca
- [x] **0.4** Colors/ dinámicas — endpoint GET, transient cache 24h
    - TO-DO: WebP conversion, lazy loading, srcset

### FASE 1 — Auth y Perfil

- [x] **1.1** Fix PerfilIsland — guard authCargando, fix stale closure, botón editar→modal
- [x] **1.2** ModalConfiguracion — avatar, nombre, bio, notificaciones, PUT /me
    - Subida real de avatar implementada: POST /me/avatar + FormData (R9)
- [x] **1.3** Auto-creación usuarios_ext — GET /me sincroniza WP→Postgres
- [ ] **1.4** Google OAuth (cuando las keys estén listas)

### FASE 2 — Pipeline de Subida de Audio + IA

- [x] **2.1** Upload real — ModalCrear→FormData→endpoint, waveform preview, tags #
- [x] **2.2** Análisis audio — técnico (AnalizadorAudio: BPM onsets+key Goertzel) + creativo (ServicioIA: Groq Whisper + LLM bilingüe)
- [x] **2.3** Metadata imágenes — ServicioImagenIA (Groq Llama 4), async shutdown hook, v005
- [x] **2.4** ModalCrear simplificado — sin campos manuales BPM/Key/Tipo, banner IA, Ctrl+Enter
- [x] **2.5** Tags BPM normalizados — bpmUtils.ts (categorías Lento/Normal/Rápido)
    - TO-DO: click en tag → filtrar por categoría
- [x] **2.6** Nombrado IA — `kamples_{tipo}_{genero}_{bpm}_{key}_{idCorto}.{ext}`
    - TO-DO: permitir edición del nombre antes de publicar
- [x] **2.7** IDs cortos — GeneradorIdCorto 7 chars base62, migración v003
    - TO-DO: lookup dual por slug o id_corto
- [x] **2.8** Deduplicación audio — DeduplicadorAudio.php hash perceptual background, supervisión entre usuarios, tabla reportes_duplicados planificada

### FASE 3 — Algoritmo v1 (pgvector local)

> Prioridad: ALTA — diferenciador clave del producto

- [x] **3.1** pgvector: embedding vector(128) en samples + buscar_similares() SQL + HNSW index
- [x] **3.2** Señal de comportamiento (0.25) — 5 sub-factores: likes, reproducciones, tiempo, descargas, completadas
- [x] **3.3** Señal de tendencias (0.15) — velocity 24h/7d + normalización por horas publicado
- [x] **3.4** Señal de novedad (0.10) — boost logarítmico configurable
- [x] **3.5** Scoring SQL combinado — 6 señales + penalización + diversidad creador
- [x] **3.6** Señal de grafo social (0.10) — seguidos directos + likes de seguidos
- [x] **3.7** Cache de feeds — WP transients 5min + invalidación global/individual

### FASE 4 — Filtros y Ordenamiento (InicioIsland)

- [x] **4.1** ModalFiltros rediseñado — toggles con iconos
- [x] **4.2** InicioIsland sin tabs — ordenamientos dropdown, infinite scroll+virtualización
- [x] **4.3** Filtros conectados a store — filtrosStore.ts + useFiltros.ts
    - TO-DO: enviar filtros toggle al backend cuando endpoints los soporten

### FASE 5 — Chat Flotante tipo Messenger

- [x] **5.1** ChatFlotante — fixed bottom-right, max 3 chats, minimizable, burbujas
- [x] **5.2** Soporte multimedia en chat (imágenes, audio, samples compartidos)
- [ ] **5.3** WebSocket local (canales chat/notif, typing, online, read receipts)
- [ ] **5.4** Optimización chat (virtualización, lazy load, caché local)

### FASE 6 — Navegación y Páginas

- [x] **6.1** SPA fluida — prefix matching, popstate, middle-click→nueva pestaña
- [x] **6.2** SampleDetalleIsland — hero+waveform XL, creador nav, like API, similares
    - TO-DO: metadata generada por IA (instrumentos, sentimiento, artistas)
- [x] **6.3** ColeccionDetalleIsland — header+grid+badge+stats
- [x] **6.4** ComunidadIsland — feed posts, filtros Todos/Siguiendo/Populares
- [x] **6.5** LandingPublica — nav flotante blur, sin sidebar/topbar para deslogueados

### FASE 7 — Monetización (Stripe)

- [x] **7.1** Stripe Billing — PagosController (checkout/portal/webhook), StripeService, webhooks
- [x] **7.2** PlanesIsland — Checkout real, portal, estados UI, prueba 30 días
- [x] **7.3** Stripe Connect (onboarding creadores, revenue share 70/30, 80/20)
- [x] **7.4** Samples premium (compra individual + bloqueo sin plan)
- [x] **7.5** Límites por plan — StripeService::obtenerConfigPlan(), transferencia GB, v006, AuthMiddleware

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

### FASE 13 — Panel de Administración (C112 — Planificación)

> Prioridad: MEDIA — funcionalidad clave para gestión de la plataforma  
> Ruta: `/admin/panel` | Isla: `AdminPanelIsland`  
> Acceso: solo `rol === 'admin'` (protegido por ConAutenticacion + validación backend)

**Estructura de tabs:**

1. **Resumen (Dashboard)**
   - Tarjetas KPI: usuarios registrados, samples subidos, descargas totales, ingresos, posts publicados
   - Gráfico actividad reciente (últimos 7/30 días): registros, uploads, descargas
   - Samples pendientes de moderación (count + link a tab moderación)
   - Reportes sin resolver (count + link a tab reportes)

2. **Usuarios**
   - Lista con búsqueda, filtro por plan (free/pro/premium), ordenar por fecha, actividad
   - Columnas: avatar, username, email, plan, rol, fecha registro, samples, descargas
   - Menú contextual por usuario: banear, eliminar, cambiar plan (ascender a pro/premium), enviar mensaje, ver perfil
   - Backend: `AdminController::listarUsuarios()`, `AdminController::actualizarUsuario()`

3. **Moderación**
   - Lista de contenido pendiente/en revisión (publicaciones + samples si se extiende moderación a samples)
   - Columnas: tipo, autor, contenido (truncado), estado actual, razón IA, fecha
   - Acciones: aprobar, rechazar, marcar para revisión manual
   - Backend: `AdminController::listarPendientes()`, `AdminController::moderar()`

4. **Reportes**
   - Lista de reportes de usuarios (contenido ofensivo, spam, duplicados, etc.)
   - Columnas: tipo (sample/post/usuario), reportador, reportado, razón, fecha, estado
   - Acciones: resolver (aprobar/rechazar contenido), descartar, contactar usuario
   - Backend: `ReportesController::listar()`, `ReportesController::resolver()`
   - Tabla BD: `reportes` (id, tipo, target_id, reportador_id, razon, estado, resuelto_por, created_at)

5. **Monetización**
   - Ingresos por período (suscripciones activas, revenue share, comisiones)
   - Lista de transacciones recientes
   - Top creadores por ingresos
   - Desglose por plan (free/pro/premium counts + revenue)
   - Backend: datos de Stripe via `StripeService`

**Dependencias:**
- `AdminController.php` (nuevo controlador para endpoints admin)
- `ReportesController.php` (nuevo controlador para reportes)
- Migración: tabla `reportes`
- Frontend: `AdminPanelIsland.tsx` + componentes por tab
- Reutilizar: `MenuContextual`, `Badge`, `BotonBase`, `TabBar`, tabsTopBarStore

**Menú contextual publicaciones (C112 parcial):**
- Opciones: eliminar (dueño/admin), reportar (cualquiera), copiar enlace, ver post
- Publicaciones tienen página individual (click en fecha/tiempo → `/post/{id}`)
- Reutilizar patrón de `useMenuContextualSample`

---

## Showcase y Dev Tools

- [x] ShowcaseIsland — inline styles→CSS clases+custom properties

---

### Colecciones + Algoritmo de Recomendación (C14) ✔ COMPLETO

- [x] **Fase A:** Colecciones CRUD, modal guardar tipo Pinterest con ranking relevancia, apiColecciones.ts
- [x] **Fase B:** Tab "Más Ideas" con sugerencias, FeedSamples centralizado (~470 lín), InicioIsland 550→180 lín
- [x] **Fase C:** algoritmoPesos.php (pesos dinámicos), MotorRecomendacion.php (scoring 6 señales), ModalSugerenciasLike post-like, similares en detalle
- [x] **Fase D:** Tracking reproducciones, historial, filtro "Ya reproducidos" real, penalización repetidos
- [x] **Fase E:** Moderación IA 3 capas (Guard 4 + Scout visión + gpt-oss contextual), async shutdown hook, v007

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

**C1-C10:** FFmpeg cross-platform, IA bilingüe Groq, auto-creación usuarios_ext, pipeline audio, moderación IA 3 capas.
**C11-C20:** pgArrayToPhp, mocks eliminados, normalizarSample snake→camelCase, colecciones Pinterest, roadmap compactado, plan badge TopBar, delete samples admin/dueño, tags estilos.
**C21-C30:** JSON repair 5 estrategias, feedTagItem accesible, precio samples premium, URLs relativas audio, naming IA, avatar normalización, inspector JSON IA, PipelineAudio::jsonb, BotonDevTools, perfil persistente.
**C31-C40:** ExperimentosController, type-check 29→0, migración v008, avatar upload, admin role fix, pgvector+algoritmo, perfil samples filtro, experimentos notificaciones, sample 404 fix, apiCliente HTML.
**C41-C50:** DevTools posición, hooks render order, colecciones API fix, tabs duplicadas, PlanificadorAlgoritmo, race condition tabs, Gemini Flash 3.0, logs algoritmo, perfil samples persistente, ExperimentosController parsing.
**C51-C60:** Avatar defensivo, filtro inteligente MotorRecomendacion, logs canales+limpieza, GROQ_API validación, sanitize_text_field slug, Gemini model name, pipeline timeout flush, apiPeticion data wrapping, publicado_at INSERT, likes snake_case.
**C61-C70:** Middle-click perfil, feed nuevo usuario cache, ruta_archivo columnas, descargas ruta, DELETE regex, borrar sin recargar, toasts sistema, waveform servidor, mockups perfil eliminados, ModalPublicar global.
**C71-C84:** ComunidadIsland API real, descargas WAV, reproducciones tracking, diversidad suave, docs algoritmo, TarjetaMeta IA, URL directa sample, modal suscripción overlay, seguir perfil propio, waveforms remuestreo, hover corazón, comentarios controller, posts texto, borde toast.
**C85-C100:** BarraAccionesPost+EnlaceCreador centralizados, panel lateral sugerencias, librería tabs API, estilos feedSamples, SeccionPublicar inline, @admin Invalid Date, publicarModos eliminado, tags mínimos 2, posts perfil tab, EVENTO_SAMPLE_ELIMINADO, panel detalle sample+comentarios, comentarios fuera pieFlex, waveform pre-play, imagen blob, likes comunidad, filtros samples.
**C101-C120:** MenuContextual posición, separador eliminado, auth 3 campos+modal imagen, follow+mensaje, modal colección UI, buscador colecciones, coleccionMeta, botones colección, créditos+ZIP, panel lateral listas, menú contextual posts+AdminPanel plan, inicioTagsContador, feedTags colecciones, búsqueda↔tags sync, SelectFiltro+SelectorBPM, JSON bilingüe análisis, inspector rutas, errores PerfilIsland, badge moderación.
**C121-C145:** MIN_TAGS alineado, verificación comentarios, hooks render order, SeccionPublicar=ModalCrear refactor, botones colección texto, modal edición unificado, menú 3 puntos unificado, similares+comentarios expandidos, paginación infinita comentarios, comentarios multimedia, automod IA, bans+moderación, keep-alive PageRenderer, tags metadata IA, panel lateral sugerencias fix, todosLosTags, guardar colección propia, descargas propias gratis, normalizador colecciones, separación descargas/favoritos, TarjetaColeccion menú, sugerencias double-unwrap, CSS seccionPublicar, reacciones completas (dislike+encanta), créditos NaN fix.
**C146-C168:** v012 mensaje, algoritmo tags+creador, feedTags fix, hover tooltip, panel waveform, badge borde, TarjetaMini, botones panelDetalle, config preferencia panel, similares toggle, botón descarga acento, PanelRightClose, WebSocket (pendiente), filtro reproducidos fix, colecciones 3 puntos, tags concatenados, menú chat, seguridad hardening, cola eliminada, compactación, PageRenderer render-time update+type-check, syntax error ComentariosController.
**C171-C178:** Licencia libre auto-derivada (R43), compactar registros (R44), BadgeModeracion+admin approve (R44), tabs freeze+pantalla negra fix (R44), descargas/favoritos rediseño (R43), copiar enlace fallback (R44), remover créditos descargas (R45), sistema verificación samples (R45).
**C169-C183:** Búsqueda colecciones (R46), editor metadata fix descripcion+chips IA (R46), fila colecciones inicio (R46), algoritmo colecciones CTE (R46), modal guardar contextual+Bookmark (R46), fix reproducciones completada (R46).
**C179:** Panel Administración FASE 13 (R47).
**R49-R51:** C193 avatares fix (UsuarioHelper centralizado), C194-C196 AdminPanel+CSS+panel vacío, C198-C201 créditos/suscripción/precios/audio-comentarios, C203-C245 Mezclador DAW completo (stretch/drag/snap/zoom/undo/redo/corte/ghost/drift/clip/admin/gráfica/BPM/detune/expandir), C246-C261+C267 duplicar colisión/selección múltiple/20 pistas/Shift+drag/placeholder/ModalConfigDaw/stretch-clip global/admin plan/fix detune/dropZone/viewport/selección visual/multi-drag/resize fuera modal, C272 deselect click.
**R52 (AG-DAW):** C252 compactación roadmap, C272 deselect timeline, C280 sidebar librería Box+nav normal, C281+281.1-281.3 Explorador page (/explorador) con árbol carpetas + coleccionados backend (endpoints /me/coleccionados + /carpetas) + botón Plus/Coleccionar + "Descargas"→"Coleccionados" + samples propios auto-incluidos, C282 metadata carpetas IA (prompt+pipeline+JSONB carpeta_primaria/secundaria), C283 nombre archivo restructurado (Instrumento-Genero-Tono-BPM-Nombre-kamples-id).
275. ✅ [AG-DAW] Guard max(1,page) en 8 controladores para evitar OFFSET negativo. LogModeracion en ComentariosController.
276. ✅ [AG-DAW] Ya corregido en código previo (completada + sub.tag_score). Requiere flush OPcache/Apache restart.
277. ✅ [AG-DAW] Logs moderación: ServicioBan + ServicioAntiSpam + ComentariosController ahora usan LogModeracion.
278. ✅ [AG-DAW] Waveform DAW: líneas se engruesan con tarjetas largas, necesita precisión.
279. ✅ [AG-DAW] Colecciones públicas: causa raíz era OFFSET negativo (page=0→offset=-20). Corregido con max(1,page).
281.4-281.7 Ordenamiento IA de carpetas (pro/premium), presets, instrucciones.
284. Modo clip falla intermitentemente con loops comprimidos + chop.
285. ✅ [AG-DAW] Fix SQL coleccionados: creador_id + uid2 placeholder. Compactación roadmap.
**R53 (AG-KMP):** C192 cache mensajes SWR (mensajesStore global + DropdownMensajes + MensajesIsland: TTL 2min, show cache → refresh background), C202 seguridad audio (4 fixes: ocultar rutas API, .htaccess WAV/MP3, HMAC streaming, rate limiting), C220 toggle comunidad (ya implementado e2e: ContenidoCrear toggle + useCrearContenido + apiSamples + SamplesController), C254 publicar mezcla (crearModalStore archivoPreCargado + MezcladorPanel→abrir directo + useCrearContenido consume archivo al montar), C254.1 créditos mezcla (ya implementado: +1 creditos_bonus en SamplesController al publicar), C254.2 deduplicación (ya implementado: DeduplicadorAudio auto-ejecuta en PipelineAudio), C255 mezcladorStore SOLID (931→150 líneas: 5 módulos accionesBloques/Carga/Historial/Seleccion + tiposMezcladorStore), C262 plan VPS coolify-manager (documento completo en App/docs/plan-vps-kamples.md: stack YAML + Dockerfile + init-postgres + migraciones + checklist 3 fases), C264 menú 3 puntos comentarios (ya existía), C265 likes+respuestas anidadas (ya existía, migración v018), C266 notificaciones expandidas (agregado publicacionEliminada en PublicacionesController), C271 pitch-independent stretch SoundTouchJS (resample/stretch per-block, pitchShiftService con cache, ModalConfigBloque toggle, motorAudioService soporte dual mode).
**R54 (AG-SCH):** Schema System completo (Fase 13.5): 18 SchemaDeclarations (App/Config/Schema/), 36 archivos generados (18 *Cols.php + 18 *DTO.php en _generated/), 1 schema.ts TS, CLI (schema:generate + schema:validate + table), SchemaRegistry + enforcement en PostgresService. Migración completa: 18 archivos PHP migrados de `$row['columna']` a `$row[XxxCols::COLUMNA]` (~220 accesos). Archivos migrados: NormalizadorSample, SocialController, DashboardController, PerfilController, SamplesController, PublicacionesController, ColeccionesController, AuthController, DescargasController, MensajesController, PagosController, ConnectController, ComentariosController, AdminController, ReproduccionesController, MotorRecomendacion, UsuarioHelper, ServicioNotificaciones.
**R55 (AG-SCH):** Fix Schema System runtime: (1) SchemaRegistry lazy-init — init() nunca se invocaba, añadido self::init() en todos los métodos públicos. (2) ejecutar()/insertar() ahora validan schemas. (3) validarQueryContraSchema mejorado: excluye CTEs (WITH...AS), aliases cortos. (4) Columnas faltantes añadidas: stripe_subscription_id en UsuariosExt, moderacion_razon+updated_at en Publicaciones. Regenerados 36 Cols/DTO + schema.ts. Doc: App/docs/schema-revision.md.
**R56 (AG-SCH):** Migración Cols completa — 11 archivos restantes migrados de `$row['columna']` a `$row[XxxCols::COLUMNA]` (~50 accesos). Archivos migrados: StripeService, ServicioBan, ServicioAntiSpam, GeneradorEmbeddings, PlanificadorAlgoritmo, DeduplicadorAudio, ExperimentosController. Residuos corregidos: ComentariosController (normalizarComentarios 18 accesos migrados a ComentariosCols+LikesCols), MensajesController (ConversacionesCols+MensajesCols), ColeccionesController (ColeccionSamplesCols), DescargasController (ColeccionesCols). SQL aliases preservados como strings (otro_id, total, seg_inactivo, peso). PlanificadorAlgoritmo: patrón dinámico `$estado[$columna.$sufijo]` preservado (runtime-constructed). 11/11 sin errores sintaxis PHP.
**R57 (AG-SCH):** Auditoría profunda Schema System: (1) Fix crítico parser `extraerEntradasColumna` — reescrito con parser nivel-0 (evita `'check' => [...]` como columna → `$check` duplicado en DTOs). (2) Fix `NOW()` fallback → `date('Y-m-d H:i:s')`. (3) Nuevo `aArrayDB()` en todos los DTOs (claves snake_case para SQL). (4) Union types TS funcionales (`'loop' | 'oneshot'`). (5) AuthMiddleware migrado a UsuariosExtCols. (6) Documentación completa: Glory/readme.md, Glory/docs/php/schema-system.md, Glory/docs/cli/schema-generate.md, Glory/docs/cli/schema-validate.md, Glory/docs/cli/create-table.md. 18 DTOs + schema.ts regenerados.
**R58 (AG-SCH):** Schema System protección TS/React: union types derivados del schema generado (TipoSample, EstadoSample, TipoReaccion, TipoPlan, RolUsuario, TipoPublicacion, NombrePlan, EstadoSuscripcion, TipoTransaccion, EstadoTransaccion). Interfaces schema + Cols constants re-exportados desde types/index.ts. BadgeModeracion.tsx corregido — detectado automáticamente: faltaba estado `en_supervision` (descubierto por el schema). Ahora si el schema cambia, TS rompe en compilación.

---

# Comentarios pendientes


273. ✅ Actualizar plan-vps-kamples.md — sincronizado con Schema System (R54-R58), Mezclador DAW, Vite (no esbuild), variantes v001, WP_DEBUG, dependencias completas. 14 secciones.
274. ✅ Implementar coolify-manager para Kamples — setup-kamples.ps1, CoolifyApi template selection, kamples-stack.yaml (WP+MariaDB+PG18+pgvector), Dockerfile.kamples, init-postgres.sh, env vars per-project en settings.json, Get-SiteEnvVars, Get-PostgresContainerId, deploy-theme post-deploy kamples, .env.example.
273. Comprimir las tareas cumplidas del roadmap !TODAS! no solo los comentarios.
273. El Explorador no funciona bien, lo explicaré mas adelante (pendiente de aclarar.)
286. Auditoría seguridad PipelineAudio + ServicioIA completada (21 hallazgos: 1 HIGH, 6 MEDIUM, 10 LOW, 3 INFO). Prioridad: S1 prompt injection via descripcionUsuario, P5 SQL column whitelist, P7 memory exhaustion waveform, S2-S4 prompt injection (filename/tags/whisper), S8 rate limiting IA.
287. Auditoría seguridad/calidad Mezclador DAW TypeScript (14 archivos, 2539 lín). 15 hallazgos: 1 P0, 4 P1, 7 P2, 3 P3. P0: `iniciar()` retorna AudioContext cerrado (no verifica state). P1: setSilenciarPista pierde volumen real, buffer invertido sin cache (GC pressure), inferirCompas div/0 si bpm=0, aplicarPitchShift div/0 si playbackRate=0. P2: destruir() no libera caches, limpiarProyecto no limpia buffers, cache pitch sin límite, race condition carga concurrente, doble exportación, rAF no cancelado en reproducir(), setTiempoActual 60fps re-renders. P3: motorAudioService 390 lín (>300), pseudoSample hardcoded, IDs Date.now(). Positivo: stale closures bien manejadas con getState(), refs en document listeners, cleanup en todos los effects, validación scheduling.

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