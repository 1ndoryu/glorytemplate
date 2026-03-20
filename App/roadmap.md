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

- **183A-111 (2026-03-19):** Plan i18n Kamples completo. Ver `App/Agente/planes/plan-i18n-kamples-2026-03-19.md`.

## Tareas pendientes

## 183A-115

El verificado si aparece en los nombres de usuario en sus publicaciones pero no aparece en sus nombre en los comentarios, ni tampoco en el nombre de usuario de su perfil y el de tooltop al hacer hover sobre el nombre tampoco, aqui hay incosistencia arquitectonica. 

## 193A-1

En la apk no puedo hacer scroll horizontal en filaColecciones, arreglar sin dañar que en escritorio se pueda hacer scroll con el mouse tambien.

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

## 193A-12

PS C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\.agent\coolify-manager-rs> cd "c:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\.agent\coolify-manager-rs" ; .\target\release\coolify-manager.exe deploy --name kamples --update 

tarda demasiado, verifica que se puede hacer para optimizar la velocidad.

## 193A-43 

en temp\apis.sh agrege 3 apis de groq, 
lo que vamos a hacer es aumentar la velocidad de la cola de ia, creo que actualmente hay un gap para la generacion metadata de los samples de 3 o 2 minutos, vamos a reducirlo a 1 minuto, pero vamos a incorporar un rotamiento de api, o sea, usa las 3 api para cada, 1 api por cada ejecucion y rota, asi se distribuye el gasto entre 3 personas y se evitan menos rate limits, es general para todos los procesamientos que usen IA, tienes que subir las 3 api al vps 

verificar que solo haya gap para el procesamiento de audios y metadata de ia de esos audios, para cosas como comentarios, publicaciones de comunidad y moderacion para esas actividades no hay gap, pero igual usar la rotacion de api. 

## 193A-44

En https://kamples.com/descargas/ falta un filtro de "Mostrar solo me encantas" Esto sirve para la tab de me gusta para cuando se quiera ver solo los me encanta y ocultar temporalmente los que son me gusta.

Pero, la lado del boton de filtro, podemos poner un corazon que se activa y apaga, si se activa solo muestra "me encanta", esto puede ser global y mostrarse incluso en el feed

## 193A-45

No se si lo dije antes pero falta el boton de eliminar en los 3 puntos para los articulos, e admin puede y debería elimianr cualquier articulo

## 193A-46-A (URGENTE)

NO SE ARREGLO EL PROBLEMA SIGUE SALIENDo Contenido no disponible

syncLogger.ts:201 [Glory] Error en isla "PerfilIsland": Error: Rendered more hooks than during the previous render.
[Kamples Desktop] Error global: Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (react-dom.development.js:15688:13)
    at updateCallback (react-dom.development.js:16385:14)
    at Object.useCallback (react-dom.development.js:17033:14)
    at useCallback (react.development.js:1646:21)
    at PerfilIsland (PerfilIsland.tsx:85:30)
    at renderWithHooks (react-dom.development.js:15486:18)
    at updateFunctionComponent (react-dom.development.js:19617:20)
    at beginWork (react-dom.development.js:21640:16)
    at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16)
(anonymous) @ syncLogger.ts:201
(anonymous) @ main.tsx:13
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
beginWork$1 @ react-dom.development.js:27490
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
performConcurrentWorkOnRoot @ react-dom.development.js:25777
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
react-dom.development.js:15688 Uncaught Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (react-dom.development.js:15688:13)
    at updateCallback (react-dom.development.js:16385:14)
    at Object.useCallback (react-dom.development.js:17033:14)
    at useCallback (react.development.js:1646:21)
    at PerfilIsland (PerfilIsland.tsx:85:30)
    at renderWithHooks (react-dom.development.js:15486:18)
    at updateFunctionComponent (react-dom.development.js:19617:20)
    at beginWork (react-dom.development.js:21640:16)
    at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16)
