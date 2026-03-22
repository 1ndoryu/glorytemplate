# Sistema de Búsqueda de Samples

> **Última actualización:** 2026-03-21 (2103A-4)
> **Archivos clave:** `SamplesController.php` (listar + feed), `algoritmoPesos.php` (pesos), `apiSamples.ts`, `tagUtils.ts`

## Arquitectura general

La búsqueda aplica en dos endpoints: `/samples` (listar) y `/feed` (feed/descubrir). Ambos comparten la misma lógica de búsqueda pero con ligeras diferencias de implementación.

El frontend envía dos parámetros:
- `busqueda` — texto original del usuario
- `busqueda_norm` — forma normalizada (sinónimos resueltos), solo se envía si difiere del original

## Motores de búsqueda activos

### 1. Full-Text Search (FTS) — PostgreSQL `to_tsvector`/`plainto_tsquery`
- **Campos:** `titulo`, `descripcion`
- **Idioma:** spanish
- **Prioridad:** Alta (primer filtro)

### 2. ILIKE — Coincidencia parcial
- **Campo:** `titulo`
- **Patron:** `%busqueda%`
- **Prioridad:** Media

### 3. Tags del usuario — UNNEST + ILIKE
- **Campo:** `tags` (array text[])
- **Patrón:** `%busqueda%` en cada tag
- **Contenido:** Tags que el usuario asignó manualmente al sample

### 4. Tags enriquecidos — UNNEST + ILIKE
- **Campo:** `tags_enriquecidos` (array text[], índice GIN)
- **Patrón:** `%busqueda%` en cada tag enriquecido
- **Contenido:** Columna materializada que combina:
  - Tags del usuario (`tags` columna)
  - Géneros (`metadata.genero`)
  - Instrumentos (`metadata.instrumentos`)
  - Emociones (`metadata.emocion`)
  - Artistas similares (`metadata.artista_vibes`) — **agregado en 193A-35**
  - Tags IA (`metadata.tags`) — **agregado en 193A-35**
- **Trigger:** `fn_recalcular_tags_enriquecidos` recalcula automáticamente en INSERT/UPDATE

### 5. Fuzzy search — pg_trgm `word_similarity`
- **Campo:** `titulo`
- **Umbral:** `> 0.3`
- **Prioridad:** Baja (fallback)

### 6. Fuzzy tags — pg_trgm `similarity`
- **Campo:** `tags` (array, cada tag individual)
- **Umbral:** `> 0.4`
- **Prioridad:** Baja (fallback)

### 7. Sinónimos normalizados (193A-34)
- **Campos:** `tags` (ILIKE), `tags_enriquecidos` (ILIKE), `titulo` (ILIKE)
- **Lógica:** Si el frontend envía `busqueda_norm` diferente al original (ej: "guitarra" → "guitar"), expande la búsqueda con la forma normalizada
- **Mapa:** `SINONIMOS_TAGS` en `tagUtils.ts` (vocals→vocal, guitarra→guitar, dnb→drum-and-bass, etc.)

## Campos de metadata (JSONB) — Generados por IA

| Campo | Tipo | Incluido en `tags_enriquecidos` | Buscable |
|-------|------|-------------------------------|----------|
| `tags` | string[] (EN) | ✅ Sí (v070) | ✅ Via tags_enriquecidos |
| `tags_es` | string[] (ES) | ❌ No | ❌ No |
| `genero` | string[] (EN) | ✅ Sí (v058) | ✅ Via tags_enriquecidos |
| `emocion` | string[] (EN) | ✅ Sí (v058) | ✅ Via tags_enriquecidos |
| `emocion_es` | string[] (ES) | ❌ No | ❌ No |
| `instrumentos` | string[] (EN) | ✅ Sí (v058) | ✅ Via tags_enriquecidos |
| `artista_vibes` | string[] | ✅ Sí (v070) | ✅ Via tags_enriquecidos |
| `descripcion_corta` | string (EN) | ❌ No | ❌ No |
| `descripcion_corta_es` | string (ES) | ❌ No | ❌ No |
| `carpeta_primaria` | string | ❌ No | ❌ No |
| `carpeta_secundaria` | string | ❌ No | ❌ No |

## Columnas de la tabla `samples` — Relevancia para búsqueda

| Columna | Buscable | Motor |
|---------|----------|-------|
| `titulo` | ✅ | FTS, ILIKE, fuzzy word_similarity |
| `descripcion` | ✅ | FTS |
| `tags` | ✅ | UNNEST+ILIKE, fuzzy similarity, sinónimos |
| `tags_enriquecidos` | ✅ | UNNEST+ILIKE, sinónimos |
| `bpm` | ❌ | Solo filtro por rango (no texto) |
| `key` | ❌ | Solo filtro exacto (no texto) |
| `escala` | ❌ | Solo filtro exacto |
| `tipo` | ❌ | Solo filtro exacto |
| `formato` | ❌ | No buscable |
| `slug` | ❌ | No buscable |
| `metadata` | Indirecto | Via tags_enriquecidos |

