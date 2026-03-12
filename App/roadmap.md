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

## QQ23

Hace Falta un boton de 3 puntos en los perfiles de otros usuarios en http://glory.local/ para las acciones de reportar, bloquear, debería abrir el mismo modal de reporte e enviar por ahi mismo con el usuario adjunto ya por defecto, (el que se esta repotando)

En los mensajes hay un boton de 3 puntos cuando se abre el chat, y ahi un reportar alli pero no funciona solo muestra una alerta pero no veo el reporte en moderación,

Tambien hay un boton de bloquear

## QQ24

No se si ya comente este problema pero en los repotes hay un problema, se ven asi

Reportes pendientes (2)
@admin
hace 57m
error_plataforma #0 â€”
@admin
hace 58m
error_plataforma #0 â€”

## QQ25

La accion de bloqueo debería hacer 2 cosas, una el usuario bloqueado no ven sus publicaciones entre ellos, ni sus samples, ni comentarios ni nada, cero contacto.

Tambien hace falta algo para desbloquear usuarios, podemos aprovechar el modal de configuraciones para agregar una tab de bloqueos, y mna lista de los bloqueos y poder desbloquear

## QQ27

Mejorar el sistema notificaciones, primero, no tiene que mostrar iconos, sino imagenes, se respecto a un sample mmuestra la imagen del sample, si esta relacionado con un usuario, muestra la foto de perfil del usuario, las cosas que no tienen nada que ver con samples o usuarios bueno se deja con un icono ok,

en vez de Alguien comento en tu publicacion, debería ser Carlos comento tu publicacion "Hola como..." (nombre de usuario) y (trzo inicial de comentario)

tambien me di cuenta que las notificaciones tienen el problema de que no se pueden abrir en otra pestaña dando click con el boton central de rueda.

No vi notificacion cuando un comentario fue rechazado automaticamente o una publicacion,

## QQ28

Las urles de las publicaciones son asi http://glory.local/publicacion/87/ creo que no esta mal, si se puede mejorar para seo ok, mejor dejalo asi, el punto es que si voy directamente a las publicaciones da error, no carga la pagina da 404 pero si navego desde la pagina cargada si abre la pagina, el mismo problema de ## QQ4.

## QQ29

feedSamplesContenedor aparece en las canciones cuando no tienen samples (no confundir con samples) adjuntos aún, no debería, porque intenta cargar smaples cuando no tiene ninguno

## QQ30

Es absurdo que cuando le click a Adjuntar sample manual en los sampleos o canciones, al escribir algo sin poner un audio me permita publicar, (en las publicaciones normales si tiene sentido) 

crearCondiciones tambien es absurdo que aparezca en ese contexto y tambien con 

Tambien hay que ajustar los estilos en esa parte

## QQ30.1 

Esta estrucutra se ve muy bien, no esta mal 

<div class="crearPrecioContenedor"><label class="crearPrecioLabel" for="crearPrecioInput">Precio (USD)</label><div class="contenedorCampoTexto "><input class="campTextoInput campoBordado " id="crearPrecioInput" type="number" min="0.50" max="99.99" step="0.01" placeholder="2.99" value=""></div></div>

el problema es que crearPrecioContenedor, y crearElementoContenedor tienen estilos diferente cuando deberían ser los mismos que crearPrecioContenedor

en selectorMenuContenedor selectorMenuCompacto el select no debería ser un boton, debería ser algo como el select que aparece en el modal de editar sample "selectorMenuContenedor", el mismo estilo