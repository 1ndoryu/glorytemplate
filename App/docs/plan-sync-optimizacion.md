# Plan: Optimización Sync + Panel Configuración + Papelera + Borrado Bidireccional

> **Fecha:** 2026-02-27 | **Prioridad:** Alta | **Módulos afectados:** 8 servicios sync + 1 componente UI nuevo + backend
> **Estado:** ✅ IMPLEMENTADO — Commit `0e02e219` (base) + sesión posterior (config window independiente + fix duplicados + deep review).

### Resumen de implementación post-plan
- **Semáforo concurrencia** (`semaforo.ts`): Implementado. Uploads y downloads paralelos 1-5 configurable.
- **Persistencia debounced** (`persistenciaDebounce.ts`): Implementado. Timer 2s + flush `beforeunload`.
- **Map indices O(1)** (`syncState.ts`): Implementado. `indiceArchivosPorRuta` + `indiceArchivosPorNombre`.
- **Purga periódica watcher** (`fileWatcherService.ts`): Implementado. Interval 10s, TTL 30s.
- **Panel configuración**: Implementado como overlay (`ConfiguracionSync.tsx`) + **ventana independiente** (`VentanaConfigSync.tsx`, MPA entry point Tauri).
- **Papelera 30 días** (`papeleraService.ts`): Implementado. `.papelera/` física + `papelera.json` Store.
- **Borrado bidireccional**: Implementado. Local→servidor rate-limited + servidor→local con papelera.
- **Fix upload duplicado**: `marcarDescargaEnCurso(nuevaRuta)` ANTES de `rename()` en `moverArchivoASinColeccion()`.
- **Fix manejarMoveLocal**: Fallback a tracking v2 cuando v1 index lookup falla.
- **Config window independiente**: Entry MPA `config.html`, ventana Tauri dinámica (`WebviewWindowBuilder`), comunicación inter-window via Tauri events.

---

## 1. Auditoría de Eficiencia — Escenario 1000 Samples

### 1.1. Upload: Cola Secuencial Sin Paralelismo

**Archivo:** `uploadQueueService.ts` (644 líneas)
**Problema:** `procesarCola()` usa un `while(true)` que procesa UN archivo a la vez. 1000 archivos = 1000 uploads secuenciales.

```typescript
/* ACTUAL — secuencial */
while (true) {
    const siguiente = cola.find(i => i.estado === 'pendiente');
    if (!siguiente) break;
    await subirArchivo(siguiente); /* Bloquea hasta completar */
}
```

**Impacto:** Con archivos de 5MB promedio y 2Mbps upload, 1000 files × 20s = ~5.5 horas secuenciales. Con 3 paralelos → ~1.8 horas.

**Solución:**
- Implementar semáforo de concurrencia configurable (1-5 uploads paralelos).
- `procesarCola()` lanza N workers que consumen de la cola.
- Cada worker respeta backoff independiente.
- `guardarCola()` debounced (no por cada operación).

### 1.2. Download: Loop Secuencial en syncCollectionService

**Archivo:** `syncCollectionService.ts` (697 líneas)
**Problema:** Descarga samples en `for...of` con `await` por cada uno:

```typescript
/* ACTUAL — secuencial */
for (const sample of colServer.samples) {
    const resultado = await descargarSiNecesario(sample, ...);
}
```

Cada sample hace 2 fetch (POST /descargar + GET audio). 1000 samples = 2000 roundtrips secuenciales.

**Solución:**
- Pool de descargas con semáforo configurable (1-5 paralelas).
- Reutilizar patrón del upload.
- Respetar `MARGEN_DISCO_BYTES` en cada verificación.

### 1.3. Persistencia por Operación (Disk Thrashing)

**Archivos afectados:**
- `uploadQueueService.ts`: `guardarCola()` después de CADA cambio de estado por item.
- `syncState.ts`: `guardarIndice()` serializa `indiceArchivos[]` completo + escribe a disco.
- `syncWatcherSetup.ts`: Llama `guardarIndice()` en marcarNoSincronizar, reactivarSync, manejarMoveLocal, actualizarRutaYCarpeta — cada operación individual.

