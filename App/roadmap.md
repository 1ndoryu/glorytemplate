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


## 183A-36

App\React\logs\google-services.json deje el archivo ahi, continua con lo que falta de las ntoificaciones en la apk.
la apk se cierra apenas la abro.

Nota del agente 2026-03-18: el archivo ya fue copiado a `mobile/android/app/google-services.json`, `cap sync` y `gradlew assembleDebug/installDebug` funcionan, y `processDebugGoogleServices` resolvio `google_app_id = 1:903865707437:android:dab0b5259ae7db18d9cf24` (cliente correcto de `com.kamples.mobile`). En el emulador la app queda abierta y MainActivity sigue en foreground; no pude reproducir el cierre. Lo pendiente de 183A-36 es capturar el crash real si sigue ocurriendo en otro dispositivo/flujo.

## 183A-38

En la parte de las publicaciones de comunidad y feed de samples hace falta que al tirar hacia arriba en movil, recargue. 

## 183A-40

Utilizar optimizarImagen de glory para todas las imagenes, que tenga alguna equivalencia el react la funcion de glory, para optimizar las imagenes automaticamente, eso incluye las imagenes de portada de los samples, publicaciones, imagenes en los mensajes, foto de perfil, portadas de canciones y en los sampleos, etc.

## 183A-46

PS C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate>npm run dev

> glory-theme@1.0.0 dev
> npm run dev --prefix Glory/assets/react


> glory-react@1.0.0 dev
> vite

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://10.8.0.2:5173/
  ➜  Network: http://192.168.0.127:5173/
  ➜  press h + enter to show help
Error: The following dependencies are imported but could not be resolved:

  @tauri-apps/api/app (imported by C:/Users/Owner/OneDrive/Documentos/WP/app/public/wp-content/themes/glorytemplate/App/React/hooks/useVerificadorVersion.ts)        
  @tauri-apps/plugin-shell (imported by C:/Users/Owner/OneDrive/Documentos/WP/app/public/wp-content/themes/glorytemplate/App/React/utils/plataforma.ts)
  @tauri-apps/plugin-notification (imported by C:/Users/Owner/OneDrive/Documentos/WP/app/public/wp-content/themes/glorytemplate/App/React/services/notificacionNativa.ts)

Are they installed?
    at file:///C:/Users/Owner/OneDrive/Documentos/WP/app/public/wp-content/themes/glorytemplate/Glory/assets/react/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:14849:15
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async file:///C:/Users/Owner/OneDrive/Documentos/WP/app/public/wp-content/themes/glorytemplate/Glory/assets/react/node_modules/vite/dist/node/chunks/dep-D4NMHUTW.js:47014:28

## 183A-47

perfilAcciones el boton de editar perfil ocultalo en movil, que se quede dentro del menu contextual de 3 puntos (ya esta ahi)

## 183A-48

eliminar este boton
<button class="botonBase varianteGhost tamanoMd devToolsBoton" type="button" aria-label="Dev Tools" title="Modo: Real"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg></button>

y toda su logica si es que tiene alguna 

## 183A-49

Hacer una revision profunda de las notificaciones
deben ser en vez de "Alguien comento en tu publicacion" debe ser mas descriptivo como @Wan comento tu publicacion "titulo de la publicac..." o algo asi,
asegurar que a dar click vayan al contenido relacionado
asegurar que todas las notificaciones aparezcan en android, ya probe que funciona pero hay que asegurarnos que sea descriptivo tambien, y que aparezca la imagen relacionada

## 183A-50

Las acciones multiples en los samples no actualizan en tiempo real los samples afectados, revisar en profundidad esta funcionalidad y ajustar.

## 183A-51

letras raras, probe subir una carpeta al sync, la pose con este nombre 𝔐𝔢𝔪𝔭𝔥𝔦𝔰 𝔄𝔠𝔞𝔭𝔢𝔩𝔩𝔞𝔰 
el enlace aparece con esas letras, pero, no funciona, imagino que es un problema que no se previno, hay que revisar que pasa, dice Colección no encontrada

## Tarea final cuando completes todo

1. rehacer el instalador de la aplicación de escritorio 
2. generar el apk para probar en un dispositivo real
3. indicarme donde estan los archivos.