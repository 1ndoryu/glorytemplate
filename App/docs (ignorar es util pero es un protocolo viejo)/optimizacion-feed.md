# Optimizacion del Feed de Samples — Analisis, Plan y Estrategia para 1M

> **Version:** 2.0 | **Ultima actualizacion:** 2026-03-15 | **Contexto:** QK17 + QK21

## Estado de Optimizaciones

| ID | Optimizacion | Estado | Impacto |
|----|-------------|--------|---------|
| Opt-1 | Cache perfil usuario (30 min transient) | IMPLEMENTADA | Elimina 7 queries por cache miss |
| Opt-2 | CTE unificado perfil (7 queries a 2) | IMPLEMENTADA | -5 roundtrips BD |
| Opt-3 | Sincronizar invalidacion cache | IMPLEMENTADA | Perfil no se recalcula en cada miss |
| Opt-4 | TTL diferenciado por pagina (5/15 min) | IMPLEMENTADA | -70% recalculos paginas 2+ |
| Opt-5 | Stale-While-Revalidate frontend | IMPLEMENTADA | Percepcion instantanea |
| Opt-6 | Pipeline dos etapas (candidatos/scoring) | IMPLEMENTADA | De O(N) a O(~1000) |
| Opt-7 | Indices especializados feed 1M | IMPLEMENTADA | Candidate stage usa index scans |
| Opt-8 | Vista materializada trending | IMPLEMENTADA | Elimina 4 subqueries correlacionadas |
| Opt-9 | Tags enriquecidos pre-computados | PENDIENTE | Elimina ~7 JSONB parses por fila |
| Opt-10 | Paginacion por cursor (keyset) | PENDIENTE | O(1) vs O(offset) en paginas profundas |
| Opt-11 | Tabla materializada de scores por usuario | PENDIENTE | O(1) feed para usuarios activos |
| Opt-12 | Read replica para queries de feed | PENDIENTE | Descarga del primary |
| Opt-13 | Warming proactivo para usuarios activos | PENDIENTE | Cache hit rate 99%+ |

---

## Problema Central: Escalabilidad a 1M Samples

### Diagnostico del cuello de botella principal

El feed actual funciona asi:

```
GET /feed → MotorRecomendacion::feedPersonalizado()
  1. Cache check (transient) → HIT: retorna inmediatamente
  2. MISS: construir query CTE con 6 senales
  3. FROM samples s WHERE estado = 'activo'  ← FULL TABLE SCAN
     - POR CADA FILA (~20 subconsultas correlacionadas):
       - 5 subfactores comportamiento (tags JSONB parse x7 por subfactor)
       - 4 subfactores tendencias (COUNT en likes/repro/descargas/follows con filtro temporal)
       - 2 subfactores grafo social (IN subquery follows)
       - 1 distancia coseno pgvector
       - 4 flags de estado (reaccion, coleccionado, guardado, comentado)
       - 3 multiplicadores (penalizacion repro, pasiva, saturacion)
  4. ORDER BY score DESC LIMIT 12
```

PostgreSQL **no puede** aplicar LIMIT antes de calcular el score de CADA sample porque el ORDER BY depende del score calculado. Esto significa:

| Samples activos | Filas evaluadas | Subqueries ejecutadas | Tiempo estimado (sin cache) |
|-----------------|-----------------|----------------------|----------------------------|
| 100 | 100 | ~2,000 | 150-300ms |
| 1,000 | 1,000 | ~20,000 | 500ms-1s |
| 10,000 | 10,000 | ~200,000 | 2-5s |
| 100,000 | 100,000 | ~2,000,000 | 20-50s |
| **1,000,000** | **1,000,000** | **~20,000,000** | **INACEPTABLE** |

### Solucion arquitectonica: Pipeline de dos etapas

En vez de evaluar 1M samples con scoring completo, separar en dos fases:

**Etapa 1 — Seleccion rapida de candidatos** (O(log N) con indices):
Usar 5 fuentes de candidatos con index scans rapidos, cada una retorna ~200-300 IDs:

| Fuente | Query | Indice usado | Max candidatos |
|--------|-------|-------------|----------------|
| Trending recientes | 14 dias, ORDER BY engagement | idx_samples_estado (btree) + Sort | 300 |
| Similares embedding | ANN pgvector <=> perfil | idx_samples_embedding (HNSW) | 200 |
| Creadores seguidos | WHERE creador_id IN (seguidos) | idx_follows_seguidor + idx_samples_creador | 200 |
| Afinidad por tags | WHERE tags && userTags | idx_samples_tags (GIN) | 200 |
| Populares all-time | ORDER BY engagement global | idx_samples_engagement_activo (btree) | 100 |

Total: ~1000 candidatos unicos (UNION elimina duplicados).

**Etapa 2 — Scoring completo** (solo ~1000 filas):
Aplicar las 6 senales + multiplicadores + diversidad solo sobre los candidatos pre-seleccionados.

**Resultado:** De O(1M * 20) subconsultas a O(1000 * 20) = **reduccion 1000x**.

---

## Arquitectura Actual (Post Opt-1 a Opt-8)

### Backend

```
GET /feed?tipo=descubrir&page=1&per_page=12
  |
  +-> SamplesController::feed()
  |     Rate limit anonimos (60/min por IP)
  |
  +-> MotorRecomendacion::feedPersonalizado($userId, $limite, $offset)
  |     +-- Cache check: transient kamples_feed_{userId}_{limite}_{offset}
  |     |   TTL: 300s pagina 1 / 900s paginas 2+
  |     |   HIT -> retorna inmediatamente
  |     |
  |     +-- PerfilUsuario::construir($userId)
  |     |   Cache: transient kamples_perfil_usr_{userId} (30 min)
  |     |   CTE unificado: 2 queries (perfil base + creadores favoritos)
  |     |
  |     +-- [Opt-6] SelectorCandidatos::seleccionar($userId, $perfil, &$params)
  |     |   Si totalActivos > umbral (5000): 5 fuentes UNION -> ~1000 IDs
  |     |   Si totalActivos <= umbral: sin filtro (todas las filas, compatible legacy)
  |     |
  |     +-- ConstructorSenales (6 senales SQL)
  |     |   Comportamiento(0.27) + Contexto(0.15) + Tendencias(0.12) + ...
  |     |
  |     +-- [Opt-8] JOIN mv_trending_samples (vista materializada)
  |     |   Reemplaza 4 subqueries correlacionadas de tendencias
  |     |   Refresh: cada 10 min via WP Cron / crontab VPS
  |     |
  |     +-- CTE 3 niveles: candidatos -> base_scores -> scored
  |     |   Scoring solo sobre candidatos pre-filtrados
  |     |   ROW_NUMBER PARTITION BY creador_id (diversidad)
  |     |
  |     +-- Serendipia: inyectar samples aleatorios cada N posiciones
  |     +-- Cache: guardar en transient
  |
  +-> NormalizadorSample::normalizarLista() -> JSON response
```

### Frontend

```
useFeedSamples (hook principal)
  +-- Carga paginada: page 1, 2, 3... (per_page=12)
  +-- Infinite scroll: IntersectionObserver + throttle progresivo
  +-- Virtualizacion: solo renderiza elementos visibles (max 50)
  +-- Cache in-memory: cacheFeedRef por clave+pagina
  +-- Stale-While-Revalidate: muestra datos y revalida en background
  +-- Race condition guard: requestIdRef
  +-- CRUD listeners: eliminado, restaurado, actualizado, creado
```

### Cache

