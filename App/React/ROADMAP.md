# Dashboard de Productividad Personal - Roadmap

Sistema de seguimiento de hábitos, tareas y notas rápidas con diseño estilo terminal minimalista.

---

## Estado Actual

**Fecha de inicio:** 2025-12-19  
**Version:** v1.0.0-beta  
**Ultima actualizacion:** 2025-12-20
**Estado:** Prioridad en tareas visual y funcional, Correccion de bugs de UI tareas

### Completado
- [x] Arquitectura de componentes (SOLID)
- [x] Sistema de estilos centralizados (sin hardcodeo)
- [x] **CSS modular y escalable** - Refactorizado a estructura por responsabilidad
- [x] Componentes visuales: Encabezado, TablaHabitos, ListaTareas, Scratchpad, Footer
- [x] Hook personalizado `useDashboard` para logica de estado
- [x] Tipos TypeScript para Habito y Tarea
- [x] Compilacion SSG exitosa
- [x] Pagina registrada en `/dashboard/`
- [x] **Sistema de ordenamiento de habitos** - 5 modos: importancia, urgentes, racha, nombre, inteligente
- [x] **Simplificacion de tareas** - Removida funcionalidad de proyectos para enfoque minimalista
- [x] **Refactorizacion modular** - Utilidades extraidas a modulos separados (utils/, data/)
- [x] **Tipos expandidos** - Añadidos tipos para Frecuencia, Prioridad y configuraciones
- [x] **Menu contextual** - Click derecho en habitos con opciones rapidas
- [x] **Selector de frecuencia** - UI para configurar frecuencia de habitos
- [x] **Indicador visual Toca Hoy** - Badge y resaltado de habitos que tocan hoy
- [x] **Persistencia de frecuencia** - Frecuencia se guarda correctamente al crear/editar
- [x] **Indicador frecuencia en titulo** - Icono de reloj + numero junto al nombre del habito
- [x] **Inactividad basada en frecuencia** - El umbral de reseteo de racha depende de la frecuencia del habito
- [x] **Edicion inline mejorada** - Un solo click para editar tareas, input invisible seamless
- [x] **Prioridad en Tareas** - Context menu para asignar prioridad (Alta/Media/Baja) con indicador visual
- [x] **Bug Edicion Tareas** - Corregido comportamiento de preseleccion de texto al editar

### Estructura de Archivos (Actualizada)
```
App/React/
  types/
    dashboard.ts               # Tipos centralizados (Habito, Tarea, Frecuencia, Prioridad)
  utils/
    index.ts                   # Exportaciones de utilidades
    fecha.ts                   # Utilidades de fecha
    validadores.ts             # Validadores de datos
    migracionHabitos.ts        # Logica de migracion de habitos
    frecuenciaHabitos.ts       # Calculo de frecuencia y "toca hoy" (NUEVO)
  data/
    datosIniciales.ts          # Datos de demo para desarrollo
  hooks/
    useDashboard.ts            # Hook principal (refactorizado, ~476 lineas)
    useDeshacer.ts             # Sistema de undo
    useOrdenarHabitos.ts       # Ordenamiento de habitos
    useLocalStorage.ts         # Persistencia local
    useDebounce.ts             # Debounce para guardado
  components/shared/
    MenuContextual.tsx         # Menu contextual reutilizable (NUEVO)
  components/dashboard/
    SelectorFrecuencia.tsx     # Selector de frecuencia de habitos (NUEVO)
```

### Estructura CSS (Refactorizada)
```
App/React/styles/dashboard/
  index.css                    # Archivo principal (imports)
  variables.css                # Tokens de diseno (colores, espaciados)
  animaciones.css              # Keyframes reutilizables
  base.css                     # Contenedor principal y grid
  componentes/
    encabezado.css             # Header, navegacion, footer
    tabla.css                  # Tabla habitos, filas, indicadores
    tareas.css                 # Lista de tareas
    scratchpad.css             # Notas rapidas
    modal.css                  # Modales
    formulario.css             # Formularios de habitos
    toast.css                  # Toast deshacer
    ordenamiento.css           # Selector de orden
    menuContextual.css         # Menu contextual (NUEVO)
    frecuencia.css             # Selector de frecuencia (NUEVO)
  utilidades/
    estados.css                # Carga, spinners, skeletons
    acciones.css               # Botones exportar/importar
```

---

## Fase 1: Persistencia de Datos

**Objetivo:** Guardar y recuperar datos del usuario (hábitos, tareas, notas)

