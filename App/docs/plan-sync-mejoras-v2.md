# Plan Sync Mejoras v2 — Auditoría de Robustez y Hardening

> **Versión:** 2.0 | **Fecha:** 07/03/2026  
> **Scope:** Revisión profunda post-C278 (F1-F6 + F5.2 + F6.2). Foco en pulir, no en features nuevas.  
> **Base:** Auditoría de 8 archivos PHP backend + 19 archivos TypeScript desktop.  

---

## Resumen Ejecutivo

La implementación C278 (sync mejoras F1-F6) + C279 (F5.2 versioning + F6.2 panel diagnóstico) cubre la funcionalidad planificada. Esta auditoría v2 identifica **3 críticos**, **8 altos**, **6 medios** y **5 bajos** en PHP backend, y **2 críticos**, **6 altos**, **6 medios** en TypeScript frontend. El foco es hardening: race conditions, error handling, SOLID, y resiliencia.

---

## SECCIÓN A — Backend PHP

### P0 — CRÍTICOS (Bloquean integridad de datos)

#### C1. Race condition en agregarSample — posición duplicada
- **Archivo:** `ColeccionesCrudController.php` → `ColeccionSamplesRepository`
- **Problema:** `siguientePosicion()` + `agregar()` son dos queries separadas. Requests concurrentes obtienen la misma posición.
- **Impacto:** Posiciones duplicadas en colecciones → orden impredecible.
- **Solución:** INSERT atómico con subquery:
  ```sql
  INSERT INTO coleccion_samples (coleccion_id, sample_id, posicion)
  SELECT :colId, :sampleId, COALESCE(MAX(posicion), 0) + 1
  FROM coleccion_samples WHERE coleccion_id = :colId
  RETURNING posicion
  ```
- **Esfuerzo:** Bajo (~30 min). Modificar solo el Repository.

#### C2. Race condition en límite de descargas diarias (TOCTOU)
- **Archivo:** `DescargasController.php`
- **Problema:** Advisory lock existe pero el INSERT de la descarga puede ocurrir fuera del scope del lock. Hay return paths que salen antes de liberar.
- **Impacto:** Usuarios pueden exceder el límite diario de descargas.
- **Solución:** `try { ... } finally { advisoryUnlock() }` envolviendo TODA la sección crítica (conteo + validación + INSERT).
- **Esfuerzo:** Bajo (~30 min). Reestructurar el flujo del método.

#### C3. Fallo silencioso en revenue share
- **Archivo:** `DescargasController.php`
- **Problema:** `registrarTransaccionRevenueShare()` captura `\Throwable` y solo loguea. La descarga se marca exitosa pero el creador nunca recibe pago.
- **Impacto:** Pérdida financiera silenciosa para creadores.
- **Solución:** Dos opciones (elegir una):
  - **Opción A (estricta):** Si revenue share falla, la descarga también falla → retornar 500.
  - **Opción B (resiliente):** Encolar job de reintentos (`wp_schedule_single_event`) + marcar descarga como `revenue_pendiente`.
- **Esfuerzo:** Medio (~1.5h). Requiere decidir política de negocio.

---

### P1 — ALTOS (Afectan seguridad o arquitectura)

#### A1. Validación MIME de imágenes usa datos del cliente
- **Archivo:** `ColeccionesCrudController.php`
- **Problema:** `$archivo['type']` viene de headers HTTP del cliente → spoofeable. Un atacante puede subir malware con `Content-Type: image/jpeg`.
- **Solución:** Usar `mime_content_type($archivo['tmp_name'])` + `filesize($archivo['tmp_name'])` (datos del servidor, no del cliente).
- **Esfuerzo:** Bajo (~20 min).

#### A2. Advisory lock sin cleanup garantizado
- **Archivo:** `DescargasController.php`
- **Problema:** Múltiples `return` antes de `advisoryUnlock()`. Si una excepción ocurre mid-flow, lock queda huérfano hasta fin de sesión.
- **Solución:** `try { ... } finally { advisoryUnlock() }` (complementa C2).
- **Esfuerzo:** Incluido en C2.

#### A3. Violación SRP en ColeccionesCrudController
- **Archivo:** `ColeccionesCrudController.php`
- **Problema:** Mezcla validación, rate limiting, persistencia, changelog, y file upload en una clase.
- **Solución:** Extraer `ColeccionesService.php` como capa intermedia con métodos orquestadores. Controller solo parsea request/response.
- **Esfuerzo:** Alto (~4-6h). Refactor progresivo viable.

