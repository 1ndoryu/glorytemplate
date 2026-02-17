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

### Registros de cambios (R1–R8 compactos)

**R1:** wsService fix, ShowcaseIsland split, useArchivosDragDrop, BienvenidaIsland onboarding, fix doble slash.
**R2:** SOLID refactor — 12 controladores, 2 helpers, 3 servicios, 1 config. Migraciones v003-v004.
**R3:** FeedSamples centralizado, InicioIsland 550→180 lín, ColeccionDetalleIsland tabs, ModalSugerenciasLike, useHistorialIds, sugerenciasLikeStore.
**R4:** Delete samples/colecciones (admin+dueño), plan badge TopBar, fix CSS import FeedSamples.
**R5:** JSON repair 5 estrategias, ServicioImagenIA (Groq visión), Stripe Checkout/Portal/Webhook, PlanesIsland funcional, apiPagos checkout+portal.
**R6:** Límites plan (DescargasController→StripeService DRY, transferencia GB), moderación IA 3 capas (ServicioModeracionIA), tags badge (<span>), AuthMiddleware stubs, migraciones v006-v007, roadmap compactado.
**R7:** Stripe Connect completo (ConnectController 4 endpoints + DashboardCreadorIsland sección Connect + revenue share descargas), samples premium (toggle ModalCrear + badge SampleDetalle + precio + bloqueo free).
**R8:** Chat multimedia full-stack (5.2, BurbujaMensaje+backend upload+FormData), MotorRecomendacion v1 (3.2-3.7, 6 señales + cache transient), bug fixes C23-C33, BotonDevTools mode switcher (C29), BotonExperimentos admin test content (C31), perfil camelCase fix (C30), JSONB cast fix (C28), PerfilIsland guard (C29), DashboardCreadorIsland BotonBase prop fix, npm type-check 29→0 errores (C32), migración v008.
**R9:** pgvector compilado (master branch, PG18 compatible) e instalado (vector.dll + extension + HNSW). GeneradorEmbeddings.php (128d: BPM+key+escala+tipo+duración+tags hasheados). MotorRecomendacion v3 (6ta señal similitud coseno integrada, samplesSimilares con fallback). EmbeddingsController (batch/regenerar/estado). PipelineAudio genera embedding automático. Migración v009 (columna embedding + funciones SQL buscar*similares + buscar_por_vector). Avatar upload fix (C34: POST /me/avatar + ModalConfiguracion). Admin role detection fix (C35: WP roles → PG sync). BotonExperimentos ahora incluye embeddings batch.
**R10:** PlanificadorAlgoritmo (C45): sistema dual rápido/preciso con triggers por interacciones + recálculos temporales. Configuración centralizada en algoritmoPesos.php['frecuencia']. Tabla algoritmo_estado (v010). WP Cron cada 5min. Integrado en SocialController (like/follow), ReproduccionesController, DescargasController, PublicacionesController (comentario). Endpoints admin: GET /admin/algoritmo/estado, POST /admin/algoritmo/recalcular, POST /admin/algoritmo/procesar-temporales. Bug fixes C37-C46: samples en perfil, experimentos notificaciones, sample detalle 404, apiCliente HTML detection, DevTools posición, hooks order React, colecciones/publicas→explorar, tabs duplicadas + race condition colecciones.
**R11:** Gemini Flash 3.0 como primer modelo IA (C47). Detección HTML ampliada en apiCliente con error descriptivo+status (C47). Logging completo en MotorRecomendacion (señales, cache, perfil, resultados) + fix namespace PlanificadorAlgoritmo (C48). Parámetro `creador` añadido a argsListar() — WP descartaba el filtro (C49). Logging+fix parsing en ExperimentosController/BotonExperimentos (C50). Avatar.tsx defensivo contra nombre undefined — prop opcional+fallback (C51). InicioIsland filtro "Inteligente" ahora usa obtenerFeed('descubrir') con MotorRecomendacion en vez de listarSamples (C52).
**R12:** Sistema de logs reorganizado por canales (C53): `kamples-ia-*.log`(IA+pipeline+upload),`kamples-algoritmo-_.log`(recomendación+planificador),`kamples-_.log`(general). LogIA/LogAlgoritmo wrappers para alias imports. error_log eliminado de PipelineAudio (7) y PostgresService (5) — migrados a KamplesLogger. Auto-limpieza de logs >7 días. GROQ_API key: validación de formato`gsk*\*`con warning (C54). Sample detalle 404:`sanitize*callback`cambiado de`sanitize_title`a`sanitize_text_field`, SQL con `LOWER()`para comparación case-insensitive, regex ampliado a`[a-zA-Z0-9*-]+` (C55). Pipeline shutdown: flush forzado para Apache/mod_php (`ignore_user_abort`+`ob_end_flush`+`flush`+`Connection: close`), curl timeout reducido 60→30s, timeout reparación JSON 15s (C57).
**R13:** Ajuste fallback IA Gemini (C58): removidos modelos 2.5 del pipeline por incompatibilidad/cupo en free tier. Cadena actual: `gemini-3-flash-preview`→`gemini-2.0-flash`→`gemini-1.5-flash`. Manejo de HTTP 429 mejorado con extracción de `retryAfter`, límite de espera corta (máx 3s), máximo 1 reintento y corte temprano de cadena Gemini para pasar a Groq sin bloquear el pipeline.
**R14:** Migración completa a Groq para audio (C59): eliminación de Gemini del flujo de `ServicioIA`. Nuevo pipeline: STT con `whisper-large-v3`→`whisper-large-v3-turbo`(endpoint`/openai/v1/audio/transcriptions`) y generación de metadata JSON con modelos de chat Groq. Reparación JSON actualizada sin Llama: `moonshotai/kimi-k2-instruct-0905`+`qwen/qwen3-32b`(+`openai/gpt-oss-20b`fallback).
**R28:** Publicar inline C89 (SeccionPublicar+usePublicar hook compartido con ModalPublicar, integrado en ComunidadIsland+PerfilIsland). feedTags colecciones C114, mostrarTags activado en ColeccionDetalleIsland. Panel lateral C86+C95+C111 (panelLateralStore Zustand, PanelDetalleSample+PanelSugerencias+PanelLateral, flex wrapper en LayoutPrincipal, TarjetaSample.onClickTitulo, habilitado en Inicio/Colecciones/Librería). Type-check 0 errores.`sqlSelectSamples(?int $userId)`con subquery`EXISTS(likes)`— liked real en listar/obtener/feed/motor. Samples en perfil (C58):`LOWER()`en filtro username +`publicado_at=NOW()`en INSERT para que samples nuevos aparezcan inmediatamente. Middle-click perfil (C61):`href`añadido a "Ver perfil" en TopBar (MenuContextual renderiza`<a>`). Inteligentes vacío (C62): `feedNuevoUsuario`ya no cachea arrays vacíos + liked subquery en CTE del motor.
**R16:** Bugfixes profundos C58-C65. Samples en perfil (C58): causa raíz era que`apiPeticion`extrae`json.data`y el PHP devolvía`{data:[...], pagination:{}}`al mismo nivel —`resp.data.data`era undefined. Fix: PHP ahora envuelve`{data:{data:[...], pagination:{}}}`. Likes POST 400 (C60): `apiSocial.ts darLike`enviaba`targetId`(camelCase) pero backend espera`target_id`(snake_case);`quitarLike`usaba URL`/like/{tipo}/{id}`pero ruta es solo`/like`con body. Fix: snake_case +`apiDelete`acepta body opcional. Columna inexistente`ruta_archivo`(C63): columnas reales son`ruta_original`, `ruta_optimizada`, `ruta_preview`, `ruta_waveform`— corregido en`eliminar()`. `target_type`corregido a`tipo`en DELETE cascade likes. Check constraint`one shot`(C63): PipelineAudio ahora normaliza tipo ('one shot'→'oneshot') contra CHECK(loop|oneshot|fx|vocal|stem|otro). Descargas (C64): frontend llamaba`/descargas/{id}`pero ruta es`/samples/{id}/descargar`; respuesta ahora retorna URL pública en vez de ruta filesystem; botones descarga conectados en TarjetaSample y SampleDetalleIsland. Delete 404 (C65): GET slug regex capturaba IDs numéricos antes que DELETE — registrados GET+DELETE en misma ruta con handlers array. Sample 16 "procesando" actualizado a activo + `total_samples` sincronizado.
**R17:** Ajuste temporal UI (16/02/2026): ocultados los contadores de likes y descargas en `TarjetaSample` para reducir ruido visual en tarjetas de samples, manteniendo íconos y acciones operativas.
**R18:** Ajuste navegación sidebar (16/02/2026): removido botón "Crear" de `sidebarNav` y añadido botón "Configuración" separado al final en `sidebarFooter`, enlazado a apertura de `ModalConfiguracion`.
**R19:** Ajustes TopBar UX (16/02/2026): botón `+` unificado visualmente con botones icono estándar en `topbarAcciones`; badge de plan (`Free/Pro/Premium`) movido a primera posición izquierda; búsqueda centrada respecto al viewport en desktop y convertida a botón icono en pantallas pequeñas, abriendo modal funcional de búsqueda reutilizando `Modal` + `InputBusqueda` sincronizados con `filtrosStore`.
**R20:** Batch C66-C76. Toast system (toastStore+ContenedorToasts+toast.css) reemplaza window.confirm/alert (C66-C67). Borrar sample sin recargar vía custom event `EVENTO_SAMPLE_ELIMINADO` + FeedSamples listener (C66). Waveform: TarjetaSample+SampleDetalleIsland cargan picos desde `rutaWaveform` JSON del servidor, fallback AudioContext (C68). Mockups eliminados de PerfilIsland (Colombia/2024/kamples.com → campos dinámicos) y DescubrirIsland (C69). ModalPublicar en ComunidadIsland+LayoutPrincipal (C70). ComunidadIsland conectada a API real GET /publicaciones (C71). PipelineAudio ahora llama DeduplicadorAudio.programarCalculo() para generar hash perceptual (C71). NormalizadorSample incluye `audio_hash` en SQL+output (C71). PublicacionesController: admin posts auto-approve, visibilidad por moderacion_estado (C71). DescargasController: CALIDAD_PLAN wav para todos los planes (C72). TarjetaSample+SampleDetalleIsland llaman `registrarReproduccion()` al reproducir (C73). MotorRecomendacion: `WHERE rn<=N` eliminado, diversidad por creador ahora es penalización suave que nunca excluye samples (C74). Documentación algoritmo en `App/docs/algoritmo.md` con diagramas y tablas (C75). TarjetaMeta: muestra instrumento→género→emoción→velocidad→tag desde metadata IA, fallback a badges clásicos; SampleResumen type ampliado con metadata+totalReproducciones+audioHash (C76).
**R21:** Normalización de diseño por componentes (16/02/2026): `TopBar` migrado a `Badge`/`BotonBase` sin clases visuales ad-hoc; botón de búsqueda móvil movido a contenedor de layout. `SampleDetalleIsland` usa `Badge` premium en lugar de `detallePremiumBadge`. `MensajesIsland`/`NotificacionesIsland` migran contadores a `Badge`. `ModalCrear` y `ModalPublicar` migran acciones laterales a `BotonBase` (y contador de imágenes a `Badge`). Limpieza de CSS redundante eliminando reglas específicas: `topbarPlan*`, `topbarIconoBtn`, `detallePremiumBadge`, `mensajes*Badge`, `notificacionesBadge`, `crearAccionBtn`, `publicarAccionBtn*`, `perfilBadgePlan`.
**R22:** Configuración estricta de `cssVarsValidator` a nivel workspace para evitar hardcode CSS: severidad en `error`, escaneo completo (`scanAllFiles`), detección activa en propiedades de tipografía/espaciado/color/layout y archivo de variables principal apuntando a `App/React/styles/variables.css`.
**R23:** Activado light mode global (16/02/2026): la paleta base en `App/React/styles/variables.css` cambia a esquema claro usando el blanco de marca `#e5dfc7` como `--fondoBase`. Se ajustan fondos elevados, texto, bordes, hover/acento y overlays para mantener contraste sin tocar componentes individuales.
**R24:** Corrección de temas (16/02/2026): restaurado el modo oscuro como base en `:root` y creado modo claro separado en `:root[data-theme='light']`, reutilizando el blanco de marca `#e5dfc7` sin reemplazar el dark mode.
**R25:** Selector de tema operativo (16/02/2026): `ModalConfiguracion` ahora permite cambiar entre `Oscuro` y `Claro`; la selección se aplica en tiempo real (`data-theme`) y se persiste en `localStorage` mediante `services/tema.ts`. `LayoutPrincipal` inicializa el tema guardado al montar.
**R26:** Ajuste UX SampleDetalle (16/02/2026): layout simplificado a una sola tarjeta XL con portada lateral 1:1, cabecera tipo post (usuario arriba), título y descripción fuera de la tarjeta en tamaño reducido, reproducción sin botón dedicado (click en portada/waveform), ocultación temporal de métricas y meta extendida (reproducciones/likes/descargas + BPM/Key/Tipo/Duración/Formato/Tamaño), y tags unificados al mismo criterio visual/semántico usado en `TarjetaSample` del home.
**R27:** Ajuste fino SampleDetalle (16/02/2026): cabecera de usuario + título + texto movidos dentro de la tarjeta y por encima de la waveform; tags ubicados debajo de la waveform; acciones movidas a esquina inferior derecha con estilo plano (sin borde/fondo); botón de compartir eliminado.
**R28:** Publicar inline C89 (SeccionPublicar+usePublicar hook compartido con ModalPublicar, integrado en ComunidadIsland+PerfilIsland). feedTags colecciones C114, mostrarTags activado en ColeccionDetalleIsland. Panel lateral C86+C95+C111 (panelLateralStore Zustand, PanelDetalleSample+PanelSugerencias+PanelLateral, flex wrapper en LayoutPrincipal, TarjetaSample.onClickTitulo, habilitado en Inicio/Colecciones/Librería). Type-check 0 errores.
**R29:** C110 créditos + ZIP colecciones (DescargasController POST /colecciones/{id}/descargar-zip, ZIP cacheado 7d, créditos verificados, revenue share, TopBar créditos en menú avatar). C134 tags metadata IA (extraerTagsMetadata/extraerTagsAgrupadosMetadata en tagUtils.ts, FeedSamples migrado de s.tags a metadata IA). C115 búsqueda↔tags sync (filtrosStore expandido con tagsIncluidos/tagsExcluidos/bpmMin/bpmMax globales, parsearBusquedaATags bidireccional). C116 SelectFiltro+SelectorBPM (dropdowns estilo MenuContextual por categoría, BPM rango, tags sueltos draggable sin compresión, feedTagExpandirBtn eliminado). Type-check 0 errores.

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