### 1.1 LocalStorage (MVP rápido)
- [x] Crear hook `useLocalStorage` genérico
- [x] Persistir hábitos en localStorage
- [x] Persistir tareas en localStorage
- [x] Persistir notas del scratchpad
- [x] Sincronizar estado al cargar página

**Archivos creados/modificados:**
```
App/React/hooks/useLocalStorage.ts    # Hook genérico (NUEVO)
App/React/hooks/useDashboard.ts       # Integrada persistencia
App/React/hooks/index.ts              # Exportaciones
App/React/styles/dashboard.css        # Estilos de carga
App/React/islands/DashboardIsland.tsx # UI de carga
```

### 1.2 API REST (WordPress)
- [ ] Crear endpoint `POST /wp-json/glory/v1/dashboard/save`
- [ ] Crear endpoint `GET /wp-json/glory/v1/dashboard/load`
- [ ] Guardar datos en `user_meta` de WordPress
- [ ] Crear hook `useDashboardApi` para comunicación
- [ ] Manejar estados de carga y error

**Archivos a crear:**
```
Glory/src/API/DashboardController.php    # Endpoints REST
App/React/hooks/useDashboardApi.ts       # Hook de API
App/React/services/dashboardService.ts   # Funciones fetch
```

---

## Fase 2: CRUD Completo de Hábitos

**Objetivo:** Crear, editar, eliminar y registrar hábitos

### 2.1 Crear Habito
- [x] Modal/formulario para nuevo habito
- [x] Campos: nombre, importancia, tags
- [x] Validacion de formulario
- [ ] Animacion de entrada al crear

**Componentes creados:**
```
App/React/components/dashboard/ModalHabito.tsx        # Modal reutilizable
App/React/components/dashboard/FormularioHabito.tsx   # Formulario con validacion
```

### 2.2 Registrar Completado
- [x] Boton "Completar hoy" en cada fila
- [x] Actualizar `diasInactividad` a 0
- [x] Incrementar `racha`
- [x] Toggle: desmarcar habito completado (revertir estado)
- [ ] Animacion visual de logro (opcional, mejora futura)
- [x] Historial de fechas completadas

### 2.3 Editar Habito
- [x] Click en fila abre modal de edicion
- [x] Guardar cambios
- [x] Cancelar sin guardar
- [ ] Panel de configuracion del habito

### 2.4 Eliminar Habito
- [x] Opcion de eliminar en modal
- [x] Confirmacion antes de eliminar
- [ ] Animacion de salida

### 2.5 Logica de Rachas
- [x] Calcular automaticamente dias de inactividad
- [x] Resetear racha si inactividad > umbral configurable (7 dias por defecto)
- [x] Notificacion visual si esta por perder racha
- [ ] Hacer umbral editable por el usuario en configuracion

### 2.7 Menu Contextual (COMPLETADO)
**Objetivo:** Acciones rapidas con click derecho en filas

- [x] Menu contextual al hacer click derecho en habito
- [x] Opciones: Editar, Eliminar, Marcar completado
- [x] Animacion de aparicion/desaparicion
- [x] Cerrar al hacer click fuera o presionar Escape
- [x] Posicionamiento inteligente (no se sale de pantalla)

**Componentes creados:**
```
App/React/components/shared/MenuContextual.tsx
App/React/styles/dashboard/componentes/menuContextual.css
```

### 2.8 Mejoras UI Tabla Habitos (NUEVO)
**Objetivo:** Mejor organizacion visual de la tabla

- [x] Columna separada para URGENCIA y RACHA (barra de progreso)
- [x] Columna ACCION solo contiene el boton toggle
- [x] Indicadores visuales mas claros

**Simplificacion planificada:**
- [ ] Reemplazar columna ID por checkbox (como tareas) para completar habito rapidamente
- [ ] Simplificar columna acciones a 1 solo boton que abre menu contextual
- [ ] Acciones (editar, eliminar, etc) disponibles solo via menu contextual (click derecho)

### 2.9 Frecuencia de Habitos (EN PROGRESO)
**Objetivo:** Cada habito puede tener su propia frecuencia de repeticion

**Tipos de frecuencia implementados:**
- [x] Diario (por defecto actual)
- [x] Cada X dias (ej: cada 3 dias)
- [x] Semanal (1 vez por semana)
- [x] Dias especificos (ej: Lunes, Miercoles, Viernes)
- [x] Mensual (X veces al mes)

