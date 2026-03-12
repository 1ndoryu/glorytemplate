# Kamples -- Roadmap Integral de Producto

> **Version:** 4.2 | **Ultima actualizacion:** 06/03/2026 | **Stack:** Glory Framework (WP + React Islands + TS)

## Indice de Modulos

Este roadmap esta organizado en archivos modulares para facilitar la navegacion y el mantenimiento.

| Modulo          | Archivo                                                                | Contenido                                                            |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Arquitectura    | [docs/roadmap/arquitectura.md](docs/roadmap/arquitectura.md)           | Vision, stack, paginas, planes, notas compactas                      |
| Pendientes      | [docs/roadmap/pendientes.md](docs/roadmap/pendientes.md)               | Tareas pendientes por fase (8-13), sprint revision, auditorias       |
| Completado      | [docs/roadmap/completado.md](docs/roadmap/completado.md)               | Todo el trabajo completado (F0-F7, Sync, Algoritmo, Desktop)         |
| Referencia Sync | [docs/roadmap/referencia-sync.md](docs/roadmap/referencia-sync.md)     | Arquitectura de referencia Sync v2 + Cola IA                         |
| Lecciones       | [docs/roadmap/lecciones.md](docs/roadmap/lecciones.md)                 | Gotchas y lecciones aprendidas por dominio                           |
| Dedup Global    | [docs/roadmap/plan-dedup-global.md](docs/roadmap/plan-dedup-global.md) | Plan "1 sample = 1 existencia" — dedup server + desktop + moderacion |

### Documentacion adicional

- `App/docs/algoritmo.md` -- Algoritmo de descubrimiento (changelog de auditorias)
- `App/docs/plan-sync-optimizacion.md` -- Plan de optimizacion sync (fases completadas)
- `App/docs/plan-sync-mejoras-v3.md` -- Auditoria de seguridad sync (v3)
- `App/docs/moderacion.md` -- Sistema de moderacion IA
- `App/docs/monetizacion.md` -- Modelo de monetizacion y revenue share
- `App/docs/plan-daw-channelrack-mixer.md` -- Plan DAW (Channel Rack + Mixer)
- `App/docs/plan-piano-roll.md` -- Plan Piano Roll
- `App/solid-seguridad-optimizacion.md` -- SOLID, seguridad y optimizacion
- `App/docs/roadmap/plan-dedup-global.md` -- Plan de deduplicacion global (1 sample = 1 existencia)
- `App/docs/plan-samples-metadata.md` -- Plan Sample Discovery & Metadata Engine (scraping + extraccion audio + whosampled data)

---

## Protocolo de actualizacion

1. Al completar una tarea, actualizar `docs/roadmap/pendientes.md` (mover a completado) y `docs/roadmap/completado.md`
2. Al descubrir un gotcha, documentar en `docs/roadmap/lecciones.md` bajo la seccion correspondiente
3. Al cambiar arquitectura o stack, actualizar `docs/roadmap/arquitectura.md`
4. Compactar secciones completadas cuando superen 10 items detallados

## Tareas nuevas a organizar, borrar esto despues de organizar

## QQ14 ✅ [AG-QQF]

Logout via API (POST /auth/logout) sin redirigir a wp-login.php. TopBar usa cerrarSesion() de apiAuth.ts + reload a /. GuardiaWpAdmin.php bloquea wp-admin y wp-login.php para no-admins (excepto AJAX, admin-post, logout nativo fallback). Archivos: AuthController.php (ruta+método), apiAuth.ts, TopBar.tsx, GuardiaWpAdmin.php, KamplesInit.php.

## QQ15 ✅ [AG-QQF]

Fix búsqueda/tags en feed: setBusqueda ya no auto-parsea tags (filtrosStore.ts). Comparación de tags normalizada con normalizarTag() en ambos lados (useFeedFiltros.ts). Búsqueda multi-término por coma con normalización de sinónimos.

## QQ16 ✅ [AG-QQF]

Separación Pro/Precio en creación y feed. Pro (Crown) = descarga exclusiva Pro, genera ingresos. Precio ($) = cualquiera puede comprar. Backend: DescargasController maneja 4 combinaciones (esPremium × precio) independientemente. Frontend: ContenidoCrear con 4 toggles (descarga/pro/precio/usuarios). TarjetaSample muestra icono $/Crown/Plus según estado. Archivos: DescargasController.php, useCrearContenido.ts, ContenidoCrear.tsx, useTarjetaSample.ts, TarjetaSample.tsx, tarjetaSample.css, modalCrear.css.

