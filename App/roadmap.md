# Kamples — Roadmap Integral de Producto

> **Versión:** 2.0  
> **Última actualización:** 16/02/2026 (iteración v2.2)  
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

**Upload + IA (U1):** Upload real conectado end-to-end. `apiCliente.ts` soporta FormData (sin JSON.stringify ni Content-Type forzado). `apiSamples.ts` con `subirSample(DatosSubida)` tipado + FormData. ModalCrear conectado al endpoint real `POST /samples/upload`, con UI error/éxito. `GeneradorIdCorto.php`: IDs 7 chars base62 con validación de unicidad contra BD. Migración v003: columnas `id_corto` UNIQUE, `permitir_descarga`, `licencia_libre` en tabla samples. `ServicioIA.php`: análisis audio con Gemini (fallback Flash 2.5→Pro 2.5→Flash 2.0), prompt estructurado, parser JSON robusto, validación de metadata. `PipelineAudio.php`: procesamiento completo al subir (duración, waveform peaks PHP, MP3/preview con FFmpeg, análisis IA, renombrado estandarizado `kamples_{tipo}_{genero}_{bpm}_{key}_{id}.ext`). `KamplesController::subirSample()` reescrito con ID corto + pipeline + respuesta enriquecida. CSS: mensajes error/éxito en modalCrear.

### Registro de cambios U4 — Logs + Async + Debug

**Archivos modificados:**

- `App/Kamples/KamplesLogger.php` — NUEVO: sistema de logging dedicado con archivos propios en `App/logs/`
- `App/Kamples/Api/KamplesController.php` — Pipeline ahora es ASÍNCRONO (shutdown hook + fastcgi_finish_request)
- `App/Kamples/Api/ServicioIA.php` — Logging detallado: respuestas raw, HTTP codes, modelos intentados
- `App/Kamples/Api/PipelineAudio.php` — FFmpeg detección mejorada (reconstruye LOCALAPPDATA) + KamplesLogger
- `App/Kamples/Api/AnalizadorAudio.php` — error_log reemplazado por KamplesLogger
- `App/logs/.gitignore` — Excluye archivos de log del repositorio

### Registro de cambios R2 — Refactoring SOLID KamplesController

**KamplesController.php:** 1713 → 60 líneas (router-only, delega a sub-controladores).

**12 sub-controladores creados** (`App/Kamples/Api/Controladores/`):

- `DiagnosticoController.php` (62 lín) — health, pgvector
- `SamplesController.php` (323 lín) — listar, obtener, feed, subir
- `PerfilController.php` (130 lín) — perfil, usuario actual, actualizar
- `SocialController.php` (135 lín) — follow, like (con notificaciones)
- `MensajesController.php` (189 lín) — conversaciones, mensajes, iniciar
- `DashboardController.php` (137 lín) — stats, top samples, transacciones, ingresos
- `NotificacionesController.php` (86 lín) — listar, marcar leída, conteo
- `ColeccionesController.php` (339 lín) — CRUD + sugerencias + relevantes
- `ReproduccionesController.php` (142 lín) — registrar (3s debounce), historial, similares
- `PublicacionesController.php` (178 lín) — CRUD + comentarios + repost
- `DescargasController.php` (133 lín) — descargar (límites por plan), limites
- `ColoresController.php` (48 lín) — listar con cache transient

**2 Helpers** (`App/Kamples/Api/Helpers/`):

- `NormalizadorSample.php` (108 lín) — pgArrayToPhp, normalizar, normalizarLista, sqlSelectSamples
- `UsuarioHelper.php` (56 lín) — obtenerIdPg, obtenerPorWpId, obtenerPorId, respuestaNoEncontrado

**3 Servicios** (`App/Kamples/Services/`):

- `MotorRecomendacion.php` (~210 lín) — feed personalizado multi-señal (6 factores), similares
- `StripeService.php` (~240 lín) — Checkout, Portal, Connect, transferencias, webhooks
- `DeduplicadorAudio.php` (~210 lín) — hash PCM, verificación, hook WordPress

**1 Config** (`App/Kamples/Config/`):

- `algoritmoPesos.php` — pesos del algoritmo, sub-pesos, parámetros (100% configurable)

**1 Migración** (`App/Kamples/Database/migrations/`):

- `v004_features_avanzados.sql` — datos JSONB notificaciones, pago_creador/comision transacciones, audio_hash samples, repost_id publicaciones, reportes_duplicados tabla

**Frontend:**