**Impacto en logica:**
- [x] Añadir campo `frecuencia` al tipo `Habito`
- [x] Utilidades para calcular "toca hoy" segun frecuencia
- [x] Utilidades para calcular umbral de inactividad por frecuencia
- [x] Indicador visual de "toca hoy" (badge + resaltado de fila)
- [x] Selector de frecuencia en formulario de habito
- [x] **Persistencia de frecuencia al crear habito** - Corregido en useDashboard
- [x] **Persistencia de frecuencia al editar habito** - Corregido en useDashboard
- [x] **Indicador compacto en titulo** - Muestra icono reloj + numero (ej: Ejercicio (o3))
- [x] Calcular dias de inactividad basado en la frecuencia (integrado en migracionHabitos)
- [x] Barra de progreso proporcional a la frecuencia
- [ ] Adaptar racha a la frecuencia (racha semanal vs diaria)
- [ ] Historial debe considerar frecuencia para estadisticas

**Integrado en migracionHabitos.ts:**
- [x] `calcularUmbralInactividad()` ahora se usa para determinar reseteo de racha
- [x] El umbral depende del tipo de frecuencia (diario=7d, semanal=10d, cadaXDias=intervalo*1.5)

**Ejemplos:**
| Frecuencia  | Comportamiento Racha      | Urgencia                  |
| ----------- | ------------------------- | ------------------------- |
| Diario      | +1 cada dia completado    | Rojo si >2 dias sin hacer |
| Cada 3 dias | +1 cada ciclo completado  | Rojo si >4 dias sin hacer |
| Semanal     | +1 cada semana completada | Rojo si >9 dias sin hacer |

**Componentes creados/modificados:**
```
App/React/types/dashboard.ts                         # Tipos FrecuenciaHabito, TipoFrecuencia
App/React/utils/frecuenciaHabitos.ts                 # tocaHoy(), calcularUmbralInactividad(), etc.
App/React/components/dashboard/SelectorFrecuencia.tsx # Selector visual de frecuencia
App/React/components/dashboard/FormularioHabito.tsx  # Integrado SelectorFrecuencia
App/React/components/dashboard/TablaHabitos.tsx      # Indicador "toca hoy" + frecuencia
App/React/styles/dashboard/componentes/frecuencia.css # Estilos del selector
App/React/styles/dashboard/componentes/tabla.css     # Estilos badge "Toca Hoy"
```

### 2.10 Barra de Progreso Configurable (EN PROGRESO)
**Objetivo:** Control sobre que representa la barra de progreso de urgencia

**Estado actual:**
- [x] Barra proporcional a la frecuencia del habito (usa `calcularUmbralInactividad`)
- [x] Umbral de urgencia automatico segun frecuencia
- La barra muestra `diasInactividad / umbralFrecuencia * 100%`

**Mejoras planificadas:**
- [ ] Umbral de urgencia configurable manualmente por habito
- [ ] Modos de visualizacion:
  - `urgencia`: Cuanto falta para perder racha (actual)
  - `progreso`: Progreso hacia meta (ej: 3/5 dias esta semana)
  - `racha`: Visualizacion de racha actual vs record
- [ ] Colores graduales (verde -> amarillo -> rojo)
- [ ] Tooltip con informacion detallada

### 2.6 Sistema de Deshacer (Undo)
**Objetivo:** Permitir revertir cualquier accion con feedback visual

- [x] Toast/notificacion en esquina inferior con opcion "Deshacer"
- [x] Tiempo limite de 5 segundos para deshacer
- [x] Acciones reversibles:
  - [x] Completar/desmarcar habito
  - [x] Crear habito
  - [x] Eliminar habito
  - [x] Editar habito
  - [x] Completar/descompletar tarea
  - [x] Eliminar tarea
  - [x] Crear tarea
  - [x] Editar tarea
- [x] Animacion de entrada/salida del toast
- [x] Barra de progreso visual del tiempo restante

**Componentes creados:**
```
App/React/components/shared/ToastDeshacer.tsx   # Toast con boton deshacer
App/React/hooks/useDeshacer.ts                  # Hook para manejar cola de acciones
```

---

## Fase 3: CRUD Completo de Tareas

**Objetivo:** Gestion completa de tareas con UX fluida y minimalista

### 3.1 Crear Tarea (COMPLETADO)
**Comportamiento implementado:**

- [x] Input siempre visible (sin boton "Nueva tarea" previo)
- [x] Placeholder "Nueva tarea..." indica accion
- [x] Enter guarda la tarea
- [x] Escape limpia el input y quita foco
- [x] Guardado automatico al perder foco (blur)
- [x] Mantiene foco despues de crear para agregar multiples tareas
- [x] Boton de confirmar solo visible cuando hay texto

