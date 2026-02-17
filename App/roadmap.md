# Kamples — Roadmap Integral de Producto

> **Versión:** 2.0  
> **Última actualización:** 16/02/2026 (iteración v2.6)  
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
| `/libreria`          | `LibreriaIsland`         | Colecciones, descargas, favoritos                   |
| `/mensajes`          | `MensajesIsland`         | Vista completa de conversaciones                    |
| `/planes`            | `PlanesIsland`           | Checkout Stripe                                     |
| `/reproductor`       | `ReproductorIsland`      | Player completo                                     |
| `/auth/login`        | `LoginIsland`            | Login                                               |
| `/auth/registro`     | `RegistroIsland`         | Registro                                            |
| `/admin/dashboard`   | `DashboardCreadorIsland` | Stats creador                                       |

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

### Registros de cambios (R1–R29 compactos)

**R1:** wsService fix, ShowcaseIsland split, useArchivosDragDrop, BienvenidaIsland onboarding, fix doble slash.
**R2:** SOLID refactor — 12 controladores, 2 helpers, 3 servicios, 1 config. Migraciones v003-v004.
**R3:** FeedSamples centralizado, InicioIsland 550→180 lín, ColeccionDetalleIsland tabs, ModalSugerenciasLike, useHistorialIds, sugerenciasLikeStore.
**R4:** Delete samples/colecciones (admin+dueño), plan badge TopBar, fix CSS import FeedSamples.
**R5:** JSON repair 5 estrategias, ServicioImagenIA (Groq visión), Stripe Checkout/Portal/Webhook, PlanesIsland funcional, apiPagos checkout+portal.
**R6:** Límites plan (DescargasController→StripeService DRY, transferencia GB), moderación IA 3 capas (ServicioModeracionIA), tags badge (<span>), AuthMiddleware stubs, migraciones v006-v007, roadmap compactado.
**R7:** Stripe Connect completo (ConnectController 4 endpoints + DashboardCreadorIsland sección Connect + revenue share descargas), samples premium (toggle ModalCrear + badge SampleDetalle + precio + bloqueo free).
**R8:** Chat multimedia full-stack (5.2, BurbujaMensaje+backend upload+FormData), MotorRecomendacion v1 (3.2-3.7, 6 señales + cache transient), bug fixes C23-C33, BotonDevTools mode switcher (C29), BotonExperimentos admin test content (C31), perfil camelCase fix (C30), JSONB cast fix (C28), PerfilIsland guard (C29), DashboardCreadorIsland BotonBase prop fix, npm type-check 29→0 errores (C32), migración v008.
**R9:** pgvector PG18 + GeneradorEmbeddings 128d + MotorRecomendacion v3 (similitud coseno) + EmbeddingsController + avatar upload (C34) + admin role fix (C35). v009.
**R10:** PlanificadorAlgoritmo dual rápido/preciso (C45) + WP Cron 5min + v010. Bugfixes C37-C46: perfil samples, sample 404, apiCliente HTML, hooks React, tabs race condition.
**R11:** Gemini Flash 3.0 (C47), apiCliente HTML, MotorRecomendacion logging (C48), creador en argsListar (C49), ExperimentosController fix (C50), Avatar defensivo (C51), filtro Inteligente→MotorRecomendacion (C52).
**R12:** Logs por canales ia/algoritmo/general + auto-limpieza 7d (C53). GROQ_API validación gsk_* (C54). Sample detalle sanitize_text_field+LOWER (C55). Pipeline flush mod_php + curl 30s (C57).
**R13:** Fallback IA Gemini (C58): cadena gemini-3→2.0→1.5-flash, HTTP 429 retryAfter + máx 1 reintento.
**R14:** Migración completa a Groq audio (C59): Whisper STT + Groq LLM chat. Reparación JSON: kimi-k2 + qwen3-32b + gpt-oss-20b.
**R15:** Compactación del roadmap.
**R16:** Bugfixes C58-C65: apiPeticion data wrapping (C58), darLike snake_case (C60), ruta_archivo→ruta_original (C63), descargas ruta (C64), DELETE regex (C65).
**R17:** Ocultados contadores likes/descargas TarjetaSample (reducir ruido visual).
**R18:** Sidebar: removido "Crear", añadido "Configuración" en sidebarFooter.
**R19:** TopBar UX: botón + unificado, badge plan izquierda, búsqueda centrada desktop + modal móvil.
**R20:** Batch C66-C76: toasts (C66-67), borrar sin recargar (C66), waveform servidor (C68), mockups eliminados (C69), ModalPublicar global (C70), ComunidadIsland API real+hash+auto-approve (C71), descargas WAV (C72), reproducciones (C73), diversidad suave (C74), docs algoritmo (C75), TarjetaMeta metadata IA (C76).
**R21:** Normalización diseño: TopBar/SampleDetalle/Mensajes/Notificaciones/ModalCrear/ModalPublicar migrados a Badge/BotonBase. CSS redundante eliminado.
**R22:** cssVarsValidator estricto: severidad error, scanAllFiles, detección hardcode.
**R23:** Light mode: paleta clara con #e5dfc7 como fondoBase.
**R24:** Fix temas: dark mode base en :root, light mode en data-theme='light'.
**R25:** Selector tema ModalConfiguracion: Oscuro/Claro, persistencia localStorage, tema.ts.
**R26:** SampleDetalle XL: portada 1:1, cabecera post, click=reproducir, métricas ocultas, tags unificados.
**R27:** SampleDetalle fino: cabecera+título dentro tarjeta, tags bajo waveform, acciones sin borde, compartir eliminado.
**R28:** SeccionPublicar inline C89, feedTags colecciones C114, panel lateral C86/C95/C111, sqlSelectSamples liked real, fixes C58/C61/C62.
**R29:** Créditos+ZIP colecciones (C110), tags metadata IA (C134), búsqueda↔tags sync (C115), SelectFiltro+SelectorBPM (C116).
**R30:** Compactación roadmap — C85-C134 resueltos a tabla, R9-R29 compactos, comentarios pendientes limpiados.
**R31:** C125 texto botones colección, C135 panel lateral sugerencias (no modal), C124 SeccionPublicar=ModalCrear refactor (useCrearContenido+ContenidoCrear compartido).
**R32:** C137 ocultar guardar colección propia, C139 normalizador snake→camelCase colecciones, C141 TarjetaColeccion menú 3 puntos, C142 fix sugerencias double-unwrap (apiGet ya desenvuelve json.data).

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

