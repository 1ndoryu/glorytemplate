# Plan: Nuevo modo de layout — Menú Lateral (Sidebar)

> **Fecha:** 2026-05-30
> **Estado:** Pendiente de asignar IDs
> **Duración estimada:** Media-Compleja (varios frentes)

---

## 1. Resumen

Agregar un segundo modo de layout al dashboard: **"sidebar"** (menú lateral), complementario al actual **"grid"** (columnas múltiples con paneles visibles simultáneamente).

En el modo `sidebar`, los paneles no se muestran todos a la vez en un grid, sino que se accede a cada uno individualmente desde un menú lateral vertical. Es el patrón clásico de apps como Discord, Notion, Slack — un sidebar con iconos a la izquierda y el contenido del panel activo a la derecha.

---

## 2. Estado actual (referencia)

### Modo Grid (el único que existe hoy)

```
┌──────────────────────────────────────────┐
│  DashboardEncabezado (header global)     │
├────────────────┬────────────┬────────────┤
│  Panel A       │  Panel B   │  Panel C   │
│  (arrastrable) │            │            │
│                ├────────────┼────────────┤
│  Panel D       │  Panel E   │  ...       │
└────────────────┴────────────┴────────────┘
```

### Cómo funciona:
- `ConfiguracionLayout.modoColumnas: 1 | 2 | 3`
- Todos los paneles visibles concurrentemente
- `DashboardGrid.tsx` itera `layout.obtenerPanelesColumna(n)` y renderiza cada panel
- PanelArrastrable + ResizeHandlePanel por panel
- ResizeHandleColumn entre columnas
- Los paneles se arrastran entre columnas y posiciones

### Datos relevantes:
- `ConfiguracionLayout` vive en `localStorage('glory_config_layout')`
- `useConfiguracionLayout` gestiona visibilidad, orden, alturas, modoColumnas
- `registroPaneles.ts` es fuente única de verdad para definición de paneles
- Mobile ya tiene su propio sistema: navegación inferior con tabs + panel único visible
- `DefinicionPanel` incluye `icono: ReactNode` — ideal para sidebar

---

## 3. Diseño del nuevo modo Sidebar

### 3.1 Layout visual

```
┌────────────────────────────────────────────────┐
│  DashboardEncabezado (header global)           │
├────────┬───────────────────────────────────────┤
│        │                                       │
│  Icono  │  Panel activo (ocupa todo el ancho   │
│  Icono  │  restante, sin columnas)             │
│  Icono  │                                       │
│  ---    │  - Se renderiza 1 solo panel a la vez │
│  Icono  │  - Sin handles de arrastre           │
│  Icono  │  - Sin resize de paneles             │
│        │  - Sin botón minimizar                │
└────────┴───────────────────────────────────────┘
```

### 3.2 Comportamiento

- **Sidebar vertical fijo** (~56-64px de ancho) con los iconos de cada panel visible
- **Panel activo**: ocupa 100% del ancho restante del contenedor
- **Click en icono**: cambia el panel activo con transición suave
- **Panel activo seleccionado** se marca visualmente (highlight)
- **Paneles ocultos** (visibilidad=false): no aparecen en el sidebar
- **Orden de iconos**: sigue el orden de `registroPaneles.ts` (o el `ordenPaneles` de la config)
- **Sin drag & drop** entre paneles en este modo
- **El header global se mantiene idéntico**

### 3.3 Responsive

| Breakpoint | Comportamiento |
|---|---|
| >= 1024px | Sidebar vertical + panel a la derecha |
| 768-1023px | Sidebar vertical más angosto o drawer (decidir) |
| < 768px | Usar el sistema móvil existente (bottom nav + panel único) |

---

## 4. Cambios necesarios

### 4.1 Tipos (`types/paneles.ts`)

```diff
+ export type TipoLayout = 'grid' | 'sidebar';

  export interface ConfiguracionLayout {
+     tipoLayout: TipoLayout;       // ← NUEVO
      modoColumnas: ModoColumnas;
      anchos: AnchoColumnas;
      anchoTotal: number;
      visibilidad: Record<string, boolean>;
      ordenPaneles: OrdenPanel[];
      alturas: Record<string, string>;
  }
```

### 4.2 layoutFactory (`utils/layoutFactory.ts`)

