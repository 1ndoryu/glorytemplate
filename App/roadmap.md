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
| Dedup Global    | [docs/roadmap/plan-dedup-global.md](docs/roadmap/plan-dedup-global.md) | Plan "1 sample = 1 existencia"  dedup server + desktop + moderacion |

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


## Tareas QK — Estado actual

> QK1-QK53, QK55, QK61, QK62 completadas. Ver `docs/roadmap/completado.md` (seccion "Sprint QK").

### Completadas recientemente (verificadas en commits)
- ✅ QK45: Fix generar-siguiente 400 (f805493f)
- ✅ QK46: Reestructurar panel admin (cc28c58c)
- ✅ QK47+QK48: Auditoria ban + cron limpieza moderacion (04e72017)
- ✅ QK49: Tabla completa cola IA (f04be9b9)
- ✅ QK50: Waveform en duplicados + SelectorMenu nowrap (6d1c9b02)
- ✅ QK51: Grid procesos mayor altura (4a16c57f)
- ✅ QK52: Filtros columna + sort en cola extraccion (924a8016)
- ✅ QK53: Dedup extracciones + unificador retroactivo + migracion v051 (f3cf2512)
- ✅ QK55: Feed refresh cada 5min + visibility change (6f600087)
- ✅ QK61+QK62: Fix condicion extender recorte (tieneAudioCompleto) + dedup suma relaciones (813d4b06)
- ✅ [AG-ADM] QK54: Tooltip global — sistema reutilizable en todas las islas
- ✅ [AG-ADM] QK56: Persistir tabs/sort — URL params + PageRenderer keep-alive
- ✅ [AG-ADM] QK57: PHP memory_limit → 1G en deploy config (domain/mod.rs)
- ✅ [AG-ADM] QK58: Chat polling 5s — mensajes actualizan sin WebSocket, smart diff (length + lastId)
- ✅ [AG-ADM] QK59: Fix extender recorte — audioHash cache bust en waveform, boton restaurar, guardar timing original en metadata
- ✅ [AG-ADM] QK60: Solicitudes→Principal al responder — columna `aceptada` en conversaciones + migracion v052 + frontend optimistic update
- ✅ [AG-ADM] QK64: Fix toFixed admin — Number() coercion en todos los formatters (4 archivos, 8 llamadas)
- ✅ [AG-ADM] QK65: Counter feed inicio — useState(null) para evitar flash "0 samples", render condicional
- ✅ [AG-ADM] QK66: Admin tables — estados dinámicos con conteo del backend, fix intentos (incrementa en descargando, no en completado/error), artista/titulo parseado de URL en tabla scraper
- ✅ [AG-ADM] QK67: Fix sugerencias coleccion — usaba URL id (null en slugs), ahora usa coleccion?.id + params page/per_page
- ✅ [AG-ADM] QK69: Auditoria descarga ZIP — flock, MAX_SAMPLES_ZIP=500, MAX_ZIP_BYTES=2GB, realpath, cron limpieza diaria
- ✅ [AG-ADM] QK70: Fix samples desaparecen en coleccion — added `activa` a deps de fetch, guard !activa, error handling
- ✅ [AG-ADM] QK71: Tags EN — bpmUtils EN categories, tagUtils blacklist+synonyms expandido, SamplesRepository excluye tags_es de display
- ✅ [AG-ADM] QK72: Contexto IA recortes — PipelineAudio pasa metadataExtraccion a ServicioIA, prompt incluye cancion/artista/tipo
- ✅ [AG-ADM] QK73: Timeline reproductor — ocultar reproductorProgreso, borde superior 3px acento, tiempo compacto
- ✅ [AG-ADM] QK74: Fix "Cargando samples" — lazy useState desde localStorage, stale-while-revalidate instantaneo

### Pendientes

## QK12/QK37 — Plan Android (Tauri/WebView)

✅ [AG-ADM] Plan detallado creado en `App/docs/plan-android.md`. Cubre 4 fases: scaffolding → app base → sync/offline → nativo. Decisión: Tauri v2 Android (no Capacitor) — reutiliza 85-90% del código React + 70% Rust. Incluye: compatibilidad plugins, adaptaciones FS, pull-only sync, Google Play Billing, FCM push, deep linking, background audio.

