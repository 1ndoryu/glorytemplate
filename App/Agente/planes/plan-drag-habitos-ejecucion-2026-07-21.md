# Plan: Drag & Drop de Hábitos en Panel de Ejecución — 2026-07-21

## Problema

Los hábitos **no se pueden mover** en el panel de ejecución (`PanelEjecucion` → `ListaTareas`). Hay una restricción explícita en `ListaTareas.tsx`:

```tsx
dragListener={!esTareaHabito(tareaPadre)}  // línea ~228
```

Esto bloquea el drag para cualquier tarea virtual de hábito (ID negativo). El comentario original dice: _"Hábitos no son arrastrables: su orden lo define la urgencia, no el usuario."_

## Requisitos del usuario

| Modo de orden                   | Comportamiento de drag                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| **Manual**                      | Drag libre — tanto tareas como hábitos se pueden mover a cualquier posición          |
| **Prioridad**                   | Drag por grupo — solo se pueden mover entre items con la misma prioridad/importancia |
| **Inteligente / Fecha / Otros** | Sin drag                                                                             |

**Alcance:** Los hábitos pueden moverse libremente con tareas reales (no solo entre hábitos).

## Arquitectura actual

### Cómo aparecen los hábitos en el panel de ejecución

```
PanelEjecucion
  └── ListaTareas (tareas = ordenTareas.tareasOrdenadas)
        ├── Tarea real (id > 0) — draggable
        ├── TareaHabito (id = -habitoId - 10000) — NO draggable ← PROBLEMA
        │     └── SubHabito virtual (id = -(habitoId*1000 + subId) - 100000)
        │     └── Tarea real asociada al hábito (parentId = id virtual)
        └── Tarea real (id > 0) — draggable
```

### Flujo de datos actual

```
habitosStore.habitos
  → useHabitosComoTareas() → genera TareaHabito[] virtuales
  → se combinan con tareas reales en tareasConHabitos
  → useOrdenarTareas(tareasConHabitos) → ordena según modo
  → PanelEjecucion recibe tareasOrdenadas
  → ListaTareas renderiza con Reorder.Group (solo si esOrdenManual)
  → handleReorder (useTareaOrdenamiento) → filtra IDs negativos → reordenarTareas()
```

### Problema clave: `handleReorder` filtra hábitos

En `useTareaOrdenamiento.ts` línea ~46:

```typescript
const principalesSoloReales = nuevoOrdenPrincipales.filter(t => t.id > 0);
```

Esto **elimina todos los hábitos virtuales** del array antes de procesar. Aunque quitemos `dragListener={false}`, el reorder result se descartaría.

## Solución propuesta

### Fase 1: Quitar restricción de drag en ListaTareas

**Archivo: `App/React/components/dashboard/ListaTareas.tsx`**

Eliminar `dragListener={!esTareaHabito(tareaPadre)}` del `<Reorder.Item>`.

Los hábitos ahora serán arrastrables igual que las tareas.

> **Nota sobre indentación (gesto horizontal):** El gesto de indentación (`offsetX > UMBRAL_INDENT`) convierte una tarea en subtarea. Para hábitos virtuales esto no tiene sentido (no se pueden indentar hábitos). Se debe añadir una validación: si el item siendo arrastrado es un TareaHabito, ignorar el gesto de indentación.

---

### Fase 2: Nuevo callback `onReordenarHabitosEjecucion` en handleReorder

**Archivo: `App/React/hooks/dashboard/useTareaOrdenamiento.ts`**

El `handleReorder` actual:

1. Filtra IDs negativos (`principalesSoloReales`)
2. Reconstruye jerarquía con `obtenerSubtareas`
3. Llama a `onReordenarTareas` con la lista final

**Nuevo comportamiento:**

