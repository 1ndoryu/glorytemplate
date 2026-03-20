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

- 2003A-28: Fix definitivo pull-to-refresh — publicaciones siempre activa, samples nunca activa
- 2003A-29: Build nueva APK y escritorio con el fix aplicado