---

# Comentarios nuevos (Cuando los comentarios se resuelvan, mover a tabla anterior)

85. No se estan usando los componentes, hay un boton de botones en todos lados que no usan el componente boton, por favor, inspesionar todo el codigo para encontrar todos los botones y cualqueir otra cosa que puede centralizarse con componentes, CENTRALIZAR Y NORMALIZAR ESTILOS; LOS COMPONENTES DEBEN SER LA FUENTE DEL VERDAD DE LOS ESTILOS
86. ~~Lo de "También te podría gustar" pasa que no debería ser un modal, debería aparecer al lado de los samples, dentro de InicioIsland, es decir, InicioIsland tendria 2 columnas, esta columa de "También te podría..." alli apareceran mas cosas en el futuro, no debe ocupar tanto, con el 30% del espacio es suficiente.~~ ✅ PanelLateral (340px derecha) con PanelSugerencias ("También te podría gustar") y PanelDetalleSample. LayoutPrincipal flex wrapper. panelLateralStore Zustand. Habilitado en Inicio, Colecciones, Librería.
87. ~~En descargas, favoritos, y tal vez en subido (no puedo comprobar porque no hay mas usuarios), me aparecen todos los samples en vez de solos los que corresponden en esas secciones. Y en libreriaBarraAcciones no debería ir el input de busqueda, alli se agregaran filtros, se hara un componente de filtro avanzado mas adelante, el input de busqueda de nav superior debería adaptarse y funcionar para todas las paginas en tiempo real, asi evitamos duplicar busquedas~~ ✅ Cada tab de LibreriaIsland llama a API distinta (favoritos/descargas/subidos). Input de búsqueda eliminado de libreriaBarraAcciones.
88. los estilos de feedSamplesContenedor deben centralizarse a "listaDeSamples", asi perfilListaSamples tienen los mismos estilos y tambien libreriaLista y todas las listas de sample.✅
89. ~~No me refería a agregar un boton de publicar comunidadBarraSuperior, me refería a agregar el modal actual de publicar, pero sin ser un modal, o sea una seccion de publicar, como una red social, igual en el perfil.~~ ✅ SeccionPublicar componente inline (usePublicar hook compartido con ModalPublicar). Integrado en ComunidadIsland (arriba del feed) y PerfilIsland (tab publicaciones, solo propietario).
90. ~~En las publicaciones que hago en comunidad, aparece @admin · Invalid Date~~ ✅ formatearTiempo() parsea correctamente las fechas. Formato relativo (ahora/Xm/Xh/Xd).
91. ~~El "publicarModos" no va, las publicaciones de comunidad se deciden si se estan haciendo una pregunta, si su post es solo texto (la ia supervisa), y si cuando esta intentando publicar un audio en crearCondiciones activa la opción de comunidad.~~ ✅ publicarModos eliminado del JSX de ModalPublicar.
92. ~~Bajar los "Agrega al menos 5 tags (#hashtags) para subir tu sample (0/5)" bajar los tags necesarios a 2~~ ✅ MIN_TAGS_AUDIO=2 en frontend y backend.
93. ~~Las publicaciones de comunidad de los usuarios debería aparecer en la tab de comunidad de sus perfiles.~~ ✅ PerfilIsland tab comunidad muestra publicaciones del usuario.
94. ~~Cuando elimino un sample, sigue sin eliminarse visualmente.~~ ✅ Custom event EVENTO_SAMPLE_ELIMINADO + listener en FeedSamples y LibreriaIsland.
95. ~~En la segunda columna que habia comentado antes en 86, en ese espacio al dar click a un titulo de un sample debe aparecer su informacion detallada resumida, en vez de redirigir a la pagina del sample. Tambien la sección de comentarios debe aparecer alli cuando se de click al icono de comentarios.~~ ✅ PanelDetalleSample muestra detalle condensado (metadata, waveform, like, comentarios). TarjetaSample prop onClickTitulo abre panel en vez de navegar. Panel lateral muestra comentarios al click en icono comentar.
96. ~~La sección de comentarios no debería aparecer dentro de detallePieFlex sino debajo en las paginas individuales de los samples.~~ ✅ Comentarios renderizados fuera de detallePieFlex como sección hermana.
97. ~~El problema de que las waveform originales no se muestran hasta que se reproduce sigue.~~ ✅ Confirmado resuelto por el usuario.
98. ~~Publique una imagen en comunidad y despues dejo de aparecer blob:http://glory.local/87e93190-8dc0-4d95-9ed0-11f73d3dbed0~~ ✅ Imágenes se suben al servidor con URLs reales, no blob URLs.
99. ~~Los likes que doy en la pagina de comunidad al recargar se borra, no perduran.~~ ✅ Confirmado resuelto por el usuario.
100. ~~Los filtros de los samples estan mal, a demás parece que no funcionan~~ ✅ 4 filtros toggle correctos: ocultar reproducidos, ocultar likeados, solo seguidos, ocultar descargados.
101. ~~el menuContextual que aparece cuando se da click a la foto de perfil en el nav debería estar mas la derecha, debería aparecer justo debajo de la imagen (sin salirse la pantalla, no sale pero igual hay que evitarlo).~~ ✅ Confirmado resuelto por el usuario.
102. ~~eliminar .menuContextualSeparador no me gusta, que no haya separación en los menu contextuales.~~ ✅ Clase y renderizado de separador eliminados.
103. El registro debe ser más sencillo, solo el nombre de usuario, correo, y contraseña una sola vez. Y cuando me intento registrar dice "No se ha encontrado ninguna ruta que coincida con la URL y el método de la solicitud." Failed to load resource: the server responded with a status of 404 (Not Found)
104. Lo de registro debe ser un modal tambien el inicio de seccion, no paginas, y el modal debe ser con una imagen (la misma estructura de .planesLayoutEspecial)
105. ~~Seguir a un usuario no perdura, me segui desde otro usuario y la recargar ya no lo segúa. Tampoco funciona mandar un mensaje, debería abrir el modal el chat para mandar un mensaje a ese usuario.~~ ✅ Backend GET /perfil/{username} ahora devuelve `siguiendo: boolean` via EXISTS en tabla follows. PerfilIsland usa el valor real. BotonFollow sincroniza prop con useEffect. Botón "Mensaje" ahora llama iniciarConversacion() y abrirChat() del chatFlotanteStore.
106. ~~El modal de guardar samples en colecciones debe estar sin cabeza, la lista de colecciones debe estar sin contador y sin icono, solo con la imagen de la colección y el nombre de la colección, en donde esta el supuesto contador (no funciona pero no importa porque lo vamos a quitar), tiene que aparecer si ese sample ya esta guardado ahi (sino esta que no parezca nada), y esta parte no parece muy optimizada porque las colecciones tardan en aparecer.~~ ✅ Modal reescrito como panel sin cabecera (overlay propio). Items: imagen+nombre+check "ya guardado". Sin contador ni icono.
107. ~~Lo de seleccionColeccionNueva no debe ser un boton, debe ser un buscador, debe estar arriba, y cuando se escriba, las colecciones aparecen en tiempo real segun la busqueda, si se tiene escrito algo abajo aparece un boton de crear coleccion, se guarda con el nombre de esa colección, si la coleccion ya existe con ese nombre poner una alesta de que la coleccion con ese nombre ya existe.~~ ✅ Buscador arriba con filtrado en tiempo real. Botón "Crear" aparece solo si hay texto y no existe colección con ese nombre. Alerta si duplicado.
108. ~~coleccionMeta dentro de las colecciones individuales debe mostrar las 5 metas mas comunes de los samples, y el contador alli debe funcionar, estar separado por un "•".~~ ✅ useMemo calcula 5 metas más comunes (género/emoción/instrumento/tipo) de samples, separadas por •. Contador totalSamples funciona.
109. ~~El boton de guardar colección no debe estar expandido, agregar otro boton de "Descargar colección" y Preview.~~ ✅ Botón guardar ahora es icono 32x32 (sin texto). Agregados Download y Play como botones icono. Lógica de descarga to-do (depende de C110 créditos). 
110. ~~Cuando se vaya a descargar una colección tiene suceder algo especial, hay un requerimiento previo, el contador de credito, que creo que no se progrogamo o tal vez (porque ajam, los usuarios free debe tener 5 creditos para descargar al día, y los usuarios premiun pro 50, etc), el contador de creditos tiene que estar en el menu contextual que se abre al dar click a su foto de perfil en el nav, los creditos tienen que restablecerse cada 24 horas y consumirse al descargar (si descarga un sample que ya habia descargado antes no deberí consumir creditos), en fin cuando se descarga una colección tiene que crearse un zip de todos los samples, obviamente no tiene que crearse cada vez que alguien descarga, sino guardarse temporalmente una semana y actualizarse de la forma mas eficiente cuando se actualicen los samples en esa colección, la descarga no se debe realizar si el usuario no tiene los creditos suficiente totales, y debe mostrarse una alerta, si dentro de una colección ya tiene samples descargado, esos se descuentan del total al descargar la colección obviamente.~~ ✅ Backend POST /colecciones/{id}/descargar-zip (ZIP cacheado 7d, créditos verificados, samples ya descargados gratis, revenue share). Frontend: TopBar créditos en menú avatar (carga cada 60s), ColeccionDetalleIsland botón descarga con toast feedback.
111. ~~La columna extra que te habia mencionado antes, debe funcionar para todos los lugares donde haya una lista de samples, colecciones, biblioteca, etc, excepto en el perfil y comunidad.~~ ✅ Panel lateral habilitado en InicioIsland, ColeccionDetalleIsland y LibreriaIsland. No habilitado en PerfilIsland ni ComunidadIsland. FeedSamples pasa onClickTitulo/onComentar cuando panel habilitado.
112. ~~Hace falta un icono de 3 puntos que abra un menu contextual para las opciones de las publicaciones, como eliminar, reportar, copiar enlace, ver post, etc (las publicaciones deben tener pagina individual como los samples y se puede acceder a esa pagina cuando se da click al tiempo o a la fecha), obviamente los usuarios solo pueden borrar sus post y los admin los post de cualquiera. Los reportes deben funcionar, planificar una pagina de administración (esto es una tarea complicado que debería planificarse bien en el roadmap): en esa pagina se vera una lista de los usuarios registrados, con menu contextual para banear, eliminar, ascender a pro o a premiun o mandar un mensaje, una tab de reportes, y tab de moderación, tab de monitación para controlar la monetización e ingresos. (No hay que hacer esta tarea, solo planificarla para hacerla mas adelante), tambien un resumen donde se pueda ver resumidamente el panorama: usuarios registrados, samples descargados, etc.~~ ✅ PLANIFICADO en FASE 13: AdminPanelIsland (5 tabs: Resumen, Usuarios, Moderación, Reportes, Monetización) + menú contextual publicaciones + tabla reportes. Ver sección FASE 13 del roadmap.
113. ~~inicioTagsContador no esta contando los samples (esto tiene que ser ultra eficiente)~~ ✅ Contador optimizado con query SQL COUNT directa.
114. ~~en todas las listas de sample de las colecciones debe aparecer feedTags y funcionar con su filtrado inteligente, tambien asegurarse que funcione con la busqueda.~~ ✅ mostrarTags activado en tab samples de ColeccionDetalleIsland.
115. ~~(primero 134 para que pueda funcionar la agrupación) Esto tiene que ver con la tarea anterior pero es algo elaborado: actualmente en el home las feedTags a dar click filtra positiva o negativamente, esto debe actualizar el input de busqueda esta representado correctamente, es decir, si yo busco hip hop, (se separa con coma las tags y vuelven badge), eso significa que estoy que quiero que se muestro samples que sean de hip hop, pero si yo hago esta busqueda "hip hop, -trap" eso quitara todos los samples de trap del resultado, asi como supuestamente funciona feedtag que tiene simbolos + y -, al presionar un tag debe actualizar no solo los samples sino el input de busqueda en el nav, es decir, esto debe ser un mismo sistema que funciona en todas las paginas donde haya lista de samples, en comunidad no porque debe ser diferente esto, que no se bugee con el cambio de paginas y tab como siempre suele suceder en sistemas interactivos de busqueda, cada pagina y tab, debe tener su busqueda independiente.~~ ✅ filtrosStore expandido con tagsIncluidos/tagsExcluidos globales, sync bidireccional búsqueda↔tags (parsearBusquedaATags/generarBusquedaDesdeTags), FeedSamples migrado a store global. BPM filtering integrado.
116. ~~Mejorar las tags, no tengo una idea clara de esto pero, arriba de las tags, (esto es un sistema unificado), las tags se agruparan en selects (estos select deben ser personalizados y componentes propios de kamples, no selects generico, que usen las variables, minimalistas y similar al menu contextual), sera un select para activar restar o sumar ciertos tags, los tags se agruparan (o sea los select seran de) instrumento, genero, emocion, instrumento, artista vibe, y tipo, (o sea la estructura json de la metadata de los samples) las de bpm debe ser especial, debe ser un menu contextual de selector de rango, estos elementos se adaptan a la idioma del usuario.~~ ✅ SelectFiltro component (dropdown estilo MenuContextual, +/- por opción). SelectorBPM (rango min/max). Fila de selects (Tipo/Género/Instrumento/Sentimiento/BPM) + fila de tags sueltos draggable sin compresión. feedTagExpandirBtn eliminado. 
117. ~~Optmización del algoritmo, entiendo que algoritmo usa el json de los samples para crear las recomendaciones pero ¿usarlo en 2 idiomas no hace que el proceso sea mas pesado? Esto es una tarea complicada asi que no es para hacer ahora, es para planificar, es una revisión profunda de como impacta que el json este 2 idiomas y que si es mejor solo usar una idioma, obviamente en caso de que usar una sola idioma mejora la eficiencia del algoritmo, pues, la decisión no es dificil, habría que hacer todos los ajustes necesario (planificar bien), para mejorar la eficiencia.~~ ✅ ANALIZADO: El JSON bilingüe NO impacta el algoritmo ni los embeddings. Ver análisis completo abajo. 
118. ~~En Inspector de Sample debería ver el nombre del archivo original y el de audio optimizado y sus rutas.~~ ✅ Inspector muestra nombre y ruta de archivo original, optimizado, preview y waveform.
119. ~~Vscode reporta errores en PerfilIsland~~ ✅ Tipos corregidos: ubicacion/sitioWeb como string|null, siguiendo como boolean opcional.
120. ~~En la esquina superior derecha se puede aprovechar para colocar el estado de moderacion (representado en solo iconos) para los post de comunidad y samples en sus paginas individuales y detalles en el menu lateral, solo visible para los usuarios en sus propios post y admin para todos los post.~~ ✅ BadgeModeracion componente creado. TarjetaPublicacion muestra moderacionEstado (pendiente/revision/rechazado). SampleDetalleIsland muestra estado sample (procesando/inactivo). Backend envía moderacionEstado en publicaciones. Solo visible para autor/admin.
121. ~~Este error es nuevo, pasa cuando intento subir un sample.~~ ✅ Causa raíz: frontend MIN_TAGS_AUDIO=2 (C92) pero backend SamplesController.php aún exigía count($tags)<5. Alineado a <2.
122. Presiento que perdiste de los comentarios que ya habias resuelto, si los sabes, marca los que resolviste, pero si no sabes, no te preocupes, detente hasta aqui y yo comprobaré tarea por tarea a ver cual se cumplio y cual no.
123. ~~Sale este error Error en isla "ColeccionDetalleIsland" Rendered more hooks than during the previous render.~~ ✅ useMemo de metasComunes estaba después de early returns causando hooks condicionales. Movido antes de returns. Defensivo con typeof para valores no-string del metadata JSONB.

