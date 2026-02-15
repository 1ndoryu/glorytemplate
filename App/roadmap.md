# Kamples — Roadmap Integral de Producto

> **Versión:** 1.1  
> **Última actualización:** 15/02/2026  
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

- **PostgreSQL + pgvector** paralelo a WordPress MySQL — JSONB para metadata, embeddings para similitud
- **Almacenamiento VPS** — Pipeline: original(.wav) → optimizado(.mp3) → waveform(.json) → preview(.mp3), Nginx X-Accel-Redirect
- **Bun WebSocket** — Canales: mensajes, notificaciones, sync, feed
- **Desktop:** Tauri 2.0 | **Móvil:** Capacitor | **Pagos:** Stripe Connect + Billing

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
| `/` | `InicioIsland` | Feed tabs + tags + filtros |
| `/sample/{slug}` | `SampleDetalleIsland` | Waveform, metadata, similares |
| `/descubrir` | `DescubrirIsland` | Algoritmo personalizado |
| `/perfil/{username}` | `PerfilIsland` | Perfil público |
| `/perfil/editar` | `EditarPerfilIsland` | Config perfil |
| `/libreria` | `LibreriaIsland` | Colecciones, descargas, favoritos |
| `/mensajes` | `MensajesIsland` | Conversaciones |
| `/planes` | `PlanesIsland` | Checkout Stripe |
| `/reproductor` | `ReproductorIsland` | Player completo |
| `/auth/login` | `LoginIsland` | Login |
| `/auth/registro` | `RegistroIsland` | Registro |
| `/admin/dashboard` | `DashboardCreadorIsland` | Stats creador |

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

**Fase 2 — Samples:** SubirIsland (DropZone+metadata+progreso), SamplesIsland (filtros+paginación), SampleDetalleIsland (waveform+metadata+similares), WaveformPlayer (Canvas, seek, simétrico), ReproductorGlobal (floating persistente, cola), ReproductorIsland (pantalla completa, drag reorder). Reproducción local por tarjeta con waveform real (Web Audio API), exclusiva entre tarjetas. Sistema descargas UI+mock. Menú contextual samples.

**Fase 3 — Algoritmo (parcial):** DescubrirIsland (3 secciones, likes, menú contextual, mock). Endpoints feed/notificaciones/mensajes/dashboard.

**Fase 4 — Social:** BotonFollow, BotonLike (animación), ModalPublicar (modo dual), TarjetaPublicacion, InicioIsland (feed unificado+tags±), ListaComentarios, reposts.

**Fase 5 — Colecciones:** LibreriaIsland (4 tabs), apiColecciones CRUD, ModalColeccion, TarjetaColeccion, coleccionPicker, ModalSeleccionColeccion.

**Fase 6 (parcial):** DashboardCreadorIsland (stats, gráfica, tabs, apiPagos mock).

**Fase 7 (parcial):** MensajesIsland (búsqueda, indicadores, badges), ChatIsland (burbujas, agrupado, envío optimista), NotificacionesIsland (filtros, mark-read).

**UI/UX (C1-C25):** Home/Explorar/Descubrir unificados, ModalCrear unificado, Sidebar limpio, filtros ModalFiltros, tags ±, contadores TarjetaSample, waveform real+espejo, reproductor flotante, mock fallback, audios demo, seek waveform, tags horizontal.

**UI/UX (C26-C31):** Fix GloryLogger::debug→info, imágenes aleatorias colors/ en TarjetaSample (portada con overlay play/pause), dropdowns modales en TopBar para notificaciones y mensajes (ya no navegan a páginas), LibreriaIsland reestructurada con tabs en TopBar via tabsTopBarStore + gap consistente con InicioIsland, TarjetaColeccion rediseñada como card vertical con imagen (grid-friendly, fallback colors/), tab "Explorar" colecciones públicas de otros usuarios con mock data.

---

## Pendientes por Fase

### FASE 0 — Infraestructura
- [ ] **0.1** PostgreSQL en VPS + pgvector
- [ ] **0.5** Almacenamiento audio VPS (directorios + permisos)
- [ ] **0.6** Pipeline procesamiento audio (upload → optimize → waveform → preview)
- [ ] **0.7** Nginx X-Accel-Redirect

### FASE 1 — Auth
- [ ] **1.1** Google OAuth real (WordPress)
- [ ] **1.2** Registro backend completo
- [ ] **1.3** Auto-creación `usuarios_ext` en Postgres

### FASE 2 — Samples
- [ ] **2.1** Pipeline upload (validación, compresión, peaks server-side)
- [ ] **2.2** Gemini Flash (metadata, BPM, key, embedding, descripción IA)

### FASE 3 — Algoritmo v1
- [ ] **3.1** pgvector similitud (HNSW)
- [ ] **3.2** Señal comportamiento
- [ ] **3.3** Señal tendencias (time-windowed)
- [ ] **3.4** Señal novedad
- [ ] **3.5** Función SQL scoring combinado (< 100ms / 100k)
- [ ] **3.7** Redis cache feeds
- [ ] **3.8** Señal grafo social en algoritmo

### FASE 6 — Monetización
- [ ] **6.1** Stripe Billing (checkout, webhooks, portal)
- [ ] **6.2** PlanesIsland (comparativa + CTA)
- [ ] **6.3** Stripe Connect (onboarding, revenue share)
- [ ] **6.4** Samples premium (compra + plan)
- [ ] **6.6** Límites por plan

### FASE 7 — Tiempo Real
- [ ] **7.1** Bun WebSocket (auth JWT, canales, heartbeat)
- [ ] **7.4** Notificaciones en tiempo real (push, bell counter)
- [ ] **7.6** Sync reproductor entre tabs

### FASE 8 — Desktop (Tauri 2.0)
- [ ] Setup monorepo, auth OAuth, sync librería, drag-to-DAW, piano virtual, offline, tray icon

### FASE 9 — Móvil (Capacitor)
- [ ] UI móvil, push notifications, background playback, offline cache

### FASE 10 — Algoritmo v2
- [ ] Contexto DAW, collaborative filtering, user embeddings, A/B testing, spectrograma mel

### FASE 11 — SEO/Performance/Hardening
- [ ] Meta/OG/JSON-LD, code splitting, brotli, rate limiting, CSP, tests

---

## Notas Pendientes

1. Color acento: confirmar púrpura `#7c3aed` o cian
2. Nombre definitivo: "Kamples"
3. Dominio y hosting/VPS
4. Política visibilidad (público vs semi-privado)
5. Moderación contenido / licencia royalty-free
6. Flujo onboarding primer uso
7. pgvector en PostgreSQL local/VPS