## QK18/QK22 — Rediseno pagina musica estilo Spotify

Secciones horizontales, portada grande, letras abajo, secciones por generos, quitar tabs (ahora son secciones), no repetir canciones entre secciones, seccion albumes y artistas. Busqueda mantiene diseño de lista larga.

## QK67

✅ [AG-ADM] Fix sugerencias coleccion — usaba URL id (null para slug URLs), ahora usa coleccion?.id + params page/per_page match

## QK68

✅ [AG-ADM] WebSocket real-time para chat y notificaciones. Implementado: servidor Bun WS (`websocket-server/server.ts`) con HMAC ticket auth, `NotificadorWebSocket.php` (bridge PHP→Bun), `WsController.php` (endpoint `/ws/ticket`), `wsService.ts` actualizado con ticket auth, `useWebSocket.ts` reescrito con ciclo de vida auth, polling adaptativo (5s sin WS / 30s con WS), listeners WS en `useVentanaChat` y `useTopBar`. Plan completo en `App/docs/plan-websocket.md`. Pendiente: deploy del contenedor Bun como servicio Docker en Coolify + env vars (`KAMPLES_WS_INTERNAL_SECRET`, `KAMPLES_WS_TICKET_SECRET`, `KAMPLES_WS_NOTIFY_URL`, `KAMPLES_WS_PUBLIC_URL`).

## QK69

✅ [AG-ADM] Auditoria descarga ZIP — flock, MAX_SAMPLES_ZIP=500, MAX_ZIP_BYTES=2GB, realpath, cron limpieza

## QK70

✅ [AG-ADM] Fix samples desaparecen en coleccion — added `activa` a deps, guard !activa, error handling

## QK71

✅ [AG-ADM] Tags EN — bpmUtils EN, tagUtils blacklist+synonyms, SamplesRepository excluye tags_es de display

## QK72

✅ [AG-ADM] Contexto IA recortes — PipelineAudio pasa metadataExtraccion a ServicioIA, prompt incluye cancion/artista/tipo

## QK73

✅ [AG-ADM] Timeline reproductor — borde superior 3px acento, tiempo compacto

## QK74

✅ [AG-ADM] Fix "Cargando samples" — lazy useState desde localStorage, stale-while-revalidate instantaneo
 
## QK75

✅ [AG-ADM] Auditoría búsqueda — 14 índices GIN (FTS + pg_trgm + array + subqueries), WHERE filter con to_tsvector @@ plainto_tsquery, split tsvector en CancionesRepository. Migración v053.

## QK76

✅ [AG-ADM] Skeleton carga — SkeletonTarjetaSample reemplaza texto "Cargando más samples", BotonBase para cargar manualmente.

## QK77

✅ [AG-ADM] Auth desktop localStorage fallback — dual persistence (Tauri Store + localStorage), resync automático, módulo authDesktopEventos extraído.

## QK78

✅ [AG-ADM] Cola IA MAX_INTENTOS=30 + backoff exponencial (15→30→60→120min cap). Migración v054 reactiva items existentes.

## QK79

✅ [AG-ADM] Auditoría cola IA resilencia — confirmado: comentarios y publicaciones YA usan la cola. Backoff exponencial + MAX_INTENTOS=30 cubre escenario de rate limits prolongados.

## QK77-A

✅ [AG-ADM] Auth desktop fix — window global persistence (`__KAMPLES_AUTH_PERSIST__`), pre-React /me call, diagnostic logging, write verification. Eliminó import dinámico @vite-ignore que fallaba silenciosamente.

## QK80

✅ [AG-ADM] Auditoría resilencia IA — Sistema ya contaba con: cola con dedup, backoff exponencial (15→120min cap), max 30 reintentos, 6 modelos Groq en cascada, panel admin (ColaIaController) con stats/retry/force-process. **Gap crítico encontrado:** sin proveedor alternativo si Groq cae completamente. **Fix:** OpenAI gpt-4o-mini como fallback final en ServicioIA (analizarAudio + corregirMetadata). Activar con `OPENAI_API_KEY` en .env. Refactor SRP: prompts extraídos a `PromptsIA.php`, HTTP OpenAI a `OpenAIHttpClient.php`. ProcesadorColaIA ahora logea items omitidos por rate limit y alerta si hay ERROR_FINAL acumulados.

