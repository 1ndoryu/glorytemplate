# Algoritmo de Recomendacion Kamples

> Documentacion tecnica del sistema de descubrimiento.
> Ultima actualizacion: sesion AG-ALG S4 — clasificacion calidad reproducciones, saturacion dinamica por percentiles, tracking frontend duracion real.
> Revision completa: sesion AG-ALG S1 (auditoría 20 puntos).

---

## Resumen

El algoritmo combina **6 senales ponderadas** para generar un score por sample candidato. Cada senal produce un valor **estrictamente** entre 0 y 1 (bounded con `LEAST(1.0, ...)` y `GREATEST(0, ...)`), que se multiplica por su peso y se suma. El score total se ajusta con multiplicadores de penalizacion por reproducciones (progresiva), penalizacion pasiva, saturacion de popularidad, boost verificado, y diversidad por creador. Todo es configurable desde `algoritmoPesos.php`.

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
| Comunidad      | `App/Kamples/Api/Controladores/PublicacionesController.php`   | Feed social: scoring o ORDER BY segun filtro                     |
| Comunidad Repo | `App/Kamples/Database/Repositories/PublicacionesRepository.php` | `listarFeedPuntuado()`: CTE 2 niveles con scoring               |
| Busqueda       | `App/Kamples/Api/Controladores/SamplesController.php`         | `listar()` con ranking ts_rank + ILIKE fallback                  |
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
score_total = SUM(peso_i * senal_i) * pen_reproduccion * pen_pasiva * saturacion_popularidad * boost_verificado
score_final = score_total * penalizacion_diversidad_creador
```

| #   | Senal               | Peso     | Descripcion                                                                            |
| --- | ------------------- | -------- | -------------------------------------------------------------------------------------- |
| 1   | Similitud Contenido | **0.28** | Distancia coseno pgvector entre embedding del sample y el perfil del usuario           |
| 2   | Comportamiento      | **0.27** | Tags enriquecidos vs interacciones (5 sub-factores + penalizacion dislike)             |
| 3   | Contexto            | **0.15** | Afinidad tematica (genero 0.30 + creador 0.45) + datos tecnicos (BPM+key+escala+tipo 0.25) |
| 4   | Tendencias          | **0.12** | Engagement absoluto en ventana temporal (sin sesgo por edad del sample)                |
| 5   | Grafo Social        | **0.10** | Contenido de creadores seguidos y likeado por seguidos (2 sub-factores)                |
| 6   | Novedad             | **0.08** | Boost logaritmico decreciente minimo; samples no pierden valor con el tiempo           |

> Los pesos son configurables desde `algoritmoPesos.php['senales']` y **DEBEN sumar 1.0**. Los sub-pesos dentro de cada senal tambien deben sumar 1.0. MotorRecomendacion los lee dinamicamente al construir la query.

---

## Tags Enriquecidos (concepto transversal)

Multiples senales usan **tags enriquecidos** en vez de `s.tags` directamente. Definidos en `ConstructorSenales::sqlTagsEnriquecidos()`:

```sql
/* Normalización case-insensitive: LOWER() aplicado a cada tag via ARRAY_AGG + UNNEST */
(SELECT COALESCE(ARRAY_AGG(LOWER(t)), ARRAY[]::text[]) FROM UNNEST(
    COALESCE(s.tags, ARRAY[]::text[])
    || /* metadata.genero: array o string → array */
    || /* metadata.instrumentos: array o string → array */
    || /* metadata.emocion: array o string → array */
) AS t WHERE t IS NOT NULL AND t != '')
```

- Maneja `jsonb_typeof` para soportar tanto arrays como strings en cada campo JSONB.
- Se usa con alias parametrico (`s`, `s2`, `s7`, etc.) para diferentes contextos en la query.
- El alias se valida con regex `^[a-z_][a-z0-9_]*$` para prevenir SQL injection.
- **Resultado:** Un array de texto normalizado a lowercase que combina tags manuales + metadata IA, usado para comparar afinidad.
- **Normalizacion:** `LOWER()` aplicado a cada elemento individual para garantizar comparaciones case-insensitive. Filtra NULLs y strings vacios.

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
| Creador afin   | **0.45** | `1 si creador_id IN top_5_creadores_favoritos, 0 si no`                        |
| Genero match   | **0.30** | Tags enriquecidos candidato vs top 8 tags likeados del usuario (excluye dislikes)|
| BPM proximidad | 0.08   | `GREATEST(0, (tolerancia - ABS(bpm_sample - bpm_prom)) / tolerancia)`. Sin BPM → 0.5 |
| Tipo match     | 0.07   | `1 si tipo = tipoFavorito, 0 si no`. Sin tipoFav → 0.5                           |
| Key match      | 0.06   | `1 si key = keyFavorita, 0 si no`. Sin keyFav → 0.5                              |
| Escala match   | 0.04   | `1 si escala = escalaFavorita, 0 si no`. Sin escalaFav → 0.5                     |

> **Filosofía S3:** Afinidad temática (género+creador = 0.75) domina sobre datos técnicos (BPM+key+escala+tipo = 0.25). Tags y género determinan si un sample encaja creativamente; BPM y key son ajustes finos.

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

### 4. Tendencias (0.12) — Engagement absoluto en ventana

Mide el engagement reciente usando **normalizadores absolutos por ventana** en vez de dividir por edad del sample. Así, un sample de hace 2 años con 10 likes en 24h puntúa igual que uno nuevo con 10 likes. **Los samples no pierden valor con el tiempo.** Todos bounded a [0,1] con `LEAST(1.0, ...)`.

| Sub-factor         | Peso | Ventana            | Formula SQL                                                               |
| ------------------ | ---- | ------------------ | ------------------------------------------------------------------------- |
| Likes 24h          | 0.40 | `INTERVAL '24 hours'` | `LEAST(1.0, SUM(ponderado) / max_likes_ventana_corta)` (default: 15)  |
| Reproducciones 24h | 0.30 | `INTERVAL '24 hours'` | `LEAST(1.0, COUNT(*) / max_repro_ventana_corta)` (default: 30)        |
| Descargas 7d       | 0.20 | `INTERVAL '7 days'`   | `LEAST(1.0, COUNT(*) / max_descargas_ventana_media)` (default: 20)    |
| Follows creador 7d | 0.10 | `INTERVAL '7 days'`   | `LEAST(1.0, COUNT(*) / max_follows_ventana_media)` (default: 10)      |

> **Cambio S3:** La normalización anterior dividía por `horas_desde_publicacion`, lo que creaba sesgo contra samples antiguos. Ahora se divide por valores máximos configurables en `algoritmoPesos.php['tendencias_normalizadores']`.

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

### 6. Novedad (0.08)

```sql
GREATEST(0, 1 - LN(GREATEST(1, dias_desde_publicacion)) / LN(dias_boost))
```

> **Peso reducido (S3):** Los samples no pierden valor con el tiempo. Este boost solo prioriza ligeramente lo nuevo sin penalizar lo antiguo.

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

### Penalizacion progresiva por reproducciones (S3, actualizado S4)

Reemplaza la penalizacion binaria anterior (umbral 3 → 0.3). Ahora cada reproduccion reduce progresivamente el score con decaimiento hiperbolico, pero **ponderado por calidad de escucha** (S4):

```sql
GREATEST(minimo, 1.0 / (1.0 + SUM(peso_calidad) * tasa_decaimiento))
```

**Clasificacion de calidad (S4):** Cada reproduccion se clasifica segun la duracion escuchada vs la duracion total del sample:

| Tipo sample (duracion) | Umbral significativa | Ejemplo |
| ---------------------- | -------------------- | ------- |
| Corto (<=20s)          | 50% de la duracion   | 10s sample → escuchar >=5s |
| Medio (20-60s)         | 30% (min 10s abs)    | 45s sample → escuchar >=13.5s |
| Largo (>60s)           | 15% (min 10s abs)    | 120s sample → escuchar >=18s |

| Clasificacion | Peso | Condicion |
| ------------- | ---- | --------- |
| Ignorada      | 0.00 | duracion_escuchada < 1s |
| Rapida        | 0.30 | Escucho pero no alcanzo umbral significativa |
| Significativa | 1.00 | Alcanzo umbral segun tipo sample |
| Legacy        | configurable (default 1.0) | duracion_escuchada = 0 (datos pre-S4) |

| SUM(peso_calidad) | Multiplicador (tasa=0.15, min=0.20) |
| ----------------- | ----------------------------------- |
| 0                 | 1.00 (maximo — nunca escuchado)     |
| 1.0               | 0.87                                |
| 2.0               | 0.77                                |
| 3.0               | 0.69                                |
| 5.0               | 0.57                                |
| 10.0              | 0.40                                |
| 15.0+             | 0.20 (piso)                         |

- Config: `parametros.penalizacion_reproduccion.tasa_decaimiento` = 0.15, `.minimo` = 0.20.
- Config: `parametros.clasificacion_reproduccion` — umbrales y pesos por tipo.
- **Filosofia:** Una reproduccion rapida (1-5s, usuario descartando) pesa 0.30 en vez de 1.0. Escuchas significativas (50%+ de un sample corto) pesan 1.0 completo. Un sample que el usuario solo "pincho" rapidamente 3 veces suma peso 0.9 (vs 3.0 antes). Esto evita penalizar por browsing casual.

### Penalizacion pasiva (S3, actualizado S4)

Si el usuario reprodujo un sample >= N veces de forma **significativa** pero NO dio like, NI lo descargo, NI lo guardo en coleccion → "dislike implicito". Penalizacion = mitad de un dislike.

```sql
CASE WHEN (plays_significativas >= min_reproducciones) AND NOT EXISTS(like) AND NOT EXISTS(descarga) AND NOT EXISTS(coleccion)
  THEN factor ELSE 1 END
