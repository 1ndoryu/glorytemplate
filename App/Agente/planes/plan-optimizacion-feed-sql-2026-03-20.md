# Plan: Optimización Feed SQL — De 696ms a <100ms (escalable a 1M usuarios)

> **Fecha:** 2026-03-20 (actualizado 2026-03-22)  
> **Tarea:** 2003A-27 + 223A-1  
> **Estado:** Fases 1-3 completadas. Fases 4-5 pendientes para escala >10K samples.  
> **Baseline:** 696.2ms → 4106ms (con 4812 samples) → **470ms post-optimización**  
> **Objetivo:** <100ms con 2,649 samples, <200ms con 100K samples, <500ms con 1M

---

## Respuesta a la pregunta del usuario

**Sí, el desglose EXPLAIN ANALYZE es suficientemente detallado.** Identifica exactamente los 3 cuellos de botella (score_tags LATERAL UNNEST, 2× Window Sort diversidad, cadena de Hash Joins). No se necesita ajustar el logging — la infraestructura de timing actual (AlgoTimingLogger + DesgloseExplain) es correcta.

---

## Diagnóstico: ¿Por qué 696ms?

### Cuello de botella 1: `score_tags` CTE — ~493ms
- Hace `LATERAL UNNEST(etags)` para **2,649 samples** × ~5-10 tags = **15,000-26,000 filas intermedias**
- JOIN con `utag_merged` (tags ponderados del usuario) + GROUP BY sample_id
- El Sort de 493ms es de este UNNEST × JOIN × aggregate
- **Problema fundamental:** Se recalcula la afinidad tag↔usuario EN CADA REQUEST

### Cuello de botella 2: 2× Sort + WindowAgg — ~60ms sorts + acumulación
- `ROW_NUMBER() OVER (PARTITION BY creador_id)` — diversidad por creador
- `ROW_NUMBER() OVER (PARTITION BY genero_diversidad)` — diversidad por género
- Requiere ordenar 2,566 filas 2 veces completas
- Con 100K samples: 2 sorts de 100K filas = inaceptable

### Cuello de botella 3: 11 LEFT JOINs en base_scores — ~105ms exclusivos
- Cada JOIN es un Hash Join O(n) — con 2,649 filas la constante es baja
- Con 100K: 11 × hash builds = significativo
- Muchos JOINs son para flags UI (ya_gustado, ya_descargado, ya_coleccionado) que podrían resolverse post-query

---

## Cómo lo hacen las redes sociales a escala (investigación)

### Meta (Instagram/Facebook)
- **NO calculan scores en query-time.** Tienen pipeline offline (Spark/Flink) que pre-rankea candidatos.
- Almacenan resultados en key-value store (TAO/Cassandra). El feed es un `GET` a la cache.
- Modelo: "push-on-write" para grafos pequeños + "pull-on-read" para cuentas masivas.

### Twitter/X
- **Two-phase retrieval:**
  1. **Recall (candidatos):** ~1500 candidatos de múltiples fuentes (following timeline, trending, embedding ANN, community)
  2. **Ranking:** ML model liviano ranquea los ~1500 → top ~50 para mostrar
- Los features del modelo están pre-computados, no se calculan inline.

### TikTok
- **Embedding-based recall:** pgvector ANN (o equivalente) con HNSW index busca top-K similares al perfil del usuario
- **Lightweight scoring:** Score final = dot product del embedding + 3-4 features simples (freshness, trending, creator affinity)
- La clave es que el embedding captura la señal compleja — no se necesitan 20 CTEs.

### YouTube
- **Pre-computed candidate pools:** Background jobs mantienen pools de candidatos por cada usuario
- **Scoring en 2 capas:** Candidate generation (barato, ANN) → Ranking (caro, neural net con features pre-computados)

### Aplicación a Kamples (insight principal)
El patrón universal es: **separar candidate generation (barato, pre-computed) de scoring detallado (caro, pocos candidatos).** Kamples actualmente hace scoring detallado de TODOS los samples — esto no escala.

---

## Plan de Optimización — 5 Fases

### Fase 1: Índices faltantes + Quick wins SQL (target: 450ms → ~40% reducción)

**Sin cambio de arquitectura, solo SQL.**

1. **Crear índices faltantes:**
   ```sql
   -- Usado en 4 CTEs: user_likes, utag_likes, utag_dislikes, utag_ctx
   CREATE INDEX idx_likes_usuario_tipo_target ON likes(usuario_id, tipo, target_id);
   
   -- Usado en 5 CTEs: utag_repro, utag_tiempo, utag_completadas, repro_peso, ignored
   CREATE INDEX idx_reproducciones_usuario_sample ON reproducciones(usuario_id, sample_id);
   
   -- Usado en 2 CTEs: utag_descargas, user_descargas
   CREATE INDEX idx_descargas_usuario_sample ON descargas(usuario_id, sample_id);
   
   -- Usado en 3 CTEs: user_colecciones, col_propietario, col_imagen_prop
   CREATE INDEX idx_coleccion_samples_sample ON coleccion_samples(sample_id, coleccion_id);
   
   -- Partial index para filtro estado='activo'
   CREATE INDEX idx_samples_activo_id ON samples(id) WHERE estado = 'activo';
   ```