```diff
  export function generarConfigLayoutDefecto(): ConfiguracionLayout {
      return {
+         tipoLayout: 'grid',
          modoColumnas: 2,
          anchos: { ...PRESETS_ANCHOS[2] },
          anchoTotal: 100,
          visibilidad: generarVisibilidadDefecto(),
          ordenPaneles: generarOrdenPanelesDefecto()[2],
          alturas: generarAlturasDefecto(),
      };
  }
```

### 4.3 useConfiguracionLayout

```diff
  return {
      configuracion: configuracionNormalizada,
+     tipoLayout: configuracionNormalizada.tipoLayout,
      modoColumnas: ...,
      ...
+     cambiarTipoLayout: (tipo: TipoLayout) => setValor(prev => ({ ...prev, tipoLayout: tipo })),
  }
```

### 4.4 Nuevo componente: `SidebarMenu`

**Archivo:** `components/dashboard/SidebarMenu.tsx`
**Archivo CSS:** `styles/dashboard/componentes/sidebarMenu.css`

```
Props:
- paneles: Array<{id: string, titulo: string, icono: ReactNode}>
- panelActivo: string
- onSeleccionarPanel: (panelId: string) => void

Renderiza:
- Lista vertical de botones/iconos
- Tooltip con nombre del panel en hover
- Highlight en panel activo
- Separador visual (opcional)
```

### 4.5 Nuevo componente: `DashboardPanelView`

**Archivo:** `components/dashboard/DashboardPanelView.tsx`
**Archivo CSS:** `styles/dashboard/componentes/dashboardPanelView.css`

```
Wrapper que renderiza 1 solo panel (sin columna, sin arrastre, sin resize).
Reutiliza renderizarContenidoPanel() de DashboardGrid.
Para móvil: redirige al sistema de navegación móvil existente.
```

### 4.6 Modificar `DashboardIsland.tsx`

```diff
  function DashboardIsland() {
      ...
+     const { tipoLayout, cambiarTipoLayout } = useConfiguracionLayout();
+     const [panelSidebarActivo, setPanelSidebarActivo] = useState<string>(primerPanelVisible);

      return (
          <div className="dashboardContenedor">
              <DashboardEncabezado ... />
+             {tipoLayout === 'sidebar' ? (
+                 <div className="dashboardSidebarLayout">
+                     <SidebarMenu
+                         paneles={panelesSidebar}
+                         panelActivo={panelSidebarActivo}
+                         onSeleccionarPanel={setPanelSidebarActivo}
+                     />
+                     <div className="dashboardSidebarContenido">
+                         <DashboardPanelView panelId={panelSidebarActivo} ... />
+                     </div>
+                 </div>
+             ) : (
                  <DashboardGrid ... />
+             )}
              <DashboardModales ... />
              ...
          </div>
      );
  }
```

### 4.7 No tocar `DashboardGrid.tsx`

El grid actual permanece intacto — el modo `sidebar` es un layout paralelo, no un remplazo.

### 4.8 Panel de configuración de layout

Añadir control en `ModalConfiguracionLayout` (o donde se configura el layout) para:
- Toggle Grid / Sidebar (quizás como tabs o selector)
- Actualmente el modal permite cambiar modoColumnas (1/2/3) — eso solo aplica en modo grid

### 4.9 CSS nuevo — Diseño detallado


#### 4.9.3 Archivo CSS a modificar: `index.css`

Agregar imports al final del archivo:
```css
@import './componentes/sidebarMenu.css';
@import './componentes/dashboardPanelView.css';
```

#### 4.9.4 Responsive

| Breakpoint | Sidebar | Contenido |
|------------|---------|-----------|
| ≥1024px | 56px fijo | flex:1, padding 16px |
| 768-1023px | 48px fijo | flex:1, padding 12px |
| <768px | Oculto (usar sistema móvil existente) | 100% |

### 4.10 Persistencia

`tipoLayout` se guarda automáticamente en localStorage porque `useConfiguracionLayout` usa `useLocalStorage` con la clave `glory_config_layout`. No requiere cambios adicionales.

---

## 5. Archivos a modificar/crear