```

- Config: `parametros.penalizacion_pasiva.factor` = 0.85, `.min_reproducciones` = 2.
- Deshabitable: `.habilitado` = false devuelve multiplicador 1 siempre.
- **Cambio S4:** Solo reproducciones significativas (que alcanzan umbral de duracion) cuentan para el conteo de `min_reproducciones`. Plays rapidas (1-5s browsing) no activan la penalizacion pasiva. Esto evita castigar samples en los que el usuario solo hizo preview rapido.
- **Logica:** Si escuchaste algo 2+ veces *de verdad* y no hiciste NADA positivo, probablemente no te gusto.

### Saturacion de popularidad (S3, dinamica S4)

Samples muy descargados pierden valor. Los usuarios buscan samples buenos que no esten sobreusados.

```sql
GREATEST(minimo, 1.0 / (1.0 + LN(1.0 + GREATEST(0, total_descargas - umbral) / escala)))
```

**Modo dinamico (S4):** Los valores de `umbral` y `escala` se calculan automaticamente a partir de percentiles de la plataforma en vez de ser constantes fijas:

- `umbral` = PERCENTILE_CONT(0.75) de descargas de samples activos con descargas > 0
- `escala` = PERCENTILE_CONT(0.95) - P75
- Cacheado en WP transient `kamples_sat_pop_stats` (TTL 1hr)
- Fallback a valores fijos si la plataforma tiene <10 samples con descargas

| Escenario | P75 (umbral) | P95-P75 (escala) | Comportamiento |
| --------- | ------------ | ---------------- | -------------- |
| Plataforma nueva | 50 (fallback) | 100 (fallback) | Valores fijos iniciales |
| 100 samples activos | ~8 | ~25 | Penaliza a partir de 8 descargas |
| 10K samples activos | ~45 | ~180 | Se adapta a mayor volumen |

- Config: `parametros.saturacion_popularidad.modo` = 'dinamico', `.percentil_umbral` = 0.75, `.percentil_escala` = 0.95.
- Deshabitable: `.habilitado` = false. Modo fijo: `.modo` = 'fijo' usa `.umbral_descargas` y `.escala` directos.
- **Filosofia:** Si la plataforma crece, los umbrales crecen automaticamente. No hay que reconfigurar manualmente cuando pasan de 100 a 10K samples.

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

### Serendipia / Descubrimiento (S3)

Post-procesamiento PHP que inyecta samples de descubrimiento fuera de la burbuja de preferencias del usuario. Se ejecuta DESPUES de la query principal.

**Funcionamiento:**
1. Feed principal se calcula normalmente (SQL scoring).
2. Se determinan N posiciones de insercion (cada `frecuencia` posiciones).
3. Se buscan candidatos de descubrimiento con query separada.
4. Se insertan en las posiciones calculadas.

**Candidatos de descubrimiento (con pgvector):**
- Distancia coseno entre perfil usuario y candidato BETWEEN `distancia_min` y `distancia_max` (0.3 a 1.0).
- Engagement minimo (likes+repro+descargas >= `min_engagement`).
- No incluidos en el feed principal.
- Ordenados por `RANDOM()` para variedad.

**Fallback (sin pgvector):**
- Samples aleatorios con buen engagement que el usuario ha reproducido < 2 veces.

**Configuracion** (`algoritmoPesos.php['serendipidad']`):

| Parametro           | Default | Descripcion                                      |
| ------------------- | ------- | ------------------------------------------------ |
| `habilitado`        | true    | Activar/desactivar serendipia                    |
| `frecuencia`        | 6       | Cada N samples, inyectar uno de descubrimiento   |
| `distancia_min`     | 0.3     | Distancia coseno minima (no muy similar)         |
| `distancia_max`     | 1.0     | Distancia coseno maxima (no demasiado lejano)    |
| `min_engagement`    | 5       | Engagement minimo para filtrar ruido             |
| `limite_candidatos` | 10      | Max candidatos por query                         |

- **Filosofia:** "Algo diferente pero no tan alejado". Un productor de trap puede descubrir un sample de jazz que inspiraria una produccion hibrida.
- Si la query de descubrimiento falla, el feed se devuelve sin modificar (fail-safe).

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

## Algoritmo de Comunidad (Feed Social)

> Fuente: `PublicacionesRepository::listarFeedPuntuado()`, pesos en `algoritmoPesos['comunidad']`.

El feed de publicaciones sociales (`filtro=todos`) usa scoring multi-señal con CTE 2 niveles y diversidad por autor.

### Señales del Feed de Comunidad

| # | Señal | Peso | Descripcion |
|---|-------|------|------------|
| 1 | Frescura | **0.40** | Decay exponencial `EXP(-horas/vida_media)`. Vida media: 24h |
| 2 | Engagement velocity | **0.35** | `(likes*1 + comentarios*2 + reposts*1.5) / horas`. Acotado [0,1] |
| 3 | Boost social | **0.15** | 1.0 si autor es seguido, 0.0 si no |
| 4 | Diversidad autor | **0.10** | `ROW_NUMBER PARTITION BY autor_id` cap 3 por pagina |

```
score = 0.40 * EXP(-horas_edad / 24)
      + 0.35 * LEAST(1.0, engagement_ponderado / horas_edad)
      + 0.15 * es_seguido
