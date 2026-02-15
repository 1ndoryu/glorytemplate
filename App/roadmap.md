# Kamples — Roadmap Integral de Producto

> **Versión:** 2.0  
> **Última actualización:** 15/02/2026 (iteración v2.1)  
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

| Ruta | Isla | Descripción |
|------|------|-------------|
| `/` | `InicioIsland` | Feed con filtros toggle + ordenamientos |
| `/` (deslogueado) | `LandingPublica` | Landing page con nav flotante (sin sidebar/topbar) |
| `/sample/{slug}` | `SampleDetalleIsland` | Tarjeta grande + waveform + metadata + similares |
| `/coleccion/{slug}` | `ColeccionDetalleIsland` | Info colección + grid de samples (NUEVA) |
| `/comunidad` | `ComunidadIsland` | Feed posts sociales con diseño diferenciado (NUEVA) |
| `/descubrir` | `DescubrirIsland` | Algoritmo personalizado |
| `/perfil/{username}` | `PerfilIsland` | Perfil público |
| `/libreria` | `LibreriaIsland` | Colecciones, descargas, favoritos |
| `/mensajes` | `MensajesIsland` | Vista completa de conversaciones |
| `/planes` | `PlanesIsland` | Checkout Stripe |
| `/reproductor` | `ReproductorIsland` | Player completo |
| `/auth/login` | `LoginIsland` | Login |
| `/auth/registro` | `RegistroIsland` | Registro |
| `/admin/dashboard` | `DashboardCreadorIsland` | Stats creador |

**Eliminadas:** `/perfil/editar` (ahora ModalConfiguracion), tabs de InicioIsland (reemplazadas por ordenamientos).  
**Chat flotante:** tipo Messenger en esquina inferior derecha, se abre desde modales de TopBar o /mensajes.

---

## Planes de Suscripción

| | Free | Pro ($9.99) | Premium ($19.99) |
|-|------|-------------|------------------|
| Descargas/día | 5 | 50 | Ilimitadas |
| Calidad | MP3 | WAV | WAV |
| Subida/mes | 10 | 100 | Ilimitada |
| Monetización | No | 70/30 | 80/20 |

---

## Completado (resumen)

**Fase 0 — Infra:** Schema BD 14 tablas, PostgresService.php, API REST `/kamples/v1/`, CSS variables+reset+tipografía+layout+11 componentes, logger.ts.

**Fase 1 — Auth:** LoginIsland, RegistroIsland (Google OAuth UI + credenciales), PerfilIsland (tabs/stats/badges), EditarPerfilIsland, AuthMiddleware.php, ConAutenticacion HOC, LandingPublica, auth bridge PHP→React (GLORY_CONTEXT fix).

**Fase 2 — Samples:** SamplesIsland (filtros+paginación), SampleDetalleIsland (waveform+metadata+similares), WaveformPlayer (Canvas, seek, simétrico), ReproductorGlobal (floating persistente, cola), ReproductorIsland (pantalla completa, drag reorder). Reproducción local por tarjeta con waveform real (Web Audio API), exclusiva entre tarjetas. Sistema descargas UI+mock. Menú contextual samples.

**Fase 3 — Algoritmo (parcial):** DescubrirIsland (3 secciones, likes, menú contextual, mock). Endpoints feed/notificaciones/mensajes/dashboard.

**Fase 4 — Social:** BotonFollow, BotonLike (animación), ModalPublicar (modo dual), TarjetaPublicacion, InicioIsland (feed unificado+tags±), ListaComentarios, reposts.

**Fase 5 — Colecciones:** LibreriaIsland (4 tabs), apiColecciones CRUD, ModalColeccion, TarjetaColeccion, coleccionPicker, ModalSeleccionColeccion.

**Fase 6 (parcial):** DashboardCreadorIsland (stats, gráfica, tabs, apiPagos mock).

**Fase 7 (parcial):** MensajesIsland (búsqueda, indicadores, badges), ChatIsland (burbujas, agrupado, envío optimista), NotificacionesIsland (filtros, mark-read).

