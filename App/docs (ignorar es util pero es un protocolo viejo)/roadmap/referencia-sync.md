# Kamples — Arquitectura de Referencia Sync v2

> Documentación técnica de las arquitecturas implementadas para sync bidireccional y cola de procesamiento IA.

---

## Sync v2 Colecciones

**Modelo:** Carpetas locales = colecciones del usuario (no categorias IA). `carpetaSync/{coleccion}/sample.wav` + `Sin coleccion/`.

**Tracking (Tauri Store):** `archivos: Record<"{sampleId}_{coleccionId}", ArchivoTracking>`, `colecciones: Record<number, ColeccionLocal>`, `sinColeccion: Set<number>`, `historial: AccionHistorial[]`.

**Endpoint:** `GET /me/sync/colecciones` -> colecciones con samples + sinColeccion.

### Local → Servidor

| Acción local | Operación servidor |
|---|---|
| Mover sample entre carpetas | POST + DELETE coleccion_samples |
| Renombrar carpeta | PUT nombre colección |
| Crear carpeta | POST colección |
| Renombrar sample | Nada (nombre local libre) |
| Borrar sample | `syncDeshabilitado = true` |
| Borrar carpeta | Marcar todos samples deshabilitados |

### Servidor → Local

| Acción servidor | Operación local |
|---|---|
| Sample agregado | Descargar a carpeta |
| Colección renombrada | Renombrar carpeta local (guard watcher) |
| Sample/colección eliminado | Nada (local permanece como "huérfano") |

### Edge cases activos

- **Conflicto nombres carpeta:** sufijo ` (2)`
- **Disco lleno:** guard fail-open
- **Offline-online:** offlineQueue
- **Sample en 2+ colecciones:** copia
- **Subcarpetas:** colección padre (max 2 niveles, `parent_id` + `depth`)
- **Caracteres especiales:** sanitize filesystem

---

## Cola IA

**Tabla:** `cola_procesamiento_ia`

| Campo | Valores |
|---|---|
| tipo | sample, comentario, publicacion |
| operacion | analisis_audio, moderacion_texto, moderacion_imagen |
| estado | pendiente, procesando, completado, error_reintento, error_final |

- Max 2 reintentos, +30min entre reintentos
- Cron cada 15min, FIFO 10 items por ejecución
- `GroqHttpClient` detecta 429 → caller encola automáticamente
- Panel admin: stats + reintentar individual/masivo