## QK81

✅ [AG-ADM] Fix batch size scraper — **Causa raíz:** `extractor/pipeline.py` tenía `default=100` correcto, pero `run_extraction.sh` y `cron_runner.py` pasaban `--limit 20` hardcodeado, sobrescribiendo el default. Los cambios al pipeline nunca se reflejaban porque el argumento explícito tiene prioridad.
- **Fix:** Reemplazado hardcoded 20 → env var `KAMPLES_BATCH_LIMIT` (default 100) en `run_extraction.sh` y `cron_runner.py`.
- **Backup VPS:** No se puede obtener via SSH desde este entorno. El usuario debe hacer `ssh VPS "cat /ruta/scripts/run_extraction.sh"` manualmente si quiere comparar. Git tiene la versión previa en el commit anterior.
- [Gotcha]: Los scripts caller (`run_extraction.sh`, `cron_runner.py`) pueden sobrescribir defaults del pipeline si pasan `--limit` explícitamente. Siempre verificar TODA la cadena de invocación.

## QK82

✅ [AG-ADM] Auto-run migraciones locales. Creado `MigradorLocal.php` en `App/Kamples/Database/` — detecta migraciones SQL pendientes comparando archivos `v*.sql` del directorio `migrations/` contra tabla `_migraciones_ejecutadas`. Se ejecuta automáticamente desde `KamplesInit::init()` solo en entorno local (WP_DEBUG o env LOCAL=true). Usa transient de 5 min para evitar overhead en cada request. Maneja errores idempotentes (already exists) como éxito. Excluye variantes alternativas de v001 (schema base de setup inicial).
- [Arq]: `__DIR__/migrations` desde `Database/MigradorLocal.php` apunta correctamente al directorio de migraciones.
- [Gotcha]: `v001_local_sin_pgvector.sql` y `v001_schema_inicial.sql` están excluidos — son alternativas al `v001_schema_base.sql` que ya se ejecutó en setup.
 
## QK83

✅ [AG-ADM] Búsqueda feed server-side FTS. **Causa raíz:** `obtenerFeed` no pasaba `busqueda` al backend; `useFeedFiltros` filtraba client-side con `String.includes()` sobre samples cargados → 50+ roundtrips para encontrar un match. **Fix:** backend `/feed` acepta `busqueda` param con FTS (GIN indexes QK75: `to_tsvector @@ plainto_tsquery` + ILIKE + tags UNNEST), relevancia ts_rank, debounce 350ms en InicioIsland, eliminado filtro client-side.

## QK87

✅ [AG-ADM] Corregido por QK83 — el sort no se actualizaba cuando había búsqueda activa porque el filtro client-side producía los mismos resultados sin importar el ordenamiento enviado al backend. Ahora `busquedaDebounced` está en `claveCache` y deps del proveedor, lo que garantiza refetch al cambiar sort con búsqueda activa.

## QK84

✅ [AG-ADM] Fix 133 errores TS en Desktop — path mappings en tsconfig (react, lucide-react, zustand, soundtouchjs), unificó GloryContext con campos opcionales desktop, eliminó declaraciones conflictivas global.d.ts, RUTAS_DESKTOP compatible con GloryRouteConfig.

## QK77-B

✅ [AG-ADM] Fix sync desktop — 3 problemas corregidos:
- **401 en colecciones:** Añadido `tieneTokenSync()` guard en `obtenerColeccionesDelServidor()` para no hacer requests sin auth (evita 401 ruidoso en consola).
- **Perfil no actualiza tras login:** `VentanaSincPanel` ahora suscribe a `authStore.usuario.id` como dependencia del useEffect de perfil. Cuando `manejarLoginExterno()` actualiza authStore, el perfil se re-lee inmediatamente (primero de authStore, fallback a Tauri Store).
- **Carpeta sync no se desvincula al logout:** `cerrarSesionDesktop()` y `manejarLogoutExterno()` ahora limpian `config.carpetaLocal`, `sincronizacionActiva` y `ultimaSync` y persisten cambios. El próximo login requiere elegir carpeta nueva.
- [Arq]: tieneTokenSync() exportada desde syncGuards.ts — reutilizable por cualquier módulo sync.

