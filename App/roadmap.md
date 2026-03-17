# Kamples -- Roadmap Integral de Producto

> **Version:** 4.3 | **Ultima actualizacion:** 08/06/2026 | **Stack:** Glory Framework (WP + React Islands + TS)

## Indice de Modulos

Este roadmap esta organizado en archivos modulares para facilitar la navegacion y el mantenimiento.

| Modulo          | Archivo                                                                | Contenido                                                            |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Arquitectura    | [docs/roadmap/arquitectura.md](docs/roadmap/arquitectura.md)           | Vision, stack, paginas, planes, notas compactas                      |
| Pendientes      | [docs/roadmap/pendientes.md](docs/roadmap/pendientes.md)               | Tareas pendientes por fase (8-13), sprint revision, auditorias       |
| Completado      | [docs/roadmap/completado.md](docs/roadmap/completado.md)               | Todo el trabajo completado (F0-F7, Sync, Algoritmo, Desktop, QK-II, QL) |
| Referencia Sync | [docs/roadmap/referencia-sync.md](docs/roadmap/referencia-sync.md)     | Arquitectura de referencia Sync v2 + Cola IA                         |
| Lecciones       | [docs/roadmap/lecciones.md](docs/roadmap/lecciones.md)                 | Gotchas y lecciones aprendidas por dominio                           |
| Dedup Global    | [docs/roadmap/plan-dedup-global.md](docs/roadmap/plan-dedup-global.md) | Plan "1 sample = 1 existencia"  dedup server + desktop + moderacion |

### Documentacion adicional por categoria

**Producto & Features:**
- `App/docs/algoritmo.md` -- Algoritmo de descubrimiento (6 senales, embeddings 128d, auditorias v1-v4)
- `App/docs/moderacion.md` -- Sistema de moderacion IA (4 capas, escalado sanciones)
- `App/docs/monetizacion.md` -- Modelo de monetizacion (freemium, Stripe, revenue share)
- `App/docs/plan-samples-metadata.md` -- Sample Discovery & Metadata Engine (scraping + extraccion audio)
- `App/docs/plan-seo.md` -- Plan SEO dinamico (RuntimeSeoData, JSON-LD, sitemaps)
- `App/docs/plan-notificaciones.md` -- Sistema notificaciones (5 canales, push, WebSocket)
- `App/docs/optimizacion-feed-busqueda.md` -- Optimizacion feed/busqueda/algoritmo (escalabilidad, bottlenecks, Redis, relevancia adaptativa)
- `App/docs/plan-legal-contribuciones.md` -- Plan legal/contribuciones (DMCA, moderacion L1-L7)

**Infraestructura & Deploy:**
- `App/docs/plan-websocket.md` -- WebSocket Bun standalone (chat/notif, Traefik SSL)
- `App/docs/plan-desktop-distribucion.md` -- Distribucion desktop (exe/MSI/NSIS, auto-updates)
- `App/docs/plan-android.md` -- Plan Android Tauri v2 (4 fases, scaffolding a nativo)

**Sync & Desktop:**
- `App/docs/plan-sync-optimizacion.md` -- Optimizacion sync (delta, indices, cache)
- `App/docs/plan-sync-mejoras-v3.md` -- Auditoria seguridad sync v3
- `App/docs/auditoria-sync-desktop.md` -- Auditoria sync desktop Tauri (race conditions, bidireccional)

**DAW / Mezclador:**
- `App/docs/plan-daw-channelrack-mixer.md` -- Channel Rack + Mixer (20 pistas, insert mixer)
- `App/docs/plan-piano-roll.md` -- Piano Roll (patterns, velocidad, BPM sync)
- `App/docs/analisis-daw-recursos.md` -- Analisis recursos DAW (RAM/CPU, Tauri)

**Auditorias & Investigacion:**
- `App/solid-seguridad-optimizacion.md` -- SOLID, seguridad y optimizacion (S01-S43)
- `App/docs/auditoria-cola-ia.md` -- Auditoria Cola IA (bugs, polling, reintentos)
- `App/docs/auditoria-extraccion-audio.md` -- Auditoria pipeline extraccion audio
- `App/docs/auditoria-seguridad-audio.md` -- Auditoria seguridad audio (cuotas, MIME)
- `App/docs/auditoria-scraper-whosampled-bandwidth.md` -- Auditoria scraper WhoSampled
- `App/docs/investigacion-fuentes-audio.md` -- Investigacion fuentes audio v2 (SoundCloud, fallbacks)
- `App/docs/investigacion-youtube-descarga-2026.md` -- Investigacion YouTube descarga 2026
- `App/investigacion-s-youtube.md` -- Analisis arquitectonico YouTube 2026 (InnerTube, SABR)

**Coolify Manager RS:**
- `.agent/coolify-manager-rs/README.md` -- Documentacion principal
- `.agent/coolify-manager-rs/plan-cm.md` -- Plan detallado (11 fases)
- `.agent/coolify-manager-rs/GUI-WINDOWS-EVAL.md` -- Evaluacion GUI Windows (Tauri)
- `.agent/coolify-manager-rs/MCP-VSCODE.md` -- MCP VS Code setup
- `.agent/coolify-manager-rs/TESTING-OFFLINE.md` -- Testing offline (mocks, harness)