**Impacto:** 1000 archivos = 1000+ escrituras a disco secuenciales. En HDD = cuello de botella severo. En SSD = desgaste innecesario.

**Solución:**
- **Debounce de persistencia:** Acumular cambios en memoria y persistir con debounce de 2-3 segundos.
- `syncTrackingService` ya tiene `iniciarLote()/finalizarLote()` — extender este patrón a `guardarCola()` y `guardarIndice()`.
- Crear `persistenciaDebouncada()` genérica reutilizable.

### 1.4. O(n) Lookups en syncWatcherSetup

**Archivo:** `syncWatcherSetup.ts` (491 líneas)
**Problema:** `estado.indiceArchivos.find()` es O(n) y se ejecuta POR CADA evento del watcher:

```typescript
const porRuta = estado.indiceArchivos.find(
    a => a.ruta.replace(/\\/g, '/') === rutaNorm,
);
const porNombre = estado.indiceArchivos.find(
    a => a.nombreServidor === nombreArchivo || a.nombreOriginal === nombreArchivo,
);
```

Con 5000 archivos en índice × 1000 eventos = 5 millones de comparaciones de string.

**Solución:**
- Crear índices Map en `syncState`:
  - `indiceArchivosMap: Map<string, ArchivoLocal>` (key = ruta normalizada)
  - `indiceArchivosNombreMap: Map<string, ArchivoLocal>` (key = nombreServidor | nombreOriginal)
- Reconstruir índices al cargar/modificar.
- Lookups O(1) en vez de O(n).

### 1.5. Map Sin Límite en fileWatcherService

**Archivo:** `fileWatcherService.ts` (400 líneas)
**Problema:** `archivosRecientes` solo purga cuando `.size > 500`:

```typescript
if (archivosRecientes.size > 500) {
    for (const [k, v] of archivosRecientes) {
        if (ahora - v > 30_000) archivosRecientes.delete(k);
    }
}
```

Con un batch de 1000 archivos copiados de golpe, el Map crece a 1000+ entries y TODA la purga itera los 1000.

**Solución:**
- Purgar con debounce periódico (cada 10s) en vez de por umbral.
- Usar TTL check en cada acceso (si entry > 30s, eliminar inline).
- Límite duro más agresivo (purger si > 200).

### 1.6. Timeout Leak en syncGuards

**Archivo:** `syncGuards.ts` (95 líneas)
**Problema:** `marcarDescargaEnCurso()` crea un `setTimeout` por cada ruta, pero si se llama repetidamente para la misma ruta (posible en edge cases), acumula timeouts sin cancelar los anteriores:

```typescript
export function marcarDescargaEnCurso(ruta: string): void {
    descargasEnCurso.add(normalizada);
    setTimeout(() => { descargasEnCurso.delete(normalizada); }, GRACIA_DESCARGA_MS);
}
```

Con 1000 descargas simultáneas = 1000 setTimeout activos.

**Solución:**
- Almacenar el timeout handle en un Map<string, NodeJS.Timeout>.
- Si se vuelve a marcar la misma ruta, cancelar timeout anterior.
- En batch, esto previene 1000 timers activos para la misma ruta.

### 1.7. Imports Dinámicos Dentro de Loops

**Archivo:** `syncCollectionService.ts`
**Problema (mitigado):** `await import('@tauri-apps/plugin-fs')` y `await import('@tauri-apps/api/path')` se llaman dentro de funciones que se ejecutan en loop. Aunque el bundler cachea el module, cada `import()` tiene overhead de resolución.

**Solución:** Mover imports al inicio de `sincronizarColecciones()` antes del loop (ya se hace parcialmente, estandarizar).

### 1.8. `cola.some()` O(n) por Encolamiento

