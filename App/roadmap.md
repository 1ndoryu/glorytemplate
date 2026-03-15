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
- Windows EXE generado: `C:\cargo-target\kamples\release\bundle\nsis\Kamples_0.1.0_x64-setup.exe`
- APK arm64 en proceso de build (CARGO_TARGET_DIR necesario para evitar WDAC block en OneDrive).
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
