# Plan: Refactor Subhábitos — 2026-07-20

## Problema raíz

Los subhábitos fueron diseñados como "tareas virtuales" que se generan dinámicamente desde `useHabitosComoTareas`. No existen en el store de tareas (`tareasStore`), solo en `habitosStore`. Esto crea una desconexión arquitectural:

1. **Contextual menu roto**: En `TareaItem.tsx`, `esTareaHabito()` devuelve `false` para subhábitos (no tienen `esHabito: true`). Caen en la rama de "tareas normales" → las acciones (`onEditar`, `onEliminar`) buscan en `tareasStore` por ID virtual negativo → no encuentran nada → falla silenciosa.

2. **Actividad no registra**: `toggleSubHabito` en `habitosStore.ts` actualiza `historialCompletados`, `racha`, `diasInactividad` pero **nunca llama** a `registrarTareaCompletada()` del `actividadService`. El toggle de hábitos regulares sí lo hace vía `toggleHabito` → `habitosActions.toggleHabito` → flujo completo.

3. **Edición de nombre**: Actualmente soporta doble-clic para editar (implementado en `ListaSubHabitos.tsx`). El usuario quiere single-clic.

4. **Config sin perder subhábito**: No existe botón para abrir la configuración avanzada de un subhábito sin que "deje de ser subhábito".

## Análisis de impacto

- **Sin usuarios reales** → podemos romper subhábitos existentes si es necesario
- Subhábitos se persisten en `habitosStore` (localStorage `glory-habitos-store`)
- Dedup ya existe en `useHabitosComoTareas` (por ID y por nombre) y en `onRehydrateStorage`
- El bug de duplicación está resuelto

## Solución propuesta

### Fase 1: Crear tipo `TareaSubHabito` (paralelo a `TareaHabito`)

**Archivo: `types/dashboard.ts`**
```typescript
export interface TareaSubHabito extends Tarea {
    esSubHabito: true;
    habitoPadreId: number;
    subHabitoId: number;
}
```

Añadir type guard: `esTareaSubHabito(tarea): tarea is TareaSubHabito`

### Fase 2: Marcar subhábitos virtuales en `useHabitosComoTareas`

En `tareasConSubtareas`, cuando se crea `tareaSubhabito`, añadir:
```typescript
esSubHabito: true,
habitoPadreId: habito.id,
subHabitoId: subhabito.id,
```

### Fase 3: Routing en `TareaItem` y `useTareaMenu`

**`TareaItem.tsx`**: Detectar `esTareaSubHabito()` y usar un menú contextual adaptado:
- Acciones válidas: toggle, posponer (hereda del padre), cambiar prioridad (hereda del padre), eliminar, iniciar tracking
- NO válidas: agregar subtarea, mover a proyecto, compartir

**`useTareaMenu.tsx`**: Añadir rama para subhábitos:
- `posponer` → llamar a `onPosponerHabito(habitoPadreId)` o implementar posponer individual
- `prioridad` → llamar a `onActualizarHabito(habitoPadreId, {importancia})` (hereda)
- `eliminar` → llamar a `onEliminarSubHabito(habitoPadreId, subHabitoId)`
- `toggle` → llamar a `onToggleSubHabito(habitoPadreId, subHabitoId)`

### Fase 4: Registrar actividad al completar subhábito

En `habitosStore.ts`, dentro de `toggleSubHabito`, después del `set()`, llamar a:
```typescript
if (accion === 'completado') {
    registrarTareaCompletada(subHabitoId, undefined, subHabito.nombre);
}
```

Import: `import {registrarTareaCompletada} from '../services/actividadService'`

### Fase 5: Edición single-clic de nombre

En `ListaSubHabitos.tsx` → `FilaSubHabito`:
- Cambiar `onDoubleClick` a `onClick` en el `<span>` del nombre
- Solo activar si no está en modo edición

### Fase 6: Botón de configuración

En `FilaSubHabito`, añadir botón ⚙️ que abra un panel/modal de configuración del subhábito:
- Permitir cambiar frecuencia propia, importancia propia
- Mantener como subhábito (no independizar)
- Requiere nuevo callback `onConfigurarSubHabito`

## Archivos a modificar

1. `App/React/types/dashboard.ts` — nuevo tipo `TareaSubHabito`
2. `App/React/hooks/useHabitosComoTareas.ts` — marcar subhábitos con tipo
3. `App/React/components/dashboard/TareaItem.tsx` — routing para subhábitos
4. `App/React/components/dashboard/tarea-item/useTareaMenu.tsx` — menú subhábitos
5. `App/React/stores/habitosStore.ts` — registrar actividad en toggleSubHabito
6. `App/React/components/dashboard/habitos/ListaSubHabitos.tsx` — single-clic + config

## Estado

- [ ] Fase 1: Tipo TareaSubHabito
- [ ] Fase 2: Marcar en useHabitosComoTareas
- [ ] Fase 3: Routing menú contextual
- [ ] Fase 4: Registrar actividad
- [ ] Fase 5: Single-clic nombre
- [ ] Fase 6: Botón configuración

## Notas

- Prioridad: Fases 1-4 (core funcional), Fases 5-6 (UX)
- El posponer individual de subhábitos vs heredar del padre es decisión de diseño pendiente
- Tracking de subhábitos: el tracking actual usa `entidadId` = subHabitoId para tareas, pero para subhábitos debería ser `toggleSubHabito(padreId, subHabitoId)`
