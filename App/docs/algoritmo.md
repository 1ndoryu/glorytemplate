# Algoritmo de Recomendacion Kamples

> Documentacion tecnica del sistema de descubrimiento.
> Ultima actualizacion: sesion AG-ALG (27/02/2026) — verificado contra codigo fuente.
> Revision completa: sesion AG-ALG (auditoría 20 puntos, mismo dia).

---

## Resumen

El algoritmo combina **6 senales ponderadas** para generar un score por sample candidato. Cada senal produce un valor **estrictamente** entre 0 y 1 (bounded con `LEAST(1.0, ...)` y `GREATEST(0, ...)`), que se multiplica por su peso y se suma. El score total se ajusta con multiplicadores de penalizacion por repeticion, boost verificado, y diversidad por creador. Todo es configurable desde `algoritmoPesos.php`.

## Arquitectura (archivos)

| Capa           | Ruta completa                                                | Responsabilidad                                              |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Orquestacion   | `App/Kamples/Services/MotorRecomendacion.php`                | Feed personalizado, cache transients, samples similares      |
| SQL Scoring    | `App/Kamples/Services/ConstructorSenales.php`                | Fragmentos SQL ponderados para las 6 senales                 |
| Perfil         | `App/Kamples/Services/PerfilUsuario.php`                     | BPM prom, key fav, tipo fav, escala fav, top 5 creadores    |
| Embeddings     | `App/Kamples/Services/GeneradorEmbeddings.php`               | Vectores 128d, perfil usuario (cacheado), pgvector coseno    |
| Planificador   | `App/Kamples/Services/PlanificadorAlgoritmo.php`             | Triggers de recalculo por interacciones + cron temporal      |
| Config         | `App/Kamples/Config/algoritmoPesos.php`                      | Todos los pesos, parametros, frecuencias, variantes          |
| Repo Algoritmo | `App/Kamples/Database/Repositories/AlgoritmoEstadoRepository.php` | CRUD tabla `algoritmo_estado` (contadores recalculo)    |
| Repo Usuarios  | `App/Kamples/Database/Repositories/UsuariosExtRepository.php` | Queries perfil: BPM promedio, key fav, escala fav, creadores fav |
| Repo Samples   | `App/Kamples/Database/Repositories/SamplesRepository.php`    | Interacciones para perfil (con decay temporal), pgvector, embeddings |

### Dependencia entre capas

```
MotorRecomendacion (orquestador)
├── ConstructorSenales (genera SQL para cada senal)
│   └── GeneradorEmbeddings (perfil vectorial para similitud)
├── PerfilUsuario (preferencias del usuario)
│   └── UsuariosExtRepository (queries de perfil + escala favorita)
├── SamplesRepository (ejecucion SQL final)
├── NormalizadorSample (SELECT base con flags usuario)
└── PlanificadorAlgoritmo (gestiona recalculo)
    └── AlgoritmoEstadoRepository (tabla de contadores + filtrado SQL)
```

---

## Las 6 Senales

```
score_total = SUM(peso_i * senal_i) * penalizacion_repeticion * boost_verificado
score_final = score_total * penalizacion_diversidad_creador
```

| #   | Senal               | Peso     | Descripcion                                                                            |
| --- | ------------------- | -------- | -------------------------------------------------------------------------------------- |
| 1   | Similitud Contenido | **0.25** | Distancia coseno pgvector entre embedding del sample y el perfil del usuario           |
| 2   | Comportamiento      | **0.25** | Tags enriquecidos vs interacciones (5 sub-factores + penalizacion dislike)             |
| 3   | Contexto            | **0.15** | Match de BPM, key, escala, genero, tipo y creador afin (6 sub-factores, suman 1.0)    |
| 4   | Tendencias          | **0.15** | Velocidad de engagement reciente normalizada por edad (4 sub-factores, bounded [0,1])  |
| 5   | Grafo Social        | **0.10** | Contenido de creadores seguidos y likeado por seguidos (2 sub-factores)                |
| 6   | Novedad             | **0.10** | Boost logaritmico decreciente para samples nuevos (14 dias)                            |

> Los pesos son configurables desde `algoritmoPesos.php['senales']` y **DEBEN sumar 1.0**. Los sub-pesos dentro de cada senal tambien deben sumar 1.0. MotorRecomendacion los lee dinamicamente al construir la query.

---

## Tags Enriquecidos (concepto transversal)

Multiples senales usan **tags enriquecidos** en vez de `s.tags` directamente. Definidos en `ConstructorSenales::sqlTagsEnriquecidos()`:

```sql
COALESCE(s.tags, ARRAY[]::text[])
|| /* metadata.genero: array o string → array */
|| /* metadata.instrumentos: array o string → array */
|| /* metadata.emocion: array o string → array */
```

- Maneja `jsonb_typeof` para soportar tanto arrays como strings en cada campo JSONB.
- Se usa con alias parametrico (`s`, `s2`, `s7`, etc.) para diferentes contextos en la query.
- El alias se valida con regex `^[a-z_][a-z0-9_]*$` para prevenir SQL injection.
- **Resultado:** Un array de texto que combina tags manuales + metadata IA, usado para comparar afinidad.

