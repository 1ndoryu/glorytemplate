# Plan de Mejoras: Sistema de Sync — Arquitectura de Confianza

> **Fecha:** 2026-03-07 | **Objetivo:** Transformar el sync de "funcional con parches" a "confiable por diseño"
> **Principio:** Cada mejora debe resolver una categoría de problemas, no un bug individual.

---

## 1. Diagnóstico: Por Qué Fallan los Sync Systems (y el nuestro)

### 1.1 Cómo funcionan los mejores sync (Google Drive, Dropbox, OneDrive)

**Google Drive** usa un modelo de *change tokens* (cursores):
- El cliente pide un `startPageToken` que representa el estado actual del servidor.
- En cada poll, envía el token y recibe solo los cambios desde ese punto (*delta sync*).
- El servidor mantiene un *changelog* ordenado cronológicamente — nunca se pierden cambios.
- Soporta *push notifications* (webhooks) para evitar polling innecesario: el servidor notifica "hay cambios", el cliente los pide.
- Conflictos: si dos clientes editan el mismo archivo, se guarda como *revisión* separada. El usuario decide cuál mantener.

**Dropbox** usa un modelo de *content-addressed storage*:
- Cada archivo se divide en bloques de 4MB, cada bloque tiene un hash SHA-256.
- El servidor mantiene un *journal* (log inmutable) de todas las operaciones realizadas: crear, mover, renombrar, eliminar.
- El cliente mantiene un cursor que apunta a la posición actual en el journal. En cada sync, pide "dame todo desde mi cursor".
- *Delta sync*: solo se transfieren los bloques que cambiaron, no el archivo completo.
- Detección de conflictos por *version vector*: cada archivo tiene un `rev` (revision hash). Si el cliente intenta actualizar con un `rev` que no coincide con el servidor, es un conflicto.
- El cliente tiene una *base de datos local SQLite* que actúa como *source of truth* local, no archivos JSON planos.

**OneDrive** usa un modelo similar a Google Drive:
- *Delta query* (`/delta`) retorna cambios incrementales desde un token.
- Push via webhooks + polling como fallback.
- Conflictos por `eTag`/`cTag` (entity tag / content tag): si cambió el eTag entre lectura y escritura, es conflicto.

### 1.2 Patrones universales de los sistemas confiables

| Patrón | Qué resuelve | Estado en Kamples |
|---|---|---|
| **Delta sync (cursores/tokens)** | Evita re-procesar todo el estado cada vez | No implementado — polling completo cada ciclo |
| **Journal/WAL (Write-Ahead Log)** | Garantiza que ninguna operación se pierde, incluso si el proceso muere a mitad | No implementado — Tauri Store puede corromperse |
| **Content hashing (checksum)** | Detecta cambios reales vs. falsos positivos del watcher | Parcial — hash parcial solo en upload, no en sync |
| **Operaciones atómicas** | Multi-step (rename = move + update tracking + PUT server) o todas pasan o ninguna | No implementado — pasos pueden fallar independientemente |
| **Clasificación de errores** | Diferenciar error transitorio (red) de permanente (404) de conflicto (409) | Mínimo — offlineQueue no diferencia 429 de 500 |
| **Base de datos local robusta** | Persistencia confiable con transacciones ACID | No — Tauri Store es JSON plano sin transacciones |
| **Exponential backoff + jitter** | Evitar thundering herd en errores masivos | Parcial — upload sí, offlineQueue no |
| **Reconciliación incremental** | Después de un crash, reconstruir estado sin re-descargar todo | Parcial — reconstruye índices pero no valida integridad de archivos |
| **Idempotencia server-side** | Retry seguro sin duplicados | Parcial — idempotency key en upload, no en crear colección ni en mover |

### 1.3 Debilidades concretas del sistema actual (auditoría de 10 archivos)

