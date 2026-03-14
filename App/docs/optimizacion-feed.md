# Optimización del Feed de Samples — Análisis y Plan

> **Versión:** 1.0 | **Fecha:** 2026-03-14 | **Contexto:** QK17

## Problema Reportado

"Cargando samples... tarda demasiado con apenas 100 samples, no está optimizado, algoritmo parece que no tiene cache."

## Diagnóstico: Cómo Funciona Actualmente

### Arquitectura Backend (5 capas)

```
GET /feed?tipo=descubrir&page=1&per_page=12
  │
  ├─ SamplesController::feed()
  │   └─ Rate limit anónimos (60/min por IP)
  │   └─ Delega a MotorRecomendacion::feedPersonalizado()
  │
  ├─ MotorRecomendacion::feedPersonalizado($userId, $limite, $offset)
  │   ├─ Cache check: WP transient `kamples_feed_{userId}_{limite}_{offset}`
  │   │   └─ TTL: 300s (5 minutos)
  │   │   └─ Si HIT → retorna inmediatamente
  │   │   └─ Si MISS → continúa...
  │   │
  │   ├─ PerfilUsuario::construir($userId) ← CUELLO DE BOTELLA #1
  │   │   ├─ contarInteracciones()      → 1 query (3 COUNT subqueries)
  │   │   ├─ bpmPromedio()              → 1 query (AVG con UNION)
  │   │   ├─ keyFavorita()              → 1 query (GROUP BY + ORDER BY)
  │   │   ├─ escalaFavorita()           → 1 query (GROUP BY + ORDER BY)
  │   │   ├─ tipoFavorito()             → 1 query (GROUP BY + ORDER BY)
  │   │   ├─ obtenerCreadoresFavoritos() → 1 query (3 UNION ALL + GROUP BY)
  │   │   └─ obtenerGenerosDeclarados() → 1 query (campo JSONB)
  │   │   = 7 queries secuenciales SIN cache
  │   │
  │   ├─ ConstructorSenales (6 señales SQL) ← CUELLO DE BOTELLA #2
  │   │   ├─ Comportamiento (5 sub-factores: likes, reproducciones, tiempo, descargas, completadas)
  │   │   ├─ Contexto (BPM, key, escala, tipo, género, creador favorito)
  │   │   ├─ Tendencias (likes 24h, reproducciones 24h, descargas 7d, follows 7d)
  │   │   ├─ Novedad (decay logarítmico)
  │   │   ├─ Grafo social (seguidos + likes de seguidos)
  │   │   └─ Similitud contenido (pgvector coseno — embedding perfil vs sample)
  │   │   = Generan SQL string con interpolación PHP
  │   │
  │   ├─ Query SQL CTE 2 niveles ← CUELLO DE BOTELLA #3
  │   │   └─ base_scores: calcula score para TODOS los 100+ samples
  │   │   └─ scored: ROW_NUMBER PARTITION BY creador_id
  │   │   └─ ORDER BY score DESC LIMIT 12 OFFSET 0
  │   │   = PostgreSQL evalúa TODAS las filas antes de LIMIT
  │   │
  │   └─ Post-procesamiento (serendipia, normalización)
  │
  └─ NormalizadorSample::normalizarLista() → JSON response
```

### Arquitectura Frontend

```
useFeedSamples (hook principal)
  ├─ Carga paginada: page 1, 2, 3... (per_page=12)
  ├─ Infinite scroll: IntersectionObserver + throttle progresivo
  ├─ Virtualización: solo renderiza elementos visibles (max 50)
  ├─ Cache in-memory: cacheFeedRef por clave+página
  ├─ Race condition guard: requestIdRef
  └─ CRUD listeners: eliminado, restaurado, actualizado, creado
```

### Cache Existente