---

## Detalle de cada Senal

### 1. Similitud Contenido (0.25) — pgvector coseno

Usa **pgvector** con distancia coseno entre el embedding del sample candidato y el vector de perfil del usuario. Solo se activa si pgvector esta disponible (`SamplesRepository::verificarPgvector()` verifica extension `vector` + columna `embedding`).

```sql
GREATEST(0, 1 - (s.embedding <=> :userProfileVector::vector) / 2)
```

- Operador `<=>`: distancia coseno. 0 = identicos, 2 = opuestos.
- Conversion a similitud: `1 - distancia/2` → rango [0, 1].
- Si el sample no tiene embedding: retorna 0.
- Si pgvector no esta disponible: la senal completa se omite (fail-open, no rompe el feed).
- **Check pgvector cacheado**: El resultado de `verificarPgvector()` se cachea en WP transient `kamples_pgvector_activo` con TTL de 1 hora, ademas del cache estatico en memoria por request.

**Vector de perfil del usuario** (`GeneradorEmbeddings::perfilUsuario()`):

Promedio ponderado de embeddings de todos los samples con los que el usuario ha interactuado, **con decay temporal exponencial**, normalizado a vector unitario (magnitud 1):

| Tipo interaccion         | Peso base | Fuente tabla      |
| ------------------------ | --------- | ----------------- |
| Likes (like + encanta)   | 3         | `likes`           |
| Descargas                | 5         | `descargas`       |
| Reproducciones completas | 2         | `reproducciones`  |
| Reproducciones normales  | 1         | `reproducciones`  |

**Decay temporal**: Cada interaccion recibe un multiplicador `EXP(-dias / 30)` donde `dias = EXTRACT(EPOCH FROM NOW() - fecha) / 86400`. Interacciones de hace 30 dias pesan ~37% del original, 60 dias ~13%, 90 dias ~5%. Esto asegura que el perfil refleje gustos recientes.

**Filtro dislikes**: Solo se incluyen likes con `reaccion IN ('like', 'encanta')`. Dislikes se **excluyen** de la construccion del perfil vectorial (no suman embedding negativo, simplemente se ignoran).

Proceso: `SamplesRepository::buscarInteraccionesParaPerfil()` retorna pares `(embedding, peso_con_decay)`. `perfilUsuario()` calcula `sum(embedding_i * peso_i) / sum(peso_i)` y normaliza a norma L2 = 1.

**Cache de perfil**: El vector resultante se almacena en WP transient `kamples_perfil_vec_{userId}` con TTL de 1 hora. Se invalida explicitamente con `GeneradorEmbeddings::invalidarPerfilCache($userId)` durante el recalculo preciso.

### 2. Comportamiento (0.25) — 5 sub-factores + penalizacion dislike

Cada sub-factor compara los **tags enriquecidos** del sample candidato con los tags de samples con los que el usuario interactuo. La puntuacion mide la proporcion de tags del candidato que aparecen en las interacciones. **Todos los sub-factores estan bounded a [0,1] con `LEAST(1.0, ...)`.**

| Sub-factor     | Peso | Fuente                                                              | Formula SQL                                                              |
| -------------- | ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Likes dados    | 0.30 | `likes` con `reaccion IN ('like','encanta')`, encanta pondera x2    | `LEAST(1.0, SUM(peso_por_reaccion) / GREATEST(1, array_length(tags_candidato, 1)))` |
| Reproducciones | 0.25 | Todas las reproducciones del usuario                                | `LEAST(1.0, COUNT(tags_comun) / GREATEST(1, array_length(tags_candidato, 1)))`       |
| Tiempo escucha | 0.20 | Solo reproducciones con `duracion_escuchada > 10s`                  | `LEAST(1.0, COUNT(tags_comun) / GREATEST(1, array_length(tags_candidato, 1)))`       |
| Descargas      | 0.15 | Todas las descargas del usuario                                     | `LEAST(1.0, COUNT(tags_comun) / GREATEST(1, array_length(tags_candidato, 1)))`       |
| Completadas    | 0.10 | Solo reproducciones con `completada = true`                         | `LEAST(1.0, COUNT(tags_comun) / GREATEST(1, array_length(tags_candidato, 1)))`       |

**Penalizacion por dislikes (senal negativa)**:

Ademas de los 5 sub-factores positivos, el score de comportamiento recibe una **penalizacion** basada en los tags de samples que el usuario dio dislike. Se construyen los tags enriquecidos de los samples dislikeados (con alias `s7`) y se calcula la proporcion de overlap con el candidato. La penalizacion esta capeada a **0.15** maximo.

```sql
GREATEST(0, (suma_subfactores_positivos - LEAST(0.15, dislike_overlap)))
```

Esto asegura que el candidato que comparte muchos tags con contenido rechazado baje en el ranking, pero el score nunca sea negativo.