**Categoría A — Pérdida silenciosa de datos:**
- A1. Tauri Store (`sync-config.json`) es JSON plano. Si el proceso muere durante una escritura, el archivo se corrompe. No hay WAL ni backup.
- A2. `historialSamples` puede tener race condition entre ventanas (sync panel vs main window). Fusión eventual, pero sin garantía de consistencia.
- A3. Upload que falla por archivo inexistente retorna `true` (completado) → el archivo nunca se sube y el usuario no se entera.
- A4. `offlineQueueService` detiene procesamiento al primer error de red, dejando operaciones posteriores sin procesar indefinidamente.

**Categoría B — Rendimiento y escalabilidad:**
- B1. Cada ciclo de sync descarga el estado completo del servidor (`GET /me/sync/colecciones`). Con 1000 samples en 50 colecciones, esto es ~500KB de JSON cada 60 segundos.
- B2. Reconstrucción de índices es O(n) en cada persistencia — no hay invalidación granular.
- B3. `hashesConocidos` crece hasta 5000 entries sin LRU — potencial memoria en sesiones largas.
- B4. `MAX_HISTORIAL_SAMPLES=100` sin purga automática — acumulación en largo plazo.

**Categoría C — Detección y resolución de conflictos:**
- C1. Rename de carpeta detectado por patrón `DELETE+CREATE` con timeout de 3-5s — si el sistema está lento, puede interpretarse como "borrar + crear nueva" en vez de "rename".
- C2. No hay versioning de archivos. Si servidor y local divergen, no hay forma de detectarlo excepto por nombre.
- C3. `buscarColeccionHuerfana` hace import dinámico → si falla el import, toda la cadena de rename cae al fallback de "crear nueva".
- C4. Creaciones "en vuelo" (`creacionesColeccionEnVuelo` Map) sin TTL — si la creación nunca completa, el Map crece indefinidamente.

**Categoría D — Robustez operacional:**
- D1. Lock de sync es primitivo (boolean flag) — no soporta prioridad ni timeout.
- D2. Token sync en memoria — se pierde si la app se reinicia a mitad de operación.
- D3. Guards de descarga/movimiento usan `setTimeout` — si el timer se acumula (1000 descargas), posible memory leak.
- D4. `offlineQueue` sin backoff exponencial — mismo intervalo entre reintentos.
- D5. No se respeta header `Retry-After` del servidor.
- D6. HTTP 429 (rate limit) no se diferencia de 500.

---

## 2. Plan de Mejoras por Fases

### Fase 1: Persistencia Confiable (Fundamento — PRIORIDAD MÁXIMA)

> **Principio:** Si no puedes confiar en tu almacenamiento local, nada más importa.

#### F1.1 — Write-Ahead Log (WAL) para operaciones de tracking

**Problema:** Tauri Store escribe JSON completo en cada guardado. Si el proceso muere a mitad de escritura, el JSON se corrompe y se pierde todo el estado de tracking.

**Solución arquitectónica:**
```
Antes:
  operación → modificar objeto en memoria → JSON.stringify(todo) → writeFile(sync-config.json)

Después:
  operación → append a WAL (1 línea) → acumular N operaciones → checkpoint (flush completo)
```

**Implementación:**
- Crear `syncJournal.ts` — servicio de journaling ligero:
  - `appendOperacion(op: OperacionJournal)` → append-only a `sync-journal.jsonl` (1 JSON por línea).
  - `checkpoint()` → escribir estado completo a `sync-config.json` + truncar journal.
  - `recuperar()` → al iniciar, si existe journal, re-aplicar operaciones sobre último checkpoint.
- Tipos de operación: `TRACK_FILE`, `UNTRACK_FILE`, `UPDATE_FILE`, `ADD_COLLECTION`, `RENAME_COLLECTION`, `DELETE_COLLECTION`, `MOVE_FILE`.
- Checkpoint automático cada 50 operaciones o 30 segundos (lo que ocurra primero).
- En `syncTrackingService.ts`, reemplazar escrituras directas a Store por `appendOperacion()`.