#### A4. Violación OCP en actualizar() — cadena de ifs
- **Archivo:** `ColeccionesCrudController.php`
- **Problema:** Cada campo nuevo requiere agregar `if (isset($body[...]))`. Cerrado a extensión.
- **Solución:** Strategy pattern o mapa de actualizadores registrados. Cada campo tiene su validador + setter. Agregar campo = registrar en el mapa, no tocar `actualizar()`.
- **Esfuerzo:** Medio (~2h). Puede implementarse junto con A3.

#### A5. Query doble en obtenerDelta()
- **Archivo:** `SyncChangelogRepository.php`
- **Problema:** Query 1 verifica si el cursor existe, Query 2 obtiene los cambios. Dos roundtrips a BD.
- **Solución:** Una sola query que intenta obtener cambios. Si retorna vacío y cursor > 0, verificar si cursor es inválido o simplemente no hay cambios (comparar con MAX(id)).
- **Esfuerzo:** Bajo (~30 min).

#### A6. Falta validación interna en obtenerDelta() $limite
- **Archivo:** `SyncChangelogRepository.php`
- **Problema:** El controller valida `$limite` pero el repository no. Callers internos (CLI, cron) podrían pasar valores sin límite.
- **Solución:** `$limite = max(1, min(500, $limite))` en el repository (defensa en profundidad).
- **Esfuerzo:** Trivial (~5 min).

#### A7. descargasSinColeccion incluye estados transitorios
- **Archivo:** `SyncRepository.php`
- **Problema:** La query incluye samples en estado `processing` e `in_supervision`. Desktop sincroniza archivos que podrían desaparecer o cambiar.
- **Solución:** Para sync desktop, solo incluir `ESTADO_ACTIVO`. Estados transitorios se sincronizan cuando el sample se activa (via delta changelog).
- **Esfuerzo:** Bajo (~15 min). Revisar impacto en UX (¿el usuario quiere ver sus propios samples procesando?).

#### A8. Falta validación de tamaño metadata JSONB
- **Archivo:** `SyncChangelogRepository.php`
- **Problema:** Sin límite → metadata puede crecer sin control (bug o abuso). Query pesados, storage excesivo.
- **Solución:** `if (strlen($metadataJson) > 10240) → truncar + log warning`.
- **Esfuerzo:** Trivial (~10 min).

---

### P2 — MEDIOS

#### M1. JSON malformado en samples_json → fallo silencioso
- **Archivo:** `SyncController.php`
- **Problema:** Si `json_decode` falla, `$samples = []`. Desktop recibe colección vacía sin saber que hay error.
- **Solución:** Retornar campo `_json_error: true` en la respuesta para que Desktop pueda detectarlo, o retornar 500 si es colección principal.
- **Esfuerzo:** Bajo (~15 min).

#### M2. Re-query faltante antes de INSERT descarga
- **Archivo:** `DescargasController.php`
- **Problema:** Sample se consulta al inicio pero el INSERT ocurre muchas líneas después. El sample podría haber cambiado de estado.
- **Solución:** Re-verificar `permitir_descarga` justo antes del INSERT (o usar CHECK constraint en BD).
- **Esfuerzo:** Bajo (~15 min).

#### M3. incrementarDescargas retorna void
- **Archivo:** `SamplesRepository.php`, `UsuariosExtRepository.php`
- **Problema:** Si falla el incremento, no hay forma de saberlo. Estadísticas silenciosamente incorrectas.
- **Solución:** Retornar `bool` + verificar en controller. Si falla, encolar retry o al menos loguear.
- **Esfuerzo:** Bajo (~20 min).

#### M4. Changelog sin verificación de retorno
- **Archivos:** Controllers que llaman `SyncChangelogRepository::registrar()`
- **Problema:** Si `registrar()` retorna null, nunca se verifica. Delta sync queda desincronizado.
- **Solución:** Verificar retorno y loguear `KamplesLogger::critical()` si falla. No bloquear la operación principal (mejor esfuerzo + log).
- **Esfuerzo:** Bajo (~15 min por controller).

#### M5. Whitelist de estados sync no valida contra enums
- **Archivo:** `SyncRepository.php`
- **Problema:** `sqlEstadosVisiblesSync()` construye SQL desde array hardcodeado. Si un enum cambia, no hay error — solo datos incorrectos.
- **Solución:** Validar que cada estado existe en `SamplesEnums::TODOS_ESTADOS` antes de usarlo.
- **Esfuerzo:** Trivial (~10 min).