| Capa | Clave | TTL | Que cachea | Invalidacion |
|------|-------|-----|------------|--------------|
| Feed pagina 1 | kamples_feed_{userId}_{limite}_0 | 300s (5 min) | Resultado JSON completo | Like/follow/nuevo sample |
| Feed paginas 2+ | kamples_feed_{userId}_{limite}_{offset} | 900s (15 min) | Idem | Idem |
| Perfil usuario | kamples_perfil_usr_{userId} | 1800s (30 min) | Preferencias calculadas | PlanificadorAlgoritmo |
| Perfil vectorial | kamples_perfil_vec_{userId} | 3600s (1h) | Embedding 128 dims | GeneradorEmbeddings |
| pgvector check | kamples_pgvector_activo | 3600s (1h) | Bool disponibilidad | Auto |
| Saturacion stats | kamples_saturacion_stats | 3600s (1h) | Percentiles P75/P95 | Auto |
| Total activos | kamples_total_samples_activos | 3600s (1h) | COUNT(*) samples activos | Publicar/eliminar sample |
| Trending MV | mv_trending_samples | ~10 min | Aggregated trending scores | REFRESH MATERIALIZED VIEW |
| Frontend | cacheFeedRef[key+page] | Session | Datos feed por pagina | Navegacion |

---

## Optimizaciones Implementadas (Detalle)

### Opt-1: Cache de Perfil de Usuario (WP Transient)

**Archivo:** `App/Kamples/Services/PerfilUsuario.php`

Cache del resultado de `construir()` en transient con TTL de 30 minutos.
El perfil solo cambia con acumulacion de interacciones, no con cada like individual.

- **Clave:** `kamples_perfil_usr_{userId}`
- **TTL:** 1800s (30 minutos)
- **Invalidacion:** PlanificadorAlgoritmo (recalculo rapido/preciso)
- **Impacto:** Elimina 7 queries en cada cache miss del feed

### Opt-2: CTE Unificado del Perfil (7 queries a 2)

**Archivo:** `App/Kamples/Database/Repositories/UsuariosExtRepository.php`

Metodo `perfilCompletoParaAlgoritmo($userId)` combina interacciones + BPM + key + escala + tipo en una sola CTE. Creadores favoritos en query separada (estructura diferente).

### Opt-3: Sincronizar Invalidacion de Cache

**Archivo:** `App/Kamples/Services/PlanificadorAlgoritmo.php`

Recalculo rapido invalida cache feed + perfil. Recalculo preciso tambien invalida embeddings.

### Opt-4: TTL Diferenciado por Pagina

**Archivo:** `App/Kamples/Services/MotorRecomendacion.php`

Pagina 1: 5 min. Paginas 2+: 15 min. Reduce recalculos en infinite scroll.

### Opt-5: Stale-While-Revalidate Frontend

**Archivo:** `App/React/hooks/useFeedSamples.ts`

Muestra datos en memoria inmediatamente mientras revalida en background.

---

### Opt-6: Pipeline de Dos Etapas — SelectorCandidatos (IMPLEMENTADA)

**Archivos:**
- `App/Kamples/Services/SelectorCandidatos.php` (nuevo)
- `App/Kamples/Services/MotorRecomendacion.php` (modificado)
- `App/Kamples/Config/algoritmoPesos.php` (nuevo bloque `candidatos`)

**Problema:** El CTE evalua TODAS las filas de `samples` para calcular score. A 1M samples = 1M evaluaciones con 20+ subqueries correlacionadas por fila.

**Solucion:** Pre-seleccionar ~1000 candidatos via index scans rapidos, luego scoring solo sobre esos.

**5 fuentes de candidatos:**

1. **Trending recientes (300):** Samples de los ultimos 14 dias ordenados por engagement.
   - Query: `WHERE estado = 'activo' AND publicado_at > NOW() - INTERVAL '14 days' ORDER BY (total_likes*2 + total_reproducciones + total_descargas*3) DESC`
   - Indice: `idx_samples_estado` (btree on estado, publicado_at)

