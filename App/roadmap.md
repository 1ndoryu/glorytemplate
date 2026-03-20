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
- **183A-9 al 183A-86 (2026-03-18):** Detalle completo en `App/Agente/completados/tareas-2026-03-18.md`.
- **183A-90+183A-89:** Samples sin embedding IA reciben 0.5x score; caches alineados (secciones 1h/24h, feed 5min). 2026-03-19.
- **183A-81:** Fuzzy search pg_trgm word_similarity. 2026-03-19.
- **183A-92:** Descarga APK guarda en Documents/Kamples/. 2026-03-19.
- **183A-88+183A-77+183A-78:** Imágenes Photon CDN colecciones; nav SPA preserva query string; login omite nonce. 2026-03-19.
- **183A-96+183A-99+183A-100+183A-104:** Revenue share corregido; premium sin comisión; comentarios orden+WS; tab ganancias UI. 2026-03-19.
- **183A-97+183A-101+183A-107+183A-103+183A-105+183A-102+183A-106+183A-110+183A-112+183A-113:** Admin perfil links; estilos varios; descargas gratis con código; seguridad v067; fix colecciones gratis; hover like/guardar. 2026-03-19.
- **183A-109 (Fases 1-5):** Sistema de blog completo — CRUD artículos, categorías, likes, moderación, feed. 2026-03-19.
- **183A-110-B+C+D+E:** Blog como tab inicio, editor adjuntos, drag-scroll, select estado borrador/publicado, Mis artículos sub-fila, modal 980px. 2026-03-19.
- **193A-8+193A-9+193A-6+193A-9-B+193A-9-C:** Fix editor artículos (4 bugs), portada persiste, nombre_display→nombre_visible, colecciones_likes asegurarTabla, logs servidor ok, detalle por slug y rate limiter de creación corregidos. 2026-03-19.
- **193A-9-D+193A-15:** Toast admin erróneo (auto-aprueba, no va a moderación); grid vacía (response format array→{articulos,total,hay_mas}); avatar "?" (normalizador leía raw.username vs raw.autor_username); rate limiter bloqueado (Redis key reseteada manualmente). useEditorArticulo.ts recreado limpio (corruption null bytes). 2026-03-19.
- **193A-13+193A-14+193A-17:** 193A-13: slugs "dev-articulo-\*" retornan mock local sin petición HTTP. 193A-14: ws/ticket devuelve 401 correctamente — error era falla puntual de red. 193A-17: waveform JSON cache 1 mes en .htaccess uploads. 2026-03-19.

- **183A-111 (Fases 1-3, 2026-03-19):** i18n Kamples — infraestructura (es/en/ja + store + hook + SelectorIdioma), NavPublico, TopBar, ModalAuth, TarjetaSample, PanelDetalleSample migrados (Commits 1-5). Fase 3: 31 hooks migrados con getT() + claves error._/toast._ en los 3 JSON (Commit 7). Plan activo: `App/Agente/planes/plan-i18n-kamples-2026-03-19.md`.
- **193A-46-A (2026-03-19):** Fix URGENTE PerfilIsland — `useCallback` declarado después de early returns violaba reglas de hooks → crash "Rendered more hooks than during the previous render". Fix: mover el hook antes de cualquier return condicional.
- **193A-51 (2026-03-19):** Waveforms oscuras en white mode — CSS vars `--colorWaveformNoReproducido/Reproducido` + resolverColorCSS en canvas (getComputedStyle).
- **193A-52 (2026-03-19):** Selector idioma landing → pill select minimalista sin banderas (`SelectorIdioma variante='select'`).

- **193A-54 (2026-03-20):** SelectorIdioma variante=select usa SelectorMenu Kamples; NavPublico usa variante=select.
- **193A-63 (2026-03-20):** Logs diagnóstico rotación keys Groq + panel admin cola-IA muestra estado de las 3 keys, cuál está activa y último audio.
- **193A-64 (2026-03-20):** useT movido antes del early return en ModalSolicitudWhatsapp — Rules of Hooks.

## Tareas pendientes

## 193A-93

Cuando el usario no tiene internet y entra a la apk, ve el tipico mensaje del navegador de android de cuando no se conecta a internet, esto esta mal, tiene que ser algo personalizado, o si podriamos hacer que la aplicación cargue sin internet, no importa que tan complicado sea, seria lo ideal, que los audios reproducido se cacheen en el telefono y el contenido y que la persona pueda interactuar incluso sin internet. 

