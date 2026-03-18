# Kamples — Roadmap

> **Descripcion:** Plataforma de samples de musica — descubrimiento, colecciones, DAW web, notificaciones y app movil.
> **Stack:** Glory Framework (WordPress + React Islands + TypeScript), Tauri (desktop), PostgreSQL, Redis, Bun (WebSocket)
> **URL produccion:** https://kamples.com
> **Servidor:** 66.94.100.241 — SSH: `ssh root@66.94.100.241`
> **Deploy:** Coolify via `.agent/coolify-manager-rs`
> **Coolify IDs:** ver `.agent/coolify-manager-rs` para UUIDs de servicios
> **Repositorio:** `1ndoryu/glorytemplate`, rama `main-kamples`

## Herramientas del agente
- Code Sentinel: `.agent/code-sentinel`
- VarSense: `.agent/varsense`
- Coolify Manager: `.agent/coolify-manager-rs`

## Documentacion legacy
Los siguientes archivos son documentacion pre-v4.0. No modificar ni mover sin instruccion del usuario.
Ubicacion: `App/docs (ignorar)/`
- `algoritmo.md` -- Algoritmo de descubrimiento (6 senales, embeddings 128d)
- `moderacion.md` -- Sistema de moderacion IA (4 capas)
- `monetizacion.md` -- Modelo freemium, Stripe, revenue share
- `plan-samples-metadata.md` -- Sample Discovery and Metadata Engine
- `plan-seo.md` -- SEO dinamico (RuntimeSeoData, JSON-LD, sitemaps)
- `plan-notificaciones.md` -- Sistema notificaciones (5 canales, push, WebSocket)
- `plan-websocket.md` -- WebSocket Bun standalone (Traefik SSL)
- `plan-desktop-distribucion.md` -- Distribucion desktop (exe/MSI/NSIS, auto-updates)
- `plan-daw-channelrack-mixer.md` -- Channel Rack + Mixer (20 pistas)
- `plan-piano-roll.md` -- Piano Roll (patterns, velocidad, BPM)
- `roadmap/completado.md` -- Historico QK1-QK105, QL1-QL95
- `roadmap/lecciones.md` -- Gotchas historicos por dominio
- `roadmap/arquitectura.md` -- Vision y stack original

## Historial compactado
- **QK1-QK105:** Sprint QK completo.
- **QL1-QL136 + QL136-CAP:** Sprint QL completo.
- **183A-9, 173A-7, 183A-10:** Completadas 2026-03-18.
- **183A-20:** Login con nombre actualizado (fallback por PG username). 2026-03-18.
- **183A-22+22-A+22-B:** Botones like y guardar separados en tarjeta de colección. 2026-03-18.
- **183A-23:** Inconsistencia de conteo total_items sin filtro estado. 2026-03-18.
- **183A-18:** Buscador en el landing de no autenticados. 2026-03-18.
- **183A-27:** Sincronizar WP user_login al actualizar username. 2026-03-18.
- **183A-19:** Logo APK, botón Google reactivo, instrucciones google-services.json. 2026-03-18.
- **183A-24:** Contadores de descargas estabilizados con total real cacheado. 2026-03-18.
- **183A-26:** Menu contextual clamped al viewport usando medidas reales. 2026-03-18.
- **183A-28+183A-33:** Protocolo reforzado para ambiguedad, raiz arquitectonica, validacion React y pull/deploy/health. 2026-03-18.
- Detalle en `App/Agente/completados/tareas-2026-03-18.md` y `App/docs (ignorar)/roadmap/completado.md`.

- **183A-41, 183A-42, 183A-43, 183A-37:** Completadas 2026-03-18. Modal login APK restaura sesión desde token nativo. SHA-1 debug. Push notifications: service account + tabla fcm_tokens + FcmController fix (`obtenerActual()` → `obtenerPorWpId()`) + verificado E2E con notificación en bandeja Android.
- **183A-44:** Completada 2026-03-18. Fix React error #310: `useLayoutEffect` después de returns condicionales en `MenuContextual.tsx`.
- **183A-45:** Completada 2026-03-18. Icono de notificación push actualizado al favicon real de Kamples.
- **183A-35:** Completada 2026-03-18. Buscador landing pública usa SPA nav en vez de `window.location.href`.
- **183A-39:** Completada 2026-03-18. Tooltip perfil se cierra al hacer click fuera o al navegar.
- **183A-34:** Completada 2026-03-18. Click derecho y long-press abren menú contextual en tarjetas de colección.
- **183A-32:** Completada 2026-03-18. Botón like en tarjetas de canción (TarjetaCancionGrande) y detalle de canción.
- **183A-38:** Completada 2026-03-18. Pull-to-refresh en feed de comunidad para móvil.
- **183A-46:** Completada 2026-03-18. Fix `npm run dev` con plugin Vite para stubs de módulos Tauri/Capacitor.
- **183A-48:** Completada 2026-03-18. Eliminado botón DevTools y lógica de override en LayoutPrincipal.
- **183A-47:** Completada 2026-03-18. Botón editar perfil oculto en móvil (ya está en menú contextual).
- **183A-53:** Completada 2026-03-18. Fix combinar colecciones: reordenar DELETE/UPDATE para evitar UNIQUE constraint.
- **183A-51:** Completada 2026-03-18. Fix slugs unicode en colecciones: limpiar percent-encoding, auto-reparar, route pattern.