## QK85

En detalleDescripcionInterna se tiene que usar la descripcion corta, no la larga, verificar que haya una version de descripcion corta en ingles que se genere, y si no, que se genere tambien y usarla en ingles.

## QK86 

Empieza a trabajar en todo lo que puedas del plan-android.md
para mi algo importante son las notificaciones, anticipar que las notificaciones de la app deben aparecer en el telefono, si es posible no usar cosas externas, mejor. 

## QK88

✅ [AG-ADM] Auditoría distribución seed — **operaciones core seguras** (solo tocan registros sin contribuidor real, con `creador_id = sistemaId`). **Brechas encontradas y corregidas:** perfiles seed visibles en API pública (`buscarPerfilPublico`), búsqueda rápida (`buscarUsuarios`), y listas de seguidores (`listarSeguidores`). Fix: añadido `AND es_seed = false` en las 3 queries. SEO protegido automáticamente por herencia. Samples de seed users en feed es intencional (contenido real scrapeado).

## QK89

✅ [AG-ADM] Username/email/password change 100% frontend:
- **Username**: Añadida validación de duplicado en `actualizarPerfil` — verifica `username_exists()` (WP) + `existeUsername()` (PG) excluyendo al propio usuario. Retorna 409 si ya existe.
- **Email**: Nuevo endpoint `PUT /me/email` — requiere contraseña actual, valida formato, verifica duplicado, actualiza WP + PG. Rate limit 5/hora.
- **Password**: Nuevo endpoint `PUT /me/password` — requiere contraseña actual + nueva + confirmación, valida longitud, regenera cookies auth. Rate limit 5/hora.
- **Frontend**: Sección "Cuenta" de ModalConfiguracion reimplementada con formularios inline (toggle abrir/cerrar), toast feedback, estados dedicados en `useModalConfiguracion`.
- **Bug fix**: `bio` no se sincronizaba al abrir modal (faltaba en useEffect).

## QK90

✅ [AG-ADM] SEO revision — Plan en `plan-seo.md` ya estaba ~95% implementado (DynamicSeoResolver, RuntimeSeoData, MusicRecording JSON-LD, og:audio, sitemaps, SEO defaults). Correcciones aplicadas:
- **robots.txt:** Añadido filtro `robots_txt` en `seo.php` con Disallow para rutas privadas/admin y referencia a sitemap.
- **SEO defaults faltantes:** Agregados `musica` (indexable, title+desc ricos), `explorador` (indexable), `notificaciones` (noindex).
- [Arq]: Toda la infra SEO (resolvers dinámicos, JSON-LD, sitemaps, OG audio) ya existía correctamente.

## QK91

✅ [AG-ADM] BusquedaRapida dropdown: width 450px centrado (left 50% + translateX(-50%)), gap 6px en info, fade mask-image en texto sampleo largo (sin max-width), .slice(0,3) en las 4 secciones (canciones/samples/sampleos/usuarios). Override móvil actualizado con resets explícitos (left: auto, transform: none, width: 100%).

## QK92

✅ [AG-ADM] Desktop music page 404 local — Faltaba la ruta `/musica/` en `RUTAS_DESKTOP` de `desktop/src/main.tsx`. En producción funciona porque PHP genera las rutas dinámicamente via `PageManager::reactPage()`, pero en desktop las rutas son estáticas. Agregada `'/musica/': { island: 'ExplorarCancionesIsland', props: {}, title: 'Música' }`.
- [Gotcha]: Toda nueva página registrada en `pages.php` necesita agregarse manualmente a `RUTAS_DESKTOP` para que funcione en desktop.

## Qk93

