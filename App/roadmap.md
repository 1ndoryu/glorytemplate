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

### Pendientes

## QL5 

✅ [AG-GUI] Compactado:
- roadmap.md: 460→155 lineas. QK67-QK105 y QL1-QL4 movidos a completado.md (secciones "Sprint QK-II" y "Coolify Manager RS: QL1-QL4").
- Indice de docs reorganizado por categoria (7 categorias, 27 archivos documentados).
- Lecciones de despliegue compactadas en roadmap.md (17→12 bullet points).
- Consolidacion sugerida: plan-sync-mejoras v1/v2/v3 → referencia-sync.md (historicos). PLAN_* de code-sentinel → ROADMAP-SENTINEL.md unico.

## QL6

✅ [AG-AUD] Completado:
- README actualizado: arquitectura dual lib+bin+GUI, 26 MCP tools, 61 tests, failover CLI, deploy-websocket CLI.
- Auditoria de despliegue completa (10 areas):
  - Deploy+Rollback: OK (rollback no validaba exito, estable por diseno).
  - Backup: OK (SHA256, Drive upload, retencion).
  - Restore: OK (pre-restore snapshot, dual validation).
  - Failover: **Corregido** -- polling reemplaza sleep(30s) hardcodeado, health check ahora retorna error si falla.
  - Health: OK (HTTP, app probe, fatal log detect).
  - Migrate: OK (preflight completo, validaciones).
  - **Redeploy: Bug corregido** -- health check post-redeploy retornaba Ok() incluso si el sitio estaba unhealthy. Ahora propaga error.
  - Config: OK (expansion ${VAR}, resolucion paths).
- Archivos corregidos: `redeploy.rs` (health check propaga error), `failover.rs` (polling containers + health error), `docker.rs` (nueva fn `wait_for_stack_container` con polling+timeout).
- 61/61 tests pasan.

## QL7

✅ [AG-FEA] Completado:
- IntersectionObserver estabilizado con refs (evita churn destroy/recreate en cada cambio de estado)
- rootMargin: 200px → 600px (mayor buffer de prefetch)
- usePaginacionProgresiva: paginasMinimasInicio 3→5, umbralRapidoMs 2000→1500, tiempoAutoOcultarMs 6000→3000
- Timestamps solo se registran en cargas exitosas (no en bloqueadas)

## QL8

✅ [AG-FEA] Completado:
- SeccionHorizontal: flechas izq/der con ChevronLeft/ChevronRight
- Hook useScrollHorizontal reutilizable (flechas + arrastre mouse en escritorio)
- CSS: cursor grab/grabbing, ocultar flechas en touch devices (@media hover:none)
- Secciones por genero ya existian en backend (CancionesRepository::secciones, top 6 generos con ≥5 canciones)
- Imagenes artistas: campo imagenUrl existe pero vacio. TO-DO: cron backend para buscar en Spotify/MusicBrainz/Discogs via nombre

## QL9

✅ [AG-FEA] Completado:
- FiltroTags: useMemo ordena tags — incluidos primero, excluidos segundo, inactivos al final

## QL10 

✅ [AG-FEA] Parcial (QL16 redefine layout movil):
- Hamburguesa movida a izquierda del topbar
- Logo Kamples centrado en topbar movil
- Tabs ocultas en movil
- Mensajes visible en movil (sacado del hamburguesa)
- NOTA: QL16 redefine la estructura completa — se continua ahi

## QL11

✅ [AG-FEA] Completado:
- deploy_theme.rs: reportar_cambios_git() captura hashes antes/despues para tema y Glory
- Muestra git log --oneline --stat entre commits, o "sin cambios" si no hay diff
- Binario recompilado y testeado exitosamente

## QL12

✅ [AG-FEA] Completado:
- Tags en TarjetaSample deshabilitadas en movil (useEsMovil → onFiltrar=undefined). Click en tarjeta solo reproduce.
- Windows EXE generado: `C:\cargo-target\kamples\release\bundle\nsis\Kamples_0.1.0_x64-setup.exe` (4.3 MB)
- APK firmado: `kamples-release.apk` en raiz del tema (15 MB). CARGO_TARGET_DIR necesario para evitar WDAC block en OneDrive.
- Nota usuario: barra Android tapa app — pendiente probar en telefono real.

## QL13

✅ [AG-FEA] Completado:
- FeedSamples: loading text reemplazado por 5x SkeletonTarjetaSample (nunca muestra "Cargando samples...")
- Contador: fallback inmediato con conteoFiltrado cuando totalServidor es null (InicioIsland + DescubrirIsland)

## QL14

✅ [AG-FEA] Completado:
- TarjetaCancionGrande: click en imagen reproduce sample adjunto (o navega si no tiene). Info section navega a detalle.
- Hover oscurece imagen (brightness 0.6). Play centrado (top/left 50% translate), 48px, fondo rgba(0,0,0,0.55), icono blanco 24px.
- Backend: +3.0 bonus en ORDER BY "inteligente" para canciones con sample adjunto activo (listar + fetchSeccionOrdenada).

## QL15

