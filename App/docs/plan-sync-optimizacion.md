# Plan: Revisión Profunda — Sistema de Sync (Upload + Watcher + Papelera)

> **Fecha:** 2026-03-03 | **Prioridad:** Crítica | **Módulos afectados:** fileWatcherService, papeleraService, uploadQueueService, syncWatcherSetup, syncService, backend upload
> **Estado:** PENDIENTE — Planificación completada tras bug reportado upload→papelera→re-upload→duplicado.
> **Referencia roadmap:** C368

---

## Historial: Fase 1 (Completada — 2026-02-27)

> Resumen compacto de lo implementado previamente. Detalles originales archivados en git (commit `0e02e219`+).

| Implementación | Archivo | Estado |
|---|---|---|
| Semáforo concurrencia (1-5 paralelos) | `semaforo.ts` | Implementado |
| Persistencia debounced (2s + flush beforeunload) | `persistenciaDebounce.ts` | Implementado |
| Map indices O(1) para lookups | `syncState.ts` | Implementado |
| Purga periódica watcher cache (10s/30s TTL) | `fileWatcherService.ts` | Implementado |
| Panel configuración (overlay + ventana MPA) | `ConfiguracionSync.tsx` / `VentanaConfigSync.tsx` | Implementado |
| Papelera 30 días (.papelera/ + papelera.json Store) | `papeleraService.ts` | Implementado |
| Borrado bidireccional rate-limited | `syncWatcherSetup.ts` | Implementado |
| Guard descarga pre-rename | `syncService.ts` (`marcarDescargaEnCurso`) | Implementado |
| Fallback tracking v1→v2 en manejarMoveLocal | `syncWatcherSetup.ts` | Implementado |
| Upload dedup pre-flight (hash + tracking) | `uploadQueueService.ts` | Implementado |
| Set O(1) rutas en cola | `uploadQueueService.ts` | Implementado |
| Config window MPA aislada | `config.html` / `config.tsx` | Implementado |

---

## Fase 2: Corrección Arquitectónica — Ciclo Upload→Papelera→Re-Upload

### Bug Reportado (2026-03-03)

**Secuencia reproducida por el usuario:**
1. Se sube `Synth Guitar Loop_UhiJ_2upra.wav`
2. Error: `"failed to open file at path: C:\Users\Owner\O"` (ruta OneDrive truncada)
3. El archivo se borra de la ubicación original y aparece en `.papelera/` como `1772563989924_Synth Guitar Loop_UhiJ_2upra.wav`
4. El panel muestra ese archivo de papelera como **"Sincronizado"**
5. El sample se **duplica** en el servidor

### Análisis de Causas Raíz (5 problemas sistémicos interconectados)

```
FLUJO DEL BUG:

  [1] Usuario arrastra archivo a carpeta sync
  [2] Watcher emite CREATE → encolarArchivo() → cola
  [3] subirArchivo() llama readFile(ruta) → FALLA (OneDrive / archivo no disponible)
  [4] Error después de N reintentos → (algo) mueve archivo a .papelera/
                                        ↓
  [5] papeleraService.rename(original, .papelera/1772563989924_nombre.wav)
      ├── Watcher emite DELETE para ruta original → manejarBorradoLocal()
      └── Watcher emite CREATE para .papelera/1772563989924_nombre.wav ← PROBLEMA RAÍZ
                                        ↓
  [6] onArchivoNuevo() recibe "1772563989924_Synth Guitar Loop.wav"
      ├── buscarArchivoPorNombre("1772563989924_Synth Guitar...") → NO MATCH (prefijo timestamp)
      ├── buscarEnIndicePorRuta(".papelera/...") → NO MATCH (ruta nueva)
      └── buscarEnIndicePorNombre("1772563989924_...") → NO MATCH
                                        ↓
  [7] encolarArchivo() acepta → subirArchivo() → POST al server → ÉXITO
  [8] Historial marca "Sincronizado" para archivo que está en papelera
  [9] Server tiene 2 registros del mismo audio (si el primer upload parcial llegó)
```

---

## Tareas de Corrección

### P1. Excluir `.papelera/` del watcher de archivos (CRÍTICA)