1. Separar items en: `tareasReales` (id > 0) y `habitosVirtuales` (esTareaHabito)
2. Para tareas reales: mantener flujo actual (reconstruir jerarquía, llamar `onReordenarTareas`)
3. Para hábitos virtuales: extraer el `habitoId` real y asignar `orden` según su posición en el array mixto
4. Llamar a un nuevo callback `onReordenarHabitos` con el mapa `{habitoId → orden}`

```typescript
interface UseTareaOrdenamientoProps {
    // ... existentes ...
    onReordenarHabitos?: (ordenes: Map<number, number>) => void; // NUEVO
}
```

**Implementación del split en `handleReorder`:**

```typescript
const handleReorder = useCallback((nuevoOrdenPrincipales: Tarea[]) => {
    if (!onReordenarTareas || !onEditarTarea) return;

    // [218A-2] Separar hábitos virtuales y asignarles orden global
    const ordenesHabitos = new Map<number, number>();
    for (let i = 0; i < nuevoOrdenPrincipales.length; i++) {
        const item = nuevoOrdenPrincipales[i];
        if (esTareaHabito(item)) {
            ordenesHabitos.set(item.habitoId, i);
        }
    }
    if (ordenesHabitos.size > 0 && onReordenarHabitos) {
        onReordenarHabitos(ordenesHabitos);
    }

    // Flujo original para tareas reales (sin cambios)
    const principalesSoloReales = nuevoOrdenPrincipales.filter(t => t.id > 0);
    // ... resto igual ...
});
```

> **Nota:** Los hábitos virtuales se filtran del flujo de tareas reales (como antes), pero ANTES de filtrar se extrae su posición para actualizar el campo `orden` del hábito.

---

### Fase 3: Persistir orden de hábitos desde el store

**Archivo: `App/React/stores/habitosStore.ts`**

Nueva action `actualizarOrdenHabitos`:

```typescript
actualizarOrdenHabitos: (ordenes: Map<number, number>) => void;
```

Implementación: para cada entrada `{habitoId → orden}`, actualizar `habito.orden` en el store. Similar a como `actualizarOrdenTareasHabito` actualiza `tareasIds`.

---

### Fase 4: Conectar callback en generadoresPropsPanel

**Archivo: `App/React/hooks/dashboard/generadoresPropsPanel.ts`**

En `generarPropsPanelEjecucion`, pasar el nuevo callback:

```typescript
onReordenarHabitos: (ordenes: Map<number, number>) => {
    useHabitosStore.getState().actualizarOrdenHabitos(ordenes);
},
```

Y pasar `onReordenarHabitos` a `ListaTareas` a través de `PanelEjecucion`.

---

### Fase 5: Props chain PanelEjecucion → ListaTareas

**Archivo: `App/React/components/paneles/PanelEjecucion.tsx`**

Añadir prop:

```typescript
onReordenarHabitos?: (ordenes: Map<number, number>) => void;
```

Pasar a `ListaTareas`.

**Archivo: `App/React/components/dashboard/ListaTareas.tsx`**

Añadir prop:

```typescript
onReordenarHabitos?: (ordenes: Map<number, number>) => void;
```

Pasar a `useTareaOrdenamiento`.

---

### Fase 6: Modo prioridad — drag por grupo de prioridad

**Archivo: `App/React/hooks/useOrdenarTareas.ts`**

En modo `prioridad`, `compararPorPrioridad` ya usa `orden` como desempate:

```typescript
if (a.orden !== undefined && b.orden !== undefined && a.orden !== b.orden) {
    return a.orden - b.orden;
}
```

Los TareaHabito tienen `prioridad` asignada (mapeada desde `importancia` del hábito). Así que el modo prioridad **ya funciona** para mezclar tareas y hábitos por prioridad con desempate por `orden`.

**Lo que NO se puede hacer:** impedir que el usuario mueva un hábito "Alta" a la posición de una tarea "Media". Fr motion no soporta restricciones de drop por grupo. El enfoque correcto es:

