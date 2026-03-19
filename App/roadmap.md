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
- **183A-73:** Completada 2026-03-18. Descarga de samples nativa en Capacitor Android: `descargarArchivo.ts` detecta plataforma → web usa `<a download>`, nativo usa fetch → base64 → `Filesystem.writeFile(Cache)` → `Share.share`. Instalados `@capacitor/filesystem@6.0.4` + `@capacitor/share@6.0.4` + `cap sync` registró plugins Android. tsconfig actualizado con paths. file_paths.xml actualizado.
- **183A-79+183A-76:** Completadas 2026-03-18. 183A-79: `panelColeccionPortada` ahora usa `detalle?.coleccionOriginal ?? sample.coleccionOriginal` — info de colección aparece en panel lateral. 183A-76: removidos iconos SVG (Mail, Lock) de los labels Email/Contraseña en ConfiguracionSecciones.

- **183A-75:** Secciones música optimizado de 894ms a 314ms (2 queries + arsort + v063 índices).
- **183A-85+183A-85-A:** Completadas 2026-03-18. 183A-85: respuestas sobre la optimización bulk-fetch (la optimización es real, pag2/3 son cache hits). 183A-85-A: benchmark actualizado para reflejar bulk-fetch — pag2/3 sin invalidar cache entre tests.
- **183A-80:** Completada 2026-03-18. Bulk-fetch 3 páginas en 1 query (LIMIT 90 OFFSET 0) + CTE `ignored_samples` (samples reproducidos 5+ veces en 30 días sin like). Serendipia movida dentro del bulk loop, NO eliminada. Filosofía algoritmo documentada: todos los samples se evalúan, no pierden calidad por antigüedad.
- **183A-82+183A-83:** Completadas 2026-03-18. 183A-82: serendipia no se borró, se movió al bulk loop. 183A-83: `coleccion_original_json` añadido al SELECT del feed inteligente — antes solo estaba en recientes. Método `sqlColeccionOriginalJson()` centralizado en NormalizadorSample.

- **183A-86:** Completada 2026-03-18. Fix paginación feed: (1) SQL params bug en bulk-fetch, (2) lock unificado, (3) stale TTL igualado, (4) frontend IntersectionObserver re-creación tras skeleton + fallback manual cuando guards bloquean.
- **183A-90+183A-89:** Completadas 2026-03-19. 183A-90: samples sin embedding IA reciben factor 0.5x en score (configurable metadata_ia_reduccion). 183A-89: secciones música 1h auth/24h anon (era 10min/30min), más ideas cache 1 día, feed 5min confirmado como filosofía correcta, PerfilUsuario 30min ya alineado.
- **183A-81:** Completada 2026-03-19. Fuzzy search con pg_trgm word_similarity() — typos ("hihatt"→"hihat", "snarre"→"snare") ahora encuentran resultados. Aplicado en listar() y feed(). Config fuzzy_boost=0.6.
- **183A-92:** Completada 2026-03-19. Descarga APK guarda en Documents/Kamples/ en vez de abrir Share sheet. Toast de confirmación.
- **183A-88:** Completada 2026-03-19. Imágenes colecciones optimizadas con ImgOptimizada (Photon CDN) en FilaColecciones, ColeccionDetalle, ModalSeleccion, PanelSugerencias.
- **183A-77:** Completada 2026-03-19. Navegación SPA preserva query string — búsqueda landing ahora pasa ?buscar= a /descubrir/.
- **183A-78:** Completada 2026-03-19. Login omite X-WP-Nonce — fix "cookie check failed" con cookies stale de sesión anterior.
- **183A-96:** Completada 2026-03-19. Fix bug precio compra, tab ganancias, PayPal config, revenue share 80/20, auditoría integridad (5 bugs críticos corregidos: mismatch revenue display, estado dual, race conditions webhook/compra doble).
- **183A-104:** Completada 2026-03-19. Ocultar perfilContenedorInterno y perfilSeccionPublicar en tab ganancias.
- **183A-100:** Completada 2026-03-19. Revisión sistema comentarios: orden raíz por likes, respuestas 3er nivel flat, imágenes fullscreen via VisorImagen, WebSocket real-time.
- **183A-99:** Completada 2026-03-19. Premium sin comisión (100/0). Free/Pro mantienen 80/20.
- **183A-97+183A-101:** Completadas 2026-03-19. Click nombre/avatar en panel admin/moderación abre perfil en nueva pestaña.
- **183A-107+183A-103+183A-105+183A-102:** Completadas 2026-03-19. Estilos tabGanancias, chatFlotante flex-column staging, tarjetaColeccion centrado bottom, ImgOptimizada en posts.
- **183A-106:** Completada 2026-03-19. Descargas gratis via código admin-generado. "Compartir gratis" en menú contextual copia URL con ?codigoGratis=XXX. Usuarios autenticados reclaman inmediatamente; anónimos guardan en localStorage y reclaman al autenticarse. Endpoints de descarga aceptan codigoGratis y saltan restricciones si el código fue reclamado. Migration v066.
- **183A-110:** Completada 2026-03-19. Seguridad 183A-106: expiración 1 año (v067), nombre_item almacenado, rate limiting 30/min en /verificar, HTTP 410 vs 404 (expirado vs inválido), compensación 50 créditos al reclamar expirado (idempotente), ModalCodigoExpirado sin cabecera, admin "Invalidar enlace gratis" en menú contextual sample/colección.
- **183A-112:** Completada 2026-03-19. Fix "Error al generar enlace de descarga gratis" para colecciones. `buscarPorId()` no existe — reemplazado por `obtenerResumen()`. Errores IDE en CodigoGratisRepository son falsos positivos de pg_* stubs.
- **183A-113:** Completada 2026-03-19. Botones activos (guardar/like) en tarjeta colección grid ahora solo visibles en hover. Fix CSS selector scope.

