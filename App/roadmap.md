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


## 183A-18

Cambiar los botones de inicio por un buscador que rediriga a https://kamples.com/descubrir/ haciendo una busqueda. 

## 183A-19

La apk en android studio hice el rebuild y no aparece con el logo de kamples la aplicacion

el boton de inicio sesion con google no aparece en el modal del login y las notificaciones del sistema no aparecen, de hecho en la info dice, "this app has not posted any notification", creo que necesita sdocumentarte en internet sobr eesto. 

## 183A-20

Es raro que haya creado un usuario con el nombre test, luego intenramente en las configuraciones de perfil cambie el nombre a wan, pero, sigo inicio sesion a ese usuario con el nombre test, esta mal obviamente, debo iniciar sesion con el nombre que usuario que cambien.

## 183A-21
ahora el contador interno de las colecciones literalmente se queda en cero, estas trabajando en esto sin verificar
<span class="coleccionStats">0 samples</span>

agrega algo estricto en .github\instructions\test.instructions.md para que dejes de cometer este error de marcar tareas como completadas que no verificas cuando incluso puedes comprobar localmente sin recurrir al servidor. 

## 183A-22