### 3.2 Editar Tarea (COMPLETADO)
**Comportamiento implementado:**

- [x] Un solo click activa modo edicion
- [x] El texto se vuelve input con estilos similares
- [x] Guardado automatico:
  - Al presionar Enter
  - Al perder foco (blur)
- [x] Escape cancela edicion y restaura texto original
- [x] Botones ocultos - solo aparecen en hover
- [ ] Transicion mas suave (refinamiento pendiente)

### 3.3 Reordenar Tareas (NUEVO)
**Objetivo:** Orden manual persistente con drag & drop

- [x] Drag & drop para reordenar tareas
- [x] Indicador visual de destino al arrastrar
- [x] Orden se persiste en localStorage
- [x] Tareas completadas se ordenan aparte (al final)
- [x] Animacion suave al reordenar

**Implementacion tecnica:**
- Usar `@dnd-kit/core` o implementacion nativa HTML5 drag
- Guardar orden como array de IDs o campo `orden: number`

### 3.4 Subtareas (NUEVO)
**Objetivo:** Anidacion simple de tareas relacionadas

**Comportamiento:**
- [ ] Tab en tarea nueva la convierte en subtarea de la anterior
- [ ] Subtareas solo pueden ser hijas de tareas (no de otras subtareas)
- [ ] Indentacion visual para subtareas
- [ ] Shift+Tab saca la subtarea al nivel principal
- [ ] Completar tarea padre NO completa subtareas automaticamente
- [ ] Contador de subtareas completadas visible

**Ejemplo visual:**
```
[ ] Tarea principal
    [ ] Subtarea 1
    [ ] Subtarea 2
[ ] Otra tarea principal
```

**Estructura de datos:**
```typescript
interface Tarea {
    id: number;
    texto: string;
    completado: boolean;
    orden: number;
    parentId?: number; // Si tiene parentId es subtarea
}
```

### 3.5 Completar/Descompletar
- [x] Toggle estado con soporte de deshacer
- [x] Mover completadas al final (automatico)
- [ ] Estadisticas de completadas hoy

### 3.6 Eliminar Tarea
- [x] Boton para eliminar (hover reveal)
- [x] Deshacer eliminacion (5 segundos)

### 3.7 Tareas Avanzadas (FUTURO)
**Nota:** Funcionalidades para fases posteriores

- [x] Prioridad (Alta/Media/Baja) con indicador visual
- [ ] Dias de inactividad por tarea
- [ ] Fecha limite con indicador de urgencia
- [ ] Notas/descripcion expandible


---

## Fase 4: Scratchpad Avanzado

**Objetivo:** Notas rápidas con formato markdown

### 4.1 Guardado Automático
- [x] Debounce de 500ms antes de guardar
- [x] Indicador visual "Guardando..." / "Guardado"

**Archivos creados/modificados:**
```
App/React/hooks/useDebounce.ts                  # Hook de debounce (NUEVO)
App/React/components/dashboard/Scratchpad.tsx   # Actualizado con indicador
App/React/styles/dashboard.css                  # Estilos del indicador
```

### 4.2 Preview Markdown (opcional)
- [ ] Toggle entre edición y preview
- [ ] Renderizar markdown básico (headers, listas, quotes)

### 4.3 Múltiples Notas
- [ ] Tabs o lista de notas
- [ ] Crear nueva nota
- [ ] Eliminar nota

---

## Fase 5: Ordenamiento y Filtros

**Objetivo:** Control sobre la visualización de datos

### 5.1 Ordenar Habitos
**Modos de ordenamiento:**

**Basicos:**
- [x] Por importancia (default)
- [x] Por inactividad (mas urgentes primero)
- [x] Por racha (mas largas primero)
- [x] Por nombre alfabetico
- [ ] Drag & drop para orden manual

**Inteligentes (PLANIFICADO):**
- [ ] "Toca hoy primero" - Habitos que deben hacerse hoy segun frecuencia
- [x] "Urgencia ponderada" - Combina importancia + inactividad
- [ ] "Proximos a perder racha" - Prioriza rachas en peligro
- [ ] "Menos frecuentes primero" - Para no olvidar habitos semanales

**UI de ordenamiento:**
- [x] Dropdown para cambiar modo de orden
- [x] Indicador visual del orden activo (descripcion en subtitulo)
- [ ] Guardar preferencia de orden en configuracion

**Componentes creados:**
```
App/React/components/dashboard/SelectorOrden.tsx
App/React/hooks/useOrdenarHabitos.ts
App/React/styles/dashboard/componentes/ordenamiento.css
```