**UI/UX (C1-C25):** Home/Explorar/Descubrir unificados, ModalCrear unificado, Sidebar limpio, filtros ModalFiltros, tags ±, contadores TarjetaSample, waveform real+espejo, reproductor flotante, mock fallback, audios demo, seek waveform, tags horizontal.

**UI/UX (C26-C31):** Fix GloryLogger::debug→info, imágenes aleatorias colors/ en TarjetaSample (portada con overlay play/pause), dropdowns modales en TopBar para notificaciones y mensajes (ya no navegan a páginas), LibreriaIsland reestructurada con tabs en TopBar via tabsTopBarStore + gap consistente con InicioIsland, TarjetaColeccion rediseñada como card vertical con imagen (grid-friendly, fallback colors/), tab "Explorar" colecciones públicas de otros usuarios con mock data.

**Refactoring (R1):** Bug fix wsService.ts handler comodín. ShowcaseIsland dividido en 4 sub-componentes. ModalCrear: lógica drag&drop extraída a hook useArchivosDragDrop. SubirModal dividido en PasoMetadata + PasoSubida. useWebSocket simplificado como wrapper de wsService. imagenesColor y mockSamples datos separados. SubirIsland.tsx eliminado (dead code). BienvenidaIsland convertido en flujo onboarding 3 pasos. Fix doble slash apiCliente.

**UI/UX (C32-C41):** Fix "Usuario no encontrado" en /perfil/ (fallback authStore si API falla para perfil propio). ModalFiltros tamano="pequeno" (400px). Todas las islas registran tabs en TopBar (Inicio, Comunidad, Colección, Sample, Explorar). ModalCrear: eliminado texto IA y "Click para previsualizar", waveform con progreso animado (crearWaveformBarraActiva). Avatar: normalización src vacío→null, fallback a iniciales con onError. InicializadorAuth: normalización avatarUrl vacío→null. FeedUnificado: caché por tipo de ordenamiento (ref), invalidación en like. Tags: ordenados por frecuencia, expansibles (12 colapsados → expandir todos), botón +N. tagUtils.ts: normalización tags (sinónimos en/es, plural→singular, categorización, similitud Jaccard). SampleDetalleIsland: slug dinámico desde URL SPA (no solo prop PHP). TarjetaSample: título clickeable→navegar a /sample/{slug}/. Sidebar: agregados Explorar (Compass) y Comunidad (Users). MAPA_RUTAS: agregadas rutas /comunidad, /explorar, /descubrir, /sample, /coleccion, /mensajes, /planes. ModalConfiguracion: fix campos vacíos — useEffect sincroniza al abrir.

**UI/UX (C42-C52):** Fix SPA navigation ROOT CAUSE — `buscarRutaEnMapa()` prefix matching en navigationStore (rutas dinámicas como `/perfil/john/` → match `/perfil/`). Ordering UI: dropdown desplegable con ArrowDownWideNarrow + menú contextual (ya no 3 botones separados), contador izquierda + botones derecha. Botón crear (+) en TopBar junto a notificaciones. Input búsqueda centrado (flex 0 1 360px, margin auto). PerfilIsland: mockup content (portada, metadata Colombia/2024/link, publicaciones mock), username extraído de rutaActual en SPA. ModalConfiguracion: redesign completo con panel lateral (Perfil/Cuenta/Notificaciones/Apariencia), overlay propio (sin componente Modal), 720px. Middle-click: TarjetaSample título + Sidebar items convertidos de `<button>` a `<a href>` para soporte nativo de nueva pestaña. Explorar eliminado (Sidebar, LayoutPrincipal, pages.php, appIslands). Colecciones: onClick en LibreriaIsland para navegar a `/coleccion/{id}/`. Tags: responsivos (TAGS_COLAPSADOS según viewport), agrupados por categoría cuando expandidos (Tipo/Género/Instrumento/Sentimiento/Tags) con títulos y listas wrap.