✅ [AG-ADM] Deploy WebSocket container — Infraestructura completa para desplegar el servidor Bun WS como servicio Docker en Coolify:
- **Docker-compose template** (`kamples-stack.yaml`): Nuevo servicio `websocket` con build inline (Bun + fetch server.ts de GitHub), healthcheck, env vars (secrets + `SERVICE_FQDN_WEBSOCKET` para Traefik/SSL automático).
- **WordPress env vars**: `KAMPLES_WS_INTERNAL_SECRET`, `KAMPLES_WS_TICKET_SECRET`, `KAMPLES_WS_NOTIFY_URL=http://websocket:8080/notify` (red Docker interna), `KAMPLES_WS_PUBLIC_URL=wss://ws.{domain}`.
- **template_engine.rs**: `kamples_vars()` ahora genera WS secrets (32 chars), deriva `WS_DOMAIN` y `WS_PUBLIC_URL` del dominio, acepta `glory_branch` para la URL de GitHub en el Dockerfile.
- **CLI**: Nuevo comando `deploy-websocket --name kamples` — lee compose actual del stack via Coolify API, inyecta servicio WS + env vars, actualiza compose, reinicia stack.
- **coolify_api.rs**: Nuevo método `update_stack_compose()` (PATCH `/api/v1/services/{uuid}` con base64).
- **docker.rs**: Nuevo `find_websocket_container()` para localizar el contenedor Bun por stack UUID.
- **theme_manager.rs**: `update_glory_theme()` ahora llama `update_websocket_server()` — copia server.ts actualizado del WP container al WS container y reinicia.
- **Pendiente usuario**: (1) Crear DNS A record `ws.kamples.com` → VPS IP. (2) Recompilar Rust binary (`cargo build --release`). (3) Ejecutar `deploy-websocket --name kamples`. (4) Verificar SSL con `openssl s_client -connect IP:443 -servername ws.kamples.com`.
- [Arq]: WS service usa red Docker interna para comunicación PHP→WS (POST /notify). Traefik maneja SSL/WSS para clientes externos.
- [Gotcha]: El Dockerfile del WS container descarga server.ts de GitHub raw (branch dinámico). Para updates de código, `deploy --update` copia server.ts del WP container al WS container y reinicia. No requiere rebuild de imagen.

## QK94

Revisiones de seguridad, revisiones de optimizacion generales.

## QK95

La busqueda no esta actualizando la lista de samples.

## QK96

Hay un error, revisa los logs

## Despliegue Produccion (VPS Coolify)

**Estado:**  Produccion  `https://kamples.com` activo con SSL Let's Encrypt (valido hasta Jun 11 2026).

