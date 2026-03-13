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


## QQ109

✅ [AG-FIX] Scraper 403 en WhoSampled. 4 fixes aplicados:
1. **403 en RETRY_HTTP_CODES** + RETRY_TIMES=5 (antes no reintentaba 403)
2. **Warm-up global** en CurlCffiDownloaderMiddleware (homepage request para cookies de sesion antes de cualquier spider)
3. **Header Referer** automatico en cada request (simula navegacion real)
4. **Bug BandwidthTracker** corregido: `process_response` no recibia parametro `spider` causando NameError
- **Nota:** Si los 403 persisten post-fix, verificar que las credenciales de DataImpulse proxy estan vigentes. WhoSampled usa Cloudflare y curl_cffi no ejecuta JS challenges — si Cloudflare activa JS challenge, se necesitaria Playwright/Selenium.

---
## QQ111 ✅ [AG-SCR]

Groq false positive con variaciones de nombre de artista ("Honeydrippers" vs "Honey Drippers"). Prompt del validador mejorado: ahora tolera diferencias menores de ortografia/espaciado en nombres de artista. Archivo: groq_validator.py.

## QQ112 ✅ [AG-SCR]

Auto-publicacion no funcionaba por 3 problemas encadenados:
1. **Ruta no registrada en produccion:** `/dev/extraccion/publicar-auto` estaba dentro del guard `WP_DEBUG` que la ocultaba. Movida fuera del guard (usa secret, no sesion WP).
2. **Secret mismatch:** Scraper .env tenia `kamples-cron-prod-2026-abc` pero container env tenia `kamples-prod-cron-2026`. Sincronizado.
3. **KAMPLES_SISTEMA_USUARIO_ID=7** en container env — user 7 no existe en produccion. Cambiado a 1 en docker-compose de Coolify.
4. **URL interna:** pipeline.py ahora usa `KAMPLES_INTERNAL_URL=http://localhost` para evitar SSL error al llamarse a si mismo.
- Verificado: 2 samples publicados exitosamente (IDs 9 y 10).

## QQ113 ✅ [AG-SCR]

Proxy revertido para descargas de YouTube. El pipeline ya NO pasa proxy a `_descargar_youtube()` ni `_descargar_youtube_search()`. YouTube seguira fallando desde IP del VPS (bot detection), pero SoundCloud es la fuente primaria y funciona bien con GO token.


## QQ114 ✅ [AG-SCR]

Throttle progresivo para paginacion infinita. Hook reutilizable `usePaginacionProgresiva`: primeras 3 paginas sin delay, paginas 4-10 con delay creciente (800ms * 1.4^nivel), paginas 11+ requieren boton manual "Cargar mas". Integrado en useFeedSamples (samples), useFeedCanciones (canciones), useComunidadIsland (publicaciones). CSS para boton manual en 3 archivos. Protege contra scroll pasivo que cargaria todo el catalogo.

## QQ115 ✅ [AG-SCR]

Groq validator reescrito con arquitectura de 2 capas contra falsos positivos:
1. **Pre-screening textual:** SequenceMatcher + normalizacion Unicode (sin acentos, lowercase, sin puntuacion). Score combinado (60% titulo + 40% artista). >= 0.80 = auto-acepta, <= 0.25 = auto-rechaza. Casos como "Honeydrippers" vs "Honey Drippers" se resuelven sin LLM.
2. **LLM zona gris:** Modelo upgradeado de `llama-3.1-8b-instant` a `llama-3.3-70b-versatile` (mejor razonamiento). Prompt few-shot con 5 ejemplos concretos de edge cases musicales. Timeout 12s (antes 10s).
- Impacto: elimina falsos positivos por variaciones de nombre, reduce llamadas LLM innecesarias.

## QQ116 ✅ [AG-SCR]