✅ [AG-FEA] Completado:
- DescargasIsland: tab "descargas" usa FeedSamples con infinite scroll via proveedorColeccionados
- useDescargasPagina: nuevo callback proveedorColeccionados (paginado, 30 items/pagina)
- Contador de coleccionados actualizado dinamicamente via onConteoChange

## QL16

✅ [AG-FEA] Completado:
- TopBar movil: solo hamburguesa (izq) + logo centrado + busqueda (der). Notificaciones/mensajes/avatar ocultos via CSS.
- Sidebar bottom bar (movil): 5 items — Inicio | Samples | Perfil(avatar) | Mensajes(con dropdown+badge) | Notificaciones(con dropdown+badge)
- Hamburguesa: Crear, Mezclador, Musica, Libreria, Coleccionados, Favoritos, Admin
- DropdownNotificaciones y DropdownMensajes en bottom bar con toggle y mark-as-read
- Supersede QL10 (layout movil completo rediseñado)


## QL16-B — Notificaciones nativas Android/Desktop

✅ [AG-NTF] Completado:
- `tauri-plugin-notification` integrado: Cargo.toml + lib.rs + capability principal.json
- Android: permiso POST_NOTIFICATIONS en AndroidManifest.xml, canales "notificaciones" (importance HIGH) y "mensajes" (importance MAX/heads-up)
- Servicio `notificacionNativa.ts`: abstracción sobre el plugin, import dinámico (solo se carga en Tauri), formateo de tipos de notificación
- Hook `useNotificacionesNativas.ts`: escucha eventos WS ('notificacion' + 'mensaje_nuevo') y despacha notificaciones nativas del sistema
- Wired en `InicializadorAuth.tsx` junto a useWebSocket
- Module declaration en `global.d.ts` para type-check cross-project
- npm: `@tauri-apps/plugin-notification` instalado en desktop/
- [Limitación]: Solo funciona cuando la app está en primer/segundo plano con WS conectado. Para notificaciones con app cerrada se necesitaría FCM (fase futura).
- [Lección]: Android WebView (Tauri) NO soporta Push API (PushManager). VAPID web push solo funciona en navegadores. Para Android nativo: tauri-plugin-notification (local) + FCM (remoto).

# QL17

✅ El orden de la navegacion en movil es incorrecto, el perfil tiene que ir al final

✅ Todos los menu contextuales tienen que ser tipo drowdown inferior, o sea aparecer desde abajo con una animacion sutil, minalista como en las aplicaciones de celular.

✅ las notificaciones tienen que cubrir toda la pantalla cuando se abra, igualmente la lista de mensajes.

✅ dar atras tiene que cerrar modales, cerrar chat, etc.
- registroCapas.ts: pila de capas modales cerrables
- useRegistrarCapa.ts: hook para registrar capas (usado en Sidebar dropdowns)
- useBackHandler.ts: intercepta popstate capture-phase, cierra capas o fallback a stores Zustand
- Cubre 15+ modales via fallback + cualquier componente nuevo via registro dinamico

✅ especificarme aca como puedo especificar un estilo que solo afecte la apk pero no la version movil web

**Respuesta — Estilos condicionales por plataforma (QL17):**
En `desktop/src/main.tsx` se inyectan clases CSS en `<body>` al iniciar:
- `plataformaTauri` — cualquier build Tauri (desktop + APK)
- `plataformaAndroid` — solo APK Android
- `plataformaEscritorio` — solo desktop (Windows/Mac/Linux)

Uso en CSS:
```css
/* Solo APK Android */
body.plataformaAndroid .miClase { padding: 20px; }
/* Solo desktop instalado */
body.plataformaEscritorio .miClase { width: 300px; }
/* Solo web (no Tauri) */
body:not(.plataformaTauri) .miClase { margin: 10px; }
/* Movil web (no APK): combinar con media query */
@media (max-width: 768px) { body:not(.plataformaTauri) .miClase { ... } }
```

# QL19-A

✅ [AG-APK] CORS fix: `http://tauri.localhost` + `https://tauri.localhost` en KamplesInit.php y .htaccess expandido (mp3/json/img + Cache-Control header). Deployado.

# QL20

✅ [AG-APK] Skeleton flash fix: `primeraCargaCompleta` flag en useFeedSamples.ts. Skeleton se muestra hasta que hay datos (cache o fetch), evitando flash del mensaje "No se encontraron samples". feedSamples.css: border + borderRadius en skeleton. Deployado.

# QL20-A

✅ [AG-APK] Cache stale-while-revalidate ya existia en cacheFeedPersistente.ts (TTL 5min, max 7d). El problema era el flag de estado, no la estrategia de cache. Corregido con primeraCargaCompleta.

# QL21

