# Kamples — Roadmap Integral de Producto

> **Versión:** 2.0  
> **Última actualización:** 15/02/2026 (iteración v2.4)  
> **Stack base:** Glory Framework (WordPress + React Islands + TypeScript)  
> **Competencia directa:** Splice

---

## Visión del Producto

Kamples es una plataforma de samples de audio con alma de red social, impulsada por un algoritmo de descubrimiento de nivel superior. Es un ecosistema donde productores descubren, comparten, colaboran y monetizan su contenido sonoro. Ultrarrápida, minimalista y adictiva.

**Diferenciadores clave frente a Splice:**

- Algoritmo de recomendación multi-señal (6 factores) vs. búsqueda básica
- Red social nativa (feed, follows, mensajes, publicaciones)
- Marketplace híbrido (suscripción + venta directa + revenue share)
- Análisis de audio con IA (Gemini Flash) para metadatos automáticos
- App desktop con integración DAW (drag-to-DAW, piano one-shot)
- Waveforms interactivos y reproductor avanzado

---

## Decisiones Arquitectónicas

- **PostgreSQL + pgvector** local (127.0.0.1:5432/kamples) — JSONB para metadata, embeddings para similitud
- **Almacenamiento WordPress** — Usar WP uploads + attachment API para audio. Pipeline: original(.wav) → optimizado(.mp3) → waveform(.json) → preview(.mp3). Seguridad via htaccess/permisos. Preparado para migrar a VPS luego.
- **WebSocket local** — Servidor WebSocket Node/Bun local para desarrollo. Canales: mensajes, notificaciones, sync, feed. Preparar para activar en VPS después.
- **IA multi-modelo** — Gemini Flash 3.0 → Gemini Pro 2.5 → Gemini Flash 2.5 → Gemini Flash 2.0 (fallback por cuota). Groq para metadata de imágenes.
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
**Fase 2:** Upload real (FormData+pipeline+IA), WaveformPlayer, ReproductorGlobal/Island, GeneradorIdCorto, AnalizadorAudio (BPM/key), ServicioIA (Gemini+Groq fallback), PipelineAudio (FFmpeg), ServicioImagenIA (Groq visión), tags normalization, deduplicación audio.
**Fase 3 (parcial):** DescubrirIsland, endpoints feed/notificaciones/mensajes/dashboard.
**Fase 4:** BotonFollow/Like, ModalPublicar, InicioIsland (feed+tags±+ordenamientos), ModalFiltros, infinite scroll+virtualización.
**Fase 5:** LibreriaIsland, ColeccionesController CRUD+sugerencias+relevantes, ModalSeleccionColeccion (ranking relevancia).
**Fase 6:** DashboardCreadorIsland, SPA navigation (prefix matching), SampleDetalleIsland (hero+waveform+like API), ColeccionDetalleIsland (tabs Samples/Más Ideas), ComunidadIsland, ChatFlotante, ModalConfiguracion (portada editable).
**Fase 7 (parcial):** MensajesIsland, ChatIsland, NotificacionesIsland, Stripe Billing (PagosController checkout/portal/webhook), PlanesIsland funcional.

**Arquitectura:** KamplesController 1713→60 lín (12 sub-controladores + 2 helpers + 3 servicios + 1 config). FeedSamples centralizado (~470 lín). ModalSugerenciasLike post-like. KamplesLogger. Pipeline async (shutdown hook). 5 migraciones SQL ejecutadas.
**UI/UX (C1-C63):** TopBar (búsqueda, crear, notif, mensajes, plan badge), Sidebar, tags ± agrupados, waveform real, middle-click, avatar normalización, colecciones grid, SPA routing, menú contextual, infinite scroll+virtualización, portada editable, eliminar samples/colecciones.
**IA/Logs:** JSON repair 5 estrategias (control chars + Groq), imagen metadata Groq (Llama 4), audio IA Gemini multi-modelo, pipeline async con KamplesLogger.

### Registros de cambios (R1–R5 compactos)

