# Plan: Multi-Panel en Modo Sidebar

> **Fecha:** 2026-05-31
> **Estado:** ✅ Implementado (fase resize vertical reestructurado)
> **Tarea asociada:** 315A (implementación inicial) + rework post-aprobación
> **Problema:** El modo sidebar solo mostraba UN panel a la vez. Se necesitaba
>   soporte para múltiples paneles (hasta 4) en disposición grid dentro del sidebar.

---

## 9. Historial de Implementación

### 315A — Implementación inicial (commit `315A: multi-panel sidebar + menú contextual`)

**Archivos creados:**
- `App/React/hooks/dashboard/useSidebarPanels.ts` — Hook de estado aislado
- `App/React/components/dashboard/DashboardSidebarGrid.tsx` — Grilla multi-panel
- `App/React/styles/dashboard/componentes/dashboardSidebarGrid.css` — Estilos

**Archivos modificados:**
- `App/React/islands/DashboardIsland.tsx` — Wiring: hook → grid → sidebar
- `App/React/components/dashboard/SidebarMenu.tsx` — Menú contextual con `MenuContextual`
- `App/React/components/dashboard/DashboardPanelView.tsx` — `accionesExtra` para cerrar/mover

**Funcionalidad implementada:**
1. **Hook `useSidebarPaneles`**: estado en localStorage (`glory_sidebar_paneles`), métodos `agregarPanel`, `quitarPanel`, `moverPanel`, `ajustarAnchos`, migración desde panel activo único
2. **DashboardSidebarGrid**: layouts según cantidad (1→full, 2→2col, 3→2+1, 4→2×2), resize horizontal `ResizeHandleSidebar` entre columnas
3. **`ResizeHandlePanel`** (shared): resize vertical por celda individual
4. **SidebarMenu**: click izquierdo = seleccionar panel, click derecho = menú contextual con "Agregar a la vista" usando `MenuContextual`
5. **DashboardPanelView**: prop `accionesExtra` inyectada vía `handleMinimizar` con botones mover arriba/abajo + cerrar
6. **Click en sidebar**: un solo click = navegar a 1 panel (no agregar)
7. **Responsive**: mobile apila todo verticalmente, oculta handles

### Post-implementación — Correcciones UX (mismo commit)

1. **Menú contextual raw → `MenuContextual`**: reemplazado div hand-rolled por componente compartido
2. **`onAgregarPanel` no estaba pasado**: se agregó al render de `SidebarMenu` en `DashboardIsland`
3. **Crash `alturas` undefined**: datos legacy de localStorage sin campo `alturas` → fix con `guardado.alturas ?? {}`
4. **Alturas individuales = enfoque incorrecto**: el usuario indicó que no se cambia la altura de cada panel sino **la altura de la grilla** (proporción fila superior vs fila inferior)

### Rework: Resize vertical → proporcional por filas (pendiente de commit)

**Decisión del usuario:**
> "no es cambiar la altura individual de cada panel sino la altura de la grilla"
> "el vertical técnicamente debe ser igual, no cambia el hecho si son 3 o 4 paneles, lo lógico es que en ambos casos funcione igual"

**Cambios aplicados:**

#### `useSidebarPanels.ts`
- ❌ `alturas: Record<string, string>` → ✅ `alturaFilas: [number, number]` (default `[50, 50]`)
- ❌ `cambiarAltura(panelId, altura)` → ✅ `ajustarAlturasFilas([filaSup, filaInf])`
- Migración: acepta datos legacy sin `alturaFilas`, inyecta default

#### `DashboardSidebarGrid.tsx` (reescrito)
- ❌ Eliminado `ResizeHandlePanel` por celda
- ✅ `SidebarGridCell` renderiza `DashboardPanelView` directo sin wrapper de resize
- ✅ Nuevo `ResizeHandleRow`: handle drag vertical entre filas (patrón idéntico a `ResizeHandleSidebar` pero con `row-resize`)
- Filas con `flex: 0 0 ${alturaFilas[n]}%` para control proporcional
- Handle `ghost` en fila inferior de 4 paneles para alinear visualmente

