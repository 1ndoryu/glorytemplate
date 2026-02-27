# Algoritmo de Recomendacion Kamples

> Documentacion tecnica del sistema de descubrimiento.
> Ultima actualizacion: sesion AG-ALG (27/02/2026) — verificado contra codigo fuente.

---

## Resumen

El algoritmo combina **6 senales ponderadas** para generar un score por sample candidato. Cada senal produce un valor entre 0 y 1, que se multiplica por su peso y se suma. El score total se ajusta con multiplicadores de penalizacion por repeticion, boost verificado, y diversidad por creador. Todo es configurable desde `algoritmoPesos.php`.

## Arquitectura (archivos)

| Capa           | Ruta completa                                                | Responsabilidad                                              |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Orquestacion   | `App/Kamples/Services/MotorRecomendacion.php`                | Feed personalizado, cache transients, samples similares      |
| SQL Scoring    | `App/Kamples/Services/ConstructorSenales.php`                | Fragmentos SQL ponderados para las 6 senales                 |
| Perfil         | `App/Kamples/Services/PerfilUsuario.php`                     | BPM prom, key fav, tipo fav, top 5 creadores                |
| Embeddings     | `App/Kamples/Services/GeneradorEmbeddings.php`               | Vectores 128d, perfil usuario, pgvector coseno               |
| Planificador   | `App/Kamples/Services/PlanificadorAlgoritmo.php`             | Triggers de recalculo por interacciones + cron temporal      |
| Config         | `App/Kamples/Config/algoritmoPesos.php`                      | Todos los pesos, parametros, frecuencias, variantes          |
| Repo Algoritmo | `App/Kamples/Database/Repositories/AlgoritmoEstadoRepository.php` | CRUD tabla `algoritmo_estado` (contadores recalculo)    |
| Repo Usuarios  | `App/Kamples/Database/Repositories/UsuariosExtRepository.php` | Queries perfil: BPM promedio, key fav, creadores fav        |
| Repo Samples   | `App/Kamples/Database/Repositories/SamplesRepository.php`    | Interacciones para perfil, verificar pgvector, embeddings    |

### Dependencia entre capas

```
MotorRecomendacion (orquestador)
├── ConstructorSenales (genera SQL para cada senal)
│   └── GeneradorEmbeddings (perfil vectorial para similitud)
├── PerfilUsuario (preferencias del usuario)
│   └── UsuariosExtRepository (queries de perfil)
├── SamplesRepository (ejecucion SQL final)
├── NormalizadorSample (SELECT base con flags usuario)
└── PlanificadorAlgoritmo (gestiona recalculo)
    └── AlgoritmoEstadoRepository (tabla de contadores)
```

---

## Las 6 Senales

```
score_total = SUM(peso_i * senal_i) * penalizacion_repeticion * boost_verificado
score_final = score_total * penalizacion_diversidad_creador
```

| #   | Senal               | Peso     | Descripcion                                                                     |
| --- | ------------------- | -------- | ------------------------------------------------------------------------------- |
| 1   | Similitud Contenido | **0.25** | Distancia coseno pgvector entre embedding del sample y el perfil del usuario    |
| 2   | Comportamiento      | **0.25** | Coincidencia de tags enriquecidos con interacciones del usuario (5 sub-factores) |
| 3   | Contexto            | **0.15** | Match de BPM, key, genero, tipo y creador afin (5 sub-factores)                 |
| 4   | Tendencias          | **0.15** | Velocidad de engagement reciente normalizada por edad (4 sub-factores)           |
| 5   | Grafo Social        | **0.10** | Contenido de creadores seguidos y likeado por seguidos (2 sub-factores)          |
| 6   | Novedad             | **0.10** | Boost logaritmico decreciente para samples nuevos (14 dias)                     |

> Los pesos son configurables desde `algoritmoPesos.php['senales']` y deben sumar 1.0. MotorRecomendacion los lee dinamicamente al construir la query.

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
- Se usa con alias parametrico (`s`, `s2`, etc.) para diferentes contextos en la query.
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

