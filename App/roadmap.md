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


## QK1 ✅ [AG-DSK]

**Solución:** Auditía profunda del flujo de logout. Root causes: (1) `cerrarSesionDesktop()` no llamaba `detenerSyncBidireccional()` — el sync watcher seguía polling con token null → cascada de 401. (2) `GLORY_CONTEXT.isLoggedIn` no se limpiaba → el sistema detectaba usuario anterior al recargar. (3) Stores con datos de usuario (tooltipPerfil, notificaciones, mensajes, reproducidos) no se limpiaban al logout → datos del usuario anterior persistían.
- Archivos: `authDesktopService.ts`, `useAuth.ts`, `tooltipPerfilStore.ts`
- [logout]: Siempre detener sync watcher ANTES de limpiar tracking. Sin esto, polling con token null → 401 infinito.
- [GLORY_CONTEXT]: Al hacer logout en desktop, limpiar `isLoggedIn` y `userId` del contexto global.
- [stores cleanup]: Al hacer logout, limpiar cache de tooltipPerfil, vaciar notificaciones, mensajes, reproducidos.

## QK2 ✅ [AG-DSK]

**Solución:** `tooltipPerfilStore` cacheaba perfiles (incluyendo estado `siguiendo`) y nunca los invalidaba tras follow/unfollow. Añadido `invalidarCache(username)` al store y llamada en `manejarSeguir()` de `useTooltipPerfil.ts` cuando la API retorna `ok`. El próximo hover re-fetchea datos frescos.
- Archivos: `tooltipPerfilStore.ts`, `useTooltipPerfil.ts`
- [cache invalidation]: Tras follow/unfollow exitoso, invalidar el perfil específico del cache para forzar re-fetch.

## QK3 ✅ [AG-DSK]

**Solucion:** El modal de generos aparecia brevemente porque `useInicializadorAuth` seteaba `perfilVerificado=true` con datos cacheados (que no incluian generos). Solucion: nuevo flag `perfilVerificado` en authStore. El cache inicia con `verificado=false`, se hace refetch silencioso a `/me`, y solo cuando el servidor confirma datos reales se marca `verificado=true`. El modal solo se muestra si `perfilVerificado=true` Y el usuario no tiene generos.
- [authStore]: Flag `perfilVerificado` evita que datos cacheados incompletos disparen UI.

## QK4 ✅ [AG-DSK]

**Solucion:** `GLORY_STRIPE_PRICE_PRO=price_1SgsPECdHJpmDkrr0uHyUYLj` configurado en .env local y produccion.
- **ACCION USUARIO PENDIENTE:** Webhook URL configurada incorrectamente como `glory/v1/stripe/kamples` pero el endpoint real es `kamples/v1/pagos/webhook`. Corregir en Stripe Dashboard.

## QK5 ✅ [AG-DSK]

**Solucion:** One Tap (login automatico) requiere cookie previa de Google. En incognito no hay cookie, por lo que One Tap no funciona. Solucion: boton explicito de Google renderizado con `google.accounts.id.renderButton()` dentro de `<div>` en `BotonGoogle.tsx`, que abre popup OAuth en cualquier contexto.
- [Google Identity]: One Tap = solo usuarios ya logueados. Para incognito/nuevo, usar `renderButton()` con popup mode.

## QK6 ✅ [AG-DSK]

**Solucion:** Root cause: desktop login llama `wp_set_auth_cookie()` (necesario para mantener sesion web). Al hacer requests desde desktop, el fetch incluye cookie + header Authorization Bearer JWT. WP `rest_cookie_check_errors` (prioridad 100) detecta cookie sin nonce valido y bloquea con 401 ANTES de que el `permission_callback` JWT se ejecute.

Fix: `AuthMiddleware::registrarFiltroRestJwt()` en `rest_authentication_errors` prioridad 90 (antes del check de cookie). Si hay header JWT valido, retorna `true` para bypass el check de cookie.
- [JWT+Cookie]: Cuando desktop envia ambos (cookie sin nonce + JWT), WP bloquea por cookie invalida. Filtro JWT a prioridad 90 resuelve.
- [AuthController]: `normalizarUsuario()` ahora incluye `generosPreferidos` en la respuesta.

## QK7 ✅ [AG-DSK]