✅ [AG-APK] Completado:
- Tabs del admin panel reemplazadas por iconos (Users, Shield, BrainCircuit, Copy, Cog, HandHeart, Globe, Headphones, Music) via campo `icono` en `TabTopBar`.
- `tabsTopBarStore.ts`: nueva propiedad opcional `icono?: React.ReactNode` en la interfaz.
- `TopBar.tsx`: renderiza icono cuando está presente, fallback a texto (`etiqueta`). Atributo `title` para tooltip de accesibilidad.
- Nueva tab "Canciones" con tabla paginada (50/pag): ID, Titulo, Artista, Genero, Año, BPM, Sampleada, Samplea, Fecha.
- Nuevo hook `useTabCancionesAdmin.ts`: paginación server-side + búsqueda vía `/canciones/buscar`.
- Nuevo componente `TabCancionesAdmin.tsx` + CSS `cancionesAdmin.css`.
- Backend: `CancionesController::listar` actualizado para devolver `total` + `page` (usa `BaseRepository::buscarTodos` + `contar`).
- Frontend: nueva función `listarCancionesPaginado(pagina, porPagina)` en `apiCanciones.ts`.
- [Lección]: `BaseRepository` ya tiene `buscarTodos(limit, offset)` y `contar()` — no es necesario crear nuevos métodos de repo para paginación básica.

# QL22 

✅ [AG-FIX] Investigado: 221/22,007 canciones tienen genero (backfill parcial desde metadata de samples). Las 21,786 restantes requieren run del scraper WhoSampled (track overview) para extraer genero. No es bug de display, es falta de datos en pipeline.

# QL23 

✅ [AG-FIX] Corregido: `ColeccionesRepository::tagsFrecuentesDelUsuario()` y `tagsFrecuentesExplorar()` usaban `UNNEST(s.tags)` (nombres de artistas WhoSampled). Cambiado a `jsonb_array_elements_text(COALESCE(metadata->'tags_es', metadata->'tags', '[]'))` para usar tags IA. Prioriza traducciones español.

# QL24

✅ [AG-FIX] Tres root causes corregidos:
- Backend (`SamplesController`): `total` se calculaba solo en page 1 — ahora siempre se envía.
- Frontend (`useFeedSamples`): `cargandoMas` podía quedarse `true` permanentemente por race condition del requestId — envuelto en try/finally.
- Frontend (`InicioIsland` + `useDescubrirIsland`): `totalServidor` no se reseteaba al cambiar ordenamiento — añadido useEffect reset. `totalServidor` inicializado como `null` en vez de `0`.

# QL25 

✅ [AG-FIX] Implementado: `MenuContextual` detecta móvil con `useEsMovil()` y renderiza como bottom sheet nativo. CSS con animación `bottomSheetEntrar` (translateY), overlay oscuro, barra de agarre, ítems con touch targets de 48px. Desktop sin cambios. Los 24 usos del componente heredan el comportamiento automáticamente.

# QL26

✅ [AG-APK] Logo icono reducido (scale 3.047→2.95 + SVG 19.83→14), splash screen con tema windowBackground #070707, CSP connect-src wss://ws.kamples.com. Deployado.

# QL27

✅ [AG-APK] Auditado: No hay bug. `theme_manager.rs` (lines 266-350) ejecuta git pull → composer install → npm build. Orden correcto.

# QL28

✅ [AG-APK] Bottom sheet: Removido cabecera (boton X), padding items var(--espacioLg), min-height 42px, overlay oscuro (--overlayOscuro), iconos a la derecha con order:1 + margin-left:auto. Deployado.

# QL29

✅ [AG-APK] Guia FCM en `App/docs/guia-fcm-android.md`. Scripts: `scripts/build-apk.ps1` (build+sign+install 1 comando) y `scripts/build-desktop.ps1` (EXE/NSIS 1 comando). Deployado.

# QL30

✅ [AG-APK] Tags en ingles: `ColeccionesRepository::tagsFrecuentesDelUsuario()` y `tagsFrecuentesExplorar()` ahora priorizan `metadata->'tags'` (ingles) con fallback a `metadata->'tags_es'`. Deployado.

# QL31

✅ [AG-APK] Busqueda rapida unificada: Backend agrega busqueda de colecciones + scoring de relevancia (exact=100, starts-with=80, contains=60, position penalty). Frontend: lista plana sin secciones/cabeceras, max 12 items ordenados por score. Nuevo tipo `ResultadoColeccion` + `ResultadoUnificado`. CSS limpiado (removidas clases seccion/cabecera/meta). Deployado.
- [Leccion]: botonBase.css tenia `.botonVolver` corrupto (anidado dentro de `::after`). Corregido en este commit.

# QL32

✅ [AG-APK] Boton Google en APK: `esDesktopApp` causaba `googleBotonRef=null` (Google GSI no funciona en WebView). Agregado boton alternativo con `IconoGoogle` + `loginGoogleDesktop` en ModalAuth (login y registro). CSS `.authGoogleBtnDesktop` con layout flex. En web sigue usando GSI nativo.

# QL33 

✅ [AG-APK] Estilos legales: `legal.css` usaba variables inexistentes (`--espacioGrande/Medio/Chico`). Corregidas a variables del sistema (`--espacio2xl/Lg/Md/Xl`). Tambien hardcoded font-sizes → variables tipograficas. Agregados estilos para links.

# QL34

