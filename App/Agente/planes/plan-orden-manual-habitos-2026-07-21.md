# Plan: Orden Manual + Drag & Drop para Hábitos — 2026-07-21

## Problema

Los hábitos no se pueden mover/reordenar en el panel de ejecución. A diferencia de las tareas (que soportan 4 modos de orden incluyendo `manual` y `prioridad` con drag), los hábitos solo tienen modos automáticos (`importancia`, `inactividad`, `racha`, `nombre`, `urgenciaPonderada`) y ningún soporte de drag & drop.

## Objetivo

Agregar configuración de ordenamiento para hábitos con 2 comportamientos:

| Modo | Comportamiento | Drag & Drop |
|------|---------------|-------------|
| **Manual** | Orden libre, el usuario decide | ✅ Drag libre entre todos los hábitos |
| **Importancia** (actual) | Agrupados por prioridad | ✅ Drag solo dentro del mismo grupo de prioridad |
| **Otros modos** (inactividad, racha, nombre, inteligente) | Automático | ❌ Sin drag |

Esto replica el patrón ya usado en tareas: `esOrdenManual: modoActual === 'manual' || modoActual === 'importancia'`.

## Análisis del patrón existente (tareas)

Las tareas ya implementan esto correctamente:

1. **`useOrdenarTareas.ts`**: Define `ModoOrdenTareas = 'manual' | 'inteligente' | 'fecha' | 'prioridad'` y expone `esOrdenManual: modoActual === 'manual' || modoActual === 'prioridad'`
2. **`Tarea` interface**: Tiene campo `orden?: number` para persistir posición manual
3. **`PanelEjecucion.tsx`**: Pasa `habilitarDrag={esOrdenManual}` y `onReordenarTareas={esOrdenManual ? onReordenarTareas : undefined}` a `ListaTareas`
4. **`ListaTareas.tsx`**: Usa `Reorder.Group` de framer-motion cuando `habilitarDrag=true`, render normal cuando `false`
5. **`useOrdenarTareas.ts` → `compararPorPrioridad`**: Dentro del mismo nivel de prioridad, desempata por campo `orden` (drag manual)

## Solución propuesta

### Fase 1: Tipo — Añadir campo `orden` a `Habito`

**Archivo: `App/React/types/dashboard.ts`**

Añadir a la interface `Habito`:
```typescript
/* Orden manual para drag & drop (menor = primero). Igual patrón que Tarea.orden */
orden?: number;
```

No requiere migración — `undefined` = sin orden asignado (usa posición del array como fallback).

---

### Fase 2: Store — Persistir `orden` en hábitos

**Archivo: `App/React/stores/habitosStore.ts`**

Añadir acción `reordenarHabitos`:
```typescript
reordenarHabitos: (habitosReordenados: Habito[]) => void;
```

Implementación: actualizar el campo `orden` de cada hábito según su posición en el array recibido, y actualizar el array completo en el store. Similar a como `tareasStore` hace `reordenarTareas`.

---

### Fase 3: Hook de ordenamiento — Añadir modo `manual`

**Archivo: `App/React/hooks/useOrdenarHabitos.ts`**

1. Añadir `'manual'` al tipo `ModoOrdenHabitos`:
   ```typescript
   export type ModoOrdenHabitos = 'manual' | 'importancia' | 'inactividad' | 'racha' | 'nombre' | 'urgenciaPonderada';
   ```

2. Añadir entrada en `MODOS_ORDEN`:
   ```typescript
   {id: 'manual', etiqueta: 'Manual', descripcion: 'Drag & Drop'},
   ```

3. Añadir función de ordenamiento manual:
   ```typescript
   function ordenarManual(a: Habito, b: Habito): number {
       if (a.orden !== undefined && b.orden !== undefined) return a.orden - b.orden;
       if (a.orden !== undefined) return -1;
       if (b.orden !== undefined) return 1;
       return 0; // mantener orden del array
   }
   ```

4. Modificar `ordenarPorImportancia` para usar `orden` como desempate (igual que `compararPorPrioridad` en tareas):
   ```typescript
   function ordenarPorImportancia(a: Habito, b: Habito): number {
       const pesoA = PESO_IMPORTANCIA[a.importancia];
       const pesoB = PESO_IMPORTANCIA[b.importancia];
       if (pesoA !== pesoB) return pesoB - pesoA;
       /* Desempatar por orden manual si ambos tienen */
       if (a.orden !== undefined && b.orden !== undefined && a.orden !== b.orden) {
           return a.orden - b.orden;
       }
       return calcularInactividadEfectiva(b) - calcularInactividadEfectiva(a);
   }
   ```

