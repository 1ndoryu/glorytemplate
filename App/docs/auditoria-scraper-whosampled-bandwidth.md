# Auditoria Scraper WhoSampled — Ancho de Banda (QQ123)

> El scraper funciona correctamente. Esta auditoria evalua las medidas implementadas para ahorro de ancho de banda y lista oportunidades de mejora.

## Veredicto General

**El scraper ya implementa las medidas fundamentales de ahorro de bandwidth.** La arquitectura es conservadora y correcta: single-threaded, autothrottle, dedup persistente, tracking con presupuesto. No requiere cambios urgentes.

## Medidas Implementadas (Correcto)

### Rate Limiting
- `DOWNLOAD_DELAY = 3` con `RANDOMIZE_DOWNLOAD_DELAY = True` — correcto
- `CONCURRENT_REQUESTS = 1` — single-threaded, minimo impacto
- `AUTOTHROTTLE_ENABLED` con target 1.0 — se adapta a latencia del servidor

### Compresion en Transito
- `Accept-Encoding: gzip, deflate, br` — brotli + gzip, reduce 60-80% del payload
- curl_cffi descomprime automaticamente, headers limpiados para Scrapy

### Deduplicacion Multi-Capa
- **Sesion:** `DeduplicacionPipeline` — descarta RelacionItems duplicados por whosampled_id
- **Persistente:** `scraping_log` en PostgreSQL — `url_ya_procesada()` evita re-scraping entre runs
- **Imagenes:** SHA256 hash de URL — si archivo existe en disco no re-descarga
- **Scrapy nativo:** `RFPDupeFilter` — fingerprint de requests en la misma sesion

### Presupuesto y Tracking
- `BandwidthTrackerMiddleware` — contabiliza bytes por response
- Alerta a 80% del presupuesto (5 GB default)
- Cierre automatico del spider al exceder presupuesto (hard limit)

### Re-scraping Controlado
- `INTERVALO_RESCRAPE_DIAS = 180` — no revisita antes de 6 meses
- Intervalo creciente (180d × veces_rescrapeado) — menos frecuente con cada iteracion
- Solo tipos `track`, `track_samples`, `track_sampled`, `artist` marcados re-scrapeables

### Paginacion Limitada
- `MAX_PAGES = 10` en TrackSpider — no sigue paginacion infinita
- `MAX_PAGES = 5` en hot_samples — limita listas hot

## Oportunidades de Mejora (No Urgentes)

### 1. Retry en 429 (mejora menor)
**Estado actual:** `RETRY_TIMES = 5`, `RETRY_HTTP_CODES = [403, 429, 500, 502, 503, 520]`
**Problema:** Un 429 (rate-limit) no se resuelve con retry inmediato. Con DOWNLOAD_DELAY=3, el retry se hace 3s despues, que puede seguir siendo rate-limited. 5 retries × pagina completa = 5x bandwidth desperdiciado.
**Nota:** 403 SI puede resolverse con retry (Cloudflare challenge + cookies), asi que mantener 403 es correcto.
**Recomendacion:** Reducir `RETRY_TIMES` a 3 y sacar 429: `RETRY_HTTP_CODES = [403, 500, 502, 503, 520]`. Impacto estimado: -5% bandwidth en runs con rate limiting.

### 2. Doble warm-up
**Estado actual:** `CurlCffiDownloaderMiddleware._warmup()` (middleware) + `TrackSpider.start()` yield warm-up request.
**Problema:** La homepage se descarga 2 veces: una por el middleware y otra como primer request del spider.
**Nota:** Esto es intencional: el middleware establece cookies, pero el spider necesita un request Scrapy para que el callback funcione. La sesion curl_cffi ya tiene las cookies. El warm-up del spider es redundante funcionalmente pero es un patron defensivo.
**Recomendacion:** Si se quiere ahorrar ~50KB, eliminar el warm-up del spider y dejar solo el del middleware. Riesgo bajo.

### 3. HTTP Cache entre runs (mejora grande, implementacion media)
**Estado actual:** No hay `HTTPCACHE_ENABLED`. Cada re-scrape descarga contenido completo.
**Problema:** Si re-scrapeas un track despues de 180 dias pero nada cambio, descargas la pagina completa (~200KB) innecesariamente.
**Recomendacion:**
```python
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 604800  # 7 dias
HTTPCACHE_DIR = 'httpcache'
HTTPCACHE_IGNORE_HTTP_CODES = [403, 404, 429, 500, 502, 503]
```
**Impacto:** -30-50% bandwidth en re-scrapes. Requiere espacio en disco (~500MB de cache).
**Riesgo:** El cache usa disco en el VPS. Necesita cron de limpieza.

### 4. Accept header incluye tipos de imagen
**Estado actual:** `Accept: ...image/avif,image/webp,image/apng,*/*;q=0.8`
**Nota:** Esto NO causa que el servidor envie imagenes inline (las imagenes son requests separados, no embebidas en HTML). El Accept header solo afecta la negociacion de contenido para esta request especifica. Los navegadores reales envian este header, asi que es correcto para evasion de fingerprinting.
**Recomendacion:** Mantener como esta. Cambiarlo podria hacer el fingerprint menos realista.

### 5. Imagenes: descarga completa
**Estado actual:** `ImageDescargaPipeline` descarga 2 imagenes por RelacionItem (portadas de cancion destino + fuente).
**Nota:** Las imagenes son portadas de album, necesarias para mostrar en la UI. El dedup SHA256 evita re-descargas.
**Recomendacion:** Si nunca se muestran portadas desde copia local (solo se usa URL externa), deshabilitar via `IMAGES_STORE_PATH=""`. Pero si se usan para independencia del CDN externo, mantener.

## Resumen Cuantitativo

| Medida | Ahorro estimado | Estado |
|--------|----------------|--------|
| Compresion gzip/br | 60-80% payload | Implementado |
| Dedup persistente | 90%+ en re-runs | Implementado |
| Presupuesto hard-stop | Limita costo maximo | Implementado |
| Autothrottle | Reduce requests/min | Implementado |
| Dedup imagenes | Evita re-descargas | Implementado |
| HTTP Cache | 30-50% re-scrapes | NO implementado |
| Retry 429 fix | 5% en rate-limit | NO implementado |

## Conclusion

El scraper tiene buenas practicas de ahorro de ancho de banda. Las 2 mejoras pendientes (HTTP cache + retry 429) son de prioridad baja y no requieren atencion inmediata. El sistema de presupuesto con hard-stop protege contra desbordes de costo.