Los pesos se leen de `algoritmoPesos.php['comportamiento_detalle']`.

### 3. Contexto (0.15) — 6 sub-factores

Los 6 sub-pesos estan definidos en `algoritmoPesos.php['contexto_detalle']` y **suman exactamente 1.0**:

| Sub-factor     | Peso   | Calculo                                                                          |
| -------------- | ------ | -------------------------------------------------------------------------------- |
| Creador afin   | 0.35   | `1 si creador_id IN top_5_creadores_favoritos, 0 si no`                          |
| Genero match   | 0.20   | Tags enriquecidos candidato vs top 8 tags likeados del usuario (excluye dislikes)|
| BPM proximidad | 0.15   | `GREATEST(0, (tolerancia - ABS(bpm_sample - bpm_prom)) / tolerancia)`. Sin BPM → 0.5 |
| Key match      | 0.12   | `1 si key = keyFavorita, 0 si no`. Sin keyFav → 0.5                              |
| Tipo match     | 0.10   | `1 si tipo = tipoFavorito, 0 si no`. Sin tipoFav → 0.5                           |
| Escala match   | 0.08   | `1 si escala = escalaFavorita, 0 si no`. Sin escalaFav → 0.5                     |

**Escala favorita** (nuevo): `UsuariosExtRepository::escalaFavorita($userId)` calcula la escala mas frecuente (major/minor) entre los samples likeados y reproducidos por el usuario. Usa `LOWER()` para normalizar variaciones (Major/major/Mayor). Se agrega al perfil via `PerfilUsuario::construir()`.

**Top 5 creadores favoritos** (`UsuariosExtRepository::obtenerCreadoresFavoritos()`):

Se calculan sumando puntaje de afinidad por creador:

| Tipo interaccion | Puntaje |
| ---------------- | ------- |
| Reaccion encanta | 2.0     |
| Reaccion like    | 1.0     |
| Reproduccion     | 0.5     |
| Descarga         | 1.5     |

- Excluye al propio usuario.
- Requiere afinidad total >= 2.0 para entrar en el ranking.
- Retorna los top 5 creadores por afinidad.

**Perfil del usuario** (`PerfilUsuario::construir()`): Delega a `UsuariosExtRepository` para obtener:
- `bpmProm`: promedio de BPM de samples likeados (like + encanta, excluyendo dislike) + reproducidos.
- `keyFav`: key musical mas frecuente en samples likeados + reproducidos.
- `tipoFav`: tipo de sample mas frecuente en samples likeados + reproducidos.
- `escalaFav`: escala musical mas frecuente (major/minor) en samples likeados + reproducidos.
- `creadoresFav`: array de IDs de los top 5 creadores.
- `interacciones`: total de likes + reproducciones + descargas. Si < 5, se usa feed de tendencias.

### 4. Tendencias (0.15) — Engagement velocity

Mide la velocidad de engagement reciente, normalizada por el tiempo desde la publicacion del sample (penaliza samples viejos con engagement absoluto alto pero velocity baja). **Todos los sub-factores estan bounded a [0,1] con `LEAST(1.0, ...)`.**

| Sub-factor         | Peso | Ventana            | Formula SQL                                                                  |
| ------------------ | ---- | ------------------ | ---------------------------------------------------------------------------- |
| Likes 24h          | 0.40 | `INTERVAL '24 hours'` | `LEAST(1.0, SUM(ponderado) / GREATEST(1, horas_desde_publicacion))`       |
| Reproducciones 24h | 0.30 | `INTERVAL '24 hours'` | `LEAST(1.0, COUNT(*) / GREATEST(1, horas_desde_publicacion))`             |
| Descargas 7d       | 0.20 | `INTERVAL '7 days'`   | `LEAST(1.0, COUNT(*) / GREATEST(1, dias_desde_publicacion))`              |
| Follows creador 7d | 0.10 | `INTERVAL '7 days'`   | `LEAST(1.0, COUNT(*) / GREATEST(1, dias_desde_publicacion))`              |

**Reacciones ponderadas en el sub-factor Likes 24h:**
- `encanta` = 2
- `like` = 1
- `dislike` = -1

Las ventanas temporales son configurables via `algoritmoPesos.php['parametros']['ventanas_tendencias']` con whitelist de intervalos PG validos: `1 hour`, `6 hours`, `12 hours`, `24 hours`, `48 hours`, `3 days`, `7 days`, `14 days`, `30 days`, `90 days`, `365 days`.

### 5. Grafo Social (0.10) — 2 sub-factores

| Sub-factor           | Peso | SQL                                                                          |
| -------------------- | ---- | ---------------------------------------------------------------------------- |
| Creador seguido      | 0.60 | `1 si creador_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId)` |
| Likeado por seguidos | 0.40 | `LEAST(1, SUM(peso_reaccion) / 4)` maximo 1.0                                |

