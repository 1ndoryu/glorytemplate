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
| Dedup Global    | [docs/roadmap/plan-dedup-global.md](docs/roadmap/plan-dedup-global.md) | Plan "1 sample = 1 existencia" — dedup server + desktop + moderacion |

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


## Tareas nuevas a organizar y hacer


## QK1 [EN CURSO — AG-DSK]

La aplicacion de escritorio sigue fallando con el inicio de sesion, deslogea pero nunca se deslogea de verdad, a recargar parece cargar el usuario anteiror, la foto perfil el sync no carga y el console log esta plagadado de 401, esto funciona falta

ESTO NECESITA UNA AUDITORIA PROFUNDA PARA QUE NO HAYA FALLOS CON EL SYNC; CERRAR SESION LO MEJOR ES QUE TODO SE BORRE DESDE CERO NO SE PERO SIGO VIENDO HISTORIAL DEL USUARIO ANTERIO Y AL RECARGAR VEO COMO S FUERA EL USUARIO ANTERIOR 

LA PAGINA DE MUSICA NO CARGA EN LA APLICACION; LO DE¿Cuáles son tus géneros favoritos? Sale a cada rato supongo que es por el mismo problema

El peefil me acabo de dar cuenta que me sale es el correcto pero 

Failed to load resource: the server responded with a status of 401 (Unauthorized)
syncLogger.ts:108 [sync:syncWatcher] Reconciliación de descargas: 1773438176s sin sync completa, forzando 
:1420/wp-json/kamples/v1/me/sync/colecciones?_t=1773438176169:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
syncCollectionService.ts:296  [SyncCollection] Error obteniendo colecciones: 401 Lo siento, no tienes permisos para hacer eso.
obtenerColeccionesDelServidor @ syncCollectionService.ts:296
:1420/:1 [Intervention] Images loaded lazily and replaced with placeholders. Load events are deferred. See https://go.microsoft.com/fwlink/?linkid=2048113
:1420/wp-json/kamples/v1/me/sync/colecciones?_t=1773438176483:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
syncCollectionService.ts:296  [SyncCollection] Error obteniendo colecciones: 401 Lo siento, no tienes permisos para hacer eso.
obtenerColeccionesDelServidor @ syncCollectionService.ts:296
:1420/wp-json/kamples/v1/descargas/limites:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/reproducciones/ids:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/descargas/limites:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/reproducciones/ids:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
avatar_1771208514.jpg:1   Failed to load resource: the server responded with a status of 404 (Not Found)
:1420/wp-json/kamples/v1/mensajes/conversaciones:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/notificaciones?page=1:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/perfil/admin:1   Failed to load resource: the server responded with a status of 404 (Not Found)
:1420/wp-json/kamples/v1/perfil/admin:1   Failed to load resource: the server responded with a status of 404 (Not Found)
avatar_1771208514.jpg:1   Failed to load resource: the server responded with a status of 404 (Not Found)

## QK2 [EN CURSO — AG-DSK]

El modal de usuario para seguir odnde muestra la info al hacer hover, al seguir, y volver a hacer hover sale boton para seguir cuando ya se sigio, es decir. No se actualiza

## QK3

¿Cuáles son tus géneros favoritos? a veces sale por un momento al iniciar sesion cuando debería de salir una sola vez.

## QK4

Plan 'pro' no tiene price_id configurado (el price es price_1SgsPECdHJpmDkrr0uHyUYLj) asegurate de que las env que tenemos aca en local esten produccion

tambien he configurado el websocket como https://kamples.com/wp-json/glory/v1/stripe/kamples , he puesto GLORY_STRIPE_WEBHOOK_SECRET en el env local

## QK5

El inicio de sesion de google solo funciona si ya estas logeado, aparecen las cuentas en las esquinas pero no funciona en incognito, a dar click al boton no hace nada.































## Despliegue Produccion (VPS Coolify)

**Estado:** ✅ Producción — `https://kamples.com` activo con SSL Let's Encrypt (válido hasta Jun 11 2026).