**Archivos a modificar:** Nuevo `syncJournal.ts`, modificar `syncTrackingService.ts`, `syncState.ts`.

**Beneficio:** Si la app muere a mitad de un batch de 200 descargas, al reiniciar se re-aplican las operaciones del journal. Cero pérdida de datos.

#### F1.2 — Backup rotativo del estado

**Problema:** Si `sync-config.json` se corrompe (Tauri Store bug, disco, OneDrive conflict), se pierde todo.

**Solución:**
- Antes de cada checkpoint, copiar `sync-config.json` → `sync-config.backup-{N}.json` (rotar 3 copias).
- En `recuperar()`, si el JSON principal falla, intentar backups en orden inverso.
- Verificar integridad con hash SHA-256 al final del archivo (última línea).

**Archivos a modificar:** `syncJournal.ts` (nuevo), `syncTrackingService.ts`.

#### F1.3 — Migración de offlineQueue y uploadQueue a journal compartido

**Problema:** `offline-queue.json` y `upload-queue.json` son también JSON planos vulnerables.

**Solución:**
- Las 3 colas (tracking, offline, upload) comparten el mismo mecanismo de journal.
- Cada cola tiene su propio archivo de journal pero usa la misma clase base `JournalPersistente<T>`.
- Esto es una abstracción reutilizable, no código duplicado.

**Archivos a modificar:** `offlineQueueService.ts`, `uploadQueueService.ts`, nuevo `JournalPersistente.ts`.

---

### Fase 2: Delta Sync (Reducción de Carga — ALTA PRIORIDAD)

> **Principio:** Solo transferir lo que cambió. El servidor es la fuente de verdad.

#### F2.1 — Endpoint `GET /me/sync/delta` con cursor

**Problema:** Cada ciclo de sync descarga TODAS las colecciones con TODOS los samples. Esto es O(total) cuando debería ser O(cambios).

**Solución backend:**
```sql
/* Nueva tabla: sync_changelog */
CREATE TABLE sync_changelog (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  tipo VARCHAR(20) NOT NULL, /* 'sample_added', 'sample_removed', 'collection_created', 'collection_renamed', 'collection_deleted' */
  entidad_id INT NOT NULL,
  metadata JSONB, /* datos extra según tipo */
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sync_changelog_usuario ON sync_changelog(usuario_id, id);
```

**Endpoint nuevo:**
```
GET /me/sync/delta?cursor={last_id}
Response: {
  cambios: [{ id, tipo, entidad_id, metadata, created_at }],
  cursor: number, /* último id procesado */
  hayMas: boolean
}
```

**Implementación desktop:**
- Guardar `ultimoCursor` en syncState.
- En cada ciclo: `GET /me/sync/delta?cursor={ultimoCursor}`.
- Si `cursor === 0` (primera vez), hacer sync completo como ahora.
- Procesar cambios incrementalmente: solo descargar/mover/renombrar lo que cambió.

**Archivos a crear:** `v023_sync_changelog.sql`, actualizar `SyncRepository.php`, nuevo endpoint en `SyncController.php`.
**Archivos a modificar (desktop):** `syncService.ts` (lógica de sync principal), `syncState.ts` (persistir cursor).

**Beneficio:** Con 1000 samples, un ciclo normal pasa de ~500KB a ~2KB (solo cambios recientes). Reduce carga del servidor y tiempo de sync.

#### F2.2 — Debounce inteligente del polling basado en actividad

**Problema:** Polling cada 60 segundos es fijo. Si no hay cambios, es tráfico innecesario. Si hay mucha actividad, es demasiado lento.

**Solución — Adaptive polling:**
```typescript
const POLLING_MIN_MS = 15_000;   // 15s cuando hay actividad reciente
const POLLING_MAX_MS = 300_000;  // 5min en reposo
const POLLING_NORMAL_MS = 60_000; // 1min normal

let intervaloActual = POLLING_NORMAL_MS;

function ajustarIntervaloPolling(huboCambios: boolean) {
  if (huboCambios) {
    intervaloActual = POLLING_MIN_MS; // Acelerar
  } else {
    intervaloActual = Math.min(intervaloActual * 1.5, POLLING_MAX_MS); // Desacelerar gradualmente
  }
}
```