✅ [AG-APK] FCM Android completo:
- **Android nativo:** google-services plugin 4.4.2 + firebase-bom 33.7.0 + firebase-messaging en Gradle. `KamplesFirebaseService.kt` (onNewToken→SharedPreferences+file, onMessageReceived→notificacion nativa con canal routing). `MainActivity.kt` obtiene token en onCreate. AndroidManifest actualizado.
- **Backend PHP:** Migracion `v057_fcm_tokens.sql` (tabla + indices). `FcmTokensCols.php`, `FcmTokensRepository.php` (upsert, eliminar, marcarInactivo). `ServicioFcm.php` (OAuth2 JWT via firebase/php-jwt, FCM HTTP v1 API, manejo 404/410 tokens invalidos). `FcmController.php` (POST registrar/eliminar, auth required). Integrado en `ServicioNotificaciones::crear()` y `KamplesController.php`.
- **Frontend bridge:** `fcmToken.ts` lee `fcm_token.txt` via Tauri FS plugin (AppData/AppLocalData fallback), registra en backend. Integrado en `useNotificacionesNativas.ts`. Module declaration `@tauri-apps/plugin-fs` en `global.d.ts`.
- **Pendiente:** Configurar `KAMPLES_FCM_SERVICE_ACCOUNT_JSON` env var en Coolify (Firebase Console → Service Accounts → Generate key).
- [Leccion]: Google GSI (Identity Services) no funciona en WebView (Tauri Android). Necesita flujo OAuth PKCE propio (`loginGoogleDesktop`). El bridge Kotlin→JS mas simple es file-based (SharedPreferences + filesDir + Tauri FS plugin).

# QL35

✅ [AG-APK] Fix feedSamplesVacio intermitente:
- **Root cause:** En stale-while-revalidate, cuando la API fallaba, el proveedor retornaba `[]` (error disfrazado de vacio). Esto: (1) reemplazaba datos stale validos con array vacio, (2) persistía `[]` en localStorage corrompiendo cache futuro.
- **Fix arquitectónico:** Nuevo tipo `ResultadoProveedor { ok: boolean, data: SampleResumen[] }`. `ProveedorSamples` ahora retorna resultado con flag de éxito. El hook solo actualiza UI y cache cuando `ok === true`. Si la revalidación falla, datos stale permanecen visibles.
- **Archivos:** FeedSamples.tsx (tipo), useFeedSamples.ts (cargarPagina con try-catch en stale path), 7 proveedores actualizados (InicioIsland, useDescubrirIsland, useDescargasPagina x3, useFavoritosPagina, ColeccionDetalleIsland, CancionDetalleIsland, useRelacionDetalleIsland).
- **Fix adicional:** `@tauri-apps/plugin-fs` agregado a `external` del build web Glory (mismo patrón que plugin-notification). Corregía fallo del `npm run build` en servidor.
- [Leccion]: Los proveedores NO deben retornar `[]` para errores — eso hace imposible distinguir error de resultado vacio real. Siempre retornar `{ ok, data }`.

# QL36

✅ [AG-APK] APK actualizado y listo:
- **APK:** `kamples-release.apk` en raíz del tema (49.4 MB, 2026-03-16).
- **Notificaciones:** Las notificaciones nativas del sistema SÍ funcionan (confirmado en QL45). El FCM push requiere configurar `KAMPLES_FCM_SERVICE_ACCOUNT_JSON` en Coolify (Firebase Console → Service Accounts → Generate key).
- **Ruta del APK build:** `desktop/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`. Después de firmar, copiar a raíz como `kamples-release.apk`.

# QL37 (antes de que empezaras QL35)

EL PROBLEMA DE QUE EL CONTADOR DEL FEED SAMPLE DICE 13 samples cuando hay mas y que al bajar no carguen mas smaples! ESE PROBLEMA SIGUE NO PASA SIEMPRE NO SE CUALES SON LAS CIRCUSTANCIA QUE LO LLEVAN A ESO!!!

Y SIGUE QUE AL HACER SCROLL NO CARGAN LOS SAMPLES; A VECES SI; A VECES NO; A VECES UNA PAGINA SI; A VECES UNA PAGINA NO

EL CONTADOR DE https://kamples.com/descargas/ y el de las colecciones debe decir el total que hay, no el total de la pagina!!

Cada vez que cargo el feed veo el proceso de select de postgres consumir todos los recursos y dar varios segundos procesando

me doy cuenta que las paginas no cargan, solo que son extremadamente lentas.

# QL38 ✅ [AG-OPT] Optimizacion feed query completada

- **Benchmark #1 (baseline):** >30,000ms timeout por query 
- **Benchmark #2 (CTE v1):** 734ms promedio — CTEs basicos + LEFT JOINs flags
- **Benchmark #3 (CTEs pre-agregados):** 127ms promedio — score_tags, repro_peso, likes_seguidos_cte
- **Mejora total: >30,000ms → 127ms (99.6%)**
- **Commits:** `7bd83825`, `7fb6b92e`, `fa1b5286`
- Detalles en `App/docs/optimizacion-feed-busqueda.md`
- **Lecciones:**
  - [PG PDO]: PostgreSQL PDO falla con params extras no referenciados en SQL (SQLSTATE[HY093]). MySQL los ignora. Siempre verificar que `$queryParams` solo tiene keys usadas en el SQL.
  - [CTEs]: `LATERAL UNNEST + LEFT JOIN` a multiples CTEs es dramaticamente mas rapido que `@> ARRAY[ut.tag]` correlacionado por fila. 294 samples × 7 subqueries → 1 pass con hash joins.
  - [Deploy]: Coolify manager deploy no siempre hace git pull. Verificar commit en container y hacer pull manual si necesario.




