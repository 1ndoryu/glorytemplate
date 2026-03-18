# Optimizacion del Feed, Busqueda y Algoritmo — Escalabilidad a Cientos de Usuarios Concurrentes

> Investigacion profunda QL38.
> Ultima actualizacion: sesion AG-OPT (2026-03-16).
> Companion de: `algoritmo.md` (diseño funcional), `plan-samples-metadata.md` (pipeline datos).
> **Objetivo:** Identificar bottlenecks, proponer soluciones arquitectonicas y plan de implementacion para escalar el feed personalizado, busqueda y sugerencias a cientos de usuarios concurrentes sin degradar latencia.

---

# NOTAs NUEVAs DEL USUARIO

## NOTA 1
~~VEO QUE ESTAS CORRIENDO EL TEST Y NO SUBES LOS CAMBIOS AL VPS PARA PROBAR TUS NUEVAS MEJRAS!! COMO SE VA A ACTUALIZAR EL VPS SI NO HACES PULL PRIMERO LOCALMENTE???!~~
> **Resuelto:** Secuencia corregida: commit → push → deploy → verificar commit en VPS → benchmark.

## NOTA 2
Evualua esto, imagina que de repente hay 1.000.000, no digo que haya que calcular todos pero en se caso supongo que habría que filtrar para el feed, pero el punto es que hay que ajustar el plan a imaginar la situación en la que llegamos a 1.000.000 de samples, ¿lo va a soportar? pues tiene que soportarlo, sin perder calidad el algortimo, cualquier cosa que se tenga que hacer, cualquier mejora para ese escenario que aún no llega pero va a llegar, hay que prepararse para esa escalada masiva 


---

## Historial de Benchmarks

> Script: `App/Kamples/Cli/benchmarkAlgoritmo.php` — ejecutar con: `php wp-content/themes/glorytemplate/App/Kamples/Cli/benchmarkAlgoritmo.php [userId] [perPage]`

### Benchmark #3 — Post CTEs Pre-agregados (2026-03-16)

| Dato | Valor |
|------|-------|
| Fecha | 2026-03-16 07:34 UTC |
| Commit | fa1b5286 |
| Config hash | df224c3e |
| Samples activos | 294 |
| pgvector | SI |
| Pipeline candidatos | NO (<5000) |
| MV trending | SI |

| Componente | Tiempo |
|------------|--------|
| PerfilUsuario::construir (sin cache) | 34.1ms |
| FEED pag1 sin cache | **178.3ms (33 samples)** |
| FEED pag2 sin cache | **99.8ms (33 samples)** |
| FEED pag3 sin cache | **103.0ms (33 samples)** |
| Feed pag3 cache hit | 1.5ms |
| **Promedio feed sin cache** | **127.0ms** |

**Cambios aplicados (commits `7fb6b92e` + `fa1b5286`):**
- **CTE `score_tags`:** Pre-agrega 7 tag affinity scores en 1 pass via LATERAL UNNEST + hash JOINs a utag_* CTEs. Elimina SubPlans 7-13 (7 correlated subqueries del comportamiento + genero_match).
- **CTE `repro_peso`:** Pre-agrega reproducciones ponderadas (sum_ponderada + repro_significativas) por sample con clasificacion adaptativa (corto/medio/largo). Elimina SubPlans 16-17 (penalizacionReproduccion + hasPlayed).
- **CTE `likes_seguidos_cte`:** Pre-agrega likes de followed users por sample. Elimina SubPlan 15 (likeadoPorSeguidos).
- **Scoring sin subqueries:** Comportamiento usa `st.*`, contexto usa `st.ctx_cnt`, grafo social usa `ls.*`, penalizaciones usan `rp.*`.
- **Fix PDO:** Remover param `:userId` no referenciado — PG PDO falla con params extras (a diferencia de MySQL que los ignora).

**Resultado: 734ms → 127ms (promedio). Mejora: 82.7% vs Benchmark #2. Total: >30,000ms → 127ms = 99.6%.**

### Benchmark #2 — Post CTE Optimization (2026-03-16)

| Dato | Valor |
|------|-------|
| Fecha | 2026-03-16 07:03 UTC |
| Commit | 7bd83825 |
| Config hash | df224c3e |
| Samples activos | 294 |
| pgvector | SI |
| Pipeline candidatos | NO (<5000) |
| MV trending | SI |
| Pesos | sim=0.28, comp=0.27, ctx=0.15, trend=0.12, social=0.10, nov=0.08 |

| Componente | Tiempo |
|------------|--------|
| PerfilUsuario::construir (sin cache) | 38.9ms |
| Conteo samples activos (SQL COUNT) | 1.5ms |
| Verificacion pgvector | 4.2ms |
| SQL gen: Comportamiento (0.27) | 0.20ms |
| SQL gen: Contexto (0.15) | 0.04ms |
| SQL gen: Tendencias (0.12) | 0.01ms |
| SQL gen: Grafo Social (0.10) | 0.00ms |
| SQL gen: Similitud pgvector (0.28) | 0.88ms |
| **FEED pag1 sin cache** | **835.6ms (33 samples)** |
| **FEED pag2 sin cache** | **663.7ms (33 samples)** |
| **FEED pag3 sin cache** | **702.2ms (33 samples)** |
| Feed pag3 cache hit | 0.7ms |
| **Promedio feed sin cache** | **733.8ms** |

**Cambios aplicados (commit `7bd83825`):**
- **BN-1 resuelto:** 4 EXISTS per-row → 4 LEFT JOINs contra CTEs pre-computados (`user_likes`, `user_descargas`, `user_colecciones`, `user_comentarios`).
- **BN-2 resuelto:** `sqlTagsEnriquecidos` llamado 9× → 1× en CTE `enriched`. Los 5 sub-factores de comportamiento + dislike + contexto ahora hacen `@>` array containment sobre `e.etags` pre-computado.
- **Señales de afinidad vectorizadas:** Pre-computan tag affinity por fuente (likes, repro, tiempo, descargas, completadas, dislikes) en CTEs separados. El scoring es O(tags_candidato) en vez de O(N_interacciones × tags_candidato).
- **Grafo social optimizado:** CTE `followed_ids` evita repetir subquery de seguidos.
- **Penalización pasiva optimizada:** Usa `ul.sample_id IS NULL` (LEFT JOIN) en vez de 3 NOT EXISTS.

**Resultado: >30,000ms → 734ms (promedio). Mejora: 97.5%.**