**Archivos a modificar:** `syncService.ts`.

**Beneficio:** En reposo, 1 request cada 5 minutos en vez de cada 60 segundos (5x menos carga). En actividad, sync más rápido (15s vs 60s).

---

### Fase 3: Integridad y Verificación (MEDIA PRIORIDAD)

> **Principio:** Nunca asumir que el estado local es correcto. Verificar periódicamente.

#### F3.1 — Content hashing para detección de cambios reales

**Problema:** El watcher emite eventos por cualquier modificación del FS (touch, metadata change, antivirus scan). No hay forma de saber si el contenido realmente cambió.

**Solución:**
- Calcular hash SHA-256 completo de archivos al descargar y al encolar uploads.
- Almacenar hash en `ArchivoTracking.hashCompleto`.
- En eventos del watcher, recalcular hash y comparar con el almacenado. Si es igual, ignorar.
- Usar `Web Crypto API` (disponible en Tauri WebView) para hashing eficiente, no SHA manual.

**Implementación:**
```typescript
/* hashService.ts — nuevo */
async function calcularHashArchivo(ruta: string): Promise<string> {
  const datos = await readFile(ruta); // Tauri FS
  const buffer = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Archivos a crear:** `hashService.ts`.
**Archivos a modificar:** `syncTrackingService.ts` (campo hashCompleto), `fileWatcherService.ts` (validación hash antes de emitir), `uploadQueueService.ts` (reemplazar hash parcial por completo).

**Beneficio:** Elimina falsos positivos del watcher. Antivirus que "toca" un archivo ya no dispara re-upload.

#### F3.2 — Reconciliación periódica de integridad

**Problema:** Después de un crash, no hay forma de saber si el estado de tracking refleja la realidad del disco.

**Solución — Reconciliación semanal:**
```
1. Listar todos los archivos en carpeta sync (FS real)
2. Listar todos los archivos en tracking
3. Diferencia A: en disco pero no en tracking → encolar como "descubiertos" (posible upload o re-track)
4. Diferencia B: en tracking pero no en disco → marcar como "faltante" (posible re-descarga)
5. Intersección: verificar hash → si difiere, marcar como "modificado localmente"
```

**Trigger:** Automático cada 7 días, manual desde UI panel sync.

**Archivos a crear:** `syncReconciliacion.ts`.
**Archivos a modificar:** `syncWatcherSetup.ts` (trigger periódico), panel sync UI.

#### F3.3 — Verificación post-descarga

**Problema:** Un archivo descargado podría estar truncado (red cortada, disco lleno).

**Solución:**
- Backend incluye `tamano` y `hashSha256` (o al menos `tamano`) en el payload de sync.
- Después de descargar, verificar:
  1. Archivo existe.
  2. Tamaño coincide (±0 bytes).
  3. (Opcional fase futura) Hash coincide.
- Si falla verificación, reintentar descarga (max 2 veces). Si sigue fallando, marcar como `error_descarga` en tracking.

**Archivos a modificar:** `syncCollectionService.ts` (descargarSample), `SyncRepository.php` (incluir tamano en payload).

---

### Fase 4: Manejo de Errores Inteligente (MEDIA PRIORIDAD)

> **Principio:** Cada error tiene una categoría y una estrategia de recuperación diferente.

#### F4.1 — Clasificación de errores por categoría

**Problema:** `offlineQueueService` trata todos los errores HTTP igual. Un 429 (rate limit) necesita esperar, un 404 necesita abortar, un 500 necesita reintentar con backoff.

**Solución — Error taxonomy:**
```typescript
/* errorSync.ts — nuevo */
type CategoriaError = 
  | 'transitorio'   // 502, 503, timeout, error red → reintentar con backoff
  | 'rate_limit'     // 429 → respetar Retry-After, o backoff agresivo
  | 'conflicto'      // 409 → resolver conflicto (puede ser éxito implícito)
  | 'autenticacion'  // 401, 403 → refresh token, re-login
  | 'permanente'     // 404, 400, 422 → no reintentar, notificar usuario
  | 'desconocido';   // Cualquier otro → reintentar 1 vez, luego notificar