**Detalle "Likeado por seguidos":**
- Suma reacciones de seguidos del usuario sobre el sample candidato.
- Cada `encanta` = 2, cada `like` = 1.
- Se divide por 4 y se limita a LEAST(1, ...) → 4+ puntos de reacciones saturan a 1.0.
- COALESCE a 0 si no hay reacciones.

### 6. Novedad (0.10)

```sql
GREATEST(0, 1 - LN(GREATEST(1, dias_desde_publicacion)) / LN(dias_boost))
```

Donde `dias_desde_publicacion = EXTRACT(EPOCH FROM NOW() - s.publicado_at) / 86400`

- `dias_boost = 14` (configurable en `algoritmoPesos.php['parametros']['novedad_dias_boost']`).
- **Dia 0:** `1 - ln(1)/ln(14) = 1 - 0 = 1.0` (boost maximo).
- **Dia 1:** `1 - ln(1)/ln(14) = 1.0` (GREATEST(1, 1) = 1).
- **Dia 7:** `1 - ln(7)/ln(14) ≈ 1 - 0.74 = 0.26`.
- **Dia 14:** `1 - ln(14)/ln(14) = 0.0`.
- **Dia 15+:** `GREATEST(0, negativo) = 0` (sin boost).
- Decaimiento logaritmico: rapido al principio, mas lento despues.

---

## Multiplicadores Post-Score

### Penalizacion por repeticion

Si el usuario ya reprodujo un sample >= N veces, el score se reduce drasticamente:

```sql
CASE WHEN (SELECT COUNT(*) FROM reproducciones WHERE usuario_id = :userId AND sample_id = s.id) >= 3 THEN 0.3 ELSE 1 END
```

- **Umbral:** `parametros.penalizacion_ya_escuchado.umbral_reproducciones` = 3 (configurable).
- **Factor:** `parametros.penalizacion_ya_escuchado.factor_penalizacion` = 0.3 (configurable).
- Efecto: samples escuchados 3+ veces bajan al 30% de su score original.
- Favorece descubrimiento de contenido nuevo.

### Boost verificado

Samples de creadores verificados por humano reciben un multiplicador post-penalizacion:

```sql
CASE WHEN s.verificado = true THEN 1.15 ELSE 1 END
```

- **Factor:** `parametros.verificado_boost` = 1.15 (configurable).
- Se aplica DESPUES de la penalizacion por repeticion.
- Usa `s.verificado AS verificado_sample` en el CTE para evitar colision con `u.verificado` del JOIN con usuarios (PDO sobreescribe columnas con mismo nombre).

### Diversidad por creador

Penalizacion suave para evitar que un creador domine el feed:

```sql
ROW_NUMBER() OVER (PARTITION BY s.creador_id ORDER BY score DESC) as rn
...
ORDER BY (score * CASE WHEN rn <= 3 THEN 1 ELSE GREATEST(0.3, 1.0 - (rn - 3) * 0.15) END) DESC
```

| Posicion del creador (rn) | Multiplicador |
| ------------------------- | ------------- |
| 1-3                       | 1.00          |
| 4                         | 0.85          |
| 5                         | 0.70          |
| 6                         | 0.55          |
| 7                         | 0.40          |
| 8+                        | 0.30 (minimo) |

- `max_por_creador` = 3 (configurable en `algoritmoPesos.php['parametros']`).
- Samples del mismo creador NO se excluyen, solo bajan en ranking.
- El PARTITION se calcula dentro de un CTE (`scored`) antes del ORDER BY final.

---

## CTE de 2 niveles (feedPersonalizado)

La query principal usa **dos niveles de CTE** para evitar computar la expresion de score dos veces (una vez para el valor y otra vez para el PARTITION BY):

```sql
WITH base_scores AS (
  SELECT s.*, <expresion_score_completa> AS score,
         s.verificado AS verificado_sample, ...flags_usuario...
  FROM samples s LEFT JOIN usuarios_ext u ...
  WHERE s.estado = 'activo'
),
scored AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY creador_id ORDER BY score DESC) AS rn
  FROM base_scores
)
SELECT * FROM scored
ORDER BY (score * penalizacion_diversidad) DESC
LIMIT :limit OFFSET :offset
```

- `base_scores`: computa score una sola vez por sample.
- `scored`: usa score pre-computado para ROW_NUMBER sin re-evaluar la expresion completa.
- **Beneficio:** Elimina la duplicacion de la expresion de 6 senales (que puede ser >50 lineas SQL).

---

## Vectores (Embeddings 128d)

Generados por `GeneradorEmbeddings::generar()`. Constantes: `DIMENSION=128`, `BPM_MAX=300`, `DURACION_MAX=600`, `TAGS_OFFSET=22`, `TAGS_SLOTS=106`.