#### `DashboardIsland.tsx`
- Props: `alturaFilas={sidebarState.alturaFilas}` + `onAjustarAlturasFilas={ajustarAlturasFilas}`

#### `dashboardSidebarGrid.css`
- ❌ Eliminados `.sidebarGridPanelWrapper`, `.panelConResize` y overrides
- ✅ `.sidebarGridResizeHandle--vertical`, `--horizontal`, `--ghost`
- Handle horizontal: cursor `row-resize`, línea ancha en vez de alta
- Responsive mobile: oculta todos los handles, fuerza `flex: 1` en rows

**Validación:** `npx tsc --noEmit` → 0 errores en los 3 archivos modificados.

---

## 1-8. Contenido original del plan (preservado para referencia)

### 1. Diagnóstico — Arquitectura Actual

### Cómo funciona el modo sidebar HOY

```
DashboardIsland.tsx
  └─ .dashboardSidebarLayout (flex row)
       └─ SidebarMenu (menú de iconos)
       └─ .dashboardSidebarMain (flex column, flex:1)
            └─ .dashboardSidebarContenido
                 └─ DashboardPanelView  ← UN SOLO panel
                      └─ .dashboardPanelView (flex column, height:100%)
                           └─ .dashboardSidebarPanel--visible (wrapper animación)
                                └─ .panelDashboard
                                     └─ <Componente />
```

### Estado actual de `panelSidebarActivo`
- Es un `useState<PanelId>` en `DashboardIsland.tsx`
- `onSeleccionarPanel` en SidebarMenu cambia este estado → cambia el panel visible

### Cómo funciona el modo GRID (lo que hay que reutilizar)

```
DashboardGrid.tsx
  └─ .dashboardGridContenedor
       └─ .dashboardGridColumnas--Ncol
            └─ .dashboardGridColumna (una por columna)
                 └─ PanelArrastrable
                      └─ ResizeHandlePanel
                           └─ .panelDashboard
                                └─ <Componente />
```

El modo grid usa:
1. **`useConfiguracionLayout`** → `modoColumnas` (1, 2 o 3), `ordenPaneles[ {id, columna, posicion} ]`, `visibilidad`, `anchos`, `alturas`
2. **`DashboardGrid`** → itera `layout.obtenerPanelesColumna(N)` y renderiza cada panel
3. **`PanelArrastrable`** → drag & drop entre columnas
4. **`ResizeHandlePanel`** → resize vertical de paneles
5. **`ResizeHandleColumn`** → resize horizontal entre columnas
6. **`manejarCambiarAlturaPanel`** → persiste alturas
7. **`duplicarPanel` / `cerrarPanelDuplicado`** → paneles duplicados (scratchpad)

---

## 2. Propuesta de Diseño

### Estructura nueva del modo sidebar multi-panel

```
.dashboardSidebarLayout (flex row)
  └─ SidebarMenu
  └─ .dashboardSidebarMain (flex column)
       └─ .dashboardSidebarContenido
            └─ DashboardSidebarGrid  ← NUEVO: reemplaza DashboardPanelView
                 └─ Renderiza N paneles en grilla flexible
                    (1, 2, 3 o 4 paneles según layout)
```

### Disposiciones según cantidad de paneles activos

| Paneles | Layout |
|---------|--------|
| 1       | 1 columna, 100% ancho (como hoy) |
| 2       | 1 fila, 2 columnas (50% cada una por defecto, redimensionable) |
| 3       | 2 columnas: col1 50%, col2 50%; col1 tiene 2 paneles apilados, col2 1 panel |
| 4       | 2x2: 2 columnas, 2 filas cada una |

### Estados