function clasificarError(status: number, body?: string): CategoriaError { ... }
function obtenerEstrategia(cat: CategoriaError): { reintentar: boolean, delayMs: number, maxReintentos: number } { ... }
```

**Archivos a crear:** `errorSync.ts`.
**Archivos a modificar:** `offlineQueueService.ts`, `uploadQueueService.ts`, `syncCollectionService.ts`.

#### F4.2 — Backoff exponencial con jitter en offlineQueue

**Problema:** `offlineQueueService` reintenta sin backoff. Si el servidor está caído, martillea cada vez que sincroniza.

**Solución:**
```typescript
function calcularDelay(intento: number): number {
  const base = 2000; // 2s
  const delay = base * Math.pow(2, intento); // 2s, 4s, 8s, 16s, 32s
  const jitter = Math.random() * delay * 0.3; // ±30% jitter
  return Math.min(delay + jitter, 300_000); // Cap 5 min
}
```

**Archivos a modificar:** `offlineQueueService.ts`.

#### F4.3 — Circuit breaker para operaciones de red

**Problema:** Si el servidor está caído, cada operación individual intenta su propia conexión. Con 50 archivos pendientes, son 50 timeouts.

**Solución — Circuit breaker patrón:**
```
Estados: CERRADO (normal) → ABIERTO (fallo detectado) → SEMI-ABIERTO (probando)

CERRADO: Operaciones fluyen normal.
  Si 3 errores consecutivos de red → pasar a ABIERTO.

ABIERTO: Todas las operaciones se encolan automáticamente (no intentar red).
  Cada 30s, pasar a SEMI-ABIERTO.

SEMI-ABIERTO: Intentar 1 operación.
  Si éxito → CERRADO (flush cola).
  Si fallo → ABIERTO (reset timer).
```

**Archivos a crear:** `circuitBreaker.ts`.
**Archivos a modificar:** `syncGuards.ts` (integrar), `uploadQueueService.ts`, `offlineQueueService.ts`.

**Beneficio:** Si el servidor cae, el sistema lo detecta en 3 intentos y deja de martillear. Cuando vuelve, se recupera automáticamente.

---

### Fase 5: Operaciones Atómicas y Conflictos (MEDIA-BAJA PRIORIDAD)

> **Principio:** Una operación multi-paso o completa o se revierte. Nunca queda a medias.

#### F5.1 — Operaciones compuestas con rollback

**Problema:** "Renombrar colección" implica: 1) actualizar tracking local, 2) renombrar carpeta, 3) PUT al servidor. Si paso 3 falla, tracking y carpeta ya están cambiados pero el servidor no.

**Solución — Transacción local:**
```typescript
/* transaccionSync.ts — nuevo */
class TransaccionSync {
  private pasos: Array<{ ejecutar: () => Promise<void>, revertir: () => Promise<void> }> = [];
  
  agregar(ejecutar: () => Promise<void>, revertir: () => Promise<void>) {
    this.pasos.push({ ejecutar, revertir });
  }
  