2. **Separar flags UI del scoring:** Los LEFT JOINs para `user_likes`, `user_descargas`, `user_colecciones`, `user_comentarios` solo aportan flags (`ya_gustado`, `ya_descargado`, etc.) que son para la UI, no para el scoring. Mover estos 4 JOINs a un segundo query post-score: `SELECT ... FROM ya_interactuados WHERE sample_id IN (top_50_ids)`. Elimina 4 Hash Joins del query principal.

3. **Activar SelectorCandidatos antes:** Bajar umbral de 5,000 a 2,000 para que precalcule ~1,000 candidatos incluso con 2,649 samples. Reduce la base de operaciones de 2,649 a ~1,000.

**Archivos:** PrecomputadorFeed.php, MotorRecomendacion.php, SelectorCandidatos.php, migration SQL nueva

---

### Fase 2: Materializar tag affinity del usuario (target: 200ms → ~70% reducción)

**Cambio más impactante.** Elimina el cuello de botella #1.

1. **Crear tabla `user_tag_scores`:**
   ```sql
   CREATE TABLE user_tag_scores (
     user_id INT NOT NULL,
     tag TEXT NOT NULL,
     w_likes REAL DEFAULT 0,
     w_repro REAL DEFAULT 0,
     w_tiempo REAL DEFAULT 0,
     w_descargas REAL DEFAULT 0,
     w_completadas REAL DEFAULT 0,
     w_dislikes REAL DEFAULT 0,
     w_ctx REAL DEFAULT 0,
     updated_at TIMESTAMP DEFAULT NOW(),
     PRIMARY KEY (user_id, tag)
   );
   ```

2. **Background job (WP-Cron o CLI):** Recalcular `user_tag_scores` cuando:
   - Usuario da like/dislike → recalcular tags del sample afectado
   - Usuario reproduce sample → incrementar w_repro
   - Periódico (cada hora) → refresh completo
   - Usar `INSERT ... ON CONFLICT DO UPDATE` (upsert atómico)

3. **Simplificar score_tags CTE:**
   ```sql
   -- ANTES: enriched × LATERAL UNNEST(etags) × utag_merged GROUP BY → 15K+ filas
   -- DESPUÉS: enriched × LATERAL UNNEST(etags) × user_tag_scores WHERE user_id=$1 GROUP BY → mismo count pero JOIN directo a tabla indexada
   ```
   
   O mejor aún: **invertir el approach.** En vez de iterar 2,649 samples × N tags, iterar los ~50-100 tags del usuario y buscar samples que contienen esos tags:
   ```sql
   score_tags AS (
     SELECT s.id,
       SUM(uts.w_likes) / NULLIF(array_length(s.tags_enriquecidos, 1), 0) AS likes_score,
       ...
     FROM samples s
     JOIN user_tag_scores uts ON uts.user_id = $1 AND uts.tag = ANY(s.tags_enriquecidos)
     WHERE s.estado = 'activo'
     GROUP BY s.id
   )
   ```
   Con GIN index en `tags_enriquecidos`, esto es O(user_tags × index_lookup) en vez de O(samples × tags_per_sample × hash_join).

**Archivos:** Nuevo migration, PrecomputadorFeed.php (reescribir score_tags), nuevo servicio TagAffinityService.php, WP-CLI command o cron hook

---

### Fase 3: Mover diversidad a PHP (target: 150ms → ~78% reducción)

**Elimina cuello de botella #2.**

1. **Quitar los 2 ROW_NUMBER() del SQL.** El query retorna los top N×3 candidatos ordenados por score.
2. **En PHP, post-query:** Iterar los candidatos y aplicar penalizaciones de diversidad:
   ```php
   // PHP — O(n) scan, n ≈ 100
   $porCreador = []; $porGenero = [];
   foreach ($candidatos as $s) {
       $rc = ++$porCreador[$s->creador_id];
       $rg = ++$porGenero[$s->genero];
       if ($rc > 3) $s->score *= max(0.3, 1 - ($rc - 3) * 0.15);
       if ($rg > 4) $s->score *= max(0.5, 1 - ($rg - 4) * 0.10);
   }
   usort($candidatos, fn($a, $b) => $b->score <=> $a->score);
   ```
3. **Ahorro:** 2 sorts de 2,566 filas + 2 WindowAgg eliminados. Con 100K samples sería 2 sorts de 100K → eliminados.

**Archivos:** MotorRecomendacion.php (quitar scored CTE, añadir diversidad en PHP)

---

### Fase 4: Pipeline de candidatos obligatorio (target: <100ms)

**Arquitectura two-phase como Twitter.**