2. **Similares por embedding (200):** ANN search con perfil vectorial del usuario.
   - Query: `WHERE estado = 'activo' AND embedding IS NOT NULL ORDER BY embedding <=> :perfil_vector::vector`
   - Indice: `idx_samples_embedding` (HNSW coseno)
   - Solo si pgvector esta activo y el usuario tiene perfil vectorial

3. **De creadores seguidos (200):** Samples de creadores que el usuario sigue.
   - Query: `WHERE estado = 'activo' AND creador_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId) ORDER BY publicado_at DESC`
   - Indice: `idx_follows_seguidor` (nuevo) + `idx_samples_creador`

4. **Afinidad por tags (200):** Samples que comparten tags con los liked del usuario.
   - Query: `WHERE estado = 'activo' AND tags && ARRAY[:topTags]::text[]`
   - Indice: `idx_samples_tags` (GIN)

5. **Populares all-time (100):** Top samples por engagement global.
   - Query: `WHERE estado = 'activo' ORDER BY (total_likes + total_reproducciones + total_descargas) DESC`
   - Indice: `idx_samples_engagement_activo` (nuevo, expression index)

**Activacion:** Solo cuando `SelectorCandidatos::contarActivos() > umbral_candidatos` (default 5000). Debajo del umbral, el pipeline legacy (scan completo) sigue funcionando.

**Complejidad resultado:**
- Pre-seleccion: O(log N) por fuente (index scans) = ~5 * O(log 1M) = ~100 seeks
- Scoring: O(1000 * 20 subqueries) = 20,000 operaciones
- vs legacy: O(1M * 20) = 20,000,000 operaciones
- **Mejora: ~1000x**

---

### Opt-7: Indices Especializados para Feed 1M (IMPLEMENTADA)

**Archivo:** `App/Kamples/Database/migrations/v050_indices_feed_1m.sql`

Indices creados para soportar el pipeline de dos etapas:

| Indice | Tabla | Columnas | Tipo | Proposito |
|--------|-------|----------|------|-----------|
| idx_follows_seguidor | follows | seguidor_id, seguido_id | BTREE | Fuente "creadores seguidos" |
| idx_samples_engagement_activo | samples | expression(engagement) DESC | BTREE partial | Fuente "populares all-time" |
| idx_likes_trending_24h | likes | target_id, created_at | BTREE partial | Where tipo='sample' |
| idx_reproducciones_sample_created | reproducciones | sample_id, created_at | BTREE | Trending counts |
| idx_descargas_sample_created | descargas | sample_id, created_at | BTREE | Trending counts |

---

### Opt-8: Vista Materializada de Trending (IMPLEMENTADA)

**Archivo:** `App/Kamples/Database/migrations/v050_indices_feed_1m.sql`

Vista materializada `mv_trending_samples` que pre-agrega metricas de tendencia:
- Likes 24h (ponderados: encanta=2, like=1, dislike=-1)
- Reproducciones 24h
- Descargas 7d
- Follows del creador 7d

**Refresh:** `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_samples`
- Cada 5 minutos via `kamples_algoritmo_cron` en `KamplesInit.php`
- `CONCURRENTLY` permite lecturas durante refresh (requiere unique index)
- Si la MV no existe, el cron la skipea silenciosamente

**Integración:**
- `MotorRecomendacion`: detecta existencia de MV (transient 1h), agrega `LEFT JOIN mv_trending_samples mvt`
- `ConstructorSenales::sqlTendencias($usarVistaMatTrending)`: si true, usa `COALESCE(mvt.likes_24h, 0)` etc.
- Si la MV no existe (pre-migration), el sistema usa subqueries correlacionadas como fallback