## Comentarios del usuario (resueltos)

| #   | Solicitud                                           | Estado                                                                                                                                                                                                                           |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | FFmpeg obligatorio Win+Linux                        | ✅ `buscarBinario()` cross-platform. Prioriza .env > PATH > rutas comunes > winget glob                                                                                                                                          |
| 2   | Prompt IA bilingüe, sin BPM/key                     | ✅ ServicioIA prompt creativo bilingüe. BPM/key vía AnalizadorAudio (Goertzel+autocorrelación)                                                                                                                                   |
| 3   | Groq API + fallback multi-modelo                    | ✅ Flujo 100% Groq: Whisper para audio (`whisper-large-v3`→`whisper-large-v3-turbo`) + LLM (`gpt-oss-120b`→`qwen3-32b`→`gpt-oss-20b`)                                                                                            |
| 4   | FFmpeg instalado                                    | ✅ v8.0.1 via winget. Fix: PHP/Apache no hereda PATH → `FFMPEG_PATH` en .env                                                                                                                                                     |
| 5   | Prompt con descripción+tags del usuario, mín 5 tags | ✅ `construirPrompt()` con contexto completo. Validación 5 tags frontend+backend                                                                                                                                                 |
| 6   | Not null violation email usuarios_ext               | ✅ INSERT incluye email desde `$wpUser['email']`                                                                                                                                                                                 |
| 7   | Unexpected token '<' al subir sample                | ✅ `require_once file.php` + prefijo `\` en funciones WP                                                                                                                                                                         |
| 8   | Refactorizar KamplesController (SOLID)              | ✅ 1713→60 lín. 12 sub-controladores, 2 helpers, 3 servicios, algoritmoPesos.php                                                                                                                                                 |
| 9   | Groq no procesa audio/imágenes                      | ✅ Actualizado: Groq Speech-to-Text (Whisper) procesa audio y Groq visión procesa imágenes.                                                                                                                                      |
| 10  | Moderación IA con Groq                              | ✅ ServicioModeracionIA 3 capas: Guard 4 + Scout visión + gpt-oss contextual. Migración v007. Feed filtra rechazados                                                                                                             |
| 11  | tags?.forEach is not a function                     | ✅ `pgArrayToPhp()` convierte string PG a array PHP                                                                                                                                                                              |
| 12  | Quitar todos los mocks                              | ✅ Eliminados mocks de 7 archivos API + 2 dropdowns + ComunidadIsland + mockSamples.ts                                                                                                                                           |
| 13  | nombreVisible/likes undefined                       | ✅ `normalizarSample()` reescrita: snake→camelCase, sub-objeto creador, cast tipos. ModalInspectorSample creado                                                                                                                  |
| 14  | Colecciones tipo Pinterest + algoritmo              | ✅ IMPLEMENTADO: Fases A-D completas (ver sección "Plan: Colecciones + Algoritmo")                                                                                                                                               |
| 15  | Compactar roadmap                                   | ✅ Hecho                                                                                                                                                                                                                         |
| 16  | Badge plan en TopBar                                | ✅ Free/Pro/Premium con estilos dinámicos + nav a /planes/                                                                                                                                                                       |
| 17  | URL del proyecto: `http://glory.local/`             | ANOTADO (ver Notas)                                                                                                                                                                                                              |
| 18  | Borrar mis samples desde menú contextual            | ✅ DELETE /samples/{id} condicional (dueño o admin)                                                                                                                                                                              |
| 19  | Admin borra cualquier sample/colección              | ✅ `UsuarioHelper::esAdmin()` + permisos en SamplesController y ColeccionesController                                                                                                                                            |
| 20  | Tags sin estilos                                    | ✅ Faltaba import de feedSamples.css                                                                                                                                                                                             |
| 21  | JSON roto de IA al subir                            | ✅ 5 estrategias de extracción JSON + reparación con Groq. Fix: control chars                                                                                                                                                    |
| 22  | feedTagItem eran badge, no botón                    | ✅ `<span role="button">` con accesibilidad + CSS reforzado                                                                                                                                                                      |
| 23  | Precio en crearCondiciones                          | ✅ Toggle precio + campo en ModalCrear, samples premium con badge + bloqueo                                                                                                                                                      |
| 24  | Sample no se reproduce (file:// URL)                | ✅ Fix: URLs relativas en vez de absolutas del filesystem                                                                                                                                                                        |
| 25  | URL sample usa nombre original                      | ✅ Naming IA: `kamples_{tipo}_{genero}_{bpm}_{key}_{idCorto}.ext`                                                                                                                                                                |
| 26  | Foto perfil no aparece                              | ✅ Fix normalizarUsuario() snake→camelCase (parte de C30)                                                                                                                                                                        |
| 27  | Inspector sin JSON IA                               | ✅ ModalInspectorSample sección JSON crudo + metadata IA                                                                                                                                                                         |
| 28  | JSON crudo IA no se guardaba                        | ✅ PipelineAudio ::jsonb cast para PDO native prepares + sección JSON IA en inspector                                                                                                                                            |
| 29  | Botón cambio de modo + PerfilIsland split crash     | ✅ BotonDevTools (devToolsStore + useUsuarioEfectivo) + guard `(rutaActual ?? '')`                                                                                                                                               |
| 30  | Datos perfil no persisten al recargar               | ✅ normalizarUsuario() en PerfilController (GET/PUT /me), PUT retorna perfil completo                                                                                                                                            |
| 31  | Botón experimentos admin                            | ✅ ExperimentosController (usuario test WP+PG, notif, mensaje real), BotonExperimentos en TopBar                                                                                                                                 |
| 32  | npm run type-check errores                          | ✅ 29→0 errores: imports no usados, props incorrectas (deshabilitado→disabled, fantasma→ghost)                                                                                                                                   |
| 33  | Re-ejecutar migración v008                          | ✅ Ejecutada contra PostgreSQL 18 (ALTER TABLE ×3 + CREATE INDEX)                                                                                                                                                                |
| 34  | Foto de perfil no se guarda                         | ✅ POST /me/avatar (FormData, MIME validation), ModalConfiguracion guarda File→upload→PUT                                                                                                                                        |
| 35  | Botón experimento no visible                        | ✅ GET /me ahora detecta rol WP administrator y fuerza rol='admin' en PG                                                                                                                                                         |
| 36  | Compilar pgvector + construir algoritmo             | ✅ pgvector master compilado PG18, embedding 128d, MotorRecomendacion v3, buscar_similares SQL                                                                                                                                   |
| 37  | Samples no aparecen en perfil                       | ✅ Filtro `creador` en SamplesController, PerfilIsland envía `creador: usuario.username`                                                                                                                                         |
| 38  | Experimentos no generan notificaciones              | ✅ Fix `usuario_id`→`creador_id` en samples query, `::jsonb` cast notificaciones INSERT                                                                                                                                          |
| 39  | Sample detalle dice "no existe"                     | ✅ Cambiar filtro `estado='activo'` por `NOT IN ('eliminado')` en obtener()                                                                                                                                                      |
| 40  | Unexpected token '<' en pipeline IA                 | ✅ apiCliente.ts: detectar HTML antes de JSON.parse, devolver error legible                                                                                                                                                      |
| 41  | Botón DevTools posición molesta                     | ✅ CSS: `top:12px` → `bottom:50%; transform:translateY(50%)`, panel desde nueva posición                                                                                                                                         |
| 42  | Error hooks React al cambiar foto perfil            | ✅ Early return antes de useCallback en BotonExperimentos/BotonDevTools → movido después de hooks                                                                                                                                |
| 43  | 404 colecciones/publicas                            | ✅ Frontend llamaba `/publicas`, backend tiene `/explorar`. Corregido apiColecciones.ts                                                                                                                                          |
| 44  | Tabs duplicadas en colecciones                      | ✅ Eliminadas tabs inline de ColeccionDetalleIsland, usar `activa` de tabsTopBarStore                                                                                                                                            |
| 45  | Frecuencia recálculo algoritmo                      | ✅ PlanificadorAlgoritmo dual (rápido/preciso), triggers + temporales, v010, cron 5min                                                                                                                                           |
| 46  | Race condition tabs colecciones                     | ✅ FeedSamples: `key` prop + `requestIdRef` guard stale requests, CSS tabs removido                                                                                                                                              |
| 47  | HTML en vez de JSON + Gemini Flash 3.0              | ✅ Detección HTML ampliada (`<br`, `<b>`), error con status+URL. Gemini Flash 3.0 (`gemini-2.5-flash-preview-05-20`) como primer modelo                                                                                          |
| 48  | Logs del algoritmo                                  | ✅ MotorRecomendacion con KamplesLogger (señales, cache, perfil, resultados). Fix namespace PlanificadorAlgoritmo                                                                                                                |
| 49  | Samples no aparecen en perfil (persistente)         | ✅ Parámetro `creador` faltaba en `argsListar()` de SamplesController — WP REST descartaba el filtro                                                                                                                             |
| 50  | Botón experimentos no funciona                      | ✅ Logging en ExperimentosController + console.log respuesta + fix parsing doble-wrap en BotonExperimentos                                                                                                                       |
| 51  | Avatar.tsx crash split undefined                    | ✅ `nombre` ahora es prop opcional con default ''. `obtenerIniciales` defensivo. DropdownMensajes usa optional chaining                                                                                                          |
| 52  | Filtro inteligente sin samples                      | ✅ InicioIsland: ordenamiento 'inteligente' ahora usa `obtenerFeed('descubrir')` (MotorRecomendacion) en vez de `listarSamples()`                                                                                                |
| 53  | Logs desordenados (debug.log + kamples.log)         | ✅ 3 canales: `kamples-ia-*.log`, `kamples-algoritmo-*.log`, `kamples-*.log`. Eliminados 12 error_log() de Pipeline+Postgres. Auto-limpieza 7 días                                                                               |
| 54  | GROQ_API Invalid API Key                            | ✅ Validación formato `gsk_*` con warning en logs. La key del .env no es válida — obtener nueva en console.groq.com/keys                                                                                                         |
| 55  | Sample detalle "No se encontró"                     | ✅ `sanitize_title` lowercaseaba el slug (idCorto tiene mayúsculas). Fix: `sanitize_text_field` + SQL `LOWER()`                                                                                                                  |
| 56  | Gemini 3.0 Flash model name                         | ✅ Corregido por usuario: `gemini-3.0-flash` (con punto)                                                                                                                                                                         |
| 57  | Upload 500 por timeout pipeline                     | ✅ Flush forzado para mod_php (`ignore_user_abort`+`ob_end_flush`), curl timeout 60→30s, set_time_limit 600s                                                                                                                     |
| 58  | Samples no aparecen en perfil (tercera vez)         | ✅ Causa raíz: `apiPeticion` extrae `json.data` → PHP devolvía data/pagination al mismo nivel → `resp.data.data = undefined`. Fix: PHP envuelve bajo clave `data`.                                                               |
| 59  | Sample publicado no sale en feed                    | ✅ Parte del fix C58 — `publicado_at` se establece desde el INSERT inicial                                                                                                                                                       |
| 60  | Like no persiste al recargar                        | ✅ Causa raíz: `apiSocial.ts` enviaba `targetId` (camelCase) pero backend espera `target_id`; `quitarLike` URL incorrecta `/like/{tipo}/{id}` → ahora usa body. `apiDelete` acepta body opcional                                 |
| 61  | Middle-click perfil no abre nueva pestaña           | ✅ `href` añadido a item "Ver perfil" en TopBar. MenuContextual ya renderiza `<a>` con href                                                                                                                                      |
| 62  | Inteligentes "No se encontraron samples"            | ✅ `feedNuevoUsuario` ya no cachea resultados vacíos. Liked subquery en CTE del motor                                                                                                                                            |
| 63  | Columna `ruta_archivo` inexistente + tipo check     | ✅ Columnas corregidas a `ruta_original`/`ruta_optimizada`/`ruta_waveform`. `target_type`→`tipo` en DELETE cascade. PipelineAudio normaliza tipo ('one shot'→'oneshot') contra CHECK constraint. Sample 16 actualizado a activo. |
| 64  | Descargar samples no funciona                       | ✅ Frontend llamaba `/descargas/${id}` pero ruta es `/samples/${id}/descargar`. Respuesta ahora retorna URL pública. Botones descarga conectados en TarjetaSample (fallback API) y SampleDetalleIsland (onClick).                |
| 65  | Eliminar samples 404                                | ✅ GET slug regex `[a-zA-Z0-9_-]+` capturaba IDs numéricos antes que DELETE `\d+` separado. Fix: GET+DELETE registrados en misma ruta con array de handlers. `eliminar()` lee param `slug` en vez de `id`.                       |
| 66  | Borrar sample recarga la página                     | ✅ Custom event `EVENTO_SAMPLE_ELIMINADO` + FeedSamples listener elimina del estado local sin recargar                                                                                                                           |
| 67  | Alerta genérica al borrar                           | ✅ Sistema de toasts (toastStore+ContenedorToasts+toast.css) con confirmar/info/exito/error, en esquina inferior derecha                                                                                                          |
| 68  | Waveform no aparece correcta                        | ✅ TarjetaSample+SampleDetalleIsland cargan picos desde `rutaWaveform` JSON servidor (fallback AudioContext)                                                                                                                      |
| 69  | Mockups en perfil                                   | ✅ Eliminados datos hardcodeados (Colombia/2024/kamples.com) y publicaciones mock de PerfilIsland. Campos dinámicos del backend                                                                                                   |
| 70  | Modal publicaciones en comunidad/perfil             | ✅ ModalPublicar añadido a ComunidadIsland (botón publicar) y LayoutPrincipal (instancia global)                                                                                                                                  |
| 71  | Posts comunidad + IA moderación + hash              | ✅ ComunidadIsland conectada a API real GET /publicaciones. Admin auto-aprobado. Moderación filtra visibilidad. PipelineAudio llama DeduplicadorAudio.programarCalculo(). audioHash en NormalizadorSample+SQL                     |
| 72  | Descargas deben ser WAV original                    | ✅ `CALIDAD_PLAN` ahora es wav para todos los planes (free/pro/premium)                                                                                                                                                           |
| 73  | Reproducciones siempre 0 en inspector               | ✅ TarjetaSample+SampleDetalleIsland ahora llaman `registrarReproduccion()` al reproducir. Backend ya contaba correctamente                                                                                                       |
| 74  | Algoritmo omite samples                             | ✅ `WHERE rn <= max_por_creador` eliminado. Diversidad por creador ahora es penalización suave (nunca excluye)                                                                                                                    |
| 75  | Crear MD del algoritmo                              | ✅ `App/docs/algoritmo.md` — 6 señales, pesos, diagramas, flujo completo, cache, recálculo, configuración                                                                                                                        |
| 76  | TarjetaMeta formato con metadata IA                 | ✅ TarjetaMeta muestra instrumento→género→emoción→velocidad→tag desde metadata IA. SampleResumen ampliado con metadata+totalReproducciones+audioHash                                                                             |
| 77  | URL directa sample no carga                         | ✅ `forzarResolucionDinamica()` en PageTemplateInterceptor: reconstruye $wp_query cuando 404 coincide con ruta dinámica React                                                                                                   |
| 78  | Modal suscripción recarga lista samples              | ✅ PlanesIsland convertido a modal overlay via planesModalStore (no cambia ruta, no desmonta InicioIsland)                                                                                                                       |
| 79  | Botón seguir aparece en perfil propio (detalle)      | ✅ Comparación esPropietario usa String() para evitar mismatch string/number                                                                                                                                                     |
| 80  | Waveforms todas iguales                              | ✅ Frontend ahora busca json.peaks además de json.picos. remuestrearPicos() adapta resolución al ancho del contenedor                                                                                                           |
| 81  | Hover corazón likeado debe ser blanco                | ✅ tarjetaSample.css, tarjetaPublicacion.css, sampleDetalle.css: .liked:hover → var(--blanco)                                                                                                                                    |
| 82  | Funcionalidad de comentarios                         | ✅ ComentariosController genérico (GET/POST /comentarios/{tipo}/{targetId}), hook useComentarios, ListaComentarios integrado en ComunidadIsland y SampleDetalleIsland, botón MessageCircle en TarjetaSample                       |
| 83  | Posts solo texto no aparecen                         | ✅ Moderación WHERE incluye 'pendiente' para autor. ModalCrear llama crearPublicacion(). json_encode→formato PG TEXT[]. pgArrayAPhp() parsea arrays PostgreSQL en listar/obtener. samplesAdjuntos acepta camelCase del frontend   |
| 84  | Borde amarillo confirmación + margen fantasma        | ✅ toastItemConfirmacion border-left cambiado a bordeSutil. Toasts/chats usan bottom dinámico con :has(.reproductorGlobal) — sin reproductor bottom:16px, con reproductor bottom:80/100px         
| 86  | Panel lateral sugerencias (no modal)                 | ✅ PanelLateral 340px + PanelSugerencias + PanelDetalleSample. panelLateralStore Zustand |
| 87  | Librería tabs API + quitar input búsqueda            | ✅ Cada tab llama API distinta. Input búsqueda eliminado de libreriaBarraAcciones |
| 88  | Estilos feedSamples centralizados                    | ✅ listaDeSamples unificado para feed/perfil/librería |
| 89  | SeccionPublicar inline (no modal)                    | ✅ SeccionPublicar + usePublicar hook compartido. ComunidadIsland + PerfilIsland |
| 90  | @admin · Invalid Date publicaciones                  | ✅ formatearTiempo() parsea fechas. Formato relativo |
| 91  | Eliminar publicarModos                               | ✅ publicarModos eliminado del JSX de ModalPublicar |
| 92  | Tags mínimos 5→2                                     | ✅ MIN_TAGS_AUDIO=2 en frontend y backend |
| 93  | Posts usuario en tab comunidad perfil                 | ✅ PerfilIsland tab comunidad muestra publicaciones del usuario |
| 94  | Sample eliminado sigue visible                       | ✅ EVENTO_SAMPLE_ELIMINADO + listener en FeedSamples y LibreriaIsland |
| 95  | Panel lateral: detalle sample + comentarios          | ✅ PanelDetalleSample (metadata, waveform, like, comentarios). TarjetaSample.onClickTitulo |
| 96  | Comentarios fuera de detallePieFlex                  | ✅ Renderizados como sección hermana |
| 97  | Waveform no muestra hasta reproducir                 | ✅ Confirmado resuelto por usuario |
| 98  | Imagen publicación blob URL                          | ✅ Imágenes se suben al servidor con URLs reales |
| 99  | Likes comunidad no perduran                          | ✅ Confirmado resuelto por usuario |
| 100 | Filtros samples incorrectos                          | ✅ 4 filtros toggle: ocultar reproducidos/likeados/descargados, solo seguidos |
| 101 | MenuContextual posición perfil                       | ✅ Confirmado resuelto por usuario |
| 102 | Eliminar separador menuContextual                    | ✅ Clase y renderizado eliminados |
| 105 | Follow no perdura + botón mensaje                    | ✅ GET /perfil/{username} devuelve siguiendo. BotonFollow sync. Mensaje abre chatFlotanteStore |
| 106 | Modal guardar colección sin cabecera                 | ✅ Panel sin cabecera, items: imagen+nombre+check |
| 107 | Buscador colecciones + crear nueva                   | ✅ Filtrado en tiempo real + botón crear si no existe. Alerta duplicado |
| 108 | coleccionMeta 5 metas comunes                        | ✅ useMemo 5 metas más comunes, separadas por • |
| 109 | Botones colección iconos + descargar + preview       | ✅ Guardar icono 32x32, Download y Play como botones icono |
| 110 | Créditos descarga + ZIP colecciones                  | ✅ POST /colecciones/{id}/descargar-zip, créditos verificados, TopBar créditos |
| 111 | Panel lateral todas listas excepto perfil/comunidad  | ✅ Habilitado en Inicio/Colecciones/Librería. FeedSamples pasa onClickTitulo |
| 112 | Menú contextual posts + AdminPanel                   | ✅ PLANIFICADO FASE 13 (5 tabs: Resumen/Usuarios/Moderación/Reportes/Monetización) |
| 113 | inicioTagsContador no cuenta                         | ✅ Query SQL COUNT directa |
| 114 | feedTags en colecciones                              | ✅ mostrarTags activado en ColeccionDetalleIsland |
| 115 | Búsqueda↔tags sync bidireccional                     | ✅ filtrosStore tagsIncluidos/tagsExcluidos, parsearBusquedaATags bidireccional |
| 116 | SelectFiltro + SelectorBPM dropdowns                 | ✅ Dropdowns estilo MenuContextual, BPM rango, tags draggable |
| 117 | Análisis JSON bilingüe vs algoritmo                  | ✅ ANALIZADO: bilingüe NO impacta algoritmo/embeddings |
| 118 | Inspector rutas archivo                              | ✅ Muestra nombre/ruta de original, optimizado, preview, waveform |
| 119 | Errores PerfilIsland                                 | ✅ Tipos: ubicacion/sitioWeb string/null, siguiendo boolean opcional |
| 120 | Badge moderación esquina superior derecha            | ✅ BadgeModeracion componente. Visible para autor/admin |
| 121 | Error subir sample MIN_TAGS                          | ✅ Frontend MIN_TAGS=2 alineado con backend |
| 122 | Verificar comentarios resueltos                      | ✅ Verificación completada |
| 123 | Hooks render order ColeccionDetalleIsland             | ✅ useMemo antes de early returns + typeof checks JSONB |
| 134 | Tags metadata IA en feedTags                         | ✅ extraerTagsMetadata() combina metadata IA con normalización/deduplicación |
| 124 | SeccionPublicar = ModalCrear + audio                 | ✅ Refactor: useCrearContenido hook + ContenidoCrear compartido. SeccionPublicar y ModalCrear usan misma UI |
| 125 | coleccionAcciones texto botones                      | ✅ Añadido <span> con texto (Guardar/Descargar/Preview) + CSS gap+padding |
| 135 | Panel lateral sugerencias (no modal)                 | ✅ FeedSamples usa panelLateralStore.abrirSugerencias en vez de sugerenciasLikeStore modal |
| 136 | todosLosTags undefined error                         | ✅ Build viejo cacheado. Variable no existe en código fuente actual |
| 137 | Guardar en colección propia no mostrarlo             | ✅ ColeccionDetalleIsland: oculta botón guardar si coleccion.usuarioId === usuario.id |
| 138 | Descargas sin crédito samples propios                | Pendiente |
| 139 | Contador samples colecciones                         | ✅ normalizarColeccion() snake→camelCase en apiColecciones.ts (total_items→totalSamples) |
| 140 | Separar descargas/favoritos en páginas propias       | Pendiente |
| 141 | TarjetaColeccion menú 3 puntos                       | ✅ Botón MoreVertical esquina superior derecha + dropdown Editar/Eliminar. Auto-contraste rgba+blur |
| 142 | Sugerencias siempre vacías                           | ✅ Double-unwrap: apiGet ya extrae json.data, tipo era RespuestaApi<{data:T}> → corregido a RespuestaApi<T>. Corregido en apiReproduciones+PanelSugerencias+sugerenciasLikeStore+PanelDetalleSample |

---

# Comentarios pendientes

85. No se estan usando los componentes, hay un boton de botones en todos lados que no usan el componente boton, por favor, inspesionar todo el codigo para encontrar todos los botones y cualqueir otra cosa que puede centralizarse con componentes, CENTRALIZAR Y NORMALIZAR ESTILOS; LOS COMPONENTES DEBEN SER LA FUENTE DEL VERDAD DE LOS ESTILOS
103. El registro debe ser más sencillo, solo el nombre de usuario, correo, y contraseña una sola vez. Y cuando me intento registrar dice "No se ha encontrado ninguna ruta que coincida con la URL y el método de la solicitud." Failed to load resource: the server responded with a status of 404 (Not Found)
104. Lo de registro debe ser un modal tambien el inicio de seccion, no paginas, y el modal debe ser con una imagen (la misma estructura de .planesLayoutEspecial)
126. Modal de configuración de samples, publicaciones, y colecciones: poder cambiar todo lo modificable, los admin pueden cambiar todo, y los usuarios sus cosas. De los samples, poder cambiar por ejemplo, la imagen, el titulo, los tags.
127. No se si lo planifique antes pero, los samples necesita un boton de 3 puntos para su configuracion, igual que los samples en la lista, la menu contextual debe ser el mismo, igualmente las colecciones tanto en su lista y su pagina individual y los post de publicaciones de comunidad tambien.
128. No se si lo planifique antes, debajo de detalleTarjetaUnica, en otra sección debe aparecer una lista de samples similares, basada en el algoritmo, claro, esto tiene que estar bien optimizado y cheado. Los comentarios tienen que aparecer ya expandidos, 
129. Por cierto, no se si la sección de comentarios tiene paginación pero si debería tener, una de infita con scroll, (optimizado para mantener un numero maximo de comentarios renderizados)
130. Se debería poder comentar imagenes y audios.
131. Planificar la automoderación de contenido con IA, cada vez que se publica un comentario, la IA tiene que decidir si es spam, si es valido, etc.
132. Mejora el sistema de moderación con IA, planificar mejor este sistema, la IA tiene que ser capaz de bloquear usuarios si tienen actividad sospechosa, spam, la toxicidad no es baneable, los usuarios son libres de discutir e insultarse, pero el spam, no es permitido, cuando un usuario hace comentarios con spam, le debe llegar una notificación de que su comentario fue eliminado automaticamente por x razón, el desnudo o contenido para adulto tambien esta prohibido, en ningun lugar, tampoco de portada para ningún audio, poca ropa si esta permitido, no estan estricto pero contenido en si totalmente pornxgrafico o actividades sexuales, o partes intimas prohibida, hay que tener cuidado porque sabemos que los albunes suelen usar imagenes explicitas que no son problemas generalmente, no queremos falsos positivos.
133. Las paginas no deberían volver a cargarse cuando cambio de pagina, o sea si la pagian ya estaba cargada, despues vuelvo abrirla, no debe recargarse, ni la lista samples ni nada, todo debe cargarse una sola vez.
138. Asegurarse de que las descargas no cobren creditos para cuando se descargue un sample propio que se subio o que se descargo antes.
140. Separar descargas y favoritos en paginas propias, tambien hay ponerles coleccionHeader, y que tengan sus tab de "mas ideas", deben funcionar como colecciones especiales, el algoritmo de más ideas debe funcionar par recomendar samples basados en las descargas y los favoritos, esto significa las tabs descargas y favoritos porque ahora son paginas individuales. La tab de "Colecciones" debería ser "mis colecciones"
143. crearContenido se ve mal como si lo estilos no cargaran, restaure los css que borraste por si acaso, pero se ve mal simplemente.
144 (primero 146). Se que el algoritmo no esta preparado para las publicaciones de comunidad, pero, las publicaciones alli deberían tambien tener un algoritmo eficiente y bueno como el de facebook o twitter, no tengo idea de como funcionan o que los hace adictivo, he visto que el reddit es bueno, asi que para parecernos mas a reddit, agreguemos el boton de dislike, pero los dislike no deben tener contador ni su contador debe ser publico.
145. Los dislike ahora deberían tambien funcionar en los samples, y un nuevo boton de "Me encanta" en la lista de sample, esta forma debe de verse, los botones de me encanta y dislike, deben aparecer como un tooltip al hacer hover sobre el boton like, en donde sea que haya un boton de like, debe ser asi, ahora que existe el boton de dislike y me encanta, el algoritmo debe tenerlos en cuenta porque es información util para pulir las recomendaciones.
146. Los creditos en el menu contextual salen asi Créditos: NaN/undefined

---

## Lecciones Aprendidas (sesión actual)

- [PG Arrays]: PostgreSQL TEXT[] espera formato `'{val1,val2}'`, no `json_encode(['val1','val2'])` que produce `'["val1","val2"]'`. Usar helper `pgArrayAPhp()` para parsear en PHP.
- [PDO+PG]: PDO PostgreSQL devuelve TEXT[] como string literal `"{}"` — siempre parsear antes de enviar al frontend.
- [Moderación]: Posts con `moderacion_estado='pendiente'` eran invisibles incluso para su autor. El filtro WHERE debe incluir 'pendiente' para el autor.
- [camelCase/snake_case]: Frontend envía `samplesAdjuntos` pero backend buscaba `samples_adjuntos`. Aceptar ambos con `??`.
- [CSS :has()]: Usar `.layoutPrincipal:has(.reproductorGlobal)` para ajustar posición de toasts/chats dinámicamente según si el reproductor está activo.
- [Tipos JS]: Comparaciones entre IDs del backend (string) y frontend (number) fallan silenciosamente. Usar `String()` en ambos lados.
- [Comentarios]: Backend endpoint genérico `/comentarios/{tipo}/{targetId}` es más flexible que endpoints por entidad. Hook `useComentarios` encapsula toda la lógica.
- [ModalCrear]: Tenía un TO-DO para posts sin audio que solo hacía `setTimeout(500)` sin llamar al backend.
- [Auth]: No existía AuthController.php — causaba 404 en /auth/registro y /auth/login. Creado con wp_authenticate + wp_create_user + auto-sync PG.
- [Auth Modal]: ConAutenticacion ahora abre modal auth en vez de navegar a /auth/login. LandingPublica y PlanesIsland usan authModalStore.abrir() en vez de navegar().
- [Tags Upload]: Frontend MIN_TAGS_AUDIO=2 (C92) pero backend SamplesController tenía count($tags)<5. Siempre alinear validaciones frontend/backend al cambiar límites.
- [Hooks React]: NUNCA poner useMemo/useCallback/useState después de un early return condicional. Todos los hooks deben ejecutarse antes de cualquier return.
- [Metadata JSONB]: Los campos del JSONB pueden ser string, number, array u object. Siempre usar typeof checks antes de .trim() u operaciones de string.
- [Panel Lateral]: WaveformPlayer no acepta rutaAudio/rutaWaveform — usa `picos: number[]|null`. Props del componente siempre verificar antes de usar.
- [Panel Lateral]: MetadataSample tiene `instrumentos` (plural, string[]|string) no `instrumento`. `genero` es string[]|string. Siempre hacer Array.isArray check.
- [Panel Lateral]: Store Zustand tiene `habilitar`/`deshabilitar` pero islands usan alias `habilitarPanel`/`deshabilitarPanel` via destructuring. Mantener consistencia.
- [Hooks Compartidos]: usePublicar extrae lógica publicación de ModalPublicar — ambos componentes (SeccionPublicar y ModalPublicar) usan el mismo hook.
- [Tags C134]: FeedSamples usaba `s.tags` (tags del usuario) en vez de metadata IA. `extraerTagsMetadata()` combina metadata.tags/genero/instrumentos/emocion/artista_vibes con normalización.
- [Tags Store C115]: Tags en local useState sin conexión a búsqueda global. Migrar a store Zustand con sync bidireccional (parsearBusquedaATags ↔ generarBusquedaDesdeTags).
- [SelectFiltro C116]: No usar select HTML nativo — crear dropdown propio con estilo MenuContextual para consistencia visual. Cerrar con click outside + Escape.
- [CSS feedTags C116]: feedTagExpandirBtn (+N) y compresión de tags producían UI fea. Reemplazado por fila de SelectFiltro dropdowns + tags sueltos draggable sin límite visual.
- [C124 Refactor]: ModalCrear tenía 459 líneas con lógica inline. Extraído a useCrearContenido (hook) + ContenidoCrear (UI compartida). Ambos ModalCrear y SeccionPublicar ahora usan la misma base.
- [C135 Sugerencias]: FeedSamples usaba sugerenciasLikeStore (modal) en vez de panelLateralStore.abrirSugerencias (panel lateral). PanelSugerencias.tsx y PanelLateral.tsx ya existían, solo faltaba conectar el trigger.
- [useArchivosDragDrop]: Spread `...archivos` en return del hook colisiona con `resetear` propio. Listar props explícitamente para evitar override silencioso.
- [C142 apiCliente]: `apiGet` ya hace `json.data ?? json` → si backend envía `{data: [...]}`, `resp.data` ya es el array. Tipear como `RespuestaApi<T[]>`, NO `RespuestaApi<{data: T[]}>`. Error: double-unwrap silencioso donde `resp.data?.data` era siempre `undefined`.