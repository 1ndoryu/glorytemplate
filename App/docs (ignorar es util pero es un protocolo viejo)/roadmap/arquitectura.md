# Kamples — Arquitectura y Producto

> **Versión:** 4.1 | **Última actualización:** 26/02/2026 | **Stack:** Glory Framework (WP + React Islands + TS) | **Competencia:** Splice

## Visión

Plataforma de samples con alma de red social. Algoritmo de descubrimiento multi-señal (6 factores), marketplace híbrido (suscripción + venta directa + revenue share), análisis IA (Groq Whisper + LLM), app desktop Tauri 2.0 con drag-to-DAW, waveforms interactivos.

## Arquitectura

- **BD:** PostgreSQL + pgvector (JSONB metadata, embeddings 128d HNSW coseno) | **Storage:** WP uploads (WAV→MP3→waveform→preview) | **WS:** Node/Bun local (→VPS) | **IA:** Groq Whisper (large-v3-turbo) + LLM (qwen3-32b) | **Desktop:** Tauri 2.0 | **Móvil:** Capacitor | **Pagos:** Stripe Connect+Billing (keys live)
- **Algoritmo:** Similitud Audio (0.28, pgvector) | Comportamiento (0.27) | Contexto (0.15) | Tendencias (0.12) | Grafo Social (0.10) | Novedad (0.08) + penalizaciones progresivas + serendipia + saturación popularidad

## Páginas

| Ruta | Isla | Descripción |
|---|---|---|
| `/` | `InicioIsland` | Feed + filtros toggle + ordenamientos |
| `/` (deslogueado) | `LandingPublica` | Landing nav flotante (sin sidebar/topbar) |
| `/sample/{slug}` | `SampleDetalleIsland` | Tarjeta + waveform + metadata + similares |
| `/coleccion/{slug}` | `ColeccionDetalleIsland` | Info colección + grid samples |
| `/comunidad` | `ComunidadIsland` | Feed posts sociales |
| `/publicacion/{id}` | `PublicacionIsland` | Detalle publicación + comentarios |
| `/descubrir` | `DescubrirIsland` | Algoritmo personalizado |
| `/perfil/{username}` | `PerfilIsland` | Perfil público |
| `/libreria` | `LibreriaIsland` | Explorar colecciones + mis colecciones |
| `/descargas` | `DescargasIsland` | Mis descargas + sugerencias |
| `/favoritos` | `FavoritosIsland` | Mis favoritos + sugerencias |
| `/mensajes` | `MensajesIsland` | Conversaciones completas |
| `/planes` | `PlanesIsland` | Checkout Stripe |
| `/reproductor` | `ReproductorIsland` | Player completo |
| `/auth/login` | `LoginIsland` | Login |
| `/auth/registro` | `RegistroIsland` | Registro |
| `/admin/dashboard` | `DashboardCreadorIsland` | Stats creador |
| `/admin/panel` | `AdminPanelIsland` | Panel admin (KPIs, usuarios, moderación) |
| `/explorador` | `ExploradorIsland` | Árbol carpetas + coleccionados backend |

**Eliminadas:** `/perfil/editar` (→ModalConfiguracion), tabs InicioIsland (→ordenamientos). Chat flotante tipo Messenger.

## Planes de Suscripción

| | Free | Pro ($5) | Premium ($19.99) |
|---|---|---|---|
| Descargas/día | 5 | 50 | Ilimitadas |
| Calidad | WAV | WAV | WAV |
| Subida/mes | Ilimitada | Ilimitada | Ilimitada |
| Monetización | 50/50 | 70/30 | 80/20 |

---

## Notas Compactas

- **Storage:** WP uploads local+VPS. **IA:** Groq 100%. **Stripe:** keys live .env. **WS:** Local→Bun VPS. **FFmpeg:** winget v8.0.1 .env.
- **Chat:** Flotante Messenger + /mensajes (texto/imágenes/audio/samples). **Filtros:** Toggle. Orden: Inteligente/Recientes/Top Semanal/Mensual.
- **ModalCrear:** Sin BPM/Key/Tipo manuales (IA). **Naming:** `kamples_{tipo}_{genero}_{usuario}_{idCorto}.wav`. **Dedup:** Hash perceptual diferido.
- **Precios sincronizados en:** StripeService, PlanesIsland, LandingPublica, roadmap.