1. **SelectorCandidatos siempre activo (sin umbral):**
   - Fuente 1: **Embedding ANN** — pgvector HNSW `ORDER BY embedding <=> $profileVector LIMIT 200`  (~5ms con HNSW)
   - Fuente 2: **Seguidos recientes** — últimos 50 samples de usuarios seguidos (~2ms con índice)
   - Fuente 3: **Trending MV** — top 100 de `mv_trending_samples` (~1ms, ya materializado)
   - Fuente 4: **Tag affinity** — samples con tags del top-20 del usuario via GIN index (~10ms)
   - Fuente 5: **Random discovery** — 50 samples aleatorios con `TABLESAMPLE` (~1ms)
   - UNION ALL + DISTINCT → ~500-800 candidatos únicos

2. **Scoring solo sobre candidatos (~500 filas):**
   - `score_tags`: 500 × 5 tags = 2,500 filas en vez de 15,000 → ~100ms → ~35ms
   - 11 JOINs sobre 500 filas en vez de 2,649 → ~20ms
   - Sin window functions (diversidad en PHP)
   - **Total estimado: 50-80ms**

3. **pgvector HNSW index (si no existe):**
   ```sql
   CREATE INDEX idx_samples_embedding_hnsw ON samples 
   USING hnsw (embedding vector_cosine_ops) 
   WITH (m = 16, ef_construction = 200);
   ```
   Reduce similitud coseno de scan completo (O(n)) a ~O(log n) approximate.

**Archivos:** SelectorCandidatos.php (reescribir), MotorRecomendacion.php (siempre usar candidatos), migration HNSW

---

### Fase 5: Pre-computed feeds (target: <10ms, escala a 1M)

**Arquitectura definitiva para producción a escala.**

1. **Tabla `user_feed_cache`:**
   ```sql
   CREATE TABLE user_feed_cache (
     user_id INT NOT NULL,
     sample_id INT NOT NULL,
     score REAL NOT NULL,
     computed_at TIMESTAMP NOT NULL DEFAULT NOW(),
     PRIMARY KEY (user_id, sample_id)
   );
   CREATE INDEX idx_ufc_user_score ON user_feed_cache(user_id, score DESC);
   ```

2. **Background job (cada 5-15min para usuarios activos):**
   - Ejecuta el pipeline completo (candidatos → scoring → diversidad) offline
   - Almacena top 200 candidatos por usuario en `user_feed_cache`
   - Para usuarios inactivos: recalcular cada 1h o bajo demanda

3. **Query final del feed:**
   ```sql
   SELECT s.*, ufc.score
   FROM user_feed_cache ufc
   JOIN samples s ON s.id = ufc.sample_id AND s.estado = 'activo'
   WHERE ufc.user_id = $1
   ORDER BY ufc.score DESC
   LIMIT 50 OFFSET $2
   ```
   **Tiempo: <5ms** (index seek + join + limit)

4. **Invalidación:**
   - Nuevo sample → background job re-rankea para fans del creador + usuarios con tags afines
   - User like/play → actualizar score del sample en cache + recalcular top-20 tags
   - Creador bloqueado → DELETE FROM user_feed_cache WHERE sample_id IN (samples del creador)

5. **Implementación con WordPress:**
   - WP-CLI command: `wp kamples feed rebuild --user=123`
   - WP-Cron scheduled event: recalcular usuarios activos (último login <24h)
   - Queue system: `wp_schedule_single_event()` al detectar interaccción → recalcular async

6. **Fallback:** Si el cache está vacío o stale (>30min), ejecutar pipeline on-demand (Fase 4 → <100ms).

---

## Resumen de impacto estimado

| Fase | Target | Cambio principal | Complejidad |
|------|--------|-----------------|-------------|
| 1 | ~450ms | Índices + separar flags UI + activar candidatos | Baja |
| 2 | ~200ms | Materializar tag affinity usuario | Media |
| 3 | ~150ms | Diversidad en PHP, no SQL | Baja |
| 4 | <100ms | Pipeline candidatos siempre + HNSW | Media-Alta |
| 5 | <10ms | Pre-computed feeds async | Alta |

**Recomendación:** Implementar Fases 1-3 juntas (impacto inmediato ~78% reducción). Fase 4 cuando se superen 10K samples. Fase 5 cuando se apunte a 100K+ samples o 10K+ usuarios concurrentes.

---

## Próximos pasos

1. Implementar Fase 1 (índices + separar flags + candidatos)
2. Medir con EXPLAIN ANALYZE
3. Implementar Fase 2 (tag affinity materializada)
4. Medir de nuevo
5. Implementar Fase 3 (diversidad PHP)
6. Medir resultado final
7. Evaluar si se necesita Fase 4/5 según el target alcanzado

---

## Referencias

- [Meta Engineering Blog: Serving a Billion Personalized News Feeds](https://engineering.fb.com) — Fan-out on write vs pull on read
- [Twitter: The Algorithm](https://github.com/twitter/the-algorithm) — Two-phase ranking, candidate sources
- [pgvector HNSW benchmarks](https://github.com/pgvector/pgvector) — 1M vectors, 99% recall, <5ms
- [PostgreSQL Window Functions Performance](https://www.postgresql.org/docs/current/tutorial-window.html) — Avoid multiple passes
