# Refactor: Hábitos en Panel de Ejecución y Drag & Drop

## Contexto
Durante el trabajo en el dashboard de Glory se detectaron varios problemas relacionados con la interacción de hábitos y tareas en el panel de **Ejecución**, especialmente a la hora de arrastrar y reordenar hábitos.

## Problemas resueltos (commits previos)

### 1. Al soltar un hábito arrastrado se abría su configuración ✅
- **Causa:** Framer Motion dispara un evento `click` nativo justo después de `onDragEnd`.
- **Fix:** `seArrastroRef` + `onClickCapture` para suprimir el click post-drag.

### 2. No aparecía la opción "Ignorar urgencia en Prioridad" ✅
- **Fix:** Toggle añadido en `SeccionesConfigPaneles.tsx`.

### 3. Mover un hábito en Ejecución movía también el panel de Hábitos ✅
- **Causa:** El drag en Ejecución actualizaba `orden` (campo compartido con panel de Hábitos).
- **Fix:** Campo `ordenEjecucion` separado + `actualizarOrdenEjecucionHabitos`.

### 4. Drag intermitente (snapping back) ✅
- **Causa:** Framer Motion usa `Object.is` (`===`) para rastrear items. `setTareas(prev => prev.map(...))` recrea TODOS los objetos → referencias inestables → FM pierde tracking.
- **Fix:** `Reorder.Group` rastrea IDs primitivos (`number`) en vez de objetos `Tarea`. Los números son inmutables: `1 === 1` siempre.
- **Archivos modificados:**
  - `useTareaOrdenamiento.ts` — `handleReorder` acepta `number[]`, usa `Map` para lookup
  - `useListaTareas.ts` — `tareasPrincipalesPendientes` movido antes de `useTareaOrdenamiento`
  - `ListaTareas.tsx` — `Reorder.Group values={ids.map(t => t.id)}`
  - `TareaReorderItem.tsx` — `value={tareaPadre.id}`

---

## 🔴 Bugs restantes (NO resueltos)

### Bug 1: Ordenamiento manual NO funciona para hábitos

**Síntoma:** En modo manual, arrastrar un hábito lo "snap back" a su posición original. Las tareas reales SÍ se reordenan correctamente.

**Causa raíz:** En modo manual, `useOrdenarTareas` devuelve `tareas` sin ordenar:
```typescript
// useOrdenarTareas.ts
const tareasOrdenadas = useMemo(() => {
    if (modoActual === 'manual') return tareas; // ← SIN ORDENAR
    // ... sort para otros modos
}, [tareas, modoActual, ignorarUrgencia]);
```

El orden visual depende del orden del array `tareasConHabitos`. Los hábitos se appendean en el orden del store:
```typescript
// useDashboardCompleto.ts
return [...tareasNoHabito, ...habitosComoTareas.tareasConSubtareas];
```

Pero `tareasConSubtareas` itera `tareasHabito` en el orden del store de hábitos, NO por `ordenEjecucion`:
```typescript
// useHabitosComoTareas.ts
const tareasHabito = useMemo(() => {
    return habitos.filter(...).map(h => ({
        orden: h.ordenEjecucion ?? h.orden,
        // ... ← el campo 'orden' se asigna pero NO se usa para ordenar el array
    }));
}, [habitos, mostrarHabitos, umbrales]); // ← NO HAY SORT
```

**Flujo del bug:**
1. Usuario arrastra hábito de posición 3 → posición 1
2. `handleReorder` → `actualizarOrdenEjecucionHabitos({habitoId: 0})` → store actualizado ✅
3. `handleReorder` → `reordenarTareas([...soloReales])` → store tareas actualizado ✅
4. Re-render: `tareasHabito` recalcula con `ordenEjecucion` actualizado ✅
5. PERO `tareasHabito` NO está ordenado por `orden` → array en orden del store ❌
6. `tareasConSubtareas` itera en orden del store → hábitos en posición ORIGINAL ❌
7. `tareasOrdenadas` devuelve sin ordenar (modo manual) → snap back ❌