Revision profunda del sistema de duplicados. 3 bugs corregidos:
1. **Audio previews no sonaban:** `normalizarRutasPreview()` convierte rutas filesystem a URLs HTTP. Fallback a `ruta_original` si no hay preview.
2. **Samples duplicados sin preview:** Query incluye `ruta_original` de ambos samples como fallback.
3. **Aprobar no publicaba:** `aprobar()` ahora pone sample en `procesando`, schedule `ReprocesadorPostDuplicado` via WP cron para completar pipeline (pasos 3-9) con `omitirDedup=true`. Nuevo parametro `$omitirDedup` en `PipelineAudio::procesar()` evita loop infinito de dedup.

## QQ117 ✅ [AG-SCR]

Inspector de samples ahora muestra metadata de extraccion completa. Backend: subselect correlacionado en `NormalizadorSample` trae datos de `cola_extraccion_samples` (metadata JSONB + campos directos). Frontend: nueva seccion "Extraccion" en `SeccionExtraccionInspector.tsx` (componente extraido del modal). Campos visibles: origen, metodo descarga, YouTube ID, Spotify ID, URL fuente, titulo/artista fuente, lado, timing inicio, BPM detectado, duracion compas, compas inicio/fin, ruta audio extraido.


## QQ118 ✅ [AG-SCR]

Boton autocarga rediseñado: de count-based a speed-based. Ahora detecta velocidad promedio entre cargas recientes (ventana de 3 cargas, umbral 2s). Si scroll es rapido: pausa y muestra boton. Despues de 6s sin accion: boton se oculta automaticamente y reanuda infinite scroll. Si vuelve la velocidad alta: reaparece. API publica sin cambios (compatible con useFeedSamples, useFeedCanciones, useComunidadIsland).

## QQ119 ✅ [AG-SCR]

Auditoria profunda del proceso de extraccion audio creada en `App/docs/auditoria-extraccion-audio.md`. Cubre: manejo de fallos por fuente, backoff exponencial recomendado (2→4→4 dias), priorizacion de no-intentados sobre retried, marcado automatico `revision_humana`, campo `fuentes_descartadas` en metadata, UI cookies SoundCloud. Comentario anti-proxy agregado en `audio_download.py::_descargar_youtube()`. Recomendaciones: columna `proximo_intento_at`, aumentar max_intentos a 5, priorizar items sin intentos en ORDER BY.

## QQ120 ✅ [AG-SCR]

Auditoria de seguridad de audio completada en `App/docs/auditoria-seguridad-audio.md`. Hallazgo critico corregido: usuarios baneados podian streamear con tokens HMAC aun validos — ahora `DescargasStreamController::streamDescarga()` verifica `AuthMiddleware::verificarCuentaActiva()`. Sistema fundamentalmente seguro: WAV protegido por HMAC-SHA256, acceso por plan, limites diarios/mensuales. Pendientes para escalar: rate limiting streaming, UUIDs en URLs preview, audit logging.

## QQ121 ✅ [AG-SCR]

Implementadas todas las recomendaciones de auditoria-extraccion-audio.md: (1) Backoff exponencial — nueva columna `proximo_intento_at` (migracion v045), delay = min(2^intentos, 4) dias entre reintentos. (2) Prioridad items sin intentos — ORDER BY `CASE WHEN intentos=0 THEN 0 ELSE 1` en Python y PHP. (3) max_intentos subido de 3 a 5 (constante compartida `MAX_INTENTOS`). (4) Auto-mark `revision_humana` cuando se agotan intentos (tanto Python como PHP). (5) Campo `fuentes_descartadas` en metadata — `ResultadoDescarga.fuentes_intentadas` registra fuentes fallidas antes de la exitosa. Schema/Cols/DTO actualizados. Archivos: pipeline.py, audio_download.py, v045_cola_extraccion_backoff.sql, ColaExtraccionSamplesSchema/Cols/DTO.php, ColaExtraccionSamplesRepository.php.

## QQ122 ✅ [AG-SCR]

