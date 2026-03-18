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
- **183A-22+22-A+22-B:** Botones like y guardar separados en tarjeta de colección. 2026-03-18.
- **183A-23:** Inconsistencia de conteo entre lista y detalle (total_items sin filtro estado). 2026-03-18.
- Detalle anterior en `App/Agente/completados/tareas-2026-03-17.md` y `App/docs (ignorar)/roadmap/completado.md`.

## Tareas pendientes


## 183A-18

Cambiar los botones de inicio por un buscador que rediriga a https://kamples.com/descubrir/ haciendo una busqueda. 

## 183A-19

La apk en android studio hice el rebuild y no aparece con el logo de kamples la aplicacion

el boton de inicio sesion con google no aparece en el modal del login y las notificaciones del sistema no aparecen, de hecho en la info dice, "this app has not posted any notification", creo que necesita sdocumentarte en internet sobr eesto. 


## 183A-24

https://kamples.com/descargas/ los contadores no dicen el numero completo a veces si pero luego cambia a 30 siempre.

## 183A-25

El cache de feed de sampled me parece muy agresivo, pero necesito saber como funciona, hacer una documentacion sobre el cache del feed de samples.  Veo que los samples cargan imagenes de portada de colors (temporales) cuando ya tienen una imagen en su coleccion, no se si es por el cache o porque falla algo, al menos en recientes las imagenes si aparecen bien. 

## 183A-26

El menu contextual se sale de la pantalla a veces, ese el que parece cuando das click derecho a un sample o botones de 3 puntos, corregir.

## 183A-27

no estoy segura que si la solucion que aplicaste sobre 183A-20 es real o es un parche, o sea el cambio de usuario detecta nombres ya usads? arreglaste que si cambio el nombre tambien se cambie en wp?? 


## 183A-28

Deja algo en .github\instructions\test.instructions.md indicando que si una tarea en el roadmap no es suficientemente clara, dejas una nota pidiendo aclaración y pasas a otra tarea meintras tanto. Tambien deja un aviso de coolify-manager-rs se puede mejorar para cualquier escenario necesario. 

## 183A-29

Vi que implementaste una tabla de like paras las colecciones, bien, puedes ahora hacer un plan para mejorar el algoritmo de las colecciones, para que se ordenen por relevancia al usuario, algo optimizado y minimalista. 

## 183A-30 

ya entiendo sobre la tarea de 183A-25, esto se implemento anteriormente lo de cache en la primera pagina, no esta mal pero, ese cache debería actualizarse despues de que el usuario lo ve y en tiempo real, o sea, es para que tenga un respuesta rapida pero despues se actualice con los datos reales, no para que el usuario vea datos desactualizados. 

+----------------------------------------------------+----------+
| Componente                                         | Tiempo   |
+----------------------------------------------------+----------+
| PerfilUsuario::construir (sin cache)               |    32.9ms |
| Conteo samples activos (SQL COUNT)                 |     9.3ms |
| Verificacion pgvector                              |     9.2ms |
| SQL gen: Comportamiento (0.27)                     |     0.1ms |
| SQL gen: Contexto (0.15)                           |     0.0ms |
| SQL gen: Tendencias (0.12)                         |     0.0ms |
| SQL gen: Grafo Social (0.1)                        |     0.0ms |
| SQL gen: Similitud pgvector (0.28)                 |     0.8ms |
| >> FEED pag1 sin cache fresco <<                   |     3.6ms |
| >> FEED pag2 sin cache <<                          |   199.8ms |
| >> FEED pag3 sin cache <<                          |   266.1ms |
| Feed pag3 cache hit                                |     2.9ms |
+----------------------------------------------------+----------+
| PROMEDIO feed sin cache (3 pags)                   |   156.5ms |
+----------------------------------------------------+----------+

=== RESUMEN (para documentacion) ===
Fecha: 2026-03-18 07:07:24 | Config: df224c3e
Samples: 984 | pgvector: SI | Pipeline: NO
Feed pag1 (sin cache fresco): 4ms | pag2: 200ms | pag3: 266ms | promedio: 157ms | cache: 3ms
Perfil: 33ms | Conteo: 9ms
=== FIN ===

Lo que necesito un plan agresivo y revision del algorito (ya habia un plan en los docs viejo, revisa), planifica mas optimizaciones agresivas sin que el algoritmo pierda calidad, la meta reducir el tiempo a 50ms promedio sin cache. 