### 5.2 Filtrar Hábitos
- [ ] Por tag
- [ ] Por importancia
- [ ] Solo urgentes (inactividad > 3)
- [ ] Buscar por nombre

### 5.3 Vistas de Tareas
- [ ] Todas
- [ ] Pendientes
- [ ] Completadas hoy
- [ ] Con fecha límite

---

## Fase 6: Estadísticas y Gráficos

**Objetivo:** Visualizar progreso y tendencias

### 6.1 Panel de Estadísticas
- [ ] Hábitos completados esta semana
- [ ] Racha más larga activa
- [ ] Tareas completadas hoy/semana
- [ ] Gráfico de consistencia (heatmap estilo GitHub)

### 6.2 Historial
- [ ] Calendario con días completados
- [ ] Filtrar por hábito específico
- [ ] Exportar datos

**Componentes a crear:**
```
App/React/components/dashboard/PanelEstadisticas.tsx
App/React/components/dashboard/GraficoConsistencia.tsx
App/React/components/dashboard/CalendarioHistorial.tsx
```

---

## Fase 7: Notificaciones y Recordatorios

**Objetivo:** Alertas para mantener consistencia

### 7.1 Notificaciones en UI
- [ ] Badge en hábitos urgentes
- [ ] Toast al completar hábito
- [ ] Alerta si racha está en peligro

### 7.2 Notificaciones del Navegador (opcional)
- [ ] Pedir permiso al usuario
- [ ] Recordatorio diario configurable
- [ ] Notificar si no se ha registrado el día

---

## Fase 8: Configuración de Usuario

**Objetivo:** Personalización del dashboard

### 8.1 Preferencias
- [ ] Umbral de días para "urgente"
- [ ] Orden por defecto
- [ ] Tema claro/oscuro (extensión del actual)
- [ ] Densidad de información

### 8.2 Importar/Exportar
- [x] Exportar datos a JSON
- [x] Importar desde JSON
- [ ] Backup automático

---

## Fase 9: Responsive y PWA

**Objetivo:** Funcionar en móviles como app nativa

### 9.1 Responsive
- [ ] Layout adaptativo para móvil
- [ ] Menú hamburguesa para secciones
- [ ] Touch gestures (swipe para completar)

### 9.2 PWA
- [ ] Manifest.json
- [ ] Service Worker para offline
- [ ] Instalable en móvil
- [ ] Sincronización cuando vuelve online

---

## Prioridades Sugeridas

### Sprint 1 (Semana 1-2)
1. **Fase 1.1** - LocalStorage (esencial para uso real)
2. **Fase 2.2** - Registrar completado (funcionalidad core)
3. **Fase 4.1** - Guardado automático scratchpad

### Sprint 2 (Semana 3-4)
1. **Fase 2.1** - Crear hábito
2. **Fase 3.1-3.3** - CRUD básico tareas
3. **Fase 5.1** - Ordenar hábitos

### Sprint 3 (Semana 5-6)
1. **Fase 1.2** - API REST (persistencia seria)
2. **Fase 2.3-2.5** - CRUD completo hábitos
3. **Fase 3.4-3.5** - Proyectos y filtros

### Sprint 4+ (Posteriores)
- Estadísticas y gráficos
- Notificaciones
- Configuración avanzada
- PWA

---

## Notas Técnicas

### Dependencias Sugeridas
```json
{
  "date-fns": "^3.x",         // Manejo de fechas
  "react-hot-toast": "^2.x",  // Notificaciones toast
  "framer-motion": "^11.x",   // Animaciones (opcional)
  "recharts": "^2.x"          // Gráficos (opcional)
}
```

### Estructura de Datos Propuesta para API

```typescript
interface DashboardUserData {
  version: string;
  ultimaActualizacion: string;
  habitos: Habito[];
  tareas: Tarea[];
  notas: Nota[];
  configuracion: UserConfig;
  historial: RegistroHistorial[];
}

interface RegistroHistorial {
  habitoId: number;
  fecha: string;        // ISO date
  completado: boolean;
}

interface Nota {
  id: number;
  titulo: string;
  contenido: string;
  ultimaEdicion: string;
}
```

---

## Contacto y Colaboracion

Cualquier duda sobre la implementacion, revisar:
- `Glory/assets/react/Docs/react-glory.md` - Documentacion del sistema
- `App/React/components/dashboard/` - Componentes existentes
- `App/React/styles/dashboard/` - Sistema de diseno modular (ver index.css)