| Capa | Clave | TTL | Qué cachea |
|------|-------|-----|------------|
| Feed | `kamples_feed_{userId}_{limite}_{offset}` | 300s (5 min) | Resultado completo del feed paginado |
| pgvector check | `kamples_pgvector_activo` | 3600s (1h) | Bool: extensión pgvector disponible |
| Perfil vectorial | `kamples_perfil_vec_{userId}` | 3600s (1h) | Array 128 floats (embedding perfil) |
| Saturación stats | `kamples_saturacion_stats` | 3600s (1h) | Percentiles P75/P95 de descargas |
| **Perfil usuario** | **NINGUNO** | - | **7 queries sin cache** |

### Invalidación

- `MotorRecomendacion::invalidarCache($userId)` — al dar like/dislike/follow
- `MotorRecomendacion::invalidarCacheGlobal()` — al publicar nuevo sample
- `PlanificadorAlgoritmo` — recálculo rápido (cada 5 interacciones) y preciso (cada 10)

## Cuellos de Botella Identificados

### #1: Perfil de Usuario — 7 Queries Secuenciales Sin Cache (CRÍTICO)

Cada cache miss del feed ejecuta 7 queries a BD sin ningún tipo de cache:
- Todas hacen UNION de likes + reproducciones (tablas grandes)
- Las queries 2-5 repiten la misma lógica de "samples con los que interactuó"
- `obtenerCreadoresFavoritos` es la más pesada: 3 UNION ALL + GROUP BY + HAVING

**Impacto:** Con cache feed de 5 minutos, esto se ejecuta mínimo cada 5 minutos por usuario activo. Con invalidación tras like/dislike, puede ser mucho más frecuente.

### #2: Query SQL Evalúa TODOS los Samples

PostgreSQL no puede usar LIMIT antes de calcular el score de CADA sample activo porque el ORDER BY depende del score calculado. Con 100 samples el costo es moderado, pero crece linealmente.

### #3: Invalidación Demasiado Agresiva

Un simple like invalida TODO el cache del feed del usuario (todas las páginas). La próxima carga re-ejecuta perfil + 6 señales.

## Optimizaciones Implementadas

### Opt-1: Cache de Perfil de Usuario (WP Transient)

**Archivo:** `App/Kamples/Services/PerfilUsuario.php`

**Cambio:** Cachear el resultado de `construir()` en transient con TTL de 30 minutos. El perfil solo cambia significativamente con acumulación de interacciones (no con cada like individual).

- **Clave:** `kamples_perfil_usr_{userId}`
- **TTL:** 1800s (30 minutos) — alineado con el intervalo rápido del PlanificadorAlgoritmo
- **Invalidación:** Al ejecutarse recálculo rápido o preciso (PlanificadorAlgoritmo)

**Impacto:** Elimina 7 queries en cada cache miss del feed. El perfil se re-calcula máximo cada 30 minutos o cuando el planificador dispare recálculo.

### Opt-2: Unificar 6 Queries del Perfil en 1 CTE

**Archivo:** `App/Kamples/Database/Repositories/UsuariosExtRepository.php`

**Cambio:** Nuevo método `perfilCompletoParaAlgoritmo($userId)` que combina las 6 queries en una sola CTE con sub-selects:

```sql
WITH interacciones AS (
    SELECT target_id AS sample_id FROM likes WHERE usuario_id = :userId AND tipo = 'sample' AND reaccion IN ('like','encanta')
    UNION
    SELECT sample_id FROM reproducciones WHERE usuario_id = :userId
),
total AS (
    SELECT (SELECT COUNT(*) FROM likes WHERE usuario_id = :userId AND tipo = 'sample')
         + (SELECT COUNT(*) FROM reproducciones WHERE usuario_id = :userId)
         + (SELECT COUNT(*) FROM descargas WHERE usuario_id = :userId) AS total
),
bpm AS (SELECT AVG(s.bpm)::int AS val FROM samples s JOIN interacciones i ON s.id = i.sample_id WHERE s.bpm IS NOT NULL),
key_fav AS (SELECT s.key AS val FROM samples s JOIN interacciones i ON s.id = i.sample_id WHERE s.key IS NOT NULL GROUP BY s.key ORDER BY COUNT(*) DESC LIMIT 1),
escala_fav AS (SELECT LOWER(s.escala) AS val FROM samples s JOIN interacciones i ON s.id = i.sample_id WHERE s.escala IS NOT NULL AND s.escala != '' GROUP BY LOWER(s.escala) ORDER BY COUNT(*) DESC LIMIT 1),
tipo_fav AS (SELECT s.tipo AS val FROM samples s JOIN interacciones i ON s.id = i.sample_id GROUP BY s.tipo ORDER BY COUNT(*) DESC LIMIT 1)
SELECT
    (SELECT total FROM total) AS interacciones,
    (SELECT val FROM bpm) AS bpm_prom,
    (SELECT val FROM key_fav) AS key_fav,
    (SELECT val FROM escala_fav) AS escala_fav,
    (SELECT val FROM tipo_fav) AS tipo_fav
```

