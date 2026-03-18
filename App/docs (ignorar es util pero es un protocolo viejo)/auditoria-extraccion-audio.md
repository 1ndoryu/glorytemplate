# Auditoria de Extraccion de Audio — QQ119

Analisis profundo del pipeline de extraccion de audio: manejo de fallos, reintentos, prioridades, y recomendaciones arquitecturales.

---

## 1. Estado Actual del Pipeline

El pipeline tiene 3 fases:
1. **Scrapy (Python):** Scraping WhoSampled, encola items en `cola_extraccion_samples`
2. **Extractor (Python):** Descarga multi-fuente (6 alternativas), analiza BPM, recorta con FFmpeg
3. **Publicador (PHP):** `PublicadorExtraccion` -> `PipelineAudio` -> sample `activo`

### Fuentes de descarga (orden de prioridad)

| # | Fuente | Calidad | Tasa exito estimada |
|---|--------|---------|---------------------|
| 1 | SoundCloud API v2 | MP3 128kbps | ~95% mainstream |
| 2 | YouTube local (sin proxy) | MP3 via yt-dlp | ~30-70% (depende de IP) |
| 3 | Deezer preview | MP3 128kbps 30s | ~80% (solo si timing <= 30s) |
| 4 | YouTube search | MP3 via yt-dlp | ~40% |
| 5 | Spotify por ID (spotdl) | 320kbps | ~85% |
| 6 | Spotify por nombre | 320kbps | ~70% |

### Maquina de estados

```
pendiente -> descargando -> analizando -> recortando -> extraido -> completado
                 |              |              |
                 v              v              v
               error          error          error   -> (intentos >= 3: abandonado)
```

Estado reservado `revision_humana` existe en schema pero NO tiene logica automatica.

---

## 2. Analisis por Pregunta del Usuario

### a. Que pasa si no existe en SoundCloud

**Estado actual:** Si SoundCloud no encuentra el track, simplemente pasa al siguiente fallback (YouTube). No se marca "no existe en SoundCloud". El item se procesa con la fuente que funcione.

**Problema:** Si el item falla en todas las fuentes y luego se reintenta, SoundCloud se vuelve a intentar innecesariamente consumiendo ancho de banda y requests del rate limiter.

**Recomendacion:** Registrar en `metadata_extraccion` un campo `fuentes_descartadas` (array) con las fuentes que ya se intentaron sin exito. En reintentos futuros, saltear esas fuentes. Ejemplo:
```json
{
  "fuentes_descartadas": ["soundcloud", "deezer"],
  "ultimo_intento": "2026-03-15T10:00:00Z"
}
```

### b. Que pasa cuando todo falla — Reintentos con backoff

**Estado actual:**
- Si todas las fuentes fallan: `estado = 'error'`, `intentos += 1`
- Con `intentos < 3`: se reintenta en la proxima ejecucion del pipeline (sin delay)
- Con `intentos >= 3`: queda **abandonado permanentemente** hasta reset manual SQL
- **NO hay backoff exponencial**
- **NO hay priorizacion** de items no intentados vs retried

**Problema critico:** Un fallo transitorio (red, rate limit temporal, SoundCloud caido) se trata igual que un fallo permanente (cancion no existe). Despues de 3 intentos rapidos, el item muere sin distinguir la causa.

**Recomendacion — Backoff exponencial:**

Agregar columna `proximo_intento_at TIMESTAMP` a `cola_extraccion_samples`. La query de pendientes filtra:
```sql
WHERE estado = 'pendiente' AND intentos < max_intentos
  AND (proximo_intento_at IS NULL OR proximo_intento_at <= NOW())
```

Calculo del backoff al fallar:
- Intento 1 fallido: `proximo_intento_at = NOW() + INTERVAL '2 days'`
- Intento 2 fallido: `proximo_intento_at = NOW() + INTERVAL '4 days'`  
- Intento 3+ fallido: `proximo_intento_at = NOW() + INTERVAL '4 days'` (cap en 4)

Aumentar `max_intentos` de 3 a 5 para dar mas oportunidades con el backoff.

**Recomendacion — Prioridad no-intentados:**

Modificar la query de pendientes para priorizar items que nunca se han intentado:
```sql
ORDER BY 
    CASE WHEN intentos = 0 THEN 0 ELSE 1 END ASC,
    rs.votos_total DESC NULLS LAST,
    ce.created_at ASC
```

Los no intentados se procesan primero. Los retried esperan su turno + backoff. Esto ahorra ancho de banda: es mejor intentar algo nuevo que fallar otra vez.

### c. Si no existe en ninguna fuente

**Estado actual:** Queda en `error` con `intentos >= 3`. No hay distincion entre "no se encontro" y "fallo tecnico".

**Recomendacion:** Usar el estado `revision_humana` que ya existe en el schema. Despues de agotar intentos (con backoff), marcar automaticamente:
```python
if intentos >= max_intentos:
    actualizar_estado_cola(cola_id, "revision_humana", 
        f"Agotados {max_intentos} intentos. Fuentes descartadas: {fuentes_descartadas}")
```

El estado `revision_humana` significa: "el sistema hizo todo lo posible, requiere intervencion humana."