- **Stack UUID:** `mo4so4440c488g8woow4cow0`
- **URL produccion:** `https://kamples.com`
- **WordPress:** Tema activo, SEO funcionando (OG, structured data, sitemaps), React islands cargando (CSS/JS enlazados)
- **PostgreSQL 18:** pgvector 0.8.2, 28 tablas creadas (41 migraciones ejecutadas)
- **React build:** Completado (Vite + prerender, dist/assets + dist/ssg)
- **Glory submodule:** Commit `d9ef2085` en `main` (fix `registrarRutaDinamica`)
- **Env vars:** Todas presentes (Stripe, Google OAuth, Groq, DataImpulse, PG)
- **Pendiente:** `GLORY_STRIPE_WEBHOOK_SECRET` vacio — configurar en Coolify cuando se conecte dominio
- **Pendiente:** Conectar dominio `kamples.com` en Coolify
- **Lecciones:**
  - [Submodule]: Glory en servidor estaba en `glory-react` (branch viejo sin `registrarRutaDinamica`). Fix: `git stash` + `git submodule update --init Glory`
  - [PG18]: Mount en `/var/lib/postgresql` (no `/var/lib/postgresql/data`) — breaking change PG18
  - [Migraciones]: No hay auto-runner. Ejecutar manualmente con PHP runner base64-encoded
  - [React build]: `npm install` necesario en servidor antes de `npm run build` (soundtouchjs faltaba)
  - [coolify-manager-rs `deploy --update`]: env var del DB es `KAMPLES_PG_DBNAME` (no `KAMPLES_PG_DB`). Fix aplicado.
  - [OPcache]: Apache/mod_php usa OPcache que cachea PHP bytecode. Despues de un git pull, hacer `service apache2 reload` para limpiar cache. Sin reload, el PHP viejo sigue ejecutandose aunque los archivos cambien.
  - [bloqueos]: Tabla `bloqueos` creada en QQ25 via Schema System pero sin migracion SQL. Nunca se ejecuto en produccion. Sin esta tabla, todas las queries del feed/comentarios/notificaciones crasheaban silenciosamente (error 42P01). Migracion v043 creada y aplicada.
  - [diagnostico]: Revisar logs en `App/logs/kamples-YYYY-MM-DD.log` y `App/logs/kamples-algoritmo-YYYY-MM-DD.log` para detectar errores de BD. El error 42P01 (Undefined table) es criticamente grave — mata queries silenciosamente.
  - [WAV upload]: `$audio['type']` (browser MIME) es NO fiable — varía por OS/browser. Fix: validar por extensión + finfo magic bytes RIFF/WAVE como fallback. `audio/x-wav` es lo que devuelve finfo en este servidor Linux (ya en la whitelist).
  - [OPcache/Docker]: `service apache2 reload` NO limpia OPcache de mod_php. `apachectl graceful` (SIGUSR1) es el comando correcto — reemplaza workers sin matar PID 1 (el contenedor). Ahora se ejecuta automáticamente en cada `deploy --update`.
  - [npm build logging]: El npm build tardaba ~7s pero no tenía tracing::info!. Ahora muestra "Compilando React..." y "React compilado exitosamente." en los logs del deploy.

  - [SMTP/Docker]: `sendmail` no existe en el contenedor Docker WP. Usar mu-plugin que configura PHPMailer via SMTP externo. El mu-plugin `00-smtp-config.php` se genera y despliega automáticamente en cada `deploy --update` si existe config `smtp` en `settings.json` del coolify-manager-rs. Proveedor: Brevo (smtp-relay.brevo.com:587, TLS). Credenciales en `coolify-manager-rs/config/settings.json` bloque `smtp`.
  - [coolify-manager-rs settings.json]: El binario usa `config/settings.json` relativo a donde corre (`.agent/coolify-manager-rs/config/settings.json`), NO el del PowerShell manager (`.agent/coolify-manager/config/settings.json`).
  - [Traefik labels/dominio]: Cuando se cambia el FQDN en Coolify, el archivo docker-compose en disco (`/data/coolify/services/{uuid}/docker-compose.yml`) se actualiza, pero el contenedor corriendo mantiene las labels antiguas. Para aplicar el nuevo dominio y obtener el certificado SSL, hay que recrear el contenedor: `cd /data/coolify/services/{uuid} && docker compose up -d --no-build --force-recreate wordpress`. Los datos persisten en volúmenes Docker.
  - [SSL Let's Encrypt/Traefik]: Traefik emite el certificado automáticamente al detectar labels `traefik.http.routers.*.tls.certresolver=letsencrypt`. El cert se guarda en `/traefik/acme.json` dentro del contenedor `coolify-proxy`. Verificar emisión: `docker exec coolify-proxy grep kamples /traefik/acme.json`.
  - [DNS VPS interno]: El VPS puede resolver `kamples.com` a una IP diferente (DNS interno del proveedor). No afecta a usuarios externos (Google 8.8.8.8 y Cloudflare 1.1.1.1 resuelven a la IP correcta). Verificar SSL desde el servidor con `openssl s_client -connect {IP}:443 -servername kamples.com`.
  - [Coolify DB]: Las "applications" de git/imagen están en tabla `applications`. Los stacks Docker Compose están en `services` + `service_applications` (con columna `fqdn`). El UUID del stack es `mo4so4440c488g8woow4cow0`, subapp wordpress tiene UUID `ng4kko8k0k4k0cswswos0ooo`.

## Comando para actualizar producción

```powershell
cd .agent/coolify-manager-rs
.\target\release\coolify-manager.exe deploy --name kamples --update
```

**Qué hace el comando `deploy --update`** (en orden):
1. `git pull` del tema (glorytemplate) en el contenedor WP
2. `git pull` del submodule Glory
3. `composer install --no-dev` (dependencias PHP)
4. Verifica que Node.js esté instalado (instala si falta)
5. `npm install` si node_modules no existe
6. `npm run build` (Vite — compila React/SSG) — **loggea "Compilando React..." y "React compilado."**
7. Ejecuta migraciones SQL pendientes (lee `migrations/*.sql`, compara con `_migraciones_ejecutadas`)
8. `chown -R www-data:www-data` (permisos)
9. `apachectl graceful` — **limpia OPcache sin matar el contenedor Docker**

**Si el build del binary Rust cambió**, también ejecutar:
```powershell
cd .agent/coolify-manager-rs
cargo build --release
# Luego hacer git add + commit del .exe o simplemente correr el nuevo .exe localmente
```