→ diversidad: ROW_NUMBER PARTITION BY autor_id <= 3
→ ORDER BY score DESC
```

### Modos del endpoint `GET /publicaciones`

| Filtro | Comportamiento |
|--------|---------------|
| `todos` (default) | Feed puntuado multi-señal (nuevo) |
| `populares` | `ORDER BY total_likes DESC, created_at DESC` |
| `siguiendo` | Filtra por seguidos + `ORDER BY created_at DESC` |
| `?autor=username` | Filtra por autor + `ORDER BY created_at DESC` |

---

## Busqueda con Ranking de Relevancia

> Fuente: `SamplesController::listar()`, pesos en `algoritmoPesos['busqueda']`.

La busqueda de samples usa scoring multi-factor basado en `ts_rank` (full-text search nativo PostgreSQL) en vez del `ILIKE` simple anterior.

### Factores de ranking

| Factor | Boost | Descripcion |
|--------|-------|------------|
| ts_rank (titulo+descripcion) | 1.0 | Relevancia full-text con stemming (`spanish`) |
| Tag match | 0.8 | Boost si algun tag contiene el termino de busqueda (LOWER + LIKE) |
| ts_rank titulo solo | 0.5 | Boost extra por coincidencia solo en titulo (mas especifico) |

```
score = 1.0 * ts_rank(titulo || descripcion, query)
      + 0.8 * (1 si tag LIKE '%termino%', 0 si no)
      + 0.5 * ts_rank(titulo, query)