Investigacion YouTube download 2026 + script de test multi-metodo + endpoint admin. (1) Investigacion complementaria a `investigacion-s-youtube.md` — yt-dlp 2026.03.03 requiere Deno, issue #16212 UNPLAYABLE activo, ANDROID_VR degradado marzo 2026, TV_EMBEDDED removido de yt-dlp pero endpoint InnerTube sigue activo, IOS mejor opcion actual. (2) Script `test_youtube_download.py` con 6 metodos: ytdlp_default, ytdlp_cookies, ytdlp_clients (7 clientes individuales), innertube_direct (5 configs API), ytdlp_po_token, cobalt_api. (3) Endpoint `POST /dev/test-youtube-download` en DevController con validacion video_id (11 chars) y metodo enum. Documento consolidado en `App/docs/investigacion-youtube-descarga-2026.md`.

## QQ123 ✅ [AG-SCR]

Auditoria scraper WhoSampled (bandwidth). Veredicto: **scraper bien optimizado**, no requiere cambios urgentes. Medidas correctas: gzip/br compression, dedup multi-capa (sesion + persistente + imagenes SHA256), presupuesto hard-stop 5GB, autothrottle, re-scraping controlado (180d creciente). Mejoras opcionales identificadas: HTTP cache entre runs (-30-50% re-scrapes), retry 429 fix (-5%). Documento completo: `App/docs/auditoria-scraper-whosampled-bandwidth.md`.
 
## QQ124 ✅ [AG-SCR]

Diagnosticado y resuelto: extracciones en estado `extraido` no se publicaban porque WP pseudo-cron no se disparaba sin trafico. **Causa raiz:** WP cron depende de visitas HTTP — sin trafico, las tareas programadas (kamples_publicar_extracciones cada 5min) no se ejecutan. **Solucion:** (1) Publicados manualmente los 6 items pendientes (ahora 8 completados). (2) Configurado cron real a nivel de host: `*/5 * * * * curl -s http://localhost/wp-cron.php?doing_wp_cron` (persistente entre deploys). (3) `DISABLE_WP_CRON=true` agregado a wp-config.php (efimero en contenedor — TO-DO: agregar a coolify-manager deploy flow).(en el servidor)

## QQ125

necesito que tu pruebes y testest test_youtube_download.py, intenta todo o que esta a alcance, prueba y error, coreccion hasta ver si funciona.

## QQ125 ✅ [AG-SCR]

Tests completos de `test_youtube_download.py` ejecutados en VPS (contenedor wordpress, Python 3.13, yt-dlp 2026.03.03). Resultados: (1) **innertube_ANDROID_VR: EXITO** — 0.12s, 4 audio URLs directas, itag 251 opus 136kbps, descarga verificada. (2) **ytdlp_default: EXITO** — 6.9s, 7MB descargado, auto-selecciona mejor cliente. (3) Todos los demas clientes fallan: TV_EMBEDDED muerto, IOS HTTP 400, WEB_CREATOR requiere auth, MWEB requiere PO token, cobalt Cloudflare 403. **Conclusion:** pipeline actual ya usa la mejor estrategia disponible. InnerTube ANDROID_VR directo es ~56x mas rapido que yt-dlp para verificar formatos — potencial para fallback rapido.

## QQ126 ✅ [AG-SCR]

Reparadas 201 imagenes (198 canciones + 3 samples) con URLs externas de whosampled.com que retornaban 403 (hotlink bloqueado). Fix: descarga masiva via proxy DataImpulse → almacenamiento local en portadas/ → UPDATE en DB. Scraper mejorado: `ImageDescargaPipeline._descargar()` ahora tiene 3 reintentos con backoff exponencial, validacion de content-type, y limpieza de URL externa si descarga falla (evita guardar URLs inaccesibles). QQ129 tambien resuelto con este fix.

## QQ129 ✅ [AG-SCR]

Resuelto con QQ126 — las 3 imagenes de portada de samples con URLs de whosampled.com fueron reparadas.

## QQ127 ✅ [AG-SCR]

Implementado `disableWpCron` en coolify-manager-rs: nuevo campo `bool` en `SiteConfig`, propagado a `update_glory_theme()`, funcion `ensure_wp_cron_disabled()` inyecta `define('DISABLE_WP_CRON', true)` en wp-config.php si no existe. Configurado `"disableWpCron": true` para sitio kamples en settings.json. Binario recompilado ok.

