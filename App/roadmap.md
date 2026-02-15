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

---

## Pendientes por Fase

### FASE 0 — Infraestructura y Base

> Prioridad: ALTA — desbloquea algoritmo, uploads, y IA

- [x] **0.1a** Conexión PHP → PostgreSQL ✓ (IMPLEMENTADO)
    - [x] Extensiones `pdo_pgsql` y `pgsql` habilitadas en php.ini (Local)
    - [x] `PostgresService.php` singleton PDO funcional
    - [x] Endpoint `GET /kamples/v1/health` verifica conexión
    - [x] Schema base `v001_schema_base.sql` creado (14 tablas, sin dependencia pgvector)
    - [x] Endpoint `GET /kamples/v1/debug/pgvector` para verificación futura
- [ ] **0.1b** Instalar pgvector (EN PROGRESO — VS Build Tools ya instalado, falta compilar)
    - Migración `v002_pgvector_setup.sql` lista para ejecutar cuando se instale
    - `VerificarPgvector.php` listo para diagnosticar
    - Schema v001 original incluye columna `embedding vector(1536)` + índice HNSW
    - [x] **Prerrequisito cumplido:** VS Build Tools 2026 v18 instalado (cl.exe 19.50, CMake 4.1.2)
    - **Siguiente paso:** Compilar pgvector con CMake + MSVC contra PostgreSQL local
    - **Impacto:** Sin pgvector el algoritmo de similitud no funciona, pero todo lo demás sí