**UI/UX (C53-C59):** Dropdown ordenamiento plano: 4 opciones (Inteligente, Recientes, Top Semanal, Top Mensual) sin sub-menú. Infinite scroll con IntersectionObserver (rootMargin 200px) + virtualización DOM (MAX_RENDERIZADOS=50, spacer divs). Fix imagenesColor guard `Number.isFinite(id)` para evitar `colors/undefined`. Fix SampleDetalleIsland filter crash con try/catch + `Array.isArray` check. ModalConfiguracion conectado a `PUT /kamples/v1/me` + persist authStore. MenuContextual renderiza `<a href>` para items con URL (middle-click abre nueva pestaña nativo). DropdownMensajes abre ChatFlotante con `abrirChat()` en vez de navegar a /mensajes. TarjetaSample onClick en div externo reproduce audio. ComunidadIsland sin reproductor global (solo audio local).

**UI/UX (C60-C63):** Fix infinite scroll duplicados: paginación mock en `obtenerFeed` + deduplicación por id en `cargarSamples`. Fix `PUT /me` acepta `nombreVisible` (no solo `nombreDisplay`) + campo `portadaUrl`. ModalConfiguracion: portada editable (cover photo) con preview, `ImagePlus` botón, input file. SampleDetalleIsland rediseñado: hero con imagen de fondo + waveform overlay + botón play 56px, creador navegable con avatar/nombre/@username + BotonFollow, like con API real, similares con like/menú contextual/navegación, campo Tipo visible, estadísticas con texto.

---

## Pendientes por Fase

### FASE 0 — Infraestructura y Base
> Prioridad: ALTA — desbloquea algoritmo, uploads, y IA

- [ ] **0.1** Instalar pgvector en PostgreSQL local (ya tenemos PG en 127.0.0.1:5432)
  - Crear extensión `vector` en BD `kamples`
  - Crear tabla de embeddings (sample_id, embedding vector(1536))
  - Verificar que PostgresService.php conecta correctamente
- [x] **0.2** Almacenamiento audio en WordPress ✓ (IMPLEMENTADO)
  - Endpoint `POST /kamples/v1/samples/upload` con `wp_handle_upload()`
  - Estructura: `kamples/{user_id}/{Y}/{m}/{archivo}`
  - Validación MIME (wav, mp3, flac, aiff, ogg, m4a) + max 50MB
  - INSERT en PostgreSQL con slug generado (MD5 suffix), estado 'procesando'
  - TO-DO: htaccess deny direct access, servir via PHP con validación de permisos
- [ ] **0.3** Pipeline de procesamiento audio
  - Al subir: guardar original WAV/FLAC
  - Generar versión optimizada MP3 (ffmpeg o librería PHP)
  - Generar preview corto (30s max, MP3 128kbps)
  - Generar peaks/waveform JSON (Web Audio API server-side o ffmpeg)
  - Todo esto debe ejecutarse en background (WP Cron o Action Scheduler)
  - NO debe bloquear la UI de subida
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

- [ ] **2.1** Upload real de samples
  - Conectar ModalCrear/SubirModal al endpoint POST /kamples/v1/samples
  - Validar formato, tamaño, duración en frontend y backend
  - Subir vía FormData (multipart), mostrar progreso real
  - Guardar en WordPress uploads + registrar en PostgreSQL
  - Al subir en ModalCrear: mostrar waveform del audio adjunto con reproducción
- [ ] **2.2** Análisis de audio con IA (Gemini multi-modelo con fallback)
  - **Cadena de fallback:** Gemini Flash 3.0 → Gemini Pro 2.5 → Gemini Flash 2.5 → Gemini Flash 2.0
  - Si un modelo retorna error 429 (cuota), cambiar al siguiente automáticamente
  - **Input para la IA:** archivo de audio + nombre del archivo + descripción del usuario
  - **Output esperado (JSON):** tags[], instrumentos[], bpm (número), key, escala, genero[], sentimiento[], artistas_relevantes[], tipo (loop/oneshot/fx/vocal/stem), descripcion_generada
  - Parser flexible: la IA a veces no retorna JSON válido → extraer con regex, limpiar, reintentar
  - Proceso 100% en background: NO bloquear la subida ni la UI
  - Endpoint PHP que recibe el audio, llama a Gemini API, parsea respuesta, guarda en PostgreSQL
  - Usar GOOGLE_GEMINI_API key del .env