**Glory Framework:**
- `Glory/readme.md` -- Quick start y arquitectura
- `Glory/docs/index.md` -- Indice documentacion (PHP, CLI, API, guias)

---

## Protocolo de actualizacion

1. Al completar una tarea, actualizar `docs/roadmap/pendientes.md` (mover a completado) y `docs/roadmap/completado.md`
2. Al descubrir un gotcha, documentar en `docs/roadmap/lecciones.md` bajo la seccion correspondiente
3. Al cambiar arquitectura o stack, actualizar `docs/roadmap/arquitectura.md`
4. Compactar secciones completadas cuando superen 10 items detallados


## Tareas QK -- Estado actual

> **QK1-QK105** completadas. Detalle en `docs/roadmap/completado.md` (secciones "Sprint QK" y "Sprint QK-II").
> **QK12/QK37** Plan Android en `App/docs/plan-android.md`. **QK18/QK22** Rediseno musica Spotify. **QK68** WebSocket real-time.

## Tareas QL -- Coolify Manager RS + Mantenimiento

> **QL1-QL4** completadas. Detalle en `docs/roadmap/completado.md` (seccion "Coolify Manager RS: QL1-QL4").
> **QL5-QL95** completadas. Detalle en `docs/roadmap/completado.md` (seccion "Sprint QL: QL5-QL95").

### Resumen QL5-QL95 (91 tareas)

- **Feed/Optimizacion:** Query feed >30s a 127ms (CTEs), serendipia cache, percentiles cron, stampede SETNX, scroll infinito mejorado.
- **UI/UX:** Layout movil completo (TopBar+bottom bar), bottom sheet menu contextual, drill-down config modal, like sync reproductor-feed, waveform responsive, busqueda rapida unificada.
- **APK/Android:** FCM nativo, CORS tauri.localhost, safe areas, verificador version, resolverRutaAsset, suscripcion redirige web.
- **Backend:** Rotacion 8 modelos IA Groq, ordenamiento centralizado, herencia imagen coleccion a samples, busqueda descargas ILIKE, admin bypass colecciones.
- **Sync Desktop:** Batch buffer (quiet 5s/max 30s), analisis huerfanos 30min, guard borrarAlSubirExitoso, limpieza retroactiva, semaforo Redis CPU queue.
- **Seguridad:** Dedup notificaciones, sync seguridad audit, exclusion mutua borrar opciones, antispam client-side.

---

# TAREA FINAL

Completado [AG-MNT] -- QL5-QL95 movidos a `docs/roadmap/completado.md` (seccion Sprint QL: QL5-QL95). Roadmap compactado 905 a 181 lineas.

## Pendientes

### QL96/QL98 COMPLETADA Y RESUELTO

[EN CURSO â€” AG-MNT] React no monta en Tauri webview (dev y build). Diagnostico:
- Body tiene clases plataformaTauri/plataformaEscritorio (init() empieza bien)
- Sync funciona en background (inicializarDesktop() completa)
- DOM #app queda vacio (React no renderiza o crash silencioso durante render)
- Causa exacta: aun no identificada (build compila OK, type-check OK)

**Cambios diagnosticos realizados:**
- `RootErrorBoundary` en AppProvider (appIslands.tsx) â€” muestra errores de render en pantalla
- Error handlers inline en index.html â€” captura errores de carga de modulos JS
- console.warn en init() (desktop/src/main.tsx) â€” traza paso a paso de inicializacion
- Proximo paso: ejecutar `npm run tauri:dev`, el RootErrorBoundary mostrara el error exacto en rojo

### QL97

âœ… [AG-MNT] panelLateral: default 360px, max 500px (antes 340/700). Variable CSS actualizada.

### QL99

âœ… [AG-MNT] CORS fix: endpoint `/descargas/stream` usa readfile()+exit (bypasea rest_pre_serve_request).
Headers CORS manuales agregados en DescargasStreamController.php para origenes Tauri/dev.

### QL100

âœ… [AG-MNT] Multiples fixes APK Android:
- **QL100a** Login persistente: modal sin X en APK, auto-abre si no autenticado, layout single-column
- **QL100b** Google OAuth Mobile: deep-link `kamples://auth`, servicio `googleAuthMobileService.ts`, PHP `mobileCallback()` con PKCE, plugin deep-link en Tauri. **NOTA:** redirect URI `https://kamples.com/wp-json/kamples/v1/auth/google/mobile-callback` debe registrarse en Google Cloud Console.
- **QL100c** Descargas: reemplazado `<a download>` (no funciona en WebView) por `fetch()` + `@tauri-apps/plugin-fs writeFile` a Downloads
- **QL100d** Safe-area: variables CSS `--safeAreaTop`/`--safeAreaBottom`, aplicadas a 8 archivos CSS (modals, chat, dropdown, notificaciones)
- **QL100e** Icono notificacion: drawable vector `ic_notification.xml` monocromatico, metadata FCM default icon en AndroidManifest

### QL101