#### M6. Política de purga sin documentar
- **Archivo:** `SyncChangelogRepository.php`
- **Problema:** `purgar()` existe pero: ¿cuándo se ejecuta? ¿Qué pasa si un cliente tiene cursor anterior a la purga?
- **Solución:** Documentar en código + asegurar que `obtenerDelta()` retorna `fullSyncRequired=true` si cursor < MIN(id).
- **Esfuerzo:** Bajo (~20 min) — ya está parcialmente implementado, falta documentación.

---

### P3 — BAJOS

| # | Hallazgo | Archivo | Acción |
|---|----------|---------|--------|
| B1 | Comentario desactualizado streaming | DescargasController.php | Actualizar docblock |
| B2 | Verificar imports no usados | SyncController.php | Limpieza |
| B3 | Profundidad colecciones sin error diferenciado | ColeccionesCrudController.php | Retornar código específico si parentId inválido |
| B4 | Inconsistencia camelCase/snake_case en campos | Múltiples | Documentar convención: snake_case en BD, camelCase en API |
| B5 | NOTA: Índices sync_changelog ya existen | v024_sync_changelog.sql | No acción — ya creados |

---

## SECCIÓN B — Frontend TypeScript Desktop

### P0 — CRÍTICOS

#### TC1. Race condition cross-window en Store mutations
- **Archivo:** `syncTrackingService.ts` (~L241-269)
- **Problema:** `fusionarHistorialSamplesPersistidos()` merge local con Store sin serialización. Dos ventanas escriben simultáneamente → datos sobrescritos/perdidos.
- **Impacto:** `imagenUrl` revertido a null, historial corrompido, actualizaciones perdidas.
- **Solución:**
  - Agregar `version: number` al checkpoint metadata.
  - Antes de merge, verificar que no existe versión más nueva en Store.
  - Si versión más nueva existe → re-leer antes de merge.
  - Long-term: implementar lock via Store flag (`checkpointLock: windowId | null`).
- **Esfuerzo:** Medio (~2h).

#### TC2. uploadQueueService — dedup race entre hash y enqueue
- **Archivo:** `uploadQueueService.ts` (~L97-145, L185-211)
- **Problema:** `rutasEncolando.delete()` libera el guard antes de que `rutasEnCola.add()` se ejecute. Ventana de tiempo donde el mismo archivo puede encolarse dos veces. Además, `existeArchivoActivoConHash()` no es atómico con el enqueue.
- **Impacto:** Uploads duplicados del mismo archivo.
- **Solución:** 
  - Mover `rutasEnCola.add()` DENTRO del bloque que precede al `finally`.
  - Agregar `pendingHashes: Set<string>` que se marca ANTES del await de hash → se borra al encolar.
- **Esfuerzo:** Bajo (~30 min).

---

### P1 — ALTOS

#### TA1. Memory leak en event listeners de fileWatcherService
- **Archivo:** `fileWatcherService.ts`, `syncTrackingService.ts` (~L346-348)
- **Problema:** `listen('limpiar-historial-samples')` registra listener que NO se desregistra en `detenerObservacion()`. Cada restart acumula listeners.
- **Solución:** Almacenar unsubscribe function retornada por `listen()`. Llamarla en `detenerObservacion()`.
- **Esfuerzo:** Bajo (~15 min).

#### TA2. offlineQueueService — 409 tratado como éxito indiscriminado
- **Archivo:** `offlineQueueService.ts` (~L156-159)
- **Problema:** Cualquier 409 se marca como éxito → no solo conflicto de versión, sino errores auth/permisos disfrazados de 409 se pierden silenciosamente.
- **Solución:** Inspeccionar `response.body` antes de decidir. Solo 409 con `code: 'conflicto_version'` es éxito. Otros 409 → re-encolar o marcar error.
- **Esfuerzo:** Bajo (~20 min).

#### TA3. syncJournal — checkpoint callback silencia fallos
- **Archivo:** `syncJournal.ts` (~L115-125)
- **Problema:** `onCheckpointCallback()` catch solo loguea. Si Store write falla, journal cree que checkpoint fue exitoso. Crash posterior → recovery usa datos stale.
- **Solución:** Re-throw después de loguear, o cambiar retorno a `{ success: boolean }`.
- **Esfuerzo:** Bajo (~15 min).

#### TA4. fileWatcherService — rename handler sin try-catch
- **Archivo:** `fileWatcherService.ts` (~L577-630)
- **Problema:** `procesarEventoRename()` no tiene try-catch propio. Si callback de rename falla (API down), excepción se propaga y puede detener el watcher loop.
- **Solución:** Envolver en try-catch con `logSync.error()`.
- **Esfuerzo:** Trivial (~10 min).