**Archivo:** `uploadQueueService.ts`
**Problema:** `encolarArchivo()` verifica duplicados con `cola.some(i => i.rutaArchivo === rutaArchivo)`. Con cola de 1000, es O(1000) por cada nuevo archivo.

**Solución:** Mantener `Set<string>` de rutas en cola (`rutasEnCola: Set<string>`) para O(1).

---

## 2. Panel de Configuración Sync

### 2.1. Diseño

- **Trigger:** Botón engranaje en el menú `...` de `VentanaSincPanel`.
- **UI:** Modal centrado en la ventana sync (overlay con backdrop).
- **Secciones:**
  1. **Velocidad de subida máxima** — Slider: 0.5 / 1 / 2 / 5 / 10 / Sin límite (Mbps)
  2. **Archivos paralelos** — Selector: 1 / 2 / 3 / 5 (tanto upload como download)
  3. **Borrado bidireccional:**
     - Toggle: "Al borrar en local, borrar en servidor"
     - Toggle: "Al borrar en servidor, borrar en local"
  4. **Papelera:**
     - Toggle: "Usar papelera (30 días)"
     - Info: "Los archivos eliminados se mueven a una papelera y se eliminan permanentemente después de 30 días"

### 2.2. Persistencia

Agregar a `SyncConfig` en `syncState.ts`:

```typescript
export interface SyncConfigAvanzada {
    velocidadMaximaSubidaMbps: number;    /* 0 = sin límite */
    archivosParalelos: number;             /* 1-5, default 1 */
    borrarEnServidorAlBorrarLocal: boolean; /* default false */
    borrarEnLocalAlBorrarEnServidor: boolean; /* default false */
    papeleraActiva: boolean;               /* default true */
    papeleraDuracionDias: number;          /* default 30 */
}
```

Store: `sync-config.json` key `sync_config_avanzada`.

### 2.3. Componentes

**Nuevos:**
- `desktop/src/components/ConfiguracionSync.tsx` — Vista del panel (solo JSX + desestructuración)
- `desktop/src/hooks/useConfiguracionSync.ts` — Lógica (cargar/guardar config, validación)

**CSS:**
- Agregar sección en `sincronizacion.css` o crear `configuracionSync.css` si excede 80 líneas.

### 2.4. Integración

- `VentanaSincPanel.tsx`: Agregar botón "Configuración" en menú `...`.
- Al cambiar archivosParalelos, notificar a `uploadQueueService` y `syncCollectionService` para que ajusten concurrencia.
- Al cambiar velocidadMaxima, activar throttle en la siguiente subida.

---

## 3. Throttle de Velocidad de Subida

### 3.1. Implementación

Crear utilidad `throttleStream.ts` en `desktop/src/services/`:

```typescript
/**
 * Throttlea un ReadableStream a un máximo de bytes/segundo.
 * Usado por uploadQueueService para respetar el límite configurado.
 */
export function crearThrottledStream(
    datos: Uint8Array,
    bytesPerSegundo: number,
): ReadableStream<Uint8Array> { ... }
```

**Mecanismo:** Dividir el Uint8Array en chunks de `bytesPerSegundo / 10` (100ms por chunk) y usar `TransformStream` con delay entre chunks.

### 3.2. Aplicación

En `subirArchivo()` de `uploadQueueService.ts`:
- Si `velocidadMaximaSubidaMbps > 0`, construir `ReadableStream` throttled en vez de `Blob` directo.
- Usar `fetch()` con `body: throttledStream` en navegadores que soporten streaming uploads. Tauri WebView debería soportarlo.
- Fallback: si streaming no soporta, usar `XMLHttpRequest` con `upload.onprogress` y delay artificial entre chunks.

### 3.3. Alternativa Simple (Recomendada)

