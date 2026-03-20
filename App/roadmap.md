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
- **193A-13+193A-14+193A-17:** 193A-13: slugs "dev-articulo-*" retornan mock local sin petición HTTP. 193A-14: ws/ticket devuelve 401 correctamente — error era falla puntual de red. 193A-17: waveform JSON cache 1 mes en .htaccess uploads. 2026-03-19.

- **183A-111 (Fases 1-3, 2026-03-19):** i18n Kamples — infraestructura (es/en/ja + store + hook + SelectorIdioma), NavPublico, TopBar, ModalAuth, TarjetaSample, PanelDetalleSample migrados (Commits 1-5). Fase 3: 31 hooks migrados con getT() + claves error.*/toast.* en los 3 JSON (Commit 7). Plan activo: `App/Agente/planes/plan-i18n-kamples-2026-03-19.md`.
- **193A-46-A (2026-03-19):** Fix URGENTE PerfilIsland — `useCallback` declarado después de early returns violaba reglas de hooks → crash "Rendered more hooks than during the previous render". Fix: mover el hook antes de cualquier return condicional.
- **193A-51 (2026-03-19):** Waveforms oscuras en white mode — CSS vars `--colorWaveformNoReproducido/Reproducido` + resolverColorCSS en canvas (getComputedStyle).
- **193A-52 (2026-03-19):** Selector idioma landing → pill select minimalista sin banderas (`SelectorIdioma variante='select'`).

- **193A-54 (2026-03-20):** SelectorIdioma variante=select usa SelectorMenu Kamples; NavPublico usa variante=select.
- **193A-63 (2026-03-20):** Logs diagnóstico rotación keys Groq + panel admin cola-IA muestra estado de las 3 keys, cuál está activa y último audio.
- **193A-64 (2026-03-20):** useT movido antes del early return en ModalSolicitudWhatsapp — Rules of Hooks.

## Tareas pendientes

## 183A-115 — COMPLETADO
<!-- Badge verificado consistente en comentarios, perfil, detalle sample, colección y panel. Commit 9145bee85 -->

## 193A-1 — COMPLETADO
<!-- Touch scroll filaColecciones: useArrastrarScroll + touch-action:manipulation. Commit bc024089a -->

## 193A-5

No he pensando ni he revisado esto. Si el servidor da 500 o error, por un momento es innacesible, kamples esta caido. ¿Que pasa con el sync? Lo mas logico es que la subida se pause 5 muntos, e intente la conexion, sino, vuelva a pausar y asi sucesivamente, hasta que el servidor vuelva a estar disponible. Esto hay que revisarlo bien porque hay que protejer que cuando el modo de borrar tras subida este activo, no haya perdida de datos.

## 193A-10 

Funcionalidad de volumenes en colecciones

Pasa que una coleccion puede volverse muy grande, y una forma es creando otro Volumen, dividiendo en dos, puede dividir aleatoreamente, lo importante es que cree otra coleccion con el mismo nombre pero con un sufijo tipo "Vol II, Vol III, etc" y que esta nueva coleccion tenga la mitad de los samples de la coleccion original, y que se mantengan las relaciones. Sería los volumenes coleciones hijas de la principal (no se le agrega vol 1 a la principal) por favor hacer esto bien y revisar, planificar porque si sale mal se pueden perder datos, el numero del volumen se tiene que poder elegir no duplicarse

## 193A-11

[Violation] 'visibilitychange' handler took 169ms
main-CvJwtydY.js:41 [Violation] 'click' handler took 171ms
5[Violation] 'requestAnimationFrame' handler tomó <N> ms
main-CvJwtydY.js:26 [Violation] 'message' handler took 431ms
main-CvJwtydY.js:26 [Violation] 'message' handler took 1174ms
[Violation] Forced reflow while executing JavaScript took 742ms
main-CvJwtydY.js:41 [Violation] 'popstate' handler took 326ms

## 193A-43 — COMPLETADO
<!-- Rotación 3 keys Groq (GROQ_API_1/2/3 en .env servidor), gap audio=60s, moderación=0s. Commits 24fd9fc6f + 3b6a8118e -->