- [ ] **2.3** Metadata de imágenes con Groq
  - Al subir imágenes en publicaciones, enviar a Groq API para generar metadata
  - Tags visuales, descripción, contenido relevante
  - Proceso en background, no bloquear subida
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
- [ ] **2.6** Nombrado automático de archivos con IA
  - Al subir audio, la IA genera un nombre estandarizado además de los metadatos
  - Formato: `kamples_{tipo}_{genero}_{usuario}_{idCorto}.wav`
  - Ejemplo: `kamples_kick_hip_hop_Wandorius_1FK4433.wav`
  - El nombre generado se usa como slug y nombre de descarga
  - El usuario puede editar el nombre antes de publicar, pero el formato sugerido es el estándar
- [ ] **2.7** IDs únicos cortos para samples
  - Cada sample recibe un ID corto alfanumérico (ej: `1FK4433`) generado al subir
  - Las URLs deben encontrar samples por ID además de por slug: `/sample/1FK4433` o `/sample/{slug}`
  - Lookup dual: primero buscar por slug, si no existe buscar por ID corto
  - El ID se incluye en el nombre del archivo y en la URL como identificador primario
- [ ] **2.8** Deduplicación de audio por fingerprint
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

- [ ] **7.1** Stripe Billing
  - Checkout session para suscripciones Pro/Premium
  - Webhooks: customer.subscription.created, updated, deleted
  - Customer portal para gestionar suscripción
- [ ] **7.2** PlanesIsland funcional
  - Conectar botones CTA a Stripe Checkout real
  - Mostrar plan actual del usuario
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
- [ ] Eliminar inline styles del ShowcaseIsland (ShowcaseEspaciados, ShowcaseFormularios, ShowcaseOverlays)
- [ ] Convertir todos los style={{ }} a clases CSS reales (excepto los dinámicos de Espaciados que muestran tamaño real)

---

## Notas y Decisiones

1. **Almacenamiento:** WordPress uploads para local y VPS. Sin Nginx por ahora, servir con PHP.
2. **IA:** Google Gemini API key lista en .env. Cadena de fallback por cuota: Flash 3.0 → Pro 2.5 → Flash 2.5 → Flash 2.0. Groq para imágenes.
3. **Stripe:** Keys live en .env (PRECAUCIÓN — usar test keys para desarrollo, mover live a producción).
4. **Google OAuth:** Keys vacías, preparar integración lista para activar.
5. **WebSocket:** Implementar servidor local primero, migrar a Bun en VPS después.
6. **Chat:** Flotante tipo Messenger + /mensajes como vista completa. Soporta: texto, imágenes, audio, samples compartidos.
7. **Filtros:** Toggle on/off simples, no selects complejos. Ordenamientos: Inteligente, Recientes, Top Semanal, Top Mensual (dropdown plano, sin sub-menús).
8. **BPM:** Mantener número crudo en BD + campo normalizado (muy lento/lento/normal/rápido/muy rápido).
9. **ModalCrear:** SIN campos manuales de BPM/Key/Tipo — la IA los genera automáticamente. Mostrar waveform + reproducción. Iconos de condiciones (descarga sí/no, etc.).
10. **Colors/:** Lectura dinámica del directorio, no hardcodeado. Optimización de imágenes.
11. **Naming IA:** Al subir audio, la IA genera nombre estandarizado: `kamples_{tipo}_{genero}_{usuario}_{idCorto}.wav`. IDs únicos cortos alfanuméricos para cada sample, URLs soportan lookup por ID o slug.
12. **Explorar eliminado:** La búsqueda y descubrimiento se hace desde InicioIsland (feed principal). Página `/explorar` removida.
13. **Deduplicación audio:** Hash perceptual ligero (primeros+últimos 4s) diferido en background. Duplicados del mismo usuario permitidos, entre usuarios distintos → supervisión. Sistema de reportes con disputa y pruebas. Tabla `reportes_duplicados` planificada.
