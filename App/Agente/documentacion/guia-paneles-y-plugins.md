# Guía: Crear Paneles y Plugins en el Dashboard

> Documentación de referencia para desarrollar nuevos paneles y plugins desactivables.

---

## Tabla de contenidos

1. [Conceptos clave](#1-conceptos-clave)
2. [Crear un Panel base (siempre visible)](#2-crear-un-panel-base)
3. [Crear un Plugin (desactivable)](#3-crear-un-plugin)
4. [Anatomía de un panel](#4-anatomía-de-un-panel)
5. [Registro de props (generadoresPropsPanel)](#5-registro-de-props)
6. [CSS y estilos](#6-css-y-estilos)
7. [Integración con el sistema de layout](#7-integración-layout)
8. [Checklist completo](#8-checklist)
9. [Ejemplo paso a paso: Plugin de Recordatorios](#9-ejemplo-recordatorios)

---

## 1. Conceptos clave

### Arquitectura OCP (Open/Closed Principle)

El sistema de paneles usa un **registro central** (`registroPaneles.ts`) donde cada panel se auto-registra. Esto permite agregar paneles nuevos **sin modificar** archivos existentes.

```
inicializarPaneles.ts  →  registra paneles base (Tareas, Hábitos, Proyectos, Notas, Actividad)
inicializarPlugins.ts  →  registra plugins desactivables (Ayuno, Déficit Calórico, IA, Grupos FB...)
```

### Panel vs Plugin

| Concepto | ¿Qué es? | ¿Desactivable? | Ejemplo |
|----------|-----------|-----------------|---------|
| **Panel** | Un componente visual en el dashboard | No (siempre visible) | Tareas, Hábitos, Notas |
| **Plugin** | Un módulo opcional que registra 1+ paneles | Sí (desde Configuración → Plugins) | Ayuno, IA, Déficit Calórico |

### Archivos clave

| Archivo | Responsabilidad |
|---------|----------------|
| `config/registroPaneles.ts` | Registro central de paneles (Map interna) |
| `config/registroPlugins.ts` | Registro central de plugins (Map interna) |
| `config/inicializarPaneles.ts` | Registra paneles base al inicio |
| `config/inicializarPlugins.ts` | Registra plugins desactivables al inicio |
| `types/paneles.ts` | Interfaces: `DefinicionPanel`, `PanelBaseProps`, `ModoColumnas` |
| `types/plugins.ts` | Interfaces: `DefinicionPlugin`, `EstadoPluginsUsuario` |
| `stores/pluginsStore.ts` | Zustand store: `activarPlugin`, `desactivarPlugin`, `togglePlugin` |
| `hooks/dashboard/generadoresPropsPanel.ts` | Mapea `panelId` → función que genera props del componente |
| `components/dashboard/DashboardPanelView.tsx` | Wrapper que renderiza un panel individual con sus props |
| `components/dashboard/DashboardGrid.tsx` | Grid responsivo que organiza todos los paneles |

---

## 2. Crear un Panel base (siempre visible)

Un panel base **no se puede desactivar**. Siempre aparece en el dashboard.

### Paso 1: Crear el componente

```
App/React/components/paneles/PanelMiPanel.tsx
```

```tsx
import type {PanelBaseProps} from '../../types/paneles';

interface PanelMiPanelProps extends PanelBaseProps {
    // Props adicionales específicas de tu panel
    onAccion?: () => void;
}

export function PanelMiPanel({renderHandleArrastre, handleMinimizar, onAccion}: PanelMiPanelProps): JSX.Element {
    return (
        <div>
            {/* Header estándar con handle de arrastre */}
            <div className="seccionEncabezado">
                {renderHandleArrastre('Mi Panel')}
                {handleMinimizar}
            </div>
            {/* Contenido del panel */}
            <button onClick={onAccion}>Acción</button>
        </div>
    );
}
```

**Props obligatorias** (`PanelBaseProps`):
- `renderHandleArrastre(titulo?)` → Renderiza el handle de arrastre + título
- `handleMinimizar` → Botón de minimizar/cerrar panel

### Paso 2: Registrar en `inicializarPaneles.ts`

```ts
// App/React/config/inicializarPaneles.ts
import {MiIcono} from 'lucide-react';
import {PanelMiPanel} from '../components/paneles/PanelMiPanel';

registrarPanel({
    id: 'miPanel',                    // ID único, sin espacios
    titulo: 'Mi Panel',               // Título en desktop
    tituloMovil: 'Mi Panel',          // Título en móvil (puede ser más corto)
    icono: createElement(MiIcono, {size: 14}),
    visiblePorDefecto: true,           // true = aparece por defecto
    alturaDefecto: 'auto',             // 'auto' o '200px', '300px', etc.
    posicionDefecto: crearPosicionDefecto(
        [1, 5],   // 1 columna: columna 1, posición 5
        [2, 3],   // 2 columnas: columna 2, posición 3
        [3, 3]    // 3 columnas: columna 3, posición 3
    ),
    componente: PanelMiPanel as ComponentType<PanelBaseProps>,
    enNavegacionMovil: false,          // true = aparece en la barra inferior móvil
    idPaginaMovil: 'mi-panel',        // ID para la navegación móvil
    manejaAlturaPropia: false          // true = no se envuelve en ResizeHandlePanel
});
```

### Paso 3: Registrar el generador de props

```ts
// App/React/hooks/dashboard/generadoresPropsPanel.ts

export function generarPropsPanelMiPanel(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    return {
        renderHandleArrastre,
        handleMinimizar,
        onAccion: () => ctx.dashboard.miAccion()
    };
}

// Agregar al mapa GENERADORES_PROPS:
export const GENERADORES_PROPS: Record<string, Function> = {
    // ... paneles existentes ...
    miPanel: generarPropsPanelMiPanel,  // ← Agregar aquí
};
```

### Paso 4: Exportar desde `paneles/index.ts`

```ts
// App/React/components/paneles/index.ts
export {PanelMiPanel} from './PanelMiPanel';
```

---

## 3. Crear un Plugin (desactivable)

Un plugin es un módulo opcional que registra **uno o más paneles**. El usuario puede activarlo/desactivarlo desde **Configuración → Plugins**.

### Paso 1: Crear el componente del panel

Mismo paso que un panel base. El componente acepta `PanelBaseProps`.

### Paso 2: Registrar plugin + panel en `inicializarPlugins.ts`

```ts
// App/React/config/inicializarPlugins.ts
import {MiIcono} from 'lucide-react';
import {PanelMiPlugin} from '../components/paneles/PanelMiPlugin';

// 1. Registrar el PLUGIN (módulo desactivable)
registrarPlugin({
    id: 'mi-plugin',                   // ID único del plugin
    nombre: 'Mi Plugin',               // Nombre mostrado en Configuración → Plugins
    descripcion: 'Descripción corta de lo que hace',
    icono: createElement(MiIcono, {size: 18}),
    version: '1.0.0',
    panelesIds: ['mi-plugin-panel'],   // IDs de paneles que registra este plugin
    habitos: [],                       // Hábitos que se crean al activar (opcional)
    requiereConfiguracion: false,       // true = abre modal de config al activar
    soloAdmin: false                   // true = solo visible para admins
});

// 2. Registrar el PANEL asociado al plugin
registrarPanel({
    id: 'mi-plugin-panel',
    titulo: 'Mi Plugin',
    tituloMovil: 'Mi Plugin',
    icono: createElement(MiIcono, {size: 14}),
    visiblePorDefecto: false,          // ← IMPORTANTE: false para plugins
    alturaDefecto: 'auto',
    posicionDefecto: crearPosicionDefecto([1, 9], [2, 7], [3, 7]),
    componente: PanelMiPlugin as ComponentType<PanelBaseProps>,
    enNavegacionMovil: false,
    idPaginaMovil: 'mi-plugin',
    manejaAlturaPropia: false
});
```

### Paso 3: Registrar generador de props (si necesita props extra)

```ts
// App/React/hooks/dashboard/generadoresPropsPanel.ts

// Si el panel solo necesita props base, NO hace falta crear un generador.
// El sistema usa generarPropsPanelBase() como fallback automáticamente.

// Si necesita props extra:
export function generarPropsPanelMiPlugin(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    return {
        renderHandleArrastre,
        handleMinimizar,
        onMiAccion: ctx.dashboard.miAccion
    };
}

// Agregar al mapa:
GENERADORES_PROPS['mi-plugin-panel'] = generarPropsPanelMiPlugin;
```

### Paso 4: CSS

Los estilos se importan desde el componente o desde `styles/dashboard/index.css`:

```ts
// Opción A: Import directo en el componente
import '../../styles/dashboard/componentes/miPlugin.css';

// Opción B: Import en index.css
@import './componentes/miPlugin.css';
```

### Paso 5: Importar el side-effect en `appIslands.tsx`

`inicializarPlugins.ts` ya se importa en `appIslands.tsx`. Si creas un archivo nuevo de inicialización, asegúrate de importarlo ahí.

### Cómo funciona la activación/desactivación

```
1. Usuario abre Configuración → Plugins
2. Toggle activa/desactiva el plugin → pluginsStore.togglePlugin(id)
3. pluginsStore actualiza localStorage ('glory-plugins')
4. BarraPanelesOcultos lee pluginsStore.pluginsActivos
5. Si el plugin NO está activo → su panel NO aparece en el grid
6. Al reactivar → el panel vuelve a aparecer en su posición
```

El flujo completo:
- `ModalPlugins` → `SeccionConfigPlugins` → `usePluginsStore.togglePlugin()`
- `BarraPanelesOcultos` → filtra paneles por `pluginsActivos`
- `DashboardPanelView` → `panelPuedeMostrarse()` → `obtenerPluginDePanelId()`

---

## 4. Anatomía de un panel

### Estructura de archivos típica

```
App/React/
├── components/
│   └── paneles/
│       └── PanelMiPanel.tsx          ← Componente del panel
│   └── dashboard/
│       └── ModalMiPanel.tsx          ← Modal de configuración (opcional)
├── hooks/
│   └── paneles/
│       └── usePanelMiPanel.ts        ← Lógica extraída (SRP)
│   └── dashboard/
│       └── useConfigMiPanel.ts       ← Configuración persistida (opcional)
├── stores/
│   └── miPanelStore.ts               ← Zustand store (si necesita persistencia)
├── types/
│   └── miPanel.ts                    ← Tipos TypeScript
├── styles/
│   └── dashboard/componentes/
│       └── miPanel.css               ← Estilos del panel
```

### Patrón de componente con header estándar

```tsx
export function PanelMiPanel({renderHandleArrastre, handleMinimizar}: PanelBaseProps): JSX.Element {
    return (
        <div className="internaColumna internaColumna--miPanel">
            {/* Header estándar con SeccionEncabezado */}
            <SeccionEncabezado
                icono={null}
                titulo={renderHandleArrastre('Mi Panel')}
                variante="panelHeader"
                acciones={
                    <>
                        <Boton variante="badge" soloIcono onClick={accion1} icono={<Plus size={12} />} />
                        <Boton variante="badge" soloIcono onClick={accion2} icono={<Settings size={12} />} />
                        {handleMinimizar}
                    </>
                }
            />
            {/* Contenido */}
            <div>...</div>
        </div>
    );
}
```

---

## 5. Registro de props (generadoresPropsPanel)

El archivo `generadoresPropsPanel.ts` mapea cada `panelId` a una función que genera las props que el componente necesita.

### Flujo

```
DashboardGrid.renderizarContenidoPanel(panelId)
  → obtenerGeneradorPropsPanel(panelId, baseId)
    → genera props usando el contexto del dashboard
      → <PanelComponente {...props} />
```

### Si tu panel solo necesita props base

No necesitas crear un generador. El sistema usa `generarPropsPanelBase()` automáticamente como fallback, que solo pasa `renderHandleArrastre` y `handleMinimizar`.

### Si tu panel necesita props extra

1. Crea la función generadora
2. Agrégala al mapa `GENERADORES_PROPS`

---

## 6. CSS y estilos

### Variables del tema

Usa siempre las variables CSS del dashboard para consistencia:

```css
.miPanel {
    background-color: var(--dashboard-fondoSecundario);
    color: var(--dashboard-textoNormal);
    border: 1px solid var(--dashboard-bordePrincipal);
    border-radius: var(--dashboard-radioMd);
    padding: var(--dashboard-espacioMd);
}
```

### Efecto glass (para modales/overlays)

```css
.miModal {
    background-color: var(--dashboard-fondoCristal);
    backdrop-filter: blur(20px);
    box-shadow: var(--dashboard-sombraFuerte);
    border: 1px solid var(--dashboard-bordePrincipal);
    border-radius: var(--dashboard-radioMd);
}
```

### Transiciones

```css
.miElemento {
    transition: background-color var(--dashboard-transicionRapida);
}
```

---

## 7. Integración con el sistema de layout

### Posiciones por defecto

Cada panel define su posición para 1, 2 y 3 columnas:

```ts
crearPosicionDefecto(
    [columna, posicion],  // 1 columna
    [columna, posicion],  // 2 columnas
    [columna, posicion]   // 3 columnas
)
```

- **columna**: 1, 2 o 3
- **posición**: índice dentro de la columna (0 = arriba)

### Móvil

- `enNavegacionMovil: true` → Aparece en la barra inferior
- `idPaginaMovil` → ID para la URL/ruta móvil
- `tituloMovil` → Título corto para la barra

### Altura

- `'auto'` → El panel crece según su contenido
- `'200px'`, `'300px'` → Altura fija con resize handle
- `manejaAlturaPropia: true` → El panel gestiona su propia altura (no se envuelve en ResizeHandlePanel)

---

## 8. Checklist completo

### Para un Panel base:

- [ ] Componente creado en `components/paneles/`
- [ ] Acepta `PanelBaseProps` (`renderHandleArrastre`, `handleMinimizar`)
- [ ] Registrado en `inicializarPaneles.ts` con `registrarPanel()`
- [ ] Generador de props registrado en `generadoresPropsPanel.ts` (si necesita props extra)
- [ ] Exportado desde `components/paneles/index.ts`
- [ ] CSS creado o importado
- [ ] `tsc --noEmit` pasa sin errores

### Para un Plugin:

- [ ] Componente del panel creado en `components/paneles/`
- [ ] Plugin registrado en `inicializarPlugins.ts` con `registrarPlugin()`
- [ ] Panel registrado en `inicializarPlugins.ts` con `registrarPanel()` (`visiblePorDefecto: false`)
- [ ] Generador de props (si necesita props extra) o fallback automático
- [ ] Exportado desde `components/paneles/index.ts`
- [ ] CSS creado o importado
- [ ] Store Zustand creado (si necesita persistencia)
- [ ] `tsc --noEmit` pasa sin errores
- [ ] Activar/desactivar funciona desde Configuración → Plugins

---

## 9. Ejemplo paso a paso: Plugin de Recordatorios

> Ver implementación completa en: `App/React/plugins/recordatorios/`

### Resumen de archivos creados:

```
App/React/
├── stores/recordatoriosStore.ts         ← Zustand persist (localStorage)
├── components/
│   ├── paneles/PanelRecordatorios.tsx   ← Panel principal
│   └── dashboard/
│       ├── ModalCrearRecordatorio.tsx   ← Creación rápida (reusa CSS creacionRapida)
│       └── ModalRecordatoriosGuardados.tsx ← Ver/editar/eliminar recordatorios
├── hooks/paneles/usePanelRecordatorios.ts ← Lógica del panel (SRP)
├── types/recordatorios.ts               ← Tipos TypeScript
└── styles/dashboard/componentes/
    └── recordatorios.css                ← Estilos
```

### Registro:

```ts
// inicializarPlugins.ts
registrarPlugin({
    id: 'recordatorios',
    nombre: 'Recordatorios',
    descripcion: 'Muestra recordatorios aleatorios (texto e imágenes) en intervalos configurables',
    icono: createElement(Bell, {size: 18}),
    version: '1.0.0',
    panelesIds: ['recordatorios'],
    requiereConfiguracion: false
});

registrarPanel({
    id: 'recordatorios',
    titulo: 'Recordatorios',
    tituloMovil: 'Recuerdos',
    icono: createElement(Bell, {size: 14}),
    visiblePorDefecto: false,
    alturaDefecto: '300px',
    posicionDefecto: crearPosicionDefecto([1, 9], [2, 7], [3, 7]),
    componente: PanelRecordatorios as ComponentType<PanelBaseProps>,
    enNavegacionMovil: false,
    manejaAlturaPropia: false
});
```
