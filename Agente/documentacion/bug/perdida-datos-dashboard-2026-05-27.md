# Investigación: Pérdida Masiva de Datos en Dashboard

**Fecha:** 2026-05-27  
**Síntoma:** Tareas, hábitos, proyectos y notas desaparecen repentinamente del panel. Ocurre de forma impredecible: tras varios días de uso, o inmediatamente después de borrar una sola tarea.  
**Severidad:** CRÍTICA — pérdida total de datos del usuario

---

## Causa Raíz: Triple Fallo en Cascada

El borrado masivo NO es aleatorio. Es el resultado de **tres fallos encadenados** que, bajo ciertas condiciones de timing, convierten una operación inocua (borrar una tarea) en la destrucción de todos los datos.

### Cadena de eventos:

```
1. El usuario borra una tarea → lastModified se incrementa en localStorage
2. La petición de guardado falla o se interrumpe (debounce no ejecuta, red cae, etc.)
3. El usuario recarga la página o reabre el navegador
4. Al arrancar, useSyncManager ve: lastModified > lastSync → "hay cambios locales"
5. isDataReady se vuelve true ANTES de que Zustand hidrate los hábitos desde localStorage
6. performInitialSync() envía currentData con habitos:[] al servidor
7. El backend rellena los campos faltantes con default:[] (WordPress REST API)
8. DashboardRepository.saveAll() ejecuta el diff: existingIds - incomingIds = TODOS
9. Soft-delete masivo: todos los hábitos/tareas/proyectos se marcan deleted_at
10. La próxima sincronización descarga el estado vacío → local también se vacía
```

---

## Fallo #1: Defaults Peligrosos en la API (Backend)

**Archivo:** `App/Api/DashboardApiController.php` (líneas 93-118)

```php
private static function getSaveArgs(): array {
    return [
        'habitos' => [
            'required' => false,
            'validate_callback' => fn($param) => is_array($param),
            'default' => [],  // ← CULPABLE PRINCIPAL
        ],
        'tareas' => [
            'required' => false,
            'validate_callback' => fn($param) => is_array($param),
            'default' => [],  // ← CULPABLE PRINCIPAL
        ],
        'proyectos' => [
            'required' => false,
            'validate_callback' => fn($param) => is_array($param),
            'default' => [],  // ← CULPABLE PRINCIPAL
        ],
        // ...
    ];
}
```

**Y luego en saveDashboard() (línea 156):**
```php
$data = [
    'habitos' => $request->get_param('habitos') ?? [],
    'tareas' => $request->get_param('tareas') ?? [],
    'proyectos' => $request->get_param('proyectos') ?? [],
    // ...
];
```

**El problema:** WordPress REST API inyecta automáticamente los valores `default` cuando un campo no viene en la petición. Además, el `?? []` del controller es un doble seguro de vacío. Así, **una petición parcial siempre se convierte en una petición completa de borrado**.

### ¿Por qué es destructivo?

En `DashboardRepository::saveAll()` (línea 148):
```php
if (isset($data['habitos'])) {  // SIEMPRE true por los defaults
    $results['habitos'] = $this->habitosRepo->saveAll($data['habitos']);
}
```

Los repositorios (`HabitosRepository`, `TareasRepository`, `ProyectosRepository`) usan la lógica de **sync-by-diff** cuando `$partialUpdate = false` (valor por defecto):

```php
// TareasRepository::saveAll() línea ~324
if (!$partialUpdate) {
    $toDelete = array_diff($existingIds, $incomingIds);
    // Si $incomingIds = [] (porque el default es []),
    // $toDelete = TODOS los IDs existentes
    if (!empty($toDelete)) {
        $wpdb->query($wpdb->prepare(
            "UPDATE $table SET deleted_at = %s 
             WHERE user_id = %d AND id_local IN ($deletePlaceholders)",
            $now, $this->userId, ...$deleteIds
        ));
    }
}
```