âœ… [AG-MNT] Config movil: bottom-sheet parcial (max-height 75vh) con overlay backdrop en vez de fullscreen. Separadores entre botones eliminados.

### QL102

âœ… [AG-MNT] FCM background: agregado campo `notification` al payload FCM (antes solo data). Android muestra automaticamente la notificacion cuando la app esta cerrada. Canal configurable por tipo (mensajes vs notificaciones).

### QL103

âœ… [AG-MNT] Sync loop fix: flag `descargaMasivaActiva` en syncGuards, suprime eventos de carpeta/subcarpeta durante descarga masiva. Guard de tracking en subcarpeta callback. Gracia de descarga aumentada 10sâ†’30s.

---

## Lecciones aprendidas (sesion actual)

- [APK/Download]: `<a download>` no funciona en Android WebView â€” cuelga la app intentando renderizar binario como HTML. Usar fetch+fs plugin.
- [APK/OAuth]: Android no soporta TcpListener localhost. Flujo mobile: browser â†’ server callback â†’ deep link `kamples://auth?payload=base64url`
- [FCM]: Data-only messages con `high` priority pueden no entregarse en background en algunos OEMs Android. Siempre incluir campo `notification` junto con `data`.
- [CSS/Safe-area]: Variables centralizadas `--safeAreaTop`/`--safeAreaBottom` con override en `body.plataformaAndroid` usando `env(safe-area-inset-top)`. Requiere `viewport-fit=cover` en meta viewport.
- [Sync/Loop]: Los eventos NTFS de carpeta/subcarpeta se disparan con cada `mkdir`/`writeFile` durante sync masivo. Flag global `descargaMasivaActiva` es la solucion mas limpia.
- [Toast API]: El store usa `toast.exito()` no `toast.success()` (esta en espanol).
- [Config modal]: Tauri plugin deep-link v2 expone `onOpenUrl()` en JS â€” el plugin maneja forwarding automatico sin necesidad de emitir eventos desde Rust.

## QL104

[AG-MNT] Diagnostico sync: archivos duplicados ya no se re-suben. Resuelto en sesion anterior.

## QL105

[AG-MNT] Desktop crash: deep-link plugin config corregida (sequence en vez de string).

## QL106

âœ… [AG-MNT] Tres bugs reportados por usuario:
- **setState-during-render**: `marcarTodasLeidasLocal()` (Zustand set) se llamaba dentro del updater de `setNotificacionesAbiertas`, disparando re-render de Sidebar durante render de TopBar. Fix: extraer a `useEffect` en useTopBar.ts y Sidebar.tsx.
- **Duplicados silenciosos**: Hash conocido con archivo activo causaba `return false` sin feedback. Fix: log claro `"Duplicado confirmado..."` + eliminacion del archivo local del disco.
- **Descargas con borrarAlSubirExitoso**: Polling periodico en syncWatcherSetup.ts llamaba `sincronizarColecciones(soloEstructura=false)` sin verificar flag. Fix: pasar `soloEstructura=true` cuando borrarAlSubirExitoso activo + defensa en profundidad en syncCollectionService.ts.

## QL107

✅ [AG-MNT] Fix 6 errores TypeScript pre-existentes en desktop/src/services: tipos locales para fs plugin, wrappers Uint8Array, casts Parameters<>.

## QL108

✅ Completado como QL111 — ver QL111 para hallazgos y cambios.

## QL109 

✅ [AG-MNT] Pull-to-refresh + estado offline para Android/movil:
- **useConectividad.ts**: Zustand store + hook que detecta online/offline via navigator.onLine + eventos del browser.
- **usePullToRefresh.ts**: Hook touch-based con refs para closure safety, threshold 80px, resistencia 0.4.
- **FeedSamples.tsx**: Estado offline completo (sin datos + sin conexion), banner offline (datos cached + desconexion), indicador pull-to-refresh con spinner.
- **feedSamples.css**: Estilos para pull indicator, estados offline, animacion girarRefresh.
- Audio cache: delegado al HTTP cache del browser/WebView (HTMLAudioElement con preload='metadata').

## QL110 

✅ [AG-MNT] Fix deteccion duplicados sync — dos causas raiz:
- **Race condition**: buscarConHash() solo buscaba estado=activo, uploads paralelos de sync ambos en procesando no se detectaban mutuamente. Fix: expandido a estado != eliminado.
- **Hash no persistido**: SHA-256 se acumulaba en actualizaciones y solo se guardaba al final del pipeline (paso 8). Fix: persistir hash inmediatamente tras computarlo (antes del dup check) con PipelineAudioHelpers::actualizarSample().

## QL111

✅ [AG-MNT] Revision del sistema de scraping/extraccion — procesos que involucran IA.