- [x] **0.2** Almacenamiento audio en WordPress ✓ (IMPLEMENTADO)
    - Endpoint `POST /kamples/v1/samples/up) + max 50MB
    - INSERT en PostgreSQL con ID corto base62 (7 chars), estado 'procesando'
    - Pipeline automático: IA + waveform + MP3/preview + renombrado
    - Validación MIME (wav, mp3, flac, aiff, ogg, m4a) + max 50MB
    - INSERT en PostgreSQL con slug generado (MD5 suffix), estado 'procesando'
    - TO-DO: htaccess deny direct access, servir via PHP con validación de permisos
- [x] **0.3** Pipeline de procesamiento audio ✓ (IMPLEMENTADO v2)
    - `PipelineAudio.php`: ejecuta sincrónicamente al subir (TO-DO: mover a background)
    - FFmpeg OBLIGATORIO: detección cross-platform Win+Linux con `buscarBinario()`
    - Prioridad de búsqueda: .env (FFMPEG_PATH) > PATH del sistema > ubicaciones comunes > winget (glob)
    - Fix: PHP bajo Apache/LocalWP no hereda PATH del usuario, se resolvió con ruta explícita en .env
    - Análisis técnico (BPM/key) con `AnalizadorAudio.php` — herramientas de señal, no IA
    - Análisis creativo (tags, emociones, etc.) con `ServicioIA.php` — Gemini
    - Calcula duración real con FFprobe (fallback por tamaño)
    - Genera waveform peaks JSON (120 barras) via FFmpeg→PCM→PHP
    - Genera MP3 optimizado 320kbps + preview 30s 128kbps con fade-out
    - Renombra archivo: `kamples_{tipo}_{nombre_base}_{bpm}_{key}_{idCorto}.{ext}`
    - TO-DO: mover a wp_schedule_single_event() cuando el volumen crezca
- [x] **0.4** Imágenes colors/ dinámicas ✓ (IMPLEMENTADO)
    - Endpoint `GET /kamples/v1/colors` — lee directorio `colors/` en runtime
    - Cache con WP transient (24h TTL), filtra extensiones imagen
    - TO-DO: WebP conversion, lazy loading, srcset, migrar frontend a usar endpoint

### FASE 1 — Auth y Perfil

> Prioridad: ALTA — fix bugs actuales + configuración

- [x] **1.1** Fix "Usuario no encontrado" en PerfilIsland ✓ (IMPLEMENTADO)
    - Guard `authCargando` antes de mostrar "no encontrado"
    - Fix stale closure en `manejarLike` con setState callback
    - Botón "Editar perfil" ahora abre ModalConfiguracion
- [x] **1.2** ModalConfiguracion (reemplaza EditarPerfilIsland) ✓ (IMPLEMENTADO)
    - `ModalConfiguracion.tsx` + `configuracionModalStore.ts` + `modalConfiguracion.css`
    - Avatar upload con overlay Camera, nombre visible, username con @, bio (300 chars)
    - Toggle notificaciones (Bell/BellOff)
    - Integrado en LayoutPrincipal, abierto desde PerfilIsland
    - Conectado a `PUT /kamples/v1/me` para guardar cambios + persist en authStore
    - TO-DO: subida real de archivo avatar con FormData (endpoint no soporta multipart aún)
- [x] **1.3** Auto-creación `usuarios_ext` en Postgres ✓ (IMPLEMENTADO)
    - Endpoint GET /kamples/v1/me auto-crea registro si no existe
    - Sincroniza wp_user_id, username, display_name, avatar_url de WP → Postgres
- [ ] **1.4** Google OAuth (cuando las keys estén listas)
    - Variables en .env están vacías, preparar la integración para activarla cuando se tengan

### FASE 2 — Pipeline de Subida de Audio + IA

> Prioridad: ALTA — el core del producto

- [x] **2.1** Upload real de samples ✓ (IMPLEMENTADO)
    - ModalCrear conectado al endpoint `POST /kamples/v1/samples/upload` via FormData
    - `apiCliente.ts` soporta FormData (no serializa a JSON, omite Content-Type)
    - `apiSamples.ts`: `subirSample(DatosSubida)` construye FormData y envía
    - UI: mensajes error/éxito (AlertCircle/CheckCircle), texto botón "Subiendo..."
    - Tags extraídos con # del texto, enviados como JSON array
    - Waveform preview del audio adjunto con reproducción inline (ya existía)
- [x] **2.2** Análisis de audio (técnico + IA creativa) ✓ (IMPLEMENTADO v2)
    - **Técnico** (`AnalizadorAudio.php`): BPM y key con procesamiento de señal, NO con IA
        - BPM: detección onsets por energía + autocorrelación (FFmpeg→PCM 8kHz→PHP)
        - Key: Goertzel (12 notas × 4 octavas) + correlación Krumhansl-Schmuckler
        - Retorna `{bpm, key, escala, bpm_confianza, key_confianza}`
    - **Creativo** (`ServicioIA.php`): Gemini multi-modelo (prompt bilingüe del usuario)
        - Cadena fallback: gemini-2.5-flash → 2.5-pro → 2.0-flash
        - Retorna: nombre_archivo_base, tags/tags_es, tipo ("one shot"/"loop"),
          genero, emocion/emocion_es, instrumentos, artista_vibes,
          descripcion/descripcion_es, descripcion_corta/descripcion_corta_es
        - Parser robusto: JSON directo → bloque `json` → cualquier {}
    - Ambos integrados en PipelineAudio, resultados merged en campo `metadata` (JSONB)
- [x] **2.3** Metadata de imágenes con Groq ✔ (IMPLEMENTADO)
    - `ServicioImagenIA.php`: análisis de imágenes con Llama 4 Maverick/Scout (Groq visión)
    - Tags, descripción, tipo contenido, sentimiento, flag seguridad
    - Migración v005: columna `imagenes_metadata JSONB` en publicaciones
    - PublicacionesController: análisis async en shutdown hook al crear publicación
    - No bloquea la respuesta al usuario
- [x] **2.4** Remover campos manuales de ModalCrear ✓ (IMPLEMENTADO)
    - Eliminados selectores BPM, Key, Tipo, MetadataAudio interface, Sliders import
    - Waveform preview con Web Audio API (`generarPeaks`) + play/pause inline
    - Condiciones toggle: permitirDescarga (Download), licenciaLibre (ShieldCheck)
    - Banner IA: "BPM, tonalidad y tipo se detectarán automáticamente con IA"
    - Ctrl+Enter para publicar
- [x] **2.5** Normalización de tags BPM ✓ (IMPLEMENTADO)
    - `bpmUtils.ts`: `CategoriaBpm`, `obtenerCategoriaBpm()`, `etiquetaBpm()`, `rangoBpm()`
    - TarjetaSample muestra categoría ("Lento", "Normal", etc.) en vez de BPM crudo
    - TO-DO: click en tag → filtrar por categoría
- [x] **2.6** Nombrado automático de archivos con IA ✓ (IMPLEMENTADO)
    - `PipelineAudio::construirNombreArchivo()` genera nombre estandarizado
    - Formato: `kamples_{tipo}_{genero}_{bpm}_{key}{escala}_{idCorto}.{ext}`
    - Ejemplo: `kamples_loop_trap_140_Cm_a3Kf9x2.wav`
    - Renombra archivo físico en disco si la IA sugiere nombre
    - TO-DO: permitir edición del nombre antes de publicar
- [x] **2.7** IDs únicos cortos para samples ✓ (IMPLEMENTADO)
    - `GeneradorIdCorto.php`: 7 chars base62 (a-z, A-Z, 0-9), validado contra BD
    - Migración `v003_samples_id_corto.sql`: columna `id_corto` UNIQUE + índice
    - El ID se incluye en el slug (`titulo-idCorto`) y en el nombre del archivo
    - TO-DO: lookup dual por slug o id_corto en endpoint GET /samples/{slug}
- [x] **2.8** Deduplicación de audio por fingerprint — DeduplicadorAudio.php (BACKEND COMPLETO)
    - **Hash ligero diferido:** Al subir un audio, calcular un hash perceptual NO bloqueante
        - Extraer los primeros 4 segundos + últimos 4 segundos del audio
        - Generar fingerprint resistente a cambios de calidad, pitch y formato (ej: chromaprint/AcoustID)
        - Proceso 100% en background (Action Scheduler o wp_schedule_single_event)
        - Almacenar hash en columna `audio_hash` de `samples` (VARCHAR(64) + índice)
    - **Supervisión de duplicados:**
        - Al completar el hash, buscar coincidencias en BD (`WHERE audio_hash = :hash AND creador_id != :creadorId`)
        - Si hay coincidencia con otro usuario → marcar sample como `estado = 'en_supervision'`
        - Si coincide con sample del mismo usuario → permitir (duplicados propios son válidos)
        - Panel de supervisión (futuro) para que admins revean samples marcados
    - **Flujo de reporte al original:**
        - Si se detecta duplicado entre usuarios, notificar al dueño original del sample
        - El dueño original puede enviar un reporte marcando el audio como suyo
        - El reportado recibe aviso y debe aportar pruebas de originalidad
        - Sistema de disputa simple con estados: `reportado`, `en_revision`, `resuelto`, `rechazado`
    - **Tabla `reportes_duplicados`:** id, sample_original_id, sample_duplicado_id, reportador_id,
      estado (enum), pruebas_texto, created_at, resuelto_at
    - **Prioridad:** MEDIA — implementar hash ligero primero, sistema de reportes después

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

> Prioridad: ALTA — UX diaria del usuario

- [x] **4.1** Rediseñar ModalFiltros ✓ (IMPLEMENTADO)
    - Toggle switches con iconos (Play/Heart/Users/Download)
    - Filtros: yaReproducidos, likeados, deSeguidos, descargados
    - CSS reescrito para UI de toggles
- [x] **4.2** Eliminar tabs de InicioIsland ✓ (IMPLEMENTADO)
    - Tabs eliminadas, barra de ordenamiento: Inteligente/Recientes/Top Semanal/Top Mensual
    - Dropdown plano con 4 opciones directas (sin sub-menú contextual de Destacados)
    - Infinite scroll con IntersectionObserver + virtualización DOM (max 50 tarjetas renderizadas)
    - ~95 líneas de CSS nuevas en inicio.css
- [x] **4.3** Conectar filtros y ordenamientos al store/API ✓ (IMPLEMENTADO)
    - `filtrosStore.ts` reescrito: toggles + TipoOrdenamiento + PeriodoDestacados
    - `useFiltros.ts` actualizado para nuevos campos
    - TO-DO: enviar filtros toggle al backend cuando endpoints los soporten

### FASE 5 — Chat Flotante tipo Messenger

> Prioridad: MEDIA — mejora social importante

- [x] **5.1** Componente ChatFlotante ✓ (IMPLEMENTADO)
    - `ChatFlotante.tsx` + `chatFlotanteStore.ts` + `chatFlotante.css`
    - Fixed bottom-right encima del reproductor, max 3 chats abiertos
    - Minimizable/cerrable, VentanaChat con burbujas, input con Enter
    - Integrado en LayoutPrincipal
- [ ] **5.2** Soporte multimedia en chat
    - Enviar imágenes (upload + preview + zoom)
    - Enviar audio (grabación inline o adjuntar archivo)
    - Compartir samples publicados (tarjeta mini con play inline)
    - Almacenamiento organizado: `kamples/mensajes/{conversacion_id}/`
    - Validación de tipos y tamaños, compresión de imágenes
- [ ] **5.3** WebSocket local para tiempo real
    - Servidor WebSocket Node.js local para desarrollo
    - Conectar wsService.configurar() desde el auth flow
    - Canales: `chat:{conversacion_id}`, `notificaciones:{user_id}`
    - Typing indicators, online status, read receipts
- [ ] **5.4** Optimización del chat
    - Virtualización de mensajes largos (solo renderizar visibles)
    - Lazy load de imágenes/audio en burbujas
    - Caché local de conversaciones recientes

### FASE 6 — Navegación y Páginas

> Prioridad: MEDIA

- [x] **6.1** Navegación SPA fluida ✓ (IMPLEMENTADO)
    - Fix root cause: `buscarRutaEnMapa()` en navigationStore.ts con prefix matching
    - Click en nombre de sample → navegar a /sample/{slug} sin recargar
    - Click en nombre de colección → navegar a /coleccion/{id}/ sin recargar
    - Back/forward del navegador funciona correctamente con popstate
    - Middle-click / Ctrl+click abre en nueva pestaña (elementos convertidos a `<a href>`)
- [x] **6.2** SampleDetalleIsland mejorado ✓ (IMPLEMENTADO)
    - Hero con imagen de fondo (colors/) + waveform XL overlay + botón play grande
    - Creador navegable (click → /perfil/{username}/) con avatar, nombre, @username
    - Botón BotonFollow para el creador (si no es propietario)
    - Like con API real (darLike/quitarLike)
    - Similares navegables con like, menú contextual, click a creador
    - Estadísticas con texto descriptivo (reproducciones, likes, descargas)
    - Campo Tipo visible en metadata
    - TO-DO: metadata generada por IA (instrumentos, sentimiento, artistas)
- [x] **6.3** ColeccionDetalleIsland (NUEVA) ✓ (IMPLEMENTADO)
    - `ColeccionDetalleIsland.tsx` + `coleccionDetalle.css`
    - Ruta `/coleccion/{slug}` registrada en pages.php con slug dinámico
    - Header: imagen 200px + info + badge público/privado + stats
    - Grid TarjetaSample + botón guardar + loading/error states
- [x] **6.4** ComunidadIsland (NUEVA) ✓ (IMPLEMENTADO)
    - `ComunidadIsland.tsx` + `comunidad.css`
    - Ruta `/comunidad` registrada en pages.php + appIslands.tsx
    - 5 mock posts variados (texto, imágenes, sample adjunto, tutorial)
    - Filtros: Todos/Siguiendo/Populares + like/repost optimista
- [x] **6.5** LandingPublica para deslogueados ✓ (IMPLEMENTADO)
    - LayoutPrincipal: condicional auth → sin sidebar/topbar/reproductor para no autenticados
    - Nav flotante con backdrop-filter: blur(12px), AudioLines logo + "Kamples"
    - Botones Login/Registro a la derecha
    - CSS: `.layoutPublico`, `.landingNav`, padding-top compensado

### FASE 7 — Monetización (Stripe)

> Prioridad: MEDIA — keys live ya disponibles en .env

- [x] **7.1** Stripe Billing ✔ (IMPLEMENTADO)
    - PagosController.php: POST /pagos/checkout, POST /pagos/portal, POST /pagos/webhook, GET /pagos/planes
    - StripeService.php: env keys unificadas (GLORY\_ prefix), subidas ilimitadas, transferencia GB límite
    - Webhook handler: checkout.session.completed, subscription.updated/deleted
    - Tabla usuarios_ext: columna stripe_subscription_id agregada
- [x] **7.2** PlanesIsland funcional ✔ (IMPLEMENTADO)
    - Conectado a Stripe Checkout real via crearSesionCheckout()
    - Estados: cargando (redirect), error (banner), éxito (PartyPopper banner)
    - Botón "Gestionar suscripción" → Stripe Customer Portal
    - Características actualizadas: subidas ilimitadas, transferencia GB, prueba gratuita 30 días
    - apiPagos.ts: crearSesionCheckout() + abrirPortalFacturacion()
- [ ] **7.3** Stripe Connect
    - Onboarding de creadores para recibir pagos
    - Revenue share configurable por plan (70/30, 80/20)
- [ ] **7.4** Samples premium
    - Lógica de compra individual + acceso por plan
    - Bloquear descarga de premium sin plan/compra
- [ ] **7.5** Límites por plan
    - Enforcer: descargas/día, subidas/mes, calidad audio

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

## Showcase y Dev Tools (#9)

- [x] Eliminar inline styles del ShowcaseIsland (ShowcaseEspaciados, ShowcaseFormularios, ShowcaseOverlays)
- [x] Convertir todos los style={{ }} a clases CSS reales (excepto los dinámicos de Espaciados que usan CSS custom properties)
    - ✅ COMPLETADO: 6 inline estáticos → clases CSS, 2 dinámicos → CSS custom properties (--tamano, --tamanoFuente).
    - Clases añadidas en showcase.css: showcaseTextoSecundario, showcaseMargenSuperior, showcaseZonaMenuContextual,
      showcaseTextoAyuda, showcaseTextoAyudaConMargen, showcaseTextoTipografia.

---

### Plan: Sistema de Colecciones + Algoritmo de Recomendacion (C14)

**Prioridad:** Alta — Feature central de la plataforma.

#### Fase A: Colecciones Base

- [x] Tabla `colecciones` en PG (id, usuario_id, nombre, descripcion, portada_url, publica, total_items, created_at, updated_at)
- [x] Tabla `coleccion_samples` (coleccion_id, sample_id, orden, added_at)
- [x] CRUD API: crear, listar, editar, eliminar colecciones — ColeccionesController.php (339 líneas)
- [x] Modal "Guardar en coleccion" tipo Pinterest: endpoint `GET /colecciones/relevantes/{sampleId}` ordena por relevancia
- [x] ModalSeleccionColeccion mejorado con ranking por relevancia (obtenerRelevantesParaSample)
- [x] Pagina individual de coleccion con listado de samples (mismo formato que home, filtros y tags centralizados)
    - ✅ Backend completo. Frontend apiColecciones.ts actualizado con sugerencias y relevantes.
    - ✅ ModalSeleccionColeccion carga colecciones ordenadas por relevancia usando Promise.all.

#### Fase B: Tab "Mas Ideas" en Colecciones

- [x] Algoritmo de similitud basado en metadata (tags, genero, BPM range, key, sentimiento) — MotorRecomendacion.php
- [x] Endpoint GET /colecciones/{id}/sugerencias — devuelve samples similares NO incluidos en la coleccion
- [x] Tab "Mas Ideas" en la pagina de la coleccion (frontend) ✔ (IMPLEMENTADO)
    - ColeccionDetalleIsland con tabs "Samples" / "Más Ideas" usando FeedSamples centralizado
    - Tab Samples: FeedSamples con samplesIniciales, sin scroll infinito
    - Tab Más Ideas: FeedSamples con proveedorSugerencias paginado, tags e infinite scroll
    - CSS: .coleccionTabs, .coleccionTab, .coleccionTabActiva
- [x] Centralizar componente de lista de samples (FeedSamples) para reutilizar en home, coleccion, mas ideas, perfil ✔ (IMPLEMENTADO)
    - FeedSamples.tsx (~470 lín): componente genérico con ProveedorSamples, tags ±, infinite scroll,
      virtualización DOM, cache, optimistic likes, menú contextual, inspector, idsExcluidos
    - feedSamples.css: estilos completos del componente
    - InicioIsland refactorizado: 550 → 180 líneas (delega a FeedSamples)
    - ColeccionDetalleIsland refactorizado: usa FeedSamples para ambas tabs

#### Fase C: Algoritmo Centralizado de Recomendacion (14.1 + 14.2)

- [x] Archivo de configuracion de pesos: `App/Kamples/Config/algoritmoPesos.php`
    - Pesos de: likes, reproducciones, descargas, seguimiento, tags match, BPM proximity, key match, recencia, diversidad
    - 100% dinamico, legible, sin hardcode
- [x] Motor de scoring centralizado: `App/Kamples/Services/MotorRecomendacion.php`
    - Usado por: feed home, "mas ideas", "tambien te podria gustar", "samples similares"
    - Entrada: sample(s) de referencia + contexto usuario + pesos
    - Salida: lista rankeada con score
- [x] Modal "Tambien te podria gustar" al dar like (muestra 3-5 samples similares) ✔ (IMPLEMENTADO)
    - ModalSugerenciasLike.tsx: modal con Sparkles + TarjetaSample compactas
    - sugerenciasLikeStore.ts: Zustand store que carga similares via obtenerSimilares()
    - modalSugerenciasLike.css: estilos del modal
    - Integrado en FeedSamples: al dar like (nuevo), se abre automáticamente
- [x] Seccion "Samples similares" en pagina individual de sample — endpoint `GET /samples/{id}/similares`

#### Fase D: Tracking de Reproducciones (14.3)

- [x] Tabla `reproducciones` (id, user_id, sample_id, duracion_escuchada, completada, created_at)
- [x] Endpoint POST /samples/{id}/reproduccion — registra play (debounce 3s minimo) — ReproduccionesController.php
- [x] Historial de reproducciones en perfil del usuario — endpoint GET /reproducciones/historial
- [x] Filtro "Ya reproducidos" usa datos reales ✔ (IMPLEMENTADO)
    - useHistorialIds.ts: hook que carga y cachea Set de IDs reproducidos
    - FeedSamples prop idsExcluidos: filtra samples ya escuchados del feed
    - InicioIsland: conecta filtrosStore.yaReproducidos con useHistorialIds
- [x] Algoritmo penaliza samples escuchados muchas veces para promover descubrimiento — MotorRecomendacion.php
    - ✅ Backend completo. Servicio frontend apiReproduciones.ts creado.

#### Fase E: Moderacion IA (C10)

- [ ] Llama Prompt Guard 2 22M: detectar toxicidad en textos de comunidad
- [ ] Llama 4 Scout 17B 16E: moderar imagenes adjuntas
- [ ] openai/gpt-oss-120b: moderacion contextual de publicaciones
- [ ] Cola de moderacion async: publicaciones pasan a revision antes de ser visibles

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

| #   | Solicitud                                           | Estado                                                                                                             |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | FFmpeg obligatorio Win+Linux                        | ✅ `buscarBinario()` cross-platform. Prioriza .env > PATH > rutas comunes > winget glob                            |
| 2   | Prompt IA bilingüe, sin BPM/key                     | ✅ ServicioIA prompt creativo bilingüe. BPM/key vía AnalizadorAudio (Goertzel+autocorrelación)                     |
| 3   | Groq API + fallback multi-modelo                    | ✅ Gemini (audio) → Groq (texto). Cadena: Flash 3→Pro 2.5→Flash 2.5→Flash 2.0 / gpt-oss-120b→llama-70b→gpt-oss-20b |
| 4   | FFmpeg instalado                                    | ✅ v8.0.1 via winget. Fix: PHP/Apache no hereda PATH → `FFMPEG_PATH` en .env                                       |
| 5   | Prompt con descripción+tags del usuario, mín 5 tags | ✅ `construirPrompt()` con contexto completo. Validación 5 tags frontend+backend                                   |
| 6   | Not null violation email usuarios_ext               | ✅ INSERT incluye email desde `$wpUser['email']`                                                                   |
| 7   | Unexpected token '<' al subir sample                | ✅ `require_once file.php` + prefijo `\` en funciones WP                                                           |
| 8   | Refactorizar KamplesController (SOLID)              | ✅ 1713→60 lín. 12 sub-controladores, 2 helpers, 3 servicios, algoritmoPesos.php                                   |
| 9   | Groq no procesa audio/imágenes                      | ✅ Correcto: Gemini=audio, Groq=solo texto. TO-DO: Llama 4 Maverick para imágenes                                  |
| 10  | Moderación IA con Groq                              | PLANIFICADO en Fase E: Llama Guard 2 (toxicidad), Scout (imágenes), gpt-oss-120b (comunidad)                       |
| 11  | tags?.forEach is not a function                     | ✅ `pgArrayToPhp()` convierte string PG a array PHP                                                                |
| 12  | Quitar todos los mocks                              | ✅ Eliminados mocks de 7 archivos API + 2 dropdowns + ComunidadIsland + mockSamples.ts                             |
| 13  | nombreVisible/likes undefined                       | ✅ `normalizarSample()` reescrita: snake→camelCase, sub-objeto creador, cast tipos. ModalInspectorSample creado    |
| 14  | Colecciones tipo Pinterest + algoritmo              | ✅ IMPLEMENTADO: Fases A-D completas (ver sección "Plan: Colecciones + Algoritmo")                                 |
| 15  | Compactar roadmap                                   | ✅ Hecho                                                                                                           |
| 16  | Badge plan en TopBar                                | ✅ Free/Pro/Premium con estilos dinámicos + nav a /planes/                                                         |
| 17  | URL del proyecto: `http://glory.local/`             | ANOTADO (ver Notas)                                                                                                |
| 18  | Borrar mis samples desde menú contextual            | ✅ DELETE /samples/{id} condicional (dueño o admin)                                                                |
| 19  | Admin borra cualquier sample/colección              | ✅ `UsuarioHelper::esAdmin()` + permisos en SamplesController y ColeccionesController                              |
| 20  | Tags sin estilos                                    | ✅ Faltaba import de feedSamples.css                                                                               |
| 21  | JSON roto de IA al subir                            | ✅ 5 estrategias de extracción JSON + reparación con Groq. Fix: control chars                                      |
| 22  | feedTagItem eran badge, no botón                    | ✅ `<span role="button">` con accesibilidad + CSS reforzado                                                        |

---