**Siguiente paso:** El promedio de 734ms aún es alto para producción (objetivo <300ms). Quedan optimizaciones posibles: EXPLAIN ANALYZE para identificar nodos lentos restantes, materializar CTE `enriched`, reducir penalización de reproducción (correlated subquery por candidato).

### Benchmark #1 — Baseline (2026-03-16)

| Dato | Valor |
|------|-------|
| Fecha | 2026-03-16 06:01 UTC |
| Config hash | df224c3e |
| Samples activos | 294 |
| pgvector | SI |
| Pipeline candidatos | NO (<5000) |
| MV trending | SI |
| Pesos | sim=0.28, comp=0.27, ctx=0.15, trend=0.12, social=0.10, nov=0.08 |

| Componente | Tiempo |
|------------|--------|
| PerfilUsuario::construir (sin cache) | 67.2ms |
| Conteo samples activos (SQL COUNT) | 3.4ms |
| Verificacion pgvector | 9.2ms |
| SQL gen: Comportamiento (0.27) | 0.17ms |
| SQL gen: Contexto (0.15) | 0.03ms |
| SQL gen: Tendencias (0.12) | 0.01ms |
| SQL gen: Grafo Social (0.10) | 0.00ms |
| SQL gen: Similitud pgvector (0.28) | 1.75ms |
| **FEED pag1 sin cache** | **>30,000ms (timeout)** |
| **FEED pag2 sin cache** | **>30,000ms (timeout)** |
| **FEED pag3 sin cache** | **>30,000ms (timeout)** |

**Diagnostico:** La query CTE del feed tarda >30 segundos con solo 294 samples. El `statement_timeout` de 30s la corta antes de completar. Retorna 0 samples. El cuello de botella no es la generacion SQL (<2ms total) ni el perfil (67ms), sino la **ejecucion de la query combinada** con todas las senales (6 CTEs anidados + subqueries EXISTS + scoring + ORDER BY).

**Causa raiz probable:** Con 294 samples, el plan del query combina: senal similitud pgvector (distance calculations), 4x EXISTS subqueries por cada sample (N+1 flags), enrichment de tags JSONB por sample, saturacion dinamica (PERCENTILE agregacion), serendipia. El planner de PG no puede optimizar >6 CTEs encadenados con funciones como `LN()`, `GREATEST()`, `EXTRACT()` sobre cada fila, resultando en un plan secuencial que escanea la tabla multiples veces.

**Siguiente paso:** Optimizar la query del feed (BN-1 a BN-5 descritos abajo) y re-ejecutar este benchmark para medir mejora.

---

