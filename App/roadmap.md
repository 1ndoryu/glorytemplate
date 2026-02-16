# Kamples — Roadmap Integral de Producto

> **Versión:** 2.0  
> **Última actualización:** 16/02/2026 (iteración v2.5)  
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

### Registros de cambios (R1–R8 compactos)

**R1:** wsService fix, ShowcaseIsland split, useArchivosDragDrop, BienvenidaIsland onboarding, fix doble slash.
**R2:** SOLID refactor — 12 controladores, 2 helpers, 3 servicios, 1 config. Migraciones v003-v004.
**R3:** FeedSamples centralizado, InicioIsland 550→180 lín, ColeccionDetalleIsland tabs, ModalSugerenciasLike, useHistorialIds, sugerenciasLikeStore.
**R4:** Delete samples/colecciones (admin+dueño), plan badge TopBar, fix CSS import FeedSamples.
**R5:** JSON repair 5 estrategias, ServicioImagenIA (Groq visión), Stripe Checkout/Portal/Webhook, PlanesIsland funcional, apiPagos checkout+portal.
**R6:** Límites plan (DescargasController→StripeService DRY, transferencia GB), moderación IA 3 capas (ServicioModeracionIA), tags badge (<span>), AuthMiddleware stubs, migraciones v006-v007, roadmap compactado.
**R7:** Stripe Connect completo (ConnectController 4 endpoints + DashboardCreadorIsland sección Connect + revenue share descargas), samples premium (toggle ModalCrear + badge SampleDetalle + precio + bloqueo free).
**R8:** Chat multimedia full-stack (5.2, BurbujaMensaje+backend upload+FormData), MotorRecomendacion v1 (3.2-3.7, 6 señales + cache transient), bug fixes C23-C33, BotonDevTools mode switcher (C29), BotonExperimentos admin test content (C31), perfil camelCase fix (C30), JSONB cast fix (C28), PerfilIsland guard (C29), DashboardCreadorIsland BotonBase prop fix, npm type-check 29→0 errores (C32), migración v008.
**R9:** pgvector compilado (master branch, PG18 compatible) e instalado (vector.dll + extension + HNSW). GeneradorEmbeddings.php (128d: BPM+key+escala+tipo+duración+tags hasheados). MotorRecomendacion v3 (6ta señal similitud coseno integrada, samplesSimilares con fallback). EmbeddingsController (batch/regenerar/estado). PipelineAudio genera embedding automático. Migración v009 (columna embedding + funciones SQL buscar_similares + buscar_por_vector). Avatar upload fix (C34: POST /me/avatar + ModalConfiguracion). Admin role detection fix (C35: WP roles → PG sync). BotonExperimentos ahora incluye embeddings batch.
**R10:** PlanificadorAlgoritmo (C45): sistema dual rápido/preciso con triggers por interacciones + recálculos temporales. Configuración centralizada en algoritmoPesos.php['frecuencia']. Tabla algoritmo_estado (v010). WP Cron cada 5min. Integrado en SocialController (like/follow), ReproduccionesController, DescargasController, PublicacionesController (comentario). Endpoints admin: GET /admin/algoritmo/estado, POST /admin/algoritmo/recalcular, POST /admin/algoritmo/procesar-temporales. Bug fixes C37-C46: samples en perfil, experimentos notificaciones, sample detalle 404, apiCliente HTML detection, DevTools posición, hooks order React, colecciones/publicas→explorar, tabs duplicadas + race condition colecciones.
**R11:** Gemini Flash 3.0 como primer modelo IA (C47). Detección HTML ampliada en apiCliente con error descriptivo+status (C47). Logging completo en MotorRecomendacion (señales, cache, perfil, resultados) + fix namespace PlanificadorAlgoritmo (C48). Parámetro `creador` añadido a argsListar() — WP descartaba el filtro (C49). Logging+fix parsing en ExperimentosController/BotonExperimentos (C50). Avatar.tsx defensivo contra nombre undefined — prop opcional+fallback (C51). InicioIsland filtro "Inteligente" ahora usa obtenerFeed('descubrir') con MotorRecomendacion en vez de listarSamples (C52).
**R12:** Sistema de logs reorganizado por canales (C53): `kamples-ia-*.log` (IA+pipeline+upload), `kamples-algoritmo-*.log` (recomendación+planificador), `kamples-*.log` (general). LogIA/LogAlgoritmo wrappers para alias imports. error_log eliminado de PipelineAudio (7) y PostgresService (5) — migrados a KamplesLogger. Auto-limpieza de logs >7 días. GROQ_API key: validación de formato `gsk_*` con warning (C54). Sample detalle 404: `sanitize_callback` cambiado de `sanitize_title` a `sanitize_text_field`, SQL con `LOWER()` para comparación case-insensitive, regex ampliado a `[a-zA-Z0-9_-]+` (C55). Pipeline shutdown: flush forzado para Apache/mod_php (`ignore_user_abort`+`ob_end_flush`+`flush`+`Connection: close`), curl timeout reducido 60→30s, timeout reparación JSON 15s (C57).
**R13:** Ajuste fallback IA Gemini (C58): removidos modelos 2.5 del pipeline por incompatibilidad/cupo en free tier. Cadena actual: `gemini-3-flash-preview` → `gemini-2.0-flash` → `gemini-1.5-flash`. Manejo de HTTP 429 mejorado con extracción de `retryAfter`, límite de espera corta (máx 3s), máximo 1 reintento y corte temprano de cadena Gemini para pasar a Groq sin bloquear el pipeline.
**R14:** Migración completa a Groq para audio (C59): eliminación de Gemini del flujo de `ServicioIA`. Nuevo pipeline: STT con `whisper-large-v3` → `whisper-large-v3-turbo` (endpoint `/openai/v1/audio/transcriptions`) y generación de metadata JSON con modelos de chat Groq. Reparación JSON actualizada sin Llama: `moonshotai/kimi-k2-instruct-0905` + `qwen/qwen3-32b` (+ `openai/gpt-oss-20b` fallback).
**R15:** Like persistente (C60): `sqlSelectSamples(?int $userId)` con subquery `EXISTS(likes)` — liked real en listar/obtener/feed/motor. Samples en perfil (C58): `LOWER()` en filtro username + `publicado_at=NOW()` en INSERT para que samples nuevos aparezcan inmediatamente. Middle-click perfil (C61): `href` añadido a "Ver perfil" en TopBar (MenuContextual renderiza `<a>`). Inteligentes vacío (C62): `feedNuevoUsuario` ya no cachea arrays vacíos + liked subquery en CTE del motor.

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