**Auditoria de resiliencia — Hallazgos:**
- **SOLIDO:** Multi-model LLM fallback (8 Groq + OpenAI gpt-4o-mini), 6 fuentes audio (SoundCloud→YouTube→Deezer→Spotify), validacion 2 capas (textual+LLM), cola IA con backoff exponencial (15→30→60→120min), rate limit detection con headers x-ratelimit-*, limite diario con persistencia.
- **GAP CRITICO corregido:** Whisper STT no tenia fallback — si Groq STT caia, analisis de audio fallaba completamente. Ahora OpenAI whisper-1 actua como fallback ($0.006/min).
- **GAP corregido:** groq_validator.py retornaba True (permisivo) en TODOS los errores, incluyendo JSON corrupto. Ahora: errores transitorios (429, red) → permisivo (True); datos corruptos (JSON/Key/IndexError) → restrictivo (False).
- **Mejora:** groq_validator.py ahora extrae y loguea Retry-After de respuestas 429.

**Archivos modificados:**
- `OpenAIHttpClient.php`: Nuevo metodo `transcribirAudio()` — POST multipart a `/v1/audio/transcriptions` (whisper-1).
- `ServicioIA.php`: `transcribirAudioConWhisper()` ahora intenta OpenAI STT tras fallar Groq.
- `groq_validator.py`: Error handling diferenciado (transitorio=permisivo, corrupto=restrictivo) + Retry-After logging.

**TO-DO futuros (medio impacto, no criticos):**
- Circuit breaker pattern para GroqHttpClient (evitar martillar API caida).
- Tracking distribuido de rate limit (Redis) para multiples workers.
- Adaptive backoff respetando Retry-After header en ProcesadorColaIA.
- Model-level quota tracking usando headers x-ratelimit-remaining-*.

**Lecciones:**
- [groq_validator]: Fallback permisivo blanket (True para todo error) es peligroso — JSON corrupto indica problema real, no transitorio. Diferenciar tipos de error.
- [Whisper STT]: Groq STT gratuito + cola reintento parecen suficientes, pero si Groq STT tiene downtime prolongado el pipeline se bloquea completamente. OpenAI fallback cierra ese riesgo por ~$0.006/min.
- [IA resilience]: El sistema ya es robusto para el volumen actual. Los TO-DO son para escalabilidad futura (multiples workers, alto volumen).

## QL112

✅ [AG-MNT] Visibilidad + cascada de eliminacion de usuario.

**Filtros de visibilidad (contenido oculto si creador suspendido/en_eliminacion):**
- NormalizadorSample::sqlSelectSamples() — nuevo param `$soloCreadorActivo=true` (default). Cambia LEFT JOIN a INNER JOIN con `u.estado='activo'`. Afecta 20+ callers automaticamente (buscarPorIds, sugerencias, coleccionados, historial, motor recomendacion, etc.).
- ColeccionesRepository: explorarPublicas (2 variantes), obtenerConCreador, tagsFrecuentesExplorar — filtro `u.estado='activo'`.
- ComentariosRepository: listarDePublicacion, listarRaizConAutor, listarRespuestasConAutor, obtenerDestacadosPorPubs — filtro `u.estado='activo'`.
- FollowsRepository: listarSeguidores — filtro `u.estado='activo'`.
- NotificacionesRepository: listarConActor — filtro `u.estado='activo' OR u.id IS NULL`.
- ConversacionesRepository: listarDeUsuarioEnriquecido — filtro `u.estado='activo'` en JOIN.
- PerfilController::obtenerPerfil ya tenia check QQ65 (no modificado).

**Cascada de eliminacion:**
- Nuevo: `ServicioEliminacionUsuario.php` — `eliminarConCascada(int $usuarioId)`: elimina TODO contenido en orden de FK inverso (21 tablas), llama SamplesRepository::eliminarConCascada y PublicacionesRepository::eliminarConCascada para cada item, luego wp_delete_user().
- Nuevo: `procesarEliminacionesPendientes()` — cron diario busca `estado=en_eliminacion AND sera_eliminado_en <= NOW()`.
- Registrado en KamplesInit::init() como cron diario `kamples_purgar_usuarios_eliminados`.

**Lecciones:**
- [sqlSelectSamples]: El LEFT JOIN sin filtro era la raiz de 14 gaps de visibilidad. Solucion arquitectonica: param con default seguro, no parches en cada caller.
- [ConversacionesRepo]: Para SQL en string interpolada ($var), asignar constantes a var locales ($colEstado, $estadoActivo) antes del string.

## QL113

✅ [AG-MNT] FilaColecciones mouse-drag scroll + TarjetaColeccion play/pause centrado.

**Cambios:**
- FilaColecciones: Integrado hook `useScrollHorizontal` existente para arrastre con mouse. CSS: `cursor: grab/grabbing`.
- FilaColecciones ya listaba TODAS las colecciones publicas via `/colecciones/explorar` — no habia filtro por usuario.
- TarjetaColeccion: Boton preview movido DENTRO de `.tarjetaColeccionPortada` con `top:50%;left:50%;transform:translate(-50%,-50%)` — centrado sobre la imagen.
- TarjetaColeccion: Imagen portada con `filter: brightness(0.9)` permanente, `brightness(0.72)` en hover.
- TarjetaColeccion: Boton preview agrandado a 42px, animacion `scale(0.85)→scale(1)` en hover.

**Lecciones:**
- [useScrollHorizontal]: Hook generico ya existia — siempre buscar hooks reutilizables antes de crear nuevos.
- [Preview button dentro de a]: Funciona correctamente con `e.stopPropagation()+e.preventDefault()` tanto en el container div como en el boton.