# QL39

✅ [AG-MNT] Fix json_validate_failed en OpenAI/Groq: retry sin response_format en HTTP 400, JsonRepairer extrae JSON de texto libre. Aplicado en ServicioIA::llamarGroq() y OpenAIHttpClient::chatCompletion().

Original: 

Error: Failed to generate JSON. Please adjust your prompt. See 'failed_generation' for more details.
Type: invalid_request_error
Code: json_validate_failed

Es un error comun en el modelo de openai/gpt-oss-120b, revisa en donde de usa, e intenta corregir

# QL40

✅ [AG-MNT] Log "TRIP PO" agregado al inicio de AyudanteDescargaAudio::descargarAudioYoutube(). 

# QL41

✅ [AG-MNT] Header dinamico en DescargasIsland: titulo, imagen y contador cambian segun tab activa (Coleccionados/Me Gustas/Comprados/Mas Ideas). Implementado con useMemo configs por tab.

# QL42

✅ [AG-MNT] Sugerencias ahora fusionan contexto de descargas + coleccionados (coleccion_samples). Nuevos metodos: ColeccionSamplesRepository::contextoColeccionadosUsuario() e idsColeccionadosUsuario(). SugerenciasController::sugerenciasDescargas() merger ambas fuentes.

# QL43

✅ [AG-MNT] Preview button: reposicionado de 42% magico a 52px fijo. Hover oscurece imagen (filter: brightness 0.8). Preview en ColeccionDetalleIsland conectado a useColeccionPreview (antes era TO-DO vacio).

# QL45 (cuando trabajabas en QL 35 vi)

✅ [AG-MNT] Parcial: Icono notif Android cambiado a R.mipmap.ic_launcher. Safe areas CSS: padding-top env(safe-area-inset-top) para topbar Android + viewport-fit=cover en meta tag.
**Pendiente:** Notificaciones con foto usuario, descripcion completa y redirect al contenido.

Original: que las notificaciones ya funcionan, pero el logo de la notificacion no es el kamples
ademas, las notificaciones debería ser iguales a las notificaciones de la app, con la foto del usuario, la descripcion, etc, y debe redirigir al contenido relacionado al hacer click dentro de la app

tambien veo que falta un paddin top en la app porque al menos en el emulador, la barra de arriba de android tapa un poco el contenido. No se si es el emulador. Y BOTTON, creo que el problema es otro, el view no encaja con el telefono y nav de abajo difiere en mi telefono y en el emulador areaSidebar la linea tiene diferente altura y choca con los iconos pero la distancia de choque no es igual en mi telefono que en el emulador asi que no se puede arreglar simplemente ajustando medidas, algo mas pas

# QL46

✅ [AG-MNT] Hamburguesa: agregados Configuracion, Grupo de WhatsApp y Cerrar sesion a hamburguesaItems en TopBar.tsx. SVGs APK: creado resolverRutaAsset util compartida, LandingPublica usa resolucion lazy con server prod en Tauri. 

# QL47

✅ [AG-MNT] Redis implementado en VPS: contenedor redis:7-alpine (128mb maxmemory, allkeys-lru), phpredis en Dockerfile, ServicioRedis singleton, ServicioCache con fallback WP transients, adquirirLock/liberarLock con SETNX atomico. Verificado: PONG + hello_redis desde PHP.

# QL45-Actualziacion despues de que leyeras QL45

creo que el problema es otro, el view no encaja con el telefono y nav de abajo difiere en mi telefono y en el emulador areaSidebar la linea tiene diferente altura y choca con los iconos pero la distancia de choque no es igual en mi telefono que en el emulador asi que no se puede arreglar simplemente ajustando medidas, algo mas pasa

# QL46 (SVGs APK)

✅ [AG-MNT] Incluido en fix QL46 arriba — resolverRutaAsset util + LandingPublica lazy resolution.

Original: En la apk, los svg del inicio no cargan

# QL47-B

✅ [AG-MNT] Sistema dedup centralizado: ServicioNotificaciones::crear() verifica existeReciente() antes de insertar. Ventanas por tipo: like/encanta/follow=24h, comentario=5min, venta=1h. Fallback graceful si dedup falla.

Original: Es posible spamear notificaciones a los usuarios, lo cual es malo, debe de haber un control centralizado para no repetir notificaciones, por ejemplo veo que si doy like a un sample y repetio la accion se envia la notifacion con cada like, y estas cosas asi estan mal, claramente hay cosas que corregir y mejorar.

# QL48

La aplicacion de escritorio no funciona, en modo dev si funcionan cosas como subir un sample pero desde el sync pero con la app creada desde el instalador no, algo malo pasa, n ose si ya lo mencione antes pero algunas imagenes de algunas cosas no cargan, darle click "mostrar kamples" no abre la ventana y esto era un problema viejo que se resolvio hace tiempo, no se si el instalador esta actualizado