**Por qué las tareas reales SÍ funcionan:**
`reordenarTareas` en `useTareas.ts` asigna `orden: idx` secuencial al array completo del store:
```typescript
return tareasFinales.map((t, idx) => ({...t, orden: idx}));
```
Esto REORDENA el array del store. Cuando `tareas` cambia, `tareasConHabitos` recalcula con las tareas reales en su nuevo orden.

**Fix propuesto:**
Ordenar `tareasHabito` por el campo `orden` en `useHabitosComoTareas`:
```typescript
const tareasHabito = useMemo(() => {
    return habitos
        .filter(...)
        .map(h => ({...}))
        .sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity));
}, [habitos, mostrarHabitos, umbrales]);
```

---

### Bug 2: Hábitos con sub-hábitos NO se pueden arrastrar

**Síntoma:** Cuando un hábito tiene sub-hábitos expandidos, el drag no se inicia (o funciona mal). Hábitos sin sub-hábitos a veces SÍ funcionan.

**Causa raíz:** El `Reorder.Item` envuelve el hábito padre + sus sub-items visibles:
```tsx
// TareaReorderItem.tsx
<Reorder.Item value={tareaPadre.id} onPointerDown={...}>
    {renderTareaItem(tareaPadre, false)}           // ← Hábito padre
    {subtareasVisibles.map(subtarea => (           // ← Sub-hábitos
        <div className="subtareaContenedor">
            {renderTareaItem(subtarea, true)}
        </div>
    ))}
</Reorder.Item>
```

Los sub-items dentro del `Reorder.Item` tienen elementos interactivos que capturan eventos:

1. **`TareaConColapsador` tiene `onClickCapture`** que suprime clicks post-drag:
   ```tsx
   <div onClickCapture={(e) => {
       if (suprimirClickRef?.current) { e.stopPropagation(); e.preventDefault(); }
   }}>
   ```

2. **El botón de colapso tiene `stopPropagation` en `onPointerDown`:**
   ```tsx
   <Boton onPointerDown={e => e.stopPropagation()} ...>
   ```
   Esto previene que el evento llegue al `Reorder.Item` cuando se hace click en el botón.

3. **Framer Motion tiene dificultades** con `Reorder.Item` que contiene árboles DOM complejos con múltiples elementos interactivos anidados. La detección de gesture (distinguir click vs drag vs scroll) se degrada.

**Por qué hábitos SIN sub-hábitos a veces funcionan:**
Cuando un hábito no tiene sub-hábitos, el `Reorder.Item` solo contiene una fila (el `TareaItem`). No hay elementos interactivos anidados que interfieran. El `onPointerDown` en el `Reorder.Item` funciona directamente.

**Fix propuesto: Drag Handle + `dragControls`**
Implementar un handle de arrastre dedicado usando `useDragControls` de Framer Motion:
```tsx
<Reorder.Item value={tareaPadre.id} dragListener={false} dragControls={dragControls}>
    <div className="dragHandle" onPointerDown={(e) => dragControls.start(e)}>
        ⠿ {/* Icono de agarre */}
    </div>
    {renderTareaItem(tareaPadre, false)}
    {subtareasVisibles.map(...)}
</Reorder.Item>
```

Con `dragListener={false}`, el drag SOLO se inicia desde el handle. Los clicks en sub-items, checkboxes y botones funcionan normalmente sin interferir con el drag.

---

### Bug 3: Ordenamiento por prioridad no funciona con sub-hábitos

**Síntoma:** En modo prioridad, arrastrar hábitos SIN sub-hábitos funciona. Con sub-hábitos NO funciona.

