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

---

# Comentarios pendientes

192. Trabajar en el ws local, no se si hacer eso necesario para resolver problemas como por ejemplo cuando abro el modal de mensajes aparece "Cargando..." luego "No hay mensajes..." y luego aparecen los mensajes, tambien es molesto que tengan que cargar los mensajes cada vez que abro ese modal.
202. Auditar la seguridad de los audios, que sea dificil descargar los audios originales adivinando url, y que sea dificil descargar los mp3 ligeros tambien, rate limits, auditorias, etc, sin bloquear o dañar la reproducción de audios
220. En crearCondiciones debería aparecer para que cuando publico un sample, aparezca o no en comunidad. En tarjetaMeta aparecen.
252. ✅ [AG-DAW] Compactación roadmap — C169-C272 resumidos en bloques compactos, entradas individuales eliminadas.
254. EL boton de publicar mezcla no funciona, puede esto no este planificado, pero realmente requiere pasos extra con la detección de duplicados, porque supongamos que hago una mezcla de un audio exactamente igual, el sistema debería detectar esos casos en que se intenta publicar un sample igual aunque sea una mezcla y pasarlo a moderación. 
254.1 Veo que en el menu contextual de la foto de perfil hay un limitador de creditos, ejemplo usuario free tiene 5 creditos y aparece 5, si bien, al reiniciar el dia debe volver a 5, hay que quitar el limite, o sea si tengo 5 creditos y publico un sample, debería tener 6, si pasa un dia y todavía tengo 6, no debe restar y dejarme en esos 6, pero si tengo menos (4, 3, etc) reiniciar a 5 o a lo que corresponde, asi con los otros planes. Permitir que los usuarios ganen creditos por mezclar o publicar samples.
254.2 Aclaración porque siento que no entiende bien 254, lo que se busca es debería permitirse mezcla siempre y cuando no sean tan parecidas, a los samples ya publicados. 
255. los archivos del mezclador como mezcladorStore, se estan haciendo muy grandes, refactorizar y aplicar solid con cuidado.
262. Planificar adaptación de .agent\coolify-manager para correr postgres automaticamente y instalar todo lo que necesita este proyecto para que funcione en el vps linux. 
263. Sigo sin poder ver la imagen de perfil del otro usuario en chatFlotanteHeader (ya se arreglo)
264. Los comentarios necesitan opciones de 3 puntos, un menu contextual donde aparezca la opcion de editar, reportar y eliminar, los admin pueden borrar cualquier comentarios y los usuarios eliminar sus propios comentarios.
265. Poder dar like a los comentarios, y responder otros comentarios, que los comentarios se aniden cuando sean una respuesta, las respuestas ocultas por defecto.
266. Recibir notificaciones cuando se recibe like en un sample, cuando se responde un comentario, o se da like a un comentario, no recibir notificaciones de auto like o autorespuesta. Notificaciones de publicaciones eliminadas, en moderación, de sample verificado, de pago procesado de stripe con exito y accendido a pro o premium, etc, recibir que todo lo que deba generar una notificación, lo genere.
271. La tonalidad casi funciona bien, lo que pasa es que si cambia, pero, cuando se cambia la tonalidad directamente, el audio debe mantener su duración. O sea, no contraerse o estirarse, esto es mas profundo porque implica varias cosas, te explico como funciona en fl studio. En resample el pitch esta determinado por cuanto se estire (mas rapido = mayor pitch). En stretch no importa que tanto se estire, el pitch no cambia y se define desde configuracion. Por defecto resample. Modos individuales por audio. Requiere phase vocoder o SoundTouchJS para true pitch-independent stretch.
272. ✅ [AG-DAW] Deseleccionar al hacer click en área vacía de timeline. PistaTimeline onClick + limpiarSeleccion().
273. Los audios al arrastrarse al mini daw, pierden unos milesegundos iniciales, cosa que esta mal porque tiene que ser preciso. (Corrijo, no es el audio, si no la onda, la onda tiene que ser precisa)
273.1 Hay otro problema con la onda, y es que en modo clip, cuando se recorta o estira con el modo clip activado, la onda no debe contraerse ni estirarse. Solo en modo strech porque esa es el efecto coherente.
274. Inicialmente el mini daw debe aparecer con coon 20 pistas vacías.
275. [EN CURSO — AG-DAW] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\App\Kamples\Api\Controladores\ComentariosController.php:124
#10 C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-blog-header.php(16): wp()
#11 C:\Users\Owner\OneDrive\Documentos\WP\app\public\index.php(17): require('C:\\Users\\Owner\\...')
#12 {main}
  thrown in C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\App\Kamples\Api\Controladores\ComentariosController.php on line 124