- Permitir drag libre visualmente
- Al soltar, el sort automático reagrupa por prioridad y usa `orden` como desempate
- El usuario ve que después de soltar, el item "salta" a la posición correcta dentro de su grupo

**Alternativa más simple:** No restringir el drag en absoluto. En modo prioridad, el sort automático ya reagrupa. Si el usuario mueve un hábito "Alta" a donde está una tarea "Media", el sort lo devuelve a su grupo. El campo `orden` se actualiza para el desempate dentro del grupo.

**Decisión:** No implementar restricción visual de drag por grupo. El sort automático de `useOrdenarTareas` ya lo maneja. Solo asignar `orden` a los hábitos según su posición final.

---

### Fase 7: `esOrdenManual` unificado para PanelEjecucion

**Archivo: `App/React/hooks/dashboard/generadoresPropsPanel.ts`**

Actualmente `esOrdenManual: ordenTareas.esOrdenManual` solo considera el modo de tareas.

El panel de ejecución muestra tareas Y hábitos. El modo de orden de tareas (`manual` | `prioridad` → drag habilitado) ya es el que controla el panel. No necesitamos considerar el modo de hábitos aquí porque el panel de ejecución tiene su propio selector de orden.

**No se requiere cambio.** `esOrdenManual` del `useOrdenarTareas` ya es `true` para `manual` y `prioridad`, que son los modos donde el drag debe funcionar.

---

## Archivos a modificar

| #   | Archivo                                              | Cambio                                                                        |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | `App/React/components/dashboard/ListaTareas.tsx`     | Quitar `dragListener={!esTareaHabito(...)}` + prop `onReordenarHabitos`       |
| 2   | `App/React/hooks/dashboard/useTareaOrdenamiento.ts`  | Split tareas/hábitos en `handleReorder` + nuevo callback `onReordenarHabitos` |
| 3   | `App/React/stores/habitosStore.ts`                   | Nueva action `actualizarOrdenHabitos(ordenes: Map<number, number>)`           |
| 4   | `App/React/hooks/dashboard/generadoresPropsPanel.ts` | Conectar `onReordenarHabitos`                                                 |
| 5   | `App/React/components/paneles/PanelEjecucion.tsx`    | Prop chain `onReordenarHabitos`                                               |
| 6   | `App/React/styles/dashboard/componentes/tabla.css`   | Cursor grab/hover para hábitos en ListaTareas (si es necesario)               |

## Estado

- [ ] Fase 1: Quitar `dragListener` block en ListaTareas
- [ ] Fase 2: Split tareas/hábitos en `handleReorder` de useTareaOrdenamiento
- [ ] Fase 3: Action `actualizarOrdenHabitos` en habitosStore
- [ ] Fase 4: Conectar callback en generadoresPropsPanel
- [ ] Fase 5: Props chain PanelEjecucion → ListaTareas
- [ ] Fase 6: Verificar modo prioridad (ya funciona con desempate por `orden`)
- [ ] Fase 7: CSS para drag states de hábitos en ListaTareas

## Notas de diseño

1. **Los hábitos virtuales se filtran del flujo de tareas** — no se persisten como tareas reales. Solo se extrae su posición para actualizar `habito.orden` en el store de hábitos.
2. **`obtenerSubtareas` no debe procesar IDs negativos** — el filtro `id > 0` se mantiene para la reconstrucción de jerarquía de tareas reales.
3. **Gesto horizontal (indent) se ignora para hábitos** — no tiene sentido indentar un hábito como subtarea de otro.
4. **Modo prioridad funciona sin cambios** — el sort automático reagrupa por prioridad y desempata por `orden`. Tanto tareas como hábitos tienen `prioridad` (hábitos la mapean desde `importancia`).
5. **El 218A-1 ya implementado (drag en TablaHabitos)** se mantiene — el panel de hábitos aislado también permite drag, pero ahora el panel de ejecución también lo hará.