## Comentarios del usuario (resueltos)

| #   | Solicitud                                           | Estado                                                                                                               |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | FFmpeg obligatorio Win+Linux                        | ✅ `buscarBinario()` cross-platform. Prioriza .env > PATH > rutas comunes > winget glob                              |
| 2   | Prompt IA bilingüe, sin BPM/key                     | ✅ ServicioIA prompt creativo bilingüe. BPM/key vía AnalizadorAudio (Goertzel+autocorrelación)                       |
| 3   | Groq API + fallback multi-modelo                    | ✅ Flujo 100% Groq: Whisper para audio (`whisper-large-v3`→`whisper-large-v3-turbo`) + LLM (`gpt-oss-120b`→`qwen3-32b`→`gpt-oss-20b`) |
| 4   | FFmpeg instalado                                    | ✅ v8.0.1 via winget. Fix: PHP/Apache no hereda PATH → `FFMPEG_PATH` en .env                                         |
| 5   | Prompt con descripción+tags del usuario, mín 5 tags | ✅ `construirPrompt()` con contexto completo. Validación 5 tags frontend+backend                                     |
| 6   | Not null violation email usuarios_ext               | ✅ INSERT incluye email desde `$wpUser['email']`                                                                     |
| 7   | Unexpected token '<' al subir sample                | ✅ `require_once file.php` + prefijo `\` en funciones WP                                                             |
| 8   | Refactorizar KamplesController (SOLID)              | ✅ 1713→60 lín. 12 sub-controladores, 2 helpers, 3 servicios, algoritmoPesos.php                                     |
| 9   | Groq no procesa audio/imágenes                      | ✅ Actualizado: Groq Speech-to-Text (Whisper) procesa audio y Groq visión procesa imágenes.                            |
| 10  | Moderación IA con Groq                              | ✅ ServicioModeracionIA 3 capas: Guard 4 + Scout visión + gpt-oss contextual. Migración v007. Feed filtra rechazados |
| 11  | tags?.forEach is not a function                     | ✅ `pgArrayToPhp()` convierte string PG a array PHP                                                                  |
| 12  | Quitar todos los mocks                              | ✅ Eliminados mocks de 7 archivos API + 2 dropdowns + ComunidadIsland + mockSamples.ts                               |
| 13  | nombreVisible/likes undefined                       | ✅ `normalizarSample()` reescrita: snake→camelCase, sub-objeto creador, cast tipos. ModalInspectorSample creado      |
| 14  | Colecciones tipo Pinterest + algoritmo              | ✅ IMPLEMENTADO: Fases A-D completas (ver sección "Plan: Colecciones + Algoritmo")                                   |
| 15  | Compactar roadmap                                   | ✅ Hecho                                                                                                             |
| 16  | Badge plan en TopBar                                | ✅ Free/Pro/Premium con estilos dinámicos + nav a /planes/                                                           |
| 17  | URL del proyecto: `http://glory.local/`             | ANOTADO (ver Notas)                                                                                                  |
| 18  | Borrar mis samples desde menú contextual            | ✅ DELETE /samples/{id} condicional (dueño o admin)                                                                  |
| 19  | Admin borra cualquier sample/colección              | ✅ `UsuarioHelper::esAdmin()` + permisos en SamplesController y ColeccionesController                                |
| 20  | Tags sin estilos                                    | ✅ Faltaba import de feedSamples.css                                                                                 |
| 21  | JSON roto de IA al subir                            | ✅ 5 estrategias de extracción JSON + reparación con Groq. Fix: control chars                                        |
| 22  | feedTagItem eran badge, no botón                    | ✅ `<span role="button">` con accesibilidad + CSS reforzado                                                          |
| 23  | Precio en crearCondiciones                           | ✅ Toggle precio + campo en ModalCrear, samples premium con badge + bloqueo                                          |
| 24  | Sample no se reproduce (file:// URL)                 | ✅ Fix: URLs relativas en vez de absolutas del filesystem                                                            |
| 25  | URL sample usa nombre original                       | ✅ Naming IA: `kamples_{tipo}_{genero}_{bpm}_{key}_{idCorto}.ext`                                                   |
| 26  | Foto perfil no aparece                               | ✅ Fix normalizarUsuario() snake→camelCase (parte de C30)                                                            |
| 27  | Inspector sin JSON IA                                | ✅ ModalInspectorSample sección JSON crudo + metadata IA                                                             |
| 28  | JSON crudo IA no se guardaba                         | ✅ PipelineAudio ::jsonb cast para PDO native prepares + sección JSON IA en inspector                                |
| 29  | Botón cambio de modo + PerfilIsland split crash      | ✅ BotonDevTools (devToolsStore + useUsuarioEfectivo) + guard `(rutaActual ?? '')`                                    |
| 30  | Datos perfil no persisten al recargar                | ✅ normalizarUsuario() en PerfilController (GET/PUT /me), PUT retorna perfil completo                                |
| 31  | Botón experimentos admin                             | ✅ ExperimentosController (usuario test WP+PG, notif, mensaje real), BotonExperimentos en TopBar                     |
| 32  | npm run type-check errores                           | ✅ 29→0 errores: imports no usados, props incorrectas (deshabilitado→disabled, fantasma→ghost)                       |
| 33  | Re-ejecutar migración v008                           | ✅ Ejecutada contra PostgreSQL 18 (ALTER TABLE ×3 + CREATE INDEX)                                                    |
| 34  | Foto de perfil no se guarda                          | ✅ POST /me/avatar (FormData, MIME validation), ModalConfiguracion guarda File→upload→PUT                            |
| 35  | Botón experimento no visible                         | ✅ GET /me ahora detecta rol WP administrator y fuerza rol='admin' en PG                                             |
| 36  | Compilar pgvector + construir algoritmo              | ✅ pgvector master compilado PG18, embedding 128d, MotorRecomendacion v3, buscar_similares SQL                       |
| 37  | Samples no aparecen en perfil                        | ✅ Filtro `creador` en SamplesController, PerfilIsland envía `creador: usuario.username`                              |
| 38  | Experimentos no generan notificaciones               | ✅ Fix `usuario_id`→`creador_id` en samples query, `::jsonb` cast notificaciones INSERT                              |
| 39  | Sample detalle dice "no existe"                      | ✅ Cambiar filtro `estado='activo'` por `NOT IN ('eliminado')` en obtener()                                          |
| 40  | Unexpected token '<' en pipeline IA                   | ✅ apiCliente.ts: detectar HTML antes de JSON.parse, devolver error legible                                          |
| 41  | Botón DevTools posición molesta                       | ✅ CSS: `top:12px` → `bottom:50%; transform:translateY(50%)`, panel desde nueva posición                            |
| 42  | Error hooks React al cambiar foto perfil              | ✅ Early return antes de useCallback en BotonExperimentos/BotonDevTools → movido después de hooks                    |
| 43  | 404 colecciones/publicas                              | ✅ Frontend llamaba `/publicas`, backend tiene `/explorar`. Corregido apiColecciones.ts                              |
| 44  | Tabs duplicadas en colecciones                        | ✅ Eliminadas tabs inline de ColeccionDetalleIsland, usar `activa` de tabsTopBarStore                                |
| 45  | Frecuencia recálculo algoritmo                        | ✅ PlanificadorAlgoritmo dual (rápido/preciso), triggers + temporales, v010, cron 5min                               |
| 46  | Race condition tabs colecciones                       | ✅ FeedSamples: `key` prop + `requestIdRef` guard stale requests, CSS tabs removido                                  |
| 47  | HTML en vez de JSON + Gemini Flash 3.0                | ✅ Detección HTML ampliada (`<br`, `<b>`), error con status+URL. Gemini Flash 3.0 (`gemini-2.5-flash-preview-05-20`) como primer modelo |
| 48  | Logs del algoritmo                                    | ✅ MotorRecomendacion con KamplesLogger (señales, cache, perfil, resultados). Fix namespace PlanificadorAlgoritmo    |
| 49  | Samples no aparecen en perfil (persistente)           | ✅ Parámetro `creador` faltaba en `argsListar()` de SamplesController — WP REST descartaba el filtro                 |
| 50  | Botón experimentos no funciona                        | ✅ Logging en ExperimentosController + console.log respuesta + fix parsing doble-wrap en BotonExperimentos           |
| 51  | Avatar.tsx crash split undefined                      | ✅ `nombre` ahora es prop opcional con default ''. `obtenerIniciales` defensivo. DropdownMensajes usa optional chaining |
| 52  | Filtro inteligente sin samples                        | ✅ InicioIsland: ordenamiento 'inteligente' ahora usa `obtenerFeed('descubrir')` (MotorRecomendacion) en vez de `listarSamples()` |
| 53  | Logs desordenados (debug.log + kamples.log)           | ✅ 3 canales: `kamples-ia-*.log`, `kamples-algoritmo-*.log`, `kamples-*.log`. Eliminados 12 error_log() de Pipeline+Postgres. Auto-limpieza 7 días |
| 54  | GROQ_API Invalid API Key                              | ✅ Validación formato `gsk_*` con warning en logs. La key del .env no es válida — obtener nueva en console.groq.com/keys |
| 55  | Sample detalle "No se encontró"                       | ✅ `sanitize_title` lowercaseaba el slug (idCorto tiene mayúsculas). Fix: `sanitize_text_field` + SQL `LOWER()` |
| 56  | Gemini 3.0 Flash model name                           | ✅ Corregido por usuario: `gemini-3.0-flash` (con punto) |
| 57  | Upload 500 por timeout pipeline                       | ✅ Flush forzado para mod_php (`ignore_user_abort`+`ob_end_flush`), curl timeout 60→30s, set_time_limit 600s |
| 58  | Samples no aparecen en perfil (tercera vez)           | ✅ `LOWER()` en filtro username, `publicado_at=NOW()` en INSERT (samples procesando ya no van al final)              |
| 59  | Sample publicado no sale en feed                      | ✅ Parte del fix C58 — `publicado_at` se establece desde el INSERT inicial                                           |
| 60  | Like no persiste al recargar                          | ✅ `sqlSelectSamples(?int $userId)` con subquery `EXISTS(likes)`. Aplicado en listar/obtener/feed/motor              |
| 61  | Middle-click perfil no abre nueva pestaña             | ✅ `href` añadido a item "Ver perfil" en TopBar. MenuContextual ya renderiza `<a>` con href                         |
| 62  | Inteligentes "No se encontraron samples"              | ✅ `feedNuevoUsuario` ya no cachea resultados vacíos. Liked subquery en CTE del motor                                |

---

# Comentarios nuevos (Cuando los comentarios se resuelvan, mover a "## Comentarios del usuario (resueltos) compactados")

(Sin comentarios pendientes)