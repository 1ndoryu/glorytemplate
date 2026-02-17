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

|               | Free      | Pro ($9.99) | Premium ($19.99) |
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

---

# Comentarios pendientes

**Resueltos (compacto):** C85 BarraAccionesPost+EnlaceCreador, C103/104 auth modal 3 campos+imagen, C126 modal edición unificado, C127 menú 3 puntos, C128 similares+comentarios expandidos, C129 paginación infinita comentarios, C130 comentarios multimedia, C131 automod IA, C132 bans progresivos, C133 keep-alive, C140 descargas/favoritos separados, C148 algoritmo tags+creador, C149-C168 fixes varios (tooltip, panel waveform, badges, config panel, seguridad hardening, PageRenderer render-time), C171-C176 sesión actual.

**Pendientes:**
169. ✅ Búsqueda en colecciones: ILIKE en listar()+explorar() backend, apiColecciones con parámetro busqueda, LibreriaIsland suscrito a filtrosStore, TopBar placeholder dinámico por isla (R46).
170. ✅ Editor metadata fix: descripción real cargada (limpiando hashtags), SampleResumen con campo descripcion, chips IA readonly (BPM/key/género/emoción) en ModalEditar (R46).
171. ✅ Licencia libre auto-derivada de permitirDescarga. Eliminada de ModalCrear y ModalEditar (R43).
172. ✅ Compactado (R44).
173. ✅ BadgeModeracion siempre visible (icono sin texto). Admin puede aprobar posts pendientes desde menú contextual ComunidadIsland (R44).
174. ✅ useTabsIsla hook re-registra tabs en keep-alive. PageRenderer updater funcional previene pantalla negra. 8 islas migradas (R44).
175. ✅ Descargas/Favoritos rediseñados con estructura ColeccionDetalle (R43).
176. ✅ copiarAlPortapapeles() con fallback execCommand para contextos no-HTTPS. 4 consumidores actualizados (R44).
177. ✅ Eliminado badge plan, textoLimites y calidad WAV de DescargasIsland (R45).
178. ✅ Sistema verificación samples completo: migración v015 (columna+índice), PUT admin, normalizer, BadgeCheck en tarjeta+detalle, menú contextual verificar/desverificar, EVENTO_SAMPLE_ACTUALIZADO, boost algoritmo 1.15x (R45).
179. ✅ FASE 13 Panel de Administración completo: AdminController.php con 6 endpoints (resumen, actividad, usuarios CRUD, moderación, moderar), AdminPanelIsland con 3 tabs (Resumen KPIs+gráfica, Usuarios tabla+acciones, Moderación aprobar/rechazar), Sidebar enlace condicional admin, CSS responsive completo (R47).
180. ✅ FilaColecciones horizontal: max 8 chips con imagen+nombre, scroll invisible, arriba de inicioBarraControl en InicioIsland (R46).
181. ✅ Algoritmo colecciones: explorar() con CTE user_tags+coleccion_tags, score afinidad tags 0.60 + frescura 0.20 + volumen 0.20 + follow boost 1.3x, fallback updated_at para no-auth. sqlTagsEnriquecidos ahora public (R46).
182. ✅ Guardar sample: botón Bookmark en TarjetaSample al lado de like, coleccionPickerStore con posición contextual (x,y del click), overlay transparente en modo contextual (R46).
183. ✅ Fix reproducciones: columna completa renombrada a completada (v016). El guard wp_handle_upload ya existía de C168 (R46).
184. ✅ Mezclador (Mini DAW) — Sistema aislado en `/Mezclador/` con ErrorBoundary. Incluye: botón TopBar, panel lateral redimensionable (280-700px), timeline multi-pista con drag&drop desde feed, detección de compás (3/4, 4/4, 5/4, 6/8, 7/8), barras expandibles (default 4, max 32), cursor de reproducción, bloques visuales con waveform mini + título, export WAV via OfflineAudioContext, publicación vía ModalCrear (CustomEvent), optimización IA (MP3 20s recortado para Groq Whisper). 18 archivos nuevos + 6 modificados + tsconfig/vite config.
186. ✅ Fix "Pagina React no configurada" en admin/panel: se registró `PageManager::reactPage('admin/panel', 'AdminPanelIsland')` en pages.php. La página WP se auto-crea en la próxima carga. Resuelto como parte de C179 (R47).
187. Cuando reproduzco la waveform en el panel lateral, debe pausarse la otra waveform que se esta reproduciendo.
188. Volver a dar click a la waveform en el panel lateral debería poder pausar la reproducción de esa waveform.
189. Cuando doy click a cualquier boton a un sample en la lista de sample, se reproduce automaticamente, no debería reproducir si el click fue en un boton.
190. Cuando el sample esta guardado en una colección, no hay indicación visual en el modal de de guardar en colección de que ese sample esta guardado alli.
191. ✅ Fix C191 "Pagina React no configurada" en admin/panel: CAUSA RAIZ — `reactPage('admin/panel')` no auto-creaba la pagina padre 'admin' en WP. Sin padre, 'panel' quedaba en raíz, `PageTemplateInterceptor` no podía encontrar key 'admin/panel'. FIX: auto-registrar paginas padre stub en `PageDefinition::reactPage()` + safety net `asegurarPaginaPadre()` en `PageProcessor`. Afectaba TODAS las paginas jerárquicas (admin/*, auth/*, mensajes/chat, perfil/editar, dev/componentes).
Funcion esperada: Asegurate de que la funcion exista y este cargada.
192. Trabajar en el ws local, no se si hacer eso necesario para resolver problemas como por ejemplo cuando abro el modal de mensajes aparece "Cargando..." luego "No hay mensajes..." y luego aparecen los mensajes, tambien es molesto que tengan que cargar los mensajes cada vez que abro ese modal.
193. La foto de perfil sigue viendose asi. <div class="avatar avatarXs" title="?"><span class="avatarIniciales">?</span></div> No se ve la foto de perfil de los usuarios. Incluso de despues de colocarme una en las configuraciones.
194. Error en isla "AdminPanelIsland"
Cannot read properties of undefined (reading 'length')
195. Verificar que los css del AdminPanelIsland esten bien, tengo las sospecha que no se estan usando las variables correctas, igual para el modal de guardar colecciones.
196. Cuando abro el mini daw, no sale nada. (De esto se debe encargar solo el agente que trabaja en el minidaw)
198. Sumar un credito cada vez que un usuario publica un sample.
199. Asegurarse de que cuando alguien intente descargar un sample y no tiene credito, se abra el modal de suscribirse.
200. Veo inconsistencias a la informacion de las suscripciones entre el modal y la configuracion de stripe, la del modal es la info actualizad.
201. apiCliente.ts:96   POST http://glory.local/wp-json/kamples/v1/comentarios/sample/18 400 (Bad Request) cuando intento subir un audio en los comentarios, los audios en los comentarios por cierto tienen que ser ligeros mp3 y verse en forma de waveform
202. Auditar la seguridad de los audios, que sea dificil descargar los audios originales adivinando url, y que sea dificil descargar los mp3 ligeros tambien, rate limits, auditorias, etc, sin bloquear o dañar la reproducción de audios
203. Tarea para el agente del minidaw: Cuando el mezclador se abra, quitar el padding de panelLateralInterno, y abarcar el ancho completo.

---

## Lecciones Aprendidas (compactas)

**API/Backend:**
- `apiGet` hace `json.data ?? json` → NUNCA hacer `resp.data.data` (double-unwrap). Tipear `RespuestaApi<T[]>`.
- PG TEXT[] requiere formato `'{val1,val2}'`, usar `pgArrayAPhp()` para parsear.
- PDO+PG: TEXT[] devuelto como string `"{}"` — siempre parsear.
- Backend snake_case, frontend camelCase — normalizadores obligatorios.
- IDs backend (string) vs frontend (number) — usar `String()` en comparaciones.
- Validar longitud ANTES de sanitizar (sanitize_text_field trunca silenciosamente).
- `esc_url_raw()` para DB, `esc_url()` para output HTML.
- Rate limit login por IP (no usuario), registro también por IP.
- PDO: `INTERVAL ':param seconds'` NO funciona en PG — concatenar directamente.
- `\filter_var`, `\session_id` etc. dentro de namespaces PHP requieren prefijo `\`.
- [PageManager]: `reactPage('padre/hijo')` NO auto-creaba la página WP padre. Sin 'admin' en WP, 'panel' queda en raíz y `get_page_uri()` retorna 'panel' en vez de 'admin/panel' → lookup falla en interceptor.

**React/TypeScript:**
- NUNCA hooks despues de early return condicional — todos los hooks antes de cualquier return.
- React Compiler: no `Date.now()` en render/useMemo, no refs `.current` en render, no `setState` en useEffect.
- PageRenderer negro: useEffect→setState deja 1 frame vacío. Fix: render-time state update.
- `setPaginasCache(prev => ...)` funcional para evitar stale closures en rápida navegación.
- Tras refactors, `npm run type-check` para detectar imports muertos.
- CampoTexto onChange: HTMLInputElement vs HTMLTextAreaElement — cast con `as unknown as`.
- Spread `...archivos` en return colisiona con `resetear` — listar props explícitamente.

**CSS/UI:**
- `:has(.reproductorGlobal)` para bottom dinámico de toasts/chats.
- `pointer-events` NO es animable — usar `::before` bridge para cubrir gaps en tooltips.
- No usar select HTML nativo — dropdown propio con estilo MenuContextual.
- Metadata `emocion` puede ser string sin separadores — splitear y filtrar >30 chars.

**Patrones:**
- useTabsIsla(islaId, tabs, activaInicial) — re-registra tabs cuando isla se activa en keep-alive.
- copiarAlPortapapeles(texto, mensaje) — fallback execCommand para http://.
- EVENTO_SAMPLE_ACTUALIZADO — evento custom para actualizar propiedades de samples in-place en FeedSamples (verificado, etc.).
- NormalizadorSample: alias SQL necesario cuando tabla samples y usuarios tienen columna con mismo nombre (s.verificado AS verificado_sample vs u.verificado).
- verificado_boost en algoritmoPesos.php: multiplicador configurable (default 1.15) aplicado post-penalización.
- BarraAccionesPost: shape mínimo + callbacks opcionales. Sin callback = decorativo.
- EnlaceCreador: avatar+nombre+navegación. Elimina imports duplicados.
- calcularSugerencias(): SQL genérico reutilizable para cualquier lista del usuario.
- FeedSamples dual: tab principal (datos precargados) + tab sugerencias (infinite scroll via FeedSamples+proveedor).
- MAPA_RUTAS en LayoutPrincipal.tsx debe actualizarse al añadir items al sidebar.
- extraerTagsMetadata() combina metadata IA (tags/genero/instrumentos/emocion/artista_vibes).
- [C169]: Para búsqueda cross-entity, extender cada endpoint con `ILIKE` + parámetro `busqueda`, no crear endpoint unificado — más simple.
- [C170]: Descripciones de samples contienen hashtags del ModalCrear — limpiar con `replace(/#\w+/g, '')` al cargar en editor.
- [C181]: Algoritmo colecciones con CTE es eficiente — `user_tags LIMIT 15` + `coleccion_tags` agrupados. `sqlTagsEnriquecidos` debe ser public para reutilizar.
- [C182]: Posicionar modal contextual: pasar `{ x: e.clientX, y: e.clientY }` al store, ajustar con `Math.min()` para no salir del viewport.
- [BD]: Columna reproducciones era `completa` no `completada` — renombrada con v016. Siempre verificar nombres exactos de columnas con psql.
- [C179]: AdminController: todos los endpoints admin usan `AuthMiddleware::requerirAdmin()` como permission_callback. Las queries admin pueden usar subqueries en SELECT para contar relaciones (total_samples, total_descargas por usuario).
- [C179]: Sidebar condicional: `const itemsFinales: SidebarItemDef[] = esAdmin ? [...items, adminItem] : items` — tipar explícitamente para evitar TS2339 en propiedades opcionales.
- [C179]: Badge variantes son 'neutro|acento|exito|error|advertencia|info|premium', NO 'default|secondary|destructive|outline'.
- [C184]: Mezclador aislado en `/Mezclador/` con tsconfig propio (baseUrl apunta a Glory/assets/react para resolver react/lucide-react/zustand). ErrorBoundary class component obliga a importar React explícitamente.
- [C184]: Web Audio: AudioContext singleton, GainNode por pista, OfflineAudioContext para export. `playbackRate` para time-stretch simple (bpmProyecto/bpmSample).
- [C184]: Drag-to-mixer: usar `dataTransfer.setData('application/kamples-sample', JSON.stringify(sample))` + CustomEvent como fallback.
- [C184]: PipelineAudio IA: FFmpeg `-t 20 -codec:a libmp3lame -b:a 128k -ac 1 -ar 22050` genera MP3 ~10x más pequeño que WAV original para enviar a Groq.
- [C184]: `KamplesLogger` usa `::warning()` no `::warn()`. Verificar métodos antes de usar.
- [WP API]: `wp_handle_upload()` vive en `wp-admin/includes/file.php` — NO se carga en contexto REST API. Siempre hacer `if (!function_exists('wp_handle_upload')) require_once ABSPATH.'wp-admin/includes/file.php'` antes de usarlo. SamplesController lo tenía, Comentarios y Mensajes no.