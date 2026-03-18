# Auditoría de Sincronización Desktop — Seguridad, Optimización y Escalabilidad

**Fecha:** 2026-03-14 | **Versión:** 1.0 | **Alcance:** desktop/src/services/sync*, App/React/hooks/usePanelSincronizacion

## 1. Arquitectura Actual

### Ventanas y Responsabilidades

| Ventana | Label | Responsabilidad Sync |
|---------|-------|----|
| Main | `main` | Ejecuta watcher, upload queue, polling, sync completo |
| Sync Panel | `sync-panel` | Solo lectura: historial, colecciones, diagnóstico |
| Config | `config-sync` | Configuración de carpeta y preferencias |

### Flujo de Datos

```
[Tauri Store: auth.json] ─── token JWT ───→ [fetch interceptor]
                                                    │
[syncTrackingService] ← persiste tracking ←─ [syncWatcherSetup]
         │                                          │
         ├── historialSamples                  filesystem watcher
         ├── colecciones                            │
         └── estadoSync                     [uploadQueueService]
                                                    │
                                            API: /sync/check → download
                                            API: /sync/upload → upload
```

### Comunicación Cross-Window

- **Auth:** Tauri Store (`auth.json`) compartido. Evento `auth-cambiada` propaga login/logout entre ventanas.
- **Sync Data:** `window.__KAMPLES_SYNC__` expone funciones del syncService. Cada ventana tiene su propia instancia en memoria.
- **Stores Zustand:** Per-window (no compartidos). Cada ventana tiene su propio `syncStore`.

## 2. Hallazgos de Seguridad

### 2.1. Token JWT en Headers (OK)

- Token se inyecta via `Authorization: Bearer {jwt}` en el fetch interceptor.
- Fallback `X-Kamples-Auth` para entornos donde el proxy strip Authorization.
- Solo se envía en peticiones a `/wp-json/` (no en requests a CDN u otros dominios).

### 2.2. Token Expiry y Auto-Logout (MEJORADO - QK16)

- **401 detectado** en el fetch interceptor → `manejarSesionExpirada()`.
- Guard de concurrencia (`manejando401`) evita múltiples logouts simultáneos.
- **MEJORADO (QK36):** Evento `auth-cambiada` propaga logout a todas las ventanas.

### 2.3. Almacenamiento Seguro (OK)

- Tauri Store Plugin cifra `auth.json` en disco (cifrado por defecto de Tauri).
- Las credenciales nunca se exponen en `localStorage` ni `sessionStorage`.

### 2.4. CORS para Audio Estático (MEJORADO - QK34)

- Archivos MP3 en `/wp-content/uploads/` ahora tienen headers CORS para `localhost:*` y `tauri://localhost`.
- Whitelist con `SetEnvIf Origin` — no wildcard.

### 2.5. Riesgos Identificados

| Riesgo | Severidad | Estado | Mitigación |
|--------|-----------|--------|------------|
| Token JWT sin refresh automático | Media | Pendiente | Duración 30 días. Si expira, auto-logout vía 401 handler. TO-DO: implementar refresh token antes de expiración. |
| Upload sin validación de tipo MIME en cliente | Baja | Diseño | El servidor valida tipo MIME + magic bytes. El cliente confía en el servidor. |
| Sync watcher puede leer archivos fuera de carpeta sync | Baja | Mitigado | `syncWatcherSetup` solo observa la carpeta configurada. No hay path traversal posible. |
| `syncTrackingService` no cifra datos locales | Baja | Aceptado | El tracking contiene metadata (nombres, estados), no contenido audio. Riesgo bajo. |

## 3. Optimización para Escala

### 3.1. Polling y Bandwidth

- **Sync check:** `/sync/check` se ejecuta cada N minutos (configurable). Envía solo IDs/hashes para comparar.
- **Batch operations:** Downloads y uploads se hacen en lotes, no uno por uno.
- **Upload queue:** Cola con retry automático y backoff exponencial.

### 3.2. Problemas de Escala Identificados

| Problema | Impacto | Solución Propuesta |
|----------|---------|-------------------|
| `historialSamples` crece sin límite | Memoria en ventana sync | Limitar a últimos 500 entries. Implementar paginación. |
| `rehidratarImagenesPendientesSync()` re-procesa todo | CPU al abrir panel | Cache de imágenes resueltas. Solo procesar entries nuevas. |
| `sincronizarConServidor()` compara todo el catálogo | Red en catálogos grandes | Implementar delta sync: servidor envía solo cambios desde última sync (timestamp). |
| Watcher de filesystem genera eventos por cada archivo | CPU con muchos archivos | Debounce agrupado: acumular cambios 2s antes de procesar. |

### 3.3. Recomendaciones de Optimización (Prioridad)

