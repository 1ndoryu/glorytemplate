# QL67 — Rotación de modelos IA + reintentos + contexto origen_subida

## Resumen

Refactorización del sistema de IA para: (1) rotar modelos por inteligencia con reintentos, (2) esperar entre samples/reintentos en modo cola, (3) pasar contexto de carpetas (`origen_subida`) al prompt de análisis.

## Procesos de IA afectados

### 1. ServicioIA (análisis creativo de audio)
- **Archivo:** `App/Kamples/Api/ServicioIA.php`
- **Modelos LLM:** 8 modelos Groq ordenados por inteligencia + OpenAI fallback
- **Cambios:**
  - `MODELOS_GROQ` reordenado: gpt-oss-120b > kimi-k2-0905 > kimi-k2 > groq/compound > llama-3.3-70b > qwen3-32b > llama-4-scout > gpt-oss-20b
  - Reintentos: max 3 por modelo en modo cola, 1 en modo live
  - Pausa: 60s entre reintentos (solo en cola)
  - 429 per-model: no cancela la cadena, solo salta al siguiente
  - Umbral cuenta: 3 modelos consecutivos con 429 = rate limit de cuenta
- **Modelos Whisper (STT):** Sin cambios (whisper-large-v3, whisper-large-v3-turbo)
- **OpenAI fallback:** gpt-4o-mini si todos los Groq fallan

### 2. ProcesadorColaIA (procesador cron)
- **Archivo:** `App/Kamples/Services/ProcesadorColaIA.php`
- **Cambios:**
  - `PAUSA_ENTRE_ITEMS_SEGUNDOS = 60`: sleep entre cada sample procesado
  - Pasa `modoCola: true` a `ServicioIA::analizarAudio()` para activar reintentos lentos

### 3. ServicioImagenIA (análisis de imágenes de publicaciones)
- **Archivo:** `App/Kamples/Api/ServicioImagenIA.php`
- **Modelos vision:** llama-4-maverick > llama-4-scout
- **Cambios:**
  - Reintentos: max 2 por modelo con pausa de 30s (ejecuta en shutdown hook, no bloquea)
  - Solo reintenta si fue 429 (errores reales no se reintentan)

### 4. AnalizadoresModeracion (moderación de contenido)
- **Archivo:** `App/Kamples/Api/AnalizadoresModeracion.php`
- **Modelos:**
  - Guard (texto): `gpt-oss-safeguard-20b` — modelo único especializado, sin rotación
  - Vision (imágenes): scout > maverick — rotación por 429
  - Contextual (combinada): gpt-oss-120b > kimi-k2-0905 > llama-3.3-70b — rotación por 429
- **Cambios:**
  - `MODELO_VISION` → `MODELOS_VISION` array con fallback
  - `MODELO_CONTEXTUAL` → `MODELOS_CONTEXTUAL` array con fallback
  - Rotación en `analizarContextual`, `analizarImagenComentario`, `analizarImagenes`
  - Sin sleep (moderación es sincrónica; 429 ya encola para reintento vía cron)

### 5. ServicioModeracionIA (orquestador)
- **Archivo:** `App/Kamples/Api/ServicioModeracionIA.php`
- **Sin cambios directos:** La rotación se maneja en AnalizadoresModeracion
- El mecanismo de encolado (429 → ColaProcesamientoIA → reproceso cron) sigue vigente

## Procesos NO tocados (explícitamente excluidos)

- **Scripts Python** (kamples-scraper): tienen sus propios modelos y lógica de IA, no se modifican
- **GroqHttpClient**: Sin cambios en lógica HTTP; `fueRateLimited()` y `resetearEstadoRateLimit()` se usan como API

## Contexto origen_subida

### Flujo
1. Desktop sync sube archivo → metadata JSONB incluye `origen_subida` (ruta de carpetas, ej: "Hip Hop/West Coast/Snoop Dogg")
2. `PipelineAudio.php` lee `SamplesRepository::obtenerMetadataJsonb($sampleId)` → extrae `origen_subida`
3. `PromptsIA::construirAnalisis()` agrega al prompt: "El archivo fue subido desde la siguiente ruta de carpetas: ..."
4. La IA usa los nombres de carpetas como pistas para inferir género/estilo/artista

### Archivos modificados
- `App/Kamples/Api/PipelineAudio.php` — lee metadata, extrae `origen_subida`, agrega a `$contextoTecnico`
- `App/Kamples/Api/PromptsIA.php` — incluye `origen_subida` en el prompt de `construirAnalisis()`
- `App/Kamples/Database/Repositories/SamplesRepository.php` — nuevo método `obtenerMetadataJsonb()`

## Decisiones técnicas

- [Groq rate limits]: Los límites son per-model (cada modelo tiene su RPM/TPM). 429 en gpt-oss-120b NO significa que llama-3.3-70b esté limitado.
- [Umbral cuenta]: Si 3+ modelos consecutivos dan 429, probablemente es rate limit de cuenta → parar.
- [Sleep solo en cola]: En modo live (upload directo), no se espera — se intenta siguiente modelo inmediatamente.
- [Moderación sin sleep]: Moderación corre sincrónica durante la creación de posts. Sleep bloquearía al usuario. Ya tiene encolado para 429.
- [ImagenIA con sleep]: Ejecuta en shutdown hook (after response). 30s de sleep no bloquea usuarios.
- [Guard sin rotación]: gpt-oss-safeguard-20b es un modelo especializado en safety. No se puede reemplazar con un LLM general para clasificación de seguridad.
