# Algoritmo de Recomendación — Kamples

> Versión 3 · Última actualización: Julio 2025

---

## Resumen General

El algoritmo de recomendación de Kamples determina qué samples mostrar a cada usuario en su feed personalizado. Combina **6 señales** ponderadas que analizan el comportamiento del usuario, el contenido de los samples, las tendencias de la plataforma y las conexiones sociales.

```
┌─────────────────────────────────────────────┐
│           Feed Personalizado                │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐     │
│  │Comporta-│  │Similitud│  │ Contexto │     │
│  │  miento │  │Contenido│  │          │     │
│  │  0.25   │  │  0.25   │  │   0.15   │     │
│  └────┬────┘  └────┬────┘  └────┬─────┘     │
│       │            │            │           │
│  ┌────┴────┐  ┌────┴────┐  ┌────┴─────┐     │
│  │Tendencia│  │  Grafo  │  │ Novedad  │     │
│  │  0.15   │  │ Social  │  │   0.10   │     │
│  │         │  │  0.10   │  │          │     │
│  └────┬────┘  └────┬────┘  └────┬─────┘     │
│       │            │            │           │
│       └────────────┼────────────┘           │
│                    ▼                        │
│            Score Final × Penalización       │
│                    ▼                        │
│          Diversidad por Creador (suave)     │
│                    ▼                        │
│             Resultados ordenados            │
└─────────────────────────────────────────────┘
```

---

## Las 6 Señales

### 1. Comportamiento del Usuario (peso: 0.25)

Analiza las interacciones previas del usuario para encontrar samples afines a sus gustos.

| Sub-factor        | Peso | Qué mide                                            |
| ----------------- | ---- | --------------------------------------------------- |
| Likes dados       | 0.30 | Tags en común con samples que el usuario ha likeado |
| Reproducciones    | 0.25 | Tags en común con samples reproducidos              |
| Tiempo de escucha | 0.20 | Tags en común con samples escuchados >10 segundos   |
| Descargas         | 0.15 | Tags en común con samples descargados               |
| Completadas       | 0.10 | Tags en común con reproducciones completadas        |

**Cómo funciona:** Para cada sample candidato, se cuentan cuántos de sus tags coinciden con los tags de samples con los que el usuario ha interactuado. Una mayor coincidencia de tags = mayor puntuación.

### 2. Similitud de Contenido (peso: 0.25)

Usa **pgvector** (embeddings de 128 dimensiones) para calcular la distancia coseno entre el perfil vectorial del usuario y cada sample candidato.

```
Perfil del usuario (promedio de embeddings de sus interacciones)
         ↕ distancia coseno
Embedding del sample candidato (generado al subir)
         ↓
Similitud = 1 - (distancia / 2)  →  rango [0, 1]
```

**Componentes del embedding (128d):**

- BPM normalizado
- Key (nota musical codificada)
- Escala (mayor/menor)
- Tipo de sample (loop/oneshot/fx/vocal/stem)
- Duración normalizada
- Tags hasheados a dimensiones fijas

> Se activa automáticamente cuando pgvector está instalado. Si no hay embedding o perfil, esta señal vale 0.

### 3. Contexto Musical (peso: 0.15)

Compara las preferencias musicales del usuario con los atributos técnicos del sample candidato.

| Sub-factor     | Peso | Cálculo                                                                  |
| -------------- | ---- | ------------------------------------------------------------------------ |
| BPM proximidad | 0.35 | Qué tan cerca está el BPM del promedio del usuario (tolerancia: ±15 BPM) |
| Key match      | 0.30 | 1 si coincide con la tonalidad favorita, 0 si no                         |
| Género match   | 0.20 | Tags en común con los 5 tags más frecuentes del usuario                  |
| Tipo match     | 0.15 | 1 si coincide con el tipo favorito (loop/oneshot/etc), 0 si no           |

**Ejemplo:** Si un usuario suele reproducir loops a 120 BPM en Am, un loop a 118 BPM en Am tendrá alta puntuación de contexto.