Dado que el upload es por FormData y no streaming nativo, la forma más pragmática es:
- **Throttle entre archivos**, no dentro del archivo.
- Si el límite es 2 Mbps y un archivo pesa 10MB, esperar `(10MB / 2Mbps) - tiempoReal` entre archivos.
- Esto es menos preciso pero mucho más simple y funciona con FormData estándar.
- Para archivos grandes (>50MB), dividir en chunks de 5MB y throttlear entre chunks.

**Decisión: Implementar throttle inter-archivo primero.** Si se necesita intra-archivo, agregar en iteración futura.

---

## 4. Cola de Upload con Paralelismo

### 4.1. Semáforo de Concurrencia

Crear utilidad `semaforo.ts`:

```typescript
/**
 * Semáforo de concurrencia para limitar operaciones paralelas.
 * Patrón: acquire() → ejecutar → release().
 */
export class Semaforo {
    constructor(private maxConcurrentes: number) {}
    async adquirir(): Promise<void> { ... }
    liberar(): void { ... }
    cambiarLimite(nuevoLimite: number): void { ... }
}
```

### 4.2. Refactor de procesarCola()

```typescript
async function procesarCola(): Promise<void> {
    if (procesando) return;
    procesando = true;

    const config = await cargarConfigAvanzada();
    const semaforo = new Semaforo(config.archivosParalelos);
    const promesasActivas: Promise<void>[] = [];

    try {
        while (true) {
            const siguiente = obtenerSiguientePendiente();
            if (!siguiente) {
                /* Esperar a que terminen las activas */
                if (promesasActivas.length > 0) {
                    await Promise.race(promesasActivas);
                    continue;
                }
                break;
            }

            await semaforo.adquirir();

            const promesa = procesarItem(siguiente)
                .finally(() => {
                    semaforo.liberar();
                    /* Eliminar de activas */
                    const idx = promesasActivas.indexOf(promesa);
                    if (idx !== -1) promesasActivas.splice(idx, 1);
                });

            promesasActivas.push(promesa);

            /* Throttle inter-archivo */
            if (config.velocidadMaximaSubidaMbps > 0) {
                await delay(calcularDelayThrottle(siguiente, config));
            }
        }

        /* Esperar que TODAS terminen */
        await Promise.all(promesasActivas);
    } finally {
        procesando = false;
        await persistirCambios();
    }
}
```

### 4.3. Mismo Patrón para Descargas

En `syncCollectionService.ts`, reemplazar el `for...of` secuencial por pool con semáforo:

```typescript
/* Fase 2: Descargar samples con concurrencia controlada */
const config = await cargarConfigAvanzada();
const semaforo = new Semaforo(config.archivosParalelos);

const promesas = coleccionSamples.map(sample =>
    semaforo.adquirir().then(async () => {
        try {
            const resultado = await descargarSiNecesario(sample, ...);
            if (resultado === 'nuevo') nuevos++;
            if (resultado === 'error') errores++;
        } finally {
            semaforo.liberar();
        }
    })
);

await Promise.all(promesas);
```

---

## 5. Sistema de Papelera (30 días)

### 5.1. Papelera Local

**Ubicación:** `{carpetaSync}/.papelera/` (carpeta oculta en la base de sync).

**Estructura:**
```
carpetaSync/
├── .papelera/
│   ├── 2026-02-27_sample1.wav    ← prefijo fecha para TTL
│   ├── 2026-02-20_sample2.wav
│   └── .papelera-index.json       ← tracking de items en papelera
├── Mi Colección/
└── Sin colección/
```

**Index de papelera:**
```typescript
interface ItemPapelera {
    nombreOriginal: string;
    rutaOriginal: string;         /* ruta completa antes de mover */
    sampleId: number;
    coleccionId: number | null;
    fechaBorrado: number;          /* timestamp */
    fechaExpiracion: number;       /* fechaBorrado + 30 días */
    tamano: number;
}
```

### 5.2. Flujo de Borrado Local

**ANTES (actual):** fileWatcher detecta DELETE → `marcarNoSincronizar()` → el archivo se pierde.