1. **Delta sync (Alta):** Cambiar `/sync/check` para que acepte `since=timestamp`. El servidor retorna solo samples modificados después de esa fecha. Reduce payload de O(n) a O(delta).

2. **Historial paginado (Media):** Limitar `obtenerHistorialSamplesSync()` a 100 entries por página. El panel muestra la primera página y carga más bajo demanda.

3. **Upload concurrente (Media):** Actualmente uploads son secuenciales. Permitir 2-3 uploads simultáneos con semáforo para maximizar throughput sin saturar.

4. **Cache de portadas (Baja):** Las portadas se re-resuelven en cada render del historial. Cachear `sampleId → portadaUrl` con TTL 5min.

## 4. Bugs Encontrados y Fixes Aplicados (QK36)

### 4.1. Auth No Se Sincroniza Cross-Window (CORREGIDO)

**Síntoma:** Login en main window → sync window sigue sin auth. Después de restart, auth inconsistente.

**Root Cause:** Cada ventana Tauri tiene su propio JS context. `guardarToken()` en main actualiza `auth.json` y el fetch interceptor local, pero la sync window no se entera.

**Fix:** Sistema de eventos Tauri (`auth-cambiada`):
- `guardarToken()` emite `{ tipo: 'login' }` después de guardar.
- `cerrarSesionDesktop()` emite `{ tipo: 'logout' }` después de limpiar.
- `escucharCambiosAuth()` registra listener en cada ventana. Al recibir evento, re-lee `auth.json` y actualiza fetch interceptor + authStore + GLORY_CONTEXT.
- Guard `procesandoEventoAuth` previene re-entrancia.
- Guard `token !== tokenEnMemoria` previene self-processing (la ventana emisora ya actualizó su estado localmente).

**Archivos:** `authDesktopService.ts` (+60 líneas), `desktopService.ts` (+2 líneas), `sync.tsx` (+2 líneas).

### 4.2. Pantalla de Inicio en Sync Panel (DIAGNOSTICADO)

**Síntoma:** Sync panel muestra contenido vacío que el usuario interpreta como "página de inicio".

**Root Cause:** Si no hay auth al abrir el panel, las API calls fallan silenciosamente. El panel muestra "Sin actividad reciente" con nombre "Usuario" — parece una pantalla de bienvenida.

**Fix:** Con el fix 4.1, cuando el usuario hace login en main, el panel sync recibe el evento y se actualiza automáticamente.

**TO-DO:** Agregar estado visual explícito "Inicia sesión para sincronizar" cuando no hay token.

### 4.3. Google Login en Desktop (YA CORREGIDO - QK16)

Resuelto en QK16: CSP actualizado + Google Client ID inyectado vía Vite define.

## 5. Checklist de Seguridad Sync

- [x] Token JWT nunca se envía a dominios externos (solo `/wp-json/`)
- [x] Auto-logout en 401 con guard de concurrencia
- [x] Credenciales en Tauri Store cifrado (no localStorage)
- [x] CORS whitelist para audio estático (solo localhost/tauri)
- [x] Upload con validación server-side (tipo MIME + magic bytes)
- [x] Sync watcher limitado a carpeta configurada (no path traversal)
- [x] Cross-window auth sync vía eventos Tauri
- [ ] TO-DO: Refresh token antes de expiración (actual: 30 días hardcoded)
- [ ] TO-DO: Rate limiting en upload queue (prevenir abuse si comprometen token)
- [ ] TO-DO: Verificación de integridad de archivos descargados (checksum)

## 6. Lecciones

- [Tauri events]: `emit()` de `@tauri-apps/api/event` envía a TODAS las ventanas, incluyendo la emisora. Usar guard de self-processing.
- [Auth cross-window]: Cada webview tiene su propio `window.fetch` y stores Zustand. No se comparten automáticamente.
- [Sync soloLectura]: La ventana sync inicializa con `{ soloLectura: true }` para evitar duplicar watchers/uploads. Solo la ventana main ejecuta sync activo.
- [mod_headers]: El contenedor Docker WP no tiene `mod_headers` habilitado por defecto. Necesario para CORS en archivos estáticos.

---

## 7. QL136 — Auditoría SOLID y Plan de Refactor del Sync

**Fecha:** 2026-03-17

### 7.1. Resumen ejecutivo

El sync actual ya tiene varias defensas importantes: journal WAL en tracking, cola persistida, locks de concurrencia, circuit breaker, reconciliación periódica y varios guards contra loops del watcher. El problema no es que esté "vacío" de arquitectura; el problema es que el comportamiento final emerge de demasiadas piezas con responsabilidad mezclada. Eso vuelve difícil responder preguntas básicas de operación:

- por qué un archivo se subió, no se subió o se borró,
- qué fuente de verdad se usó en cada decisión,
- en qué modo exacto estaba el sync cuando ejecutó una acción,
- y qué parte del sistema tomó una decisión destructiva.