| Posiciones | Dims | Contenido   | Encoding                                                                 |
| ---------- | ---- | ----------- | ------------------------------------------------------------------------ |
| [0]        | 1    | BPM         | `min(1, bpm/300)`. BPM 0 o null → 0.0                                   |
| [1-12]     | 12   | Key musical | One-hot. Soporta enarmonicos: C#=Db, D#=Eb, F#=Gb, G#=Ab, A#=Bb        |
| [13-14]    | 2    | Escala      | `[major/mayor, minor/menor]`. Sin escala → `[0.5, 0.5]`                 |
| [15-19]    | 5    | Tipo sample | One-hot: loop(0), one_shot/oneshot/one shot(1), vocal(2), fx(3), preset(4) |
| [20]       | 1    | Duracion    | `ln(1+dur)/ln(1+600)`. Escala logaritmica, max 10 min                    |
| [21]       | 1    | Es premium  | 0.0 o 1.0                                                               |
| [22-127]   | 106  | Tags        | Hash CRC32 a posicion fija. Peso = `1/count(tags)`. Max 1.0 por slot    |

**Detalle de tags hasheados (posiciones 22-127):**
- Cada tag se normaliza a lowercase y se hashea con `crc32()`.
- Posicion = `abs(crc32(tag)) % 106` → indice en [0, 105] → offset [22, 127].
- Peso por tag = `1 / max(1, total_tags)`. Un sample con 5 tags da 0.2 por tag.
- Colisiones posibles: dos tags con el mismo hash suman sus pesos (max 1.0).
- Sin tags: posiciones 22-127 quedan en 0.0 (similitud basada solo en atributos musicales).

**Generacion batch:** `GeneradorEmbeddings::generarTodos()` procesa samples activos sin embedding en **batches de 200**, con `gc_collect_cycles()` entre batches para control de memoria. Usa `SamplesRepository::buscarSinEmbeddingActivos($limit)` con parametro limit para paginacion.

**Almacenamiento:** String formato PostgreSQL `'[0.5,0,1,...,0]'` en columna `embedding VECTOR(128)`. Indice HNSW con distancia coseno.

---

## Tabla `algoritmo_estado` (Schema)

Tabla de control para el PlanificadorAlgoritmo. PK = `usuario_id`. Tiene contadores duales (rapido + preciso) para cada tipo de interaccion:

| Columna                        | Tipo     | Default  | Descripcion                                     |
| ------------------------------ | -------- | -------- | ----------------------------------------------- |
| `usuario_id`                   | int (PK) | —        | FK a `usuarios_ext(id)`                          |
| `cnt_likes`                    | int      | 0        | Contador rapido de likes acumulados              |
| `cnt_reproducciones`           | int      | 0        | Contador rapido de reproducciones                |
| `cnt_completas`                | int      | 0        | Contador rapido de reproducciones completadas    |
| `cnt_descargas`                | int      | 0        | Contador rapido de descargas                     |
| `cnt_follows`                  | int      | 0        | Contador rapido de follows                       |
| `cnt_comentarios`              | int      | 0        | Contador rapido de comentarios                   |
| `cnt_likes_preciso`            | int      | 0        | Contador preciso de likes (2x umbral rapido)     |
| `cnt_reproducciones_preciso`   | int      | 0        | Contador preciso de reproducciones               |
| `cnt_completas_preciso`        | int      | 0        | Contador preciso de completadas                  |
| `cnt_descargas_preciso`        | int      | 0        | Contador preciso de descargas                    |
| `cnt_follows_preciso`          | int      | 0        | Contador preciso de follows                      |
| `cnt_comentarios_preciso`      | int      | 0        | Contador preciso de comentarios                  |
| `ultimo_rapido`                | datetime | NOW()    | Timestamp del ultimo recalculo rapido            |
| `ultimo_preciso`               | datetime | NOW()    | Timestamp del ultimo recalculo preciso           |
| `ultima_actividad`             | datetime | NOW()    | Timestamp de la ultima interaccion del usuario   |
| `version_perfil`               | int      | 0        | Se incrementa con cada recalculo preciso         |

Cada `registrarInteraccion()` incrementa tanto el contador rapido como el `_preciso` y actualiza `ultima_actividad`.

---

## Recalculo y Cache

### Sistema dual (PlanificadorAlgoritmo)

Dos modos independientes que se evaluan en paralelo:

**Rapido** (invalida cache del feed, fuerza recalcular en siguiente request):

| Trigger            | Umbral | Key config                                |
| ------------------ | ------ | ----------------------------------------- |
| Likes acumulados   | 5      | `frecuencia.rapido.triggers.likes`        |
| Reproducciones     | 10     | `frecuencia.rapido.triggers.reproducciones` |
| Completadas        | 5      | `frecuencia.rapido.triggers.reproducciones_completas` |
| Descargas          | 3      | `frecuencia.rapido.triggers.descargas`    |
| Follows            | 2      | `frecuencia.rapido.triggers.follows`      |
| Comentarios        | 3      | `frecuencia.rapido.triggers.comentarios`  |

- Intervalo temporal activo: cada **30 min** conectado.
- Intervalo temporal inactivo: cada **480 min** (8 horas).
- Accion: delega a `MotorRecomendacion::invalidarCache($userId)` (SQL LIKE pattern), resetea contadores rapidos.