## QQ17 ✅ [AG-QQF]

Fix URLs colecciones con números: backfill automático de slugs NULL en colecciones existentes via `ColeccionesRepository::generarSlugsFaltantes()` (one-time run con WP transient). Colecciones nuevas ya generan slug al crearse. Frontend ya usaba `coleccion.slug ?? coleccion.id`. Archivo: KamplesInit.php.

## QQ18 ✅ [AG-QQF]

Fix comentarios en publicaciones del perfil: PerfilIsland ahora pasa `onLike`, `onComentar` y renderiza `SeccionComentariosPost` como children de TarjetaPublicacion. Hook usePerfilIsland con `manejarLikePost` (optimistic), `comentariosAbiertos` (Set), `alternarComentarios`. Archivos: usePerfilIsland.ts, PerfilIsland.tsx.

## QQ19 ✅ [AG-QQF]

"También te podría gustar" unificado con panel lateral. Página individual: eliminado renderizado inline y item en menú contextual — ahora al dar like se abre el panel lateral con PanelSugerencias (mismo flujo que feed). Feed: agregado item "También te podría gustar" (sin icono) en menú contextual que abre panel lateral. Archivos: useSampleDetalle.ts, SampleDetalleIsland.tsx, useMenuContextualSample.ts.

## QQ20

Las publicaciones deberían mostrar al menos 1 comentario, sin abrir los comentarios, (el comentario que tenga mas like), no estoy queriendo decir que se muestren todos los comentarios, se mostrarn al abrir los comentarios obviamente pero por defecto 1 esta bien sin tener que abrir.

## QQ21

inicioTagsContador no se esta actualizando con la busqueda

## QQ21

Normalizar en el front, que todos los samples sean en ingles, verificar que la IA realmente genere los tags en ambas idiomas, preservarlos, sirve para enriqueser la busqueda por si alguien busca en español pero, en el front ahora usaremos solo tags en ingles

## QQ22

En la informacion de los samples falta informacion al inspesionar, no dice la ruta de archivo original y optimizado

Duracion
0:18
Ruta Preview
http://glory.local/wp-content/uploads/kamples/0/2026/03/FjiKSr6_preview.mp3
Ruta Waveform
http://glory.local/wp-content/uploads/kamples/0/2026/03/FjiKSr6_waveform.json
Archivo Original
—
Audio Optimizado
—
Imagen URL
http://glory.local/wp-content/uploads/kamples/portadas/a0719513592a1e3a5410c591c6bb56c0ebaa4ab3.jpg

Tambien falta informacion nueva de cosas que se agregaron, falta muchisima informacion que se pueede inspesionar, el inspector no esta actualizado, revisar que falta y actualizar.

## QQ23 ✅ [AG-QQF]

Menú 3 puntos en perfiles de otros usuarios con Reportar + Bloquear/Desbloquear. Backend: POST `/reportar-usuario/{userId}` en SocialController (rate limit 5/24h, sanitización, ReportesRepository::crearReporteUsuario con tipo='usuario'). Frontend: reportarUsuarioStore (Zustand), ModalReportarUsuario + useReportarUsuario hook (reutiliza CSS de modalReportarError), useMenuContextualPerfil (construye items dinámicos con bloqueosStore). PerfilIsland: botón MoreHorizontal + MenuContextual. Chat: useVentanaChat report/block conectados a stores reales (antes eran placeholders). ModalReportarUsuario montado globalmente en LayoutPrincipal.

## QQ24 ✅ [AG-QQF]