**R1:** wsService fix, ShowcaseIsland split, useArchivosDragDrop, BienvenidaIsland onboarding, fix doble slash.
**R2:** SOLID refactor — 12 controladores, 2 helpers, 3 servicios, 1 config. Migraciones v003-v004.
**R3:** FeedSamples centralizado, InicioIsland 550→180 lín, ColeccionDetalleIsland tabs, ModalSugerenciasLike, useHistorialIds, sugerenciasLikeStore.
**R4:** Delete samples/colecciones (admin+dueño), plan badge TopBar, fix CSS import FeedSamples.
**R5:** JSON repair 5 estrategias, ServicioImagenIA (Groq visión), Stripe Checkout/Portal/Webhook, PlanesIsland funcional, apiPagos checkout+portal.
**R6:** Límites plan (DescargasController→StripeService DRY, transferencia GB), moderación IA 3 capas (ServicioModeracionIA), tags badge (<span>), AuthMiddleware stubs, migraciones v006-v007, roadmap compactado.
**R7:** Stripe Connect completo (ConnectController 4 endpoints + DashboardCreadorIsland sección Connect + revenue share descargas), samples premium (toggle ModalCrear + badge SampleDetalle + precio + bloqueo free).

---

## Pendientes por Fase

### FASE 0 — Infraestructura y Base

> Prioridad: ALTA — desbloquea algoritmo, uploads, y IA

- [x] **0.1a** Conexión PHP → PostgreSQL — PDO singleton, health endpoint, schema 14 tablas
- [ ] **0.1b** Instalar pgvector (EN PROGRESO — VS Build Tools ya instalado, falta compilar)
    - Migración `v002_pgvector_setup.sql` lista, `VerificarPgvector.php` listo
    - [x] Prerrequisito cumplido: VS Build Tools 2026 v18 (cl.exe 19.50, CMake 4.1.2)
    - **Siguiente paso:** Compilar pgvector con CMake + MSVC contra PostgreSQL local
    - **Impacto:** Sin pgvector el algoritmo de similitud no funciona, pero todo lo demás sí
- [x] **0.2** Almacenamiento audio en WP — upload+MIME validation+ID corto+slug
    - TO-DO: htaccess deny direct access, servir via PHP con validación de permisos
- [x] **0.3** Pipeline audio — FFmpeg cross-platform (.env>PATH>winget), BPM/key+IA+waveform+MP3+preview+renombrado
    - TO-DO: mover a wp_schedule_single_event() cuando el volumen crezca
- [x] **0.4** Colors/ dinámicas — endpoint GET, transient cache 24h
    - TO-DO: WebP conversion, lazy loading, srcset

### FASE 1 — Auth y Perfil

- [x] **1.1** Fix PerfilIsland — guard authCargando, fix stale closure, botón editar→modal
- [x] **1.2** ModalConfiguracion — avatar, nombre, bio, notificaciones, PUT /me
    - TO-DO: subida real de avatar con FormData (endpoint no soporta multipart aún)
- [x] **1.3** Auto-creación usuarios_ext — GET /me sincroniza WP→Postgres
- [ ] **1.4** Google OAuth (cuando las keys estén listas)

### FASE 2 — Pipeline de Subida de Audio + IA

- [x] **2.1** Upload real — ModalCrear→FormData→endpoint, waveform preview, tags #
- [x] **2.2** Análisis audio — técnico (AnalizadorAudio: BPM onsets+key Goertzel) + creativo (ServicioIA: Gemini multi-modelo bilingüe)
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

- [ ] **3.1** pgvector: tabla de embeddings + función de similitud
    - Índice HNSW para búsqueda eficiente
    - Función `buscar_similares(sample_id, limite)` usando cosine distance
- [ ] **3.2** Señal de comportamiento
    - Rastrear: plays, likes, descargas, tiempo de escucha por usuario
    - Guardar en tabla `interacciones_usuario` en Postgres
    - Peso en algoritmo: 0.25
- [ ] **3.3** Señal de tendencias (time-windowed)
    - Engagement velocity: likes/plays en últimas 24h, 7d, 30d
    - Peso: 0.15
- [ ] **3.4** Señal de novedad
    - Boost logarítmico por fecha de publicación
    - Peso: 0.10