**Vector de perfil del usuario** (`GeneradorEmbeddings::perfilUsuario()`):

Promedio ponderado de embeddings de todos los samples con los que el usuario ha interactuado, normalizado a vector unitario (magnitud 1):

| Tipo interaccion         | Peso | Fuente tabla      |
| ------------------------ | ---- | ----------------- |
| Likes (like + encanta)   | 3    | `likes`           |
| Descargas                | 5    | `descargas`       |
| Reproducciones completas | 2    | `reproducciones`  |
| Reproducciones normales  | 1    | `reproducciones`  |

Proceso: `SamplesRepository::buscarInteraccionesParaPerfil()` retorna pares `(embedding, peso)`. `perfilUsuario()` calcula `sum(embedding_i * peso_i) / sum(peso_i)` y normaliza a norma L2 = 1.

### 2. Comportamiento (0.25) — 5 sub-factores

Cada sub-factor compara los **tags enriquecidos** del sample candidato con los tags de samples con los que el usuario interactuo. La puntuacion mide la proporcion de tags del candidato que aparecen en las interacciones.

| Sub-factor     | Peso | Fuente                                                              | Formula SQL                                                              |
| -------------- | ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Likes dados    | 0.30 | `likes` con `reaccion IN ('like','encanta')`, encanta pondera x2    | `SUM(peso_por_reaccion) / GREATEST(1, array_length(tags_candidato, 1))`  |
| Reproducciones | 0.25 | Todas las reproducciones del usuario                                | `COUNT(tags_comun) / GREATEST(1, array_length(tags_candidato, 1))`       |
| Tiempo escucha | 0.20 | Solo reproducciones con `duracion_escuchada > 10s`                  | `COUNT(tags_comun) / GREATEST(1, array_length(tags_candidato, 1))`       |
| Descargas      | 0.15 | Todas las descargas del usuario                                     | `COUNT(tags_comun) / GREATEST(1, array_length(tags_candidato, 1))`       |
| Completadas    | 0.10 | Solo reproducciones con `completada = true`                         | `COUNT(tags_comun) / GREATEST(1, array_length(tags_candidato, 1))`       |

**Detalle del sub-factor Likes:**
- Cada tag de un sample likeado tiene peso 1.
- Cada tag de un sample con `encanta` tiene peso 2.
- Se suman los pesos de tags en comun con el candidato y se dividen por la longitud de tags del candidato.

Los pesos se leen de `algoritmoPesos.php['comportamiento_detalle']`.

### 3. Contexto (0.15) — 5 sub-factores

> **DISCREPANCIA CONOCIDA:** La config `algoritmoPesos.php['contexto_detalle']` NO incluye `creador_afin`. Los 4 pesos de config suman 1.0 (bpm 0.35 + key 0.30 + genero 0.20 + tipo 0.15). Pero el codigo siempre agrega `creador_afin` con default 0.35, haciendo que los sub-pesos sumen **1.35** en la practica. La config sobreescribe los BPM/key con valores altos, desplazando los defaults del codigo.

**Valores efectivos en ejecucion** (config + defaults del codigo):

| Sub-factor     | Valor config           | Default codigo | Valor efectivo | Calculo                                                                          |
| -------------- | ---------------------- | -------------- | -------------- | -------------------------------------------------------------------------------- |
| BPM proximidad | `bpm_proximidad: 0.35` | 0.15           | **0.35**       | `GREATEST(0, (15 - ABS(bpm_sample - bpm_prom_usuario)) / 15)`. Sin BPM → 0.5    |
| Key match      | `key_match: 0.30`      | 0.10           | **0.30**       | `1 si key = keyFavorita, 0 si no`. Sin keyFav → 0.5                              |
| Genero match   | `genero_match: 0.20`   | 0.30           | **0.20**       | Tags enriquecidos candidato vs top 8 tags likeados del usuario (excluye dislikes) |
| Tipo match     | `tipo_match: 0.15`     | 0.10           | **0.15**       | `1 si tipo = tipoFavorito, 0 si no`. Sin tipoFav → 0.5                           |
| Creador afin   | NO en config           | 0.35           | **0.35**       | `1 si creador_id IN top_5_creadores_favoritos, 0 si no`                           |

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
- `creadoresFav`: array de IDs de los top 5 creadores.
- `interacciones`: total de likes + reproducciones + descargas. Si < 5, se usa feed de tendencias.