otra cosa que me pregunto es que si kamples esta preparada para detectar las versiones del apk y el windows para avisar desatualizaciones. 

# QL49 

Despues de corregir lo de la apk, regenerala, activa el emulador e instala la aplicación en el emulador para probarla, deja el apok actualizado en la raiz para proborlo enun telefono real, asegura de que los permisos para guardar archivos este disponible, las subidas, etc, 

ajusta el modal de suscribirse en la apk para que diga "Suscribete en la web" ya que no podemos activar suscripciones en apk porque vamos a publicar en la apk store, y deja un plan para activar suscripciones en la apk store y adelantalo

tambien hay que revisar si la apk cumple con lo necesario para publicar en la apk store, y si no cumple con algo, hacer los ajustes necesarios para cumplir con eso, revisiones de seguridad, rendimiento, ¿que pasa cuando no hay internet?

creo que ya habia dicho antes que los svg no cargan en la apk

# QL50 

✅ [AG-MNT] Optimizacion feed completada:
- BN-5: Serendipia cache por usuario (TTL 30min, key `kamples_serendipia_{userId}`), filtra resultados ya presentes en feed actual.
- BN-3: Percentiles pre-calculados en cron (cada 5min via KamplesInit), cache `kamples_sat_pop_stats` evita recalculo si fresco.
- Stampede protection: lock SETNX atomico (`kamples_lock_feed_{userId}_{limite}_{offset}`) con 80ms wait, evita queries duplicadas en requests concurrentes.
- BN-2 Option B: Columna materializada `tags_enriquecidos` (text[] con GIN index), trigger PL/pgSQL auto-recalcula en INSERT/UPDATE, backfill initial, PrecomputadorFeed::cteEnriched() detecta columna via information_schema (cached 1h) y usa directamente si existe.
- Migration: v058_tags_enriquecidos.sql deployada.

# QL51

En movil, el modal de configuracion debería ser algo como Luma iOS 103.png, un dropdown (no es necesaria la info de usuario), con cada tab del modal como un item del dropdown, y al selecionar cambia al contenido de esa tab en el mismo dropdown

# QL52

✅ [AG-MNT] Completado:
- **Iconos en menu contextual:** Todos los items del menu de samples tienen icono lucide-react (Play, Eye, FolderPlus, Download, User, Link, Sparkles, PanelRight, ExternalLink, Pencil, BrainCircuit, Scissors, BadgeCheck, Unlink2, Search, Trash2, Flag). Usando `createElement` para evitar JSX en archivo `.ts`.
- **Separadores visuales:** `separadorDespues` ya existia en `MenuItemDef` pero no se renderizaba. Implementado en `MenuContextual.tsx` con `<div className="menuContextualSeparador">`. CSS: 1px bordeSutil con margin espacioXs.
- **Grupos:** 2 separadores para usuarios normales (tras "Ver detalle" y "Abrir panel"), 3 para admins (+ tras "Verificar sample"). Reportar y Eliminar quedan separados como zona de peligro.
- **Max-height desktop (QL55 parcial):** `.menuContextual` ahora tiene `max-height: 400px; overflow-y: auto` para menus largos.

# QL53

todas las colecciones incluyendo favoritos, descargas, etc deberían tener ordenamiento y filtrado como inicioBarraControl, y los filtros y ordenamiento tienen que funcionar individualmeente para cada feedsample.  

# QL54

✅ [AG-MNT] Completado:
- `@media (max-width: 870px)` oculta `.tarjetaWaveform` en todas las vistas.
- `@media (max-width: 1120px)` con `:has(.panelLateral)` oculta waveforms cuando el panel lateral reduce el espacio disponible.
- Waveform hiding movido de 640px a 870px. El breakpoint 640px conserva solo ajustes de grid y ocultamiento de botones secundarios.
- Fix pre-existente: `padding-left: 4px` → `var(--espacioXs)` en breakpoint movil.

# QL55

✅ [AG-MNT] Completado:
- **Panel lateral solo desde menu contextual:** Removido `onClickTitulo` que abria panel en FeedSamples, FavoritosIsland, DescargasIsland y ExploradorIsland. Click en titulo ahora navega a `/sample/{slug}/` (fallback nativo de TarjetaSample).
- **Sugerencias no auto-abrir en movil:** `abrirSugerencias()` en panelLateralStore verifica `window.innerWidth <= 1024` y no abre en viewport movil.
- **TarjetaSampleCuadricula:** Agregado fallback de navegacion cuando `onClickTitulo` es undefined.
- **Max-height menu contextual desktop:** Ya implementado en QL52 (400px + overflow-y:auto).

# QL56