## Tareas pendientes

## 183A-74

Tirar hacia abajo para recargar en las publicaciones y lista de samples funciona mal o sea, debería activarse solo cuando se esta arriba el scroll, no cuando se esta bajando y despues se quiere subir, por cierto, es raro en la web movil si funciona en la lista de samples pero en la apk ese gesto no funciona, si funciona en las publicaciones. 

## 183A-84

Correo electronicos de bievenida, 
verificar que el correo de cambio de contraseña funcione
cambiar la contraseña del usuario de id 4 en el servidor a la que puse dentro de temp\contrasena.sh


## 183A-87

En la aplicacion de escritorio al intentar suscribirse al premiun, al regresar, se deslogea bueno, no se exactamente, aparece el landing deslogeado, pero si cierro la aplicación y la vuelvo abrir, vuelvo a estar logeada. 

## 183A-(no se que numero va)

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

## 183A-110-A (Completada — incluida en 183A-109 Fase 2)

Grid de 4 columnas centrado implementado en BlogIsland.

## 183A-110-B 

blogCategorias debería poder arrastrarse con el mouse y el dedo en la apk, en http://glory.local/blog/ falta la tab blog, y la rutas para la aplicaicon. En modo dev inyecta contenido de prueba. 

## 183A-110-C 

El modal de escribir articulo sin titulo por favor (sin cabecera), el select de contenedorCampoTexto editorArticuloCategoriaSelect tiene ser como el select de editarFormulario de los samples. Debe haber un boton para adjuntar un sample o una coleccion editorArticuloToolbar, abre un modal para selecionar y buscar, simular al modal de busqueda rapida, el modal a cerrarse no tiene que perder el contenido, ni tampoco perderse al recargar la pagina. editorArticuloToggle no es necesario, la seleccion de descarga publica algo que tiene que funcionar individualmente para cada adjunto de coleccion o sample, los sampled adjuntos tienen que verse como se ven en feed de sampled, y las colecciones como se ve coleccionHeader

el modal tiene que ser mas ancho


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

## 193A-2

Borrar o mover el resumen de las tareas del dia anterior. "## Historial compactado" Vaciarlo para las tareas de hoy.

## 193A-3

El sync tiene un problema y es que imagina esta situación

tengo carpeta A, y carpeta B, en ambas tengo una subcarpeta A, que sucede, lo correctoería que al sincronizar, los audios de subcarpeta A de ambas tengan el padre que les corresponde pues, por la jerarquía de carpetas, sucede que los audios de ambas subcarpeta se suben a una coleccion del mismo nombre pero todas son del mismo padre, o sea, es un error. 

Lo correcto es que las subcarpetas puedan tener el mismo nombre pero que al sincronizar, se mantenga la jerarquía, o sea, los audios de la subcarpeta A de la carpeta A tengan como padre a la carpeta A y los audios de la subcarpeta A de la carpeta B tengan como padre a la carpeta B.




## Penultima tarea (no vovlver a correr el comando de generar schema y repositories sin revisar esto antes)

Hay un error grave como el comando que genera los schema y repositories, vi que lo ejecuaste una vez y se borraron algunas cosas que restaure despues, cuando todas las tareas anteriores esten listas, tienes que correrlo sin hacer pull y revisar los cambios que hizo porque hay cosas raras que no debería de hacer. No pude restaurar PushSubscriptionsDTO, por favor revisa si quedo bien.


## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio 
3. indicarme donde esta en nuevo instalador
4. Agregar 2 botones en el menu contextual de usuario en el nav para descargar el instalador y la apk. Esto tiene que actualizarse cuando vayamos a subir una nueva versión, podemos gestionarla aqui en el propio github de https://github.com/1ndoryu/kamples-sync pero sin complicarnos la vida, nada de eso de publicar en github a traves de un token, etc, gestionamos las versiones internamente en nuestro propio github, detectamos versiones y actualizamos los links de descarga en el menu contextual. Tambien ahora que lo pienso falta un sistema de version que aparezca en el menu contextual, sería 3 versionados, el instalador de windows, la apk, y la versión web, cada uno con su propio número de versión, y que se actualicen automáticamente cuando subamos una nueva versión, aparecería en el menu contextual de usuario y en las configuraicones pero claro aparecera especificamente para el tipo de dispositivo. Se me ocurre que cuando el usuario tenga una version desactualizada le aparezca un modal que pueda omitir pero que aperezca cada vez que recargue de actualizar. 