(En este punto las tareas completadas anteriores a 124 deberían simplificarse en la tabla de ## Comentarios del usuario (resueltos), esto es necesario antes de continuar con 124, el registro de cambios tambien debería ser compactado)

124. seccionPublicar deberia tener la misma estructura y verse exactamente igual al modal crearContenido, tambien debería permitir publicar audios.
125. coleccionAcciones si debería mostrar el texto de los botones.
126. Modal de configuración de samples, publicaciones, y colecciones: poder cambiar todo lo modificable, los admin pueden cambiar todo, y los usuarios sus cosas. De los samples, poder cambiar por ejemplo, la imagen, el titulo, los tags.
127. No se si lo planifique antes pero, los samples necesita un boton de 3 puntos para su configuracion, igual que los samples en la lista, la menu contextual debe ser el mismo, igualmente las colecciones tanto en su lista y su pagina individual y los post de publicaciones de comunidad tambien.
128. No se si lo planifique antes, debajo de detalleTarjetaUnica, en otra sección debe aparecer una lista de samples similares, basada en el algoritmo, claro, esto tiene que estar bien optimizado y cheado. Los comentarios tienen que aparecer ya expandidos, 
129. Por cierto, no se si la sección de comentarios tiene paginación pero si debería tener, una de infita con scroll, (optimizado para mantener un numero maximo de comentarios renderizados)
130. Se debería poder comentar imagenes y audios.
131. Planificar la automoderación de contenido con IA, cada vez que se publica un comentario, la IA tiene que decidir si es spam, si es valido, etc.
132. Mejora el sistema de moderación con IA, planificar mejor este sistema, la IA tiene que ser capaz de bloquear usuarios si tienen actividad sospechosa, spam, la toxicidad no es baneable, los usuarios son libres de discutir e insultarse, pero el spam, no es permitido, cuando un usuario hace comentarios con spam, le debe llegar una notificación de que su comentario fue eliminado automaticamente por x razón, el desnudo o contenido para adulto tambien esta prohibido, en ningun lugar, tampoco de portada para ningún audio, poca ropa si esta permitido, no estan estricto pero contenido en si totalmente pornxgrafico o actividades sexuales, o partes intimas prohibida, hay que tener cuidado porque sabemos que los albunes suelen usar imagenes explicitas que no son problemas generalmente, no queremos falsos positivos.
133. Las paginas no deberían volver a cargarse cuando cambio de pagina, o sea si la pagian ya estaba cargada, despues vuelvo abrirla, no debe recargarse, ni la lista samples ni nada, todo debe cargarse una sola vez.
134. ~~Me di cuenta que feedTagsLista esta tomando los tags de   "tags": [
    "test1",
    "test2",
    "test3",
    "test4",
    "test5"
  ], (los tags que escribe el usuario en la descripcion al subir)
  pero deberían ser los tags de la matadata de la ia y la demas info, dejo detalladamente la que importa, no debe repetirlos por cierto, y asegurarse de que esten normalizados guitars = guitar

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
    ],~~ ✅ extraerTagsMetadata() y extraerTagsAgrupadosMetadata() extraen tags del metadata IA (genero, instrumentos, emocion, artista_vibes, tags) con normalización y deduplicación.
135. C86 en realidad no se realizo, "También te podría gustar" sigue apareciendo como modal en vez de aparecer en el menu lateral, aparte no funciona ni muestra ninguna recomendacion nuca.

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