**Archivo:** `fileWatcherService.ts`
**Problema:** `procesarEvento()` itera `evento.paths` sin filtrar rutas que contengan `/.papelera/` o `\.papelera\`. Cualquier rename/create dentro de `.papelera/` se trata como archivo nuevo legítimo.

**Solución:**
- Añadir filtro temprano en `procesarEvento()`, ANTES de clasificar por tipo de evento.
- El filtro debe operar sobre la ruta normalizada (ya disponible como `normalizada`).
- Patrón de exclusión: `/.papelera/` en la ruta relativa (después de `carpetaBase`).

**Implementación concreta:**
```typescript
/* En procesarEvento(), después de normalizar ruta, ANTES de todo lo demás */
const CARPETAS_EXCLUIDAS = ['.papelera'];

/* Verificar si la ruta está dentro de una carpeta excluida */
const relativa = normalizada.startsWith(baseNormalizada + '/')
    ? normalizada.slice(baseNormalizada.length + 1)
    : '';
const segmentosRuta = relativa.split('/');
if (segmentosRuta.some(s => CARPETAS_EXCLUIDAS.includes(s))) continue;
```

**Por qué no es un parche:**
- `CARPETAS_EXCLUIDAS` es un array extensible (mañana se añade `.cache/`, `.temp/` etc. sin tocar lógica).
- El filtro es por segmento de ruta, no substring (evita falsos positivos tipo `carpeta.papelera-mix/`).
- Se aplica una sola vez en el punto de entrada central, no en cada callback.

**Verificaciones post-implementación:**
- [ ] Mover un archivo a `.papelera/` → watcher NO emite evento procesable
- [ ] Restaurar un archivo de `.papelera/` → watcher SÍ lo detecta como nuevo (la ruta destino está fuera de `.papelera/`)
- [ ] Crear archivo directamente en `.papelera/` (edge case) → watcher NO lo procesa

---

### P2. Guard de rename en papeleraService (CRÍTICA)

**Archivo:** `papeleraService.ts`
**Problema:** `moverAPapelera()` hace `rename(rutaOriginal, rutaPapelera)` SIN proteger contra el watcher. Comparar con `moverArchivoASinColeccion()` en `syncService.ts`, que SÍ usa `marcarDescargaEnCurso(nuevaRuta)`.

**Secuencia actual (rota):**
```
moverAPapelera()
  └── rename(original, .papelera/timestamp_nombre.wav)
      ├── Watcher: DELETE original → manejarBorradoLocal (OK, esperado)
      └── Watcher: CREATE .papelera/... → encolarArchivo (BUG)
```

**Secuencia correcta (con P1 + P2):**
```
moverAPapelera()
  └── marcarDescargaEnCurso(rutaPapelera)     ← P2: guard
  └── rename(original, .papelera/timestamp_...)
      ├── Watcher: DELETE original → manejarBorradoLocal (OK)
      └── Watcher: ruta contiene .papelera/ → FILTRADA por P1, nunca llega a callbacks