#### TA5. syncService — race en inicialización multi-window
- **Archivo:** `syncService.ts` (~L53-97)
- **Problema:** `inicializarSyncService()` carga tracking + migra v1→v2 sin coordinar entre ventanas. Dos ventanas simultáneas pueden duplicar datos de migración.
- **Solución:** Usar flag en Store (`initializing: true/false`). Primera ventana que lo adquiere hace migración, las demás esperan o skip.
- **Esfuerzo:** Bajo (~30 min).

#### TA6. syncService.ts — excede 800+ LOC, viola SRP
- **Archivo:** `syncService.ts`
- **Problema:** Actúa como inicializador, facade, state manager, config manager, error recovery y coordinador multi-window.
- **Solución:** Split progresivo:
  - `syncInitializer.ts` — carga módulos, migración, setup inicial
  - `syncOrchestrator.ts` — coordinación upload/download/polling
  - `syncMultiWindow.ts` — comunicación inter-window
  - `syncService.ts` — re-exporta API pública
- **Esfuerzo:** Alto (~4h). Viable como refactor progresivo.

---

### P2 — MEDIOS

#### TM1. Download loop sin error boundaries per-sample
- **Archivo:** `syncCollectionService.ts` (~L500+)
- **Problema:** Un sample que falla puede dejar contadores inconsistentes. Try-catch envuelve todo el loop, no cada sample.
- **Solución:** Per-sample try-catch. Error en uno → log + continuar con el siguiente. Contadores exactos.
- **Esfuerzo:** Bajo (~20 min).

#### TM2. Shared estado object sin protección de concurrencia
- **Archivo:** `syncState.ts` (~L30-40)
- **Problema:** `estado` es objeto mutable compartido. Operaciones async concurrentes (dos uploads) mutan `indiceArchivos` array simultáneamente.
- **Solución:** Usar actualizaciones inmutables (`estado.indiceArchivos = [...estado.indiceArchivos, newItem]`) o implementar cola de mutaciones.
- **Esfuerzo:** Medio (~1h).

#### TM3. V1/V2 tracking coexistencia
- **Archivo:** `syncWatcherSetup.ts`, `syncTrackingService.ts`
- **Problema:** Ambos sistemas (v1 indiceArchivos + v2 tracking module) activos. Lecturas van primero a v2, fallback a v1. Si ambos tienen datos distintos → comportamiento indefinido.
- **Solución:** Completar migración v1→v2 y deshabilitar lecturas de v1. Flag `v1Deshabilitado = true` post-migración.
- **Esfuerzo:** Medio (~1.5h).

#### TM4. Hash truncado no verifica integridad post-descarga
- **Archivo:** `syncCollectionService.ts`, `hashService.ts`
- **Problema:** Después de descargar, solo se verifica tamaño, no hash. Descarga truncada/corrompida con mismo tamaño pasa la validación.
- **Solución:** Hash parcial post-descarga (primeros 16KB) y comparar con hash del servidor (requiere que el servidor envíe hash).
- **Esfuerzo:** Medio (~2h). Requiere endpoint backend para obtener hash.

#### TM5. offlineQueue sin límite de tamaño
- **Archivo:** `offlineQueueService.ts`
- **Problema:** `cola` array crece sin límite. Bajo condiciones patológicas (servidor caído por días), puede acumular miles de operaciones.
- **Solución:** `MAX_QUEUE_SIZE = 500`. Al exceder → FIFO eviction (descartar más antiguas) + log warning.
- **Esfuerzo:** Bajo (~15 min).

#### TM6. Semáforo de uploads no es global
- **Archivo:** `uploadQueueService.ts` (~L297-310)
- **Problema:** Semáforo creado dentro de `procesarCola()` — solo aplica a uploads que pasan por esa función. Uploads desde otros paths (polling manual, otra ventana) no respetan el límite.
- **Solución:** Semáforo a nivel de módulo. Toda ruta de upload pasa por él.
- **Esfuerzo:** Bajo (~20 min).

---

### P3 — BAJOS

| # | Hallazgo | Archivo | Acción |
|---|----------|---------|--------|
| TB1 | Type casts `as typeof storeCache` sin validación | syncTrackingService.ts, uploadQueueService.ts | Crear TypedStore wrapper |
| TB2 | circuitBreaker sin auto-reset por inactividad | circuitBreaker.ts | Agregar TTL de 30min sin actividad → reset |
| TB3 | DIP violation en syncWatcherSetup (imports directos) | syncWatcherSetup.ts | Long-term: service locator. Low priority |

---

## SECCIÓN C — Plan de Ejecución por Sesiones

