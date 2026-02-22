# Algoritmo de Recomendacion  Kamples

> Documentacion tecnica del sistema de descubrimiento.
> Ultima actualizacion: sesion AG-FIX

---

## Resumen

El algoritmo combina **6 senales ponderadas** para generar un score por sample candidato. Cada senal produce un valor entre 0 y 1, que se multiplica por su peso y se suma. El score total se ajusta con multiplicadores de diversidad y penalizacion.

## Arquitectura (archivos)

| Capa | Archivo | Responsabilidad |
|------|---------|----------------|
| Orquestacion | `MotorRecomendacion.php` | Feed personalizado, cache, similares |
| SQL Scoring | `ConstructorSenales.php` | Genera fragmentos SQL ponderados |
| Perfil | `PerfilUsuario.php` | BPM prom, key fav, tipo fav, creadores fav |
| Embeddings | `GeneradorEmbeddings.php` | Vectores 128d, pgvector coseno |
| Planificador | `PlanificadorAlgoritmo.php` | Triggers de recalculo por interacciones |
| Config | `algoritmoPesos.php` | Todos los pesos y parametros |

---

## Las 6 Senales

```
score_total = SUM(peso_i * senal_i) * penalizacion_repeticion * boost_verificado
```

| # | Senal | Peso | Descripcion |
|---|-------|------|-------------|
| 1 | Similitud Contenido | **0.25** | Distancia coseno pgvector entre embedding del sample y el perfil del usuario |
| 2 | Comportamiento | **0.25** | Coincidencia de tags con samples que el usuario ha likeado/escuchado/descargado |
| 3 | Contexto | **0.15** | Match de BPM, key, genero, tipo y creador afin |
| 4 | Tendencias | **0.15** | Velocidad de engagement reciente (likes 24h, plays 24h, descargas 7d) |
| 5 | Grafo Social | **0.10** | Contenido de creadores seguidos y likeado por seguidos |
| 6 | Novedad | **0.10** | Boost logaritmico decreciente para samples nuevos (14 dias) |

---

## Detalle de cada Senal

### 1. Similitud Contenido (0.25)

Usa **pgvector** con distancia coseno entre el embedding del sample candidato y el vector de perfil del usuario.

```sql
GREATEST(0, 1 - (s.embedding <=> :userProfileVector::vector) / 2)
```

- Distancia coseno: 0 = identicos, 2 = opuestos
- Conversion a similitud: `1 - distancia/2` rango [0,1]
- Si el sample no tiene embedding: 0

**Vector de perfil del usuario**: promedio ponderado de embeddings de sus interacciones:
- Likes: peso 3
- Descargas: peso 5
- Reproducciones completas: peso 2
- Reproducciones normales: peso 1

### 2. Comportamiento (0.25)  5 sub-factores

Cada sub-factor compara los **tags enriquecidos** del sample candidato con los tags de samples con los que el usuario interactuo.

**Tags enriquecidos** = `tags[] + metadata.genero[] + metadata.instrumentos[] + metadata.emocion[]`

| Sub-factor | Peso | Fuente |
|------------|------|--------|
| Likes dados | 0.30 | `likes` con `reaccion IN ('like','encanta')`, encanta = 2x |
| Reproducciones | 0.25 | Todos los plays |
| Tiempo escucha | 0.20 | Solo `duracion_escuchada > 10s` |
| Descargas | 0.15 | Todos los downloads |
| Completadas | 0.10 | Solo `completada = true` |

Formula por sub-factor: `COUNT(tags_en_comun) / GREATEST(1, array_length(tags_candidato))`

### 3. Contexto (0.15)  5 sub-factores

| Sub-factor | Peso real (codigo) | Calculo |
|------------|-------------------|---------|
| Creador afin | 0.35 | `1 si creador IN top_5_creadores, 0 si no` |
| Genero match | 0.30 | Tags enriquecidos vs top 8 tags del usuario |
| BPM proximidad | 0.15 | `(tolerancia - ABS(bpm - bpmProm)) / tolerancia` (tolerancia = 15) |
| Key match | 0.10 | `1 si key = keyFavorita, 0 si no` |
| Tipo match | 0.10 | `1 si tipo = tipoFavorito, 0 si no` |

> **Nota:** Los pesos en la config (`algoritmoPesos.php`) difieren de los defaults del codigo. El codigo usa defaults internos que suman 1.0 correctamente. Los valores de arriba son los que realmente se ejecutan.

### 4. Tendencias (0.15)  Engagement velocity