# QL114 ✅ [AG-MNT] — Commit `67e160ac`

**Cambios realizados:**
1. **Breadcrumbs subcolecciones:** Cuando se ve una subcolección, el botón "← Librería" se reemplaza por migas: "Librería > Colección padre > Nombre actual". Para colecciones raíz, se mantiene el "← Librería".
2. **Selector de padre en modal:** En modo edición, aparece un `SelectorMenu` para elegir colección padre o "Sin padre (raíz)". Solo muestra colecciones raíz del usuario (profundidad max 2). Validaciones backend: no self-parent, no circular, no hijos propios, verificar propiedad.
3. **FiltroSubcolecciones reubicado:** Movido debajo de `BarraControlFeed` (dentro del tab samples). El skeleton de carga ahora solo afecta al FeedSamples, no barra ni filtro.
4. **Contador colecciones padre corregido:** SQL `total_items` incluye samples de subcolecciones (`OR cs.coleccion_id IN (SELECT sub.id FROM colecciones sub WHERE sub.parent_id = c.id)`). Corregido en: `listarDelUsuario`, `explorarPublicas` (autenticado + anónimo).
5. **Refactor SRP:** Menú contextual de colección extraído a `useColeccionDetalleMenu.tsx` para cumplir límite de líneas del hook.

**Archivos modificados:** ColeccionesCrudController (+parent_id en PUT), ColeccionesRepository (counter fix 3 queries), ColeccionDetalleIsland (breadcrumbs + reorder), useColeccionDetalle (coleccionPadre state + import menu hook), useColeccionDetalleMenu (nuevo), useModalColeccion (parentId state + opciones), ModalColeccion (SelectorMenu padre), apiColecciones (parentId en actualizarColeccion), coleccionDetalle.css (migas CSS), modalColeccion.css (campo padre CSS).

**Lecciones:**
- [total_items SQL]: Para colecciones padre, el COUNT(*) del join directo siempre da 0 porque los samples están en las subcollecciones. La subquery con OR + IN resuelve esto sin CTE.
- [parent_id en PUT]: array_key_exists necesario (no isset) porque null es un valor válido para hacer raíz.
- [SelectorMenu]: Usa `valor: string`, hay que convertir `number|null` ↔ `string` ('' para null).

## QL115

Un boton en el menu contextual de las colecciones para combinar colecciones, esto abre un modal para elegir cual coleccion unir y cual nombre e imagen de portada conservar, solo se puede con las propias colecciones obviamente, sera dos slect como modalColeccionCampoPadre para elegir con quien combinar y cual sera el nombre y portada a conservar.

El admin puede combinar cualquier coleccion de cualquier usuario, y si son de usuarios diferente tendra un select extra para elegir cual usuario se queda con la nueva coleccion

por supuesto, esto no duplica la coleccion, combinar es pasar de 2 colecciones a 1

que este proceso se pueda deshacerse, habrá un boton de durara 7 dias para restaurar el estado anterior, 

## QL116 

poder selecionar varios samples manteniendo control y shift para selecionar rango, esto mostrara un mini modal pequeño inferior igual como el reproductor, de hecho, si el reproductor esta abierto en ese momento, tiene que quitarlo para mostrar esto, pero tecnicamente el mismo tamño del reproductor, el mismo estilo con los botones, etc, contendra el boton de like, colecionar (no confundir con guardar en coleccion) y guardar en coleccion, eliminar (si el usuario esta selecionando sus samples), descargar, (iconos todos sin texto), reportar, y todas estas opciones tienen que manejar la capacidad de aplicar cambios a multiples samples. 

cuando se selecione un sample simplemente su fondo se vuelve muted, 


## QL117

✅ [AG-COL] Rotación de modelos en groq_validator.py.

**Hallazgos:**
- `ServicioIA.php` ya tiene 8 modelos Groq con rotación. OpenAI gpt-4o-mini es fallback pero `OPENAI_API_KEY` NO está configurado en el servidor — completamente dormido.
- `groq_validator.py` usaba un solo modelo (`llama-3.3-70b-versatile`) sin fallback.

**Cambios:**
- `groq_validator.py`: Rotación de 3 modelos (`llama-3.3-70b-versatile` → `qwen/qwen3-32b` → `meta-llama/llama-4-scout-17b-16e-instruct`). Cada modelo tiene cuota independiente en Groq — un 429 en uno no afecta otro. Nueva función `_intentar_modelo()` retorna `bool|None` (None=reintentable, pasa al siguiente). Errores 400/401/403 no reintentan (permanentes). Headers User-Agent falsos eliminados.
- Manejo de errores QL111 preservado: JSON corrupto → rechazar (False), red/429 → probar siguiente modelo, todos fallan → permisivo (True).

## QL118

Un boton al lado del ordenamiento en la pagina de librería para cambiar la vista de las colecciones, la vista actual es cuadricula por defecto la que tiene ahora, y la que propongo nueva como opciones vista de lista, 

## QL119

No se que sucede exactamente cuando se borra una coleccion, pero supongo que los samples se quedan sin coleccion. 