| Archivo | Acción |
|---|---|
| `App/React/types/paneles.ts` | MODIFICAR: agregar `TipoLayout`, modificar `ConfiguracionLayout` |
| `App/React/utils/layoutFactory.ts` | MODIFICAR: actualizar `generarConfigLayoutDefecto` |
| `App/React/hooks/useConfiguracionLayout.ts` | MODIFICAR: exponer `tipoLayout`, `cambiarTipoLayout` |
| `App/React/utils/layoutLogica.ts` | MODIFICAR: migración de configs viejas (sin `tipoLayout`) |
| `App/React/components/dashboard/SidebarMenu.tsx` | **CREAR** |
| `App/React/components/dashboard/DashboardPanelView.tsx` | **CREAR** |
| `App/React/styles/dashboard/componentes/sidebarMenu.css` | **CREAR** |
| `App/React/styles/dashboard/componentes/dashboardPanelView.css` | **CREAR** |
| `App/React/islands/DashboardIsland.tsx` | MODIFICAR: bifurcar layout según `tipoLayout` |
| `App/React/components/dashboard/ModalConfiguracionLayout.tsx` | MODIFICAR: agregar selector Grid/Sidebar |
| `App/React/styles/dashboard/componentes/encabezado-base.css` | POSIBLE: ajustar si el sidebar convive con el header |

---

## 6. Posibles problemas y consideraciones

### 6.1 Estado del panel activo
- ¿Dónde vive `panelSidebarActivo`? En el hook `useConfiguracionLayout` o en un estado local de `DashboardIsland`?
- **Decisión:** Estado local en `DashboardIsland` con `useState`, porque es UI state, no configuración persistente.
- Opcionalmente, guardar el último panel activo por sesión en sessionStorage.

### 6.2 Paneles con altura propia (scratchpad, actividad)
- En modo sidebar, estos paneles ocupan el 100% del contenedor — no hay límite de altura.
- No necesitan `ResizeHandlePanel` ni `manejaAlturaPropia` en este modo.
- El wrapper `DashboardPanelView` debe ignorar alturas y usar `flex: 1` + overflow auto.

### 6.3 Sincronización con el registro de paneles
- Si un panel se agrega/elimina del registro, el sidebar debe reflejarlo automáticamente (ya es reactivo porque lee del registro).

### 6.4 Plugins en sidebar
- Los plugins (ayuno, déficit calórico, IA, etc.) también deben aparecer en el sidebar si son visibles.
- Usar `obtenerTodosPanelesNavegables()` que ya existe y retorna todos los paneles con icono.

### 6.5 Transiciones
- Al cambiar de panel en el sidebar, considerar animación de fade o slide para no sentir salto. Usar `framer-motion` (ya instalado).

### 6.6 Overflow del sidebar
- Si hay muchos paneles, el sidebar debe hacer scroll vertical.
- Mantener el primer icono (o el activo) siempre visible con `sticky`.

### 6.7 Nombres y etiquetas (español)
- Sidebar: "Barra lateral" o mantener "Menú" en español.
- Modo: "Grid" (actual) / "Panel único" o "Sidebar" (nuevo).
- Usar español en labels de UI, inglés en nombres técnicos.

---

## 7. Orden de implementación sugerido

1. **Tipos + Factory + Logica** (4.1, 4.2, 4.3)
2. **SidebarMenu** componente + CSS (4.4, 4.9)
3. **DashboardPanelView** componente + CSS (4.5)
4. **DashboardIsland** bifurcación (4.6)
5. **ModalConfiguracionLayout** toggle (4.8)
6. **Validación y ajustes responsive** (3.3)
7. **Transiciones y pulido** (6.5)

---

## 8. Fases

### Fase 1 — Base (tipos, factory, hook)
Agregar `TipoLayout` al tipo, factory y hook.
**Archivos:** `types/paneles.ts`, `utils/layoutFactory.ts`, `utils/layoutLogica.ts`, `hooks/useConfiguracionLayout.ts`

### Fase 2 — Sidebar UI
Crear `SidebarMenu` y `DashboardPanelView` con CSS.
**Archivos:** `components/dashboard/SidebarMenu.tsx`, `components/dashboard/DashboardPanelView.tsx`, `styles/dashboard/componentes/sidebarMenu.css`, `styles/dashboard/componentes/dashboardPanelView.css`

### Fase 3 — Integración
Bifurcar `DashboardIsland` según `tipoLayout`.
**Archivos:** `islands/DashboardIsland.tsx`

### Fase 4 — Configuración
Agregar toggle en el modal de configuración de layout.
**Archivos:** `components/dashboard/ModalConfiguracionLayout.tsx`

### Fase 5 — Pulido
Transiciones, responsive, testeo manual.