## 193A-54 — COMPLETADO
<!-- SelectorIdioma variante=select usa SelectorMenu Kamples; NavPublico usa variante=select. Commit 3031559cd -->

## 193A-61 

Lo de corazon para mostrar los samples de "me encanta" funciona mal porque es un filtrado en vez de una busqueda desde el servidor, lo cual tiene que cargar todas las imagenes y pasar horas para mostrar los me encanta, es totalmente ineficiente

## 193A-62

La imagen de avatar no esta optimizada como estan optizada las demas imagenes,las imagenes temporarels de colors tampoco, 

## 193A-63 — COMPLETADO
<!-- Logs diagnóstico rotación keys + panel admin cola-IA muestra estado 3 keys. Commits f0d016cbf + 2117777ba -->

## 193A-64 — COMPLETADO
<!-- Rules of Hooks fix ModalSolicitudWhatsapp — useT antes del early return. Commit f08c28e99 -->

## 193A-65 

Veo cosas como "todos", siguiendo, populares, copiar enlace, editar sample, eliminar, reportar, ir a, comunidad, etc hardcode sin multiidioma, "por" "asunto" "descripcion" "cancelar" "reporte"

## 193A-66 URGENTE 

Siguen habiendo errores

Error de render
Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Error: Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at Kt (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:39:18415)
    at Object.Oh [as useCallback] (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:39:21995)
    at DC.ea.useCallback (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:10:5688)
    at XC (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:41:58980)
    at r (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:41:59130)
    at Se (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:906:108280)
    at tP (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:913:118220)
    at hu (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:39:17820)
    at Nu (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:41:3158)
    at zg (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-F0yl8goZ.js:41:45524)

## 

appIslands.tsx:67 [Kamples] Error de render en AppProvider: Error: Rendered more hooks than during the previous render.
    at useT (useT.ts:32:20)
    at ReproductorGlobal (ReproductorGlobal.tsx:34:19)
 
    at ReproductorGlobal (http://localhost:5173/@fs/C:/Users/Owner/OneDrive/Documentos/WP/app/public/…emplate/App/React/components/ui/ReproductorGlobal.tsx?t=1773976213008:40:7)

    

## Antes de penultima (preferiblemente antepenultima)

Auditoría de seguridad profundad general, revisar lo mas tipico para pasar auditorias de seguridad, como inyecciones SQL, XSS, CSRF, autenticación, autorización, etc. Revisar especialmente cualquier parte del código que maneje datos de usuario o interacciones con el servidor, datos sensibles, etc. Hacer pruebas de penetración básicas para identificar vulnerabilidades. 


## Penultima tarea (no vovlver a correr el comando de generar schema y repositories sin revisar esto antes)

Hay un error grave como el comando que genera los schema y repositories, vi que lo ejecuaste una vez y se borraron algunas cosas que restaure despues, cuando todas las tareas anteriores esten listas, tienes que correrlo sin hacer pull y revisar los cambios que hizo porque hay cosas raras que no debería de hacer. No pude restaurar PushSubscriptionsDTO, por favor revisa si quedo bien. Creo que las notificaciones dejaron de llegar, revisa el historial de PushSubscriptionsDTO y restaura.


## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio 
3. indicarme donde esta en nuevo instalador
4. Agregar 2 botones en el menu contextual de usuario en el nav para descargar el instalador y la apk. Esto tiene que actualizarse cuando vayamos a subir una nueva versión, podemos gestionarla aqui en el propio github de https://github.com/1ndoryu/kamples-sync pero sin complicarnos la vida, nada de eso de publicar en github a traves de un token, etc, gestionamos las versiones internamente en nuestro propio github, detectamos versiones y actualizamos los links de descarga en el menu contextual. Tambien ahora que lo pienso falta un sistema de version que aparezca en el menu contextual, sería 3 versionados, el instalador de windows, la apk, y la versión web, cada uno con su propio número de versión, y que se actualicen automáticamente cuando subamos una nueva versión, aparecería en el menu contextual de usuario y en las configuraicones pero claro aparecera especificamente para el tipo de dispositivo. Se me ocurre que cuando el usuario tenga una version desactualizada le aparezca un modal que pueda omitir pero que aperezca cada vez que recargue de actualizar. 