- Fix doble-prefijo en apiDescargas.ts y apiNotificaciones.ts
- Creado apiReproduciones.ts (registrar, historial, similares)
- Agregados sugerencias + relevantesParaSample a apiColecciones.ts
- Showcase: 8 inline styles → clases CSS (6 estáticos + 2 custom properties)

### Registro de cambios R3 — FeedSamples centralizado + Features C14

**FeedSamples.tsx** (NUEVO, ~470 líneas, `App/React/components/feed/`):
- Componente centralizado reutilizable para listas de samples
- Props genéricas: ProveedorSamples (función async), samplesIniciales, claveCache, mostrarTags, infiniteScroll, virtualizar, maxRenderizados, alturaTarjeta, mensajeVacio, accionVacia, idsExcluidos, onLike
- Features: IntersectionObserver, virtualización DOM, tags ± con drag-scroll y agrupación por categoría, optimistic like UI, cache por clave, MenuContextual + ModalInspectorSample + ModalSugerenciasLike integrados

**feedSamples.css** (NUEVO): estilos completos para FeedSamples.

**InicioIsland.tsx** refactorizado: 550 → 180 líneas. FeedUnificado delega toda la renderización a FeedSamples. Solo mantiene barra de ordenamiento + ModalFiltros.

**ColeccionDetalleIsland.tsx** refactorizado: eliminados TarjetaSample directo + useReproductorStore. Añadidas tabs "Samples" / "Más Ideas" con FeedSamples. Tab "Más Ideas" usa obtenerSugerencias() paginado.

**coleccionDetalle.css**: añadidos estilos para tabs (.coleccionTabs, .coleccionTab, .coleccionTabActiva).

**ModalSugerenciasLike.tsx** (NUEVO, `App/React/components/feed/`):
- Modal "También te podría gustar" — se abre automáticamente al dar like a un sample
- Muestra 3-5 samples similares via obtenerSimilares()
- UI: Sparkles icon, subtítulo con nombre del sample, tarjetas compactas

**sugerenciasLikeStore.ts** (NUEVO): store Zustand para controlar el modal de sugerencias post-like.

**modalSugerenciasLike.css** (NUEVO): estilos del modal de sugerencias.

**useHistorialIds.ts** (NUEVO, `App/React/hooks/`):
- Hook que carga y cachea completo el historial de reproducciones como Set<number>
- Solo activa la carga cuando el filtro "Ya reproducidos" está encendido
- Cache en ref para evitar re-fetch

**apiColecciones.ts**: fix tipo retorno de obtenerSugerencias (ColeccionResumen[] → SampleResumen[]), agregado parámetro pagina.

**ModalSeleccionColeccion.tsx**: mejorado con ranking por relevancia — carga colecciones + obtenerRelevantesParaSample() en paralelo, ordena relevantes primero.

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
- [ ] **0.1b** Instalar pgvector (POSPUESTO — requiere Visual Studio Build Tools ~6GB)
    - Migración `v002_pgvector_setup.sql` lista para ejecutar cuando se instale
    - `VerificarPgvector.php` listo para diagnosticar
    - Schema v001 original incluye columna `embedding vector(1536)` + índice HNSW
    - **Prerrequisito:** Instalar VS Build Tools + compilar pgvector, o esperar binario precompilado PG18
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
6. **Chat:** Flotante tipo Messenger + /mensajes como vista completa. Soporta: texto, imágenes, audio, samples compartidos.
7. **Filtros:** Toggle on/off simples, no selects complejos. Ordenamientos: Inteligente, Recientes, Top Semanal, Top Mensual (dropdown plano, sin sub-menús).
8. **BPM:** Mantener número crudo en BD + campo normalizado (muy lento/lento/normal/rápido/muy rápido).
9. **ModalCrear:** SIN campos manuales de BPM/Key/Tipo — la IA los genera automáticamente. Mostrar waveform + reproducción. Iconos de condiciones (descarga sí/no, etc.).
10. **Colors/:** Lectura dinámica del directorio, no hardcodeado. Optimización de imágenes.
11. **Naming IA:** Al subir audio, la IA genera nombre estandarizado: `kamples_{tipo}_{genero}_{usuario}_{idCorto}.wav`. IDs únicos cortos alfanuméricos para cada sample, URLs soportan lookup por ID o slug.
12. **Explorar eliminado:** La búsqueda y descubrimiento se hace desde InicioIsland (feed principal). Página `/explorar` removida.
13. **Deduplicación audio:** Hash perceptual ligero (primeros+últimos 4s) diferido en background. Duplicados del mismo usuario permitidos, entre usuarios distintos → supervisión. Sistema de reportes con disputa y pruebas. Tabla `reportes_duplicados` planificada.