**Causa raíz:** Es el **Bug 2** que bloquea el drag. En modo prioridad, el sort usa `orden` como desempate:
```typescript
const compararPorPrioridad = (a, b) => {
    if (pB !== pA) return pB - pA;        // Prioridad
    if (uB !== uA) return uB - uA;        // Urgencia
    if (a.orden !== b.orden) return a.orden - b.orden;  // ← ORDEN MANUAL
    return compararPorFecha(a, b);
};
```

Cuando el drag SÍ funciona (hábitos sin sub-hábitos), `actualizarOrdenEjecucionHabitos` actualiza `ordenEjecucion` → `orden` del virtual task → el sort por prioridad respeta el orden manual como desempate.

Pero cuando el drag NO funciona (hábitos con sub-hábitos), `ordenEjecucion` nunca se actualiza → no hay efecto visual.

**Fix:** Se resuelve automáticamente al arreglar el Bug 2 (drag handle).

---

## Dependencias entre bugs

```
Bug 2 (sub-hábitos no arrastrables)
    ↓ bloquea
Bug 3 (prioridad con sub-hábitos no funciona)
    → Se resuelve al fijar Bug 2

Bug 1 (manual no funciona para hábitos)
    → Independiente de Bug 2 y 3
    → Fix: sort por 'orden' en useHabitosComoTareas
```

---

## Plan de implementación

### Paso 1: Fix Bug 1 — Ordenar hábitos por `orden` en `useHabitosComoTareas`
- **Archivo:** `App/React/hooks/useHabitosComoTareas.ts`
- **Cambio:** Añadir `.sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity))` al final de `tareasHabito`
- **Impacto:** Solo afecta el orden visual de hábitos. No afecta tareas reales.

### Paso 2: Fix Bug 2 — Drag handle con `useDragControls`
- **Archivo:** `App/React/components/dashboard/lista-tareas/TareaReorderItem.tsx`
- **Cambios:**
  1. Importar `useDragControls` de `framer-motion`
  2. Crear `dragControls = useDragControls()` dentro del componente
  3. Añadir `dragListener={false}` y `dragControls={dragControls}` al `Reorder.Item`
  4. Renderizar un handle de arrastre (icono GripVertical de lucide-react) con `onPointerDown={(e) => dragControls.start(e)}`
  5. Añadir CSS para el handle (cursor grab, opacity hover, etc.)
- **Impacto:** Resuelve Bug 2 y Bug 3 simultáneamente.

### Paso 3: Verificar TypeScript y code review
- `npx tsc --noEmit`
- Code review de los cambios

### Paso 4: Verificar que no se rompió el drag de tareas reales
- El drag handle se aplica a TODOS los `TareaReorderItem` (tareas y hábitos)
- Verificar que las tareas reales siguen siendo arrastrables desde el handle

---

## Archivos clave
- `App/React/components/dashboard/ListaTareas.tsx`
- `App/React/components/dashboard/lista-tareas/TareaConColapsador.tsx`
- `App/React/components/dashboard/lista-tareas/TareaReorderItem.tsx`
- `App/React/hooks/dashboard/useTareaOrdenamiento.ts`
- `App/React/hooks/dashboard/useListaTareas.ts`
- `App/React/hooks/dashboard/useListaTareasLogica.ts`
- `App/React/hooks/useHabitosComoTareas.ts`
- `App/React/hooks/useOrdenarTareas.ts`
- `App/React/hooks/useDashboardCompleto.ts`
- `App/React/stores/habitosStore.ts`
- `App/React/components/paneles/PanelEjecucion.tsx`

## Siguientes pasos
- [ ] Implementar fix Bug 1 (sort por `orden` en `useHabitosComoTareas`)
- [ ] Implementar fix Bug 2 (drag handle con `useDragControls`)
- [ ] Verificar TypeScript
- [ ] Code review
- [ ] Pruebas manuales: drag de hábitos con y sin sub-hábitos en modo manual y prioridad
- [ ] Pruebas manuales: drag de tareas reales sigue funcionando