### Sesión 1 — Críticos + Quick Wins (~3-4h)
| Item | Tipo | Esfuerzo |
|------|------|----------|
| C1 — INSERT atómico posición | PHP Critical | 30 min |
| C2 + A2 — try/finally advisory lock | PHP Critical | 30 min |
| C3 — Retry/fail revenue share | PHP Critical | 1.5h |
| A1 — MIME server-side | PHP High | 20 min |
| A6 — Validar $limite en repo | PHP High | 5 min |
| A8 — Límite metadata JSONB | PHP High | 10 min |
| TA1 — Cleanup event listeners | TS High | 15 min |
| TA2 — 409 inspection | TS High | 20 min |
| TA4 — Rename try-catch | TS High | 10 min |

### Sesión 2 — Race Conditions + Resilience (~3h)
| Item | Tipo | Esfuerzo |
|------|------|----------|
| TC2 — Dedup race uploadQueue | TS Critical | 30 min |
| TC1 — Cross-window version gate | TS Critical | 2h |
| TA3 — Journal checkpoint propagate | TS High | 15 min |
| TA5 — Multi-window init lock | TS High | 30 min |

### Sesión 3 — SOLID + Medios (~4h)
| Item | Tipo | Esfuerzo |
|------|------|----------|
| A3 + A4 — Service layer + strategy | PHP High | 4h |
| TM1 — Per-sample error boundaries | TS Medium | 20 min |
| TM5 — Queue size limit | TS Medium | 15 min |
| TM6 — Global semaphore | TS Medium | 20 min |
| M1-M5 — PHP medios (batch) | PHP Medium | 1.5h |

### Sesión 4 — Cleanup + Arquitectura (~3h)
| Item | Tipo | Esfuerzo |
|------|------|----------|
| TA6 — Split syncService.ts 800+ LOC | TS High | 4h |
| TM2 — Estado inmutable | TS Medium | 1h |
| TM3 — Migración v1→v2 completa | TS Medium | 1.5h |
| B1-B5 — PHP bajos (batch) | PHP Low | 30 min |

### Sesión 5 — Integridad + Verificación (~2h)
| Item | Tipo | Esfuerzo |
|------|------|----------|
| A5 — Optimizar obtenerDelta 1 query | PHP High | 30 min |
| A7 — Estados transitorios en sync | PHP High | 15 min |
| TM4 — Hash post-descarga | TS Medium | 2h |
| M6 — Documentar purga | PHP Medium | 20 min |

---

## SECCIÓN D — Métricas de Éxito

| Métrica | Estado Actual | Objetivo Post-v2 |
|---------|---------------|-------------------|
| Race conditions conocidos | 5 (3 PHP + 2 TS) | 0 |
| Fallos silenciosos | 4+ (revenue, JSON, contadores, changelog) | 0 — todo loguea o retorna error |
| Archivos >300 LOC | syncService.ts (~800+) | Todos <300 LOC |
| Event listener leaks | 1 confirmado | 0 |
| Advisory locks sin finally | 1 | 0 |
| Validación client-side confiada | 1 (MIME type) | 0 — todo server-side |

---

## SECCIÓN E — Relación con auditorías anteriores

- **C367 (Auditoría subidas):** Items 367a-367f siguen pendientes. TC2 (dedup race) y TM4 (hash post-descarga) cubren parcialmente 367b y 367e.
- **C277 (Plan sync mejoras v1):** Todas las fases F1-F6 implementadas en C278. Este plan v2 es la revisión de calidad post-implementación.
- **Sprint F/G bugs:** Lecciones aplicadas. No hay regresiones detectadas.

---

## Aprendizajes de la auditoría

- [Advisory locks]: PostgreSQL los libera al cerrar conexión, pero PHP con connection pooling puede mantener sesiones. SIEMPRE usar try/finally.
- [MIME validation]: `$_FILES['type']` es untrusted. `mime_content_type()` lee magic bytes del archivo real.
- [Race conditions]: El patrón READ-DECIDE-WRITE es inherentemente vulnerable. Solución: atomic queries (INSERT...SELECT), advisory locks con scope correcto, o constraints UNIQUE.
- [Cross-window]: Tauri MPA (Multi-Page Application) comparte Store pero no estado en memoria. Toda escritura a Store debe ser serializada o version-gated.
- [Error masking]: Un catch que retorna `{ ok: true, data: [] }` es peor que un throw — el caller no puede distinguir error de resultado vacío legítimo.
- [Event listeners]: Tauri `listen()` retorna unsubscribe. SIEMPRE almacenar y llamar en cleanup. Patrón: `const unlisten = await listen(...); detener = () => { unlisten(); }`.
