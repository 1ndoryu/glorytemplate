# GloryTemplate Roadmap
pp
> **Descripcion:** Dashboard personal con tareas, habitos, proyectos, notas, actividad y mas. Tema WordPress con React islands.
> **Stack:** WordPress + PHP (backend REST), React + TypeScript (frontend islands), Zustand (estado), CSS modular
> **URL produccion:** https://task.nakomi.studio
> **Servidor:** nakomi (Coolify) stack UUID: u00gc8ss4csc4cckkg4g00ks
> **Deploy:** Coolify (.agent/coolify-manager-rs) sitio: nakomi
> **Repositorio:** glorytemplate: rama glory-react-logic
> **Espejo:** https://github.com/1ndoryu/task (rama main = glory-react-logic). Push: `git push task`. Submodulos: Glory, .agent/code-sentinel, .agent/varsense, .agent/coolify-manager-rs, .agent/coolify-manager.

## Herramientas del agente

- Code Sentinel: `.agent/code-sentinel`
- VarSense: `.agent/varsense`
- Coolify Manager: `.agent/coolify-manager-rs`## Tareas pendientes

### 🔴 BUG CRÍTICO: Drag & Drop intermitente (tareas y hábitos)

**Estado:** NO RESUELTO — necesita investigación profunda

**Descripción:**
El arrastre de tareas y hábitos en el panel de Ejecución falla de forma intermitente. A veces el drag se activa visualmente pero los elementos no cambian de posición. No está claro si el problema es solo con hábitos, solo con tareas, o con ambos. El usuario no puede determinar con precisión cuándo falla — simplemente "funciona mal".

**Historial de intentos:**

1. **Commit 218A-1:** Orden manual + drag & drop para hábitos (base)
2. **Commit 218A-2:** Drag de hábitos en panel de ejecución + suprimir click post-drag (`seArrastroRef` + `onClickCapture`). Funcional.
3. **Commit 218A-3:** Extrajo `TareaReorderItem` con `dragControls.start()` + `dragListener={false}` + handle `GripVertical`. **Este commit rompió el drag.**
4. **Intento de fix (sesión actual):** Se revirtió el mecanismo de `dragControls.start()` a `onPointerDown` nativo directo en `Reorder.Item`, se eliminó el handle `GripVertical`. **El problema persiste.**

**Hipótesis no verificadas:**
- El problema puede estar en cómo `handleReorder` procesa los hábitos virtuales (IDs negativos) antes de filtrarlos
- `Reorder.Item` con `value={tareaPadre}` puede tener problemas de identidad cuando los objetos se recrean en cada render (referencia inestable)
- La mezcla de tareas reales (IDs positivos) y virtuales (IDs negativos) en el mismo `Reorder.Group` puede causar que Framer Motion no detecte correctamente los cambios de orden
- `useMemo` en `tareasPrincipalesPendientes` puede generar nuevos arrays en cada render, causando que `Reorder.Group` pierda el tracking de items
- El `onDrag` handler que actualiza `seArrastroRef` puede estar interfiriendo con la detección nativa de Framer Motion

**Archivos involucrados:**
- `App/React/components/dashboard/lista-tareas/TareaReorderItem.tsx` — wrapper de `Reorder.Item`
- `App/React/components/dashboard/ListaTareas.tsx` — renderiza `Reorder.Group`
- `App/React/hooks/dashboard/useTareaOrdenamiento.ts` — lógica de `handleReorder`, `handleDragStart`, `handleDragEnd`
- `App/React/hooks/dashboard/useListaTareas.ts` — orquesta hooks, calcula `tareasPrincipalesPendientes`
- `App/React/hooks/useHabitosComoTareas.ts` — genera tareas virtuales de hábitos (IDs negativos)
- `App/React/components/dashboard/TablaHabitos.tsx` — drag de hábitos en panel de Hábitos (NO afectado por este bug)
- `App/React/stores/habitosStore.ts` — `reordenarHabitos`, `actualizarOrdenHabitos`, `actualizarOrdenEjecucionHabitos`