| Estado | Descripción |
|--------|-------------|
| **Selección** | Al hacer clic en un panel del SidebarMenu, se agrega a la grilla (no reemplaza) |
| **Reemplazo** | Si ya hay 4 paneles, preguntar cuál cerrar o ignorar |
| **Cierre** | Botón "X" en cada panel para quitarlo de la grilla (vuelve a 1 panel) |
| **Drag entre celdas** | Arrastrar panel de una celda a otra para reordenar |
| **Resize vertical/horizontal** | Handles entre paneles para redimensionar |

---

## 3. Arquitectura Técnica

### 3.1 Estados en DashboardIsland.tsx

```typescript
// ESTADO ACTUAL (reemplazar):
const [panelSidebarActivo, setPanelSidebarActivo] = useState<PanelId>('ejecucion');

// NUEVO ESTADO:
interface PanelSidebarActivo {
  id: PanelId;
  // Podemos reutilizar el sistema de ordenPaneles existente
  // pero adaptado al sidebar: columna = celda en la grilla (1-2)
  // posicion = fila dentro de la celda (0 = arriba, 1 = abajo)
}

// La pregunta clave: ¿cómo modelamos los paneles activos?
//
// OPCIÓN A: Reutilizar ordenPaneles con un modoColumnas especial
//   - modoColumnas = 1 (sidebar) → solo 1 columna, 1 panel
//   - modoColumnas = 2 (sidebar) → 2 columnas, N paneles
//   PROBLEMA: modoColumnas afecta al grid, no queremos mezclar
//
// OPCIÓN B: Estado separado para sidebar
//   - sidebarPaneles: PanelId[] (hasta 4, orden determinista)
//   - sidebarAnchos: [50, 50] para 2 columnas
//   - sidebarLayout: '1col' | '2col' | '3cells' | '2x2'
//   VENTAJA: no toca el sistema grid existente
//   PROBLEMA: duplica lógica
//
// OPCIÓN C (RECOMENDADA): Reutilizar ordenPaneles con un layout virtual
//   - En modo sidebar, ordenPaneles sigue funcionando pero
//     se interpreta en una grilla sidebar de hasta 2 columnas × 2 filas
//   - columna: 1 | 2 (celda horizontal)
//   - posicion: 0 | 1 (fila dentro de la celda)
//   - visibilidad controla qué paneles están en la sidebar
//   - Se agrega un flag sidebarPaneles: PanelId[] para indicar
//     qué paneles están activos en la sidebar (independiente de visibilidad grid)
//   VENTAJA: reusa toda la lógica de obtenerPanelesColumna, reordenar, etc.

// Tras pensarlo: mejor un estado SIMPLE y separado.
// El modo sidebar es conceptualmente distinto al grid.
```

### 3.2 Decisión: Estado específico para sidebar

Después de analizar, usaré estados separados porque:

1. El modo sidebar no tiene columnas en el sentido grid (máx 2, no 3)
2. La visibilidad en sidebar es independiente del grid
3. No queremos que cambios en sidebar muten el ordenPaneles del grid
4. Es más simple y mantenible

```typescript
// En DashboardIsland.tsx o un nuevo hook useSidebarLayout

interface SidebarPanelState {
  /** Lista de IDs de paneles activos en la sidebar, en orden de visualización.
   *  Máximo 4. El orden determina la posición en la grilla:
   *   - indices [0,1] → columna 1 (fila 0, fila 1)
   *   - indices [2,3] → columna 2 (fila 0, fila 1) */
  paneles: PanelId[];
  /** Anchos de columnas en porcentaje (solo relevante con 2+ paneles) */
  anchos: [number, number]; // [col1%, col2%], suma = 100
}
```

### 3.3 Componentes Nuevos