- [ ] **3.5** Función SQL scoring combinado
    - Combinar las 6 señales con pesos configurables
    - Target: < 100ms para 100k samples
- [ ] **3.6** Señal de grafo social
    - Samples de usuarios seguidos, likes de usuarios seguidos
    - Peso: 0.10
- [ ] **3.7** Cache de feeds
    - Redis o transient WP como fallback
    - Invalidar al publicar/interactuar

### FASE 4 — Filtros y Ordenamiento (InicioIsland)

- [x] **4.1** ModalFiltros rediseñado — toggles con iconos
- [x] **4.2** InicioIsland sin tabs — ordenamientos dropdown, infinite scroll+virtualización
- [x] **4.3** Filtros conectados a store — filtrosStore.ts + useFiltros.ts
    - TO-DO: enviar filtros toggle al backend cuando endpoints los soporten

### FASE 5 — Chat Flotante tipo Messenger

- [x] **5.1** ChatFlotante — fixed bottom-right, max 3 chats, minimizable, burbujas
- [ ] **5.2** Soporte multimedia en chat (imágenes, audio, samples compartidos)
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
- [ ] **7.3** Stripe Connect (onboarding creadores, revenue share 70/30, 80/20)
- [ ] **7.4** Samples premium (compra individual + bloqueo sin plan)
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
2. **IA:** Google Gemini API key lista en .env. Cadena de fallback por cuota: Flash 3.0 → Pro 2.5 → Flash 2.5 → Flash 2.0. Groq para imágenes.
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
| 3   | Groq API + fallback multi-modelo                    | ✅ Gemini (audio) → Groq (texto). Cadena: Flash 3→Pro 2.5→Flash 2.5→Flash 2.0 / gpt-oss-120b→llama-70b→gpt-oss-20b   |
| 4   | FFmpeg instalado                                    | ✅ v8.0.1 via winget. Fix: PHP/Apache no hereda PATH → `FFMPEG_PATH` en .env                                         |
| 5   | Prompt con descripción+tags del usuario, mín 5 tags | ✅ `construirPrompt()` con contexto completo. Validación 5 tags frontend+backend                                     |
| 6   | Not null violation email usuarios_ext               | ✅ INSERT incluye email desde `$wpUser['email']`                                                                     |
| 7   | Unexpected token '<' al subir sample                | ✅ `require_once file.php` + prefijo `\` en funciones WP                                                             |
| 8   | Refactorizar KamplesController (SOLID)              | ✅ 1713→60 lín. 12 sub-controladores, 2 helpers, 3 servicios, algoritmoPesos.php                                     |
| 9   | Groq no procesa audio/imágenes                      | ✅ Correcto: Gemini=audio, Groq=solo texto. TO-DO: Llama 4 Maverick para imágenes                                    |
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

---

# Comentarios nuevos 

23. Cuando se esta publicando un sample, en "crearCondiciones" Debe estar disponible la opcion para poner precio al sample, alli mismo se coloca el precio si se activa, planificar todo lo que esto implica para poder vender samples.
24. Publique un sample y no se puede reproducir
TarjetaSample.tsx:107  Not allowed to load local resource: file:///C:/Users/Owner/OneDrive/Documentos/WP/app/public/wp-content/uploads/kamples/1/2026/02/QChGFiA_preview.mp3
(index):1  Not allowed to load local resource: file:///C:/Users/Owner/OneDrive/Documentos/WP/app/public/wp-content/uploads/kamples/1/2026/02/niXnYC5_preview.mp3
25. tambien vi que cuando publique un sample se publico asi la url http://glory.local/sample/looperman-l-2796720-0319840-ascend-bladee-type-loop-niXnYC5 cuando debería ser el nombre corto que genera la ia (Tambien debe ser el nombre que aparece en la tarjeta), por cierto, tampoco carga el sample cuando voy a su pagina individual
26. Volvio a fallar la foto perfil, habia guardado una foto y otra vez no aparece.
27. En "Inspector de Sample" no aparece el json que genera la IA ni tampoco veo que realmente se este usando esa informacion porque en "JSON Crudo" no veo que se este usando la data que genera la IA si es que esa es toda la metadata del sample