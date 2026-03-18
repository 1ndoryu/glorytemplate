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

- **183A-41, 183A-42, 183A-43:** Completadas 2026-03-18. Modal login en APK restaura sesión desde token nativo. SHA-1 debug: `66:96:CC:30:9F:D0:76:3A:B7:A3:34:6F:DD:68:28:A8:27:C5:73:B3`. Push notifications: service account configurado en servidor, tabla fcm_tokens creada, OAuth2 operativo.

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

## 183A-32

agregar un boton del like a a las caciones dentro de 
<div class="tarjetaCancionGrandeInfo" role="button" tabindex="0"><p class="tarjetaCancionGrandeTitulo">Think (About It)</p><p class="tarjetaCancionGrandeArtista">Lyn Collins</p></div>
tambien falta uno al lado del boton de 3 puntos dentro de la cancion 

## 183A-34

Que dar click derecho a una coleccion abra su menu contextual.

## 183A-35

El buscador en el landing deslogeada no funciona y recarga la pagina, cosa que no deebería de pasar. 

## 183A-36

App\React\logs\google-services.json deje el archivo ahi, continua con lo que falta de las ntoificaciones en la apk.
la apk se cierra apenas la abro.

Nota del agente 2026-03-18: el archivo ya fue copiado a `mobile/android/app/google-services.json`, `cap sync` y `gradlew assembleDebug/installDebug` funcionan, y `processDebugGoogleServices` resolvio `google_app_id = 1:903865707437:android:dab0b5259ae7db18d9cf24` (cliente correcto de `com.kamples.mobile`). En el emulador la app queda abierta y MainActivity sigue en foreground; no pude reproducir el cierre. Lo pendiente de 183A-36 es capturar el crash real si sigue ocurriendo en otro dispositivo/flujo.

## 183A-37

Siguen sin aparecer las notificaciones en android sobre la app.
Sigue el mensaje de this app has not posted any norifications. 

## 183A-38

En la parte de las publicaciones de comunidad y feed de samples hace falta que al tirar hacia arriba en movil, recargue. 

## 183A-39

Error visual, el modal de usuario cuando se pone el cursor sobre el nombre, a dar click al nombre el modal se queda, debería desaparecer a dar click al usuario o fuera del modal.

## 183A-40

Utilizar optimizarImagen de glory para todas las imagenes, que tenga alguna equivalencia el react la funcion de glory, para optimizar las imagenes automaticamente, eso incluye las imagenes de portada de los samples, publicaciones, imagenes en los mensajes, foto de perfil, portadas de canciones y en los sampleos, etc.

## 183A-44

a dar click a la foto de perfil

Error de render
Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Error: Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at qt (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:39:18245)
    at mc (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:39:21217)
    at Object.ih [as useLayoutEffect] (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:39:21550)
    at D1.Ye.useLayoutEffect (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:10:6209)
    at ja (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:853:9060)
    at Qd (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:39:17650)
    at ou (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:41:3158)
    at rg (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:41:45517)
    at eg (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:41:40334)
    at x1 (https://kamples.com/wp-content/themes/glorytemplate/Glory/assets/react/dist/assets/main-Dgfp5M_m.js:41:40262)