5. Añadir case `'manual'` en el switch de `habitosOrdenados`:
   ```typescript
   case 'manual':
       return copia.sort(ordenarManual);
   ```

6. Exponer `esOrdenManual` en el return:
   ```typescript
   esOrdenManual: modoActual === 'manual' || modoActual === 'importancia',
   ```

---

### Fase 4: Dashboard hook — Añadir `reordenarHabitos`

**Archivo: `App/React/hooks/dashboard/useDashboardHabitos.ts`**

1. Importar `reordenarHabitos` del store:
   ```typescript
   const storeReordenarHabitos = useHabitosStore(state => state.reordenarHabitos);
   ```

2. Crear wrapper con mensaje + undo:
   ```typescript
   const reordenarHabitos = useCallback(
       (habitosReordenados: Habito[]) => {
           storeReordenarHabitos(habitosReordenados);
       },
       [storeReordenarHabitos]
   );
   ```

3. Exponer en el return del hook.

**Archivo: `App/React/hooks/useDashboard.ts`**

Exponer `reordenarHabitos` en el objeto de retorno.

---

### Fase 5: TablaHabitos — Añadir drag & drop con Reorder

**Archivo: `App/React/components/dashboard/TablaHabitos.tsx`**

Este es el cambio más grande. Seguir el patrón de `ListaTareas.tsx`:

1. Añadir props:
   ```typescript
   interface TablaHabitosProps {
       // ... props existentes ...
       habilitarDrag?: boolean;
       onReordenarHabitos?: (habitos: Habito[]) => void;
   }
   ```

2. Importar `Reorder` de `framer-motion`:
   ```typescript
   import {Reorder} from 'framer-motion';
   ```

3. En el render de `habitosVisibles`, condicionalmente usar `Reorder.Group` + `Reorder.Item`:

   ```tsx
   {habilitarDrag ? (
       <Reorder.Group axis="y" values={habitosVisibles} onReorder={onReordenarHabitos!} className="listaHabitosReorder">
           {habitosVisibles.map((habito, index) => (
               <Reorder.Item key={habito.id} value={habito}>
                   <FilaHabito ... />
               </Reorder.Item>
           ))}
       </Reorder.Group>
   ) : (
       habitosVisibles.map((habito, index) => (
           <FilaHabito key={habito.id} ... />
       ))
   )}
   ```

4. **Para modo `importancia` con drag por grupo**: Requiere agrupar hábitos por nivel de importancia y renderizar un `Reorder.Group` por cada grupo. Dentro de cada grupo el drag es libre, entre grupos no.

   ```tsx
   {/* Agrupar por importancia cuando el modo lo requiere */}
   {modoOrden === 'importancia' && habilitarDrag ? (
       gruposPorImportancia.map(grupo => (
           <div key={grupo.importancia} className="grupoImportancia">
               <div className="grupoImportancia__titulo">{grupo.importancia}</div>
               <Reorder.Group axis="y" values={grupo.habitos} onReorder={manejarReordenGrupo(grupo.importancia)}>
                   {grupo.habitos.map(habito => (
                       <Reorder.Item key={habito.id} value={habito}>
                           <FilaHabito ... />
                       </Reorder.Item>
                   ))}
               </Reorder.Group>
           </div>
       ))
   ) : habilitarDrag ? (
       <Reorder.Group ...>
           {/* Drag libre (modo manual) */}
       </Reorder.Group>
   ) : (
       {/* Sin drag (otros modos) */}
   )}
   ```

   > **Nota**: La agrupación por importancia para drag parcial es más compleja. Se puede simplificar en una primera versión haciendo que en modo `importancia` también sea drag libre pero el re-sort automático reagrupa. El usuario dijo "si tengo 3 hábitos con prioridad alta debería poder moverlos entre ellos" — esto se logra con el desempate por `orden` en `ordenarPorImportancia` (Fase 3), que ya permite reordenar dentro del mismo grupo.

   **Simplificación recomendada**: En modo `importancia`, no usar `Reorder.Group` sino simplemente permitir que el desempate por `orden` funcione. Para mover, usar un botón ↑↓ o drag que actualice el campo `orden`. Esto evita la complejidad de múltiples `Reorder.Group` anidados.