| Sub-factor | Peso | Ventana | Formula |
|------------|------|---------|---------|
| Likes 24h | 0.40 | 24 horas | `count_likes / horas_publicado` (velocity) |
| Reproducciones 24h | 0.30 | 24 horas | `count_plays / horas_publicado` |
| Descargas 7d | 0.20 | 7 dias | `count_descargas / dias_publicado` |
| Follows creador 7d | 0.10 | 7 dias | `count_follows / dias_publicado` |

Reacciones ponderadas: encanta = 2, like = 1, dislike = -1.

### 5. Grafo Social (0.10)  2 sub-factores

| Sub-factor | Peso | SQL |
|------------|------|-----|
| Creador seguido | 60% | `1 si creador_id IN seguidos del usuario` |
| Likeado por seguidos | 40% | `LEAST(1, SUM(reactions) / 4)` maximo 1.0 con 4+ reacciones |

### 6. Novedad (0.10)

```sql
GREATEST(0, LN(GREATEST(1, dias_boost - dias_desde_publicacion)) / LN(GREATEST(2, dias_boost)))
```

- `dias_boost = 14` (configurable)
- Boost maximo al publicarse, decrece logaritmicamente a 0 tras 14 dias

---

## Multiplicadores Post-Score

### Penalizacion por repeticion

Si el usuario ya reprodujo un sample >= 3 veces:
```
score *= 0.3
```
Reduce drasticamente samples ya escuchados para favorecer descubrimiento.

### Boost verificado

Samples de creadores verificados: `score *= 1.15`
Se aplica post-penalizacion.

### Diversidad por creador

Usando `ROW_NUMBER() OVER (PARTITION BY creador_id)` + penalty:
- Primeros 3 samples del mismo creador: sin penalizacion
- 4to: score *= 0.85, 5to: *= 0.70, etc.
- Minimo: 0.3

Evita que un solo creador popular domine el feed.

---

## Vectores (Embeddings 128d)

| Posiciones | Dims | Contenido | Encoding |
|-----------|------|-----------|----------|
| [0] | 1 | BPM | `min(1, bpm/300)` |
| [1-12] | 12 | Key musical | One-hot C a B |
| [13-14] | 2 | Escala | `[major, minor]`, sin escala = `[0.5, 0.5]` |
| [15-19] | 5 | Tipo sample | One-hot: loop, oneshot, vocal, fx, preset |
| [20] | 1 | Duracion | `ln(1+dur)/ln(1+600)` |
| [21] | 1 | Es premium | 0 o 1 |
| [22-127] | 106 | Tags | Hash CRC32 posicion fija, peso = `1/count(tags)` |

---

## Recalculo y Cache

### Sistema dual (PlanificadorAlgoritmo)

**Rapido** (invalida cache del feed):
- Triggers: 5 likes, 10 reproducciones, 5 completadas, 3 descargas, 2 follows, 3 comentarios
- Cron: cada 30 min si activo

**Preciso** (regenera embedding de perfil + invalida cache):
- Triggers: 2x los del rapido
- Cron: cada 60 min si activo, 960 min si inactivo
- Admin puede forzar recalculo global

### Cache
- WP transients con TTL de 5 minutos
- Solo primera pagina cacheada (offset = 0)
- Invalidacion automatica al disparar recalculo

---

## Flujo del Feed

```
GET /feed?tipo=descubrir

1. Usuario autenticado + tipo=descubrir
   -> MotorRecomendacion::feedPersonalizado()
   -> Cache check (transient)
   -> Si interacciones < 5: feedNuevoUsuario() (trending simple)
   -> Si >= 5: 6 senales SQL + multiplicadores + diversidad

2. Fallback (error o no autenticado)
   -> ORDER BY (descargas + likes*2 + reproducciones) * decay DESC

3. Variantes contextuales (pesos diferentes):
   - "Tambien te gustaria": similitud 0.40
   - "Mas ideas coleccion": similitud 0.50
   - "Samples similares": similitud 0.45
```

---

## Gotchas

- [Config vs Codigo]: Los pesos de `contexto_detalle` en la config no incluyen `creador_afin`. El codigo usa defaults internos.
- [Fail-open]: Si pgvector no esta disponible, la senal de similitud retorna 0.
- [Tags enriquecidos]: Se concatenan tags + genero + instrumentos + emocion de metadata JSONB.
- [Reacciones]: `encanta` = 2x peso de `like`, `dislike` = -1 en tendencias.
- [Nuevos usuarios]: < 5 interacciones = feed trending simple.