updateWorkInProgressHook @ react-dom.development.js:15688
updateCallback @ react-dom.development.js:16385
useCallback @ react-dom.development.js:17033
useCallback @ react.development.js:1646
PerfilIsland @ PerfilIsland.tsx:85
renderWithHooks @ react-dom.development.js:15486
updateFunctionComponent @ react-dom.development.js:19617
beginWork @ react-dom.development.js:21640
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
beginWork$1 @ react-dom.development.js:27490
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
performConcurrentWorkOnRoot @ react-dom.development.js:25777
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
syncLogger.ts:201 [Kamples Desktop] Error global: Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (react-dom.development.js:15688:13)
    at updateCallback (react-dom.development.js:16385:14)
    at Object.useCallback (react-dom.development.js:17033:14)
    at useCallback (react.development.js:1646:21)
    at PerfilIsland (PerfilIsland.tsx:85:30)
    at renderWithHooks (react-dom.development.js:15486:18)
    at updateFunctionComponent (react-dom.development.js:19617:20)
    at beginWork (react-dom.development.js:21640:16)
    at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16)
(anonymous) @ syncLogger.ts:201
(anonymous) @ main.tsx:13
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
beginWork$1 @ react-dom.development.js:27490
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
recoverFromConcurrentError @ react-dom.development.js:25889
performConcurrentWorkOnRoot @ react-dom.development.js:25789
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
react-dom.development.js:15688 Uncaught Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook (react-dom.development.js:15688:13)
    at updateCallback (react-dom.development.js:16385:14)
    at Object.useCallback (react-dom.development.js:17033:14)
    at useCallback (react.development.js:1646:21)
    at PerfilIsland (PerfilIsland.tsx:85:30)
    at renderWithHooks (react-dom.development.js:15486:18)
    at updateFunctionComponent (react-dom.development.js:19617:20)
    at beginWork (react-dom.development.js:21640:16)
    at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16)
updateWorkInProgressHook @ react-dom.development.js:15688
updateCallback @ react-dom.development.js:16385
useCallback @ react-dom.development.js:17033
useCallback @ react.development.js:1646
PerfilIsland @ PerfilIsland.tsx:85
renderWithHooks @ react-dom.development.js:15486
updateFunctionComponent @ react-dom.development.js:19617
beginWork @ react-dom.development.js:21640
callCallback2 @ react-dom.development.js:4164
invokeGuardedCallbackDev @ react-dom.development.js:4213
invokeGuardedCallback @ react-dom.development.js:4277
beginWork$1 @ react-dom.development.js:27490
performUnitOfWork @ react-dom.development.js:26596
workLoopSync @ react-dom.development.js:26505
renderRootSync @ react-dom.development.js:26473
recoverFromConcurrentError @ react-dom.development.js:25889
performConcurrentWorkOnRoot @ react-dom.development.js:25789
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
syncLogger.ts:201 The above error occurred in the <PerfilIsland> component:

    at PerfilIsland (


## 193A-51

Las waveform cuando la pagina este en white mode tienen que ser de color oscuro, se ven blanca y no contrastan

## 193A-52 (en planificacion)

El selector de idioma en el landing es muy feo, tiene que ser mas minimalista, te dejare un ejemplo

## Penultima tarea (no vovlver a correr el comando de generar schema y repositories sin revisar esto antes)

Hay un error grave como el comando que genera los schema y repositories, vi que lo ejecuaste una vez y se borraron algunas cosas que restaure despues, cuando todas las tareas anteriores esten listas, tienes que correrlo sin hacer pull y revisar los cambios que hizo porque hay cosas raras que no debería de hacer. No pude restaurar PushSubscriptionsDTO, por favor revisa si quedo bien. Creo que las notificaciones dejaron de llegar, revisa el historial de PushSubscriptionsDTO y restaura.


## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio 
3. indicarme donde esta en nuevo instalador
4. Agregar 2 botones en el menu contextual de usuario en el nav para descargar el instalador y la apk. Esto tiene que actualizarse cuando vayamos a subir una nueva versión, podemos gestionarla aqui en el propio github de https://github.com/1ndoryu/kamples-sync pero sin complicarnos la vida, nada de eso de publicar en github a traves de un token, etc, gestionamos las versiones internamente en nuestro propio github, detectamos versiones y actualizamos los links de descarga en el menu contextual. Tambien ahora que lo pienso falta un sistema de version que aparezca en el menu contextual, sería 3 versionados, el instalador de windows, la apk, y la versión web, cada uno con su propio número de versión, y que se actualicen automáticamente cuando subamos una nueva versión, aparecería en el menu contextual de usuario y en las configuraicones pero claro aparecera especificamente para el tipo de dispositivo. Se me ocurre que cuando el usuario tenga una version desactualizada le aparezca un modal que pueda omitir pero que aperezca cada vez que recargue de actualizar. 