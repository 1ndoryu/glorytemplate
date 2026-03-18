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

## Tareas pendientes

## 183A-25

El cache de feed de sampled me parece muy agresivo, pero necesito saber como funciona, hacer una documentacion sobre el cache del feed de samples.  Veo que los samples cargan imagenes de portada de colors (temporales) cuando ya tienen una imagen en su coleccion, no se si es por el cache o porque falla algo, al menos en recientes las imagenes si aparecen bien. 

## 183A-29

Vi que implementaste una tabla de like paras las colecciones, bien, puedes ahora hacer un plan para mejorar el algoritmo de las colecciones, para que se ordenen por relevancia al usuario, algo optimizado y minimalista. 

## 183A-30 

ya entiendo sobre la tarea de 183A-25, esto se implemento anteriormente lo de cache en la primera pagina, no esta mal pero, ese cache debería actualizarse despues de que el usuario lo ve y en tiempo real, o sea, es para que tenga un respuesta rapida pero despues se actualice con los datos reales, no para que el usuario vea datos desactualizados. 

+----------------------------------------------------+----------+
| Componente                                         | Tiempo   |
+----------------------------------------------------+----------+
| PerfilUsuario::construir (sin cache)               |    32.9ms |
| Conteo samples activos (SQL COUNT)                 |     9.3ms |
| Verificacion pgvector                              |     9.2ms |
| SQL gen: Comportamiento (0.27)                     |     0.1ms |
| SQL gen: Contexto (0.15)                           |     0.0ms |
| SQL gen: Tendencias (0.12)                         |     0.0ms |
| SQL gen: Grafo Social (0.1)                        |     0.0ms |
| SQL gen: Similitud pgvector (0.28)                 |     0.8ms |
| >> FEED pag1 sin cache fresco <<                   |     3.6ms |
| >> FEED pag2 sin cache <<                          |   199.8ms |
| >> FEED pag3 sin cache <<                          |   266.1ms |
| Feed pag3 cache hit                                |     2.9ms |
+----------------------------------------------------+----------+
| PROMEDIO feed sin cache (3 pags)                   |   156.5ms |
+----------------------------------------------------+----------+

=== RESUMEN (para documentacion) ===
Fecha: 2026-03-18 07:07:24 | Config: df224c3e
Samples: 984 | pgvector: SI | Pipeline: NO
Feed pag1 (sin cache fresco): 4ms | pag2: 200ms | pag3: 266ms | promedio: 157ms | cache: 3ms
Perfil: 33ms | Conteo: 9ms
=== FIN ===

Lo que necesito un plan agresivo y revision del algorito (ya habia un plan en los docs viejo, revisa), planifica mas optimizaciones agresivas sin que el algoritmo pierda calidad, la meta reducir el tiempo a 50ms promedio sin cache. 

## 183A-31

La pagina de musica carga lento a veces, revisar y optimizar.

## 183A-40

Utilizar optimizarImagen de glory para todas las imagenes, que tenga alguna equivalencia el react la funcion de glory, para optimizar las imagenes automaticamente, eso incluye las imagenes de portada de los samples, publicaciones, imagenes en los mensajes, foto de perfil, portadas de canciones y en los sampleos, etc.



## 183A-49

Hacer una revision profunda de las notificaciones
deben ser en vez de "Alguien comento en tu publicacion" debe ser mas descriptivo como @Wan comento tu publicacion "titulo de la publicac..." o algo asi,
asegurar que a dar click vayan al contenido relacionado
asegurar que todas las notificaciones aparezcan en android, ya probe que funciona pero hay que asegurarnos que sea descriptivo tambien, y que aparezca la imagen relacionada si hay alguna
tambien que aparezca un reproductor cuando se reproduzca un sample en android, que se pueda controlar desde la notificacion, y que al dar click en la notificacion vaya a la pagina del sample o de la cancion relacionada.

## 183A-50

Las acciones multiples en los samples no actualizan en tiempo real los samples afectados, revisar en profundidad esta funcionalidad y ajustar.

## 183A-51

letras raras, probe subir una carpeta al sync, la puse con este nombre 𝔐𝔢𝔪𝔭𝔥𝔦𝔰 𝔄𝔠𝔞𝔭𝔢𝔩𝔩𝔞𝔰 
el enlace aparece con esas letras, pero, no funciona, imagino que es un problema que no se previno, hay que revisar que pasa, dice Colección no encontrada, con colecciones con nombres normales no pasa eso, los archivos tambien tienen esas letras, espero que no afecte la generaicon de json o cosas asi o aumete los token de la ia.

## 183A-52

al dar click a la imagen de portada o texto del sample en el reproductor, ir directo a la pagina de ese sample.

## 183A-53

Lo de combinar colecciones, no funciona. Hacer una revision profunda.

## 183A-54

quitar el padding de los botones .tarjetaColeccionMenuContenedor y agregar un boton que abra los samples de esa coleccion en el panellateral

## 183A-55

En el panel lateral de los samples, arriba de También te podría gustar agregar info de que coleccion pertece, el sample, la imagen de portada en proporcion 3:2 cover, estilo spotify, y dentro sobre la imagen en la esquina abajo izquierda el titulo y abajo el autor de la coleccion, siempre muestra la coleccion de quien subio el sample, sino, la de cualquier otro usuario. Que esto este optmizado, 

## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio 
2. generar el apk para probar en un dispositivo real
3. indicarme donde estan los archivos.