→ ORDER BY score DESC, publicado_at DESC
```

- `plainto_tsquery('spanish', ...)` para stemming automatico (ej: "melodia" matchea "melodias").
- Fallback a ILIKE original si termino < 2 caracteres.
- Todos los pesos configurables desde `algoritmoPesos['busqueda']`.

---

## Normalizacion de Tags

> Fuente: `NormalizadorSample::normalizarTags()`, config en `algoritmoPesos['tags']`.

### Pipeline de normalización (3 capas de defensa)

1. **Upload/Edicion (PHP):** `sanitize_text_field()` → `normalizarTags()` (lowercase + trim + dedup) → `phpArrayToPg()` → BD.
2. **SQL Scoring (PostgreSQL):** `sqlTagsEnriquecidos()` aplica `LOWER()` via `ARRAY_AGG(LOWER(t))` — defensa contra datos legacy con casing mixto.
3. **Embeddings (PHP):** `GeneradorEmbeddings::generar()` aplica `strtolower(trim($tag))` al hashear tags.

### Bug critico corregido

Tags se almacenaban con casing original del usuario (ej: "HipHop", "TRAP"). Pero embeddings los normalzaban a lowercase ("hiphop", "trap") y comparaciones SQL eran case-sensitive (`= ANY(s.tags)`). Esto causaba:
- Mismatch entre embedding hash y tag real en BD.
- Comparaciones fallidas en ConstructorSenales para tags con casing diferente.

**Fix:** Normalizacion forzada en entrada + LOWER() en queries + defensa en profundidad.

---

## Changelog de Auditoría (sesion AG-ALG)

### Sesion 3: Refinamiento de filosofia del algoritmo (AG-ALG)

> Los samples no pierden valor con el tiempo. Tags/genero > datos tecnicos. Penalizaciones progresivas. Serendipia. Saturacion popularidad.

| # | Fix | Archivos |
|---|-----|----------|
| 23 | **Pesos principales rebalanceados:** similitud 0.25→0.28, comportamiento 0.25→0.27, tendencias 0.15→0.12, novedad 0.10→0.08. Contenido y comportamiento suben, recencia baja. | algoritmoPesos.php |
| 24 | **Contexto sub-pesos reestructurado:** Afinidad tematica (genero 0.20→0.30, creador 0.35→0.45 = 0.75 total) domina sobre datos tecnicos (BPM+key+escala+tipo = 0.25 total). | algoritmoPesos.php |
| 25 | **Penalizacion reproducciones progresiva:** Reemplaza binaria (umbral 3→factor 0.3) con decaimiento hiperbolico `1/(1+count*0.15)`. 0 plays=1.0, 3=0.69, 10=0.40, piso 0.20. | algoritmoPesos.php, ConstructorSenales.php, MotorRecomendacion.php |
| 26 | **Penalizacion pasiva (NEW):** Reproduccion sin like/descarga/guardar = "dislike implicito". Factor 0.85 (15% penalty, mitad de dislike maximo). Min 2 reproducciones para activar. | algoritmoPesos.php, ConstructorSenales.php, MotorRecomendacion.php |
| 27 | **Saturacion popularidad (NEW):** Samples muy descargados pierden valor logaritmicamente. Umbral 50 descargas, 100→0.71, 500→0.37, piso 0.30. | algoritmoPesos.php, ConstructorSenales.php, MotorRecomendacion.php |
| 28 | **Serendipia (NEW):** Inyeccion post-query de samples fuera de la burbuja cada 6 posiciones. pgvector distancia 0.3-1.0 + engagement minimo. Fallback random de calidad. | algoritmoPesos.php, MotorRecomendacion.php |
| 29 | **Tendencias sin sesgo edad:** Normalizacion cambiada de `conteo/horas_publicado` a `conteo/max_absoluto_ventana`. Sample de 2 anos con 10 likes/24h puntua igual que uno nuevo. | algoritmoPesos.php, ConstructorSenales.php |
| 30 | **samples_similares rebalanceado:** similitud 0.45→0.55, contexto 0.25→0.10. Sub-pesos contexto: tipo 0.50, BPM/key 0.25 cada uno. Tags/genero dominan, tecnico secundario. | algoritmoPesos.php, MotorRecomendacion.php |

### Sesion 2: Comunidad + Busqueda + Tags (AG-ALG)

| # | Fix | Archivos |
|---|-----|----------|
| 18 | **Tag normalization (BUG CRITICO):** Tags ahora se normalizan a lowercase+trim+dedup en upload y edicion. `sqlTagsEnriquecidos()` aplica `LOWER()` via `ARRAY_AGG(LOWER(t))` como defensa en profundidad. | NormalizadorSample.php, SamplesUploadController.php, SamplesModificacionController.php, ConstructorSenales.php |
| 19 | **algoritmoPesos expandido:** 3 nuevas secciones: `comunidad` (4 señales feed social), `busqueda` (ranking ts_rank), `tags` (config normalizacion). | algoritmoPesos.php |
| 20 | **Algoritmo feed comunidad:** Scoring multi-señal para `filtro=todos`: frescura(0.40) + engagement velocity(0.35) + boost social(0.15) + diversidad ROW_NUMBER. CTE 2 niveles. | PublicacionesRepository.php, PublicacionesController.php |
| 21 | **Busqueda con ranking:** `ts_rank` reemplaza `ORDER BY publicado_at` cuando hay termino de busqueda. 3 factores: full-text, tag match, titulo boost. Pesos configurables. | SamplesController.php |
| 22 | **PublicacionesEnums:** Agregados MODERACION_PENDIENTE/REVISION/APROBADO/RECHAZADO (faltaban en schema generado). | PublicacionesSchema.php, PublicacionesEnums.php |

### Sesion 1: 17 fixes (AG-ALG)

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

### Sesion 4: Calidad reproducciones + saturacion dinamica + tracking frontend (AG-ALG)

> Clasificacion de calidad de escucha, saturacion por percentiles, tracking real de duracion desde frontend.

| # | Fix | Archivos |
|---|-----|----------|
| 31 | **Clasificacion calidad reproducciones (NEW):** Cada play se clasifica como ignorada (<1s, peso 0), rapida (escucho pero no alcanzo umbral, peso 0.30), o significativa (alcanzo umbral adaptativo segun duracion sample, peso 1.0). Legacy (dur=0) configurable. | algoritmoPesos.php, ConstructorSenales.php |
| 32 | **Penalizacion reproducciones con pesos:** `sqlPenalizacionReproduccion()` reescrito: usa SUM(CASE peso_calidad) en vez de COUNT(*). Umbrales adaptativos: corto<=20s→50%, medio 20-60s→30%/min10s, largo>60s→15%/min10s. | ConstructorSenales.php |
| 33 | **Penalizacion pasiva solo significativas:** `sqlPenalizacionPasiva()` cuenta solo reproducciones significativas para el umbral min_reproducciones. Plays rapidas (browsing) no activan dislike implicito. | ConstructorSenales.php |
| 34 | **Saturacion popularidad dinamica (NEW):** Reemplaza umbrales fijos (50/100) con PERCENTILE_CONT(0.75/0.95) sobre samples activos. Cache WP transient 1hr. Fallback a fijos si <10 samples. | algoritmoPesos.php, ConstructorSenales.php |
| 35 | **Frontend tracking duracion real:** 4 hooks modificados para enviar `duracionEscuchada` y `completada` reales al backend. Nueva utilidad `trackingReproduccion.ts` centralizada. Tracking en: ended, pause, track-change, cleanup. Ya no se registra en play-start sin datos. | useAudioPlayback.ts, useSampleAudio.ts, useSamplePreview.ts, useReproductor.ts, trackingReproduccion.ts |
| 36 | **Verificacion intervalo_activo_min:** Confirmado que el sistema de actividad funciona correctamente. `ultima_actividad = NOW()` se actualiza en cada `incrementarContador()`. PlanificadorAlgoritmo compara seg_inactivo contra umbral_inactividad_seg (600s). | (sin cambios — solo verificacion) |
