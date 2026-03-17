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

### QL96/QL98 — Desktop pantalla negra

[EN CURSO — AG-MNT] React no monta en Tauri webview (dev y build). Diagnostico:
- Body tiene clases plataformaTauri/plataformaEscritorio (init() empieza bien)
- Sync funciona en background (inicializarDesktop() completa)
- DOM #app queda vacio (React no renderiza o crash silencioso durante render)
- Causa exacta: aun no identificada (build compila OK, type-check OK)

**Cambios diagnosticos realizados:**
- `RootErrorBoundary` en AppProvider (appIslands.tsx) — muestra errores de render en pantalla
- Error handlers inline en index.html — captura errores de carga de modulos JS
- console.warn en init() (desktop/src/main.tsx) — traza paso a paso de inicializacion
- Proximo paso: ejecutar `npm run tauri:dev`, el RootErrorBoundary mostrara el error exacto en rojo

### QL97

✅ [AG-MNT] panelLateral: default 360px, max 500px (antes 340/700). Variable CSS actualizada.

### QL99

✅ [AG-MNT] CORS fix: endpoint `/descargas/stream` usa readfile()+exit (bypasea rest_pre_serve_request).
Headers CORS manuales agregados en DescargasStreamController.php para origenes Tauri/dev.

### QL100

✅ [AG-MNT] Multiples fixes APK Android:
- **QL100a** Login persistente: modal sin X en APK, auto-abre si no autenticado, layout single-column
- **QL100b** Google OAuth Mobile: deep-link `kamples://auth`, servicio `googleAuthMobileService.ts`, PHP `mobileCallback()` con PKCE, plugin deep-link en Tauri. **NOTA:** redirect URI `https://kamples.com/wp-json/kamples/v1/auth/google/mobile-callback` debe registrarse en Google Cloud Console.
- **QL100c** Descargas: reemplazado `<a download>` (no funciona en WebView) por `fetch()` + `@tauri-apps/plugin-fs writeFile` a Downloads
- **QL100d** Safe-area: variables CSS `--safeAreaTop`/`--safeAreaBottom`, aplicadas a 8 archivos CSS (modals, chat, dropdown, notificaciones)
- **QL100e** Icono notificacion: drawable vector `ic_notification.xml` monocromatico, metadata FCM default icon en AndroidManifest

### QL101

✅ [AG-MNT] Config movil: bottom-sheet parcial (max-height 75vh) con overlay backdrop en vez de fullscreen. Separadores entre botones eliminados.

### QL102

✅ [AG-MNT] FCM background: agregado campo `notification` al payload FCM (antes solo data). Android muestra automaticamente la notificacion cuando la app esta cerrada. Canal configurable por tipo (mensajes vs notificaciones).

### QL103

✅ [AG-MNT] Sync loop fix: flag `descargaMasivaActiva` en syncGuards, suprime eventos de carpeta/subcarpeta durante descarga masiva. Guard de tracking en subcarpeta callback. Gracia de descarga aumentada 10s→30s.

---

## Lecciones aprendidas (sesion actual)

- [APK/Download]: `<a download>` no funciona en Android WebView — cuelga la app intentando renderizar binario como HTML. Usar fetch+fs plugin.
- [APK/OAuth]: Android no soporta TcpListener localhost. Flujo mobile: browser → server callback → deep link `kamples://auth?payload=base64url`
- [FCM]: Data-only messages con `high` priority pueden no entregarse en background en algunos OEMs Android. Siempre incluir campo `notification` junto con `data`.
- [CSS/Safe-area]: Variables centralizadas `--safeAreaTop`/`--safeAreaBottom` con override en `body.plataformaAndroid` usando `env(safe-area-inset-top)`. Requiere `viewport-fit=cover` en meta viewport.
- [Sync/Loop]: Los eventos NTFS de carpeta/subcarpeta se disparan con cada `mkdir`/`writeFile` durante sync masivo. Flag global `descargaMasivaActiva` es la solucion mas limpia.
- [Toast API]: El store usa `toast.exito()` no `toast.success()` (esta en espanol).
- [Config modal]: Tauri plugin deep-link v2 expone `onOpenUrl()` en JS — el plugin maneja forwarding automatico sin necesidad de emitir eventos desde Rust.