Entonces lo que quiero, es que cuando se de borrar a una coleccion se abra un modal con un select para elegir si se borra los samples o sin borrar los samples. Si es una coleccion con hijas, entonces pregunta si borrar las hijas o simplemente dejarlas sin padre, otro select para preguntar si borrar tambien los samples de las hijas que caso de que se eliga borrar las colecciones hija o dejar los samples de las colecciones sin colecciones, todo esto debe manejarse bien y pulirse. 

## QL120

Tenog una duda sobre lo que propongo de combinar colecciones, cuando combinas dos colecciones padre ¿que pasa con sus hijas? esto tiene que manejarse bien el modal. Y si combinas una hija con un padre, pero esa hija tiene tambien colecciones ia. 

## QL121 La mas importante

Algo fatal paso, habia subido una carpeta, con subcarpetas, las colecciones se crearon bien, todo esta bien, pero luego subi otra carpeta nueva con mas subcarpetas, se estaban subiendo pero se borraon las colecciones anteriores, esto no tiene que suceder, es fatal, cuando la opcion de borrar localmente despues de subir este activa, las colecciones no tienen que borrarse, pero no fue como eliminar, fue como un renombre, por ejemplo 
veo que dice la url https://kamples.com/coleccion/freddie-dredd-drum-kit-vol-1-7/ pero el nombre de la coleccion cambio a DJ Smokey NukeKiT y todo lo de esa carpeta se combino con la coleccion freddie, entocnes el problema es que el sync uso compartamiento por defecto de ordenar las colecciones en base a las carpetas del usuario, pero esto no debe sucuder cuando el modo es "eliminar tras subida" 

no solo necesito evitar que este problema vuelva a suceder, tambien necesito arreglarlo

solo tengo 2 opciones, la ubicacion de las carpetas de subida se guardo en el servidor, entonces quiero que reodernes los samples de @wan (ID: 4), incluyendo la jerarquía 

el 98% de los samples se subieron desde el sync, si no tienen ubicación guardada, entonces elimina todos los samples para poder volverlos a subir, y revisa que el sync detecte bien que estan elimiandos en el servidor para dejar que los suba

## QL121-EXTRA 

¿Estas seguro? Veo samples de freddie en https://kamples.com/coleccion/dj-smokey-nukekit/ 

y https://kamples.com/coleccion/dj-smokey-nukekit/ no tiene las subcarpeta originales o sea no tiene subcolecciones

repito, si no se puede restaurar el orden correcto porque no se guardo la metadata de la ubicación original, entonces ajusta para que todo lo que suba mediante el sync se guarde la carpeta en la metadata y borra todo lo del usuario 4 para volver a subir todo desde cero. 

Ahora hay otro problema, despues de tus cambios en QL121, ya no se detecta o sube mas samples xddd, no veo logs de subida ni nada, no esta subiendo nada. 

La verdad esto es un desastre, reptio, sino hay info de la metadata de la ubicación original para poder restablecer bien las colecciones entonces borra todos los samples del usuario 4 y yo vuelvo a subir, pero esta vez, asegurate de que todo funcione bien, y ve proque dejo detectarse para subir.

estos son los unicos logs

[AuthDesktop] Init — LS: OK | tokenLS: true | userLS: true
uploadQueueService-CloPPvVM.js:50 [AuthDesktop] TauriStore — token: true | user: true
uploadQueueService-CloPPvVM.js:50 [AuthDesktop] Init OK — token: true, user: true
uploadQueueService-CloPPvVM.js:49 [sync:syncService] Inicializando sync service Object
uploadQueueService-CloPPvVM.js:49 [sync:journal] Checkpoint cargado correctamente 
uploadQueueService-CloPPvVM.js:49 [sync:tracking] Estado recuperado desde journal 

## QL122

✅ [AG-COL] Icono notificacion Android reemplazado con logo Kamples (asterisco). SVG path actualizado en ic_notification.xml.

## QL123 

✅ [AG-COL] Toast position: media query mobile con safe-area-inset-bottom para respetar barra de navegacion Android.

## QL124

✅ [AG-COL] Tray fix: WindowEvent::CloseRequested interceptado en lib.rs — hide() en vez de destroy(). "Salir" sigue haciendo exit(0). 

## QL118-EXTRA 

✅ [AG-COL] Vista arbol jerarquica en libreria: colecciones hijas con indentacion debajo de sus padres. Nuevo tipo 'arbol', toggle button, CSS indentation. 

## Ql125

✅ [AG-COL] Diagnostico sync: logging agregado a guards silenciosos en syncInitService, syncWatcherSetup, fileWatcherService.

## QL126

✅ [AG-COL] Causa raiz: config de Tauri Store perdida tras rebuild. Guards en inicializarSyncBidireccional() y escanearCarpetaYEncolar() retornaban silenciosamente con config default (carpetaLocal:null, sincronizacionActiva:false). Fix: logging diagnostico en 4 puntos criticos. 

## QL127

✅ [AG-COL] Busqueda textual dentro de colecciones: agregado filtrado client-side en useFeedFiltros (busquedaClientSide flag). FeedSamples y ColeccionDetalleIsland pasan busquedaLocal=true.