**Impacto:** 7 queries → 1 query + 1 query separada para creadores favoritos (esta usa 3 UNION ALL y es más eficiente separada). Total: 7 → 2 roundtrips a BD.

### Opt-3: Sincronizar Invalidación de Cache (Feed + Perfil)

**Archivo:** `App/Kamples/Services/PlanificadorAlgoritmo.php`

**Cambio:** Al disparar recálculo rápido, además de invalidar cache del feed, invalidar cache del perfil. Al disparar recálculo preciso, también invalidar los embeddings.

**Impacto:** El perfil solo se re-calcula cuando es relevante (acumulación de interacciones), no en cada cache miss del feed.

### Opt-4: TTL Diferenciado por Página

**Archivo:** `App/Kamples/Services/MotorRecomendacion.php`

**Cambio:** 
- Página 1: TTL 300s (5 minutos) — mantener frescura
- Página 2+: TTL 900s (15 minutos) — páginas subsecuentes cambian menos

### Opt-5: Stale-While-Revalidate en Frontend

**Archivo:** `App/React/hooks/useFeedSamples.ts`

**Cambio:** Al tener datos en cache, mostrarlos inmediatamente y re-validar en background. El usuario ve contenido instantáneo y los datos se actualizan silenciosamente si cambiaron.

## Resultado Esperado

### Antes (cada carga de feed con cache miss):
- 7 queries perfil (sin cache) + 1 query scoring CTE = ~8 roundtrips BD
- Tiempo estimado: 150-300ms por request

### Después:
- 0 queries perfil (cacheado 30 min) + 1 query scoring CTE = ~1 roundtrip BD
- Con cache hit: 0ms backend
- Frontend: datos visibles instantáneamente (stale-while-revalidate)

## Mejoras Futuras (No implementadas aún)

### Tabla Materializada de Scores (Precálculo Batch)
- Cron cada 2 horas: precalcular top 200 scores por usuario
- Tabla `feed_cache_scores(usuario_id, sample_id, score, calculado_at)`
- Query feed lee de tabla materializada en vez de calcular en tiempo real
- Caer a recálculo en tiempo real si la tabla está muy vieja

### Índices Especializados
- `CREATE INDEX CONCURRENTLY idx_samples_activo_creador ON samples(estado, creador_id, publicado_at)` — para el CTE con PARTITION BY
- `CREATE INDEX CONCURRENTLY idx_likes_usuario_sample ON likes(usuario_id, tipo, target_id) WHERE reaccion IN ('like','encanta')` — para las queries de perfil

### pg_trgm para Búsqueda
- Si la búsqueda rápida (QK13) empieza a ser lenta con muchos samples, crear índice trigram

## Lecciones

- [Cache]: El perfil de usuario era el cuello de botella real, no el algoritmo de scoring en sí
- [Invalidación]: Invalidar todo el cache en cada like es demasiado agresivo — los cambios son incrementales
- [Frontend]: stale-while-revalidate es la forma correcta de que el usuario perciba carga instantánea
- [SQL]: Las 7 queries separadas del perfil comparten la misma lógica base (samples interactuados) — un CTE las unifica en 1 roundtrip