**Solucion:** WP Cron estaba correctamente disabled, pero el crontab del VPS usaba `curl -s http://localhost/wp-cron.php` que pasa por Traefik sin Host header correcto y falla. Fix: crontab actualizado a `docker exec wordpress-mo4so4440c488g8woow4cow0 php /var/www/html/wp-cron.php` — ejecuta directamente dentro del contenedor.
- [Cron VPS]: NUNCA usar curl a localhost para WP cron en Docker+Traefik. Usar `docker exec` directo.
- 11 items en estado `extraido` se publicaron exitosamente tras el fix.

## QK8 ✅ [AG-DSK]

**Solucion:** Los artistas existian en BD pero todos tenian `prioridad=0`. La migracion v047 creo la columna pero no inserto los valores. Creada migracion v049 que aplica: DJ Smokey(100), Soudiere(98), Juicy J(96), Three 6 Mafia(94), Project Pat(92), Tyler The Creator(90), Freddie Dredd(88), Kanye West(86), Daft Punk(84). Pipeline.py ya ordena por GREATEST de prioridad de ambos artistas del sampleo.
- [Migraciones]: Verificar que el seed de datos se ejecute, no solo la estructura.

## QK9 ✅ [AG-DSK]

**Solucion:** Sistema de cookies separado por plataforma. Backend: `guardarCookies($contenido, $tipo)` e `infoCookies($tipo)` parametrizados con whitelist `['youtube', 'soundcloud']`. Python: `_resolver_cookies_youtube()` busca `cookies_youtube.txt` > `cookies.txt` (legacy fallback). Frontend: dos secciones independientes con icono YouTube/SoundCloud, cada una con su propio textarea y boton de guardar.
- [Cookies]: SoundCloud en practica usa OAuth token via env var, no yt-dlp cookies. Pero el campo esta disponible como fallback.
- [Retrocompatibilidad]: Si solo existe `cookies.txt` legacy, YouTube lo sigue usando.

## QK10 ✅ [AG-DSK]

**Solucion:** Dos problemas encontrados:
1. **Embedding dimension mismatch**: BD tenia `vector(1536)` desde v001 pero el codigo genera 128-dim (metadata local: BPM, key, tags). Migracion v048 corrige a `vector(128)`.
2. **JsonRepairer token limit**: `max_tokens=2000` insuficiente para JSONs largos. Aumentado a 4000. El input ya se trunca a 4000 chars con `mb_substr`.
- [Embeddings]: Verificar dimension del vector en BD vs codigo al crear columnas vectoriales.
- [Groq]: El modelo gpt-oss-120b necesita tokens generosos para reparar JSON — 2x del input es minimo seguro.

## QK11 ✅ [AG-DSK]

**Solucion:** Mismo root cause que QK6. El filtro JWT de AuthMiddleware en prioridad 90 resuelve los 401 persistentes de la app desktop. Desplegado en produccion con el commit de QK6.
- Los logs de produccion mostraban `JWT invalido | error=Signature verification failed` — esto era porque el filtro aun no estaba desplegado.

Failed to load resource: the server responded with a status of 401 (Unauthorized)
syncLogger.ts:108 [sync:syncWatcher] Reconciliación de descargas: 1773441640s sin sync completa, forzando 
:1420/wp-json/kamples/v1/me/sync/colecciones?_t=1773441640112:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
syncCollectionService.ts:296  [SyncCollection] Error obteniendo colecciones: 401 Lo siento, no tienes permisos para hacer eso.
obtenerColeccionesDelServidor @ syncCollectionService.ts:296
(index):1 [Intervention] Images loaded lazily and replaced with placeholders. Load events are deferred. See https://go.microsoft.com/fwlink/?linkid=2048113
avatar_1771208514.jpg:1   Failed to load resource: the server responded with a status of 404 (Not Found)
:1420/wp-json/kamples/v1/me/sync/colecciones?_t=1773441640471:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
syncCollectionService.ts:296  [SyncCollection] Error obteniendo colecciones: 401 Lo siento, no tienes permisos para hacer eso.
obtenerColeccionesDelServidor @ syncCollectionService.ts:296
:1420/wp-json/kamples/v1/descargas/limites:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/reproducciones/ids:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/me:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/descargas/limites:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/reproducciones/ids:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/me:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/notificaciones?page=1:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)
:1420/wp-json/kamples/v1/mensajes/conversaciones:1   Failed to load resource: the server responded with a status of 401 (Unauthorized)

## QK12 

Crea un md detallado de todo lo que hay que hacer para tener la aplicacion de android lista con tauri, y adelanta todo lo que puedas