### 4. Tendencias (0.15) — Engagement velocity

Mide la velocidad de engagement reciente, normalizada por el tiempo desde la publicacion del sample (penaliza samples viejos con engagement absoluto alto pero velocity baja).

| Sub-factor         | Peso | Ventana            | Formula SQL                                                      |
| ------------------ | ---- | ------------------ | ---------------------------------------------------------------- |
| Likes 24h          | 0.40 | `INTERVAL '24 hours'` | `SUM(ponderado) / GREATEST(1, horas_desde_publicacion)`       |
| Reproducciones 24h | 0.30 | `INTERVAL '24 hours'` | `COUNT(*) / GREATEST(1, horas_desde_publicacion)`             |
| Descargas 7d       | 0.20 | `INTERVAL '7 days'`   | `COUNT(*) / GREATEST(1, dias_desde_publicacion)`              |
| Follows creador 7d | 0.10 | `INTERVAL '7 days'`   | `COUNT(*) / GREATEST(1, dias_desde_publicacion)`              |

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

**Generacion batch:** `GeneradorEmbeddings::generarTodos()` procesa todos los samples activos sin embedding.

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
- Accion: borra transients `kamples_feed_{userId}_{20,50,100}`, resetea contadores rapidos.

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
- Accion: ejecuta rapido primero, luego regenera `GeneradorEmbeddings::perfilUsuario()`, resetea contadores precisos, incrementa `version_perfil`.
- Admin puede forzar recalculo global para todos los usuarios via `PlanificadorAlgoritmo::forzarRecalculoGlobal()`.

**Umbral inactividad:** Un usuario se considera inactivo si `ultima_actividad` > **600 seg** (10 min) sin interacciones. Config: `frecuencia.umbral_inactividad_seg`.

**Procesamiento temporal:** `PlanificadorAlgoritmo::procesarTemporales()` — pensado para WP Cron cada 5 min. Itera todos los usuarios registrados en `algoritmo_estado` y aplica recalculos segun intervalos.

### Cache

- **Mecanismo:** WP transients con TTL de **300 seg** (5 min). Constante: `MotorRecomendacion::CACHE_TTL`.
- **Clave:** `kamples_feed_{userId}_{limite}` (ej: `kamples_feed_42_20`).
- **Solo primera pagina:** Solo se cachea cuando `offset === 0`.
- **Invalidacion por usuario:** `invalidarCache()` borra transients para limites 20 y 50.
- **Invalidacion global:** `invalidarCacheGlobal()` usa SQL `DELETE FROM wp_options WHERE option_name LIKE '_transient_kamples_feed_%'` para purgar todos los feeds.
- **Invalidacion automatica:** Al disparar recalculo rapido o preciso.

---

## Flujo del Feed (feedPersonalizado)