**Valor de la informacion:** Con `fuentes_descartadas` en metadata y `error_mensaje` descriptivo, se puede:
- Listar items por tipo de fallo (SoundCloud ban vs no existe vs red)
- Agrupar para accion masiva ("todos los que fallaron por rate limit → resetear")
- Identificar canciones obscuras que realmente no existen en ninguna plataforma
- Generar reportes de cobertura por fuente

### d. SoundCloud ban y cookies

**Estado actual:** Si SoundCloud devuelve 401/403, el pipeline **se detiene completamente** (`SoundCloudAuthError`). Esto es correcto — continuar sin SoundCloud descartaria la fuente principal (~95% exito).

**Cookie de SoundCloud:** Actualmente SoundCloud usa:
- `client_id` dinamico (extraido de scripts JS publicos, no requiere cuenta)
- `SOUNDCLOUD_OAUTH_TOKEN` opcional (env var) para desbloquear tracks SNIP/GO

**Recomendacion — UI para cookies SoundCloud:** Asi como el front puede enviar cookies de yt-dlp, deberia poder enviar la cookie/token OAuth de SoundCloud. Cuando se detecte ban:
1. El backend marca un flag `soundcloud_requiere_auth` en un endpoint de estado
2. El front muestra un input para pegar el nuevo token OAuth
3. El backend actualiza `SOUNDCLOUD_OAUTH_TOKEN` y reinicia el pipeline

**IMPORTANTE — Proxy y YouTube:**
Se dejo un comentario explicito en `audio_download.py::_descargar_youtube()` prohibiendo el uso de proxy para descargas de YouTube. Razones:
- DataImpulse rota IP entre requests, causando ~67% de fallos por mismatch metadata/CDN
- El costo de bandwidth (~$1/GB) no se justifica cuando el fallback multi-fuente compensa
- El scraping de WhoSampled SI usa proxy (diferente dominio, diferente patron de trafico)

---

## 3. Resumen de Cambios Recomendados

### Inmediatos (bajo riesgo)

1. **Prioridad no-intentados en query:** Agregar `CASE WHEN intentos = 0 THEN 0 ELSE 1 END ASC` al ORDER BY
2. **Comentario anti-proxy:** Ya agregado en `audio_download.py::_descargar_youtube()`

### Mediano plazo

3. **Columna `proximo_intento_at`:** Migrar schema, implementar backoff exponencial (2→4→4 dias)
4. **Campo `fuentes_descartadas` en metadata_extraccion:** Registrar fuentes ya intentadas
5. **Logica automatica `revision_humana`:** Marcar items que agotan max_intentos con backoff

### Largo plazo

6. **UI cookies SoundCloud:** Endpoint de estado + input en panel admin
7. **Dashboard de metricas:** Tasa de exito por fuente, items por estado, cobertura

---

## 4. Queries de Diagnostico Utiles

```sql
-- Items atascados en error por mas de 7 dias
SELECT COUNT(*) FROM cola_extraccion_samples
WHERE estado = 'error' AND (NOW() - procesado_at > INTERVAL '7 days');

-- Distribucion por estado
SELECT estado, COUNT(*), AVG(intentos)::numeric(4,1) AS avg_intentos
FROM cola_extraccion_samples GROUP BY estado ORDER BY COUNT(*) DESC;

-- Tasa de exito de hoy
SELECT 
    COUNT(CASE WHEN estado = 'completado' THEN 1 END)::float / NULLIF(COUNT(*), 0)
FROM cola_extraccion_samples WHERE DATE(created_at) = CURRENT_DATE;

-- Top 10 pendientes por prioridad (para verificar que no-intentados van primero)
SELECT ce.id, ce.intentos, ce.created_at, rs.votos_total
FROM cola_extraccion_samples ce
JOIN relaciones_sample rs ON ce.relacion_id = rs.id
WHERE ce.estado = 'pendiente' AND ce.intentos < 3
ORDER BY CASE WHEN ce.intentos = 0 THEN 0 ELSE 1 END, rs.votos_total DESC NULLS LAST
LIMIT 10;
```

---

## 5. Lecciones y Gotchas

- [SoundCloud]: El `client_id` se extrae dinamicamente de los scripts JS de soundcloud.com. Si SC cambia la estructura de sus scripts, hay que actualizar el regex
- [YouTube]: `android_vr` es el unico cliente que funciona sin cookies. Si yt-dlp lo depreca, necesitamos cookies obligatoriamente
- [Deezer]: Solo sirve si `timing_seg <= 30` porque el preview es de 30 segundos. Para samples en el medio/final de la cancion, Deezer es inutilizable
- [Proxy]: DataImpulse esta configurado para el scraper Scrapy (WhoSampled) pero NO para audio. Mantener esta separacion
- [Pipeline]: Cuando SoundCloud lanza `SoundCloudAuthError`, el pipeline se detiene correctamente. NO intentar capturar este error para continuar — sin SoundCloud la tasa de exito cae drasticamente
- [Rate Limiter]: Intervalo fijo de 60s entre descargas. Persistente entre reinicios via `.rate_limiter_state`. Limite diario: 2000 items