- **Stack UUID:** `mo4so4440c488g8woow4cow0`
- **URL produccion:** `https://kamples.com`
- **WordPress:** Tema activo, SEO funcionando (OG, structured data, sitemaps), React islands cargando (CSS/JS enlazados)
- **PostgreSQL 18:** pgvector 0.8.2, 28 tablas creadas (41 migraciones ejecutadas)
- **React build:** Completado (Vite + prerender, dist/assets + dist/ssg)
- **Glory submodule:** Commit `d9ef2085` en `main` (fix `registrarRutaDinamica`)
- **Env vars:** Todas presentes (Stripe, Google OAuth, Groq, DataImpulse, PG)
- **Pendiente:** `GLORY_STRIPE_WEBHOOK_SECRET` vacio  configurar en Coolify cuando se conecte dominio
- **Pendiente:** Conectar dominio `kamples.com` en Coolify
- **Lecciones:**
  - [Submodule]: Glory en servidor estaba en `glory-react` (branch viejo sin `registrarRutaDinamica`). Fix: `git stash` + `git submodule update --init Glory`
  - [PG18]: Mount en `/var/lib/postgresql` (no `/var/lib/postgresql/data`)  breaking change PG18
  - [Migraciones]: No hay auto-runner. Ejecutar manualmente con PHP runner base64-encoded
  - [React build]: `npm install` necesario en servidor antes de `npm run build` (soundtouchjs faltaba)
  - [coolify-manager-rs `deploy --update`]: env var del DB es `KAMPLES_PG_DBNAME` (no `KAMPLES_PG_DB`). Fix aplicado.
  - [OPcache]: Apache/mod_php usa OPcache que cachea PHP bytecode. Despues de un git pull, hacer `service apache2 reload` para limpiar cache. Sin reload, el PHP viejo sigue ejecutandose aunque los archivos cambien.
  - [bloqueos]: Tabla `bloqueos` creada en QQ25 via Schema System pero sin migracion SQL. Nunca se ejecuto en produccion. Sin esta tabla, todas las queries del feed/comentarios/notificaciones crasheaban silenciosamente (error 42P01). Migracion v043 creada y aplicada.
  - [diagnostico]: Revisar logs en `App/logs/kamples-YYYY-MM-DD.log` y `App/logs/kamples-algoritmo-YYYY-MM-DD.log` para detectar errores de BD. El error 42P01 (Undefined table) es criticamente grave  mata queries silenciosamente.
  - [WAV upload]: `$audio['type']` (browser MIME) es NO fiable  varia por OS/browser. Fix: validar por extension + finfo magic bytes RIFF/WAVE como fallback. `audio/x-wav` es lo que devuelve finfo en este servidor Linux (ya en la whitelist).
  - [OPcache/Docker]: `service apache2 reload` NO limpia OPcache de mod_php. `apachectl graceful` (SIGUSR1) es el comando correcto  reemplaza workers sin matar PID 1 (el contenedor). Ahora se ejecuta automaticamente en cada `deploy --update`.
  - [npm build logging]: El npm build tardaba ~7s pero no tenia tracing::info!. Ahora muestra "Compilando React..." y "React compilado exitosamente." en los logs del deploy.
  - [SMTP/Docker]: `sendmail` no existe en el contenedor Docker WP. Usar mu-plugin que configura PHPMailer via SMTP externo. El mu-plugin `00-smtp-config.php` se genera y despliega automaticamente en cada `deploy --update` si existe config `smtp` en `settings.json` del coolify-manager-rs. Proveedor: Brevo (smtp-relay.brevo.com:587, TLS). Credenciales en `coolify-manager-rs/config/settings.json` bloque `smtp`.
  - [coolify-manager-rs settings.json]: El binario usa `config/settings.json` relativo a donde corre (`.agent/coolify-manager-rs/config/settings.json`), NO el del PowerShell manager (`.agent/coolify-manager/config/settings.json`).
  - [Traefik labels/dominio]: Cuando se cambia el FQDN en Coolify, el archivo docker-compose en disco (`/data/coolify/services/{uuid}/docker-compose.yml`) se actualiza, pero el contenedor corriendo mantiene las labels antiguas. Para aplicar el nuevo dominio y obtener el certificado SSL, hay que recrear el contenedor: `cd /data/coolify/services/{uuid} && docker compose up -d --no-build --force-recreate wordpress`. Los datos persisten en volumenes Docker.
  - [SSL Let's Encrypt/Traefik]: Traefik emite el certificado automaticamente al detectar labels `traefik.http.routers.*.tls.certresolver=letsencrypt`. El cert se guarda en `/traefik/acme.json` dentro del contenedor `coolify-proxy`. Verificar emision: `docker exec coolify-proxy grep kamples /traefik/acme.json`.
  - [DNS VPS interno]: El VPS puede resolver `kamples.com` a una IP diferente (DNS interno del proveedor). No afecta a usuarios externos (Google 8.8.8.8 y Cloudflare 1.1.1.1 resuelven a la IP correcta). Verificar SSL desde el servidor con `openssl s_client -connect {IP}:443 -servername kamples.com`.
  - [Coolify DB]: Las "applications" de git/imagen estan en tabla `applications`. Los stacks Docker Compose estan en `services` + `service_applications` (con columna `fqdn`). El UUID del stack es `mo4so4440c488g8woow4cow0`, subapp wordpress tiene UUID `ng4kko8k0k4k0cswswos0ooo`.

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
6. `npm run build` (Vite  compila React/SSG)  **loggea "Compilando React..." y "React compilado."**
7. Ejecuta migraciones SQL pendientes (lee `migrations/*.sql`, compara con `_migraciones_ejecutadas`)
8. `chown -R www-data:www-data` (permisos)
9. `apachectl graceful`  **limpia OPcache sin matar el contenedor Docker**

**Si el build del binary Rust cambio**, tambien ejecutar:
```powershell
cd .agent/coolify-manager-rs
cargo build --release
# Luego hacer git add + commit del .exe o simplemente correr el nuevo .exe localmente
```