## QL104

[EN CURSO — AG-MNT] Samples que no suben/eliminan durante sync. Crear diagnostico de estado de archivos locales vs servidor.
- Si estan duplicados, se suben igualmente y se eliminan (con opcion de eliminar al subir activa). El servidor resuelve dedup.

## QL105

[EN CURSO — AG-MNT] Desktop crash: deep-link plugin config espera sequence, no string.
Error: `invalid type: string "kamples", expected a sequence` en `plugins.deep-link`.

## L106

ya vi quen o quearon archivos, esta resuelto lo de QL104, solo creo falta una revision para ver que realmente no se borren archivos 

vi eeste error en la aplicacion de escritorio

notificacionesStore.ts:84 
 Warning: Cannot update a component (`Sidebar`) while rendering a different component (`TopBar`). To locate the bad setState() call inside `TopBar`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
    at TopBar (

Probando un poco el comportamiento noto que bien, no vuelve a subir los archivos duplicados

Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
authDesktopService.ts:72 [AuthDesktop] Init — LS: OK | tokenLS: true | userLS: true
authDesktopService.ts:84 [AuthDesktop] TauriStore — token: true | user: true
authDesktopService.ts:149 [AuthDesktop] Init OK — token: true, user: true
syncLogger.ts:108 [sync:syncService] Inicializando sync service Object
syncLogger.ts:108 [sync:journal] Checkpoint cargado correctamente 
syncLogger.ts:108 [sync:tracking] Estado recuperado desde journal 
syncLogger.ts:108 [sync:watcher] Observando carpeta: C:\Users\Owner\OneDrive\Documentos\test 
syncWatcherSetup.ts:1159 [Sync] Sync bidireccional activado
syncLogger.ts:108 [sync:syncWatcher] Reconciliación de descargas: 1773712298s sin sync completa, forzando 
syncCollectionService.ts:471 [SyncCollection] Omitiendo purge por ventana de gracia (sample reciente): 829 Rim-Reverb_KgmE_2upra.wav
syncLogger.ts:108 [sync:orphanAnalysis] Analisis periodico de huerfanos iniciado (cada 30min) 
(index):1 [Intervention] Images loaded lazily and replaced with placeholders. Load events are deferred. See https://go.microsoft.com/fwlink/?linkid=2048113
syncWatcherSetup.ts:155 [Sync] Escaneo local: 1 archivo(s) nuevo(s) encolado(s) para subida
syncLogger.ts:108 [sync:watcher] Archivo nuevo detectado: SM_PW_synth_bass_connection_F#.wav carpetas:  
syncLogger.ts:108 [sync:watcher] Flush batch: 1 archivos nuevos acumulados 
uploadQueueService.ts:556 [UploadQueue] Hash conocido pero sin archivo activo en tracking, evictando hash stale: SM_PW_synth_bass_connection_F#.wav
uploadQueueService.ts:600 [UploadQueue] Archivo encolado: SM_PW_synth_bass_connection_F#.wav
syncRegistroService.ts:183 [Sync] Archivo movido a Sin colección: SM_PW_synth_bass_connection_F#.wav
uploadQueueService.ts:1125 [UploadQueue] Subido exitosamente: SM_PW_synth_bass_connection_F#.wav → sample_id: 830
syncLogger.ts:108 [sync:uploadQueue] Archivo local borrado tras subida: SM_PW_synth_bass_connection_F#.wav 
syncLogger.ts:108 [sync:watcher] Eliminación detectada (esperando 5000ms por posible move): C:\Users\Owner\OneDrive\Documentos\test\SM_PW_synth_bass_connection_F#.wav 
syncLogger.ts:108 [sync:orphanAnalysis] Archivo huerfano encolado: Rim-Reverb_KgmE_2upra.wav 
syncLogger.ts:108 [sync:orphanAnalysis] Analisis completado {encolados: 1, eliminados: 0, reintentados: 0, carpetasVacias: 1}
syncLogger.ts:108 [sync:watcher] Eliminación confirmada (no fue move): C:\Users\Owner\OneDrive\Documentos\test\SM_PW_synth_bass_connection_F#.wav 
syncWatcherSetup.ts:751 [Sync] Ignorando DELETE de ruta movida internamente: C:\Users\Owner\OneDrive\Documentos\test\SM_PW_synth_bass_connection_F#.wav
syncLogger.ts:108 [sync:watcher] Archivo nuevo detectado: SM_PW_synth_bass_connection_F#.wav carpetas:  
syncLogger.ts:108 [sync:watcher] Flush batch: 1 archivos nuevos acumulados 
syncLogger.ts:108 [sync:watcher] Archivo nuevo detectado: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav carpetas:  
syncLogger.ts:108 [sync:watcher] Archivo nuevo detectado: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav carpetas:  
syncLogger.ts:108 [sync:watcher] Flush batch: 2 archivos nuevos acumulados 
uploadQueueService.ts:465 [UploadQueue] Archivo ya en proceso de encolamiento, ignorando: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav
uploadQueueService.ts:556 [UploadQueue] Hash conocido pero sin archivo activo en tracking, evictando hash stale: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav
uploadQueueService.ts:600 [UploadQueue] Archivo encolado: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav
syncRegistroService.ts:183 [Sync] Archivo movido a Sin colección: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav
uploadQueueService.ts:1125 [UploadQueue] Subido exitosamente: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav → sample_id: 831
syncLogger.ts:108 [sync:uploadQueue] Archivo local borrado tras subida: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav 
syncLogger.ts:108 [sync:watcher] Eliminación detectada (esperando 5000ms por posible move): C:\Users\Owner\OneDrive\Documentos\test\looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav 
syncLogger.ts:108 [sync:watcher] Eliminación confirmada (no fue move): C:\Users\Owner\OneDrive\Documentos\test\looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav 
syncWatcherSetup.ts:751 [Sync] Ignorando DELETE de ruta movida internamente: C:\Users\Owner\OneDrive\Documentos\test\looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient.wav

voy a probar cambiar el nombre de uno pero con el mismo sonido

[sync:watcher] Archivo nuevo detectado: looperman-l-6724938-0404393-clams-casino-half-beat-chops-ethereal-ambient-nombrecambiado.wav carpetas:  
syncLogger.ts:108 [sync:watcher] Flush batch: 1 archivos nuevos acumulados 

no lo sube, no digo que este compartamiento este mal, digo que ahora debe ser menos agresivo la detección duplicados, tambien pasa que no deja claro la razon por la cual no lo sube, osea que al menos diga, no se sube porque esta duplicado, pero en ese caso al menos tiene que borrarlo y no dejarlo ahi, realmente tiene que borrar si el duplicado es seguro, si no es seguro subirlo al servidor y dejar que se decida alla manualmente si se publica o no, es todo, revisa bien

tambien vi que intenta descargar samples o los descarga cuando la opcion de borrar archivo local al subir esta activa, esto no debe pasar, es fatal

[SyncCollection] Omitiendo purge por ventana de gracia (sample reciente): 829 Rim-Reverb_KgmE_2upra.wav
syncLogger.ts:108 [sync:watcher] Archivo nuevo detectado: F Sharp Synth Bass One Shot F#.wav carpetas:  
syncLogger.ts:108 [sync:watcher] Flush batch: 1 archivos nuevos acumulados 
syncWatcherSetup.ts:868 [Sync] Ignorando create propio (descarga en curso): F Sharp Synth Bass One Shot F#.wav
syncLogger.ts:108 [sync:watcher] Archivo nuevo detectado: Ethereal Chopped Ambient Loop 126bpm Fm.wav carpetas:  
syncLogger.ts:108 [sync:watcher] Flush batch: 1 archivos nuevos acumulados 
syncWatcherSetup.ts:868 [Sync] Ignorando create propio (descarga en curso): Ethereal Chopped Ambient Loop 126bpm Fm.wav

# Tarea final

Cuando se resuelva QL104+QL105: actualizar APK + instalador desktop.



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
