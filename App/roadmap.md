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

- **2003A-37+2003A-38+2003A-39+2003A-40 (2026-03-21):** Fix CORS x-idempotency-key uploads; umbral drag 20px + preview verde nativo; infinite scroll colecciones explorar; estados dinámicos sync + trigger al despausar.
- **2103A-1+2103A-2 (2026-03-21):** Build desktop app — Tauri v2 release build (MSI + NSIS installer). URLs descarga configuradas en WordPress para Windows (.exe) y Android (.apk).
- **2103A-3+2103A-4+2103A-5 (2026-03-21):** Ordenamiento inteligente colecciones explorar (scoring multi-factor auth/no-auth, frescura suave, centralizado en algoritmoPesos); título con mayor peso en búsqueda (titulo_boost 0.5→1.5, nuevo titulo_exacto_boost 2.0); documentación actualizada.
- **2103A-10 (2026-03-21):** Fix boost_reciente minimalizado (2.0→1.05) — dominaba el feed completo con samples scrapeados <24h; rn/rn_genero ahora escritos en aplicarDiversidadPHP para debug badge; "0h" mostrado como "15min" en frontend.
- **213A-2 (2026-03-21):** Fix búsqueda feed — orderBy carecía de fuzzy_boost, titulo_exacto_boost y engagement (LN), haciendo que resultados con igual ts_rank se ordenaran por publicado_at (= recientes). Paridad con /samples listar + engagement_boost=0.15.
- **213A-1 (2026-03-21):** Fix crítico SelectorCandidatos — `:userId` sin binding en Fuente 3 causaba PDO catch→[], algoritmo retornaba 0 resultados y caía a fallback recientes. Activado al bajar umbral_activacion a 2000 (catálogo > 2000 samples).
- **213A-3 (2026-03-21):** Diversidad tipo feed — loop_boost x1.10 en SQL, max 5 one-shots/página (soft penalty), badge "Loop"/"One Shot" como primer chip en TarjetaSample, auto-corrección tipo <5s→oneshot en NormalizadorSample.
- **2103A-12 (2026-03-21):** Botón dado en `inicioControlesDerecha` — reproduce sample aleatorio del top 1000 del catálogo activo. Backend: `GET /samples/aleatorio` con RANDOM() sobre subquery de los 1000 más recientes.
- **2103A-11 (2026-03-21):** Hash antispam desktop menos estricto — `MAX_DETECCIONES_HASH` 6→25; contador capeado al límite (ya no crece a 24-25); check anticipado antes del incremento.
- **2103A-13+2103A-14+2103A-15+2103A-16+2103A-17+2103A-18 (2026-03-21):** Badge editable tipo loop/oneshot para admins; serendipia shuffle por request; dislike visible al lado del corazón; botón recargar feed (invalida caché algoritmo); unificación visual barraControlFeed con inicioBarraControl; botón dado en ColeccionDetalle. Hook `useReproductorAleatorio` extraido como compartido.

## Tareas pendientes

## 2103A-19

El algoritmo no tiene diversidad por colecciones o genero, a veces muestra un moton de samples de la misma coleccion y genero. 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 4 (2).wav 
uploadQueueService-BdIuPfxD.js:49 [sync:uploadQueue] Antispam: hash bloqueado tras 25 detecciones: SMK Snare 4.wav 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 4.wav 
uploadQueueService-BdIuPfxD.js:49 [sync:uploadQueue] Antispam: hash bloqueado tras 24 detecciones: SMK Snare 5 (2).wav 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 5 (2).wav 
uploadQueueService-BdIuPfxD.js:49 [sync:uploadQueue] Antispam: hash bloqueado tras 25 detecciones: SMK Snare 5.wav 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 5.wav 
uploadQueueService-BdIuPfxD.js:49 [sync:uploadQueue] Antispam: hash bloqueado tras 24 detecciones: SMK Snare 6 (2).wav 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 6 (2).wav 
uploadQueueService-BdIuPfxD.js:49 [sync:uploadQueue] Antispam: hash bloqueado tras 25 detecciones: SMK Snare 6.wav 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 6.wav 
uploadQueueService-BdIuPfxD.js:49 [sync:uploadQueue] Antispam: hash bloqueado tras 24 detecciones: SMK Snare 7 (2).wav 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 7 (2).wav 
uploadQueueService-BdIuPfxD.js:49 [sync:uploadQueue] Antispam: hash bloqueado tras 25 detecciones: SMK Snare 7.wav 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 7.wav 
uploadQueueService-BdIuPfxD.js:49 [sync:uploadQueue] Antispam: hash bloqueado tras 24 detecciones: SMK Snare 8 (2).wav 
Na @ uploadQueueService-BdIuPfxD.js:49
warn @ uploadQueueService-BdIuPfxD.js:51
ai @ uploadQueueService-BdIuPfxD.js:51
await in ai
Zn @ uploadQueueService-BdIuPfxD.js:51
b @ syncOrphanAnalysis-B19HjyP6.js:2
await in b
b @ syncOrphanAnalysis-B19HjyP6.js:2
uploadQueueService-BdIuPfxD.js:49 [sync:orphanAnalysis] Archivo huerfano encolado: SMK Snare 8 (2).wav 

## 2103A-12

Agregar un boton de dado para reproducir un audio aleatorio, ese dado, tiene que estar en inicioControlesDerecha, a dar click reproduce un sample aleatorio, pero, tiene que ser cualquiera de los primeros 1000 y no necesariamente tiene que aparecer en la pagina actual, por supuesto esto sirve para pulir el algoritmo, la reproduccion tiene que contar igual y si el usuario da like o no desde el reproductor tambiein, esto es informacion util, 

## 2103A-13

Una funcionalidad especial, a dar click a un <span class="badge badgeNeutro tarjetaMetaBadgeClickable">Loop</span> o <span class="badge badgeNeutro tarjetaMetaBadgeClickable">One Shot</span> tiene que cambiar su valor (no solo visualmente sino internamente, o sea, seria editar el sample pero unicamente en esa tag, solo hay 2 vaolores, one shot y loop), esto sirve para ajustar samples, esto unicamente lo pueden hacer los usuarios admin. 

## 2103A-14

Supongo que esos 5 samples que siempre son iguales son los de serendipia, el problema es que nunca cambian, siempre son los mismos, deberian cambiar justa al feed.

## 2103A-15

Agrega el boton de dislike al lado del boton de corazon, que ya no este en el tooltip al hacer hover en el icono de corazon, sino al lado simplemente.

## 2103A-16

Al lado del boton de dado agrega un boton para recargar la lista del feed, esto hará que el algortimo se vuelva a calcular y recarga la lista samples, esto regenera el algoritmo, invalidado la cache del algoritmo. 

## 2103A-17 

unificar estilos en todos los aspectos posible entre inicioBarraControl y barraControlFeed, deberian ser la misma cosa y funcionar igual, con la excepcion de que dentro de las colecciones el contador esta en otra parte pero si, hay incosistencia visual, los ordenamientos correcto son los que esta en el feed de inicio, estilo correcto de todo es el de inicioBarraControl

## 2103A-18

el boton de dado tambien debe estar dentro de las colecciones, el de recargar feed no es necesario en las colecciones o dentro de ellas.

## 2103A-19

El algoritmo no tiene diversidad por colecciones o genero, a veces muestra un moton de samples de la misma coleccion y genero. 