## QQ128 ✅ [AG-SCR]

Desktop app en dev ahora apunta a kamples.com. Vite proxy configurable via `KAMPLES_API_TARGET` env var (default: kamples.com). Para volver a WP local: `set KAMPLES_API_TARGET=http://glory.local`. Actualizado: vite.config.ts (proxy target), apiDesktopAdapter.ts (DOMINIOS_PROXY + comentarios), sync.tsx (fallback origin).

## QQ129 ✅ [AG-SCR]

Resuelto con QQ126. Las 3 imagenes de portada de samples con URLs de whosampled.com reparadas.

## QQ130 ✅ [AG-EXT]

Extender recorte de audio implementado. Full-stack:
- **Backend:** `ServicioExtensionRecorte.php` (logica) + `AyudanteDescargaAudio.php` (descarga yt-dlp + FFmpeg), `ExtensionRecorteController.php` (REST admin-only)
- **Frontend:** `ModalExtenderRecorte.tsx` + `extenderRecorteStore.ts` + `useExtenderRecorte.ts` + 2 funciones en `apiSamples.ts`
- Menu contextual: "Extender recorte" aparece para admin en samples con relacion_id
- Arquitectura: re-descarga YouTube (audio original no se guarda), recorta FFmpeg, reemplaza archivos + regenera derivados
- Lecciones: [Audio original] El mp3 descargado de YouTube NO se conserva, solo el recorte. Extension requiere re-descarga via yt-dlp.

## QQ130-B ✅ [AG-EXT]

Generar sample siguiente integrado en el mismo modal de QQ130. Crea nuevo sample desde donde termina el actual, con PipelineAudio completo.

## QQ131

En el menu contextual habia dicho antes de una opcion de Corregir IA, que hacia que reanalizaba el audio con el proceso de IA para volver a generar las tags sumando extra la informacion (el feedback del usuario nuevo) para arreglar la metadata IA, pero no parece, hacer una auditoría de esto, tiene que funcionar y regenerar la metadata del samplee

## QQ132 

Veo un problema con los recortes y es que, cuando el bpm es muy rapido, el audio dura muy poco, es muy rapido debería duplicar el tiempo, y asi algun algorimto que sume segundos extras a medida que suben los bpm

## QQ133

También te podría gustar parece que solo muestra 6 samples, que muestre 26, y auditar que esto funcione bien algoritmicamente, hace tiempo que no se audita esta parte. 

## QQ134

Reducir la velocidad del proceso de recorte, mejor cada cierto tiempo minutos y varias entre 1 a 5 minutos aleat para evitar comportamiento robotico

## QQ135

no veo algo como Cookies yt-dlp para la cookies de soundcloud, va a ser dificil cambiar en el futuro, por favor, deja un feedback del env pero que se pueda cambiar en el front

## QQ130-B ✅ [AG-EXT]

Resuelto junto con QQ130. Modal incluye seccion "Generar sample siguiente".

## QQ131