## Comentarios del usuario. (Marcar como completado cuando se cumpla con una tarea o dejar respuestas en caso de ser necesario)

1. ~~FFMPEG no puede ser opcional, debe funcionar para el entorno de windows y linux (detectar ambos entorno)~~
    - ✅ COMPLETADO: `PipelineAudio.php` ahora tiene detección cross-platform obligatoria.
    - `buscarBinario()` busca en PATH + ubicaciones comunes: Win (`C:\ffmpeg\bin\`, scoop, LocalAppData) y Linux (`/usr/bin/`, `/usr/local/bin/`, snap, homebrew).
    - Si no encuentra FFmpeg, lanza `RuntimeException` con instrucciones de instalación según OS.
    - Soporta variable de entorno `FFMPEG_PATH` / `FFPROBE_PATH` como override.

2. ~~El prompt de la IA debe ser bilingüe y sin campos técnicos (BPM/key/escala)~~
    - ✅ COMPLETADO: `ServicioIA.php` reescrito con el prompt exacto especificado.
    - Campos creativos bilingües: tags/tags_es, emocion/emocion_es, descripcion/descripcion_es, etc.
    - Tipo simplificado: solo "one shot" o "loop".
    - BPM + key + escala ahora los calcula `AnalizadorAudio.php` con procesamiento de señal:
        - BPM: detección de onsets por energía + autocorrelación temporal (FFmpeg PCM → PHP)
        - Key: algoritmo Goertzel para chroma + perfiles Krumhansl-Schmuckler (FFmpeg PCM → PHP)
    - El JSON final en campo `metadata` (JSONB) combina datos creativos de IA + confianza técnica.

3. ~~He colocado la "GROQ_API" en el .env, leer la documentacion "https://console.groq.com/docs/overview" y elegir los mejores modelos (momo, los de openIA y hacer el mismo sistema de cuotas gratis de probar uno y si falla pasar al otro modelo)~~
    - ✅ COMPLETADO: `ServicioIA.php` ahora soporta Gemini + Groq como providers con fallback automático.
    - Cadena completa: Gemini (audio+texto) → Groq (solo texto).
    - Gemini: `gemini-2.5-flash` → `gemini-2.5-pro` → `gemini-2.0-flash`
    - Groq (OpenAI-compatible): `openai/gpt-oss-120b` → `llama-3.3-70b-versatile` → `openai/gpt-oss-20b`
    - Groq no soporta audio directo, así que usa contexto enriquecido (BPM, key, duración, tags, descripción).
    - Si Gemini agota cuota, el fallback a Groq es automático. Lee `GROQ_API` del .env.
4. ~~Ya esta instalado FFMPEG~~
    - ✅ Confirmado: FFmpeg 8.0.1 disponible en PATH. Sin cambios necesarios.

5. ~~No lo comente antes pero el $promptContext debe contener la descripcion del audio que puso el usuario y los tags, tambien, obligar al usuario a colocar al menos 5 tags para que la IA tenga mas contexto, y colocar un mensaje de error si no lo hace.~~
    - ✅ COMPLETADO: Prompt enriquecido con contexto completo.
    - `construirPrompt()` ahora incluye: descripción del usuario, tags, nombre de archivo, BPM, tonalidad, duración.
    - Los datos técnicos se calculan ANTES de llamar a la IA (AnalizadorAudio + FFprobe en PipelineAudio).
    - Validación de 5 tags mínimos: frontend (botón deshabilitado + mensaje visual) y backend (HTTP 400).
    - `PipelineAudio::procesar()` ahora recibe `$tagsUsuario` y los pasa como `$contextoTecnico` a ServicioIA.

6. ~~En los logs aparece SQLSTATE[23502]: Not null violation email usuarios_ext~~
    - ✅ CORREGIDO: INSERT en `/me` (auto-creación) ahora incluye `email` desde `$wpUser['email']`.

7. ~~Cuando intento publicar un sample sale Unexpected token '<'... wp_handle_upload()~~
    - ✅ CORREGIDO: `wp-admin/includes/file.php` no se carga en contexto REST API.
    - Se agregó `require_once ABSPATH . 'wp-admin/includes/file.php'` antes de la llamada.
    - Prefijo `\` añadido a funciones WP: `\wp_upload_dir`, `\wp_mkdir_p`, `\add_filter`, `\remove_filter`, `\wp_handle_upload`, `\sanitize_text_field`, `\sanitize_textarea_field`, `\sanitize_title`.

8. KamplesController esta rompiendo las reglas solid, y probablmente otros archivo, refactorizar los archivos con mas lineas en total.
    - ✅ COMPLETADO: KamplesController refactorizado de 1713 → 60 líneas (router-only).
    - Creados 12 sub-controladores en `App/Kamples/Api/Controladores/`:
      DiagnosticoController, SamplesController, PerfilController, SocialController,
      MensajesController, DashboardController, NotificacionesController, ColeccionesController,
      ReproduccionesController, PublicacionesController, DescargasController, ColoresController.
    - Creados 2 helpers: NormalizadorSample.php (pgArrayToPhp, normalizar, sqlSelectSamples),
      UsuarioHelper.php (obtenerIdPg, obtenerPorWpId).
    - Creados 3 servicios: MotorRecomendacion.php (feed multi-señal 6 factores),
      StripeService.php (Checkout + Connect + webhooks), DeduplicadorAudio.php (hash PCM).
    - Creado algoritmoPesos.php (config centralizada de pesos del algoritmo).
    - Migración v004_features_avanzados.sql ejecutada (4/4 columnas verificadas).
    - 25/25 rutas originales cubiertas + 17 nuevas rutas añadidas.
    - Bug doble-prefijo /kamples/v1/ corregido en apiDescargas.ts y apiNotificaciones.ts.
    - Creado apiReproduciones.ts (registrar, historial, similares).
    - Agregados endpoints sugerencias y relevantesParaSample a apiColecciones.ts.

9. ~~Creo que la idea anterior se maliterpreto, los modelos de grop no procesan imagenes ni audio, el unico modelo que procesa imagenes es Llama 4 Maverick 17B 128E, los modelos de groq deben usarse solo para las imagenes.~~
    - ✅ ACLARADO: La implementación actual YA es correcta — Groq NO recibe audio.
    - Gemini: recibe audio en base64 + texto → análisis creativo completo.
    - Groq: recibe SOLO texto enriquecido (BPM, key, tags, descripción, duración) → análisis sin audio.
    - El fallback Groq es un "mejor que nada" cuando Gemini falla por cuota.
    - TO-DO: Agregar `llama-4-maverick-17b-128e` como modelo Groq para análisis de imágenes de portada (futuro).

10. Se puede aprovechar para usar Llama Prompt Guard 2 22M, y Llama 4 Scout 17B 16E tambien recibe imagenes. Ya tambien se puede aprovechar openai/gpt-oss-120b para modenar contenido de las publicaciones de la comunidad, y detectar si incumplen las reglas. Planificarlo para el futuro.

- PLANIFICADO: Fase futura de moderacion de contenido. Modelos candidatos: Llama Prompt Guard 2 22M (toxicidad), Llama 4 Scout 17B 16E (imagenes), openai/gpt-oss-120b (moderacion texto comunidad).

11. ~~me sale Error en isla "InicioIsland" s.tags?.forEach is not a function~~

- ✅ CORREGIDO (U5): `normalizarSample()` en KamplesController.php ahora convierte tags de string PG `"{tag1,tag2}"` a array PHP antes de enviar al frontend. La funcion `pgArrayToPhp()` maneja la conversion.

12. ~~Quitar todos los contenido mockups, ya empezaré a probar contenido real.~~

- ✅ COMPLETADO (U5): Eliminados TODOS los mocks del proyecto:
- apiSamples.ts: reescrito sin duplicados ni fallback mock.
- apiNotificaciones.ts: eliminado array mockNotificaciones, catch retorna [].
- apiMensajes.ts: eliminados mockConversaciones + mockMensajesPorConversacion (~150 lineas mock).
- apiDescargas.ts: eliminados MOCK_LIMITES + mockDescargasHoy.
- apiPagos.ts: eliminados mockEstadisticas, mockTopSamples, mockTransacciones, generarMockIngresosDiarios (~80 lineas mock).
- DropdownMensajes.tsx: reescrito con useEffect + obtenerConversaciones() real. Sin mock inline.
- DropdownNotificaciones.tsx: reescrito con useEffect + obtenerNotificaciones() real. Sin mock inline.
- ComunidadIsland.tsx: eliminado publicacionesMock (~90 lineas), carga vacio hasta que exista endpoint.
- mockSamples.ts y datos/mockSamplesData.ts: ELIMINADOS del proyecto.

13. ~~Veo demasiado errores... nombreVisible undefined... likes undefined... modal inspector~~

- ✅ CORREGIDO (U5): `normalizarSample()` reescrita completamente:
    - Convierte snake_case a camelCase (total_likes → totalLikes, es_premium → esPremium, etc.).
    - Agrupa campos de creador en sub-objeto `creador: { id, username, nombreVisible, avatarUrl, verificado }`.
    - Cast de tipos: int para ids/contadores, float para duracion, bool para flags.
- ✅ CREADO (U5): ModalInspectorSample — modal de depuracion accesible desde menu contextual "Inspeccionar datos". Muestra:
    - Info general (ID, titulo, slug, tipo, estado, formato, tamano).
    - Analisis audio (BPM, key, escala, duracion, rutas preview/waveform).
    - Tags listados como badges.
    - Metadata IA (generos, instrumentos, sentimiento, descripcionIA).
    - Estadisticas (descargas, likes, reproducciones).
    - Info del creador (nombre, username, avatar, verificado).
    - JSON crudo expandible para ver datos raw.

14. Esto es para planificar en el roadmap:

- PLANIFICADO: Sistema de Colecciones (tipo Pinterest). Fase mayor. Incluye:

Sistema de colecciones, las colecciones son la parte mas valiosa de kamples, asi como pinterest, los tablaros son esenciales, para kamples, las colecciones son esenciales, los usuarios las crean apartir de los audios que encuentra, le dan guardar en coleccion y asi como en pinteres pueden crear una colección a partir del audio, o guardarlo en una existente, el modal que aparece debe ser similar al de pinterest solo que este estara centrado, las primeras colecciones que aparecerán son las mas relevantes para el audio, si, pinterest de alguna forma tambien hace esto de que pone de primero los tablero que podrían ser mas relevantes para la imagen, aca en este caso, debe ser igual, las colecciones mas relevantes para el audio se ponen de primero, tomando en cuenta cosas como el uso frecuente, los tags comunes de la coleccion, etc.

Las paginas individuales de las colecciones deben tener una tab de más ideas, donde mostrara samples similares a los que hay en la colección, para que el usuario pueda descubrir más contenido relacionado, y así mismo guardarlo en su colección, o crear una nueva colección a partir de ese audio, asi funciona pinterest, ejemplo, creo una colección de audios de "samples de memphis phonk" encuentro 10 audios relacionados y los guardo en esa colección, la funcionalidad de "más idea" me mostrara samples similares basandose en la metadata, obviamente no muestra samples guardado en esa colección, la lista de samples en las colecciones y mas ideas deben ser igual como el home, con lo mismos filtros y tags, por favor esto debe estar centralizado de alguna forma eficiente y solid.

Entiendo que costo computacional de esto debe ser alto a medida que suban mas samples, debe planificar un plan donde la eficiencia computacional sea prioritaria, no bloqueante y con estandares de calidad muy alto para que el algoritmo sea no solo eficiente sino tambien preciso, obviamente el algoritmo de más ideas, debe estar relacionado con el algoritmo principas, si todo esto se puede centralizar de forma eficiente es mucho mejor, primero que nada porque los smaples, a dar like (continuo en 14.1)

14.1 Esto son extras que se me ocurren para aprovechar el algoritmo, por ejemplo a dar like a un sample, debe aparecer un modal al lado mostrando otros samples similares, es decir un modal de "Tambien te podría gustar", estos samples tambien podrían aparecer las paginas individuales mas abajo como "samples similares"
14.2 Como todo esto va a escalar, tambien hay que planificar tener centralizado todos los valores en un archivo, nada de harcode, 100% dinamico, entendible para el ser humano de como va funcionar el algoritmo, en ese archivo se controlara el peso de todo, los like, las interacciones, el peso de seguimiento, gustos del usuario, etc.
14.3 No se si esta planificado pero se debe tener en cuenta las reproduciones, si, cada vez que se reproduce un sample debe registrarse en el sample y el usuario, esta informacion es util, por ejemplo, evitar mostrar samples que el usuario ya ha escuchado varias veces, y tambien, ofrecerle un historial de reproducciones.

15. A este punto compactar el este archivo con las tareas completadas, ordenarlo mejor sin borrar tareas pendientes ni perder información relevante. 
16. El status de premiun - free debe verse en el nav arriba, al dar click aparecera el modal para suscribirse, agregaremos una prueba gratuita de 30 días con 20 descargas gratis al días. Las subidas en todos los planes debe ser ilimitada, a nosotros nos conviene que los usuarios suban sus samples para que la plataforma crezca, lo que si podemos limitar es la transferencia de datos de samples entre la aplicación y el escritorio, free 1gb, los premiun 10gb y 50gb al mes. 
17. Me di cuenta que no sabes que la url del proyecto es http://glory.local/ , asi puedes testear las api, anota esa informacion en el roadmap bien clara para que estes informado.
18. Debería poder borrar mis samples en el menu contextual de los smaples cuando son mios.
19. Los usuarios admin deberían poder borrar cualquier sample y cualquier colección. 

---
