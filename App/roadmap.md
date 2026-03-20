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

## 193A-65

Veo cosas como "todos", siguiendo, populares, copiar enlace, editar sample, eliminar, reportar, ir a, comunidad, etc hardcode sin multiidioma, "por" "asunto" "descripcion" "cancelar" "reporte"

## 193A-69

filaColecciones no se puede arrastrar horizontalmente con el mouse, debería, tambien con el dedo en movil!!

## 193A-73

En dropdownItemTexto cuando hay un check de confirmado no aparece al lado del nombre sino debajo

## 193A-77

filaColecciones tambien se tiene que actualizar con la busqueda, debe ser un algoritmo eficiente y ligero, no un filtrado.

## 193A-78

Cambia los botones de perfilAcciones por solo iconos, sin borde ni padding, si gap. y del mismo tamaño, uno para seguir y otro de mensaje, que se note la diferencia entre seguir y dejar de seguir


## 193A-93

Cuando el usario no tiene internet y entra a la apk, ve el tipico mensaje del navegador de android de cuando no se conecta a internet, esto esta mal, tiene que ser algo personalizado, o si podriamos hacer que la aplicación cargue sin internet, no importa que tan complicado sea, seria lo ideal, que los audios reproducido se cacheen en el telefono y el contenido y que la persona pueda interactuar incluso sin internet. 

## 193A-100

a veces veo esto en la consola de log

main-8zzQ1p0i.js:906  GET https://kamples.com/wp-json/kamples/v1/descargas/limites net::ERR_CONNECTION_CLOSED
zr @ main-8zzQ1p0i.js:906
ke @ main-8zzQ1p0i.js:906
$b @ main-8zzQ1p0i.js:906
he @ main-8zzQ1p0i.js:916
setInterval
(anónimas) @ main-8zzQ1p0i.js:916
Rc @ main-8zzQ1p0i.js:41
ts @ main-8zzQ1p0i.js:41
yC @ main-8zzQ1p0i.js:41
no @ main-8zzQ1p0i.js:41
Ig @ main-8zzQ1p0i.js:41
jn @ main-8zzQ1p0i.js:39
(anónimas) @ main-8zzQ1p0i.js:41Comprende este error
main-8zzQ1p0i.js:906 [Kamples] 03:17:04 [ERROR] ApiCliente: GET /descargas/limites → fallo TypeError: Failed to fetch
    at zr (main-8zzQ1p0i.js:906:4117)
    at ke (main-8zzQ1p0i.js:906:5410)
    at $b (main-8zzQ1p0i.js:906:127658)
    at he (main-8zzQ1p0i.js:916:178350)

## 193A-102

Que en la apk no se pueda comprar samples, que directamente no salgan los samples con precio si es que es mejor. 

## Penultima tarea (no vovlver a correr el comando de generar schema y repositories sin revisar esto antes)

Hay un error grave como el comando que genera los schema y repositories, vi que lo ejecuaste una vez y se borraron algunas cosas que restaure despues, cuando todas las tareas anteriores esten listas, tienes que correrlo sin hacer pull y revisar los cambios que hizo porque hay cosas raras que no debería de hacer.

## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio
2. indicarme donde esta en nuevo instalador
3. Agregar 2 botones en el menu contextual de usuario en el nav para descargar el instalador y la apk. Esto tiene que actualizarse cuando vayamos a subir una nueva versión, podemos gestionarla aqui en el propio github de https://github.com/1ndoryu/kamples-sync pero sin complicarnos la vida, nada de eso de publicar en github a traves de un token, etc, gestionamos las versiones internamente en nuestro propio github, detectamos versiones y actualizamos los links de descarga en el menu contextual. Tambien ahora que lo pienso falta un sistema de version que aparezca en el menu contextual, sería 3 versionados, el instalador de windows, la apk, y la versión web, cada uno con su propio número de versión, y que se actualicen automáticamente cuando subamos una nueva versión, aparecería en el menu contextual de usuario y en las configuraicones pero claro aparecera especificamente para el tipo de dispositivo. Se me ocurre que cuando el usuario tenga una version desactualizada le aparezca un modal que pueda omitir pero que aperezca cada vez que recargue de actualizar.