### 4. Tendencias (peso: 0.15)

Mide la "velocidad de engagement" — qué tan rápido está ganando interacciones un sample.

| Sub-factor                    | Peso | Ventana          |
| ----------------------------- | ---- | ---------------- |
| Likes recientes               | 0.40 | Últimas 24 horas |
| Reproducciones recientes      | 0.30 | Últimas 24 horas |
| Descargas recientes           | 0.20 | Últimos 7 días   |
| Nuevos seguidores del creador | 0.10 | Últimos 7 días   |

**Velocity:** Se divide por las horas/días desde publicación para que un sample nuevo con 10 likes en 2 horas puntúe más que uno viejo con 10 likes en 30 días.

### 5. Grafo Social (peso: 0.10)

Señal basada en las conexiones sociales del usuario.

| Sub-factor           | Peso | Qué mide                                                  |
| -------------------- | ---- | --------------------------------------------------------- |
| Creador seguido      | 0.60 | El creador del sample es alguien que el usuario sigue     |
| Likeado por seguidos | 0.40 | Usuarios que el usuario sigue han dado like a este sample |

> Normalizado: 3+ likes de seguidos = factor máximo (1.0).

### 6. Novedad (peso: 0.10)

Boost logarítmico para samples recientes. Decae naturalmente con el tiempo.

```
Novedad = max(0, 1 - ln(días_publicado) / ln(14))

Día 0:  1.00 (máximo boost)
Día 1:  ~0.93
Día 3:  ~0.58
Día 7:  ~0.26
Día 14: 0.00 (sin boost)
Día 30: 0.00
```

> Configurable: `novedad_dias_boost = 14` (después de 14 días, no hay boost de novedad).

---

## Penalización por Repetición

Después de calcular el score de las 6 señales, se aplica un multiplicador de penalización:

```
Si el usuario ha reproducido este sample >= 3 veces:
    Score final = Score × 0.3  (70% de penalización)
Si no:
    Score final = Score × 1.0  (sin penalización)
```

**Configuración:**

- Umbral: 3 reproducciones
- Factor: 0.3 (los samples muy escuchados bajan de posición pero NO desaparecen)

---

## Diversidad por Creador

Para evitar que el feed se llene de samples del mismo creador:

```
Primeros 3 samples del creador:  Score × 1.0 (sin cambio)
4º sample del creador:           Score × 0.85
5º sample:                       Score × 0.70
6º sample:                       Score × 0.55
7º+ sample:                      Score × 0.30 (mínimo)
```

> **Importante (C74):** Nunca se excluyen samples. Todos aparecen, los que exceden el límite por creador simplemente bajan de posición con una penalización suave.

---

## Flujo Completo

```
1. Usuario pide su feed
         │
         ▼
2. ¿Hay cache válido? (transient WP, TTL 5 min)
    │ Sí → Servir cache
    │ No ↓
         │
3. ¿Tiene suficientes interacciones? (mínimo: 5)
    │ No → Feed de nuevo usuario (trending + novedad)
    │ Sí ↓
         │
4. Construir perfil del usuario
    ├── BPM promedio de sus interacciones
    ├── Key favorita
    ├── Tipo favorito (loop/oneshot/etc)
    └── Perfil vectorial (embedding promedio)
         │
         ▼
5. Ejecutar query SQL con 6 señales
    ├── Comportamiento (tags matching)
    ├── Similitud (pgvector coseno)
    ├── Contexto (BPM, key, tipo)
    ├── Tendencias (velocity)
    ├── Grafo social (seguidos)
    └── Novedad (logarítmica)
         │
         ▼
6. Aplicar penalización por repetición
         │
         ▼
7. Aplicar diversidad por creador (suave)
         │
         ▼
8. Ordenar por score DESC + paginar
         │
         ▼
9. Guardar en cache (5 min) + retornar
```

---

## Feed de Nuevo Usuario

Cuando un usuario tiene menos de 5 interacciones, no hay suficiente datos para personalizar. Se usa un feed combinado de:

- **Trending:** Samples con más engagement ponderado: `(likes×2 + reproducciones + descargas×3)`
- **Recencia:** Multiplicador que decae en 30 días, favoreciendo contenido fresco

> Los resultados vacíos NO se cachean para evitar servir feeds vacíos durante 5 minutos.

---

## Cache y Recálculo

### Cache

- **Tipo:** WP transients (base de datos)
- **TTL:** 5 minutos
- **Scope:** Por usuario + tamaño de feed (`kamples_feed_{userId}_{limite}`)
- **Solo primera página:** Las páginas siguientes no se cachean

### Invalidación

| Evento                  | Acción                                |
| ----------------------- | ------------------------------------- |
| Usuario da like         | Invalidar cache de ese usuario        |
| Reproducción registrada | Invalidar cache de ese usuario        |
| Descarga                | Invalidar cache de ese usuario        |
| Nuevo sample publicado  | Invalidar cache de TODOS los usuarios |

### PlanificadorAlgoritmo (Recálculo Automático)

Sistema dual que decide cuándo recalcular:

**Modo Rápido** (scoring ligero):
| Trigger | Cada N interacciones |
|---|---|
| Likes | cada 5 |
| Reproducciones | cada 10 |
| Reproducciones completas | cada 5 |
| Descargas | cada 3 |
| Follows | cada 2 |
| Comentarios | cada 3 |
| Tiempo (activo) | cada 30 min |
| Tiempo (inactivo) | cada 8 horas |

**Modo Preciso** (scoring completo con pgvector):

- Triggers: el doble que el rápido
- Tiempo activo: cada 1 hora
- Tiempo inactivo: cada 16 horas

> Se considera "inactivo" tras 10 minutos sin actividad.

---

## Configuración

Todos los pesos y parámetros se controlan desde un único archivo:

**`App/Kamples/Config/algoritmoPesos.php`**

| Parámetro               | Valor | Descripción                                     |
| ----------------------- | ----- | ----------------------------------------------- |
| `bpm_tolerancia`        | 15    | ±BPM para considerar "similar"                  |
| `novedad_dias_boost`    | 14    | Días de boost logarítmico                       |
| `umbral_reproducciones` | 3     | Plays para activar penalización                 |
| `factor_penalizacion`   | 0.3   | Multiplicador de penalización (0.3 = -70%)      |
| `max_por_creador`       | 3     | Samples antes de penalización suave por creador |
| `min_interacciones`     | 5     | Mínimo para activar personalización             |
| `max_resultados_feed`   | 100   | Tope de resultados por consulta                 |

---

## Archivos Clave

| Archivo                                          | Función                                   |
| ------------------------------------------------ | ----------------------------------------- |
| `App/Kamples/Services/MotorRecomendacion.php`    | Motor principal (6 señales + scoring SQL) |
| `App/Kamples/Config/algoritmoPesos.php`          | Pesos y parámetros configurables          |
| `App/Kamples/Services/GeneradorEmbeddings.php`   | Embeddings 128d para pgvector             |
| `App/Kamples/Services/PlanificadorAlgoritmo.php` | Triggers de recálculo                     |
| `App/Kamples/Api/Helpers/NormalizadorSample.php` | SQL base + normalización JSON             |

---

## Variantes del Algoritmo

El mismo motor soporta diferentes contextos con pesos ajustados:

| Contexto                    | Similitud | Comportamiento | Contexto | Tendencias | Social | Novedad |
| --------------------------- | --------- | -------------- | -------- | ---------- | ------ | ------- |
| **Feed principal**          | 0.25      | 0.25           | 0.15     | 0.15       | 0.10   | 0.10    |
| **"También te gustará"**    | 0.40      | 0.20           | 0.20     | 0.10       | —      | 0.10    |
| **"Más ideas" (colección)** | 0.50      | —              | 0.25     | 0.15       | —      | 0.10    |
| **Samples similares**       | 0.45      | —              | 0.25     | 0.15       | —      | 0.15    |