✅ [AG-MNT] Completado:
- **Like sync reproductor-feed:** Nuevo evento global `EVENTO_LIKE_CAMBIADO` (CustomEvent, patron ya existente en el proyecto). `useFeedLikes`, `useReproductorGlobal` y `useBotonLike` emiten y escuchan el evento. Like desde reproductor actualiza TarjetaSample del feed y viceversa. Rollback optimista propagado correctamente si API falla.
- **z-index menuContextual:** `menuContextualOverlay`, `.menuContextual` y `.menuContextualBottomSheet` cambiados de `var(--zMenu)` (100) a `var(--zMenuPortal)` (1100). Los menus contextuales ahora aparecen por encima del reproductor (z-index 500).
- [Leccion]: El proyecto ya usaba CustomEvent para sync cross-componente (EVENTO_SAMPLE_GUARDADO_EN_COLECCION, EVENTO_SAMPLE_COMENTADO). Seguir ese patron es mas escalable que crear stores Zustand adicionales. 

# QL57

✅ [AG-MNT] Fix: Script `/tmp/run-benchmark.sh` en VPS usaba container ID viejo (`4cfb6b17cce6`). Actualizado a nombre `wordpress-mo4so4440c488g8woow4cow0`. Benchmark funciona: ~81ms promedio feed sin cache.

# QL58

✅ [AG-MNT] Log `TRIP PO` agregado al inicio de `_descargar_youtube()` en `kamples-scraper/extractor/audio_download.py`.

# QL59

✅ [AG-MNT] Nuevo prop `forzarDropdown` en MenuContextual. VentanaSincPanel lo usa para forzar modo dropdown desktop (viewport estrecho no activa bottom sheet).

# QL60

✅ [AG-MNT] Removida condicion `s.relacionSampleoId` del item 'corregir-ia' en `construirItemsMenuSample.ts`. Admins ven "Corregir metadata IA" en todos los samples.

# QL61 

Haz que todas las colecciones que se crean por defecto sean publicas, y las que existen actualmente, que sean publicas

# QL62 

Problema grave con el sync, los archivo los maneja como colecciones y los sube al servidor asi con estos nombre
READ ME!.txt
PandaFX.gif


esto es gravisimo, esto necesita una auditoría de seguridad 

# QL63

Auditoría de optimizacion de la subida del sync, seguridad: evitar perdida de datos con el mecanismo de (borrar archivo local despues de subir, o sea asegurarse de que realmente suba antes de borrar) y siento que entra en conflicto con la opcion de (al borrar en local, borrar en el servidor), obviamente ninguna de las dos debe estar activa al mismo tiempo, 

# QL64

puedo verificar y cambiar plan free a premiun de otros usuarios pero no a mi misma, debería poder
main-BTVgTlN8.js:820  PUT https://kamples.com/wp-json/kamples/v1/admin/usuarios/1 400 (Bad Request)
main-BTVgTlN8.js:820  PUT https://kamples.com/wp-json/kamples/v1/admin/usuarios/1 400 (Bad Request)
main-BTVgTlN8.js:820  PUT https://kamples.com/wp-json/kamples/v1/admin/usuarios/1 400 (Bad Request)
main-BTVgTlN8.js:820  PUT https://kamples.com/wp-json/kamples/v1/admin/usuarios/1 400 (Bad Request)

# QL65

✅ [AG-MNT] Completado:
- **Bug 1 (notificacion):** `DeduplicadorAudio` enviaba la notificacion al dueño del sample original (`$dupCreadorId`, usualmente admin/user 1) en vez del uploader (`$creadorId`). Corregido: ahora notifica al uploader que su sample fue flaggeado como posible duplicado.
- **Bug 2 (admin panel):** `DeduplicadorAudio` (deteccion por hash perceptual en background) NO insertaba registro en `duplicados_pendientes`. Solo `PipelineAudio` (SHA-256 exacto) lo hacia. Los duplicados detectados por hash perceptual nunca aparecian en `TabDuplicadosAdmin`. Corregido: se agrego `DuplicadosPendientesRepository::insertarRegistro()` con tipo `TIPO_CROSS_USUARIO`.
- Archivos: `DeduplicadorAudio.php` (imports + logica de notificacion + insercion duplicados_pendientes).
- [Leccion]: Hay dos flujos de dedup: PipelineAudio (SHA-256 exacto, sincrono) y DeduplicadorAudio (hash perceptual, background/cron). Ambos deben insertar en duplicados_pendientes para que el admin los vea.

# QL66-EXTRA 

✅ [AG-MNT] Completado:
- **Desktop sync ya NO bloquea subida de duplicados**: eliminado pre-check a `/check-duplicate` que bloqueaba same-user dups antes de subir.
- **Eliminado `moverADuplicados()`**: los 3 guards de concurrencia (hashesPendientesEncola, cola[], hashesConocidos) ahora solo hacen skip+log sin mover archivos a `duplicados/`.
- **Server pipeline ya era correcto**: PipelineAudio paso 2.5 detecta duplicados por SHA-256 ANTES de IA (paso 3). Marca `en_supervision` + insert `duplicados_pendientes`. Admin aprueba → `ReprocesadorPostDuplicado` → pipeline completo → activo.
- **Web/app upload ya era correcto**: usa mismo PipelineAudio.
- Imports limpiados: `marcarDescargaEnCurso`, `marcarMovimientoInterno`, `obtenerHeadersSyncGet` removidos.
- MD de planificacion: `App/docs/plan-ql66-dedup-restructure.md`.
- [Leccion]: El desktop tenia 4 puntos de bloqueo de duplicados con `moverADuplicados()`. El server solo necesita que el archivo llegue para decidir.

