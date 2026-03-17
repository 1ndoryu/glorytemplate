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

### QL96/QL98 â€” Desktop pantalla negra

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

Pendiente: Revisar resiliencia del sistema de scrappy/extraccion/recorte de audio — solo procesos que involucran IA (rate limits, modelos de respaldo, comparar con cola IA interna). Ver QL111.

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

descarte los cambios de que hiciste sobre ql08, en realidad era una revision al sistema de scrappy y recorte pero solo a los procesos que involucran IA!

## QL112

Revisar que cuando se elimine a un usuario, todo su contenido se borre tambien, o cuando este suspendido o baneando su contenido incluyendo samples, publicaciones, colecciones, esten ocultos. 

## QL113

filaColecciones no puede moverse el scroll con el mouse, debería, y veo que parece que esta filtrando por usuario, deben aparecer todas las colecciones publicadas ordenadas por relevancia y likes. 

Y el boton de play pause en las lista de colecciones no aparece en el centro, debe aparecer en el centro y bajar el brillo un poco a la imagen. Me refiero a tarjetaColeccion.

# QL114 

No hay una indicación de cuando una coleccion es una subcolección, o sea, digo que en donde aparece 
<button class="botonBase varianteGhost tamanoMd botonVolver" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg><span>Librería</span></button>

solo debe aparecer para las colecciones de primer nivel 

y para las subcolecciones aparece migas de pan con el mismo estilo del boton 

tampoco hay una forma de cambiar la estructura, creo que para mantenerlo sencillo, en las configuraciones de la coleccion aparezca un select para elegir la coleccion padre o volverla superior. 

Esto tiene que funcionar bien.

Lo de las colecciones padre funciona bien, tienen 

# Tarea final

Build APK + instalador desktop tras QL106+QL107.



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