**Impacto en scoring:** La senal de Tendencias ahora hace un JOIN en vez de 4 subqueries correlacionadas:
```sql
-- ANTES (por cada fila de sample):
COALESCE((SELECT COUNT(*) FROM likes WHERE target_id = s.id AND created_at > NOW() - INTERVAL '24 hours'), 0)
COALESCE((SELECT COUNT(*) FROM reproducciones WHERE sample_id = s.id AND created_at > NOW() - INTERVAL '24 hours'), 0)
-- ... (x4 subqueries)

-- DESPUES (un solo JOIN):
LEFT JOIN mv_trending_samples mvt ON mvt.sample_id = s.id
-- mvt.likes_24h, mvt.repro_24h, mvt.descargas_7d, mvt.follows_7d ya calculados
```

Elimina 4 subqueries correlacionadas por fila = a 1000 candidatos, -4000 subqueries.

---

## Optimizaciones Pendientes (Plan Detallado)

### Opt-9: Tags Enriquecidos Pre-computados

**Problema:**
`sqlTagsEnriquecidos('s')` se llama ~7 veces por fila en la senal de comportamiento. Cada llamada:
1. Lee `s.tags` (array text[])
2. Parsea `s.metadata->'genero'` (JSONB)
3. Parsea `s.metadata->'instrumentos'` (JSONB)
4. Parsea `s.metadata->'emocion'` (JSONB)
5. UNNEST + LOWER + ARRAY_AGG + filtro nulls

A 1000 filas * 7 llamadas = 7000 JSONB parses que producen el mismo resultado.

**Solucion:**
1. Agregar columna `tags_enriquecidos text[]` a tabla `samples`
2. Trigger (o logica PHP en save) que pre-computa los tags enriquecidos al guardar sample
3. Migration backfill para samples existentes
4. Usar `s.tags_enriquecidos` directamente en vez de llamar `sqlTagsEnriquecidos()`
5. ConstructorSenales: verificar `tags_enriquecidos IS NOT NULL`, fallback a calculo inline

**Impacto estimado:** -7000 JSONB parses por feed request = ~30-50ms ahorro.

**Complejidad:** Media. Requiere migration + trigger + backfill + update de ConstructorSenales.

---

### Opt-10: Paginacion por Cursor (Keyset)

**Problema:**
`OFFSET 120` obliga a PostgreSQL a calcular y descartar 120 filas. A paginas profundas esto crece linealmente. Con 100 paginas * 12 items = OFFSET 1200.

**Solucion:**
Usar keyset pagination basado en score + id:
```
Pagina 1: ORDER BY score DESC, id DESC LIMIT 12
Pagina 2: WHERE (score, id) < (:lastScore, :lastId) ORDER BY score DESC, id DESC LIMIT 12
```

**API cambio:**
```
GET /feed?cursor=eyJzY29yZSI6MC44NSwidWx0aW1vSWQiOjEyMzR9&per_page=12
```

El cursor es un JSON base64 con `{score, ultimoId}` del ultimo item de la pagina anterior.

**Complejidad:** Media. Requiere cambio en API contract (backward compatible: cursor param opcional, OFFSET como fallback).

**Impacto:** O(1) para cualquier pagina, vs O(offset) actual.

---

### Opt-11: Tabla Materializada de Scores por Usuario

**Problema:**
Incluso con el pipeline de dos etapas, el scoring completo se ejecuta en cada cache miss (cada 5 min para pagina 1). Con 10K usuarios activos concurrentes = 10K recalculos/5min = 33/segundo.

**Solucion:**
Tabla `feed_scores_precalculados`:
```sql
CREATE TABLE feed_scores_precalculados (
    usuario_id INT NOT NULL,
    sample_id INT NOT NULL,
    score FLOAT NOT NULL,
    calculado_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (usuario_id, sample_id)
);
CREATE INDEX idx_fsp_usuario_score ON feed_scores_precalculados(usuario_id, score DESC);
```

**Flujo:**
1. Background job (cron cada 30 min): Para cada usuario activo, calcular top 200 scores y guardar en tabla
2. Feed request: `SELECT * FROM feed_scores_precalculados WHERE usuario_id = :id ORDER BY score DESC LIMIT 12 OFFSET :offset`
3. Si no hay datos pre-calculados o estan viejos (> 1h): fallback a calculo real-time