# QL67

✅ [AG-MNT] Completado:
- **Rotacion de modelos IA por inteligencia**: `ServicioIA` ahora tiene 8 modelos Groq ordenados (gpt-oss-120b > kimi-k2-0905 > kimi-k2 > compound > llama-3.3-70b > qwen3-32b > llama-4-scout > gpt-oss-20b) + fallback OpenAI (gpt-4o-mini).
- **Reintentos con espera**: max 3 intentos por modelo en modo cola con 60s entre reintentos. 429 per-model: NO cancela cadena completa. Umbral: 3 modelos consecutivos con 429 = rate limit de cuenta → parar.
- **Pausa entre samples**: `ProcesadorColaIA` espera 60s entre cada item procesado.
- **Retroalimentacion del flag global 429**: `GroqHttpClient::fueRateLimited()` era flag global que mataba toda la cadena. Ahora se resetea entre modelos/reintentos.
- **origen_subida en prompt IA**: `PipelineAudio` lee metadata JSONB (`SamplesRepository::obtenerMetadataJsonb()`), extrae `origen_subida` (ruta carpetas sync), la pasa a `PromptsIA::construirAnalisis()` como contexto para inferir genero/estilo.
- **ServicioImagenIA retry**: 2 reintentos por modelo vision con 30s de pausa (ejecuta en shutdown hook, no bloquea).
- **AnalizadoresModeracion rotacion**: vision (scout > maverick) y contextual (gpt-oss-120b > kimi-k2-0905 > llama-3.3-70b) ahora rotan en 429. Guard (safeguard-20b) sigue fijo por ser modelo especializado.
- **MD de planificacion**: `App/docs/plan-ql67-ia-rotation.md` con detalle de todos los procesos IA.
- [Leccion]: Groq rate limits son per-model — cada modelo tiene cuota independiente. 429 en gpt-oss-120b no significa que llama-3.3-70b este limitado.
- [Leccion]: Scripts Python no tocados (kamples-scraper tiene sus propios procesos IA separados).

# QL68

✅ [AG-MNT] Completado:
- Agregada heuristica `pareceArchivoConExtension()` en `fileWatcherService.ts`: si un nombre tiene `.` seguido de 1-10 chars alfanumericos, se trata como archivo, no carpeta. Esto cubre extensiones inventadas (`.xyz`, `.abc123`) que no estan en `EXTENSIONES_ARCHIVO_CONOCIDAS`.
- La lista de extensiones conocidas sigue como primera linea de defensa (match rapido en Set); la heuristica es fallback para extensiones desconocidas.
- Respuesta: no, un archivo con extension inventada NO se sube ni crea coleccion — se ignora con warning log.


# QL69

Respecto al plan-ql 66

dice

"Que TODOS los archivos (incluso duplicados) se suban al servidor para que el admin los revise. El desktop NO debe bloquear ni mover archivos a `duplicados/`."

En realidad solo me refería a los duplicados, no a todos, o sea solo se van a revisar los posibles duplicados

al menos un limite maximo de posibles duplicados por archivo, 

esto me hizo pensar en un sistema antispam, pero es dificil porque un usuario puede subir o debería poder subir 10.000 archivos si los arrastra al sync, tiene que ser un antispam inteligente por ejemplo si detecta el mismo archivo varias veces, una 6 veces deja sincronizar ese archivo y no permite mas la subida, pero esto puede dar falsos positivo, hay que mejorar la deteción para evitar falsos positivos

tambien hay algo que no planifique, la cola de subida, si bien, ahora que hay mas modelos de reserva, el proceso que genera los mp3 de preview optimizados puede consumir mucho cpu si se procesan muchos audios al mismo tiempo, esto tiene que gestionarse bien con cola 

# QL70

los samples que estan en la caperta Sin colección no se elimian despues de subir, bueno algunos si pero algunos no, entiendo exactamente porque (con la opcion activada de borrar archivo despues de subir automaticamente), el sistema debe ser mejor, y rastrear, omitir la papelera ahora tiene que dejar de omitir la carpeta de duplicados para los suba

otro detalle, el sistema de duplicados en el panel de admin tiene que ser capaz detectar multiplies audios duplicados, es decir, ahora los debería de agrupoar en caso de un audio se suba varias veces, revisar que todas las opciones funcionen correctamente. 

# QL71

aun no confio en el sistema duplicados, revisar que realmente al publicar un duplicado (a decir que no es un duplicado quede en cola para procesarse o publicarse de una vez si no hay cola), y que cuando se rechace realmente se elimine del servidor con todo y info

## Mantener lo distancia

























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
  - [Android build WDAC]: `tauri android build` falla con "os error 4551" (Control de Aplicaciones bloquea build scripts en OneDrive). Fix: `$env:CARGO_TARGET_DIR = "C:\cargo-target\kamples"` antes de ejecutar. El `.cargo/config.toml` solo aplica al cargo directo, no al invocado por Gradle.





















## Comando para actualizar produccion

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