## QK13 ✅ [AG-DSK]

El buscador el nav arriba funciona muy bien, no dar dañar como funciona ahora solo, agregar un agregado, y es que, al escribir, que salga justo de bajo un cuadro con resultados en forma lista que incluya canciones, samples, sampleos y perfiles de usuario, con su foto de perfil, imagenes de portada, titulo, imagen cuadrada con bordes, minimalista bonito, usa las variables, tiene que mostrarse automaticamente al escribir, actualizarse en tiempo real y estar extremadamente optimizado. 

**Solucion:** Sistema completo de busqueda rapida full-stack:
- **Backend:** `BusquedaRapidaController.php` con endpoint `GET /busqueda/rapida?q=...`. Busca en 4 dominios: canciones (fulltext via `to_tsvector`), samples (ILIKE titulo, activos), sampleos/relaciones (ILIKE en cancion fuente/destino + artistas), usuarios (ILIKE username/nombre_visible, activos). Todo con LIMIT 5 por tipo.
- **Frontend service:** `apiBusqueda.ts` con tipos tipados para cada resultado.
- **Hook busqueda:** `useBusquedaRapida.ts` con debounce 250ms, AbortController para cancelar requests en vuelo, minimo 2 chars.
- **Componente:** `ResultadosBusquedaRapida.tsx` con secciones agrupadas (Canciones, Samples, Sampleos, Usuarios), iconos, imagenes cuadradas, verificado badge, seguidor count. Logica en `useResultadosBusquedaRapida.ts` (SRP).
- **CSS:** `busquedaRapida.css` usando variables del design system. Dropdown posicionado debajo del input con shadow y scroll.
- **apiCliente.ts:** Agregado soporte `signal: AbortSignal` en `OpcionesPeticion` — mejora global para cualquier servicio.
- **Integracion:** Wired en TopBar desktop + modal movil. No afecta el filtrado existente de samples.
- [Busqueda]: Debounce 250ms + AbortController = requests no se acumulan. ILIKE con % wrapping — puede beneficiarse de pg_trgm index en futuro si el dataset crece.

## QK14

en https://kamples.com/admin/panel/ si bien aparecen las estadisticas, abajo debería haber una lista resumida de historial, compacta, para revisar, que incluya lo que esta en cola y pendiente.

## QK15 ✅ [AG-DSK]

**Solucion:** Los errores son los mismos que QK6/QK11. El filtro JWT (AuthMiddleware prioridad 90) ya esta desplegado en produccion. Al ejecutar en modo dev, el proxy de Vite redirige a `kamples.com` que ahora tiene el fix. Reiniciar el dev server y probar de nuevo — los 401 deben desaparecer.
- Si persisten: (1) Verificar que `auth.json` del desktop tiene un JWT valido (no expirado). (2) Borrar cookies del navegador en localhost:1420 para eliminar cookies WP viejas. (3) Hacer logout y login de nuevo para obtener JWT fresco.

## QK16

Al intentar iniciar sesion dice Token de autenticación inválido o expirado, el boton para iniciar con google no aparece (estoy probando con la aplicacion)

## QK17

Cargando samples… tarda demasiado con apenas 100 samples, no esta optimizado, algoritmo parece que no tiene cache. Revision profunda de optimizaciones, carga diferida o progresiva no bloqueante, que no se rehanalice el algoritmo con cada recarga, sino cada siempre tiempo que no se actualice por ejemplo, 30 minutos sin usar el algoritmo pesado, el algorimo sencillo 5 minuto, recuerdo que planifique un algoritmo sencillo para que sea rapido y otro mas lento, pero no recuerdo, haz un md detallado de todas las posible optimizaciones y de como funciona actualmente, aplica las mejoras y yo hago la revision al md

## QK18

La pagina de musica, es una lista, pero creo que lo mejor es hacerla mejor version spotify

secciones y listas horizontales, foto de portada mas grande, y letras abajo, secciones ordenada por generos, quitar las tabs, y que las tabs ahora sean secciones, no repetir canciones entre sesiones, una seccion de albumes y otra de artistas, si el scraper no ordena por album o artista, investiga la forma de arreglarlo y de organizar la informacion para este proposito

## QK19 

El cuado de busqueda necesito que tenguna un ancho de 500px, el que hiciste en qk13, y centrado verticalmente. el modal tarda en salir, es muy lento












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