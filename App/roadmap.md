# Kamples — Roadmap

> **Descripcion:** Plataforma de samples de musica — descubrimiento, colecciones, DAW web, notificaciones y app movil.
> **Stack:** Glory Framework (WordPress + React Islands + TypeScript), Tauri (desktop), PostgreSQL, Redis, Bun (WebSocket)
> **URL produccion:** https://kamples.com
> **Servidor:** 66.94.100.241 — SSH: `ssh root@66.94.100.241`
> **Deploy:** Coolify via `.agent/coolify-manager-rs`
> **Coolify IDs:** ver `.agent/coolify-manager-rs` para UUIDs de servicios
> **Repositorio:** `1ndoryu/glorytemplate`, rama `main-kamples`

## Herramientas del agente
- Code Sentinel: `.agent/code-sentinel`
- VarSense: `.agent/varsense`
- Coolify Manager: `.agent/coolify-manager-rs`

## Documentacion legacy
Los siguientes archivos son documentacion pre-v4.0. No modificar ni mover sin instruccion del usuario.
Ubicacion: `App/docs (ignorar)/`
- `algoritmo.md` -- Algoritmo de descubrimiento (6 senales, embeddings 128d)
- `moderacion.md` -- Sistema de moderacion IA (4 capas)
- `monetizacion.md` -- Modelo freemium, Stripe, revenue share
- `plan-samples-metadata.md` -- Sample Discovery and Metadata Engine
- `plan-seo.md` -- SEO dinamico (RuntimeSeoData, JSON-LD, sitemaps)
- `plan-notificaciones.md` -- Sistema notificaciones (5 canales, push, WebSocket)
- `plan-websocket.md` -- WebSocket Bun standalone (Traefik SSL)
- `plan-desktop-distribucion.md` -- Distribucion desktop (exe/MSI/NSIS, auto-updates)
- `plan-daw-channelrack-mixer.md` -- Channel Rack + Mixer (20 pistas)
- `plan-piano-roll.md` -- Piano Roll (patterns, velocidad, BPM)
- `roadmap/completado.md` -- Historico QK1-QK105, QL1-QL95
- `roadmap/lecciones.md` -- Gotchas historicos por dominio
- `roadmap/arquitectura.md` -- Vision y stack original

## Historial compactado
- **QK1-QK105:** Sprint QK completo.
- **QL1-QL136 + QL136-CAP:** Sprint QL completo.
- **183A-9, 173A-7, 183A-10:** Completadas 2026-03-18. Detalle en `App/Agente/completados/tareas-2026-03-18.md`.
- Detalle anterior en `App/Agente/completados/tareas-2026-03-17.md` y `App/docs (ignorar)/roadmap/completado.md`.

## Tareas pendientes


## 183A-10

Agregar documentaciones detalladas nuevas sin basarte en los md viejos del algoritmo, funcionalidad de colecciones, canciones y sampleos, y el sincronizador. 


## 183A-11

No creaste ninguna documentacion nueva sobre las funcionalidades que tocaste o trataste las tareas, ajusta .github\instructions\test.instructions.md para que sea obligatorio crear en caso de que no o actualizar la documentacion despues de completar una tarea, y crea documentacion de todas las funcionalidades de las tareas de ayer y hoy

tambien agrega una regla de que si una tarea es complicada o se repite mucho debe si o si debe tener un plan, 

que en el md todas tareas deben especificar si necesita una regla para glory sentinel o no

## 183A-12

la aplicacion no da error pero coolify dice esto, no se porque, corregir, presiento que no se estan haciendo los commit,ajusta coolify rs y verifica qu si se hacen los commit

PS C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate> cd "c:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\.agent\coolify-manager-rs" ; .\target\release\coolify-manager.exe deploy --name kamples --update 
2026-03-18T04:57:52.698440Z  INFO Actualizando tema Glory (branch: main-kamples) en contenedor c2259f7435d6
2026-03-18T04:58:02.957564Z  INFO Env update: existe
creado
2026-03-18T04:58:03.859596Z  INFO Compilando React (glorytemplate)...
2026-03-18T04:58:21.873260Z  INFO React compilado exitosamente.
2026-03-18T04:58:24.148949Z  INFO Migraciones disponibles: 63
2026-03-18T04:58:54.360586Z  INFO Runner de migraciones completado
2026-03-18T04:59:00.802274Z  INFO PHP config aplicado: upload=64M, post=70M, memory=1G
2026-03-18T04:59:01.356388Z  INFO MU-plugin SMTP desplegado en /var/www/html/wp-content/mu-plugins/00-smtp-config.php
2026-03-18T04:59:01.939120Z  INFO DISABLE_WP_CRON ya configurado en wp-config.php
2026-03-18T04:59:04.488643Z  WARN Error copiando server.ts al WS: Error response from daemon: unlinkat /app/server.ts: device or resource busy

2026-03-18T04:59:06.129742Z  INFO OPcache limpiado (opcache_reset via HTTP).
2026-03-18T04:59:06.132838Z  INFO Tema Glory actualizado exitosamente
2026-03-18T04:59:12.836102Z ERROR Validacion: Health check fallo para 'kamples': HTTP devolvio estado 500 | Chequeo interno de aplicacion fallo
Error: Validacion: Health check fallo para 'kamples': HTTP devolvio estado 500 | Chequeo interno de aplicacion fallo 

## 183A-13

Sigue la inconsistencia de contenteo entre la lista de colecciones y el conteo interno de la coleccion

## 183A-14

Estoy en una colección y de repente pasa esto "Esta colección aún no tiene samples." desaparecen los samples y despues vuelven a aparecer.

## 183A-15

Agregar un boton de like al lado del boton de 3 puntos en las lista de colecciones.

## 183A-16

La miga de pan de dentro de las colecciones, tarda demasiado en aparecer, esto parece que necesita optmización. 

## 18A-17

La pagina de inicio del la apk debe deber el modal auth abierto sin que se pueda cerrar y que no cargue de fondo el inicio.

## 18A-18

Cambiar los botones de inicio por un buscador que rediriga a https://kamples.com/descubrir/ haciendo una busqueda. 