---

### Fase 6: Props chain — Conectar todo

**Archivo: `App/React/hooks/dashboard/generadoresPropsPanel.ts`**

En `generarPropsPanelFocoPrioritario`:
```typescript
esOrdenManual: ordenHabitos.esOrdenManual,
onReordenarHabitos: dashboard.reordenarHabitos,
```

**Archivo: `App/React/components/paneles/PanelFocoPrioritario.tsx`**

Añadir props:
```typescript
interface PanelFocoPrioritarioProps {
    // ... existentes ...
    esOrdenManual?: boolean;
    onReordenarHabitos?: (habitos: Habito[]) => void;
}
```

Pasar a `TablaHabitos`:
```tsx
<TablaHabitos
    habitos={habitos}
    habilitarDrag={esOrdenManual}
    onReordenarHabitos={esOrdenManual ? onReordenarHabitos : undefined}
    ...
/>
```

**Archivo: `App/React/hooks/dashboard/useTablaHabitos.ts`**

Exponer `modoOrden` si es necesario para la lógica de agrupación por importancia.

---

### Fase 7: CSS — Estilos del drag

**Archivo: CSS correspondiente a `TablaHabitos` / `listaHabitosReorder`**

Añadir estilos para:
- `.listaHabitosReorder` — contenedor del Reorder.Group
- `.filaHabito--arrastrando` — estado visual al arrastrar (opacidad, sombra)
- Transiciones suaves al reordenar
- Cursor `grab` / `grabbing` cuando el drag está habilitado

---

## Archivos a modificar

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `App/React/types/dashboard.ts` | Añadir `orden?: number` a `Habito` |
| 2 | `App/React/stores/habitosStore.ts` | Añadir `reordenarHabitos` action |
| 3 | `App/React/hooks/useOrdenarHabitos.ts` | Añadir modo `manual`, `esOrdenManual`, desempate por `orden` |
| 4 | `App/React/hooks/dashboard/useDashboardHabitos.ts` | Wrapper `reordenarHabitos` |
| 5 | `App/React/hooks/useDashboard.ts` | Exponer `reordenarHabitos` |
| 6 | `App/React/components/dashboard/TablaHabitos.tsx` | `Reorder.Group`/`Reorder.Item`, props `habilitarDrag`/`onReordenarHabitos` |
| 7 | `App/React/hooks/dashboard/useTablaHabitos.ts` | Exponer `modoOrden` si necesario |
| 8 | `App/React/components/paneles/PanelFocoPrioritario.tsx` | Props `esOrdenManual`, `onReordenarHabitos` |
| 9 | `App/React/hooks/dashboard/generadoresPropsPanel.ts` | Pasar `esOrdenManual`, `onReordenarHabitos` |
| 10 | CSS de TablaHabitos | Estilos drag |

## Estado

- [ ] Fase 1: Campo `orden` en tipo `Habito`
- [ ] Fase 2: Action `reordenarHabitos` en store
- [ ] Fase 3: Modo `manual` + `esOrdenManual` + desempate en `useOrdenarHabitos`
- [ ] Fase 4: Wrapper `reordenarHabitos` en dashboard hooks
- [ ] Fase 5: Drag & drop en `TablaHabitos` con `Reorder`
- [ ] Fase 6: Props chain completa (PanelFocoPrioritario → TablaHabitos)
- [ ] Fase 7: CSS para drag states

## Notas de diseño

1. **El patrón ya existe en tareas** — replicar exactamente el mismo flujo minimiza riesgo
2. **Desempate por `orden` en `importancia`** es la clave para "mover hábitos con misma prioridad entre ellos" sin necesidad de múltiples `Reorder.Group`
3. **Persistencia**: `orden` se guarda en localStorage vía Zustand (igual que todo el habito). No requiere cambios en backend/API
4. **Subhábitos**: No se incluyen en este plan. El drag es solo para hábitos principales
5. **Simplificación Fase 5**: En modo `importancia`, el desempate por `orden` ya permite reordenar dentro del grupo. No es necesario renderizar `Reorder.Group` por separado por cada nivel de importancia — un solo `Reorder.Group` con todos los hábitos + sort por importancia con desempate `orden` logra el efecto