#### `DashboardSidebarGrid.tsx`
- Reemplaza a `DashboardPanelView.tsx`
- Recibe: `paneles: PanelId[]`, `ctx`, `anchos`
- Renderiza la grilla con los paneles activos
- Cada celda = `DashboardPanelView` simplificado (sin wrapper animado)
- Handles de resize entre columnas y entre filas

#### `DashboardSidebarCell.tsx` (opcional, puede ser inline)
- Wrapper de una celda individual
- Botón de cerrar panel (X)
- Contenido del panel via `renderizarContenidoPanel` (reutilizado de DashboardGrid)

### 3.4 Lógica de interacción

| Acción | Implementación |
|--------|---------------|
| **Click en SidebarMenu agrega panel** | Si el panel ya está activo → focus/no-op. Si no está → se agrega al final de la grilla |
| **Cerrar panel** | Botón X en cada celda → remueve de sidebarPaneles |
| **Arrastrar panel a otra celda** | Reutilizar lógica de arrastre (arrastre.iniciarArrastre?) O versión simplificada |
| **Resize vertical** | ResizeHandlePanel existente (ya funciona) |
| **Resize horizontal** | Nuevo handle entre columnas de sidebar |
| **Máximo 4 paneles** | Validación en agregar: si sidebarPaneles.length >= 4, no agregar (o reemplazar) |

---

## 4. Cambios Concretos

### 4.1 DashboardIsland.tsx
- Reemplazar `panelSidebarActivo` + `setPanelSidebarActivo` por `sidebarPaneles` + `setSidebarPaneles`
- Pasar `sidebarPaneles` y `setSidebarPaneles` al SidebarMenu
- Cambiar `DashboardPanelView` por `DashboardSidebarGrid`

### 4.2 SidebarMenu.tsx
- `onSeleccionarPanel` ahora recibe función que agrega/quita paneles
- El botón activo se marca según si el panel está en `sidebarPaneles`
- Feedback visual de panel activo en la grilla

### 4.3 DashboardSidebarGrid.tsx (NUEVO)
- Contenedor flex/grid con los paneles activos
- Renderiza pares columna-fila según cantidad
- Handles de resize
- Botón cerrar en cada panel

### 4.4 CSS
- Nuevo `dashboardSidebarGrid.css`
- Estilos para disposiciones: 1, 2, 3, 4 paneles
- Handles de resize específicos
- Animaciones de entrada/salida

### 4.5 Reutilización desde modo grid
- `renderizarContenidoPanel()` de `DashboardGrid.tsx` se puede extraer a función compartida
- `ResizeHandlePanel` funciona igual
- `manejarToggleTarea`, `manejarEditarHabitoPorId` igual
- `generadoresPropsPanel` no cambia

---

## 5. Fases de Implementación

### Fase 1: Fundación (1 commit)
1. Crear hook `useSidebarPanels.ts` con el estado de paneles activos
2. Modificar `DashboardIsland.tsx` para usar el nuevo hook
3. SidebarMenu: toggle de paneles (agregar/quitar)

### Fase 2: Renderizado multi-panel (1 commit)
1. Crear `DashboardSidebarGrid.tsx`
2. Renderizado condicional según cantidad de paneles
3. Botón cerrar en cada celda
4. Reutilizar `renderizarContenidoPanel` del grid

### Fase 3: Redimensionamiento (1 commit)
1. Handle horizontal entre columnas
2. ResizeHandlePanel (vertical) ya funciona
3. Persistir anchos en localStorage

### Fase 4: Arrastre entre celdas (1 commit)
1. Adaptar lógica de arrastre para mover paneles entre posiciones
2. Drag visual feedback

### Fase 5: Pulido (1 commit)
1. Animaciones
2. Estados vacío/lleno
3. Prueba de carga con 4 paneles
4. Responsive: en móvil seguir mostrando 1 panel

---

## 6. Consideraciones

### Reutilización vs Separación
- `renderizarContenidoPanel()` es la función clave a refactorizar → mover a un helper compartido
- Los generadores de props no cambian
- `obtenerPanelOBase`, `panelManejaAlturaPropia`, etc. se reusan

