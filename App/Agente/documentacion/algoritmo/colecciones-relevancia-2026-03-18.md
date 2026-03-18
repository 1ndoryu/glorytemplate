# Algoritmo de Relevancia de Colecciones — 2026-03-18

## Estado actual implementado

### Branch autenticado (explorarPublicas con userId)
Score compuesto con CTEs en PostgreSQL:

```
score = (tag_score * 0.55 * follow_boost) + (frescura * 0.20) + (items * 0.15) + (likes * 0.10)
```

- **tag_score [0.55]:** Afinidad entre tags del usuario (de samples likeados) y tags de la colección.
  - `user_tags` CTE: top 15 tags del usuario ponderados (like=1.0, encanta=2.0)
  - `coleccion_tags` CTE: tags de samples activos de la colección (UNNEST via `SamplesCols::TAGS`)
  - Normalizado por cantidad de tags de la colección para no penalizar colecciones pequeñas
- **follow_boost [multiplicador 1.3]:** Si el usuario sigue al creador de la colección
- **frescura [0.20]:** `1 / (1 + dias_desde_update)` — decay suave por tiempo
- **items [0.15]:** `LEAST(total_items / 20, 1.0)` — colecciones con más samples llegan al máximo con 20
- **likes [0.10]:** `LEAST(total_likes / 10, 1.0)` — likes directos de la colección, techo en 10 likes
- **propio_boost [100.0]:** Las colecciones del propio usuario siempre van primero

### Branch no-autenticado
Ordena por `total_likes DESC` primero, luego `updated_at DESC`. Antes era solo `updated_at`.

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