## 2003A-1 

Sigue sin funcionar combinar colecciones, llevamos mucho tiempo con este problema, una y otra vez, necesita una revision profunda y documentacion. 

## 2003A-3 (en planificación)

revisar comando de ssh root@66.94.100.241 "bash /tmp/run-benchmark.sh 1 30" realmente esta actualizado y muestra los valores reales

Tambien hay que hacer otra revision profunda para optimizar | >> FEED pag1 (sin cache, bulk-fetch) <<            |   782.5ms | sin afectar la calidad de resultados y la frecuencia con la que se actualizan los resultados, ver consultas lentas y optimizarlas. 

+----------------------------------------------------+----------+
| Componente                                         | Tiempo   |
+----------------------------------------------------+----------+
| PerfilUsuario::construir (sin cache)               |    75.9ms |
| Conteo samples activos (SQL COUNT)                 |     8.8ms |
| Verificacion pgvector                              |     6.9ms |
| SQL gen: Comportamiento (0.27)                     |     0.2ms |
| SQL gen: Contexto (0.15)                           |     0.0ms |
| SQL gen: Tendencias (0.12)                         |     0.0ms |
| SQL gen: Grafo Social (0.1)                        |     0.0ms |
| SQL gen: Similitud pgvector (0.28)                 |     0.7ms |
| >> FEED pag1 (sin cache, bulk-fetch) <<            |   793.0ms |
| >> FEED pag2 (bulk-cache de pag1) <<               |     1.3ms |
| >> FEED pag3 (bulk-cache de pag1) <<               |     0.6ms |
| Feed pag1 cache hit (todo en cache)                |     4.0ms |
| >> samplesSimilares "Te podria gustar" (12) <<     |    51.6ms |
| >> Secciones pagina Musica (sin cache) <<          |   288.7ms |
| >> Mas Ideas coleccion >= 200 samples <<           |    38.8ms |
+----------------------------------------------------+----------+
| PROMEDIO feed sin cache (3 pags)                   |   265.0ms |
+----------------------------------------------------+----------+

=== RESUMEN (para documentacion) ===
Fecha: 2026-03-20 08:47:31 | Config: ba0eb164
Samples: 2415 | pgvector: SI | Pipeline: NO
Feed pag1 (sin cache, bulk-fetch): 793ms | pag2 (bulk-cache): 1ms | pag3 (bulk-cache): 1ms | promedio: 265ms | cache hit: 4ms
Te podria gustar (similares): 52ms
Secciones musica (sin cache): 289ms
Mas Ideas coleccion grande: 39ms
Perfil: 76ms | Conteo: 9ms
=== FIN ===

Exit code: 0
PS C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\.agent\coolify-manager-rs> 

## Penultima tarea (no vovlver a correr el comando de generar schema y repositories sin revisar esto antes)

Hay un error grave como el comando que genera los schema y repositories, vi que lo ejecuaste una vez y se borraron algunas cosas que restaure despues, cuando todas las tareas anteriores esten listas, tienes que correrlo sin hacer pull y revisar los cambios que hizo porque hay cosas raras que no debería de hacer.

## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio
2. indicarme donde esta en nuevo instalador
3. Agregar 2 botones en el menu contextual de usuario en el nav para descargar el instalador y la apk. Esto tiene que actualizarse cuando vayamos a subir una nueva versión, podemos gestionarla aqui en el propio github de https://github.com/1ndoryu/kamples-sync pero sin complicarnos la vida, nada de eso de publicar en github a traves de un token, etc, gestionamos las versiones internamente en nuestro propio github, detectamos versiones y actualizamos los links de descarga en el menu contextual. Tambien ahora que lo pienso falta un sistema de version que aparezca en el menu contextual, sería 3 versionados, el instalador de windows, la apk, y la versión web, cada uno con su propio número de versión, y que se actualicen automáticamente cuando subamos una nueva versión, aparecería en el menu contextual de usuario y en las configuraicones pero claro aparecera especificamente para el tipo de dispositivo. Se me ocurre que cuando el usuario tenga una version desactualizada le aparezca un modal que pueda omitir pero que aperezca cada vez que recargue de actualizar.
