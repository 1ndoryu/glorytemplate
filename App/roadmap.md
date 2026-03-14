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


## Tareas nuevas a organizar y hacer

> 44+ tareas QK completadas compactadas en `docs/roadmap/completado.md` (seccion "Sprint QK").

## QK12

Crea un md detallado de todo lo que hay que hacer para tener la aplicacion de android lista con tauri, y adelanta todo lo que puedas.

## QK18

La pagina de musica, es una lista, pero creo que lo mejor es hacerla mejor version spotify

secciones y listas horizontales, foto de portada mas grande, y letras abajo, secciones ordenada por generos, quitar las tabs, y que las tabs ahora sean secciones, no repetir canciones entre sesiones, una seccion de albumes y otra de artistas, si el scraper no ordena por album o artista, investiga la forma de arreglarlo y de organizar la informacion para este proposito

## QK22

https://kamples.com/musica/?buscar=dj+smokey y respeecto al rediseño, de la pagina, olvide decir que el diseño actual de lista, se puede dejar para caundo se haga una busqueda no muestra las sesiones sino la lista larga.

## QK37

Por fa haz la tarea del md para evaluar todo lo pendiente para hacer la aplicacion android (webwiew obviamente), tengo android studio instalado

## QK45

Sigue dando error

wp-json/kamples/v1/samples/175/generar-siguiente:1  Failed to load resource: the server responded with a status of 400 ()

## QK46

Vamos a deshacernos de la tab de resumen en el panel admin, y lo de adminKpisGrid lo dejas arriba en la tab de usuario, un poco mas compacto.

Quita todos los adminSeccionTitulo, son innecesarios

En la tab de moderacion, cuando una publicacion tiene imagen, no deberia estar oculta por defecto

## QK47

Auditoria a los botones de banear, verificar que realmente funcionen como se espera en la tab de moderacion.

## QK48

verificar que todas las publicaciones aprobadas en moderacion, se borren del historial de moderacion a los 7 dias.

## QK49

En la tab de cola ia realmente falta ver una tabla con toda la cola y los datos.

## QK50

Antes habia dicho que en la tab de duplicados, en vez de ver un reproductor del navegador, hacia falta ver la onda para reproducir!!! asi como se ve la onda en los samples.

pequeno ajuste visual, los select como selectorMenuContenedor no deben tener saltos de linea

## QK51

que los grid de la tab de proceso tengan mas altura y este disponible mas info en los logs,

## QK52

En cola de extraccion aparecen las paginas pero estan todas vacias

1 / 28 (694 total)

y cada columna deberia tener que a dar click se ordene por orden alfabetico y viceversa si de da click y un boton de filtro para filtrar por cada columna el valor que se quiera, sea como un select con los estilos del menu contextual donde se desactiva o activa ciertos valores

## QK53

descubri algo super interesante, mira, tengo 2 samples exactamente iguales, esta es la informacion de los dos

¿que es lo que tienen de distinto? aclara esa duda, creo que es la cancion de destino, o sea, una cancion puede samplear la misma parte de una rola, y entonces el sistema hace doble recorte publicando el mismo sample, obviamente este es un problema, en la arquitectura del sistema no previo este problema, de un mismo trozo de una musica puede ser sampleado varias veces y por lo tanto, se podía cometer el error de que subiría varias veces el mismo trozo, esta es mi hipotesis, puedo estar equivocada, hay que investigarlo mas a fondo, entonces, hacer una solucion arquitectonica con cuidado

y es que si ya esta recorda la parte de una cancion, entonces, ¿para que volverla a recortar solo porque tiene una diferente relacion en vez de relacionar el mismo recorte con las relaciones? Tambien tiene que haber alguna forma cuidadosa de resolverlo, y solo funcioanr si los recortes pues, son similares, 5 segundos de diferencia ya sea de rango o duracion ya se cuenta como diferente, y es valido pero si dos recortes son en tiempos similares entonces ya deberia unifcarse el recorte, no voy a borrar los duplicados, voy a dejar todo como esta, habra que diseñar un mecanismo que resuelva esto automaticamente no solo para los nuevos recortes sino para los que tienen el problema, toma esta tarea con cuidado, planificala bien para no dañar el sistema actual

1

ID
186
Titulo
Late Night Hype Vocal 71bpm C
Slug
late-night-hype-vocal-71bpm-c-8ps9Doy
ID Corto
8ps9Doy
Tipo
oneshot
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
0.79 MB
Permitir Descarga
Si
Licencia Libre
Si
Mostrar Comunidad
No
Verificado
No
Nombre Original
Vocals-Hiphop-C-71bpm-late-night-hype-vocal-kamples-8ps9Doy.mp3
Origen y Sampleo
Es Recorte
Si
Cancion Origen ID
3031
Cancion Origen
Mafia Niggaz
Enlace Fuente
/cancion/three-6-mafia-mafia-niggaz/
Relacion Sampleo ID
3047
Extraccion
Cancion Fuente
Three 6 Mafia — Mafia Niggaz
Album Fuente
When the Smoke Clears: Sixty 6, Sixty 1
Cancion Destino
Jeremih — Don't Tell 'Em
Album Destino
Late Nights: The Album
Tipo Elemento
vocals_lyrics
Votos Total
2
Sample en Kamples
/sample/late-night-hype-vocal-71bpm-c-8ps9Doy/
Origen
—
Metodo Descarga
soundcloud
YouTube
FT9ScW8tk9k
URL Descarga
https://soundcloud.com/three-6-mafia/gangsta-ni-z
Titulo en Fuente
Three 6 Mafia — Gangsta Niggaz
Lado
fuente
Estado Cola
completado
Rango Extraido
0:00 a 0:21
Timing Inicio
0:02
BPM Detectado
140
Duracion Compas
1.72s
Recorte por Compas
Si
Duracion Extraida
20.616s
Formato
mp3
Tamano

