# C289 — Bugs de Sync detectados en testing

## Bug 1: Colecciones fantasma en tracking (RESUELTO en C289a)
- **Síntoma:** 47 colecciones antiguas (ids 15-76) persistían en tracking local causando 403 en cascada.
- **Causa raíz:** `sincronizarColecciones` purgaba *samples* ausentes del servidor, pero NUNCA *colecciones*. Colecciones borradas del servidor permanecían indefinidamente.
- **Fix:** Purga de colecciones en `sincronizarColecciones()`. Compara tracking vs servidor. Elimina colecciones ausentes (con guard anti-respuesta vacía).
- **Estado:** Implementado y testeado — 47 colecciones purgadas correctamente.

## Bug 2: Re-upload + duplicados tras rename de colección (server→local)
- **Síntoma:** Al renombrar colecciones en el servidor (as1→as11, ap2→ap22), los archivos dentro se re-suben y se mueven a "duplicados".
- **Causa raíz:** `actualizarNombreColeccion()` actualiza `nombre` y `carpetaLocal` de la colección, pero NO actualiza `rutaLocal` de los archivos dentro de ella. Cuando la carpeta se renombra en disco (as1→as11), los archivos quedan con rutas viejas (`...test/as1/file.wav`). El watcher ve los archivos en la nueva ruta (`...test/as11/file.wav`), busca en `indiceRuta`/tracking por esa ruta, no la encuentra → los trata como archivos nuevos → `uploadQueue` detecta hash duplicado → mueve a carpeta "duplicados".
- **Fix:** Extender `actualizarNombreColeccion()` para actualizar `rutaLocal` e `indiceRuta` de todos los archivos de la colección renombrada + subcollecciones hijas.

## Bug 3: Polling nunca descarga samples del servidor
- **Síntoma:** El usuario publica un sample en la web, se crea la carpeta localmente, pero el sample nunca se descarga.
- **Causa raíz:** `sincronizarEstructuraCarpetas()` (el polling) siempre llama a `sincronizarColecciones(path, undefined, /* soloEstructura= */ true)`. El flag `soloEstructura=true` salta TODA la lógica de descarga de archivos. Resultado: las carpetas se crean/renombran correctamente, pero los samples nuevos del servidor nunca se descargan durante el polling periódico.
- **Fix:** Cambiar polling a `soloEstructura=false` cuando delta detecta cambios. La lógica de descarga ya tiene guards (verificación de existencia, `esDescargaEnCurso` con gracia de 10s) para evitar re-descargas y conflictos con el watcher.

## Bug 4: Cache de colecciones del servidor ausente (429 Too Many Requests)
- **Síntoma:** Múltiples 429 en `obtenerColeccionesDelServidor`. Se llama desde: sincronizarColecciones, rehidratación de imágenes, buscarColeccionServidorPorNombre — sin coordinación.
- **Causa raíz:** Cada llamada hace un fetch independiente. Con polling cada 15-60s + rehidratación + búsquedas, se supera el rate limit de 60 req/min.
- **Fix (C289a):** Cache client-side con TTL de 10s + `invalidarCacheColecciones()` para invalidar manualmente tras crear/renombrar.

## Bug 5: Rate limit PHP muy bajo para desarrollo
- **Síntoma:** 429 en operaciones normales de testing.
- **Causa raíz:** `sync_colecciones` tiene limit 60/60s. Con múltiples callers y polling frecuente, se agota rápido.
- **Fix:** Aumentar `sync_colecciones` a 120/60s y `sync_delta` a 200/60s.

## Bug 6: Samples pre-existentes nunca se descargan (C289b — RESUELTO)
- **Síntoma:** Sample que ya existía en una colección del servidor antes de activar sync nunca se descarga. Descargas fallidas tampoco se reintentan.
- **Causa raíz:** `sincronizarEstructuraCarpetas()` solo llama a `sincronizarColecciones()` (que ejecuta descargas) cuando `consultarDeltaSync()` retorna `true` (cambios nuevos). Si el cursor delta ya pasó el momento en que se creó el sample, delta retorna "sin cambios" y la fase de descarga NUNCA se ejecuta. Esto crea un agujero permanente: todo lo que existía antes del cursor actual, o que falló al descargarse, queda perdido.
- **Fix:** Bypass periódico del delta. Variable `ultimaSyncConDescargas` trackea cuándo fue la última sync completa. Si han pasado >5 min (`RECONCILIACION_DESCARGAS_MS`) sin una sync con descargas, se fuerza full sync independientemente de delta. `descargarSiNecesario()` es idempotente (retorna 'existente' si el sample ya está en tracking), así que el overhead es mínimo.
- **Archivo:** `syncWatcherSetup.ts` — `sincronizarEstructuraCarpetas()`
- **Aprendizaje:** El delta es una *optimización*, no una *fuente de verdad*. Siempre debe existir un mecanismo de reconciliación periódica que compare estado real del servidor vs local, independiente de eventos incrementales.

## Bug 7: Tracking fantasma impide re-descarga (C289c — RESUELTO)
- **Síntoma:** Sample existía en el servidor y en una colección local. Tras rename de colección, el watcher lo detectó como archivo nuevo → hash duplicado → movido a "duplicados/". El archivo ya no existe en la carpeta de la colección, pero la reconciliación periódica (C289b) no lo repara.
- **Causa raíz:** `descargarSiNecesario()` verifica si el sample existe en **tracking** (`obtenerArchivo`), NO en **disco**. Si el tracking dice que existe (aunque el archivo fue movido/borrado), retorna `'existente'` sin verificar. Lo mismo aplica al check cross-colección (`buscarArchivoPorSampleId`): si otra entrada tracking apunta a un archivo que ya no está, se registra tracking nuevo apuntando a nada.
- **Fix:** Agregar verificación `exists()` (Tauri FS) en ambos checkpoints de `descargarSiNecesario()`:
  1. Si tracking tiene el sample pero el archivo NO existe en `rutaLocal` → limpiar entrada corrupta (`eliminarArchivo`) + continuar a descarga.
  2. Si otro tracking cross-colección tiene el sample pero el archivo NO existe → limpiar entrada corrupta + continuar a descarga.
  3. Solo retornar 'existente' si el archivo **realmente existe en disco**.
- **Archivo:** `syncCollectionService.ts` — `descargarSiNecesario()`
- **Aprendizaje:** En un sistema de sync, el tracking es una *caché* del estado del disco, no la fuente de verdad. Cualquier decisión basada en tracking DEBE verificarse contra disco si la consecuencia de un falso positivo es omitir una operación crítica (como descargar un archivo faltante).
