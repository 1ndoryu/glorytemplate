# Algoritmo de Relevancia de Colecciones — 2026-03-21

## Estado actual implementado

> **Actualizado:** 2103A-3. Pesos centralizados en `algoritmoPesos.php['colecciones_explorar']`.
> **Archivos:** `ColeccionesRepository::explorarPublicas()`, `algoritmoPesos.php`

### Branch autenticado (explorarPublicas con userId)

Score compuesto con CTEs en PostgreSQL. Pesos leídos de config (`$pesosAuth`):

```
score = (tag_score * 0.45 * follow_boost) + (likes * 0.20) + (items * 0.15) + (frescura * 0.10)
```

- **tag_score [0.45]:** Afinidad entre tags del usuario (de samples likeados) y tags de la colección.
  - `user_tags` CTE: top 15 tags del usuario ponderados (like=1.0, encanta=2.0)
  - `coleccion_tags` CTE: tags de samples activos de la colección (UNNEST via `SamplesCols::TAGS`)
  - Normalizado por cantidad de tags de la colección para no penalizar colecciones pequeñas
- **follow_boost [multiplicador 1.3]:** Si el usuario sigue al creador (`algoritmoPesos['colecciones_explorar']['follow_boost']`)
- **likes [0.20]:** `LEAST(total_likes / 15, 1.0)` — likes de la colección, normalizado
- **items [0.15]:** `LEAST(total_items / 20, 1.0)` — samples activos en la colección
- **frescura [0.10]:** `1 / (1 + EXTRACT(EPOCH) / (7 * 86400))` — vida media 7 días (suave)
- **propio_boost [100.0]:** Las colecciones del propio usuario siempre van primero

**Cambios 2103A-3:**
- Frescura pasó de vida_media=1 (agresiva) a vida_media=7 (suave). Antes, 1 día ya daba 0.5.
- Se eliminó `updated_at DESC` como tiebreaker — dominaba cuando los scores eran iguales, haciendo que pareciera "por reciente".
- Todos los pesos centralizados en `algoritmoPesos.php` en vez de hardcodeados en SQL.

### Branch no-autenticado

Score multi-factor (antes era solo `total_likes DESC, updated_at DESC`). Pesos leídos de config (`$pesosNoAuth`):

```
score = likes * 0.35 + items * 0.25 + frescura * 0.15 + diversidad * 0.25
```

- **likes [0.35]:** `LEAST(total_likes / 15, 1.0)` — señal social principal
- **items [0.25]:** `LEAST(total_items / 20, 1.0)` — colecciones completas > vacías
- **frescura [0.15]:** `1 / (1 + seconds / (7 * 86400))` — misma vida media que auth
- **diversidad [0.25]:** `LEAST(array_length(tags) / 10, 1.0)` — variedad de tags (metadata IA)

**Cambio clave:** Antes era simplemente `ORDER BY total_likes DESC, updated_at DESC`, que generaba un ordering "por reciente" cuando la mayoría de colecciones tenían 0 likes.

### Samples dentro de colecciones

> **Archivo:** `ColeccionSamplesRepository::samplesDeColeccion()`

Opciones de orden (via `OrdenamientoHelper`):
- **posicion** (default): `cs.posicion ASC, (s.total_likes + s.total_descargas) DESC, cs.added_at DESC`
- **recientes**: `cs.added_at DESC`
- **populares**: `(s.total_likes + s.total_descargas) DESC`
- **nombre**: `s.titulo ASC`
- **bpm**: `s.bpm ASC`

**Cambio 2103A-3:** El tiebreaker de `posicion` pasó de `added_at DESC` a engagement (`total_likes + total_descargas DESC`). Cuando las posiciones son iguales (0/null, la mayoría), los samples se ordenan por popularidad en vez de cronológicamente.

## Fase 2 — Tracking de clicks y búsquedas (pendiente)

Para incorporar engagement directo (clicks en colección, búsquedas que resultaron en click), necesitamos:

### Tabla nueva: `colecciones_eventos`
```sql
CREATE TABLE colecciones_eventos (
    id           SERIAL PRIMARY KEY,
    coleccion_id INTEGER NOT NULL REFERENCES colecciones(id) ON DELETE CASCADE,
    usuario_id   INTEGER REFERENCES usuarios_ext(id) ON DELETE SET NULL,
    tipo         VARCHAR(20) NOT NULL, -- 'click', 'busqueda', 'bookmark', 'share'
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_colecciones_eventos_coleccion ON colecciones_eventos(coleccion_id, created_at DESC);
CREATE INDEX idx_colecciones_eventos_tipo ON colecciones_eventos(tipo, created_at DESC);
```

### Señal en el score
```sql
-- CTE para engagement reciente (últimos 7 días)
evento_score AS (
    SELECT coleccion_id,
           SUM(CASE tipo WHEN 'click' THEN 1 WHEN 'busqueda' THEN 2 WHEN 'bookmark' THEN 3 ELSE 1 END) / 100.0 as engagement
    FROM colecciones_eventos
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY coleccion_id
)
```

Pesos sugeridos con eventos:
```
score = tag_score*0.50 * follow_boost + frescura*0.18 + items*0.12 + likes*0.10 + engagement*0.10
```

### Implementación frontend
- Emitir evento `click` cuando el usuario navega a una colección desde FilaColecciones o la página de explorar
- El endpoint REST sería: `POST /colecciones/{id}/evento` con `tipo`
- No bloquear la navegación: fire-and-forget con `navigator.sendBeacon`

## Gotchas conocidos
- `coleccion_tags` CTE usa `SamplesCols::TAGS` (columna nativa) en vez de metadata JSONB — es más rápido pero menos preciso que metadata
- `$subqueryTagsMeta` usa metadata JSONB (tags IA, más preciso) pero es una subquery correlacionada N veces
- Los dos branches divergen intencionalmente: el CTE de `coleccion_tags` es más costoso y solo justifica su existencia con el alineamiento de user_tags
- El techo de `LEAST(total_likes / 10.0, 1.0)` evita que colecciones virales dominen el algoritmo completamente
