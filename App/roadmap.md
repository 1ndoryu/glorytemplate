# Kamples -- Roadmap Integral de Producto

> **Version:** 4.2 | **Ultima actualizacion:** 06/03/2026 | **Stack:** Glory Framework (WP + React Islands + TS)

## Indice de Modulos

Este roadmap esta organizado en archivos modulares para facilitar la navegacion y el mantenimiento.

| Modulo | Archivo | Contenido |
|---|---|---|
| Arquitectura | [docs/roadmap/arquitectura.md](docs/roadmap/arquitectura.md) | Vision, stack, paginas, planes, notas compactas |
| Pendientes | [docs/roadmap/pendientes.md](docs/roadmap/pendientes.md) | Tareas pendientes por fase (8-13), sprint revision, auditorias |
| Completado | [docs/roadmap/completado.md](docs/roadmap/completado.md) | Todo el trabajo completado (F0-F7, Sync, Algoritmo, Desktop) |
| Referencia Sync | [docs/roadmap/referencia-sync.md](docs/roadmap/referencia-sync.md) | Arquitectura de referencia Sync v2 + Cola IA |
| Lecciones | [docs/roadmap/lecciones.md](docs/roadmap/lecciones.md) | Gotchas y lecciones aprendidas por dominio |
| Dedup Global | [docs/roadmap/plan-dedup-global.md](docs/roadmap/plan-dedup-global.md) | Plan "1 sample = 1 existencia" — dedup server + desktop + moderacion |

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

## QQ16

Creo que no se entiendo bien esta tarea porque pedi 2 acciones mas en crearCondiciones, la de pro que ya lo tiene, esto hace que el sample solo se pueda descargar por pro, generan un ingreso al usuario, el tooltip debería de decir eso brevemente, y los la otra opcion con $ es para poner precio, los usuarios no necesitan ser pro para comprar samples.

Cito tarea como fue escrito originalmente

"El mecanismo de samples pro, si bien veo que se marca el sample como pro, y no se puede descargar. ¿Para que es el precio? Probe desde una cuenta pro pero no puedo pagarlo.

Para los free funciona bien, les sale el modal para volverse premiuns pero es que, no debería ser necesario ser premiun para comprar un sample

claro esta que el mecanismo de comprar sample no esta lista, lo que haremos es que haya 2 opciones al publicar un sample, 

Una opcion para Pro, los samples pro generan ingresos a los usuarios. Aqui la descarga obligatoriamente estara activa. 

Precio, se activa un icono de $precio$, alli si aparece el input de precio, y cuando haya precio, aparece un icono de $ con el precio remplazando el descarga, a dar click debería abrir stripe para completar la compra. Luego tiene que enviarle el sample para descargar por correo. 

Esto conlleva a crear en http://glory.local/descargas/ una pagina de comprado donde aparezca los smaples que compro el usuario."

## QQ17

Sigo viendo que las url de las colecciones son numeros en vez de sus nombres (http://glory.local/coleccion/91/)

## QQ18

Los comentarios de las publicaciones en los perfiles no se pueden abrir.

## QQ19

En las paginas individuales de los samples en el menu contextual aparece "También te podría gustar" , lo cual es extraño porque, en los samples del feed no aparece esa opcion, debería aparecer, y hay que quitar el icono, en los sampled del feed, al dar like aparece el panel lateral para mostrar los samples que podrian gustar, eso debería ser igual en la pagina individuales "También te podría gustar" debería aparecer en el panel, no debajo de los detalles del sample

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