```
GET /feed?tipo=descubrir

1. Usuario autenticado + tipo=descubrir
   → MotorRecomendacion::feedPersonalizado($userId, $limite, $offset)
   → Cache check: get_transient (solo si offset=0)
   → PerfilUsuario::construir($userId)
     → Si interacciones < 5: feedNuevoUsuario() (trending simple)
     → Si >= 5: construir query multi-senal

2. Construccion de senales (orden en el codigo):
   a) Comportamiento (ConstructorSenales::sqlComportamiento)
   b) Contexto (ConstructorSenales::sqlContexto)
   c) Tendencias (ConstructorSenales::sqlTendencias)
   d) Novedad (inline en MotorRecomendacion)
   e) Grafo Social (ConstructorSenales::sqlGrafoSocial)
   f) Similitud Contenido (ConstructorSenales::sqlSimilitudContenido)
      → Solo si pgvector esta activo

3. Query CTE:
   WITH scored AS (
     SELECT s.*, score, ROW_NUMBER() OVER (PARTITION BY creador_id ORDER BY score DESC) as rn,
            reaccion_usuario, ya_coleccionado, ya_guardado_en_coleccion, ya_comentado, es_mio
     FROM samples s LEFT JOIN usuarios_ext u ...
     WHERE s.estado = 'activo'
   )
   SELECT * FROM scored
   ORDER BY (score * penalizacion_diversidad) DESC
   LIMIT :limit OFFSET :offset

4. Cache write: set_transient (solo si offset=0 y hay resultados)

5. Feed nuevo usuario (< 5 interacciones):
   ORDER BY (likes*2 + reproducciones + descargas*3)
            * GREATEST(0.1, 1 - dias/30) DESC
   → Pondera descargas x3, likes x2, con decay lineal a 30 dias (min 0.1).

6. Fallback general (error o no autenticado):
   → Misma formula que feed nuevo usuario
```

---

## Samples Similares (samplesSimilares)

Metodo independiente con dos estrategias:

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

### Estrategia 2: Fallback por scoring manual

Si pgvector no esta disponible o el sample no tiene embedding:

```
score = tag_score + bpm_score + key_score + tipo_score
```

| Factor     | Peso | Calculo                                                                    |
| ---------- | ---- | -------------------------------------------------------------------------- |
| Tags       | 2/tag | 2 puntos por cada tag del sample original que aparece en el candidato (max 10 tags) |
| BPM        | 5    | `GREATEST(0, 15 - ABS(bpm_candidato - bpm_original)) / 15 * 5`            |
| Key        | 5    | `5 si key coincide, 0 si no`                                               |
| Tipo       | 3    | `3 si tipo coincide, 0 si no`                                              |

- Desempate: `total_likes DESC`.
- Tolerancia BPM: 15 (configurable).

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

> No incluye `comportamiento` ni `grafo_social`. Nota: `samplesSimilares()` actualmente usa pgvector directo o fallback manual, no estos pesos. Estos estan definidos para uso futuro o consumidores externos.

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

- **[Config vs Codigo]:** `contexto_detalle` en config NO incluye `creador_afin`. Los sub-pesos efectivos suman 1.35, no 1.0. No se normalizan. El score de contexto puede exceder `0.15 * 1.0` teorico.
- **[Fail-open pgvector]:** Si pgvector no esta disponible, la senal de similitud se omite completamente. El feed funciona con 5 senales y pesos que suman 0.75 (no se redistribuyen).
- **[Tags enriquecidos]:** Concatenan `tags + genero + instrumentos + emocion` de metadata JSONB. Un sample sin metadata IA solo usa tags manuales.
- **[Reacciones]:** `encanta` = 2x peso de `like` en comportamiento, tendencias y grafo social. `dislike` = -1 solo en tendencias.
- **[Nuevos usuarios]:** < 5 interacciones totales (likes + reproducciones + descargas) = feed de tendencias simple.
- **[verificado_sample]:** El CTE aliasa `s.verificado AS verificado_sample` para evitar que PDO sobreescriba con `u.verificado` (el ultimo valor con mismo key gana en arrays asociativos).
- **[Variantes sin usar]:** Los pesos `tambien_te_gustaria`, `mas_ideas_coleccion` y `samples_similares` estan definidos en config pero `samplesSimilares()` usa pgvector directo. Los pesos serian para un futuro scoring multi-senal en esos contextos.
- **[Concurrencia Planificador]:** `procesarTemporales()` no tiene lock. Si dos crons se ejecutan simultaneamente, podrian procesar el mismo usuario dos veces (bajo riesgo, efecto: doble invalidacion de cache).
- **[Key enarmonicas]:** C#=Db, D#=Eb, F#=Gb, G#=Ab, A#=Bb. Ambas notaciones mapean a la misma posicion en el embedding.