## Indice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual del Performance](#estado-actual-del-performance)
3. [Bottlenecks Criticos Identificados](#bottlenecks-criticos-identificados)
4. [Plan de Optimizacion por Fases](#plan-de-optimizacion-por-fases)
5. [Escalabilidad del Feed Personalizado](#escalabilidad-del-feed-personalizado)
6. [Escalabilidad de la Busqueda](#escalabilidad-de-la-busqueda)
7. [Algoritmo "Mas Ideas" — Analisis y Mejoras](#algoritmo-mas-ideas--analisis-y-mejoras)
8. [Busqueda que Aprende: Relevancia Adaptativa](#busqueda-que-aprende-relevancia-adaptativa)
9. [Colecciones como Senal de Relevancia (modelo Pinterest)](#colecciones-como-senal-de-relevancia-modelo-pinterest)
10. [Redis — Impacto en el Stack](#redis--impacto-en-el-stack)
11. [Monitoreo y Alertas](#monitoreo-y-alertas)
12. [Modelo de Carga y Proyecciones](#modelo-de-carga-y-proyecciones)
13. [Resumen de Acciones por Prioridad](#resumen-de-acciones-por-prioridad)

---

## Resumen Ejecutivo

El sistema actual de recomendacion funciona correctamente para un numero bajo de usuarios concurrentes (<10), pero presenta bottlenecks que degradan latencia exponencialmente al escalar. Los problemas principales son:

1. **N+1 en flags de usuario** dentro del CTE `base_scores`: 4 EXISTS subqueries por cada candidato (1000 candidatos = 4000 subqueries).
2. **Tags enriquecidos recalculados 7x** en la senal de comportamiento, cada uno con UNNEST + COALESCE sobre JSONB.
3. **Saturacion dinamica con full scan** de percentiles (P75/P95) en cada request sin cache caliente.
4. **LIMIT/OFFSET para paginacion profunda** — costo linealmente creciente con el offset.
5. **Busqueda sin aprendizaje** — no incorpora señales de colecciones, exito historico ni click-through rate.
6. **"Mas Ideas" con scan lineal** sobre todos los samples activos.

Con las optimizaciones propuestas en las 3 fases de este documento, el sistema puede escalar a **500+ usuarios concurrentes** manteniendo latencia P95 < 200ms.

---

## Estado Actual del Performance

### Arquitectura de Cache (3 capas)

```
Capa 1: WP Transients (servidor)
├── Feed personalizado: TTL 300s (pag1) / 900s (pag 2+)
├── Perfil usuario: TTL 1800s (30 min)
├── Perfil vector: TTL 3600s (1h)
├── pgvector check: TTL 3600s (1h)
├── Saturacion stats: TTL 3600s (1h)
└── Invalidacion: por evento (like, descarga, follow) via PlanificadorAlgoritmo

Capa 2: Vista Materializada PostgreSQL
├── mv_trending_samples: refresh CONCURRENTLY cada 10 min
├── Pre-agrega: likes_24h, repro_24h, descargas_7d, follows_7d
└── Elimina 4 subqueries correlacionadas por fila en sqlTendencias

Capa 3: localStorage (cliente)
├── Stale-while-revalidate: TTL 5 min, max 7 dias
├── Solo actualiza estado cuando ResultadoProveedor.ok === true (QL35)
└── Reduce cold-start a <50ms para feed ya visitado
```

### Tiempos Estimados por Operacion (sin cache)

| Operacion | Tiempo estimado | Con cache |
| --- | --- | --- |
| feedPersonalizado (1000 candidatos) | 150-400ms | 1-5ms (transient hit) |
| feedNuevoUsuario | 30-80ms | 1-5ms |
| samplesSimilares (pgvector) | 20-50ms | N/A (no cacheado) |
| samplesSimilares (fallback) | 50-150ms | N/A |
| busqueda FTS + tag match | 30-100ms | N/A |
| sugerencias "Mas Ideas" | 80-200ms | N/A |
| perfilCompletoParaAlgoritmo | 30-100ms | 1-5ms (transient) |
| obtenerCreadoresFavoritos | 40-150ms | parte del perfil |

### Pipeline de Candidatos (Opt-6)

El pipeline de 2 etapas reduce drasticamente el costo del scoring cuando `totalActivos > 5000`:

```
Etapa 1 — Selector (~1000 IDs via index scans):
  300 trending (idx_samples_engagement_activo)
+ 200 pgvector ANN (HNSW coseno)
+ 200 seguidos (idx_follows_seguidor + idx_samples_creador)
+ 200 tag affinity (s.tags && ARRAY[...])
+ 100 populares all-time (idx_samples_engagement_activo)
= ~1000 candidatos UNION (deduplicados)

Etapa 2 — Scoring completo:
  6 senales ponderadas sobre los ~1000 candidatos
  Penalizaciones + diversidad creador
  LIMIT/OFFSET final
```

**Estado:** Activo si `totalActivos > 5000` (configurable en `algoritmoPesos.php`). Conteo cacheado 1h.

---

## Bottlenecks Criticos Identificados

### BN-1: N+1 Flags de Usuario en base_scores [CRITICO]

**Ubicacion:** `MotorRecomendacion.php` → CTE `base_scores`

Actualmente, 4 flags de estado del usuario se calculan con EXISTS subqueries inline:

```sql
/* Por CADA candidato (hasta 1000 filas): */
(SELECT 1 FROM descargas WHERE usuario_id=:uid AND sample_id=s.id LIMIT 1) AS ya_coleccionado,
(SELECT 1 FROM coleccion_samples cs JOIN colecciones c ON... WHERE c.usuario_id=:uid AND cs.sample_id=s.id LIMIT 1) AS ya_guardado,
(SELECT 1 FROM comentarios WHERE autor_id=:uid AND tipo='sample' AND target_id=s.id LIMIT 1) AS ya_comentado,
(SELECT reaccion FROM likes WHERE usuario_id=:uid AND tipo='sample' AND target_id=s.id LIMIT 1) AS reaccion_usuario
```

**Impacto:** Con 1000 candidatos = 4000 subqueries correlacionadas. PostgreSQL puede optimizar parcialmente con semi-joins, pero el EXPLAIN plan muestra SubPlan nodes para cada flag.

**Costo estimado:** +100-200ms por request.

**Solucion:**

```sql
/* Pre-cargar flags en CTEs una sola vez (1 query por tipo, no 1000): */
WITH
user_likes AS (
  SELECT target_id, reaccion FROM likes
  WHERE usuario_id = :uid AND tipo = 'sample'
),
user_descargas AS (
  SELECT sample_id FROM descargas WHERE usuario_id = :uid
),
user_colecciones AS (
  SELECT cs.sample_id FROM coleccion_samples cs
  JOIN colecciones c ON cs.coleccion_id = c.id
  WHERE c.usuario_id = :uid
),
user_comentarios AS (
  SELECT target_id FROM comentarios
  WHERE autor_id = :uid AND tipo = 'sample'
),
base_scores AS (
  SELECT s.*,
    <score>,
    ul.reaccion AS reaccion_usuario,
    ud.sample_id IS NOT NULL AS ya_coleccionado,
    uc.sample_id IS NOT NULL AS ya_guardado_en_coleccion,
    ucom.target_id IS NOT NULL AS ya_comentado
  FROM samples s
  LEFT JOIN user_likes ul ON s.id = ul.target_id
  LEFT JOIN user_descargas ud ON s.id = ud.sample_id
  LEFT JOIN user_colecciones uc ON s.id = uc.sample_id
  LEFT JOIN user_comentarios ucom ON s.id = ucom.target_id
  WHERE s.estado = 'activo'
)
```

**Resultado:** 4 queries independientes (cada una usa indice) + 4 LEFT JOINs hash en base_scores. Elimina 4000 SubPlan nodes.

---

### BN-2: Tags Enriquecidos Recalculados 7x [ALTO]

**Ubicacion:** `ConstructorSenales.php` → `sqlComportamiento()`

La funcion `sqlTagsEnriquecidos($alias)` genera SQL para enriquecer `s.tags` con metadata JSONB (genero, instrumentos, emocion). Se invoca 7 veces en la senal de comportamiento:

1. `tags_likeados` (alias senal de likes)
2. `tags_repro` (alias senal reproducciones)
3. `tags_tiempo` (alias senal tiempo escucha)
4. `tags_descargas` (alias senal descargas)
5. `tags_completadas` (alias senal completadas)
6. `tags_disliked` (alias senal dislike)
7. `tags_candidato` (alias del sample candidato)

Cada invocacion genera un bloque SQL con UNNEST + COALESCE + jsonb_typeof + ARRAY_AGG que se compila en la query base.

**Impacto:** El compilador SQL de PostgreSQL debe evaluar cada bloque UNNEST independientemente. Para el candidato (alias `s`), los tags se recalculan 7 veces por fila.

**Solucion:**

Centralizar tags enriquecidos del candidato en una CTE adicional o columna pre-computada:

```sql
/* Opcion A: CTE de tags enriquecidos (evaluado 1 vez por candidato) */
WITH tags_enriched AS (
  SELECT s.id,
    (SELECT COALESCE(ARRAY_AGG(LOWER(t)), ARRAY[]::text[])
     FROM UNNEST(
       COALESCE(s.tags, ARRAY[]::text[])
       || /* genero, instrumentos, emocion expansion */
     ) AS t WHERE t IS NOT NULL AND t != ''
    ) AS tags_full
  FROM samples s WHERE s.estado = 'activo'
),
base_scores AS (
  SELECT s.*, te.tags_full, <score_usando_te.tags_full>
  FROM samples s
  JOIN tags_enriched te ON s.id = te.id
  ...
)

/* Opcion B: Columna materializada (evaluado 0 veces en query) */
ALTER TABLE samples ADD COLUMN tags_enriquecidos text[] DEFAULT ARRAY[]::text[];
/* Trigger o cron que actualiza al cambiar tags o metadata */
```

**Opcion B es la solucion arquitectonica correcta** para escalabilidad a largo plazo: pre-computar `tags_enriquecidos` como columna real eliminaria TODO el overhead de UNNEST en la query del feed. Un trigger `AFTER UPDATE OF tags, metadata ON samples` mantiene la columna sincronizada. Un indice GIN sobre `tags_enriquecidos` habilitaria busquedas por tag instantaneas.

**Resultado Opcion A:** -30-50ms por request (tags del candidato se computan 1 vez en vez de 7).
**Resultado Opcion B:** -60-100ms por request + habilita indice GIN para busqueda por tags.

---

### BN-3: Saturacion Dinamica con Full Scan [MEDIO]

**Ubicacion:** `ConstructorSenales.php` → `sqlSaturacionPopularidad()`

Calcula PERCENTILE_CONT(0.75) y PERCENTILE_CONT(0.95) sobre `total_descargas` de todos los samples activos con descargas > 0. Es un full scan sobre `samples` (sin indice util para aggregate).

**Impacto:** +30-100ms en primera ejecucion. Cacheado en transient 1h, pero si el cache se invalida (deploy, restart), todos los requests concurrentes compiten por recalcular.

**Solucion:** Calcular percentiles en batch job nightly (o cada hora via cron) y almacenar en tabla `algoritmo_config` o en WP option:

```php
/* Cron (cada hora o diario): */
$stats = $wpdb->get_row("
  SELECT
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_descargas) AS p75,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_descargas) AS p95
  FROM samples WHERE estado = 'activo' AND total_descargas > 0
");
update_option('kamples_sat_pop_p75', $stats->p75);
update_option('kamples_sat_pop_p95', $stats->p95);

/* En ConstructorSenales: */
$umbral = get_option('kamples_sat_pop_p75', 50); /* fallback fijo */
$escala = get_option('kamples_sat_pop_p95', 100) - $umbral;
```

**Resultado:** Eliminación del full scan de percentiles en el hot path. La query del feed usa valores pre-calculados con costo 0.

---

### BN-4: Paginacion LIMIT/OFFSET [MEDIO]

**Ubicacion:** `SamplesRepository::listarConFiltros()` y `MotorRecomendacion::feedPersonalizado()`

El offset crece linealmente con la pagina: pagina 10 con 20 items = OFFSET 200. PostgreSQL debe computar y descartar 200 filas antes de retornar 20. Con scoring complejo, cada fila descartada aun paga el costo completo del score.

**Impacto:** Pagina 1: ~200ms. Pagina 10: ~350ms. Pagina 50: ~600ms+.

**Solucion: Cursor-based pagination por score**

```sql
/* Pagina 1: */
SELECT ... ORDER BY score DESC LIMIT 20;
/* Almacenar score del ultimo: last_score = 0.847 */

/* Pagina 2 (cursor): */
SELECT ... WHERE score < :last_score ORDER BY score DESC LIMIT 20;
```

**Complejidad:** El score no es estable entre requests (puede cambiar con interacciones). Para feeds cacheados con cache hit, LIMIT/OFFSET es aceptable porque no re-ejecuta la query. El cursor-based pagination es mas relevante para feeds sin cache (busqueda, sugerencias).

**Alternativa pragmatica:** Mantener LIMIT/OFFSET pero con el pipeline de candidatos limitando a ~1000 filas. El OFFSET maximo real seria ~1000 (50 paginas × 20), que es aceptable con los candidatos ya filtrados.

---

### BN-5: Serendipia Sin Cache [BAJO]

**Ubicacion:** `MotorRecomendacion::inyectarSerendipia()`

Query adicional a pgvector para samples de descubrimiento en cada request sin cache.

**Impacto:** +20-30ms por request.

**Solucion:** Cachear resultados de serendipia en transient separado (TTL 2h, no depende de interacciones del usuario):

```php
$cacheKey = "kamples_serendipia_{$userId}";
$candidatos = get_transient($cacheKey);
if ($candidatos === false) {
    $candidatos = $this->buscarCandidatosDescubrimiento($userId, $config);
    set_transient($cacheKey, $candidatos, 7200);
}
```

---

## Plan de Optimizacion por Fases

### Fase 1: Quick Wins [CRITICO — hacer primero]

| # | Optimizacion | Impacto | Costo |
| --- | --- | --- | --- |
| F1.1 | Pre-cargar flags usuario en CTEs (BN-1) | -100-200ms | 2-3h |
| F1.2 | Cachear serendipia en transient 2h (BN-5) | -20-30ms | 30min |
| F1.3 | Verificar pipeline candidatos activo | Variable | 30min |
| F1.4 | Pre-calcular percentiles en cron (BN-3) | -30-100ms (cold) | 1h |

**Resultado esperado:** Latencia P95 del feed: 400ms → 200ms.

### Fase 2: Optimizaciones Estructurales [ALTO]

| # | Optimizacion | Impacto | Costo |
| --- | --- | --- | --- |
| F2.1 | Columna `tags_enriquecidos` materializada (BN-2) | -60-100ms + nuevo indice | 4-6h |
| F2.2 | Indice GIN sobre `tags_enriquecidos` | busquedas por tag O(log N) | 1h |
| F2.3 | Relevancia adaptativa en busqueda (seccion 8) | mejor UX | 8-12h |
| F2.4 | Colecciones como senal de busqueda (seccion 9) | mejor relevancia | 6-8h |
| F2.5 | Redis cache para flags usuario + perfil | -50ms + escala horizontal | 4-6h (con QL47) |

**Resultado esperado:** Latencia P95 del feed: 200ms → 100ms. Busqueda con relevancia mejorada.

### Fase 3: Escala a Miles de Concurrentes

| # | Optimizacion | Impacto | Costo |
| --- | --- | --- | --- |
| F3.1 | Particionamiento de likes/repro/descargas por fecha | -50% de I/O en agregaciones temporales | 8-12h |
| F3.2 | Read replica PostgreSQL | capacidad 2x | 4h (infra) |
| F3.3 | CDN para respuestas API cacheables (feed anonimo) | -80% de requests al servidor | 2-4h |
| F3.4 | Materialized views adicionales (perfil, tags populares) | elimina recalculos frecuentes | 6-8h |

---

## Escalabilidad del Feed Personalizado

### Modelo de concurrencia actual

```
1 request feed = 1 query scoring (si cache miss)
                + 1 query perfil (si cache miss)
                + 1 query vectorial (si cache miss)
                + 1 query serendipia (siempre)

Con cache caliente: 1 request = 1 WP transient GET (wp_options SELECT)
```

### Scenario: 100 usuarios concurrentes

**Sin cache (cold start simultaneo, peor caso):**
- 100 × query scoring (~300ms) = 30 segundos de CPU PostgreSQL
- Conexiones PG: 100 simultaneas (max_connections default: 100)
- CPU: 100% en PG por ~2-3 segundos (queries paralelas)
- **Estado: PROBLEMATICO** — PG se satura, timeouts probables

**Con cache caliente (estado estable):**
- ~70% cache hit → 70 requests resueltos en <5ms
- ~30% cache miss → 30 queries scoring simultaneas
- 30 × 300ms = 9 segundos de CPU PG, manejable
- **Estado: ACEPTABLE** — si el cache se mantiene caliente

**Con optimizaciones Fase 1 (BN-1 + BN-5):**
- Cache miss: 30 × 150ms = 4.5 segundos CPU PG
- **Estado: BUENO** — PG tiene margen para writes simultaneos

### Scenario: 500 usuarios concurrentes

**Con optimizaciones Fase 1 + 2:**
- ~80% cache hit (feed + Redis) → 400 resueltos en <5ms
- ~20% cache miss → 100 queries × 100ms = 10 seg CPU PG
- Con read replica: 5 seg CPU por servidor
- **Estado: BUENO** — requiere Redis + Fase 2

**Recomendacion de conexiones PG:**

```
/* postgresql.conf */
max_connections = 200
shared_buffers = 256MB          /* 25% de RAM del contenedor */
effective_cache_size = 768MB    /* 75% de RAM */
work_mem = 8MB                  /* por sort/hash, no exceder */
maintenance_work_mem = 128MB    /* VACUUM, CREATE INDEX */

/* Pool recomendado (PgBouncer o similar): */
pool_size = 50                  /* conexiones reales a PG */
max_client_conn = 500           /* conexiones de PHP */
pool_mode = transaction         /* libera conn al terminar tx */
```

### Invalidacion inteligente del cache

Problema: Si 100 usuarios reciben invalidacion simultanea (sample nuevo publicado → `invalidarCacheGlobal()`), todos compiten por recalcular el feed.

**Solucion: Stampede protection (cache warming con lock)**

```php
public function feedPersonalizado($userId, $limite, $offset) {
    $cacheKey = "kamples_feed_{$userId}_{$limite}_{$offset}";
    $resultado = get_transient($cacheKey);

    if ($resultado !== false) {
        return $resultado;
    }

    /* Lock optimista: marcar que estamos recalculando */
    $lockKey = "kamples_feed_lock_{$userId}";
    $lockAdquirido = wp_cache_add($lockKey, 1, '', 30);

    if (!$lockAdquirido) {
        /* Otro request ya esta recalculando. Esperar o retornar stale. */
        $stale = get_option("kamples_feed_stale_{$userId}_{$limite}_{$offset}");
        if ($stale) return $stale;
        /* Si no hay stale, esperar brevemente y reintentar 1 vez */
        usleep(50000); /* 50ms */
        $resultado = get_transient($cacheKey);
        if ($resultado !== false) return $resultado;
    }

    try {
        $resultado = $this->calcularFeed($userId, $limite, $offset);
        set_transient($cacheKey, $resultado, $this->calcularTtl($offset));
        /* Guardar copia stale para stampede future */
        update_option("kamples_feed_stale_{$userId}_{$limite}_{$offset}", $resultado, false);
    } finally {
        wp_cache_delete($lockKey);
    }

    return $resultado;
}
```

---

## Escalabilidad de la Busqueda

### Estado actual

La busqueda usa un sistema multi-factor (implementado en QK75):

```sql
WHERE to_tsvector('spanish', titulo || ' ' || descripcion) @@ plainto_tsquery('spanish', :q)
   OR titulo ILIKE '%' || :q || '%'
   OR EXISTS (SELECT 1 FROM UNNEST(tags) tag WHERE tag ILIKE '%' || :q || '%')

ORDER BY (
  1.0 * ts_rank(to_tsvector('spanish', titulo || ' ' || descripcion), query)
  + 0.8 * (CASE WHEN EXISTS(tag match) THEN 1 ELSE 0 END)
  + 0.5 * ts_rank(to_tsvector('spanish', titulo), query)
) DESC
```

**Indices:**
- `idx_samples_busqueda_fts` — GIN sobre `to_tsvector('spanish', titulo || descripcion)`
- `idx_samples_titulo_fts` — GIN sobre `to_tsvector('spanish', titulo)`
- pg_trgm GIN sobre `titulo` para ILIKE

### Limitaciones actuales

1. **Ranking estatico:** Los pesos (1.0, 0.8, 0.5) no se adaptan al comportamiento de los usuarios. Un tag que los usuarios siempre eligen tras buscar deberia rankear mas alto en el futuro.

2. **Sin feedback loop:** Si 100 usuarios buscan "trap" y siempre clickean el 3er resultado, el sistema no aprende que ese resultado deberia subir al 1ero.

3. **Sin señales de colecciones:** Si los usuarios frecuentemente agregan ciertos samples a colecciones con nombres relacionados al query, eso es una senal de relevancia no aprovechada.

4. **Max 50 resultados hardcoded:** No hay paginacion de busqueda ni scroll infinito.

### Plan de mejora de busqueda (Fase 2)

**B1. Paginacion infinita para busqueda:**

```php
/* En SamplesController::listar() */
$pagina = $request->get_param('pagina') ?? 1;
$porPagina = min(50, max(10, $request->get_param('porPagina') ?? 30));
$offset = ($pagina - 1) * $porPagina;

/* Retornar total para que el frontend pueda paginar */
$total = $this->samplesRepository->contarBusqueda($busqueda, $filtros);
```

**B2. Busqueda sobre tags_enriquecidos (con BN-2 resuelto):**

Con la columna `tags_enriquecidos` materializada y con indice GIN, la busqueda por tags pasa de UNNEST + ILIKE (O(N × tags)) a array containment con GIN (O(log N)):

```sql
/* Antes: */
EXISTS (SELECT 1 FROM UNNEST(tags) tag WHERE tag ILIKE '%trap%')

/* Despues (con columna materializada + GIN): */
tags_enriquecidos @> ARRAY['trap']
/* O busqueda parcial con pg_trgm: */
EXISTS (SELECT 1 FROM UNNEST(tags_enriquecidos) t WHERE t % :query)
```

---

## Algoritmo "Mas Ideas" — Analisis y Mejoras

### Estado actual

`ColeccionesController::sugerencias()` genera recomendaciones para colecciones:

1. Extrae tags frecuentes de samples en la coleccion (metadata->'tags' via JSONB)
2. Obtiene BPM promedio y key dominante
3. Busca samples similares excluyendo los ya incluidos:

```sql
SELECT s.* FROM samples s
WHERE s.estado = 'activo'
  AND s.id NOT IN (SELECT sample_id FROM coleccion_samples WHERE coleccion_id = :cid)
ORDER BY (
  /* Tag match acumulativo */
  (CASE WHEN tag1 = ANY(tags) THEN 1 ELSE 0 END)
  + (CASE WHEN tag2 = ANY(tags) THEN 1 ELSE 0 END) + ...
  /* Key match bonus */
  + (CASE WHEN key = :dominantKey THEN 3 ELSE 0 END)
  /* BPM proximity */
  + GREATEST(0, 5 - ABS(bpm - :avgBpm) / 10)
) DESC, total_likes DESC, publicado_at DESC
LIMIT :limite
```

### Problemas identificados

1. **Scan lineal sobre todos los samples activos** — No usa el pipeline de candidatos ni indices especializados. Con 50K samples, es un seq scan completo.

2. **Tag matching inline** — Genera un CASE por cada tag frecuente (hasta 10). No escala si la coleccion tiene muchos tags diversos.

3. **Sin pgvector** — No usa embeddings para encontrar samples similares al "perfil" de la coleccion. Un embedding promedio de los samples en la coleccion seria mas preciso que tag matching discreto.

4. **Sin señales de comportamiento** — No considera que samples con tags similares tienen alto engagement general.

5. **Para colecciones "descargados"** (QL42) — La sugerencia usa la misma logica pero el proveedor no se ejecuta correctamente para la tab de coleccionados.

### Mejoras propuestas

**MI-1: Usar pgvector para "Mas Ideas"**

```php
/* Calcular embedding promedio de la coleccion: */
$embeddingColeccion = $this->generadorEmbeddings->promedioColeccion($coleccionId);

/* Buscar similares por coseno: */
$sugerencias = $this->samplesRepository->buscarPorCoseno(
    embedding: $embeddingColeccion,
    excluirIds: $idsEnColeccion,
    limite: $limite
);
```

Esto reemplaza el scoring manual por tags con una busqueda ANN O(log N) que captura similitud holistica (BPM + key + tags + tipo + duracion simultaneamente).

**MI-2: Incorporar trending como tiebreaker**

```sql
ORDER BY s.embedding <=> :embeddingColeccion::vector,
         COALESCE(mvt.likes_24h, 0) DESC
LIMIT :limite
```

Entre samples igualmente similares, priorizar los que tienen engagement reciente.

**MI-3: Cache de sugerencias**

```php
$cacheKey = "kamples_sugerencias_{$coleccionId}_{$hash_ids}";
/* TTL largo (1h) — se invalida al agregar/quitar sample de coleccion */
```

El hash de IDs permite invalidar solo cuando cambia el contenido de la coleccion.

**MI-4: Fix QL42 — Sugerencias para coleccionados**

El proveedor de "Mas Ideas" en la tab de descargas necesita tratar los samples descargados como una coleccion virtual:

```php
/* En vez de buscar por coleccion_id, buscar por downloads del usuario */
$idsDescargados = $this->descargasRepository->idsDelUsuario($userId);
$embeddingDescargados = $this->generadorEmbeddings->promedioIds($idsDescargados);
$sugerencias = $this->samplesRepository->buscarPorCoseno(
    embedding: $embeddingDescargados,
    excluirIds: $idsDescargados,
    limite: $limite
);
```

---

## Busqueda que Aprende: Relevancia Adaptativa

### Modelo propuesto: Search Quality Signals

La busqueda actual ranquea por relevancia textual (ts_rank + tag match). Para que "aprenda", necesita incorporar señales de calidad que se actualizan con el comportamiento de los usuarios.

### Señales de calidad para busqueda

| Señal | Descripcion | Peso sugerido | Implementacion |
| --- | --- | --- | --- |
| Click-Through Rate (CTR) | % de veces que un resultado fue clickeado para un query | 0.20 | Tabla `busqueda_clicks` |
| Download-After-Search (DAS) | % de veces que un resultado fue descargado tras busqueda | 0.30 | Correlacion busqueda → descarga |
| Collection Frequency (CF) | Veces que un sample aparece en colecciones con nombre similar al query | 0.25 | Join colecciones.nombre ILIKE query |
| Engagement Score (ES) | Score de engagement general del sample (likes + repro + descargas) | 0.15 | ya disponible |
| Freshness Bonus (FB) | Boost leve para resultados recientes | 0.10 | ya disponible |

### Implementacion de CTR y DAS

**Tabla `busqueda_eventos`:**

```sql
CREATE TABLE busqueda_eventos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios_ext(id),
  query TEXT NOT NULL,
  query_normalizado TEXT NOT NULL, /* LOWER + TRIM + unaccent */
  sample_id INTEGER REFERENCES samples(id),
  tipo_evento VARCHAR(20) NOT NULL, /* 'click', 'descarga', 'coleccionar', 'like' */
  posicion_resultado SMALLINT, /* posicion en la que aparecio el resultado */
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_busqueda_query ON busqueda_eventos(query_normalizado, tipo_evento);
CREATE INDEX idx_busqueda_sample ON busqueda_eventos(sample_id, tipo_evento);
```

**Agregacion para ranking (vista materializada, refresh cada 30 min):**

```sql
CREATE MATERIALIZED VIEW mv_busqueda_relevancia AS
SELECT
  query_normalizado,
  sample_id,
  COUNT(*) FILTER (WHERE tipo_evento = 'click') AS clicks,
  COUNT(*) FILTER (WHERE tipo_evento = 'descarga') AS descargas,
  COUNT(*) FILTER (WHERE tipo_evento = 'coleccionar') AS coleccionados,
  COUNT(*) FILTER (WHERE tipo_evento = 'like') AS likes,
  /* Weighted CTR: clicks / total_impresiones (estimado por posicion) */
  ROUND(
    COUNT(*) FILTER (WHERE tipo_evento = 'click')::numeric
    / GREATEST(1, COUNT(DISTINCT usuario_id))
  , 4) AS ctr,
  MAX(created_at) AS ultima_actividad
FROM busqueda_eventos
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY query_normalizado, sample_id
WITH DATA;

CREATE UNIQUE INDEX idx_mv_busqueda_rel ON mv_busqueda_relevancia(query_normalizado, sample_id);
```

**Integracion en ranking de busqueda:**

```sql
ORDER BY (
  /* Relevancia textual (actual) */
  1.0 * ts_rank(fts_vector, query)
  + 0.8 * tag_match
  + 0.5 * ts_rank(titulo_vector, query)
  /* Relevancia aprendida (nuevo) */
  + 0.3 * COALESCE(mbr.ctr, 0)
  + 0.4 * LEAST(1.0, COALESCE(mbr.descargas, 0) / 5.0)
  + 0.2 * LEAST(1.0, COALESCE(mbr.coleccionados, 0) / 3.0)
) DESC
```

### Ciclo de aprendizaje

```
1. Usuario busca "trap dark"
2. Backend retorna resultados ordenados por relevancia textual + learned signals
3. Frontend trackea click (POST /busqueda/evento {query, sampleId, tipo:'click', posicion})
4. Si descarga: POST /busqueda/evento {query, sampleId, tipo:'descarga'}
5. mv_busqueda_relevancia se actualiza cada 30 min
6. Siguiente busqueda de "trap dark" incorpora CTR y DAS historico
7. Resultados mas clickeados/descargados suben en ranking organicamente
```

### Protecciones

- **Decaimiento temporal:** Solo considerar eventos de los ultimos 90 dias. Los gustos y la base de datos cambian.
- **Minimo de señales:** No aplicar CTR a queries con < 10 busquedas totales (ruido estadistico).
- **Anti-gaming:** Rate limit en eventos de busqueda (1 click por (usuario, query, sample) por hora). Solo usuarios autenticados.
- **Queries canonicas:** Normalizar con `LOWER(TRIM(unaccent(:query)))` para agrupar variantes ortograficas.

---

## Colecciones como Senal de Relevancia (modelo Pinterest)

### Concepto

Pinterest usa la frecuencia con que un pin aparece en boards (colecciones) como senal fuerte de relevancia. Si un sample aparece en 50 colecciones llamadas "dark trap samples", eso es una senal poderosa de que es relevante para busquedas de "dark trap".

### Implementacion: Collection Frequency Signal

**Paso 1: Indexar nombres de colecciones por sample**

```sql
/* Vista materializada: mapeo sample → tokens de nombres de colecciones que lo contienen */
CREATE MATERIALIZED VIEW mv_sample_coleccion_tokens AS
SELECT
  cs.sample_id,
  to_tsvector('spanish',
    STRING_AGG(DISTINCT c.nombre, ' ')
  ) AS coleccion_fts,
  COUNT(DISTINCT c.id) AS total_colecciones
FROM coleccion_samples cs
JOIN colecciones c ON cs.coleccion_id = c.id
WHERE c.tipo = 'manual' /* solo colecciones creadas por usuarios, no auto-generadas */
GROUP BY cs.sample_id
WITH DATA;

CREATE UNIQUE INDEX idx_mv_sct_sample ON mv_sample_coleccion_tokens(sample_id);
CREATE INDEX idx_mv_sct_fts ON mv_sample_coleccion_tokens USING GIN(coleccion_fts);
```

**Refresh:** Cada 30 min (las colecciones no cambian con alta frecuencia).

**Paso 2: Incorporar en ranking de busqueda**

```sql
/* En la query de busqueda: */
LEFT JOIN mv_sample_coleccion_tokens sct ON s.id = sct.sample_id

ORDER BY (
  /* ... ranking existente ... */
  + 0.25 * COALESCE(
    ts_rank(sct.coleccion_fts, plainto_tsquery('spanish', :query)),
    0
  )
  /* Boost por popularidad en colecciones */
  + 0.10 * LEAST(1.0, COALESCE(sct.total_colecciones, 0) / 20.0)
) DESC
```

**Logica:** Si busco "trap oscuro" y un sample aparece en 15 colecciones cuyos nombres contienen "trap" u "oscuro", ese sample recibe un boost significativo en el ranking. Ademas, samples que estan en muchas colecciones (independiente del nombre) reciben un boost de popularidad suave.

### Extension: "Colecciones similares"

Pinterest tambien sugiere boards similares. Podemos hacer lo mismo:

```sql
/* Dado una coleccion C, encontrar colecciones con samples en comun: */
SELECT c2.id, c2.nombre, COUNT(*) AS samples_comunes
FROM coleccion_samples cs1
JOIN coleccion_samples cs2 ON cs1.sample_id = cs2.sample_id
JOIN colecciones c2 ON cs2.coleccion_id = c2.id
WHERE cs1.coleccion_id = :coleccionId
  AND cs2.coleccion_id != :coleccionId
  AND c2.visibilidad = 'publica'
GROUP BY c2.id, c2.nombre
HAVING COUNT(*) >= 3 /* minimo 3 samples en comun */
ORDER BY COUNT(*) DESC
LIMIT 10;
```

Esto habilita un feature de "Colecciones relacionadas" en la pagina de detalle de coleccion, impulsando descubrimiento.

---

## Redis — Impacto en el Stack

### Caso de uso principal: Cache de flags de usuario + perfil

Redis reemplazaria WP transients para datos frecuentemente accedidos con TTL corto:

| Data | Almacenamiento actual | Con Redis |
| --- | --- | --- |
| Feed cacheado | WP transient (wp_options) | Redis HASH `feed:{userId}:{page}` |
| Perfil usuario | WP transient | Redis HASH `perfil:{userId}` |
| Perfil vector | WP transient | Redis STRING `vec:{userId}` (serializado) |
| Flags usuario (likes, descargas) | 4 EXISTS subqueries | Redis SET `likes:{userId}`, `descargas:{userId}` |
| Serendipia | No cacheado | Redis LIST `serendipia:{userId}` |
| Session/auth | WP transient | Redis STRING `session:{token}` |

### Arquitectura propuesta

```
PHP Request
├── Redis (in-memory, local VPS):
│   ├── GET feed:{userId}:{page} → hit? return
│   ├── SMEMBERS likes:{userId} → flags pre-cargados
│   ├── SMEMBERS descargas:{userId} → flags pre-cargados
│   └── GET perfil:{userId} → perfil pre-cargado
├── PostgreSQL (solo si Redis miss):
│   ├── Query scoring (sin EXISTS subqueries — flags ya cargados de Redis)
│   └── Write-through: guardar resultado en Redis
└── Invalidacion:
    ├── Like evento → SADD likes:{userId} {sampleId} + DEL feed:{userId}:*
    ├── Descarga → SADD descargas:{userId} {sampleId}
    └── Deploy/restart → FLUSHDB (Redis se repuebla organicamente)
```

### Impacto en latencia

| Operacion | Con WP transients | Con Redis |
| --- | --- | --- |
| Cache feed hit | 3-8ms (SQL SELECT wp_options) | 0.1-0.5ms (GET) |
| Cache feed miss + rebuild | 150-400ms | 80-200ms (flags pre-cargados) |
| Invalidacion usuario | 5-15ms (SQL DELETE pattern) | 0.1ms (DEL key) |
| Invalidacion global | 50-200ms (SQL DELETE LIKE) | 1ms (FLUSHDB o SCAN+DEL) |
| Check flags usuario | 4 EXISTS subqueries × 1000 filas | 4 SMEMBERS (pre-cargados) |

### Implementacion en coolify-manager-rs (QL47)

Agregar servicio Redis al Docker Compose del stack de Kamples. Redis no necesita persistencia (AOF) porque actua como cache puro — se repuebla de PostgreSQL tras restart.

```yaml
# En docker-compose de Kamples:
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
  restart: unless-stopped
  networks:
    - internal

# PHP se conecta via: redis://redis:6379
```

---

## Monitoreo y Alertas

### Metricas clave a instrumentar

| Metrica | Umbral alerta | Como medir |
| --- | --- | --- |
| Feed P95 latency | > 300ms | Timer en feedPersonalizado() |
| Feed cache hit rate | < 50% | Contador hits/total |
| PG active connections | > 80% de max | `pg_stat_activity` |
| PG query > 200ms | > 10/min | `log_min_duration_statement = 200` |
| Redis memory usage | > 80% de maxmemory | `INFO memory` |
| MV trending edad | > 15 min | `pg_stat_user_tables.last_autoanalyze` |
| Busqueda P95 latency | > 150ms | Timer en listar() |
| CPU PG | > 70% sostenido | `top` o contenedor metrics |

### Implementacion minima (Fase 1)

Agregar logging de performance en los metodos criticos:

```php
/* En MotorRecomendacion::feedPersonalizado() */
$inicio = microtime(true);
/* ... query ... */
$duracion = (microtime(true) - $inicio) * 1000;
if ($duracion > 200) {
    error_log("[PERF] feedPersonalizado userId={$userId} duracion={$duracion}ms offset={$offset}");
}
```

Esto permite identificar queries lentas en los logs sin instrumentacion externa.

### postgresql.conf recomendado para diagnostico

```
log_min_duration_statement = 200   /* Log queries > 200ms */
log_statement = 'none'             /* No loguear todas, solo lentas */
auto_explain.log_min_duration = 500 /* EXPLAIN automatico para queries > 500ms */
auto_explain.log_analyze = on
auto_explain.log_format = json
```

---

## Modelo de Carga y Proyecciones

### Variables del modelo

```
U = usuarios concurrentes
R = requests/minuto por usuario (feed scroll = ~3-5, busqueda = ~2)
TTL = cache TTL medio (5 min feed, 0 busqueda)
T = tiempo de query sin cache (ms)
C = cache hit rate = 1 - (1 / (TTL * R))
```

### Proyecciones

| Usuarios | Req/min total | Cache miss/min | CPU PG (est.) | Estado |
| --- | --- | --- | --- | --- |
| 10 | 40 | 8 | 5% | OK |
| 50 | 200 | 40 | 25% | OK |
| 100 | 400 | 80 | 50% | Necesita Fase 1 |
| 200 | 800 | 160 | ~80% | Necesita Fase 1 + Redis |
| 500 | 2000 | 200 (con Redis) | ~40% | Necesita Fase 2 + Redis |
| 1000 | 4000 | 200 (con Redis+CDN) | ~30% | Necesita Fase 3 |

**Nota:** Con Redis, el cache hit rate sube a ~90%+ porque la invalidacion es granular (solo el usuario afectado) y no hay overhead de SQL para reads de cache. Los 200 cache miss/min para 500 usuarios asumen que Redis absorbe el 90% de los hits que antes iban a WP transients.

---

## Resumen de Acciones por Prioridad

### Inmediato (QL37 — antes del proximo deploy)

1. **F1.1** Pre-cargar flags usuario en CTEs → eliminar 4 EXISTS por candidato
2. **F1.3** Verificar pipeline candidatos esta activo (log de conteo)
3. Medir latencia real del feed con `microtime()` logging

### Corto plazo (1-2 sprints)

4. **F1.2** Cachear serendipia en transient 2h
5. **F1.4** Pre-calcular percentiles en cron batch
6. **F2.1** Crear columna `tags_enriquecidos` en samples + trigger de sincronizacion
7. **MI-1** pgvector para "Mas Ideas" (colecciones + descargas)
8. **MI-4** Fix proveedor sugerencias para tab coleccionados (QL42)

### Medio plazo (con Redis — QL47)

9. **F2.5** Redis como cache layer: flags usuario, perfil, feed
10. **BN-1** alternative: flags en Redis SET en vez de CTEs
11. Stampede protection con Redis SETNX en vez de wp_cache_add

### Largo plazo (escala a miles)

12. **F2.3** Relevancia adaptativa (tabla busqueda_eventos + MV)
13. **F2.4** Collection Frequency Signal (MV mv_sample_coleccion_tokens)
14. **F3.1** Particionamiento tabla likes/reproducciones/descargas
15. **F3.2** Read replica PostgreSQL
16. **F3.3** CDN para feed anonimo

---

## Lecciones y Gotchas

- [Feed]: El cache de WP transients usa `wp_options` que es una tabla con indice en `option_name`. Con muchos transients, el `autoload` column importa — feeds usan `no` (no autoload). Pero `DELETE ... LIKE` para invalidacion global es un full scan del indice.
- [PG]: `PERCENTILE_CONT` es una aggregate window function que requiere sort completo. No se puede indexar. Pre-calcular siempre.
- [pgvector]: HNSW index tiene tradeoff precision vs velocidad. Default `ef_construction=64` es suficiente para 100K samples. Para 1M+, considerar `ef_construction=128`.
- [Tags]: `UNNEST` de JSONB arrays es caro porque parsea JSON en cada fila. Una columna `text[]` es 3-5x mas rapida para array containment con GIN.
- [Cache]: La invalidacion por patron LIKE en wp_options es O(N) donde N = total de transients. Con 1000 usuarios × 10 paginas = 10K transients solo de feed. Redis SCAN+DEL o pipeline DEL es O(1) por key.
- [Busqueda]: `ts_rank` con GIN index es O(log N) para lookup + O(results) para ranking. Escala bien hasta millones de filas.
- [MV refresh]: `REFRESH MATERIALIZED VIEW CONCURRENTLY` requiere indice UNIQUE. Sin el indice, el refresh bloquea reads (no-concurrently).