- **183A-52:** Completada 2026-03-18. Click en portada/texto del reproductor navega al sample.
- **183A-62:** Completada 2026-03-18. Paginación por cursor en mensajes — carga últimos primero, scroll arriba carga antiguos.
- **183A-57:** Completada 2026-03-18. Padding reducido en modalCuerpo de seguidores.
- **183A-58:** Completada 2026-03-18. Like canción sincronizado en detalle + tendencias priorizan samples/youtube.
- **183A-64:** Completada 2026-03-18. Seguridad endpoint DMCA: rate limiting + eliminar auto-desactivación de samples.
- **183A-65:** Completada 2026-03-18. Buscador landing: corregido param ?buscar= y query pasado al API.
- **183A-63:** Completada 2026-03-18. Modal login APK: espera restauración de sesión + cierra al autenticar.
- **183A-59:** Completada 2026-03-18. Rutas desktop con params para extracción de id/slug dinámicos.
- **183A-54:** Completada 2026-03-18. Quitar padding botones colección + panel lateral modo colección.
- **183A-50:** Completada 2026-03-18. Acciones múltiples emiten eventos CRUD para actualizar UI en tiempo real.
- **183A-55:** Completada 2026-03-18. Info colección original en panel lateral de sugerencias (portada 3:2 estilo Spotify).
- **183A-61:** Completada 2026-03-18. Contador colección prioriza total_items real de BD sobre samples.length paginado.
- **183A-56:** Completada 2026-03-18. Cola IA limitada a 400 items/día con gap mínimo de 216s entre items (transients de contador diario + timestamp último item).
- **183A-60:** Completada 2026-03-18. Botón play/preview en tarjetaColeccionMenuContenedor.
- **183A-30+183A-25:** Completadas 2026-03-18. Cache feed: stale-while-revalidate extendido a pag2/3 (TTL 1h), precalentamiento de pag2/3 en background tras pag1 fresh, documentacion arquitectura cache + plan 50ms.
- **183A-67:** Completada 2026-03-18. Feed personalizado ahora incluye imagen_coleccion_propietario (portada coleccion del creador). Extraido como metodo publico sqlImagenColeccionPropietario() en NormalizadorSample.
- **183A-69:** Completada 2026-03-18. Anti-abuso descargas: rate limit 5/dia por IP (cross-account), limite 2/dia cuentas nuevas (<3 dias), registro_ip en usuarios_ext, migration v062.
- **183A-64:** Completada 2026-03-18. Correcciones ortograficas (~100 tildes faltantes) en 20 archivos React/TS de texto UI visible al usuario.
- **183A-29+183A-66:** Completadas 2026-03-18. Algoritmo colecciones incorpora likes directos (colecciones_likes) en score. Branch autenticado: pesos 0.55 tag + 0.10 likes + 0.20 frescura + 0.15 items. No autenticado: ordena por total_likes DESC. Documentacion en algoritmo/colecciones-relevancia-2026-03-18.md con plan fase-2 clicks/busquedas.
- **183A-71:** Completada 2026-03-18. Click en nombre sample abre panel lateral (no detalles). FeedSamples pasaba onClickTitulo={undefined}; corregido a feed.manejarClickTitulo cuando panel habilitado. Comentarios protectores en TarjetaSample y FeedSamples.
- **183A-31:** Completada 2026-03-18. Cache 30min/10min en `secciones()` de CancionesController (Redis+transients fallback), elimina 8+ queries en serie al cargar la página de música.
- **183A-70:** Completada 2026-03-18. `tamano="ninguno"` en botones `tarjetaColeccionMenuContenedor` (fix especificidad CSS padding). Tarjeta compacta `panelDetalleTarjetaMini` en `PanelColeccionSamples`.
- **183A-72:** Completada 2026-03-18. Unificación paneles sugerencias/detalle: `abrirSugerencias` ahora abre `modo:'detalle'` en vez de `modo:'sugerencias'`. `PanelDetalleSample` añadido `panelColeccionPortada` con fallback `obtenerImagenColorPorTexto`. Similares escalados de 4 a 12.

- **183A-40:** Completada 2026-03-18. `ImgOptimizada` via Jetpack Photon CDN. Equivalente React de `ImageUtility::optimizar()`. Aplicado en portadas de samples, colecciones y canciones.
- **183A-72:** Completada 2026-03-18. Unificación paneles sugerencias/detalle.
- **183A-49:** Completada 2026-03-18. Notificaciones descriptivas + imagen actorAvatarUrl en FCM + follow deep link + reproductor Media Session ya activo en WebView.
- **183A-68:** Completada 2026-03-18. Benchmark algoritmo extendido a 11 steps (similares, secciones musica, más ideas colección grande) + endpoint POST /admin/procesos/benchmark + UI en tab Procesos del panel admin.

## Tareas pendientes


El cache de feed de sampled me parece muy agresivo, pero necesito saber como funciona, hacer una documentacion sobre el cache del feed de samples.  Veo que los samples cargan imagenes de portada de colors (temporales) cuando ya tienen una imagen en su coleccion, no se si es por el cache o porque falla algo, al menos en recientes las imagenes si aparecen bien. 


## 183A-73

No funciona descargar samples desde la app, documentate bien en internet sobre esto, es una tarea que has fallado antes.

## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio 
3. indicarme donde esta en lnuevo instalador