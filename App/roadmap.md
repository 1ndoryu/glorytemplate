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

## Tareas pendientes

## 183A-74

Tirar hacia abajo para recargar en las publicaciones y lista de samples funciona mal o sea, debería activarse solo cuando se esta arriba el scroll, no cuando se esta bajando y despues se quiere subir, por cierto, es raro en la web movil si funciona en la lista de samples pero en la apk ese gesto no funciona, si funciona en las publicaciones. 

## 183A-84

Correo electronicos de bievenida, 
verificar que el correo de cambio de contraseña funcione
cambiar la contraseña del usuario de id 4 en el servidor a la que puse dentro de temp\contrasena.sh


## 183A-87

En la aplicacion de escritorio al intentar suscribirse al premiun, al regresar, se deslogea bueno, no se exactamente, aparece el landing deslogeado, pero si cierro la aplicación y la vuelvo abrir, vuelvo a estar logeada. 

## 193A-7

Cuidado con esto, tengo este proyecto en este repositorio que es una rama de glorytemplate pero tambien tengo https://github.com/1ndoryu/kamples-sync que es una copia de esta rama, lo que vamos a hacer es actualizar https://github.com/1ndoryu/kamples-sync con los ulitmos cambios de esta rama, o sea sin afectar esta rama de glorytemplate ni hacer nada raro. Revisasr que hay una licencia de codigo abierto de las mas restrintivas.

## 183A-93

El modal de busqueda tarda demasiado en aparecer, parece que necesita optimización profunda. No confundir con la busqueda de samples normal en el feed o general, al escribir algo en la busqueda aparece un modal busquedaRapidaDropdown, bueno, la busqueda del feed se actualiza mas rapido y eso que es mas compleja. Se puede implementar cache global por 6 horas y que esto no sobrecargue el sistema.

## 183A-94

Agregar una opción en los menu contextual de los samples para decargar en svg las waveform, necesito esto, que se descarguen en color blanco. 

## 183A-95

Dice error de red al descargar en la apk,  "183A-92"

## 183A-98

Revisar y auditar la funcionalidad de repostear de los post, esto no se ha revisado desde hace tiempo. 

## 183A-108

Me preocupa algo en particular, anteriormente se hizo algo que sacaba del algoritmo los samples que se reproducian y no tenian accion alguna del usuario, estos samples aun deben aparecer en la busqueda. 

## 183A-111

Planificar que se pueda cambiar el idioma a ingles de kamples y que se adapte segun el idioma del navegador, la forma mas eficiente y menos costosa, y completa

## 183A-114

Es raro este error, las feedTags dentro colecciones no aparece en la aplicacion de escritorio pero si en la web
otro detalle es que feedTags de las colecciones dentro tarda en cargar ¿esto esta optimizado? 

veo que aparece despues de que esto pasa

11:52:46 p.m. [vite] http proxy error: /wp-content/uploads/kamples/3/2026/03/pAlL7YD_waveform.json?v=9f562e1344ba58ae98adf5ecf5072068d7a062f47edd9ad92d1bb8891dfcaf76
Error: read ECONNRESET
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:216:20)
11:53:12 p.m. [vite] http proxy error: /wp-content/uploads/kamples/3/2026/03/3ltHJt3_waveform.json?v=2d04a4bd3719a642339ad53b5e4c5593d86e1ee0aaadba53818db101b17f3a00
Error: read ECONNRESET
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:216:20)
11:53:19 p.m. [vite] http proxy error: /wp-content/uploads/kamples/3/2026/03/XYJax8I_waveform.json?v=8f4599a05cdab6b746a5be1be4dae399bd75e23a9d0045156366982e16fc8608
Error: read ECONNRESET
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:216:20)
11:53:34 p.m. [vite] http proxy error: /wp-content/uploads/kamples/3/2026/03/lNbnsg1_waveform.json?v=46ad7c6ea0b6a3b84bbadb4f2ae6034c1107a7e91bc008608c1013c2672d3a0b
Error: read ECONNRESET
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:216:20)
11:54:41 p.m. [vite] http proxy error: /wp-json/kamples/v1/me/sync/colecciones?_t=1773892430501

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


## 193A-39

/wp-json/kamples/v1/codigos-gratis/generar:1  Failed to load resource: the server responded with a status of 500 ()

todo este sistema de codigo-gratis necesita una auditoria profunda para ver si funciona bien. 

## 193A-40

193A-29 y 193A-3 parece que no se arreglaron, esto necesita una revision profunda y detallada, documentar, desde el backend, hasta el sync hasta el servidor, mitigaciones, el problema sigue apareciendo, muy probablemente porque se siguen publicando samples que se encolaron con el problema activo pero esto es una sospecha, se necesita certeza para este caso. (no se trata sobre el problema de 409 porque ya se arreglo) es el mismo que comoente hoy en la tarea 3, " Carpeta_A/Sub_A en el servidor, la creación de Carpeta_B/Sub_A encontraba y reutilizaba la colección de Carpeta_A" Esto exactamente lo que sigue pasando. 

Se necesita mitigaciones, para algo se guarda en la metadata la info de las carpetas, no? se puede arreglar (espero que se este guardado la info.)


## Penultima tarea (no vovlver a correr el comando de generar schema y repositories sin revisar esto antes)

Hay un error grave como el comando que genera los schema y repositories, vi que lo ejecuaste una vez y se borraron algunas cosas que restaure despues, cuando todas las tareas anteriores esten listas, tienes que correrlo sin hacer pull y revisar los cambios que hizo porque hay cosas raras que no debería de hacer. No pude restaurar PushSubscriptionsDTO, por favor revisa si quedo bien.


## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio 
3. indicarme donde esta en nuevo instalador
4. Agregar 2 botones en el menu contextual de usuario en el nav para descargar el instalador y la apk. Esto tiene que actualizarse cuando vayamos a subir una nueva versión, podemos gestionarla aqui en el propio github de https://github.com/1ndoryu/kamples-sync pero sin complicarnos la vida, nada de eso de publicar en github a traves de un token, etc, gestionamos las versiones internamente en nuestro propio github, detectamos versiones y actualizamos los links de descarga en el menu contextual. Tambien ahora que lo pienso falta un sistema de version que aparezca en el menu contextual, sería 3 versionados, el instalador de windows, la apk, y la versión web, cada uno con su propio número de versión, y que se actualicen automáticamente cuando subamos una nueva versión, aparecería en el menu contextual de usuario y en las configuraicones pero claro aparecera especificamente para el tipo de dispositivo. Se me ocurre que cuando el usuario tenga una version desactualizada le aparezca un modal que pueda omitir pero que aperezca cada vez que recargue de actualizar. 