```

**Implementación concreta:**
- Importar `marcarDescargaEnCurso` de `syncGuards.ts` en `papeleraService.ts`.
- Llamar `marcarDescargaEnCurso(rutaPapelera)` ANTES de `rename()`.
- Esto es defensa en profundidad: P1 (filtro de ruta) es la línea principal, P2 (guard) es el fallback.

**Nota:** El guard actual usa `setTimeout` con TTL de 10s. Si el rename falla, el guard expira sin efecto secundario.

---

### P3. Pre-verificación de existencia antes de readFile (ALTA)

**Archivo:** `uploadQueueService.ts`
**Problema:** `subirArchivo()` llama `readFile(item.rutaArchivo)` directamente. Si el archivo fue movido, renombrado, o no está disponible (OneDrive cloud-only), falla con error críptico: `"failed to open file at path: C:\Users\Owner\O"` (ruta truncada).

**Causas del error `readFile`:**
1. **OneDrive cloud-only:** El archivo tiene el icono de nube en Explorer pero no está descargado localmente. Tauri `readFile` no puede acceder a archivos placeholder de OneDrive.
2. **Race condition:** El archivo fue movido/renombrado entre el encolamiento y el procesamiento (puede pasar minutos/horas después con backoff).
3. **Path encoding:** Rutas con caracteres especiales o muy largas pueden truncarse.

**Solución (3 capas):**

**Capa 1 — Verificar existencia antes de leer:**
```typescript
async function subirArchivo(item: ItemUploadCola): Promise<boolean> {
    try {
        const { readFile, exists } = await import('@tauri-apps/plugin-fs');

        /* Verificar que el archivo existe y es accesible */
        const archivoExiste = await exists(item.rutaArchivo);
        if (!archivoExiste) {
            item.ultimoError = `Archivo no encontrado: ${item.rutaArchivo}`;
            console.warn('[UploadQueue] Archivo no existe, posiblemente movido:', item.nombreArchivo);
            /* Buscar si fue movido a otra ubicación conocida */
            const alternativa = buscarArchivoMovido(item);
            if (alternativa) {
                item.rutaArchivo = alternativa;
                /* Continuar con la nueva ruta */
            } else {
                return false;
            }
        }
        // ... resto del upload
```

**Capa 2 — Error descriptivo en lugar de error críptico:**
```typescript
        let contenidoArchivo: Uint8Array;
        try {
            contenidoArchivo = await readFile(item.rutaArchivo);
        } catch (errLectura) {
            const msg = errLectura instanceof Error ? errLectura.message : String(errLectura);
            /* Detectar errores de OneDrive (archivos cloud-only) */
            const esOneDrive = item.rutaArchivo.includes('OneDrive')
                && (msg.includes('failed to open') || msg.includes('cloud'));
            item.ultimoError = esOneDrive
                ? `Archivo en la nube (OneDrive). Descárgalo localmente primero: ${item.nombreArchivo}`
                : `No se pudo leer el archivo: ${msg}`;
            return false;
        }
```

**Capa 3 — No encolar archivos de `.papelera/`:**
En `encolarArchivo()`, antes de aceptar:
```typescript
if (rutaArchivo.replace(/\\/g, '/').includes('/.papelera/')) {
    console.warn('[UploadQueue] Archivo en papelera, rechazando:', nombreArchivo);
    return false;
}
```
Esto es triple defensa: P1 (watcher no emite) + P2 (guard rename) + P3 (cola rechaza).

---

### P4. Normalización de nombre para dedup contra prefijo timestamp (ALTA)

**Archivo:** `uploadQueueService.ts` + `syncWatcherSetup.ts`
**Problema:** La papelera renombra archivos a `{13dígitos}_{nombre}`. Las capas de dedup buscan por nombre exacto → no matchean.

**Ejemplo:**
- Nombre original: `Synth Guitar Loop_UhiJ_2upra.wav`
- Nombre en papelera: `1772563989924_Synth Guitar Loop_UhiJ_2upra.wav`
- `buscarArchivoPorNombre("1772563989924_Synth Guitar Loop_UhiJ_2upra.wav")` → null
- `buscarEnIndicePorNombre("1772563989924_Synth Guitar Loop_UhiJ_2upra.wav")` → null

**Solución — Utilidad de normalización de nombre:**
```typescript
/* utils/normalizarNombreArchivo.ts */
const PREFIJO_PAPELERA = /^\d{13,}_/;

export function normalizarNombreParaDedup(nombre: string): string {
    return nombre.replace(PREFIJO_PAPELERA, '');
}
```

**Aplicación en 2 puntos:**
1. `encolarArchivo()`: Antes de dedup por nombre, normalizar.
2. `onArchivoNuevo` callback en `syncWatcherSetup.ts`: Normalizar `nombreArchivo` antes de `buscarArchivoPorNombre`.

**Por qué no es un parche:** La regex `^\d{13,}_` es el patrón documentado de la papelera (`${Date.now()}_${nombre}`). Si mañana el formato cambia, se actualiza EN UN lugar.

**Nota:** Si P1 se implementa correctamente, esta normalización es defensa en profundidad. Un archivo de `.papelera/` nunca debería llegar a `encolarArchivo()`. Pero si por algún edge case lo hace (watcher de otro proceso, restore manual), la normalización evita el duplicado.

---

### P5. Idempotency key para uploads — Prevención de duplicados server-side (ALTA)

**Archivos:** `uploadQueueService.ts` (cliente) + `SamplesUploadController.php` (servidor)
**Problema:** Si un upload llega al servidor pero el cliente no recibe/procesa la respuesta (timeout, desconexión, error post-response), el retry crea un registro duplicado. No hay dedup server-side.

**Solución — Idempotency key (patrón estándar de APIs de pago):**

**Cliente (`uploadQueueService.ts`):**
- Al crear `ItemUploadCola`, generar `idempotencyKey: crypto.randomUUID()`.
- Enviar como header `X-Idempotency-Key` en el POST.
- El key se mantiene entre reintentos del mismo item (NO se regenera).

```typescript
const item: ItemUploadCola = {
    id: `upload-${Date.now()}-...`,
    idempotencyKey: crypto.randomUUID(), /* Persistente entre reintentos */
    // ... resto
};

/* En subirArchivo(): */
const respuesta = await fetch(`${baseUrl}/kamples/v1/samples/upload`, {
    method: 'POST',
    body: formData,
    headers: { 'X-Idempotency-Key': item.idempotencyKey },
});
```

**Servidor (`SamplesUploadController.php`):**
```php
/* Antes de crear sample: */
$idempotencyKey = $request->get_header('X-Idempotency-Key');
if ($idempotencyKey) {
    $existente = $this->repo->buscarPorIdempotencyKey($idempotencyKey, $usuarioId);
    if ($existente) {
        /* Ya se procesó este upload: retornar el resultado original */
        return new WP_REST_Response(['ok' => true, 'sample_id' => $existente['id']], 200);
    }
}

/* Después de crear sample: guardar key con TTL */
$this->repo->guardarIdempotencyKey($idempotencyKey, $sampleId, $usuarioId);
/* TTL: 24h (cleanup cron) */
```

**Tabla nueva o campo:**
- Opción simple: columna `idempotency_key VARCHAR(36)` + `idempotency_expires_at TIMESTAMP` en tabla `samples`.
- Opción robusta: tabla `idempotency_keys (key, resource_type, resource_id, usuario_id, created_at)` con índice UNIQUE en `(key, usuario_id)` y cleanup cron cada 24h.

**Por qué no es un parche:** La idempotency key es un patrón estándar (Stripe, AWS, etc.) que protege contra CUALQUIER tipo de retry duplicado — no solo el caso de la papelera. Funciona incluso si el cliente se reinicia entre intentos (el key está persistido en la cola).

---

### P6. Consistencia historial + papelera (MEDIA)

**Archivos:** `papeleraService.ts`, `uploadQueueService.ts`
**Problema:** Un archivo puede aparecer como "Sincronizado" en el panel aunque esté físicamente en `.papelera/`. Esto ocurre cuando el re-upload desde papelera tiene éxito (bug de P1) pero también puede ocurrir si el usuario mueve manualmente un archivo ya sincronizado a la papelera.

**Solución — 2 acciones:**

**Acción 1: `moverAPapelera()` actualiza historial:**
Cuando `papeleraService.moverAPapelera()` mueve un archivo, debe actualizar el historial per-sample:
```typescript
/* Después de mover exitosamente */
actualizarEstadoSampleHistorial({
    sampleId: sampleId ?? 0,
    nombreArchivo,
    estado: 'en_papelera',
    rutaLocal: rutaPapelera,
}).catch(() => {});
```

**Acción 2: Validar ruta al mostrar estado en panel:**
El componente que muestra el historial puede verificar:
- Si `rutaLocal` contiene `.papelera/` → mostrar badge "En papelera" en vez de "Sincronizado".
- Esto es puramente visual, defensivo, no afecta lógica.

---

### P7. Auditoría: Otros archivos/carpetas que el watcher debería excluir (MEDIA)

**Archivo:** `fileWatcherService.ts`
**Problema:** Actualmente solo se excluyen patrones temporales (`PATRONES_TEMPORALES`). El array `CARPETAS_EXCLUIDAS` de P1 debería incluir TODAS las carpetas internas del sistema sync.

**Carpetas a excluir del watcher:**
| Carpeta | Razón |
|---|---|
| `.papelera` | Archivos eliminados, no deben re-subirse |
| `Sin colección` | Archivos ya subidos y reubicados post-upload |
| `Sin coleccion` | Variante sin tilde (legacy) |
| `.sync-temp` | Si se implementa staging area futura |

**Nota sobre `Sin colección`:** Actualmente `moverArchivoASinColeccion()` usa `marcarDescargaEnCurso()` como guard. Con la exclusión a nivel watcher, el guard se vuelve redundante pero se mantiene como defensa en profundidad.

**Implementación:**
```typescript
const CARPETAS_EXCLUIDAS_UPLOAD = new Set([
    '.papelera',
]);

/* Carpetas donde el watcher debe ignorar CREATEs pero NO DELETEs */
const CARPETAS_SOLO_DELETE = new Set([
    'sin colecci\u00f3n',
    'sin coleccion',
]);
```

El filtro en `procesarEvento()` diferencia:
- Si ruta contiene carpeta de `CARPETAS_EXCLUIDAS_UPLOAD` → ignorar TODO evento.
- Si ruta contiene carpeta de `CARPETAS_SOLO_DELETE` → ignorar CREATEs, procesar DELETEs (para que `manejarBorradoLocal` siga funcionando si alguien borra desde "Sin colección").

---

## Orden de Implementación

| Prioridad | Tarea | Impacto | Riesgo | Dependencia |
|---|---|---|---|---|
| 1 | **P1** — Excluir `.papelera/` del watcher | Elimina raíz del bug | Bajo | Ninguna |
| 2 | **P2** — Guard rename en papeleraService | Defensa en profundidad | Bajo | Ninguna |
| 3 | **P3** — Pre-check existencia en subirArchivo | Errores claros, no crípticos | Bajo | Ninguna |
| 4 | **P4** — Normalización nombre dedup | Triple defensa client-side | Bajo | Ninguna |
| 5 | **P7** — Auditar carpetas excluidas | Previene bugs similares futuros | Bajo | P1 (extiende array) |
| 6 | **P6** — Consistencia historial + papelera | UX correcta | Bajo | P2 |
| 7 | **P5** — Idempotency key server-side | Prevención definitiva duplicados | Medio | Backend migration |

**P1+P2 juntos eliminan el 95% del problema reportado.**
P3+P4 cubren edge cases y mejoran UX de errores.
P5 es la solución definitiva a largo plazo contra duplicados por cualquier causa.
P6+P7 son limpieza y consistencia.

---

## Métricas de Verificación

| Escenario | Antes | Después |
|---|---|---|
| Archivo movido a `.papelera/` | Watcher lo re-sube | Watcher lo ignora completamente |
| Upload falla + archivo en papelera | Re-upload fantasma + duplicado | Error claro + no re-upload |
| Retry de upload tras timeout | Duplicado en servidor | Idempotency key previene |
| Historial de archivo en papelera | Muestra "Sincronizado" (falso) | Muestra "En papelera" |
| Nombre con prefijo timestamp | Bypass total del dedup | Normalización antes de comparar |

---

## Archivos a Modificar

| Archivo | Cambios | Tareas |
|---|---|---|
| `fileWatcherService.ts` | Filtro de rutas excluidas en `procesarEvento()` | P1, P7 |
| `papeleraService.ts` | `marcarDescargaEnCurso()` antes de rename + update historial | P2, P6 |
| `uploadQueueService.ts` | `exists()` pre-readFile + rechazo `.papelera/` + normalización nombre + idempotency header | P3, P4, P5 |
| `syncWatcherSetup.ts` | Normalización nombre en callback `onArchivoNuevo` | P4 |
| `SamplesUploadController.php` | Idempotency key check + store | P5 |
| Migración/tabla BD | Campo o tabla idempotency_keys | P5 |

## Archivos Nuevos

| Archivo | Responsabilidad |
|---|---|
| `desktop/src/utils/normalizarNombreArchivo.ts` | Utilidad: strip prefijo timestamp de papelera para dedup |

---

## Lecciones (para roadmap.md)

- [Watcher]: `.papelera/` está DENTRO de la carpeta sync → el watcher la observa recursivamente. Todo rename a `.papelera/` genera CREATE visible para callbacks. Excluir SIEMPRE carpetas internas del watcher.
- [Papelera]: `moverAPapelera()` NO usa `marcarDescargaEnCurso()` como sí lo hace `moverArchivoASinColeccion()`. Toda operación que genera rename dentro de la carpeta sync DEBE usar el guard.
- [OneDrive]: `readFile` de Tauri falla en archivos cloud-only de OneDrive sin error descriptivo. Siempre pre-check con `exists()` y dar mensaje claro al usuario.
- [Dedup nombre]: El prefijo `${Date.now()}_` de la papelera rompe todas las comparaciones por nombre. Normalizar antes de buscar.
- [Idempotency]: Sin idempotency key server-side, CUALQUIER retry de upload puede crear duplicados. Es imposible garantizar exactly-once delivery solo desde el cliente.
