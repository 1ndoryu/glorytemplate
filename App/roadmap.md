# Kamples � Roadmap

> **Descripcion:** Plataforma de samples de musica � descubrimiento, colecciones, DAW web, notificaciones y app movil.
> **Stack:** Glory Framework (WordPress + React Islands + TypeScript), Tauri (desktop), PostgreSQL, Redis, Bun (WebSocket)
> **URL produccion:** https://kamples.com
> **Servidor:** 66.94.100.241 � SSH: `ssh root@66.94.100.241`
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
- **183A-88+183A-77+183A-78:** Im�genes Photon CDN colecciones; nav SPA preserva query string; login omite nonce. 2026-03-19.
- **183A-96+183A-99+183A-100+183A-104:** Revenue share corregido; premium sin comisi�n; comentarios orden+WS; tab ganancias UI. 2026-03-19.
- **183A-97+183A-101+183A-107+183A-103+183A-105+183A-102+183A-106+183A-110+183A-112+183A-113:** Admin perfil links; estilos varios; descargas gratis con c�digo; seguridad v067; fix colecciones gratis; hover like/guardar. 2026-03-19.
- **183A-109 (Fases 1-5):** Sistema de blog completo � CRUD art�culos, categor�as, likes, moderaci�n, feed. 2026-03-19.
- **183A-110-B+C+D+E:** Blog como tab inicio, editor adjuntos, drag-scroll, select estado borrador/publicado, Mis art�culos sub-fila, modal 980px. 2026-03-19.
- **193A-8+193A-9+193A-6+193A-9-B+193A-9-C:** Fix editor art�culos (4 bugs), portada persiste, nombre_display?nombre_visible, colecciones_likes asegurarTabla, logs servidor ok, detalle por slug y rate limiter de creaci�n corregidos. 2026-03-19.
- **193A-9-D+193A-15:** Toast admin err�neo (auto-aprueba, no va a moderaci�n); grid vac�a (response format array?{articulos,total,hay_mas}); avatar "?" (normalizador le�a raw.username vs raw.autor_username); rate limiter bloqueado (Redis key reseteada manualmente). useEditorArticulo.ts recreado limpio (corruption null bytes). 2026-03-19.
- **193A-13+193A-14+193A-17:** 193A-13: slugs "dev-articulo-\*" retornan mock local sin petici�n HTTP. 193A-14: ws/ticket devuelve 401 correctamente � error era falla puntual de red. 193A-17: waveform JSON cache 1 mes en .htaccess uploads. 2026-03-19.

- **183A-111 (Fases 1-3, 2026-03-19):** i18n Kamples � infraestructura (es/en/ja + store + hook + SelectorIdioma), NavPublico, TopBar, ModalAuth, TarjetaSample, PanelDetalleSample migrados (Commits 1-5). Fase 3: 31 hooks migrados con getT() + claves error._/toast._ en los 3 JSON (Commit 7). Plan activo: `App/Agente/planes/plan-i18n-kamples-2026-03-19.md`.
- **193A-46-A (2026-03-19):** Fix URGENTE PerfilIsland � `useCallback` declarado despu�s de early returns violaba reglas de hooks ? crash "Rendered more hooks than during the previous render". Fix: mover el hook antes de cualquier return condicional.
- **193A-51 (2026-03-19):** Waveforms oscuras en white mode � CSS vars `--colorWaveformNoReproducido/Reproducido` + resolverColorCSS en canvas (getComputedStyle).
- **193A-52 (2026-03-19):** Selector idioma landing ? pill select minimalista sin banderas (`SelectorIdioma variante='select'`).

- **193A-54 (2026-03-20):** SelectorIdioma variante=select usa SelectorMenu Kamples; NavPublico usa variante=select.
- **193A-63 (2026-03-20):** Logs diagn�stico rotaci�n keys Groq + panel admin cola-IA muestra estado de las 3 keys, cu�l est� activa y �ltimo audio.
- **193A-64 (2026-03-20):** useT movido antes del early return en ModalSolicitudWhatsapp � Rules of Hooks.

