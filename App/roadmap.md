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

## QK12/QK37 — Plan Android (Tauri/WebView) Urgente!!!!!!!!!!!!!!!!!!!!!! Esto es lo mas importante.

Crear md detallado de todo lo pendiente para la app Android (WebView con Tauri). Android Studio instalado.

## QK18/QK22 — Rediseno pagina musica estilo Spotify

Secciones horizontales, portada grande, letras abajo, secciones por generos, quitar tabs (ahora son secciones), no repetir canciones entre secciones, seccion albumes y artistas. Busqueda mantiene diseño de lista larga.

## QK67

✅ [AG-ADM] Fix sugerencias coleccion — usaba URL id (null para slug URLs), ahora usa coleccion?.id + params page/per_page match

## QK68

Necesito que el chat y las notificaciones funciones con websocket, por favor, az un plan detallado de eso y luego trabaja en eso.

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

[EN CURSO — AG-ADM] La solución de localStorage fallback sigue sin funcionar. Requiere investigación más profunda del ciclo Tauri Store.

## QK80

Auditoría de extractor de audio y su ia, que pasa si la ia que decide si un audio de es valido o no en la busqueda no esta disponible o entra en rate limits? tiene alternativas? tiene cola? Pausa el scrapper? me preocupa, tiene que ser resiliente, intentar con mas modelos, etc, debería poder identificar el rate limits y pausarse por 1 hora despues volver a intentar 

## QK81

Me preocupa el script de python, habia dicho antes que lote debía de ser de 100 pero sigue diciendo 20, no me preocupa eso exactamente sino que hicimos algunos cambios mas, entonces ninguno se habia aplicado realmente?, si era que el script nunca se actualizaba, quiero una copia de seguridad del version que usaba en el servidor antes de subir la nueva, esa copia tiene que estar presente aqui en local para revisar las diferencias

2026-03-14 09:08:11,293 [__main__] INFO: Lote completado: 20 exitosos, 0 fallidos de 20 total
2026-03-14 09:08:13,993 [__main__] INFO: Publicacion automatica disparada [HTTP 200]: {"ok":true,"publicados":1,"errores":0,"resultados":[{"cola_id":8902,"ok":true,"sample_id":239,"id_corto":"BdskSZ5"}]}

## QK82

Creo que no se han ejecutados las migraciones en local, en produccion si pero en local deben faltar, hacer un script o sistema automatico para que en local se ejecuten las migraciones faltantes asi como funciona en produccion.
 
## QK83

La busqueda sigue funcionando extremadamente lenta, no tiene sentido. Algo esta mal, esto necesita mas revisiones, mas pruebas, mediciones, un md detallado, no se puede tomar a ligera, no es normal que aparezca un resultado cada 30 segundos (contando por mi misma).

## QK




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