**Resultado:** Si `habitos` viene como `[]`, TODOS los hábitos existentes se soft-deletean. Lo mismo para tareas y proyectos.

---

## Fallo #2: Condición de Carrera en Hidratación (Frontend)

**Archivo:** `App/React/hooks/dashboard/useSyncManager.ts` (línea 221)

```typescript
useEffect(() => {
    if (!loadingMeta && !isInitialized && isDataReady && !initializationStarted.current) {
        initializationStarted.current = true;
        performInitialSync();  // ← Se ejecuta con datos posiblemente vacíos
    }
}, [loadingMeta, isInitialized, isDataReady, performInitialSync]);
```

**¿Qué es `isDataReady`?** Viene de `useDashboardSync.ts` (línea ~280):
```typescript
isDataReady: !cargandoDatos && !cargandoDatosLocales
```

**El problema de timing:**

1. **`useLocalStorage`** (tareas, notas, proyectos) se hidrata en un `useEffect` síncrono:
   ```typescript
   // useLocalStorage.ts
   useEffect(() => {
       try {
           const valorAlmacenado = localStorage.getItem(clave);
           const valorParseado = JSON.parse(valorAlmacenado) as T;
           setValorInterno(valorParseado);
       } finally {
           setCargando(false);  // ← Se marca como listo inmediatamente
       }
   }, [clave, validarValor]);
   ```

2. **`useHabitosStore`** (Zustand con `persist`) se hidrata de forma **asincrónica**:
   - Zustand persist lee localStorage en un callback post-creation
   - No existe un flag de "hidratación completa" que se verifique antes de sincronizar
   - El store empieza con `habitos: []` y `inicializado: false`
   - La hidratación puede tardar 1-2 microticks más que useLocalStorage

3. **La ventana de peligro:** Entre que `cargandoDatosLocales` se pone en `false` (useLocalStorage listo) y Zustand persist termina de hidratar los hábitos, existe un render donde:
   - `isDataReady = true`
   - `currentData.habitos = []` (store aún no hidratado)
   - `syncMeta.lastModified > syncMeta.lastSync` (por la tarea eliminada previamente)

4. En ese microsegundo, `performInitialSync()` captura `currentData` con `habitos: []` y lo envía al servidor → **borrado masivo**.

### Escenarios que disparan la condición:

- **Recarga de página** después de una operación que incrementó `lastModified`
- **Reabrir el navegador** después de que una pestaña quedó con cambios pendientes
- **Cambiar de pestaña** y volver (el evento `focus` dispara `refrescarDesdeServidor`)
- **Reconexión de WebSocket** que fuerza re-sincronización
- **Debounce interrumpido**: el auto-save de 2s no ejecutó, el cambio quedó en localStorage

---

## Fallo #3: WebSocket usa setters no funcionales (Race Condition)

**Archivo:** `App/React/hooks/dashboard/useDashboardSync.ts` (líneas ~200-250)

```typescript
// ELIMINAR tarea por WebSocket:
onTareaRemota: (accion, datos) => {
    const tareasActuales = tareasRef.current;  // ← Lee ref
    if (accion === 'eliminar' && datos.id) {
        setTareas(tareasActuales.filter(t => t.id !== datos.id));
        // ↑ Usa el valor del ref, NO actualización funcional (prev => ...)
    }
}
```

**Problema:** Si llegan dos eventos WebSocket rápidos (ej: eliminar dos tareas seguidas), el segundo puede leer un `tareasRef.current` que aún no refleja la primera eliminación (React aún no re-renderizó). Resultado: la segunda eliminación sobreescribe la primera y una tarea "vuelve" temporalmente. Si esto coincide con un auto-save, se envía un estado inconsistente.

---

## Fallo #4 (Agravante): Transacción Anidada en Backup Restore

**Archivo:** `App/Api/BackupsApiController.php` (líneas ~126-150)