**DESPUÉS (con papelera):**
1. fileWatcher detecta DELETE
2. Si `papeleraActiva`:
   a. Buscar archivo en tracking por ruta
   b. Mover archivo a `.papelera/` con prefijo fecha
   c. Registrar en `.papelera-index.json`
   d. Marcar `syncDeshabilitado` en tracking
   e. Si `borrarEnServidorAlBorrarLocal`: encolar DELETE al servidor (soft-delete server-side)
3. Si `!papeleraActiva`: comportamiento actual (solo marcar no_sincronizar)

**Problema:** El archivo ya fue eliminado por el usuario cuando el watcher lo detecta. No podemos "moverlo" a la papelera porque ya no existe en disco.

**Solución revisada:** Interceptar ANTES del borrado no es posible con un file watcher. Alternativas:
- **Opción A:** La papelera es solo server-side (soft delete con fecha de expiración). Local: el archivo se borra definitivamente. Restaurar = re-descargar.
- **Opción B:** Copiar archivos a `.papelera/` periódicamente como backup (costoso en disco).
- **Opción C (Recomendada):** Papelera virtual. No mover archivos, sino mantener un registro de "archivos eliminados" con metadata suficiente para restaurar (re-descargar del servidor). UI muestra papelera con opción "Restaurar" = descargar de nuevo + quitar `syncDeshabilitado`.

**Decisión: Opción C — Papelera virtual.** Razones:
1. El watcher detecta borrado DESPUÉS de que el archivo se elimina → no se puede mover.
2. No duplica espacio en disco.
3. Restaurar = re-descargar del servidor (el sample sigue existiendo server-side).
4. Compatible con el flujo actual de `marcarNoSincronizar`.

### 5.3. Papelera Servidor (Soft Delete)

**Backend nuevo:**

Tabla `papelera_samples` o campo `eliminado_at TIMESTAMP NULL` en `descargas`:
- Opción preferida: Campo `eliminado_at` en tabla `descargas` (más simple, no nueva tabla).
- Cuando `eliminado_at IS NOT NULL`: el sample no aparece en la respuesta de `/me/sync/colecciones`.
- Cron job (diario): `DELETE FROM descargas WHERE eliminado_at IS NOT NULL AND eliminado_at < NOW() - INTERVAL '30 days'`.

**Endpoint nuevo:**
```
DELETE /me/sync/samples/{sampleId}/soft-delete
    → SET eliminado_at = NOW() WHERE sample_id = ? AND usuario_id = ?
    → Retorna: { ok: true, expiraEn: "2026-03-29" }

POST /me/sync/samples/{sampleId}/restaurar
    → SET eliminado_at = NULL WHERE sample_id = ? AND usuario_id = ?
```

**Endpoint modificado:**
```
GET /me/sync/colecciones
    → Excluir samples con eliminado_at IS NOT NULL
    → Agregar campo opcional: papelera: SampleSync[] (samples soft-deleted)
```

### 5.4. Flujo Completo con Papelera

**Borrado local (usuario borra archivo en carpeta):**
1. fileWatcher → DELETE detected
2. ¿`papeleraActiva`? → Registrar en papelera virtual (tracking + `fechaBorrado`)
3. ¿`borrarEnServidorAlBorrarLocal`? → Llamar `DELETE /soft-delete` al servidor
4. Si no → Solo marcar `syncDeshabilitado` (como ahora)
5. Sync futura: no re-descargar archivos con `syncDeshabilitado`

**Borrado servidor (admin borra, o auto-expire):**
1. Polling detecta sample ausente en respuesta de colecciones
2. ¿`borrarEnLocalAlBorrarEnServidor`? → Eliminar archivo local + tracking
3. Si no → Marcar como "huérfano" en tracking (solo informativo)

**Restaurar desde papelera (UI):**
1. Usuario ve lista de archivos en papelera (últimos 30 días)
2. Click "Restaurar" → `POST /restaurar` al servidor + quitar `syncDeshabilitado` + trigger re-descarga
3. Archivo se descarga en siguiente sync