  async ejecutar(): Promise<boolean> {
    const completados: number[] = [];
    for (let i = 0; i < this.pasos.length; i++) {
      try {
        await this.pasos[i].ejecutar();
        completados.push(i);
      } catch (error) {
        // Revertir en orden inverso
        for (const idx of completados.reverse()) {
          try { await this.pasos[idx].revertir(); } catch { /* log */ }
        }
        return false;
      }
    }
    return true;
  }
}
```

**Uso en rename:**
```typescript
const tx = new TransaccionSync();
const nombreAnterior = coleccion.nombre;
tx.agregar(
  () => actualizarTrackingLocal(colId, nuevoNombre),
  () => actualizarTrackingLocal(colId, nombreAnterior) // rollback
);
tx.agregar(
  () => renombrarCarpetaLocal(rutaVieja, rutaNueva),
  () => renombrarCarpetaLocal(rutaNueva, rutaVieja) // rollback
);
tx.agregar(
  () => putRenombrarServidor(colId, nuevoNombre),
  () => putRenombrarServidor(colId, nombreAnterior) // rollback
);
await tx.ejecutar();
```

**Archivos a crear:** `transaccionSync.ts`.
**Archivos a modificar:** `syncWatcherSetup.ts` (rename), `syncCollectionService.ts` (crear/eliminar).

#### F5.2 — Detección de conflictos por versión

**Problema:** Si el usuario renombra una colección en la web y en el escritorio simultáneamente, no hay forma de detectar el conflicto.

**Solución:**
- Backend retorna `version` (campo integer auto-incremento) en cada colección.
- Desktop almacena `version` en `ColeccionLocal`.
- Al hacer PUT, enviar `version` actual. Backend verifica:
  - Si `version` del request === `version` en BD → aplicar cambio, incrementar version.
  - Si difiere → 409 Conflict. Desktop debe re-sync y aplicar la versión del servidor.

**Archivos a modificar:** Migración SQL (campo `version`), `ColeccionesCrudController.php`, `SyncRepository.php`, `syncTrackingService.ts`, `syncCollectionService.ts`.

---

### Fase 6: Observabilidad y Diagnóstico (BAJA PRIORIDAD — ALTO VALOR)

> **Principio:** Si no puedes ver lo que pasa, no puedes arreglar lo que falla.

#### F6.1 — Log estructurado de sync con niveles

**Problema:** Los logs actuales son `console.log`/`console.error` dispersos. No hay forma de activar logs detallados para debugging sin tocar código.

**Solución:**
```typescript
/* syncLogger.ts — nuevo */
type NivelLog = 'debug' | 'info' | 'warn' | 'error';

const logSync = {
  debug: (modulo: string, msg: string, data?: unknown) => { ... },
  info: (modulo: string, msg: string, data?: unknown) => { ... },
  warn: (modulo: string, msg: string, data?: unknown) => { ... },
  error: (modulo: string, msg: string, data?: unknown) => { ... },
};

// Activable desde config avanzada
// Nivel = 'error' en producción, 'debug' cuando el usuario activa diagnóstico
```

- Los logs se escriben a un archivo rotativo (`sync-log-{fecha}.jsonl`) con Tauri FS.
- Max 3 archivos de 5MB cada uno. Rotación automática.
- El usuario puede exportar logs desde el panel sync para enviar soporte.

**Archivos a crear:** `syncLogger.ts`.
**Archivos a modificar:** Todos los 10 archivos de sync (reemplazar console.log por logSync).

#### F6.2 — Panel de diagnóstico en UI sync

**Problema:** El usuario no tiene visibilidad de qué está pasando internamente en el sync.

**Solución — Panel expandible en sync UI:**
- Estado actual: `sincronizado | sincronizando | error | offline | pausa`.
- Último sync: timestamp + resultado + duración.
- Cola de subida: N pendientes, N en error (con detalle expandible).
- Offline queue: N operaciones pendientes.
- Métricas: archivos sincronizados total, bytes transferidos sesión, errores sesión.
- Botón "Ejecutar reconciliación" (F3.2).
- Botón "Exportar logs" (F6.1).
- Botón "Forzar sync completo" (ignorar cursor, re-descargar todo).

---

## 3. Matriz de Impacto y Prioridad

| Fase | Impacto | Riesgo | Esfuerzo | Prioridad |
|---|---|---|---|---|
| **F1: Persistencia (WAL)** | Crítico — elimina corrupción de datos | Bajo — es additive | Medio (~3-4 sesiones) | **1 — MÁXIMA** |
| **F2: Delta sync** | Alto — reduce carga 50-100x | Medio — requiere migración BD | Alto (~4-5 sesiones) | **2 — ALTA** |
| **F3: Integridad** | Alto — detecta/previene divergencia | Bajo — es additive | Medio (~2-3 sesiones) | **3 — MEDIA** |
| **F4: Errores inteligentes** | Medio — mejor UX en fallos | Bajo — refactor interno | Bajo (~2 sesiones) | **4 — MEDIA** |
| **F5: Atomicidad** | Medio — previene estados inconsistentes | Medio — cambia flujos core | Medio (~2-3 sesiones) | **5 — MEDIA-BAJA** |
| **F6: Observabilidad** | Alto para debugging | Mínimo — solo lectura | Bajo (~1-2 sesiones) | **6 — BAJA** |

### Orden de implementación recomendado

```
F1.1 (WAL)               ← Fundamento. Sin esto, todo lo demás es sobre arena.
  └─ F1.2 (Backup)       ← Complemento directo de F1.1
  └─ F1.3 (Queues WAL)   ← Misma abstracción, 3 instancias