Se estan generando muchos duplicados apartir de los recortes, revisar es que se estan reprocesando o es que el proceso se ejecuta 2 veces, etc, corregir y auditar. Tengo el presentimiento de que tal vez no esta diferenciando de los 2 lados del sampelo y busca lo mismo para ambos lados :(, si esto es asi habría que restaurar para que se vuelva a buscar los lados que se ignoraron (descartado acabo de ver 2 resultados distintos en un sampleo, esta bien, no es esto, per ode todas formas echar un vistazo a mis sospecha porque igual a veces pareciera duplicarse)

## QQ132 

La aplicacion de escritorio si carga y parece intentar cargar todo desde la vps pero no puedo deslogearme para cambiar de sesion y la sesion anterior siguie apareciendo. y tambien aparece apiDesktopAdapter.ts:128   GET http://localhost:1420/wp-json/kamples/v1/mensajes/conversaciones 401 (Unauthorized)

## QQ130-C

Vi que en ColaExtraccionSampleRep agregaste algo para descargar el audio de youtube. ¿porque se va a descargar de nuevo? porque no se utiliza el mp3 ya se descargo antes? Si es que por no se guarda entonces haz que se guarde.

## QQ133

En los videos de youtube de los sampleos y cancione sigue diciendo Inicia sesión para confirmar que no eres un bot
De esta forma nos ayudas a proteger nuestra comunidad. Más información ¿por que? si estoy con la misma ip del servidor y puedo entrar a youtube

## QQ134 

YA LO HABIA DICHO ANTES Y NO SE CUMPLIO; EN INSPECTOR DE SAMPLES NO APARECE NADA DE LO QUE DICE LA TAREA QQ117 

SOLO APARECE ESTO Y OTRAS COSAS QUE OMITO

Info General
ID
36
Titulo
Gritty Drum Loop With Spoken Phrase 92bpm D
Slug
gritty-drum-loop-with-spoken-phrase-92bpm-d-6VFnFdQ
ID Corto
6VFnFdQ
Tipo
loop
Premium
No
Precio
0
Liked
No
Reaccion
—
Estado
activo
Formato
mp3
Tamano
0.64 MB
Permitir Descarga
Si
Licencia Libre
Si
Mostrar Comunidad
No
Verificado
No
Nombre Original
Drums-Hiphop-D-92bpm-gritty-drum-loop-with-spoken-phrase-kamples-6VFnFdQ.mp3
Origen y Sampleo
Es Recorte
Si
Cancion Origen ID
738
Relacion Sampleo ID
758
Analisis de Audio
BPM
92
Key
D
Escala
mayor
Duracion
0:16
Audio Hash
f20d66fdb7d88202960292c1b5f3e697372c195561e4500a712cb4754068f114
Ruta Preview
https://kamples.com/wp-content/uploads/kamples/0/2026/03/6VFnFdQ_preview.mp3
Ruta Waveform
https://kamples.com/wp-content/uploads/kamples/0/2026/03/6VFnFdQ_waveform.json
Archivo Original
https://kamples.com/wp-content/uploads/kamples/0/2026/03/Drums-Hiphop-D-92bpm-gritty-drum-loop-with-spoken-phrase-kamples-6VFnFdQ.mp3
Audio Optimizado
https://kamples.com/wp-content/uploads/kamples/0/2026/03/6VFnFdQ_optimizado.mp3
Imagen URL
https://kamples.com/wp-content/uploads/kamples/portadas/e4ae92ee036c7dfe79bd08018ebe572c8468a2dd.jpg
Tags
drums
extraccion
paul kantner
kendrick lamar
Metadata IA
Nombre Base
gritty drum loop with spoken phrase
Generos
hip hop, trap
Instrumentos
drums, vocals
Emocion
energetic,confident
Artista Vibes
Kendrick Lamar, Dr. Dre, J Dilla, Madlib, Flying Lotus
Tags IA
drum loop, hip hop, spoken sample, gritty, sampled
Tags IA (ES)
bucle de batería, hip hop, muestra hablada, áspero, muestreado
BPM Confianza
0.86
Key Confianza
0.81
Carpeta Primaria
General
Carpeta Secundaria
General
Descripcion IA: Este bucle de 16,8 segundos presenta un patrón de batería crudo con una breve línea hablada, "Thanks for watching." Su textura lo‑fi y vibra hip‑hop lo hacen ideal para producciones trap o boom‑bap, añadiendo carácter y toque vocal.
Descripcion Corta: Un áspero bucle de batería de 16 segundos con una breve frase hablada, perfecto para beats de hip‑hop.
Estadisticas
Descargas
0
Likes
0
Reproducciones
5
Comentarios
0
Flags de Estado
Es Mio
Si
Ya Coleccionado
Si
En Coleccion
No
Ya Comentado
No
Ya Comprado
No

## QQ134

Las colecciones no pueden cambiarse a publicas 

---

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