## Qué faltaría mejorar

### Prioridad alta
1. **`tags_es` y `emocion_es` no son buscables** — Un usuario hispanohablante que busque "melódico" no encontrará samples con tag_es "melódico" porque solo se indexa la versión en inglés. Solución: incluir `tags_es` y `emocion_es` en `tags_enriquecidos`.
2. **`descripcion_corta` / `descripcion_corta_es` no indexadas** — La descripción corta IA contiene contexto semántico valioso que no participa en FTS ni ILIKE.

### Prioridad media
3. **Búsqueda por nombre de creador/artista** — Si un usuario busca "userX", no encontrará los samples de ese creador. Requeriría JOIN con tabla de usuarios.
4. **Búsqueda por nombre de colección** — Samples dentro de "Dark Trap Kit" no son encontrables buscando "Dark Trap Kit".

### Prioridad baja
5. **Synonyms en español completos** — El mapa `SINONIMOS_TAGS` solo cubre unos pocos sinónimos básicos. Ampliar con más traducciones comunes.
6. ~~**Ranking/scoring de resultados**~~ — **IMPLEMENTADO en 2103A-4.** Ver sección "Scoring de resultados" abajo.
7. **Autocomplete/sugerencias** — No existe un endpoint de sugerencias de búsqueda basado en tags frecuentes o términos populares.

## Scoring de resultados de búsqueda

> **Config:** `algoritmoPesos.php['busqueda']`
> **Implementación:** `SamplesController::listar()` — ORDER BY multi-factor

Cuando hay término de búsqueda (≥2 caracteres), los resultados se ordenan por score compuesto:

```
score = ts_rank_weight * ts_rank
      + tag_match_boost * tag_score
      + titulo_boost * titulo_rank
      + fuzzy_boost * fuzzy_rank
      + titulo_exacto_boost * titulo_exacto
```

### Señales y pesos (desde `algoritmoPesos.php`)

| Señal | Peso | Fuente SQL | Descripción |
|-------|------|-----------|-------------|
| `ts_rank` | 1.0 | `ts_rank(to_tsvector(titulo \|\| descripcion), plainto_tsquery)` | Full-text search nativo PostgreSQL (stemming, stop words) |
| `tag_match` | 0.8 | `CASE WHEN EXISTS(UNNEST(tags) ILIKE)` | 1.0 si algún tag coincide, 0.0 si no |
| `titulo_rank` | **1.5** | `ts_rank(to_tsvector(titulo), plainto_tsquery)` | FTS solo sobre título (mayor especificidad que título+desc) |
| `fuzzy_rank` | 0.6 | `word_similarity(query, titulo)` | pg_trgm — tolerancia a typos, retorna [0,1] |
| `titulo_exacto` | **2.0** | `CASE WHEN titulo ILIKE query\|\|'%'` | 1.0 si el título empieza con el query exacto (ILIKE) |

### Cambios 2103A-4
- `titulo_boost` subido de **0.5 → 1.5**: el título es la señal más importante cuando el usuario busca un sample por nombre.
- **Nuevo:** `titulo_exacto_boost` = 2.0: si el título empieza con el query (ej: búsqueda "kick" → "Kick 808 Trap"), recibe +2.0 puntos extra.  
  Esto resuelve el problema de que búsquedas exactas quedaban detrás de matches parciales en tags o descripción.

### Tiebreaker
Si dos samples tienen el mismo score, se resuelve por `publicado_at DESC NULLS LAST`.

### Pesos efectivos (ejemplo: "kick")
Un sample llamado "Kick 808 Trap" con tag "kick" obtendría:
- ts_rank(titulo+desc) ≈ 0.2 × 1.0 = **0.20**
- tag_match = 1.0 × 0.8 = **0.80**
- ts_rank(titulo) ≈ 0.4 × 1.5 = **0.60**
- word_similarity ≈ 0.5 × 0.6 = **0.30**
- titulo_exacto = 1.0 × 2.0 = **2.00**
- **Total ≈ 3.90**

Un sample con "Trap Beat" y tag "kick drum": 
- ts_rank = 0, tag_match = 0.8, titulo_rank = 0, fuzzy = 0.2 × 0.6, titulo_exacto = 0
- **Total ≈ 0.92**

→ El sample cuyo título es "Kick..." aparece primero, como espera el usuario.