F4.1 (Clasificación)      ← Quick win, mejora inmediata
  └─ F4.2 (Backoff)      ← Depende de F4.1
F6.1 (Logger)             ← Necesario para diagnosticar todo lo demás
F2.1 (Delta sync)         ← Requiere cambio backend + desktop simultáneo
  └─ F2.2 (Adaptive poll) ← Complemento de F2.1
F3.1 (Hashing)            ← Independiente
  └─ F3.2 (Reconciliación)← Necesita F3.1
  └─ F3.3 (Verificación)  ← Independiente
F4.3 (Circuit breaker)    ← Mejora incremental
F5.1 (Transacciones)      ← Refactor de flujos existentes
  └─ F5.2 (Versioning)   ← Requiere migración BD
F6.2 (Panel diagnóstico)  ← UI, puede hacerse en cualquier momento
```

---

## 4. Archivos Nuevos a Crear

| Archivo | Responsabilidad | Fase |
|---|---|---|
| `desktop/src/services/syncJournal.ts` | WAL/journal append-only + checkpoint + recovery | F1.1 |
| `desktop/src/services/JournalPersistente.ts` | Clase base genérica para journaling | F1.3 |
| `desktop/src/services/hashService.ts` | SHA-256 de archivos via Web Crypto | F3.1 |
| `desktop/src/services/syncReconciliacion.ts` | Reconciliación disco vs tracking | F3.2 |
| `desktop/src/services/errorSync.ts` | Taxonomía de errores + estrategias | F4.1 |
| `desktop/src/services/circuitBreaker.ts` | Circuit breaker para operaciones de red | F4.3 |
| `desktop/src/services/transaccionSync.ts` | Operaciones compuestas con rollback | F5.1 |
| `desktop/src/services/syncLogger.ts` | Logger estructurado con rotación | F6.1 |
| `v023_sync_changelog.sql` | Migración tabla changelog para delta sync | F2.1 |
| `App/Kamples/Database/SyncChangelogRepository.php` | Queries para changelog | F2.1 |

## 5. Archivos Existentes a Modificar

| Archivo | Cambios | Fase |
|---|---|---|
| `syncTrackingService.ts` | WAL integration, hashCompleto, version | F1.1, F3.1, F5.2 |
| `syncState.ts` | Persistir cursor delta, config logger | F2.1, F6.1 |
| `syncService.ts` | Delta sync loop, adaptive polling, circuit breaker | F2.1, F2.2, F4.3 |
| `syncCollectionService.ts` | Verificación post-descarga, transacciones, error clasif. | F3.3, F4.1, F5.1 |
| `syncWatcherSetup.ts` | Trigger reconciliación, transacciones rename | F3.2, F5.1 |
| `fileWatcherService.ts` | Hash validation antes de emitir eventos | F3.1 |
| `uploadQueueService.ts` | WAL queue, hash completo, error clasif. | F1.3, F3.1, F4.1 |
| `offlineQueueService.ts` | WAL queue, backoff, error clasif. | F1.3, F4.1, F4.2 |
| `syncGuards.ts` | Circuit breaker integration | F4.3 |
| `SyncController.php` | Endpoint delta, incluir version/tamano | F2.1, F3.3 |
| `SyncRepository.php` | Query changelog, version en payload | F2.1, F5.2 |
| `ColeccionesCrudController.php` | Optimistic locking por version | F5.2 |

---

## 6. Métricas de Éxito

| Métrica | Estado actual (estimado) | Objetivo post-mejoras |
|---|---|---|
| Pérdida de tracking por corrupción | Posible en cada crash | 0 (WAL + backup) |
| Payload por ciclo sync (1000 samples) | ~500KB | ~2KB (delta) |
| Tiempo detección servidor caído | 50 timeouts × 30s = 25 min | 3 intentos × 5s = 15s (CB) |
| Falsos positivos watcher | Frecuentes (antivirus, touch) | Eliminados (hash verify) |
| Reintentos innecesarios en 429 | Inmediatos, sin backoff | Respetar Retry-After + backoff |
| Visibilidad para debugging | console.log disperso | Logs exportables por usuario |
| Divergencia disco vs tracking | Silenciosa, indefinida | Detectada semanalmente (reconcil.) |

---

## 7. Lecciones de la Industria Aplicadas

- **[Google Drive]**: El modelo de cursor/token es el estándar. Implementamos delta sync (F2.1) siguiendo este patrón: `cursor` persistido localmente, servidor retorna solo cambios desde cursor.
- **[Dropbox]**: Su journal inmutable es la inspiración directa de nuestro WAL (F1.1). También su modelo de content-addressed storage inspira F3.1 (hashing de archivos).
- **[OneDrive]**: Su `eTag` para detección de conflictos es la base de F5.2 (versioning por campo `version`).
- **[Unison]**: Su modelo de "archivo de referencia" es la base de F3.2 (reconciliación periódica que compara 3 estados: disco, tracking, servidor).
- **[rsync]**: Su delta algorithm (solo transferir bloques cambiados) es overkill para archivos de audio (no se editan parcialmente), pero el principio de "verificar antes de transferir" (F3.3) viene de ahí.
- **[Circuit breaker]**: Patrón de Michael Nygard (Release It!) aplicado a F4.3. Evita cascading failures cuando el servidor está saturado.
- **[Optimistic replication]**: Paper de Microsoft Research (Saito & Shapiro, 2003). Nuestro modelo actual ya es optimistic (permitimos divergencia temporal). Las mejoras (F5.2) agregan detección formal de conflictos.

---

## 8. Anti-patrones a Evitar

- **NO implementar CRDT.** Es overkill para nuestro caso. Los archivos de audio no se editan concurrentemente — el conflicto es a nivel de metadata (nombre, colección), no de contenido.
- **NO implementar sync en tiempo real (WebSocket).** El overhead de mantener conexiones persistentes no vale para polling cada 15-60s. Adaptive polling (F2.2) es suficiente.
- **NO migrar a SQLite local.** Tauri Store + WAL es suficiente para nuestro volumen (~1000-5000 archivos). SQLite añade complejidad de bindings y compilación cross-platform sin beneficio claro.
- **NO implementar delta transfer (transferir solo bytes cambiados de un archivo).** Los archivos de audio no se editan parcialmente — se reemplazan completos. Delta transfer solo tiene sentido para archivos que cambian incrementalmente (documentos, bases de datos).

---

*Última actualización: 2026-03-07*
*Referencia: Auditoría de 10 archivos sync (~7200 LOC) + investigación Google Drive API, Dropbox Sync Engine, OneDrive Delta API, Unison, rsync, patterns Circuit Breaker/WAL/Optimistic Replication*