La prioridad correcta no es una reescritura inmediata. La prioridad correcta es:

1. hacer observable el flujo real,
2. encapsular decisiones críticas,
3. separar fuentes de verdad,
4. y solo después extraer/refactorizar comportamiento.

### 7.2. Hallazgos SOLID

#### SRP — responsabilidades mezcladas

**Hallazgo A: `syncWatcherSetup.ts` sigue siendo un coordinador monolítico.**

- Mezcla bootstrap, callbacks del watcher, moves, soft-delete, creación/rename de colecciones, polling, escaneo inicial y reglas específicas de modos.
- Resultado: un cambio en reglas de colección o borrado obliga a tocar el mismo archivo que inicializa listeners y timers.

**Hallazgo B: `uploadQueueService.ts` combina demasiados ejes de negocio.**

- Cola + persistencia + hash + antispam + dedup + upload HTTP + tracking + borrado post-upload.
- El archivo ya declara TO-DOs para extraer `hashUtils`, `retryLogic` y `chunkUpload`, lo que confirma el problema estructural.

**Hallazgo C: `syncOrchestratorService.ts` contiene lógica operativa que no es orquestación pura.**

- Antes de sincronizar, muta directamente varios stores compartidos (`upload-queue.json`, `offline-queue.json`, `sync-config.json`).
- Eso es recuperación/rehabilitación de colas, no orquestación de sync.

#### OCP/DIP — reglas dependen de estado global concreto

**Hallazgo D: el comportamiento cambia por `estado.configAvanzada` leído inline en muchos puntos.**

- `borrarAlSubirExitoso` altera descarga, creación de colecciones, borrado local y análisis de huérfanos.
- La regla está distribuida, no encapsulada en una política explícita.

**Hallazgo E: varias decisiones dependen de fuentes de verdad heterogéneas sin una abstracción unificada.**

- tracking v2
- índice legacy v1
- cola upload
- historial per-sample
- filesystem real
- respuesta del servidor

Cuando estas fuentes discrepan, cada módulo resuelve el conflicto localmente con reglas propias. Eso aumenta el riesgo de regresiones silenciosas.

#### ISP — APIs internas demasiado amplias

**Hallazgo F: los módulos se exponen con demasiadas funciones de detalle y los consumidores conocen demasiado del almacenamiento.**

- `syncOrchestratorService` toca stores de otras capas.
- varios módulos importan tracking, fs, path, fetch y logger simultáneamente.

Esto complica tests y dificulta introducir cambios aislados.

### 7.3. Riesgos operativos actuales

#### Riesgo 1 — decisiones destructivas repartidas

Las rutas que pueden terminar en borrado local o deshabilitación de sync viven repartidas entre:

- `uploadQueueService.ts`
- `syncOrphanAnalysis.ts`
- `syncCollectionService.ts`
- `syncWatcherSetup.ts`

Aunque ya se endurecieron varios guards en QL130-QL135, la arquitectura todavía permite que una futura corrección en un punto reactive un comportamiento inseguro en otro.

#### Riesgo 2 — dedup y antispam comparten estado, pero no contrato

Actualmente coexisten:

- `hashesConocidos`
- `hashARutas`
- `hashesEnVuelo`
- `hashesPendientesEncola`
- `contadorHashDetectado`

El sistema funciona, pero no existe un contrato explícito del tipo:

- `hash confirmado en servidor`,
- `hash visto localmente`,
- `hash bloqueado por antispam`,
- `hash stale evictable`.

Eso hace que dedup y antispam evolucionen como una red de excepciones, no como un modelo consistente.

#### Riesgo 3 — logging estructurado incompleto

Existe `syncLogger.ts`, pero gran parte del flujo de sync sigue usando `console.info/warn/error` directo.

Consecuencia:

- una parte de la historia queda en el archivo local,
- otra parte solo existe en consola,
- y el diagnóstico exportado no siempre representa lo que realmente pasó.

#### Riesgo 4 — recuperación basada en side effects cruzados

La estrategia actual de recuperación resetea colas y tracking tocando varios stores en bruto. Eso es útil como medida práctica, pero acopla demasiado la recuperación a la forma física del almacenamiento actual.

Si cambia el store o el formato, la recuperación se vuelve frágil.

### 7.4. Plan de mejora para duplicados y antispam

#### Objetivo

Bloquear duplicados reales sin impedir re-subidas válidas cuando:

- el archivo ya no existe en el servidor,
- el tracking local está stale,
- o el usuario reintroduce correctamente un archivo tras una purga/reintento.

#### Modelo propuesto

Separar conceptualmente cuatro estados de hash:

1. **Hash observado**: apareció en filesystem/cola, pero no confirma nada.
2. **Hash en vuelo**: está siendo procesado ahora mismo.
3. **Hash confirmado**: existe una subida persistida y asociada a un sampleId válido o tracking activo.
4. **Hash bloqueado temporalmente**: antispam por tormenta de eventos, no por duplicado definitivo.

#### Reglas propuestas

- Un hash solo bloquea como duplicado definitivo si está en estado `confirmado`.
- Un hash `observado` o `en vuelo` jamás debe disparar eliminación local por sí solo.
- El antispam debe operar por ventana temporal y contexto (`ruta`, `hash`, `origen`) en vez de un contador monótono casi permanente.
- La expulsión de hashes stale debe centralizarse en una política única de reconciliación, no dispersa en varios módulos.

#### Cambios concretos sugeridos

1. Extraer un `syncDedupService` que sea la única autoridad sobre hashes.
2. Reemplazar `contadorHashDetectado` por ventanas deslizantes con TTL y motivo del bloqueo.
3. Persistir motivo del estado de dedup: `confirmado`, `stale`, `bloqueado_temporal`, `en_vuelo`.
4. Hacer que la eliminación local por duplicado dependa de una respuesta explícita de la política de dedup, no de condiciones inline en la cola.

### 7.5. Plan para hacer el sync más depurable

#### Meta

Tener una historia local completa y exportable de cada ciclo importante de sync.

#### Fase 1 — inmediata

- Convertir el log local a JSONL real, no texto pseudo-estructurado.
- Incluir `sessionId`, `seq` y datos serializables consistentes.
- Añadir reporte diagnóstico exportable con:
        - configuración activa,
        - resumen de tracking,
        - resumen de cola de uploads,
        - últimas entradas de log.
- Exponer ese reporte en el panel de diagnóstico.

#### Fase 2 — siguiente

- Introducir `operationId` por flujo: `watcher:create`, `scan:start`, `upload:item`, `download:item`, `move:item`.
- Propagar el `operationId` entre watcher, cola y tracking.
- Añadir motivo explícito en decisiones: `ignored`, `stale-cleanup`, `dedup-confirmed`, `policy-blocked`, `mode-skip`.

#### Fase 3 — consolidación

- Reemplazar `console.*` remanentes del dominio sync por `logSync`.
- Añadir snapshots automáticos cuando ocurra una transición crítica fallida:
        - error final de upload,
        - limpieza stale,
        - borrado post-upload,
        - rename ambiguo de colección.

### 7.6. Plan de refactor por fases

#### Fase R1 — Observabilidad primero

- `syncLogger.ts`: reporte diagnóstico, JSONL real, export consistente.
- `useDiagnosticoSync.ts` y panel diagnóstico: visibilidad de cola/tracking.
- `syncOrchestratorService.ts`: eliminar logs directos más críticos.

**Riesgo:** bajo.

#### Fase R2 — Políticas explícitas

- Extraer `syncModePolicy` para encapsular reglas de modos (`borrarAlSubirExitoso`, lectura, descarga omitida, etc.).
- Extraer `syncDedupPolicy` para centralizar dedup/antispam/stale eviction.

**Riesgo:** medio. Requiere mantener compatibilidad con flujo actual.

#### Fase R3 — Separación de coordinadores

- Dividir `syncWatcherSetup.ts` en:
        - bootstrap/listeners,
        - callbacks de archivos,
        - callbacks de carpetas/subcarpetas,
        - operaciones destructivas.
- Dividir `uploadQueueService.ts` en:
        - repositorio de cola,
        - política dedup,
        - ejecutor HTTP de uploads,
        - cleanup post-upload.

**Riesgo:** medio-alto. Aquí se pueden introducir regresiones si se mezcla con cambios funcionales.

#### Fase R4 — Recovery y reconciliación

- Extraer la rehabilitación de stores de `syncOrchestratorService.ts` a un `syncRecoveryService`.
- Formalizar las reconciliaciones entre tracking, cola, filesystem e índice legacy.

**Riesgo:** medio.

### 7.7. Qué no conviene hacer ahora

- No reescribir todo el sync en una sola iteración.
- No eliminar aún el índice legacy sin un plan de migración y rollback.
- No mezclar refactor de arquitectura con cambios agresivos de comportamiento destructivo.

La forma correcta de reducir riesgo aquí es aislar primero decisiones y telemetría, y después mover piezas.

### 7.8. Trabajo iniciado en QL136

Primera línea de ejecución de esta tarea:

- reforzar observabilidad local del sync,
- exportar un reporte diagnóstico más útil,
- y exponer resúmenes operativos de tracking/cola para no depender solo de consola.

Eso deja la base lista para continuar con la extracción de políticas de dedup y modos en la siguiente fase sin volver a trabajar a ciegas.
