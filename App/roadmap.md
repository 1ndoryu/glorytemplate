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
- **183A-20:** Login con nombre actualizado (fallback por PG username). 2026-03-18.
- Detalle anterior en `App/Agente/completados/tareas-2026-03-17.md` y `App/docs (ignorar)/roadmap/completado.md`.

## Tareas pendientes


## 183A-18

Cambiar los botones de inicio por un buscador que rediriga a https://kamples.com/descubrir/ haciendo una busqueda. 

## 183A-19

La apk en android studio hice el rebuild y no aparece con el logo de kamples la aplicacion

el boton de inicio sesion con google no aparece en el modal del login y las notificaciones del sistema no aparecen, de hecho en la info dice, "this app has not posted any notification", creo que necesita sdocumentarte en internet sobr eesto. 

## 183A-23

La incosistencia de conteo sigue entre afuera en la lista de coleccion y adentro de la colección, no en todas las colecicones pasa. 

## 183A-24

https://kamples.com/descargas/ los contadores no dicen el numero completo a veces si pero luego cambia a 30 siempre.

## 183A-25

El cache de feed de sampled me parece muy agresivo, pero necesito saber como funciona, hacer una documentacion sobre el cache del feed de samples.  Veo que los samples cargan imagenes de portada de colors (temporales) cuando ya tienen una imagen en su coleccion, no se si es por el cache o porque falla algo, al menos en recientes las imagenes si aparecen bien. 

## 183A-26

El menu contextual se sale de la pantalla a veces, ese el que parece cuando das click derecho a un sample o botones de 3 puntos, corregir.

## 183A-27

no estoy segura que si la solucion que aplicaste sobre 183A-20 es real o es un parche, o sea el cambio de usuario detecta nombres ya usads? arreglaste que si cambio el nombre tambien se cambie en wp?? 
