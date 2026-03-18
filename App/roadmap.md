# Kamples -- Roadmap

> **Stack:** Glory Framework (WordPress + React Islands + TypeScript), Tauri (desktop), PostgreSQL, Redis, Bun (WebSocket)
> **Deploy:** Coolify via `.agent/coolify-manager-rs`
> **Repositorio:** rama `main-kamples`

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

## 173A-6

Intenta bajar la primera pagina a 50 ms, no se, alguna tecnica o algo que haga que la primera carga sea ligera y despues de fondo cargue el resto, hay un md sobre esto, se necesitan mas optimizaciones para poder escalar a 1.000.000 samples 

PS C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate> ssh root@66.94.100.241 "bash /tmp/run-benchmark.sh 1 30"
Ejecutando benchmark: userId=1 perPage=30
Timeout: 120s

==========================================================
  BENCHMARK ALGORITMO — KAMPLES (ejecucion unica)
==========================================================
Fecha:                2026-03-18 01:02:52
Usuario ID:           1
Samples por pagina:   30
Total samples activos:984
pgvector activo:      SI
Pipeline candidatos:  NO (<5000)
Vista mat. trending:  SI
Config version:       df224c3e
Pesos: sim=0.28 comp=0.27 ctx=0.15 trend=0.12 social=0.1 nov=0.08
Timeout: 120s proceso / 30s por query PG
==========================================================

[1/8] Perfil usuario (sin cache)...
      55.7ms
[2/8] Conteo samples activos...
      3.7ms (984 samples)
[3/8] Verificacion pgvector...
      15.4ms
[4/8] Generacion SQL senales...
      Comportamiento: 0.78ms
      Contexto:       0.19ms
      Tendencias:     0.02ms
      Grafo social:   0.01ms
      Similitud:      3.21ms
[5/8] FEED pag 1 (sin cache)...
      259.3ms (33 samples)
[6/8] FEED pag 2 (sin cache)...
      169.7ms (33 samples)
[7/8] FEED pag 3 (sin cache)...
      162.5ms (33 samples)
[8/8] FEED pag 3 con cache (hit)...
      1.2ms

+----------------------------------------------------+----------+
| Componente                                         | Tiempo   |
+----------------------------------------------------+----------+
| PerfilUsuario::construir (sin cache)               |    55.7ms |
| Conteo samples activos (SQL COUNT)                 |     3.7ms |
| Verificacion pgvector                              |    15.4ms |
| SQL gen: Comportamiento (0.27)                     |     0.8ms |
| SQL gen: Contexto (0.15)                           |     0.2ms |
| SQL gen: Tendencias (0.12)                         |     0.0ms |
| SQL gen: Grafo Social (0.1)                        |     0.0ms |
| SQL gen: Similitud pgvector (0.28)                 |     3.2ms |
| >> FEED pag1 sin cache <<                          |   259.3ms |
| >> FEED pag2 sin cache <<                          |   169.7ms |
| >> FEED pag3 sin cache <<                          |   162.5ms |
| Feed pag3 cache hit                                |     1.2ms |
+----------------------------------------------------+----------+
| PROMEDIO feed sin cache (3 pags)                   |   197.2ms |
+----------------------------------------------------+----------+

=== RESUMEN (para documentacion) ===
Fecha: 2026-03-18 01:02:52 | Config: df224c3e
Samples: 984 | pgvector: SI | Pipeline: NO
Feed pag1: 259ms | pag2: 170ms | pag3: 162ms | promedio: 197ms | cache: 1ms
Perfil: 56ms | Conteo: 4ms

## 173A-8

Ya hice el build de la app con android studio, las notificaciones deben funcionar, aparecer sin que la app este abierta, falta usar el logo de kamples en la app, y en las notificaciones, el loggin de google tiene que funcionar. 


## 183A-10

Agregar documentaciones detalladas nuevas sin basarte en los md viejos del algoritmo, funcionalidad de colecciones, canciones y sampleos, y el sincronizador. 