- **2003A-37+2003A-38+2003A-39+2003A-40 (2026-03-21):** Fix CORS x-idempotency-key uploads; umbral drag 20px + preview verde nativo; infinite scroll colecciones explorar; estados din�micos sync + trigger al despausar.
- **2103A-1+2103A-2 (2026-03-21):** Build desktop app � Tauri v2 release build (MSI + NSIS installer). URLs descarga configuradas en WordPress para Windows (.exe) y Android (.apk).
- **2103A-3+2103A-4+2103A-5 (2026-03-21):** Ordenamiento inteligente colecciones explorar (scoring multi-factor auth/no-auth, frescura suave, centralizado en algoritmoPesos); t�tulo con mayor peso en b�squeda (titulo_boost 0.5?1.5, nuevo titulo_exacto_boost 2.0); documentaci�n actualizada.
- **2103A-10 (2026-03-21):** Fix boost_reciente minimalizado (2.0?1.05) � dominaba el feed completo con samples scrapeados <24h; rn/rn_genero ahora escritos en aplicarDiversidadPHP para debug badge; "0h" mostrado como "15min" en frontend.
- **213A-2 (2026-03-21):** Fix b�squeda feed � orderBy carec�a de fuzzy_boost, titulo_exacto_boost y engagement (LN), haciendo que resultados con igual ts_rank se ordenaran por publicado_at (= recientes). Paridad con /samples listar + engagement_boost=0.15.
- **213A-1 (2026-03-21):** Fix cr�tico SelectorCandidatos � `:userId` sin binding en Fuente 3 causaba PDO catch?[], algoritmo retornaba 0 resultados y ca�a a fallback recientes. Activado al bajar umbral_activacion a 2000 (cat�logo > 2000 samples).
- **213A-3 (2026-03-21):** Diversidad tipo feed � loop_boost x1.10 en SQL, max 5 one-shots/p�gina (soft penalty), badge "Loop"/"One Shot" como primer chip en TarjetaSample, auto-correcci�n tipo <5s?oneshot en NormalizadorSample.
- **2103A-12 (2026-03-21):** Bot�n dado en `inicioControlesDerecha` � reproduce sample aleatorio del top 1000 del cat�logo activo. Backend: `GET /samples/aleatorio` con RANDOM() sobre subquery de los 1000 m�s recientes.
- **2103A-11 (2026-03-21):** Hash antispam desktop menos estricto � `MAX_DETECCIONES_HASH` 6?25; contador capeado al l�mite (ya no crece a 24-25); check anticipado antes del incremento.
- **2103A-13+2103A-14+2103A-15+2103A-16+2103A-17+2103A-18 (2026-03-21):** Badge editable tipo loop/oneshot para admins; serendipia shuffle por request; dislike visible al lado del coraz�n; bot�n recargar feed (invalida cach� algoritmo); unificaci�n visual barraControlFeed con inicioBarraControl; bot�n dado en ColeccionDetalle. Hook `useReproductorAleatorio` extraido como compartido.
- **2103A-19 (2026-03-21):** Diversidad por colecci�n en `aplicarDiversidadPHP` � 4ta dimensi�n de penalizaci�n suave (max 3 por colecci�n origen, step 0.18, piso 0.40). `cp.col_id AS coleccion_diversidad_id` a�adido al SQL. Debug badge expone `rnColeccion` y `rnTipo` (que faltaba desde 213A-3).- **2103A-20 (2026-03-21):** Eliminada transcripci&#243;n Whisper STT de `ServicioIA::analizarAudio()` &#8212; alucinaba "vocals" en loops e instrumentales. El an&#225;lisis IA ahora usa solo nombre de archivo, descripci&#243;n, tags y carpetas de origen. STT preservado en el c&#243;digo pero desconectado del flujo.
- **2103A-21 (2026-03-21):** Boost x1.20 para samples no reproducidos por el usuario — `rp.sum_ponderada IS NULL` en CTE `repro_peso`. Complementa la penalización progresiva: ya-vistos bajan, nunca-vistos suben. Configurable en `algoritmoPesos.php` como `boost_no_reproducido`.

## Tareas pendientes