**Preciso** (regenera embedding de perfil + invalida cache):

| Trigger            | Umbral | Key config                                  |
| ------------------ | ------ | ------------------------------------------- |
| Likes acumulados   | 10     | `frecuencia.preciso.triggers.likes`         |
| Reproducciones     | 20     | `frecuencia.preciso.triggers.reproducciones` |
| Completadas        | 10     | `frecuencia.preciso.triggers.reproducciones_completas` |
| Descargas          | 6      | `frecuencia.preciso.triggers.descargas`     |
| Follows            | 4      | `frecuencia.preciso.triggers.follows`       |
| Comentarios        | 6      | `frecuencia.preciso.triggers.comentarios`   |

- Intervalo temporal activo: cada **60 min** conectado.
- Intervalo temporal inactivo: cada **960 min** (16 horas).
- Accion: ejecuta rapido primero, luego **invalida cache de perfil vectorial** (`GeneradorEmbeddings::invalidarPerfilCache($userId)`), regenera `perfilUsuario()`, resetea contadores precisos, incrementa `version_perfil`.
- Admin puede forzar recalculo global para todos los usuarios via `PlanificadorAlgoritmo::forzarRecalculoGlobal()` (con GC cada 50 usuarios).

**Umbral inactividad:** Un usuario se considera inactivo si `ultima_actividad` > **600 seg** (10 min) sin interacciones. Config: `frecuencia.umbral_inactividad_seg`.

**Procesamiento temporal:** `PlanificadorAlgoritmo::procesarTemporales()` — pensado para WP Cron cada 5 min. Usa `obtenerParaEvaluacionFiltrado($intervaloRapidoActivo)` para cargar **solo** usuarios cuyo ultimo recalculo excede el intervalo minimo (filtro SQL, no carga todos en memoria). Aplica recalculos segun intervalos.

### Cache

- **Mecanismo:** WP transients con TTL de **300 seg** (5 min). Constante: `MotorRecomendacion::CACHE_TTL`.
- **Clave:** `kamples_feed_{userId}_{limite}_{offset}` (ej: `kamples_feed_42_20_0`).
- **Todas las paginas:** Se cachea para **cualquier offset**, no solo la primera pagina.
- **Invalidacion por usuario:** `invalidarCache()` usa SQL `LIKE` pattern `_transient_kamples_feed_{userId}_%` para borrar todas las paginas cacheadas de un usuario en una sola query. No depende de hardcodear limites especificos.
- **Invalidacion global:** `invalidarCacheGlobal()` usa SQL `DELETE FROM wp_options WHERE option_name LIKE '_transient_kamples_feed_%'` para purgar todos los feeds.
- **Invalidacion automatica:** Al disparar recalculo rapido o preciso.

**Cache de perfil vectorial:**
- **Clave:** `kamples_perfil_vec_{userId}`.
- **TTL:** 3600 seg (1 hora).
- **Invalidado** durante recalculo preciso antes de regenerar.

**Cache de pgvector:**
- **Clave:** `kamples_pgvector_activo`.
- **TTL:** 3600 seg (1 hora).
- Evita verificar extension + columna en cada request.

---

## Flujo del Feed (feedPersonalizado)

```
GET /feed?tipo=descubrir

1. Usuario autenticado + tipo=descubrir
   → MotorRecomendacion::feedPersonalizado($userId, $limite, $offset)
   → Cache check: get_transient (TODAS las paginas se cachean)
   → PerfilUsuario::construir($userId)
     → Si interacciones < 5: feedNuevoUsuario() (trending mejorado)
     → Si >= 5: construir query multi-senal

2. Construccion de senales (orden en el codigo):
   a) Comportamiento (ConstructorSenales::sqlComportamiento) ← incluye penalizacion dislike
   b) Contexto (ConstructorSenales::sqlContexto) ← 6 sub-factores (incluye escala_match)
   c) Tendencias (ConstructorSenales::sqlTendencias) ← bounded [0,1]
   d) Novedad (inline en MotorRecomendacion)
   e) Grafo Social (ConstructorSenales::sqlGrafoSocial)
   f) Similitud Contenido (ConstructorSenales::sqlSimilitudContenido)
      → Solo si pgvector esta activo (check cacheado en transient)

3. Query CTE de 2 niveles:
   WITH base_scores AS (
     SELECT s.*, score_expr AS score,
            s.verificado AS verificado_sample, ...flags_usuario...
     FROM samples s LEFT JOIN usuarios_ext u ...
     WHERE s.estado = 'activo'
   ),
   scored AS (
     SELECT *, ROW_NUMBER() OVER (PARTITION BY creador_id ORDER BY score DESC) AS rn
     FROM base_scores
   )
   SELECT * FROM scored
   ORDER BY (score * penalizacion_diversidad) DESC
   LIMIT :limit OFFSET :offset

4. Cache write: set_transient (para cualquier offset, si hay resultados)

5. Feed nuevo usuario (< 5 interacciones):
   WITH base AS (
     SELECT ...,
       (likes*2 + reproducciones + descargas*3)
       * EXP(-dias_desde_publicacion / 30) AS score,
       CASE WHEN s.verificado THEN 1.15 ELSE 1 END AS boost
   ),
   ranked AS (
     SELECT *, ROW_NUMBER() OVER (PARTITION BY creador_id ORDER BY score*boost DESC) AS rn
   )
   → Decay exponencial (no lineal), boost verificado, diversidad por creador
     con penalizacion suave despues del 3er sample por creador.

6. Fallback general (error o no autenticado):
   → Misma formula que feed nuevo usuario
```