### Persistencia
- `sidebarPaneles` se guarda en localStorage (dentro de `ConfiguracionLayout` o como clave separada `glory_sidebar_paneles`)
- Los anchos de columnas también se persisten

### Responsive (móvil)
- En móvil, sidebar mode no aplica (se usa DashboardGrid con páginas)
- No hay cambios necesarios en modo móvil

### Compatibilidad hacia atrás
- Usuarios existentes en modo sidebar: al actualizar, verán 1 panel como antes
- Se mantiene la tecla de escape para volver a grid
- Panel activo previo se migra a `sidebarPaneles = [panelActivo]`

---

## 7. Preguntas Pendientes

1. **Comportamiento al hacer clic:** ¿click en panel ya activo lo desactiva (saca de grilla) o solo hace focus?
   - *Propuesta:* Click en panel NO activo lo agrega. Click en panel ya activo hace focus (lo mueve a primera posición si está lleno, o no-op). Click derecho o botón X lo cierra.
2. **Reordenamiento:** ¿cómo se mueve un panel de posición en la grilla?
   - *Propuesta:* Arrastre (reutilizar lógica existente). También un menú contextual.
3. **Panel de 4 lleno, clic en otro panel:** ¿reemplazar el último o ignorar?
   - *Propuesta:* Ignorar con feedback visual (tooltip "Máximo 4 paneles"). Opción de menú contextual para reemplazar.
4. **Separación del estado:** ¿`sidebarPaneles` vive dentro de `ConfiguracionLayout` o es un estado separado?
   - *Decisión:* Estado separado `useSidebarPanels` para no contaminar la config grid. Pero se persiste en localStorage con clave `glory_sidebar_paneles`.

---

## 8. Mitigaciones — No Romper el Modo Grid

> **REGLA ABSOLUTA:** El modo grid (DashboardGrid + useDashboardGrid + useConfiguracionLayout)
> no debe sufrir cambios lógicos. Todo el feature multi-panel sidebar es código NUEVO o
> extensiones inocuas. Los únicos cambios en archivos existentes son:
> - Extraer funciones a helpers (refactor seguro, no cambia lógica)
> - Agregar props opcionales a componentes existentes (backwards compatible)
> - Puntos de entrada en DashboardIsland.tsx (condicional por tipoLayout)

### 8.1 Archivos que NO se tocan

| Archivo | Razón |
|---------|-------|
| `DashboardGrid.tsx` | No se modifica. Si se extrae `renderizarContenidoPanel`, se hace creando un helper NUEVO y el grid lo importa |
| `useConfiguracionLayout.ts` | No se modifica. El sidebar tiene su propio estado |
| `useArrastrePaneles.ts` | No se modifica. Sidebar usa su propio arrastre simplificado |
| `useDashboardCompleto.ts` | No se modifica |
| `useDashboardGrid.ts` | No se modifica. Solo se reusa `propsContexto` vía el hook |
| `registroPaneles.ts` | No se modifica |
| `ResizeHandlePanel.tsx` | No se modifica. Se reutiliza tal cual |
| `PanelArrastrable.tsx` | No se modifica. Se reutiliza tal cual si aplica |
| `HandleArrastre.tsx` | No se modifica |

### 8.2 Archivos que se modifican con cirugía precisa

| Archivo | Riesgo | Mitigación |
|---------|--------|------------|
| `DashboardIsland.tsx` | **Medio** — se reemplaza estado `panelSidebarActivo` | El nuevo estado solo se usa dentro del bloque `tipoLayout === 'sidebar'`. El bloque grid queda intacto. Si hay bug, el sidebar no renderiza, el grid no se entera |
| `SidebarMenu.tsx` | **Bajo** — se agrega prop opcional | `onSeleccionarPanel` mantiene firma actual. Nueva prop `onAgregarPanel` es opcional. SidebarMenu en modo grid no la recibe |
| `DashboardPanelView.tsx` | **Bajo** — se simplifica o integra | Se puede mantener como componente interno de `DashboardSidebarGrid`. El export actual se redirige |