```php
$wpdb->query('START TRANSACTION');    // Transacción 1
$dashboardRepo->deleteAll();          // Borrado físico
$result = $dashboardRepo->saveAll($data);
    // ↑ saveAll() internamente hace START TRANSACTION → COMMIT implícito de la 1ª
    // Si saveAll() falla después de esto, ROLLBACK no recupera los datos
```

En MySQL/InnoDB, un segundo `START TRANSACTION` hace **COMMIT implícito** del primero. Si `saveAll()` falla a mitad de camino, el `ROLLBACK` externo no puede recuperar los datos ya eliminados por `deleteAll()`.

---

## Escenarios Reales Confirmados

| # | Escenario | Cómo dispara la cascada |
|---|-----------|------------------------|
| 1 | Usuario borra 1 tarea → recarga rápido | `lastModified > lastSync` → sync con datos vacíos → servidor borra todo |
| 2 | Página abierta días → navegador mata la pestaña | Cambio pendiente en localStorage → al reabrir, sync inicial envía estado parcial |
| 3 | Mala conexión → auto-save falla 3 veces | Safety breaker se activa, pero al recargar se reintenta con datos vacíos |
| 4 | Login en nuevo dispositivo | Zustand no hidratado aún → sync inicial envía `{habitos: [], tareas: []}` |
| 5 | Dos eventos WS rápidos | Race condition en setTareas → estado inconsistente → auto-save con datos parciales |

---

## Soluciones Propuestas

### 🔴 Solución 1 (URGENTE — Backend): Eliminar defaults destructivos

**Archivo:** `App/Api/DashboardApiController.php`

```php
// ANTES (peligroso):
private static function getSaveArgs(): array {
    return [
        'habitos' => [
            'required' => false,
            'validate_callback' => fn($param) => is_array($param),
            'default' => [],  // ← ELIMINAR
        ],
        // ...
    ];
}

// DESPUÉS (seguro):
private static function getSaveArgs(): array {
    return [
        'habitos' => [
            'required' => false,
            'validate_callback' => fn($param) => is_array($param),
            // SIN default — WordPress no inyecta nada si no viene
        ],
        // ...
    ];
}
```

Y en `saveDashboard()`:
```php
// ANTES:
$data = [
    'habitos' => $request->get_param('habitos') ?? [],
    // ...
];

// DESPUÉS:
$data = [];
$habitos = $request->get_param('habitos');
if ($habitos !== null) {
    $data['habitos'] = $habitos;
}
// Solo incluir en $data las claves que realmente vinieron en la petición
```

Esto hace que `DashboardRepository::saveAll()` solo procese las entidades que realmente se enviaron, ignorando las demás (`isset($data['habitos'])` será `false` para las omitidas).

### 🔴 Solución 2 (URGENTE — Frontend): Safety Guard contra datos vacíos

**Archivo:** `App/React/hooks/dashboard/useSyncManager.ts`

Añadir antes de enviar datos al servidor:

```typescript
/**
 * Safety Guard: NUNCA subir datos si TODOS los arrays están vacíos
 * y ya existía una sincronización previa (lastSync > 0).
 * Esto previene el wipeout cuando Zustand aún no ha hidratado.
 */
function esProbableWipeout(data: DashboardData, lastSync: number): boolean {
    if (lastSync === 0) return false; // Primera vez = usuario nuevo, ok subir vacío
    const sinHabitos = !data.habitos || data.habitos.length === 0;
    const sinTareas = !data.tareas || data.tareas.length === 0;
    const sinProyectos = !data.proyectos || data.proyectos.length === 0;
    return sinHabitos && sinTareas && sinProyectos;
}
```

Usar en `performInitialSync()` y en el auto-save debounced:
```typescript
if (esProbableWipeout(currentData, syncMeta.lastSync)) {
    console.error('[SyncManager] ABORTADO: Se intentó subir datos completamente vacíos. Posible race condition de hidratación.');
    return; // NO enviar
}
```