**Limpieza automática:**
- **Local:** Timer cada 24h revisa papelera virtual. Items con `fechaBorrado + 30 días < ahora` → eliminar completamente de tracking.
- **Servidor:** Cron WP diario: `DELETE FROM descargas WHERE eliminado_at < NOW() - INTERVAL '30 days'`.

### 5.5. Servicio de Papelera

**Archivo nuevo:** `desktop/src/services/papeleraService.ts`

```typescript
interface ItemPapelera {
    sampleId: number;
    coleccionId: number | null;
    nombreArchivo: string;
    rutaOriginal: string;
    fechaBorrado: number;
    fechaExpiracion: number;
    tamano: number;
    imagenUrl?: string;
}

/* API pública */
export function enviarAPapelera(sampleId: number, ...): Promise<void>;
export function restaurarDePapelera(sampleId: number): Promise<boolean>;
export function listarPapelera(): ItemPapelera[];
export function limpiarExpirados(): Promise<number>;
export function vaciarPapelera(): Promise<void>;
```

**Persistencia:** Tauri Store `sync-config.json`, key `sync_papelera`.

---

## 6. Borrado Bidireccional

### 6.1. Local → Servidor

**Cuando:** `borrarEnServidorAlBorrarLocal = true` y el usuario borra un archivo local.

**Flujo:**
1. fileWatcher → DELETE
2. Buscar sampleId en tracking
3. Si `papeleraActiva` → soft-delete: `DELETE /me/sync/samples/{sampleId}/soft-delete`
4. Si `!papeleraActiva` → podriar ser hard-delete (pero peligroso, mejor siempre soft)

**Edge cases:**
- Sin conexión → encolar en `offlineQueueService` como tipo `borrar_servidor`
- El sample es de otro usuario (descargado pero no subido) → solo soft-delete de la relación en `descargas`, no del sample en sí

### 6.2. Servidor → Local

**Cuando:** `borrarEnLocalAlBorrarEnServidor = true` y el polling detecta que un sample ya no está.

**Flujo:**
1. `sincronizarColecciones()` compara respuesta del servidor con tracking local
2. Sample existe en tracking pero NO en respuesta del servidor
3. Si `borrarEnLocalAlBorrarEnServidor`:
   a. Eliminar archivo local del disco (`unlink`)
   b. Si `papeleraActiva`: registrar en papelera virtual antes
   c. Eliminar de tracking
4. Si no → marcar como "huérfano" (informativo, no borrar)

**Ya existe parcialmente:** `sincronizarColecciones()` ya purga entries de tracking cuando el servidor no los tiene, pero no borra archivos de disco.

### 6.3. Protecciones

- **Confirmación inicial:** La primera vez que el usuario activa borrado bidireccional, mostrar advertencia clara.
- **Rate limit:** Máximo 50 deletes por sync para evitar borrado masivo accidental.
- **Log detallado:** Toda eliminación bidireccional queda en historial con tipo `eliminado_bidireccional`.

---

## 7. Archivos a Crear/Modificar

### Nuevos
| Archivo | Responsabilidad | Líneas est. |
|---|---|---|
| `desktop/src/services/semaforo.ts` | Semáforo de concurrencia reutilizable | ~50 |
| `desktop/src/services/papeleraService.ts` | Gestión de papelera virtual | ~150 |
| `desktop/src/services/persistenciaDebounce.ts` | Escritura a disco debounced genérica | ~40 |
| `desktop/src/components/ConfiguracionSync.tsx` | Vista del panel de configuración | ~120 |
| `desktop/src/hooks/useConfiguracionSync.ts` | Lógica del panel de configuración | ~80 |