276. no puedo ver los post pendientes de moderación en, tal vez tenga que ver con esto 
[2026-02-18 00:56:30] [ERROR] PostgresService::consultar error | error=SQLSTATE[42703]: Undefined column: 7 ERROR:  no existe la columna r3.completa
LINE 460:                 WHERE r3.usuario_id = $1 AND r3.completa = t...
                                                       ^
HINT:  Probablemente quiera hacer referencia a la columna «r3.completada»., sql=WITH scored AS (
                    SELECT s.*, u.username, u.nombre_visible, u.avatar_url, u.verificado,
                           u.wp_user_id AS creador_wp_user_id,
                           
[2026-02-18 00:56:33] [ERROR] PostgresService::consultar error | error=SQLSTATE[42703]: Undefined column: 7 ERROR:  no existe la columna «completa»
LINE 9:                            CASE WHEN completa THEN 'reproduc...
                                             ^
HINT:  Probablemente quiera hacer referencia a la columna «reproducciones.completada»., sql=SELECT s.embedding::text, tipo_interaccion, peso FROM (
                    SELECT target_id as sample_id, 'like' as tipo_interaccion, 3 as peso
                    FROM likes WHERE usuario_id = :us
[2026-02-18 00:56:33] [ERROR] PostgresService::consultar error | error=SQLSTATE[42703]: Undefined column: 7 ERROR:  no existe la columna r3.completa
LINE 460:                 WHERE r3.usuario_id = $1 AND r3.completa = t...
                                                       ^
HINT:  Probablemente quiera hacer referencia a la columna «r3.completada»., sql=WITH scored AS (
                    SELECT s.*, u.username, u.nombre_visible, u.avatar_url, u.verificado,
                           u.wp_user_id AS creador_wp_user_id,
                           
[2026-02-18 01:17:31] [INFO] ModeracionIA: Veredicto comentario | comentarioId=5, nivel=aprobado, razon=
[2026-02-18 01:20:26] [INFO] ModeracionIA: Veredicto | publicacionId=4, nivel=rechazado, razon=desconocida
[2026-02-18 01:20:36] [ERROR] PostgresService::consultar error | error=SQLSTATE[42703]: Undefined column: 7 ERROR:  no existe la columna «tag_score»
LINE 72:                     COALESCE(tag_score, 0) * 0.60
                                      ^, sql=
                WITH user_tags AS (
                    SELECT tag, SUM(peso) as afinidad
                    FROM (
                        SELECT UNNEST((
            COALESCE(s_l.tags, ARRAY[
[2026-02-18 01:21:29] [INFO] ModeracionIA: Veredicto | publicacionId=5, nivel=aprobado, razon=
277. Todo lo que tenga que ver con moderación los logs tienen que estar en App\logs en un archivo separado,
278. Ya lo entiendo, la onda nos imprecisa al comienzo, sino que al medida que es mas larga la tarjeta de audio, por alguna extraña razon las lineas se vuelven mas gruesas haciendo que pierda calida, esta forma de onda o este comportamiento no es acto para un daw donde se necesita precisión para ver exactamente donde esta cada pico. Las demas ondas de los otros lugares esta bien, pero aca, necesitamos algo mejor.
279. Tengo 2 colecciones, ambas aparecen que son publicas en su pagina individual, pero ne la pagina de explorar colecciones, no aparece ninguna colección. Dice "Sin colecciones públicas".
280. ✅ [AG-DAW] Sidebar librería: icono Box, navegación normal a /libreria. PanelLibreria marcado SIN USO TEMPORAL para C281.
281. ✅ [AG-DAW] Explorador: página /explorador con vista file-explorer. Backend: endpoints `/me/coleccionados` + `/me/coleccionados/carpetas`. Frontend: ExploradorIsland con árbol de carpetas (C282) + lista samples. Registrado en pages.php, appIslands, MAPA_RUTAS, Sidebar.
281.1 ✅ [AG-DAW] Botón descargar → Plus/Coleccionar. Marca como coleccionado sin descargar archivo. Descargar movido al menú contextual.
281.2 ✅ [AG-DAW] "Descargas" renombrado a "Coleccionados" en sidebar, tabs y textos de DescargasIsland.
281.3 ✅ [AG-DAW] Samples subidos por el usuario aparecen automáticamente en coleccionados (endpoint `/me/coleccionados` usa UNION descargados + propios).
281.4 Vuelvo a la pagina de Explorador, aparecen mis samples coleccionados todos inicialmente en una carpeta de coleccionados, abro la carpeta y aparecen todos los samples sueltos, aqui viene la magia, en el explorador arriba, aparte de los botoenes de cambiar de vista, ordenar por nombre, titulo, peso, etc, habrá otro boton de ordenamiento inteligente, esto utilizará IA para ordenar los samples en carpetas, el usuario tendra una configuración para describir como quiere que se ordenen sus samples, habrá una instrucción inicial basica.
281.5 De la forma mas eficiente posible, evitando multiple llamadas si es posible, la ia con la información de cada sample (resumir porque json y es muy grande), decidira, probablemente en lote de 10 samples (porque puede alucinar a medida suben los tokens), decidirá en base a la estructura de carpetas, en donde debe ir cada sample, si una carpeta no existe, entonces la crea, tiene que tomar esas decisiones y las carpetas crearse en base a esas decisiones, y moverse si es posible en tiempo real. Esta funcionalidad solo estará disponible para los usuarios pro y premiun. 
281.6 la instruccion inicial debe ser 1 nivel maximo para ordenar samples en carpetas en base (voy a escribir un borrador, tu lo mejoras), por lo general los productores prefieren este tipo de orden, 

Drums (Se asume que todo aqui es one shot)
---Kick
---Snare
---Fx
---Etc todo lo que sea drums
One shot
---Instrument
------Piano
------Guitar
------Etc
Loops
---Drums
---Instruments
Sample (se asume que son loops casi siempre)
---Hip hop
---Phonk
---Trap
---Etc

nota: samples por lo general son trozos de canciones asi que ordenarlos es subjetivo pero por lo general creo que por genero esta bien
Este orden es mi preferiencia, esto es bastante subjetivo porque no hay uan forma correcta asi se me ocurre lo siguiente
281.7 Presents de ordenamiento, hacer 3 present y presentar una estructura de ejemplo, asi cada quien elige.
282. ✅ [AG-DAW] Metadata carpetas IA: prompt de ServicioIA actualizado con carpeta_primaria (Drums|Loops|Samples|FX|Instruments|Vocals) y carpeta_secundaria. PipelineAudio guarda en JSONB. Types TS actualizados.

Lo clave es que se puede agregar una metadata nueva de carpeta primara, carpeta secundaria, preguntarle a la IA que en que carpeta iría generalmente este sample, y darle una instrución clara de como debe ser, porque esto puede generar un problema o varios

lo primero que queremos es que no samples no se guarden en una carpeta llamada sample, y luego otra samples, tienen que ver un mecanismo de normalización ya sea mediante prompt, en el json o posterior, 
tampoco queremos una especificación elevada como "samples de piano melancolicos", la posibilidad de que otro sample se guarde en una carpeta asi dado a la aleatoreadad de la es casi imposible.
tampoco queremos una generalización entrema de que todos los samples van a guardar en una carpeta "sample", por esa razón hay que dejar claro los mecanimos que vamos a usar para impedir estos problema

probablemente la mejor forma de no generalizar ni caer en la especificación es ya crear una estructura de carpeta por defecto y darselo a la ia para que elija una carpeta 

consegui esta estructura de ejemplo, si puedes pulilar, mejor, pero por lo general a mi me gusta y prefiero esta

Samples
 ├─ Drums
 │   ├─ Kicks
 │   ├─ Snares
 │   ├─ Claps
 │   ├─ HiHats
 │   ├─ Toms
 │   └─ Percussion
 ├─ Loops
 │   ├─ Drum Loops
 │   ├─ Perc Loops
 │   ├─ Bass Loops
 │   └─ Melodic Loops
 ├─ Samples
 │   ├─ Hip hop samples
 │   ├─ Phonk Samples
 │   ├─ Vintage Samples
 ├─ FX
 │   ├─ Impacts
 │   ├─ Risers
 │   ├─ Sweeps
 │   └─ Atmos
 ├─ Instruments (One‑shots)
 │   ├─ Bass
 │   ├─ Chords
 │   ├─ Leads
 │   └─ Pads
 └─ Vocals
     ├─ Phrases
     └─ One‑shots


````json
"metadata": {
"tags": [
    "jazz",
    "melancholy",
    "smooth",
    "instrumental",
    "sample"
],
"genero": [
    "jazz",
    "lo-fi",
    "chillhop"
],
"emocion": [
    "sad",
    "melancholic",
    "relaxed",
    "introspective"
],
"tags_es": [
    "jazz",
    "melancólico",
    "suave",
    "instrumental",
    "muestra"
],
"emocion_es": [
    "triste",
    "melancólico",
    "relajado",
    "introspectivo"
],
"descripcion": "This 10.7-second jazz loop captures a somber mood with a delicate piano chord progression, warm saxophone melodies, subtle brush drums, and a walking bass line, perfect for lo-fi hip-hop or cinematic background.",
"instrumentos": [
    "piano",
    "saxophone",
    "double bass",
    "drums"
],
"artista_vibes": [
    "Miles Davis",
    "Chet Baker",
    "Bill Evans",
    "John Coltrane"
],
"bpm_confianza": 1,
"key_confianza": 0.75,
"descripcion_es": "Este bucle de jazz de 10,7 segundos captura un ambiente melancólico con una delicada progresión de acordes de piano, cálidas melodías de saxofón, sutiles baterías con escobillas y una línea de bajo caminante, ideal para lo-fi hip-hop o fondos cinematográficos.",
"descripcion_corta": "A melancholic jazz loop with soft piano and gentle saxophone lines.",
"nombre_archivo_base": "melancholy jazz loop",
"descripcion_corta_es": "Un bucle de jazz melancólico con piano suave y líneas delicadas de saxofón."
},
````
283. ✅ [AG-DAW] Nombre archivo restructurado: Instrumento-Genero-Tono-BPM-Nombre-kamples-id.ext. Campos ausentes se omiten.
284. El modo clip a veces falla,  no se si por el modo clip o que, pero, estos son los eventos. Supongamos que tengo un loop que suena cada compas, suena 8 veces asi que cada linea de compas coincida con cada golpe, si recorto con clip hasta a mitad, bien, las los golpes todavía coinciden, pero, si comprimo a la mitad logrando que el golpe suene 2 veces por compas, a ahora cada 2 golpes sigue coincidiendo, pero al momento de que use el clip se rompe el orden. Tengo que decir que esto no es preciso porque no siempre sucede y no se la causa exacta o las condiciones necesarias para replicarlo. De hecho, a veces no pierde el orden a veces simplemente al usar chop, cambia la duración a una mas corta.



---


 
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

**Patrones generales:**
- NormalizadorSample: alias SQL para columnas homónimas. extraerTagsMetadata() combina campos IA.
- BarraAccionesPost: shape mínimo + callbacks opcionales. EnlaceCreador: avatar+nombre+nav.
- calcularSugerencias(): SQL genérico reutilizable. FeedSamples dual: precargado + infinite scroll.
- Búsqueda cross-entity: ILIKE por endpoint, no endpoint unificado.
- Descripciones contienen hashtags — limpiar con `replace(/#\w+/g, '')`.
- Algoritmo colecciones CTE: user_tags LIMIT 15 + coleccion_tags. sqlTagsEnriquecidos public.
- Modal contextual: `{ x: clientX, y: clientY }` al store + Math.min viewport.
- verificado_boost: multiplicador 1.15 post-penalización en algoritmoPesos.