### 8.3 Estrategia de extracción segura de `renderizarContenidoPanel`

En `DashboardGrid.tsx` hay una función `renderizarContenidoPanel` con lógica compartida.
En lugar de modificar `DashboardGrid.tsx`:

1. **Crear** `App/React/helpers/renderizarPanel.ts` con la lógica extraída
2. **Refactorizar** `DashboardGrid.tsx` para que importe y use el helper
3. **Verificar** que el grid renderiza exactamente igual antes y después

Protocolo de validación del refactor:
- `npm run type-check` (TypeScript)
- Comparar snapshot visual del grid antes y después del cambio
- Si hay cambios visuales en grid, revertir inmediatamente

### 8.4 Aislamiento de estado

| Estado | Dónde vive | Persistencia | Impacto en grid |
|--------|-----------|-------------|-----------------|
| `sidebarPaneles: PanelId[]` | `useSidebarPanels` hook | `glory_sidebar_paneles` en localStorage | Cero — clave distinta a `glory_config_layout` |
| `sidebarAnchos: [number, number]` | `useSidebarPanels` hook | Misma clave que arriba | Cero |
| `configuracionLayout.tipoLayout` | `useConfiguracionLayout` (existente) | `glory_config_layout` | Ya existe. Grid ignora cuando es 'sidebar' |

### 8.5 Principio de diseño: **Separación total**

```
DashboardIsland.tsx
├── tipoLayout === 'grid'
│   └── DashboardGrid (no se toca)
│
└── tipoLayout === 'sidebar'
    ├── SidebarMenu (con props nuevas opcionales)
    ├── DashboardSidebarGrid (NUEVO, reusa helpers)
    └── useSidebarPanels (NUEVO, estado aislado)
```

**Cualquier bug en el modo sidebar NO debe afectar al modo grid.** Si un cambio en
`DashboardIsland.tsx` introduce un error, el bloque `tipoLayout === 'grid'` sigue su
propio código sin tocar las nuevas variables.

### 8.6 Plan de pruebas post-implementación

1. Abrir dashboard en modo grid → verificar que paneles, arrastre y resize funcionan igual
2. Cambiar a modo sidebar → verificar multi-panel
3. Volver a modo grid → verificar que nada cambió
4. Recargar página → verificar persistencia
5. Abrir en móvil → solo mode grid, nada debe cambiar

---

## 9. Archivos a modificar/crear

| Archivo | Acción | Tipo |
|---------|--------|------|
| `App/React/hooks/dashboard/useSidebarPanels.ts` | CREAR | Nuevo |
| `App/React/components/dashboard/DashboardSidebarGrid.tsx` | CREAR | Nuevo |
| `App/React/helpers/renderizarPanel.ts` | CREAR | Nuevo |
| `App/React/styles/dashboard/componentes/dashboardSidebarGrid.css` | CREAR | Nuevo |
| `App/React/hooks/dashboard/useResizeHandleSidebar.ts` | CREAR | Nuevo |
| `App/React/components/dashboard/DashboardPanelView.tsx` | MODIFICAR | Simplificar |
| `App/React/components/dashboard/SidebarMenu.tsx` | MODIFICAR | Props opcionales |
| `App/React/islands/DashboardIsland.tsx` | MODIFICAR | Condicional sidebar |
| `App/React/components/dashboard/DashboardGrid.tsx` | REFACTOR | Solo import helper (validar) |

---

## 10. Historial

| Fecha | Cambio |
|-------|--------|
| 2026-05-31 | Creación del plan |
| 2026-05-31 | Añadida sección 8: mitigaciones para no romper modo grid. Sin commits sin autorización |