Fix texto garbled en reportes (â€" en vez de —). Causa: PostgresService.php no seteaba `client_encoding` en la conexion PDO, causando Mojibake (UTF-8 bytes interpretados como Latin-1). Fix: agregado `SET client_encoding = 'UTF8'` en PostgresService.php despues de crear conexion. Aplica a toda la aplicacion, no solo reportes.

## QQ25 ✅ [AG-QQF]

Sistema de bloqueo user-to-user completo. BD: tabla `bloqueos` (PK, FK, UNIQUE, CHECK, indices). Schema: BloqueoSchema + BloqueoCols + BloqueoDTO. Backend: BloqueosRepository con CRUD + `sqlExcluirBloqueados()` helper reutilizable para SQL subqueries bidireccionales. API: POST/DELETE /block/{userId} (con rate limit + auto-unfollow mutuo), GET /me/bloqueados. Filtrado bidireccional inyectado en: MotorRecomendacion (feed personalizado + nuevo usuario), SamplesRepository (listarFeed, buscarSimilares, buscarPorScoring, listarConFiltros), PublicacionesController (feed social), ComentariosRepository (raíz + respuestas), NotificacionesRepository (listarConActor). Frontend: bloqueosStore (Zustand), apiBloqueos service, SeccionBloqueos en ModalConfiguracion. Perfil: campo `bloqueado` en respuesta de perfil público.

## QQ27

Mejorar el sistema notificaciones, primero, no tiene que mostrar iconos, sino imagenes, se respecto a un sample mmuestra la imagen del sample, si esta relacionado con un usuario, muestra la foto de perfil del usuario, las cosas que no tienen nada que ver con samples o usuarios bueno se deja con un icono ok,

en vez de Alguien comento en tu publicacion, debería ser Carlos comento tu publicacion "Hola como..." (nombre de usuario) y (trzo inicial de comentario)

tambien me di cuenta que las notificaciones tienen el problema de que no se pueden abrir en otra pestaña dando click con el boton central de rueda.

No vi notificacion cuando un comentario fue rechazado automaticamente o una publicacion,

## QQ28 ✅ [AG-QQF]

Fix 404 en URLs directas (publicaciones y otras rutas): En `PageTemplateInterceptor::forzarResolucionDinamica()`, si `get_page_by_path()` retorna null pero la pagina esta definida en `PageDefinition::getPaginasDefinidas()`, se auto-crea la pagina WP via `PageProcessor::crearPaginaDefinida()` con transient de 300s para evitar intentos repetidos. Aplica tanto a rutas dinamicas (publicacion/87) como paginas estaticas. Archivos: Glory/src/Manager/PageTemplateInterceptor.php.

## QQ29 ✅ [AG-QQF]

feedSamplesContenedor ya no aparece en relaciones sin samples. Se agrego `total_samples` al query de `porRelacionId()` via subquery (cuenta samples activos por `sample_fuente_id`, `sample_destino_id` y `relacion_sampleo_id`). Normalizer incluye `totalSamples` en la respuesta. `RelacionDetalleIsland` ahora guarda `FeedSamples` con `relacion.totalSamples > 0`, evitando peticion innecesaria. Archivos: RelacionesSampleRepository.php, NormalizadorCancion.php, cancion.ts, RelacionDetalleIsland.tsx.

## QQ30

Es absurdo que cuando le click a Adjuntar sample manual o "Subir sample de esta canción" en los sampleos o canciones, al escribir algo sin poner un audio me permita publicar, (en las publicaciones normales si tiene sentido)  

crearCondiciones tambien es absurdo que aparezca en ese contexto, por defecto las descargas tienen que estar activa, no permitir premiun ni precio

Tambien hay que ajustar los estilos en esa parte

## QQ30.1 

Esta estrucutra se ve muy bien, no esta mal 

<div class="crearPrecioContenedor"><label class="crearPrecioLabel" for="crearPrecioInput">Precio (USD)</label><div class="contenedorCampoTexto "><input class="campTextoInput campoBordado " id="crearPrecioInput" type="number" min="0.50" max="99.99" step="0.01" placeholder="2.99" value=""></div></div>

el problema es que crearPrecioContenedor, y crearElementoContenedor tienen estilos diferente cuando deberían ser los mismos que crearPrecioContenedor

en selectorMenuContenedor selectorMenuCompacto el select no debería ser un boton, debería ser algo como el select que aparece en el modal de editar sample "selectorMenuContenedor", el mismo estilo

## QQ30.2 

Ccuando leiste la tarea y la empezaste a hacer no la leiste completa porque no la habia terminado de explicar,

agrege de explicacion: "encrearCondiciones tambien es absurdo que aparezca ciertos botones por defecto las descargas tienen que estar activa y no aparecer para que no se pueda cambiar, y no permitir premiun ni precio que no aparezcan esos botoenes, el unico boton permitido es el de comunidad y por defecto ahi tiene que estar desactivado."

## QQ31

El boton de mensaje en los perfil a dar click, el chat tarda en abrir y los mensajes en cargar ¿por qué? esta ¿optimizado esto? 

## QQ32 

Mejora social. 

Por defecto se crea una partoda con imagenes de colors en perfilPortada, quitar esto, que ya no haya portadas, la foto de perfil ahora iría al lado del nombre y descripcion y la info de seguidores debajo (ME RETRACTO)

Quitar la fecha de cuando se unio, y contador de siguiendo. 

Cuando se de click a los seguidores debe mostar un modal con una lista con carga optimizada por scroll, la lista muestra los seguidores, y con un boton de seguir, obivamente si ya sigues pues el boton aparece como dejar de seguir.

En configuracion, permitir un input de enalce, ese enlace aparecera al lado de los seguidores y en el perfil y abrira en otra pestaña, si el enlace es muy largo que se recorte visualmente

## QQ33 ✅ [AG-QQF]

Fix errores IDE: PipelineAudio usaba `DuplicadosPendientesRepository::crear()` inexistente → cambiado a `insertarRegistro()`. SocialController usaba `RateLimiter::verificar()` inexistente → cambiado a `verificarUsuario()`. SocialController excedía 300 líneas → extraído bloqueo+reportes a nuevo `ModeracionController.php` (141 líneas). Limpiados imports muertos (CancionesCols, RelacionesSampleCols). Registrado ModeracionController en KamplesController.

## QQ34 

Mejorar el landing publico para seo, mejorar los textos, manterlos breve.
Los svg son muy pesados, tienen imagenes internas que deberían ser optimizadas, no se como optimizarlas, tambien en caos de que esas imagenes internas puedan cargar de forma no bloqueante, sea una buena optimización

## QQ35

El modal de configuracion no se ve bien en movil, le falta responsive.

## QQ36 

¿Porque cuando reproduzco los videos de youtube en los sampleos y canciones? dice 
Inicia sesión para confirmar que no eres un bot
De esta forma nos ayudas a proteger nuestra comunidad. Más información

en whosampled no pasa eso

si es porque estamos en local, lo entiendo, ignoralo pero si hay forma de arregalarlo, arreglalo.

## QQ37 ✅ [AG-QQF]

Resuelto por QQ28. El fix en `forzarResolucionDinamica()` auto-crea paginas WP faltantes (perfil, admin/panel, publicacion, etc.) cuando estan definidas en PageDefinition pero ausentes en BD. Cubre rutas dinamicas (/perfil/{username}) y estaticas (/admin/panel). Si la pagina se borra o no se sincronizo, se recrea al primer acceso con transient de 300s para evitar intentos repetidos. `crearPaginaDefinida()` ya maneja jerarquia padre/hijo (`asegurarPaginaPadre()` recursivo).

## QQ38 ✅ [AG-QQF]

Sistema de reportes centralizado. Un solo modal (ModalReportar), store (reportarStore), hook (useReportar) y endpoint backend (POST /reportar) para todos los tipos: usuario, publicacion, comentario, sample, error_plataforma. Backend: ModeracionController::reportarGenerico con validacion especifica por tipo (existencia, duplicados, rate limit). Frontend: reportarStore con tipo+targetId+targetNombre, ModalReportar adapta UI segun tipo. Eliminados: ModalReportarUsuario, ModalReportarError, reportarUsuarioStore, reportarErrorStore, useReportarUsuario, useReportarError. Migrados: useMenuContextualPerfil, useMenuContextualPublicacion (era window.prompt), useVentanaChat, useComentarioItem, useMenuContextualSample (tenia TO-DO), Sidebar, LayoutPrincipal.

## QQ39 

Quitar el tab de like de los perfiles.

Se que antes habia dicho que habia que quitar las portadas, me arrepiento, ya nos las quites.

## QQ40 

Hay errores ortograficos en el modal de iniciar sesion y registro

Agregar la funcionalidad de registrarse con google, en local no suele funcionar pero en produccion tiene que funcionar, la url sera ya sabes kamples.com

mi id de cliente la puse en el env

## QQ41 

Cambiar el buscador de inicio por un boton de registro secundario y otro primario de descargar, eso descargaría la aplicación.

Crea un md de como alojar la aplicación de forma de que se actualice en todos los usuarios, hacer lo necesario para que la autoactulización funcione, y como hacer el instalador ,etc.

## QQ42

verificar que el sync respete cuando  "Al borrar en local, borrar en el servidor" este desactivado para evitar perdida de datos. Cuando esto este desactivado, no vuelve a descargar los samples que se borraron en local. Implica agregar un boton de refozar sync en donde todos los samples que faltan se vuelven a descargar. El boton iría en el menu contexta, haria lo mismo que sicnronizar ahora pero con el agregado que fuerza descargar lo que falta. 

## QQ43

Verificar TO-DO sueltos en la aplicación y haz los que sean importantes.

## QQ44

La opción de mostrar kamples en el icono de bandeja de entrada en la aplicación no funciona, no vuelve a aparecer la aplicación, solo el sync