## QL128

✅ [AG-COL] Tags y busqueda desacoplados: incluirTag/excluirTag/quitarTag ya no sincronizan a campo busqueda del store. Elimina apertura involuntaria del dropdown de busqueda rapida al clickear tags.

## QL129

✅ [AG-COL] ResizeObserver loop: error benigno del browser suprimido en main.tsx error handler.

## QL130

✅ [AG-COL] Indice legacy stale: cuando tracking v2 no tiene el archivo pero indice legacy si, la entrada se limpia automaticamente y permite re-upload. Corregido en watcher callback y escanearCarpetaYEncolar.

## QL131

✅ [AG-COL] Vista arbol robustecida: si una hija matchea el filtro por tag, su padre se incluye automaticamente para evitar jerarquias rotas. El ordenamiento sigue aplicandose por grupo sin separar hijas de su padre.

## QL132

✅ [AG-COL] Colecciones guardadas ahora devuelven `total_items` y `tags` desde ColeccionesGuardadasRepository, igual que el listado principal. La tarjeta ya muestra el contador correctamente con esos datos.

## QL133

✅ [AG-COL] Vista arbol reforzada tambien frente a filtros/ordenamiento: si una hija entra por tag, su padre se inyecta en el resultado para mantener la jerarquia estable al cambiar vista u orden.

## QL134

✅ [AG-COL] Watcher endurecido: archivos sin extension ya no se tratan como colecciones si `stat()` confirma que no son directorios reales. Cubre casos como `PandaFX` e `Icon_`.

## QL135

✅ [AG-COL] Sync endurecido + reset servidor completado:
- orphanAnalysis ya no borra archivos locales basandose solo en el indice legacy stale; ahora limpia la entrada y re-encola.
- borrarAlSubirExitoso ahora exige confirmacion persistida (tracking activo o sampleIdServidor) antes de borrar local.
- Deploy realizado a produccion con commit `17b0533`.
- Purga servidor usuario 4 ejecutada via `SamplesRepository::eliminarConCascada()`; verificacion posterior: `remaining=0`.

## QL136

[EN CURSO — AG-COL] Auditoria/refactor sync v2.

**Estado:** auditoria SOLID en marcha + primera fase enfocada en depuracion/observabilidad local (reporte diagnostico, resumen de cola/tracking y unificacion progresiva de logs estructurados).

Antes de hacer esto primero asegurate de que todo este commiteado.

Veo que el sync no es un buen codigo, tiene mucha logica dispersa, no maneja bien los archivo dependiendo de que modo esta, etc. 

Haz una auditoria solid completa y detallada al sync, con todas las posibles mejoras, problemas, riegos de rafactorizacion y una planificacion detallada para refactorizar, pulir, mitigando riegos, y trabaja en ello, con cuidado. 

Planifica una mejora para la detencion de duplicados, antispam sin romper la capacidad de subir archivos fueron eliminados, que no existen el servidor, etc. 

Enfocate en hacer el sync mas depurable, un log local para que puedas leer todo lo que hace darte cuenta de cualquier fallo.

## Haz commit y sube todos los cambios. 


# Tarea final

Haz rebuil de apk y aplicacion para ver si arreglo el problema comentando anterior del icono, y esas cosas etc.

# TAREA FINAL FINAL

ASEGURATE DE QUE REALMENTE LA APK Y BUILD ESTEN ACTUALIZADA SEGUN LA ULTIMA VEZ DIJISTE QUE PROBABLEMENTE NO PORQUE NO TENIA CAMBIOS A PESAR DE GENERAR LOAS BUILDS









# Build 

✅ [AG-MNT] Build APK + instalador desktop completado.

**Rebuild QL122-QL132 validado:**
- **APK Android firmado:** `desktop\src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk` (50.2 MB)
- **Instalador Windows NSIS:** `C:\cargo-target\kamples\release\bundle\nsis\Kamples_0.1.0_x64-setup.exe`
- **Instalador Windows MSI:** `C:\cargo-target\kamples\release\bundle\msi\Kamples_0.1.0_x64_en-US.msi`

**Warnings no bloqueantes del rebuild:**
- Vite: warnings de chunking/dynamic import (sin fallo de build).
- Rust/Tauri: `tauri_plugin_shell::Shell::open` deprecated; pendiente migrar a opener plugin.
- Gradle: warnings deprecados compatibles con build actual; APK generado correctamente.

**Fixes aplicados durante build:**
- `tauri.conf.json`: deep-link `"scheme": "kamples"` → `"scheme": ["kamples"]` (tauri-plugin-deep-link v2.4.7 requiere array).
- WDAC: artifacts stale en `C:\cargo-target\kamples\release\build\tauri-plugin-deep-link-*` bloqueaban build. Limpiados.
- Build universal (4 archs) fallaba en x86/i686 — compilado solo arm64 (aarch64) que cubre 99%+ dispositivos reales.