### Modificados
| Archivo | Cambios |
|---|---|
| `syncState.ts` | +SyncConfigAvanzada, +índices Map, +persistencia debounced |
| `uploadQueueService.ts` | Semáforo paralelo, throttle inter-archivo, Set rutas en cola, guardarCola debounced |
| `syncCollectionService.ts` | Pool descargas con semáforo, import hoisted, borrado bidireccional servidor→local |
| `fileWatcherService.ts` | Purga periódica Map, integración papelera |
| `syncGuards.ts` | Map de timeouts con cancel, cleanup batch |
| `syncWatcherSetup.ts` | Integrar papelera en callback DELETE, borrado local→servidor |
| `VentanaSincPanel.tsx` | Botón configuración + vista papelera |
| `sincronizacion.css` | Estilos panel config + papelera |

### Backend (si se implementa soft-delete)
| Archivo | Cambios |
|---|---|
| `SyncController.php` | +2 endpoints (soft-delete, restaurar) |
| `SyncRepository.php` | +queries soft-delete/restaurar/cleanup |
| `descargas` tabla | +columna `eliminado_at TIMESTAMP NULL` |

---

## 8. Orden de Implementación

### Fase A — Infraestructura de optimización (no rompe nada)
1. `semaforo.ts` — utilidad genérica
2. `persistenciaDebounce.ts` — utilidad genérica
3. Índices Map en `syncState.ts`
4. Fix timeout leak en `syncGuards.ts`
5. Fix Map growth en `fileWatcherService.ts`
6. Set de rutas en `uploadQueueService.ts` (O(1) lookup)

### Fase B — Paralelismo (mejora rendimiento)
7. Refactor `procesarCola()` con semáforo → uploads paralelos
8. Refactor `sincronizarColecciones()` con semáforo → descargas paralelas
9. Debounce `guardarCola()` y `guardarIndice()`
10. Hoisting de imports en `syncCollectionService.ts`

### Fase C — Panel de configuración (UI nueva)
11. `SyncConfigAvanzada` tipo + persistencia en store
12. `useConfiguracionSync.ts` hook
13. `ConfiguracionSync.tsx` componente
14. Integrar en `VentanaSincPanel.tsx`
15. Conectar config con servicios (cambio de paralelismo en caliente)

### Fase D — Throttle de velocidad
16. Implementar throttle inter-archivo en `procesarCola()`
17. Calcular delay basado en tamaño archivo y límite configurado

### Fase E — Papelera
18. `papeleraService.ts` — CRUD papelera virtual
19. Integrar en `syncWatcherSetup.ts` callback DELETE
20. Vista papelera en `VentanaSincPanel.tsx` (sección expandible o sub-vista)
21. Limpieza automática (timer 24h)
22. Backend: soft-delete endpoints + columna `eliminado_at` (opcional, puede ir en fase separada)

### Fase F — Borrado bidireccional
23. Local→servidor: encolar soft-delete en callback DELETE si opción activa
24. Servidor→local: borrar archivo disco en `sincronizarColecciones()` si opción activa
25. Protecciones: rate limit, log, confirmación primera vez

---

## 9. Métricas de Éxito

| Escenario | Antes | Después |
|---|---|---|
| Copiar 1000 samples | ~5.5h upload secuencial | ~1.1h (5 paralelos) |
| Sync 1000 descargas | ~3h secuencial | ~36min (5 paralelos) |
| Disk writes por batch | 1000+ | ~10 (debounced) |
| Lookup en watcher | O(n) por evento | O(1) |
| Configuración | Hardcoded | Configurable por usuario |
| Archivos borrados | Perdidos | Papelera 30 días + restaurar |

---

## 10. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Uploads paralelos saturan red del usuario | Throttle configurable + default conservador (2 paralelos) |
| Soft-delete servidor requiere migración BD | Implementar primero solo papelera local/virtual |
| Borrado bidireccional borra algo importante | Default OFF + confirmación + papelera como safety net |
| Race condition en pool de descargas | Semáforo + locks existentes en syncGuards |
| Debounce demasiado largo pierde datos en crash | Flush obligatorio en cleanup/beforeunload + 2s debounce |