---

## Samples Similares (samplesSimilares)

Metodo independiente con dos estrategias. Lee pesos de `algoritmoPesos.php['samples_similares']`.

### Estrategia 1: pgvector (preferida)

Si pgvector esta activo Y el sample tiene embedding:

```sql
SELECT ... FROM samples s
WHERE s.estado = 'activo' AND s.id != :sampleId AND s.embedding IS NOT NULL
ORDER BY s.embedding <=> (SELECT embedding FROM samples WHERE id = :sampleId)
LIMIT :limit
```

- Distancia coseno directa entre embeddings.
- No usa pesos configurables, es comparacion pura.
- Retorno inmediato si hay resultados.

### Estrategia 2: Fallback por scoring multi-senal (config-based)

Si pgvector no esta disponible o el sample no tiene embedding. Usa los **pesos de `samples_similares`** de config:

```
score = similitud_contenido * tagScore
      + contexto * (0.4*bpmScore + 0.35*keyScore + 0.25*tipoScore)
      + tendencias * tendenciasScore
      + novedad * novedadScore
```

| Senal               | Peso config | Sub-factores                                                             |
| ------------------- | ----------- | ------------------------------------------------------------------------ |
| Similitud contenido | 0.45        | Tags en comun normalizados: `count(matches) / count(tags)` → [0,1]      |
| Contexto            | 0.25        | BPM proximidad (40%) + key match (35%) + tipo match (25%) → cada [0,1]  |
| Tendencias          | 0.15        | Engagement normalizado por promedio global → [0,1] con LEAST(1.0)       |
| Novedad             | 0.15        | Decay logaritmico identico al de senal 6                                |

- BPM proximity: `GREATEST(0, (tolerancia - ABS(bpm_cand - bpm_orig)) / tolerancia)` → [0,1]. Sin BPM original → 0.5 (neutro).
- Key match: 1 si coincide, 0 si no. Sin key original → 0.5 (neutro).
- Tipo match: 1 si coincide, 0 si no.
- Tags: max 10 tags comparados, peso = `count_matches / total_tags` → [0,1].
- ORDER BY score DESC (sin desempate por likes).

---

## Variantes Contextuales (pesos de algoritmoPesos.php)

Ademas del feed principal, la config define pesos alternativos para contextos especificos:

### "Tambien te gustaria" (`tambien_te_gustaria`)

| Senal               | Peso |
| ------------------- | ---- |
| Similitud contenido | 0.40 |
| Comportamiento      | 0.20 |
| Contexto            | 0.20 |
| Tendencias          | 0.10 |
| Novedad             | 0.10 |

> No incluye `grafo_social`. Enfocado en similitud directa.

### "Mas ideas coleccion" (`mas_ideas_coleccion`)

| Senal               | Peso |
| ------------------- | ---- |
| Similitud contenido | 0.50 |
| Contexto            | 0.25 |
| Tendencias          | 0.15 |
| Novedad             | 0.10 |

> No incluye `comportamiento` ni `grafo_social`. 100% basado en contenido de la coleccion.

### "Samples similares" (`samples_similares`)

| Senal               | Peso |
| ------------------- | ---- |
| Similitud contenido | 0.45 |
| Contexto            | 0.25 |
| Tendencias          | 0.15 |
| Novedad             | 0.15 |

> Usado activamente por `samplesSimilares()` en el fallback de scoring manual. Cuando pgvector esta disponible, se usa distancia coseno directa en su lugar.

---

## Flags de Estado del Usuario en el CTE

El CTE `scored` incluye subqueries para determinar la relacion del usuario con cada sample:

| Flag                        | Tabla fuente        | Significado                              |
| --------------------------- | ------------------- | ---------------------------------------- |
| `reaccion_usuario`          | `likes`             | Reaccion actual: 'like', 'encanta', 'dislike', o NULL |
| `ya_coleccionado`           | `descargas`         | El usuario descargo/colecciono este sample |
| `ya_guardado_en_coleccion`  | `coleccion_samples` | El sample esta en alguna coleccion del usuario (bookmark) |
| `ya_comentado`              | `comentarios`       | El usuario comento en este sample        |
| `es_mio`                    | derivado            | `s.creador_id = userId` (sample creado por el usuario) |

Generados por `NormalizadorSample::sqlSelectSamples(?int $userId)` en feeds, y directamente en el CTE de `feedPersonalizado`.