**Feed de tabla materializada = O(1)** (index scan en PK compuesto).

**Complejidad:** Alta. Requiere:
- Migration crear tabla
- Background worker (WP Cron o standalone script)
- Logica de fallback cuando no hay datos
- Invalidacion selectiva al publicar nuevo sample / interaccion significativa

---

### Opt-12: Read Replica para Queries de Feed

**Problema:**
A escala, queries pesadas del feed compiten con writes (likes, reproducciones, uploads).

**Solucion:**
PostgreSQL streaming replication con read-only replica:
- Feed queries: replica
- Writes (likes, uploads): primary
- Lag aceptable: < 1 segundo

**Implementacion:**
- PHP: connection factory que rutea a replica para operaciones de lectura
- Configuracion: env var `KAMPLES_PG_READ_HOST` apuntando a replica

**Complejidad:** Alta (infra). Requiere segundo contenedor PostgreSQL + pg_hba.conf + streaming setup.

---

### Opt-13: Cache Warming Proactivo

**Problema:**
Primer request de un usuario activo despues del TTL siempre es un cache miss.

**Solucion:**
Background job que pre-calcula el feed para los N usuarios mas activos antes de que expire el cache:
1. Mantener lista de usuarios activos (actualizacion en cada request)
2. 1 minuto antes de que expire el cache: recalcular el feed y guardar en transient

**Impacto:** Cache hit rate de ~99% para usuarios activos (solo el primer request del dia es miss).

**Complejidad:** Media. Requiere tracking de usuarios activos + cron job.

---

## Estimaciones de Performance a Escala

### Con Opt-1 a Opt-8 (implementadas)

| Samples | Cache HIT | Cache MISS (scoring) | MISS + serendipia |
|---------|-----------|---------------------|-------------------|
| 100 | 0ms | ~100ms | ~120ms |
| 1,000 | 0ms | ~100ms | ~120ms |
| 10,000 | 0ms | ~150ms | ~170ms |
| 100,000 | 0ms | ~200ms | ~220ms |
| 1,000,000 | 0ms | ~300ms | ~320ms |

El pipeline de dos etapas mantiene el scoring en ~1000 candidatos independiente del total.
El cuello de botella pasa a ser la etapa 1 (5 index scans) que crece O(log N).

### Con Opt-9 a Opt-13 (futuras)

| Samples | Cache HIT | Cache MISS | Con tabla materializada |
|---------|-----------|------------|------------------------|
| 1,000,000 | 0ms | ~200ms | ~5ms (index scan) |
| 5,000,000 | 0ms | ~300ms | ~5ms |
| 10,000,000 | 0ms | ~400ms | ~5ms |

---

## Lecciones

- [Cache]: El perfil de usuario era el cuello de botella real con 100 samples, no el scoring
- [Invalidacion]: Invalidar todo el cache en cada like es demasiado agresivo
- [Frontend]: Stale-while-revalidate es la forma correcta de percibir carga instantanea
- [Escalabilidad]: El scoring O(N) es aceptable hasta ~5K samples. Despues, filtrar candidatos primero
- [pgvector HNSW]: ANN search es O(log N), ideal para candidate selection
- [Vista materializada]: Ideal para aggregaciones costosas que cambian lentamente (trending 24h/7d)
- [Indices parciales]: `WHERE estado = 'activo'` reduce el tamano del indice en ~50% (eliminados/inactivos)
- [Expression index]: PG puede usar expression indices para ORDER BY si la expresion coincide exactamente
- [Tags enriquecidos]: JSONB parsing es caro cuando se repite. Pre-computar en columna dedicada
- [Cursor pagination]: OFFSET es O(offset), keyset es O(1). Critico para deep scrolling
- [SQL]: Las 7 queries separadas del perfil comparten la misma lógica base (samples interactuados) — un CTE las unifica en 1 roundtrip