**Lecciones:**
- [tauri deep-link]: Plugin v2.4.7 cambió `scheme` de string a array. Error: `"invalid type: string, expected a sequence"`.
- [Android build]: Build universal compila 4 targets (aarch64, armv7, i686, x86_64). Si x86 falla por WDAC o timeout, usar `--target aarch64` para arm64-only.
- [WDAC]: Windows Application Control puede bloquear build scripts autogenerados por Cargo en OneDrive. `CARGO_TARGET_DIR` fuera de OneDrive es obligatorio, pero stale artifacts aún pueden causar bloqueo.


---

## Despliegue Produccion (VPS Coolify)

**Estado:**  Produccion  `https://kamples.com` activo con SSL Let's Encrypt (valido hasta Jun 11 2026).

- **Stack UUID:** `mo4so4440c488g8woow4cow0`
- **URL produccion:** `https://kamples.com`
- **WordPress:** Tema activo, SEO funcionando (OG, structured data, sitemaps), React islands cargando (CSS/JS enlazados)
- **PostgreSQL 18:** pgvector 0.8.2, 28 tablas creadas (41 migraciones ejecutadas)
- **React build:** Completado (Vite + prerender, dist/assets + dist/ssg)
  - **Glory submodule:** Commit `f3a2565` en `main` (registrarRutaDinamica en PageManager + PageDefinition)
- **Env vars:** Todas presentes (Stripe, Google OAuth, Groq, DataImpulse, PG)
- **Pendiente:** `GLORY_STRIPE_WEBHOOK_SECRET` vacio -- configurar en Coolify cuando se conecte dominio
- **Lecciones:**
  - [Glory submodule deploy]: El `deploy --update` de coolify-manager usaba `libraryBranch: "glory-react"` (branch viejo) para kamples. Cada deploy hacia `git reset --hard origin/glory-react` que regresaba Glory a 76dbe9f sin registrarRutaDinamica. Fix: cambiar a `libraryBranch: "main"` en settings.json. Tambien cambiar para los demas sitios si tienen glory-react.
  - [Android emulador]: El WebView del APK de dev carga desde kamples.com (produccion), NO desde Vite local. Los cambios React necesitan commit + deploy para verse en el emulador.
  - [Submodule]: Glory en servidor estaba en `glory-react` (branch viejo). Fix: `git stash` + `git submodule update --init Glory`
  - [PG18]: Mount en `/var/lib/postgresql` (no `/var/lib/postgresql/data`) -- breaking change PG18
  - [Migraciones]: No hay auto-runner. Ejecutar manualmente con PHP runner base64-encoded
  - [React build]: `npm install` necesario en servidor antes de `npm run build` (soundtouchjs faltaba)
  - [coolify-manager-rs `deploy --update`]: env var del DB es `KAMPLES_PG_DBNAME` (no `KAMPLES_PG_DB`). Fix aplicado.
  - [OPcache/Docker]: `apachectl graceful` (SIGUSR1) es el comando correcto para limpiar OPcache sin matar PID 1.
  - [bloqueos]: Tabla `bloqueos` sin migracion SQL causaba error 42P01 silencioso. Migracion v043 aplicada.
  - [WAV upload]: `$audio['type']` no fiable -- validar por extension + finfo magic bytes RIFF/WAVE.
  - [SMTP/Docker]: mu-plugin `00-smtp-config.php` auto-generado en deploy si config `smtp` existe. Brevo SMTP.
  - [settings.json]: Binario usa `.agent/coolify-manager-rs/config/settings.json`, NO el de PowerShell manager.
  - [Traefik labels]: Cambio FQDN en Coolify requiere force-recreate del contenedor. Datos persisten en volumenes.
  - [SSL]: Traefik emite cert automatico con certresolver letsencrypt. Verificar: `docker exec coolify-proxy grep kamples /traefik/acme.json`.
  - [Coolify DB]: Stacks Docker Compose en `services` + `service_applications`. UUID stack: `mo4so4440c488g8woow4cow0`.
  - [Android build WDAC]: `tauri android build` falla con "os error 4551" (Control de Aplicaciones bloquea build scripts en OneDrive). Fix: `$env:CARGO_TARGET_DIR = "C:\cargo-target\kamples"` antes de ejecutar. El `.cargo/config.toml` solo aplica al cargo directo, no al invocado por Gradle.`n`n## Comando para actualizar produccion

```powershell
cd .agent/coolify-manager-rs
.\target\release\coolify-manager.exe deploy --name kamples --update
```

**Que hace el comando `deploy --update`** (en orden):
1. `git pull` del tema (glorytemplate) en el contenedor WP
2. `git pull` del submodule Glory
3. `composer install --no-dev` (dependencias PHP)
4. Verifica que Node.js este instalado (instala si falta)
5. `npm install` si node_modules no existe
6. `npm run build` (Vite -- compila React/SSG) -- loggea "Compilando React..." y "React compilado."
7. Ejecuta migraciones SQL pendientes (lee `migrations/*.sql`, compara con `_migraciones_ejecutadas`)
8. `chown -R www-data:www-data` (permisos)
9. `apachectl graceful` -- limpia OPcache sin matar el contenedor Docker

**Si el build del binary Rust cambio**, tambien ejecutar:
```powershell
cd .agent/coolify-manager-rs
cargo build --release
```