---

## Gotchas y Problemas Conocidos

- **[Fail-open pgvector]:** Si pgvector no esta disponible, la senal de similitud se omite completamente. El feed funciona con 5 senales y pesos que suman 0.75 (no se redistribuyen).
- **[Tags enriquecidos]:** Concatenan `tags + genero + instrumentos + emocion` de metadata JSONB. Un sample sin metadata IA solo usa tags manuales.
- **[Reacciones]:** `encanta` = 2x peso de `like` en comportamiento, tendencias y grafo social. `dislike` = penalizacion en comportamiento (max -0.15) y -1 en tendencias.
- **[Nuevos usuarios]:** < 5 interacciones totales (likes + reproducciones + descargas) = feed de tendencias mejorado con decay exponencial, boost verificado y diversidad por creador.
- **[verificado_sample]:** El CTE aliasa `s.verificado AS verificado_sample` para evitar que PDO sobreescriba con `u.verificado` (el ultimo valor con mismo key gana en arrays asociativos).
- **[Concurrencia Planificador]:** `procesarTemporales()` no tiene lock. Si dos crons se ejecutan simultaneamente, podrian procesar el mismo usuario dos veces (bajo riesgo, efecto: doble invalidacion de cache).
- **[Key enarmonicas]:** C#=Db, D#=Eb, F#=Gb, G#=Ab, A#=Bb. Ambas notaciones mapean a la misma posicion en el embedding.
- **[Tag hash colisiones]:** 106 slots para CRC32 hash. Con >50 tags unicos probables colisiones. TO-DO futuro: ampliar slots o usar spectrogramas (Fase 11.2 roadmap).

---

## Changelog de Auditoría (sesion AG-ALG)

> Resumen de los 17 cambios implementados (de los 20 identificados en auditoría):

| # | Prioridad | Fix | Archivos |
|---|-----------|-----|----------|
| 1 | P0 | `contexto_detalle` sub-pesos rebalanceados: 6 factores suman 1.0 (antes 1.35). Agregados `creador_afin: 0.35` y `escala_match: 0.08` | algoritmoPesos.php, ConstructorSenales.php |
| 2 | P0 | Tendencias velocity bounded [0,1] con `LEAST(1.0, ...)` en los 4 sub-factores | ConstructorSenales.php |
| 3 | P0 | Comportamiento 5 sub-factores bounded [0,1] con `LEAST(1.0, ...)` | ConstructorSenales.php |
| 4 | P0 | Perfil vectorial cacheado en WP transient (1hr TTL) + invalidacion en recalculo preciso | GeneradorEmbeddings.php, PlanificadorAlgoritmo.php |
| 5 | P1 | CTE refactorizado a 2 niveles (base_scores → scored) para evitar doble computo de score | MotorRecomendacion.php |
| 6 | P1 | Cache extendido a TODAS las paginas (no solo offset=0). Key incluye offset | MotorRecomendacion.php |
| 7 | P1 | Check pgvector cacheado en transient (1hr TTL) | MotorRecomendacion.php |
| 8 | P1 | `invalidarCache()` usa SQL LIKE pattern (borra todas las paginas, no hardcoded 20/50) | MotorRecomendacion.php |
| 9 | P1 | `ejecutarRapido()` delega a `MotorRecomendacion::invalidarCache()` (consistencia) | PlanificadorAlgoritmo.php |
| 10 | P1 | `procesarTemporales()` usa `obtenerParaEvaluacionFiltrado()` (filtro SQL, no carga todos) | PlanificadorAlgoritmo.php, AlgoritmoEstadoRepository.php |
| 11 | P1 | `generarTodos()` procesa en batches de 200 con GC entre batches | GeneradorEmbeddings.php, SamplesRepository.php |
| 12 | P1 | `forzarRecalculoGlobal()` ejecuta GC cada 50 usuarios | PlanificadorAlgoritmo.php |
| 13 | P2 | Decay temporal en perfil: `EXP(-dias/30)` para cada interaccion | SamplesRepository.php |
| 14 | P2 | Senal negativa dislike en Comportamiento: penalizacion max 0.15 por overlap tags | ConstructorSenales.php |
| 15 | P2 | Feed nuevo usuario mejorado: decay exponencial + boost verificado + diversidad creador | MotorRecomendacion.php |
| 16 | P2 | `escala_match` agregado a Contexto (0.08) + `escalaFavorita()` en perfil | ConstructorSenales.php, PerfilUsuario.php, UsuariosExtRepository.php |
| 17 | P2 | `samplesSimilares()` fallback usa pesos de config con 4 senales normalizadas [0,1] | MotorRecomendacion.php |

**Diferidos:**
- P2 #15 (tag hash 106 slots): Requiere espectrogramas/expansion. Planificado en Fase 11.2 del roadmap.
- P4 #20 (docblock): Corregido inline (claims de normalizacion eliminados).
- P4 #19 (invalidarCache consistencia): Incluido en fix #8 y #9.
