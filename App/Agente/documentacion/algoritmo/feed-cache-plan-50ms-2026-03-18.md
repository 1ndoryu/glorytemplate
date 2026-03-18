# Feed cache y plan 50ms -- 183A-30, 183A-25 (2026-03-18)

## Resumen ejecutivo
El feed de samples usa stale-while-revalidate en el backend (WP transients).
Hasta 183A-30 solo pag1 tenia stale cache; pag2/3 siempre computaban 200ms.
Con 183A-30 se extiende stale a todas las paginas.

## Arquitectura de cache backend

### Claves de transients
- Fresco: `kamples_feed_{userId}_{limit}_{offset}` -- TTL 5min pag1 / 15min pag2+
- Stale: `kamples_feed_stale_{userId}_{limit}_{offset}` -- TTL 6h pag1 / 1h pag2+

### Flujo
1. Check fresco -> HIT: devolver instantaneo (1ms)
2. Check stale -> HIT: devolver stale + programarWarm en post-respuesta
3. Miss total: computar completo 200ms + guardar fresco y stale

### programarWarm
Usa add_action('shutdown') con fastcgi_finish_request para recalcular
despues de enviar la respuesta. Sin bloqueo para el usuario.
El lock (90s) previene recalculos duplicados concurrentes.

### Invalidacion
- invalidarCache($userId): borra solo transients frescos, preserva stale
- Se llama al publicar, dar like, descargar
- El stale shield permanece para que el siguiente request siga siendo rapido

## Benchmark #4 (2026-03-18, 984 samples activos)
- pag1: 4ms (stale hit, NOT computo real)
- pag2: 200ms (sin stale pre 183A-30)
- pag3: 266ms (sin stale pre 183A-30)
- Cache hit: 3ms
- Promedio calculado: 156ms (pero pag1 es stale, no real)

El COMPUTO REAL es ~200ms para cualquier pagina con 984 samples.

## Plan para 50ms (sin cache)

### Por que 200ms con 984 samples
El pipeline de candidatos no activa hasta 5000 samples activos.
Todos los 984 samples pasan por scoring completo con CTEs:
- tags enriquecidos (JSONB), afinidad de tags, grafo social, pgvector
OFFSET pagination: PostgreSQL evalua TODOS los rows antes de LIMIT.
= O(984 * costoScoringCompleto)

### Siguiente optimizacion: precalentamiento de pag2/3
Cuando pag1 se computa fresh, programar warm de pag2 y pag3 en el mismo shutdown.
El usuario hace scroll ~30s despues, pag2 ya estara en cache caliente (TTL 15min).
Impacto real: elimina el 200ms de pag2/3 para el 95% de los casos de uso normales.

### Opt-10: paginacion por cursor (keyset pagination)
Actualmente: LIMIT N OFFSET M -> scan total de todos los rows
Con cursor: WHERE (score, id) < (:lastScore, :lastId) LIMIT N
Impacto: elimina re-sort de todos los rows anteriores
Requiere: ID del ultimo elemento devuelto en la respuesta del feed
Pendiente de implementar cuando se refactore la paginacion del feed

### Opt-11: tabla materializada de scores (> 5000 samples)
- Cron cada 5min actualiza `feed_scores_cache(user_id, sample_id, score, computed_at)`
- Feed request = JOIN simple por (user_id, score DESC) -> < 5ms
- Solo para usuarios activos en ultimos 7 dias (ahorra storage)
- Activar cuando haya >= 5000 samples activos

### Opt-12: Read replica (> 100k samples)
Leer el feed de una replica PostgreSQL dedicada read-only.

## Estado de implementacion
- [x] 173A-6: stale shield pag1 + warmup cron
- [x] 183A-30: stale extendido a pag2+ (CACHE_STALE_TTL_PAGINAS = 1h)
- [ ] Precalentamiento pag2/3 en shutdown de pag1 (quick win)
- [ ] Opt-10: cursor pagination
- [ ] Opt-11: materialized scores (cuando > 5000 samples)