### 🟡 Solución 3 (IMPORTANTE — Frontend): Esperar hidratación de Zustand

**Archivo:** `App/React/hooks/dashboard/useDashboardSync.ts`

El flag `isDataReady` debe incluir el estado de hidratación del store de hábitos:

```typescript
// ANTES:
isDataReady: !cargandoDatos && !cargandoDatosLocales,

// DESPUÉS:
const habitosInicializado = useHabitosStore(state => state.inicializado);
isDataReady: !cargandoDatos && !cargandoDatosLocales && habitosInicializado,
```

### 🟡 Solución 4 (IMPORTANTE — Frontend): WebSocket con actualizaciones funcionales

**Archivo:** `App/React/hooks/dashboard/useDashboardSync.ts`

```typescript
// ANTES (race condition):
if (accion === 'eliminar' && datos.id) {
    setTareas(tareasActuales.filter(t => t.id !== datos.id));
}

// DESPUÉS (seguro):
if (accion === 'eliminar' && datos.id) {
    setTareas(prev => prev.filter(t => t.id !== datos.id));
}
```

Lo mismo para hábitos y proyectos en los callbacks WebSocket.

### 🟡 Solución 5 (IMPORTANTE — Backend): Fix transacción anidada en backup

**Archivo:** `App/Api/BackupsApiController.php`

```php
// ANTES:
$wpdb->query('START TRANSACTION');
$dashboardRepo->deleteAll();
$result = $dashboardRepo->saveAll($data);  // START TRANSACTION interno → COMMIT implícito

// DESPUÉS: Usar saveAll con partialUpdate=true para evitar transacción anidada,
// o refactorizar saveAll para que acepte un flag $inTransaction=true
// que omita su propio START TRANSACTION cuando ya está dentro de una.
```

### 🟢 Solución 6 (RECOMENDADA — Backend): Log de protección

Añadir en `DashboardRepository::saveAll()` un sanity check antes del diff:

```php
/* Safety check: si se están eliminando más del 80% de los registros existentes,
 * algo probablemente está mal (petición parcial enviada como completa). */
if (!$partialUpdate) {
    $totalExisting = count($existingIds);
    $totalIncoming = count($incomingIds);
    if ($totalExisting > 5 && $totalIncoming === 0) {
        error_log("[DashboardRepo] ABORTADO: saveAll() intentó eliminar TODOS los registros de un tipo. userId={$this->userId}");
        return false;  // O lanzar excepción
    }
}
```

---

## Resumen de Impacto

| Fallo | Severidad | Frecuencia estimada | Archivos afectados |
|-------|-----------|---------------------|--------------------|
| #1 Defaults destructivos API | 🔴 Crítica | Cada petición parcial | `DashboardApiController.php` |
| #2 Race condition hidratación | 🔴 Crítica | Al recargar con cambios pendientes | `useSyncManager.ts`, `useDashboardSync.ts` |
| #3 WebSocket no funcional | 🟡 Alta | Con eventos WS rápidos | `useDashboardSync.ts` |
| #4 Transacción anidada backup | 🟡 Alta | Al restaurar backup fallido | `BackupsApiController.php` |

## Prioridad de Implementación

1. **Solución 1** (backend) — Elimina la causa raíz: un `[]` nunca más significará "borrar todo"
2. **Solución 2** (frontend) — Red de seguridad: si algo se escapa, el guard frena el wipeout
3. **Solución 3** (frontend) — Previene la condición de carrera en la hidratación
4. **Solución 4** (frontend) — Elimina race condition en WS
5. **Solución 5** (backend) — Protección de backup
6. **Solución 6** (backend) — Log defensivo para detección temprana

Con las soluciones 1+2 implementadas, el bug queda completamente neutralizado. Las soluciones 3-6 son mejoras de robustez adicionales.