2

ID
189
Titulo
Dark Hip Hop Vocals 71bpm C
Slug
dark-hip-hop-vocals-71bpm-c-uN5WbQx
ID Corto
uN5WbQx
Tipo
oneshot
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
0.79 MB
Permitir Descarga
Si
Licencia Libre
Si
Mostrar Comunidad
No
Verificado
No
Nombre Original
Drums-Hiphop-C-71bpm-dark-hip-hop-vocals-kamples-uN5WbQx.mp3
Origen y Sampleo
Es Recorte
Si
Cancion Origen ID
3031
Cancion Origen
Mafia Niggaz
Enlace Fuente
/cancion/three-6-mafia-mafia-niggaz/
Relacion Sampleo ID
3045
Extraccion
Cancion Fuente
Three 6 Mafia — Mafia Niggaz
Album Fuente
When the Smoke Clears: Sixty 6, Sixty 1
Cancion Destino
Freddie Gibbs — Shangri La
Album Destino
Alfredo 2
Tipo Elemento
vocals_lyrics
Votos Total
1
Sample en Kamples
/sample/dark-hip-hop-vocals-71bpm-c-uN5WbQx/
Origen
—
Metodo Descarga
soundcloud
YouTube
FT9ScW8tk9k
URL Descarga
https://soundcloud.com/three-6-mafia/gangsta-ni-z
Titulo en Fuente
Three 6 Mafia — Gangsta Niggaz
Lado
fuente
Estado Cola
completado
Rango Extraido
0:00 a 0:21
Timing Inicio
0:02
BPM Detectado
140
Duracion Compas
1.72s
Recorte por Compas
Si
Duracion Extraida
20.616s
Formato
mp3
Tamano

# QK54 

Antes habiamos hecho un componente tooltip global, aparece en las acciones de las publicaciones, pero no es global, tiene que ser global y funcioanr en todas partes. 

# QK55 

Las optimizaciones del feed son muy agresivas, si bien ya no veo "cargando samples", literalmente el feed lleva horas congelados ni mostrar ni siquiera los samples nuevos, esto no era lo que esperaba, minimo cada 5 minutos tiene que actualizarse de fondo (si es que el usuario esta conctado o hizo alguna interacciom) pero no pasar litearlmente 1 hora varias viendo lo mismo ni siquiera agregando samples nuevos recien publicados que sean de interes

# QK56

Ante habia dicho que al recargar el ordenamiento de inteligente o reciente se guardara y no se perdiera al recargar, igual si tenia tal tab abierta, esa quedara en la url para poder compartir, bueno no funciona

# QK57

veo que al actualizar el proyecto dice PHP config aplicado: upload=64M, post=70M, memory=256M , aumentar la memoria a 1gb 

## QK58

Los mensajes si actualizan en tiempo real en la notificacion pero no en la ventana de chat :/, verificar que el sistema use websocket.

## QK59

No lo haiba comentado, pero lo de extender recorte no da error pero tampoco veo que haga algo relamente, su spone que publique extienda el audio pero no veo que haga eso! Ya disculpa, si funciona, pero no se actualiza el preview, el preview tambien tiene que subir el tiempo que se indique

tambien, agregar un boton de restaurar al tiempo original, asegurarse de que el boton de extender solo sea visible para admin y audios que sean recortes, tambien asegurarse que los audios que se descargaron se esten guardando

## Qk60 

Cuando se responda un mensaje de solicitudes, que se mueva a principal

# QK61

no entiendo porque dices    /* QK45: Alinear condicion con backend — requiere youtubeId o rutaAudioExtraido para funcionar */ no todos los audios tienen un youtube id porque se pueden scrapear cosas que tienen un id de spotify o ningun id, aun asi se pueden hacer un recorte desde cualquier fuente, lo importante es que exista el audio que se descargo y este guardado, pedi explicitamente antes que los audios descarga para los recortes se tienen que guardar ,existir y estar relacionados con eel recorte, ea es la unica condicion para extender un audio o generar uno nuevo apartir de los siguientes segundos o los anteriores, pues logicamente es todo lo que se necesitas, piensa bien 


# QK62

Respecto a lo que dijiste de "n PublicadorExtraccion::publicarItem(): Antes de insertar un nuevo sample, buscar si ya existe uno con el mismo youtube_id + timing similar (±5s). Si existe, reutilizar el sample existente y solo vincularlo a la nueva relación." Espero que esto no remplace la relacion anterior sino que la sume, eso espero

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